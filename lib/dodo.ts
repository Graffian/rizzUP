const DODO_API_BASE = process.env.DODO_API_BASE || 'https://test.dodopayments.com'

export type CheckoutResult = { checkoutUrl: string; sessionId: string }

export async function createCheckoutSession(
  deviceId: string,
  ip: string,
  returnUrl: string
): Promise<CheckoutResult> {
  const apiKey = process.env.DODO_PAYMENTS_API_KEY
  const productId = process.env.DODO_SUBSCRIPTION_PRODUCT_ID
  if (!apiKey || !productId) {
    throw new Error('Dodo payments are not configured yet.')
  }

  const res = await fetch(`${DODO_API_BASE}/checkouts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      product_cart: [{ product_id: productId, quantity: 1 }],
      metadata: { device_id: deviceId, ip: ip || '' },
      ...(returnUrl ? { return_url: returnUrl, cancel_url: returnUrl } : {}),
    }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data?.detail || 'Could not start checkout.')
  }
  if (!data?.checkout_url) {
    throw new Error('Checkout did not return a URL. Try again.')
  }
  return { checkoutUrl: data.checkout_url, sessionId: data.session_id }
}