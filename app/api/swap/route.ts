import { NextRequest, NextResponse } from 'next/server'
import { SYSTEM_PROMPT } from '@/lib/ai'
import { DEFAULT_MODEL, hfChat } from '@/lib/hf'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const token = String(body.token || process.env.HF_TOKEN || '').trim()
  const model = String(body.model || DEFAULT_MODEL).trim() || DEFAULT_MODEL
  const message = String(body.message || '').trim()
  const vibe = String(body.vibe || 'Smooth & confident').trim()
  const language = String(body.language || 'auto')

  if (!message) {
    return NextResponse.json({ error: 'Message is empty.' }, { status: 400 })
  }
  if (!token) {
    return NextResponse.json(
      { error: 'No Hugging Face token configured.' },
      { status: 401 }
    )
  }

  const langLine = !language || language === 'auto' ? 'the same language she wrote in' : language
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Her message:
"""
${message}
"""

Reply language: ${langLine}
Vibe you must use: ${vibe}

Write exactly one reply with that vibe. Reply with ONLY the reply text — no quotes, no labels, no explanation.`,
    },
  ]

  try {
    const { text, model: usedModel } = await hfChat(token, model, messages, 3)
    let reply = text.trim()
    reply = reply.replace(/^("|'|«|“)|("|'|»|”)$/g, '').trim()
    if (!reply) {
      return NextResponse.json({ error: 'Model returned no text.' }, { status: 502 })
    }
    return NextResponse.json({ model: usedModel, reply })
  } catch (e: any) {
    const status = e?.status && e.status >= 400 && e.status <= 599 ? e.status : 500
    return NextResponse.json(
      { error: e?.message || 'Something went wrong.' },
      { status }
    )
  }
}