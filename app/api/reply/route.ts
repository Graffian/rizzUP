import { NextRequest, NextResponse } from 'next/server'
import { VIBES, buildFixMessages, buildMessages, looksLikeHinglish, parseReplies } from '@/lib/ai'
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
  const englishMode =
    (language === 'auto' || language === 'English') &&
    !hinglishMode &&
    !/\p{Script=Devanagari}/u.test(message)
  try {
    const { text, model: usedModel } = await hfChat(
      token,
      model,
      buildMessages(message, language, vibes)
    )
    let replies = parseReplies(text, vibes)

    const backfill = async (
      lang: string,
      keep: (r: { vibe: string; reply: string }) => boolean
    ) => {
      const accepted = replies.filter(keep)
      for (let round = 0; round < 2 && accepted.length < vibes.length; round++) {
        const missing = vibes.filter((v) => !accepted.some((r) => r.vibe === v))
        if (!missing.length) break
        try {
          const fixed = await hfChat(token, model, buildFixMessages(message, lang, missing))
          const fixedReplies = parseReplies(fixed.text, missing).filter(keep)
          for (const fr of fixedReplies) {
            if (accepted.length < vibes.length && !accepted.some((r) => r.vibe === fr.vibe)) {
              accepted.push(fr)
            }
          }
        } catch {
          break
        }
      }
      return vibes
        .map((v) => accepted.find((r) => r.vibe === v))
        .filter((r): r is { vibe: string; reply: string } => !!r)
    }

    if (hinglishMode && replies.length) {
      replies = await backfill('Hinglish', (r) => looksLikeHinglish(r.reply))
    } else if (englishMode && replies.length) {
      replies = await backfill('English', (r) => !looksLikeHinglish(r.reply))
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