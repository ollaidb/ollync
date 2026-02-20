// Supabase Edge Function: create-checkout-session
// Required secrets:
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY
// - STRIPE_SECRET_KEY
// - APP_BASE_URL (e.g. https://ollync.app)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    }
  })

const stripeApi = async (path: string, method: string, body: URLSearchParams, secretKey: string) => {
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  })

  const payload = await response.json()
  if (!response.ok) {
    const message = payload?.error?.message || 'Stripe API error'
    throw new Error(message)
  }

  return payload
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return json({ ok: true })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    const appBaseUrl = Deno.env.get('APP_BASE_URL')

    if (!supabaseUrl || !serviceRoleKey || !stripeSecretKey || !appBaseUrl) {
      return json({ error: 'Missing server configuration' }, 500)
    }

    const authHeader = req.headers.get('Authorization') || ''
    const jwt = authHeader.replace('Bearer ', '').trim()
    if (!jwt) return json({ error: 'Unauthorized' }, 401)

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const { data: authData, error: authError } = await supabase.auth.getUser(jwt)
    if (authError || !authData?.user) return json({ error: 'Unauthorized' }, 401)

    const user = authData.user
    const { product_code, quantity = 1, metadata = {} } = await req.json() as {
      product_code?: string
      quantity?: number
      metadata?: Record<string, unknown>
    }

    if (!product_code) return json({ error: 'product_code is required' }, 400)

    const safeQty = Math.max(1, Math.min(99, Number(quantity) || 1))

    const { data: product, error: productError } = await supabase
      .from('payment_products')
      .select('*')
      .eq('code', product_code)
      .eq('active', true)
      .single()

    if (productError || !product) return json({ error: 'Invalid product' }, 400)

    let stripeCustomerId: string | null = null

    const { data: existingCustomer } = await supabase
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingCustomer?.stripe_customer_id) {
      stripeCustomerId = existingCustomer.stripe_customer_id
    } else {
      const customerBody = new URLSearchParams()
      if (user.email) customerBody.set('email', user.email)
      customerBody.set('metadata[user_id]', user.id)

      const customer = await stripeApi('customers', 'POST', customerBody, stripeSecretKey)
      stripeCustomerId = customer.id

      await supabase.from('stripe_customers').insert({
        user_id: user.id,
        stripe_customer_id: stripeCustomerId,
        email: user.email || null
      })
    }

    const orderAmount = Number(product.amount_cents) * safeQty

    const { data: order, error: orderError } = await supabase
      .from('payment_orders')
      .insert({
        user_id: user.id,
        product_id: product.id,
        product_code: product.code,
        amount_cents: orderAmount,
        currency: product.currency || 'eur',
        quantity: safeQty,
        status: 'pending',
        stripe_customer_id: stripeCustomerId,
        description: product.name,
        metadata
      })
      .select('id')
      .single()

    if (orderError || !order) {
      return json({ error: 'Failed to create order' }, 500)
    }

    const body = new URLSearchParams()
    body.set('mode', 'payment')
    body.set('customer', stripeCustomerId as string)
    body.set('success_url', `${appBaseUrl}/profile/wallet?payment=success&order_id=${order.id}`)
    body.set('cancel_url', `${appBaseUrl}/profile/wallet?payment=cancel&order_id=${order.id}`)
    body.set('metadata[order_id]', order.id)
    body.set('metadata[user_id]', user.id)
    body.set('metadata[product_code]', product.code)

    if (product.stripe_price_id) {
      body.set('line_items[0][price]', product.stripe_price_id)
      body.set('line_items[0][quantity]', String(safeQty))
    } else {
      body.set('line_items[0][price_data][currency]', product.currency || 'eur')
      body.set('line_items[0][price_data][product_data][name]', product.name)
      if (product.description) {
        body.set('line_items[0][price_data][product_data][description]', product.description)
      }
      body.set('line_items[0][price_data][unit_amount]', String(product.amount_cents))
      body.set('line_items[0][quantity]', String(safeQty))
    }

    const session = await stripeApi('checkout/sessions', 'POST', body, stripeSecretKey)

    const { error: updateError } = await supabase
      .from('payment_orders')
      .update({ stripe_checkout_session_id: session.id })
      .eq('id', order.id)

    if (updateError) {
      return json({ error: 'Checkout session created but order update failed' }, 500)
    }

    return json({
      checkout_url: session.url,
      session_id: session.id,
      order_id: order.id
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return json({ error: message }, 500)
  }
})
