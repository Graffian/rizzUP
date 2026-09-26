import { NextRequest, NextResponse } from 'next/server'
import {
  SYSTEM_PROMPT,
  ICEBREAKER_BLANK_NOTE,
  buildContextSwapUserPrompt,
  buildSwapUserPrompt,
  detectScenario,
  extractAnchors,
  flatReplyIssue,
  looksLikeHinglish,
  openingIssue,
  parseSwapReply,
  pickBetter,
  transcriptThemLines,
} from '@/lib/ai'
import {
  TRIAL_LIMIT,
  blockedResponse,
  clientIp,
  getAccessInfo,
  missingDeviceResponse,
  paywallEnabled,
} from '@/lib/auth'
import { chat, /* geminiApiKey, */ readEnv, resolveModel, transcribeImage } from '@/lib/hf'

const MAX_IMAGE_CHARS = 3_000_000

export async function POST(req: NextRequest) {
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const token = String(body.token || readEnv('HF_TOKEN') || '').trim()
  const model = resolveModel(body.model)
  const message = String(body.message || '').trim()
  const image = String(body.image || '').trim()
  const vibe = String(body.vibe || 'Smooth & confident').trim()
  const language = String(body.language || 'auto')

  if (image && image.length > MAX_IMAGE_CHARS) {
    return NextResponse.json(
      { error: 'Screenshot is too large. Try a smaller image.' },
      { status: 413 }
    )
  }
  if (!token) {
    // if (!token && !geminiApiKey()) {
    return NextResponse.json(
      { error: 'No Hugging Face token configured.' },
      { status: 401 }
    )
  }

  const deviceId = String(body.deviceId || '').trim()
  if (paywallEnabled()) {
    if (!deviceId) {
      return missingDeviceResponse()
    }
    const access = await getAccessInfo(deviceId, clientIp(req))
    if (!access.active && access.trialUsed >= TRIAL_LIMIT) {
      return blockedResponse()
    }
  }

  let buildSwapPrompt: (extra?: string) => string
  let hinglishMode: boolean
  let englishMode: boolean
  let icebreaker = false
  let fixSource = message

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
    const detected = detectScenario(transcript, !!message)
    icebreaker = detected.id === 'icebreaker'
    const base = buildContextSwapUserPrompt(transcript, message, language, vibe, detected.id)
    buildSwapPrompt = (extra = '') => (extra ? `${base}\n\n${extra}` : base)
    const themText = [message, transcriptThemLines(transcript)].filter(Boolean).join('\n')
    fixSource = themText
    hinglishMode = language === 'Hinglish' || looksLikeHinglish(themText)
    englishMode =
      (language === 'auto' || language === 'English') &&
      !hinglishMode &&
      !/\p{Script=Devanagari}/u.test(themText)
  } else {
    const detected = detectScenario(null, !!message)
    icebreaker = detected.id === 'icebreaker'
    let base = buildSwapUserPrompt(message, language, vibe, detected.id)
    if (detected.blank) base += `\n\n${ICEBREAKER_BLANK_NOTE}`
    buildSwapPrompt = (extra = '') => (extra ? `${base}\n\n${extra}` : base)
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
    const { text, model: usedModel } = await chat(token, model, messages, 3)
    let result = parseSwapReply(text, icebreaker)
    if (!result.reply) {
      return NextResponse.json({ error: 'Model returned no text.' }, { status: 502 })
    }
    try {
      const second = await chat(token, model, messages, 3)
      const candidate = parseSwapReply(second.text, icebreaker)
      if (candidate.reply) {
        result = pickBetter(
          result,
          candidate,
          extractAnchors(fixSource),
          icebreaker ? 'icebreaker' : undefined
        )
      }
    } catch {
      // keep the first draw
    }

    if (icebreaker && openingIssue(result)) {
      let fixed = result
      for (let attempt = 0; attempt < 2 && openingIssue(fixed); attempt++) {
        try {
          const retry = await chat(
            token,
            model,
            [
              { role: 'system', content: SYSTEM_PROMPT },
              {
                role: 'user',
                content: buildSwapPrompt(
                  `Rewrite the OPENING LINE in the icebreaker style. The word "or" is ABSOLUTELY FORBIDDEN — no "either", no second option, no "…or…". Write ONE clean yes/no question in 4 to 8 words, then the "yes" line keeps the conversation going the way a confident person naturally would, and the "no" line pivots the same theme with a foot in the door — no flat praise, nothing over the line, no recycled pickup lines ('Is your dad a thief?', 'Did it hurt when you fell from heaven?', 'Is that your natural smile?'). Read the question back to yourself: if the word "or" appears anywhere, rewrite it without "or" before sending. Keep all three lines short and playful.`
                ),
              },
            ],
            3
          )
          const candidate = parseSwapReply(retry.text, icebreaker)
          if (candidate.reply && !openingIssue(candidate)) {
            fixed = candidate
          } else {
            break
          }
        } catch {
          break
        }
      }
      result = fixed
    }

    if (!icebreaker && flatReplyIssue(result)) {
      let fixed = result
      for (let attempt = 0; attempt < 2 && flatReplyIssue(fixed); attempt++) {
        try {
          const retry = await chat(
            token,
            model,
            [
              { role: 'system', content: SYSTEM_PROMPT },
              {
                role: 'user',
                content: buildSwapPrompt(
                  'The reply came out flat — it reviews the situation from the outside instead of flirting, or it sidesteps her last message instead of answering it. Rewrite it: answer her directly, complete the joke she set up, land on her, signal interest. Short, spoken, one quick sentence, under ~15 words. No labeled verdict openings, no "plot twist" reversals, no "just checking if…" reboots, no self-deprecating meta.'
                ),
              },
            ],
            3
          )
          const candidate = parseSwapReply(retry.text, icebreaker)
          if (candidate.reply && !flatReplyIssue(candidate)) {
            fixed = candidate
          } else {
            break
          }
        } catch {
          break
        }
      }
      result = fixed
    }

    if (hinglishMode && !looksLikeHinglish(result.reply)) {
      try {
        const retry = await chat(
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
        const fixed = parseSwapReply(retry.text, icebreaker)
        if (fixed.reply && looksLikeHinglish(fixed.reply)) result = fixed
      } catch {
        // keep original reply if the retry fails
      }
    } else if (englishMode && looksLikeHinglish(result.reply)) {
      try {
        const retry = await chat(
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
        const fixed = parseSwapReply(retry.text, icebreaker)
        if (fixed.reply && !looksLikeHinglish(fixed.reply)) result = fixed
      } catch {
        // keep original reply if the retry fails
      }
    }

    return NextResponse.json({
      model: usedModel,
      reply: result.reply,
      ...(result.yes ? { yes: result.yes, no: result.no } : {}),
    })
  } catch (e: any) {
    const status = e?.status && e.status >= 400 && e.status <= 599 ? e.status : 500
    return NextResponse.json(
      { error: e?.message || 'Something went wrong.' },
      { status }
    )
  }
}