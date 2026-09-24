import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'standardwebhooks'
import {
  deactivateSubscription,
  paywallEnabled,
  upsertSubscription,
} from '@/lib/auth'

export async function POST(req: NextRequest) {
  if (!paywallEnabled() || !process.env.DODO_WEBHOOK_KEY) {
    return NextResponse.json({ received: true })
  }

  const raw = await req.text()
  const headers: Record<string, string> = {}
  req.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value
  })

  let event: any
  try {
    event = new Webhook(process.env.DODO_WEBHOOK_KEY).verify(raw, headers)
  } catch {
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 })
  }

  const data = event?.data || {}
  const type: string = event?.type || data?.event_type || ''
  const subId = String(data.subscription_id || '')

  if (subId) {
    const meta = data.metadata || {}
    const deviceId = String(
      meta.device_id || data.customer?.metadata?.device_id || ''
    ).trim()
    const email = String(data.customer?.email || '')
    const periodEnd = data.next_billing_date || null
    const status = String(data.status || '')

    if (
      type === 'payment.succeeded' ||
      type === 'subscription.active' ||
      type === 'subscription.renewed' ||
      type === 'subscription.unpaused'
    ) {
      await upsertSubscription({
        subId,
        deviceId,
        status: status || 'active',
        active: true,
        periodEnd,
        email,
      })
    } else if (
      type === 'subscription.plan_changed' &&
      status &&
      !['cancelled', 'expired', 'paused', 'on_hold'].includes(status)
    ) {
      await upsertSubscription({
        subId,
        status,
        active: true,
        periodEnd,
        email,
      })
    } else if (
      type === 'subscription.cancelled' ||
      type === 'subscription.expired' ||
      type === 'subscription.paused' ||
      type === 'subscription.on_hold' ||
      type === 'subscription.failed'
    ) {
      await deactivateSubscription(
        subId,
        status || type.replace('subscription.', '')
      )
    }
  }

  return NextResponse.json({ received: true })
}