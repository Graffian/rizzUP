import { NextRequest, NextResponse } from 'next/server'
import { clientIp, paywallEnabled } from '@/lib/auth'
import { createCheckoutSession } from '@/lib/dodo'

export async function POST(req: NextRequest) {
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  if (!paywallEnabled()) {
    return NextResponse.json(
      { error: 'Payments are not configured yet.' },
      { status: 503 }
    )
  }

  const deviceId = String(body.deviceId || '').trim()
  if (!deviceId) {
    return NextResponse.json({ error: 'Missing device id.' }, { status: 400 })
  }

  const origin =
    req.headers.get('origin') ||
    req.headers.get('referer') ||
    req.headers.get('host') ||
    ''

  try {
    const { checkoutUrl } = await createCheckoutSession(
      deviceId,
      clientIp(req),
      origin.replace(/\/+$/, '')
    )
    return NextResponse.json({ checkoutUrl })
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'Could not start checkout. Try again.' },
      { status: 500 }
    )
  }
}