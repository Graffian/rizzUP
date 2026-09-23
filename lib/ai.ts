export const VIBES = [
  'Smooth & confident',
  'Witty & playful',
  'Cheeky tease',
  'Warm & romantic',
  'Short & flirty',
] as const

export type Vibe = (typeof VIBES)[number]

export const SYSTEM_PROMPT = `You are a wingman who writes smooth, confident flirtatious replies to a girl's message. Be the charming friend who always says the right thing — never cringe.

Rules:
1. Sound like a real person texting. Natural, casual, confident, witty. Short to medium length.
2. Never be desperate, needy, or try-hard. No begging to hang out, no over-the-top compliments.
3. No pickup-artist tricks. No cheesy one-liners that get used on everyone. No emoji spam. No vulgar or objectifying language.
4. Actually respond to what she said — reference something specific from her message. Show you were listening.
5. Playful teasing and light humor beat obvious flattery. Confidence is quiet, not loud.
6. End with a light, easy-to-answer hook when it feels natural, so the conversation keeps moving.
7. Match her energy: short message → short reply. Playful message → play along.
8. Always write in the language the user specifies (or the language of her message if not specified).
9. Hinglish rule: if the message is Hinglish (Roman-script Hindi mixed with English) or the user selects Hinglish, ALWAYS reply in Roman/Latin script — a natural Hindi-English mix like "kya kar rahi ho?" — never in Devanagari script. Use Devanagari only if the user explicitly asks for pure Hindi.`

export function extractJSON(text: string | null | undefined) {
  if (!text) return null
  let t = String(text)
  t = t.replace(/```json/gi, '').replace(/```/g, '').trim()
  const start = t.indexOf('[')
  const end = t.lastIndexOf(']')
  if (start === -1 || end === -1 || end < start) return null
  try {
    return JSON.parse(t.slice(start, end + 1))
  } catch {
    return null
  }
}

export function parseReplies(raw: string, vibes: string[]) {
  const out: Array<{ vibe: string; reply: string }> = []
  const arr = extractJSON(raw)
  if (Array.isArray(arr)) {
    arr.forEach((it: any, i: number) => {
      if (typeof it === 'string') {
        const r = String(it).trim()
        if (r) out.push({ vibe: vibes[i] || 'Reply', reply: r })
      } else if (it && typeof it === 'object') {
        const r = String(it.reply || it.text || it.content || '').trim()
        const v = String(it.vibe || it.tone || it.label || vibes[i] || 'Reply').trim()
        if (r) out.push({ vibe: v, reply: r })
      }
    })
  }
  if (!out.length) {
    const parts = String(raw)
      .split(/\n{2,}|(?=\d[.)]\s)/)
      .map((s) => s.trim())
      .filter(Boolean)
    parts.slice(0, vibes.length).forEach((p, i) => {
      out.push({ vibe: vibes[i] || 'Reply', reply: p.replace(/^\d+[.)]\s*/, '') })
    })
  }
  return out.slice(0, vibes.length)
}

export function buildUserPrompt(message: string, language: string, vibes: string[]) {
  const langLine = !language || language === 'auto' ? 'the same language she wrote in' : language
  const list = vibes.map((v, i) => `${i + 1}. ${v}`).join('\n')
  return `The message:
"""
${message}
"""

Reply language: ${langLine}

Give me ${vibes.length} different reply options, one for each vibe in the order listed, as ONLY a JSON array — no markdown code fences, no extra words before or after. Every item must look exactly like this:
{"vibe":"<the vibe>","reply":"<the reply text>"}

Vibes in order:
${list}

Here is the JSON array:`
}

export function buildMessages(message: string, language: string, vibes: string[]) {
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: buildUserPrompt(message, language, vibes) },
  ] as Array<{ role: string; content: string }>
}
