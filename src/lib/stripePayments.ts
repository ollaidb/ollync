import { supabase } from './supabaseClient'

export interface StartCheckoutPayload {
  productCode: string
  quantity?: number
  metadata?: Record<string, unknown>
}

export interface StartCheckoutResult {
  checkout_url: string
  session_id: string
  order_id: string
}

export async function startStripeCheckout(payload: StartCheckoutPayload): Promise<StartCheckoutResult> {
  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: {
      product_code: payload.productCode,
      quantity: payload.quantity ?? 1,
      metadata: payload.metadata ?? {}
    }
  })

  if (error) {
    throw new Error(error.message || 'Failed to create checkout session')
  }

  if (!data?.checkout_url) {
    throw new Error('Missing checkout URL from server')
  }

  return data as StartCheckoutResult
}

export async function redirectToStripeCheckout(payload: StartCheckoutPayload): Promise<void> {
  const result = await startStripeCheckout(payload)
  window.location.href = result.checkout_url
}
