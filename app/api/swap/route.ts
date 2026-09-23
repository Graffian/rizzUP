import { NextRequest, NextResponse } from 'next/server'
import { SYSTEM_PROMPT, languageLabel, looksLikeHinglish } from '@/lib/ai'
import { defaultModel, hfChat, readEnv } from '@/lib/hf'

export async function POST(req: NextRequest) {
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const token = String(body.token || readEnv('HF_TOKEN') || '').trim()
  const dModel = defaultModel()
  const model = String(body.model || dModel).trim() || dModel
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

  const hinglishMode = language === 'Hinglish' || looksLikeHinglish(message)
  const langLine = !language || language === 'auto' ? 'the same language she wrote in' : languageLabel(language)
  const buildSwapPrompt = (extra = '') =>
    `The message:
"""
${message}
"""

Reply language: ${langLine}
Vibe you must use: ${vibe}
${extra}
Write exactly one reply with that vibe. Reply with ONLY the reply text — no quotes, no labels, no explanation.`

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: buildSwapPrompt() },
  ]

  try {
    const { text, model: usedModel } = await hfChat(token, model, messages, 3)
    let reply = text.trim()
    reply = reply.replace(/^("|'|«|“)|("|'|»|”)$/g, '').trim()
    if (!reply) {
      return NextResponse.json({ error: 'Model returned no text.' }, { status: 502 })
    }

    if (hinglishMode && !looksLikeHinglish(reply)) {
      try {
        const retry = await hfChat(
          token,
          model,
          [
            { role: 'system', content: SYSTEM_PROMPT },
            {
              role: 'user',
              content: buildSwapPrompt(
                'The previous reply was in the wrong language. Rewrite it so the ENTIRE reply is in Hinglish (Roman/Latin script, natural Hindi-English mix — never Devanagari).'
              ),
            },
          ],
          3
        )
        const fixed = retry.text.trim().replace(/^("|'|«|“)|("|'|»|”)$/g, '').trim()
        if (fixed && looksLikeHinglish(fixed)) reply = fixed
      } catch {
        // keep original reply if the retry fails
      }
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