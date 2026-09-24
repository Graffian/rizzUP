import { NextRequest, NextResponse } from 'next/server'
import {
  SYSTEM_PROMPT,
  buildContextSwapUserPrompt,
  languageLabel,
  looksLikeHinglish,
  scenarioBlock,
  transcriptThemLines,
} from '@/lib/ai'
import { defaultModel, hfChat, readEnv, transcribeImage } from '@/lib/hf'

const MAX_IMAGE_CHARS = 3_000_000

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
  const image = String(body.image || '').trim()
  const scenario = String(body.scenario || '').trim()
  const vibe = String(body.vibe || 'Smooth & confident').trim()
  const language = String(body.language || 'auto')

  if (!message && !image) {
    return NextResponse.json(
      { error: 'Paste a message or attach a screenshot.' },
      { status: 400 }
    )
  }
  if (image && image.length > MAX_IMAGE_CHARS) {
    return NextResponse.json(
      { error: 'Screenshot is too large. Try a smaller image.' },
      { status: 413 }
    )
  }
  if (!token) {
    return NextResponse.json(
      { error: 'No Hugging Face token configured.' },
      { status: 401 }
    )
  }

  let buildSwapPrompt: (extra?: string) => string
  let hinglishMode: boolean
  let englishMode: boolean

  if (image) {
    let transcript: string
    try {
      transcript = await transcribeImage(token, image)
    } catch (e: any) {
      return NextResponse.json(
        { error: e?.message || 'Could not read the screenshot.' },
        { status: e?.status && e.status >= 400 && e.status <= 599 ? e.status : 500 }
      )
    }
    const base = buildContextSwapUserPrompt(transcript, message, language, vibe, scenario)
    buildSwapPrompt = (extra = '') => (extra ? `${base}\n\n${extra}` : base)
    const themText = [message, transcriptThemLines(transcript)].filter(Boolean).join('\n')
    hinglishMode = language === 'Hinglish' || looksLikeHinglish(themText)
    englishMode =
      (language === 'auto' || language === 'English') &&
      !hinglishMode &&
      !/\p{Script=Devanagari}/u.test(themText)
  } else {
    const langLine =
      !language || language === 'auto' ? 'the same language she wrote in' : languageLabel(language)
    buildSwapPrompt = (extra = '') =>
      `The message:
"""
${message}
"""
${scenarioBlock(scenario)}

Reply language: ${langLine}
Vibe you must use: ${vibe}
${extra}
Write exactly one reply with that vibe. Reply with ONLY the reply text — no quotes, no labels, no explanation.`
    hinglishMode = language === 'Hinglish' || looksLikeHinglish(message)
    englishMode =
      (language === 'auto' || language === 'English') &&
      !hinglishMode &&
      !/\p{Script=Devanagari}/u.test(message)
  }

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
    } else if (englishMode && looksLikeHinglish(reply)) {
      try {
        const retry = await hfChat(
          token,
          model,
          [
            { role: 'system', content: SYSTEM_PROMPT },
            {
              role: 'user',
              content: buildSwapPrompt(
                'The previous reply was in the wrong language. Rewrite it so the ENTIRE reply is in plain, natural English — no Hinglish words.'
              ),
            },
          ],
          3
        )
        const fixed = retry.text.trim().replace(/^("|'|«|“)|("|'|»|”)$/g, '').trim()
        if (fixed && !looksLikeHinglish(fixed)) reply = fixed
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