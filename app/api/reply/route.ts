import { NextRequest, NextResponse } from 'next/server'
import {
  VIBES,
  ICEBREAKER_BLANK_NOTE,
  buildCallbackFixMessages,
  buildContextMessages,
  buildFixMessages,
  buildMessages,
  buildQualityFixMessages,
  buildStyleFixMessages,
  detectScenario,
  extractAnchors,
  flatReplyIssue,
  hasAnyAnchor,
  looksLikeHinglish,
  openingIssue,
  parseReplies,
  pickBetter,
  transcriptThemLines,
} from '@/lib/ai'
import {
  TRIAL_LIMIT,
  blockedResponse,
  claimTrial,
  clientIp,
  getAccessInfo,
  missingDeviceResponse,
  paywallEnabled,
} from '@/lib/auth'
import {
  chat,
  // geminiApiKey,
  readEnv,
  resolveModel,
  transcribeImage,
} from '@/lib/hf'

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
  const language = String(body.language || 'auto')
  let count = parseInt(body.count, 10) || 3
  count = Math.min(Math.max(count, 1), 5)

  let detected = detectScenario(null, !!message)
  if (!image && detected.id !== 'icebreaker' && !message) {
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
    // if (!token && !geminiApiKey()) {
    return NextResponse.json(
      { error: 'No Hugging Face token. Add a free one at huggingface.co/settings/tokens and save it in Settings.' },
      { status: 401 }
    )
  }

  const deviceId = String(body.deviceId || '').trim()
  const ip = clientIp(req)
  let hasActiveAccess = false
  if (paywallEnabled()) {
    if (!deviceId) {
      return missingDeviceResponse()
    }
    const access = await getAccessInfo(deviceId, ip)
    if (!access.active && access.trialUsed >= TRIAL_LIMIT) {
      return blockedResponse()
    }
    hasActiveAccess = access.active
  }

  const vibes = VIBES.slice(0, count)

  let genMessages: Array<{ role: string; content: string }>
  let scenario = detected.id
  let hinglishMode: boolean
  let englishMode: boolean
  let fixText: string

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
    detected = detectScenario(transcript, !!message)
    scenario = detected.id
    genMessages = buildContextMessages(transcript, message, language, vibes, scenario)
    const themText = [message, transcriptThemLines(transcript)].filter(Boolean).join('\n')
    hinglishMode = language === 'Hinglish' || looksLikeHinglish(themText)
    englishMode =
      (language === 'auto' || language === 'English') &&
      !hinglishMode &&
      !/\p{Script=Devanagari}/u.test(themText)
    fixText = [message, transcript].filter(Boolean).join('\n')
  } else {
    genMessages = buildMessages(message, language, vibes, scenario)
    if (detected.blank) {
      genMessages[1].content += `\n\n${ICEBREAKER_BLANK_NOTE}`
    }
    hinglishMode = language === 'Hinglish' || looksLikeHinglish(message)
    englishMode =
      (language === 'auto' || language === 'English') &&
      !hinglishMode &&
      !/\p{Script=Devanagari}/u.test(message)
    fixText = message
  }

  try {
    const { text, model: usedModel } = await chat(token, model, genMessages)
    let replies = parseReplies(text, vibes)
    if (vibes.length === 1 && replies.length === 1) {
      try {
        const second = await chat(token, model, genMessages)
        const secondReplies = parseReplies(second.text, vibes)
        if (secondReplies.length === 1) {
          replies = [pickBetter(replies[0], secondReplies[0], extractAnchors(fixText), scenario)]
        }
      } catch {
        // keep the first draw
      }
    }

    const fill = async (
      makeFix: (missing: string[]) => Array<{ role: string; content: string }>,
      keep: (r: { vibe: string; reply: string; yes?: string; no?: string }) => boolean
    ) => {
      const accepted = replies.filter(keep)
      for (let round = 0; round < 2 && accepted.length < vibes.length; round++) {
        const missing = vibes.filter((v) => !accepted.some((r) => r.vibe === v))
        if (!missing.length) break
        try {
          const fixed = await chat(token, model, makeFix(missing))
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
        .filter(
          (r): r is { vibe: string; reply: string; yes?: string; no?: string } => !!r
        )
    }

    if (replies.length) {
      if (hinglishMode) {
        replies = await fill(
          (missing) => buildFixMessages(fixText, 'Hinglish', missing, scenario),
          (r) => looksLikeHinglish(r.reply)
        )
      } else if (englishMode) {
        replies = await fill(
          (missing) => buildFixMessages(fixText, 'English', missing, scenario),
          (r) => !looksLikeHinglish(r.reply)
        )
      }
      if (scenario === 'icebreaker') {
        replies = await fill(
          (missing) =>
            buildStyleFixMessages(
              fixText,
              language === 'auto' ? 'English' : language,
              missing,
              scenario
            ),
          (r) => !openingIssue(r)
        )
      }
      replies = await fill(
        (missing) => buildQualityFixMessages(fixText, missing, scenario),
        (r) => !flatReplyIssue(r)
      )
      if (scenario !== 'icebreaker') {
        const anchors = extractAnchors(fixText)
        if (anchors.length > 0 && !replies.some((r) => hasAnyAnchor(r.reply, anchors))) {
          const original = replies
          try {
            const fixed = await chat(
              token,
              model,
              buildCallbackFixMessages(fixText, anchors, vibes, scenario)
            )
            const cand = parseReplies(fixed.text, vibes).filter(
              (r) => !flatReplyIssue(r) && hasAnyAnchor(r.reply, anchors)
            )
            const merged = vibes
              .map((v) => {
                const better = cand.find((r) => r.vibe === v && hasAnyAnchor(r.reply, anchors))
                return better || original.find((r) => r.vibe === v)
              })
              .filter(
                (r): r is { vibe: string; reply: string; yes?: string; no?: string } => !!r
              )
            if (merged.length) replies = merged
          } catch {
            // keep the original batch — never make things worse
          }
        }
      }
    }

    if (!replies.length) {
      return NextResponse.json(
        { error: 'Could not parse model output. Try again.' },
        { status: 502 }
      )
    }
    if (paywallEnabled() && deviceId && !hasActiveAccess) {
      await claimTrial(deviceId, ip)
    }
    return NextResponse.json({
      model: usedModel,
      replies,
      detected: { id: detected.id, tag: detected.tag, title: detected.title },
    })
  } catch (e: any) {
    const status = e?.status && e.status >= 400 && e.status <= 599 ? e.status : 500
    return NextResponse.json(
      { error: e?.message || 'Something went wrong.' },
      { status }
    )
  }
}