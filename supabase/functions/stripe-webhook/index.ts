// Supabase Edge Function: stripe-webhook
// Required secrets:
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY
// - STRIPE_WEBHOOK_SECRET

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const textResponse = (body: string, status = 200) =>
  new Response(body, {
    status,
    headers: {
      'Content-Type': 'text/plain',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    }
  })

const hex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, '0')).join('')

const secureEqual = (a: string, b: string) => {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

const verifyStripeSignature = async (rawBody: string, signature: string, webhookSecret: string) => {
  const parts = signature.split(',').map((s) => s.trim())
  const ts = parts.find((p) => p.startsWith('t='))?.slice(2)
  const v1 = parts.find((p) => p.startsWith('v1='))?.slice(3)
  if (!ts || !v1) return false

  const signedPayload = `${ts}.${rawBody}`
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(webhookSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload))
  const computed = hex(digest)

  return secureEqual(computed, v1)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return textResponse('ok')
  if (req.method !== 'POST') return textResponse('Method not allowed', 405)

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

    if (!supabaseUrl || !serviceRoleKey || !webhookSecret) {
      return textResponse('Missing server configuration', 500)
    }

    const signature = req.headers.get('stripe-signature')
    if (!signature) return textResponse('Missing stripe-signature header', 400)

    const rawBody = await req.text()
    const isValid = await verifyStripeSignature(rawBody, signature, webhookSecret)
    if (!isValid) return textResponse('Invalid signature', 400)

    const event = JSON.parse(rawBody) as {
      id: string
      type: string
      data?: { object?: Record<string, unknown> }
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const object = event.data?.object || {}
    const metadata = (object.metadata as Record<string, string> | undefined) || {}
    const orderId = metadata.order_id || null

    // idempotency: ignore if already logged
    const { data: existingEvent } = await supabase
      .from('payment_events')
      .select('id')
      .eq('stripe_event_id', event.id)
      .maybeSingle()

    if (existingEvent) {
      return textResponse('Event already processed', 200)
    }

    await supabase.from('payment_events').insert({
      stripe_event_id: event.id,
      event_type: event.type,
      order_id: orderId,
      payload: event,
      processed: false
    })

    if (event.type === 'checkout.session.completed' && orderId) {
      const sessionId = String(object.id || '')
      const paymentIntentId = String(object.payment_intent || '')
      const productCode = String(metadata.product_code || '')
      const postId = String(metadata.post_id || '')

      await supabase
        .from('payment_orders')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          stripe_checkout_session_id: sessionId || null,
          stripe_payment_intent_id: paymentIntentId || null
        })
        .eq('id', orderId)

      if (postId && productCode) {
        const now = new Date()
        let boostedUntil: string | null = null
        let sponsoredUntil: string | null = null

        if (productCode === 'BOOST_24H') {
          boostedUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
        } else if (productCode === 'BOOST_7D') {
          boostedUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
        } else if (productCode === 'BOOST_30D') {
          boostedUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
        } else if (productCode.startsWith('SPONSOR_')) {
          sponsoredUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }

        if (boostedUntil || sponsoredUntil) {
          await supabase
            .from('posts')
            .update({
              boosted_until: boostedUntil,
              sponsored_until: sponsoredUntil,
              promotion_updated_at: new Date().toISOString()
            })
            .eq('id', postId)
        }
      }
    }

    if (event.type === 'checkout.session.expired' && orderId) {
      await supabase
        .from('payment_orders')
        .update({
          status: 'expired',
          cancelled_at: new Date().toISOString()
        })
        .eq('id', orderId)
    }

    await supabase
      .from('payment_events')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('stripe_event_id', event.id)

    return textResponse('ok', 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return textResponse(message, 500)
  }
})
