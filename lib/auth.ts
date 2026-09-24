import { NextRequest, NextResponse } from 'next/server'
import { supabase } from './supabase'

export const TRIAL_LIMIT = 3

export type AccessInfo = { active: boolean; trialUsed: number }

export function paywallEnabled(): boolean {
  return !!supabase
}

export function clientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return req.headers.get('x-real-ip') || ''
}

export async function getAccessInfo(
  deviceId: string,
  ip: string
): Promise<AccessInfo> {
  if (!supabase) return { active: true, trialUsed: 0 }
  try {
    const { data } = await supabase.rpc('get_access', {
      p_device_id: deviceId,
      p_ip: ip || null,
    })
    const row = Array.isArray(data) ? data?.[0] : data
    return {
      active: row?.active === true,
      trialUsed: Number(row?.trial_used || 0),
    }
  } catch (e) {
    console.error('get_access failed', e)
    return { active: true, trialUsed: 0 }
  }
}

export async function claimTrial(deviceId: string, ip: string): Promise<number> {
  if (!supabase) return 0
  try {
    const { data } = await supabase.rpc('claim_trial', {
      p_device_id: deviceId,
      p_ip: ip || null,
    })
    return Number(data ?? 0)
  } catch (e) {
    console.error('claim_trial failed', e)
    return 0
  }
}

export type SubscriptionPatch = {
  subId: string
  deviceId?: string
  status?: string
  active?: boolean
  periodEnd?: string | null
  email?: string
}

export async function upsertSubscription(patch: SubscriptionPatch): Promise<void> {
  if (!supabase) return
  try {
    await supabase.rpc('upsert_subscription', {
      p_sub_id: patch.subId,
      p_device_id: patch.deviceId || '',
      p_status: patch.status || 'active',
      p_active: patch.active ?? true,
      p_period_end: patch.periodEnd || null,
      p_email: patch.email || '',
    })
  } catch (e) {
    console.error('upsert_subscription failed', e)
  }
}

export async function deactivateSubscription(
  subId: string,
  status: string
): Promise<void> {
  if (!supabase) return
  try {
    await supabase.rpc('deactivate_subscription', {
      p_sub_id: subId,
      p_status: status,
    })
  } catch (e) {
    console.error('deactivate_subscription failed', e)
  }
}

export function missingDeviceResponse(): NextResponse {
  return NextResponse.json(
    { error: 'Missing device id — refresh the page.' },
    { status: 400 }
  )
}

export function blockedResponse(): NextResponse {
  return NextResponse.json(
    {
      error:
        'Free tries used up. Unlock unlimited replies with a monthly plan.',
      paywall: true,
      remaining: 0,
      trialLimit: TRIAL_LIMIT,
    },
    { status: 402 }
  )
}