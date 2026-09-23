import { NextRequest, NextResponse } from 'next/server'
import { VIBES, buildFixMessages, buildMessages, looksLikeHinglish, parseReplies } from '@/lib/ai'
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
  const language = String(body.language || 'auto')
  let count = parseInt(body.count, 10) || 3
  count = Math.min(Math.max(count, 1), 5)

  if (!message) {
    return NextResponse.json({ error: 'Message is empty.' }, { status: 400 })
  }
  if (!token) {
    return NextResponse.json(
      { error: 'No Hugging Face token. Add a free one at huggingface.co/settings/tokens and save it in Settings.' },
      { status: 401 }
    )
  }

  const vibes = VIBES.slice(0, count)
  const hinglishMode = language === 'Hinglish' || looksLikeHinglish(message)
  try {
    const { text, model: usedModel } = await hfChat(
      token,
      model,
      buildMessages(message, language, vibes)
    )
    let replies = parseReplies(text, vibes)

    if (hinglishMode && replies.length) {
      replies = replies.filter((r) => looksLikeHinglish(r.reply))
      for (let round = 0; round < 2 && replies.length < vibes.length; round++) {
        const missing = vibes.filter((v) => !replies.some((r) => r.vibe === v))
        try {
          const fixed = await hfChat(token, model, buildFixMessages(message, 'Hinglish', missing))
          const fixedReplies = parseReplies(fixed.text, missing).filter((r) =>
            looksLikeHinglish(r.reply)
          )
          replies = vibes
            .map((v) => replies.find((r) => r.vibe === v) || fixedReplies.find((r) => r.vibe === v))
            .filter((r): r is { vibe: string; reply: string } => !!r)
        } catch {
          break
        }
      }
    }

    if (!replies.length) {
      return NextResponse.json(
        { error: 'Could not parse model output. Try again.' },
        { status: 502 }
      )
    }
    return NextResponse.json({ model: usedModel, replies })
  } catch (e: any) {
    const status = e?.status && e.status >= 400 && e.status <= 599 ? e.status : 500
    return NextResponse.json(
      { error: e?.message || 'Something went wrong.' },
      { status }
    )
  }
}