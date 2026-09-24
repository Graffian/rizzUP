import { NextRequest, NextResponse } from 'next/server'
import {
  TRIAL_LIMIT,
  clientIp,
  getAccessInfo,
  paywallEnabled,
} from '@/lib/auth'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const deviceId = String(body.deviceId || '').trim()

  if (!paywallEnabled()) {
    return NextResponse.json({
      paywall: false,
      canUse: true,
      active: true,
      trialUsed: 0,
      trialLimit: TRIAL_LIMIT,
    })
  }

  if (!deviceId) {
    return NextResponse.json({
      paywall: true,
      canUse: true,
      active: true,
      trialUsed: 0,
      trialLimit: TRIAL_LIMIT,
    })
  }

  const { active, trialUsed } = await getAccessInfo(deviceId, clientIp(req))
  return NextResponse.json({
    paywall: true,
    active,
    trialUsed,
    trialLimit: TRIAL_LIMIT,
    canUse: active || trialUsed < TRIAL_LIMIT,
  })
}