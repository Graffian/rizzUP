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
8. Always write in the language the user specifies (or the language of her message if not specified). A message that is fully English gets a reply fully in English (only switch to Hinglish if she wrote Hinglish or the user selects Hinglish).
9. Hinglish rule: if the message is Hinglish (Roman-script Hindi mixed with English) or the user selects Hinglish, ALWAYS reply in Roman/Latin script — a natural Hindi-English mix like "kya kar rahi ho?" — never in Devanagari script. Use Devanagari only if the user explicitly asks for pure Hindi.
10. Short/generic messages: if her message is very short or just a greeting/filler (like "hi", "hey", "hello", "hy", "yo", "sup", "hmm", "okay", "ok", "lol", "k", "loL"), reply like a real, casually flirty person — short, warm, easy, under 10 words. Something like "hey, what's up?" or "hey, missed your voice." Never formal, never surprised, never dramatic — no "what's the occasion", no "this honor", no royal-treatment theatrics. Just a smooth, natural opener that keeps the convo alive.
11. READ HER MOOD FIRST: before writing anything, read her emotional state from the message and let it drive your tone. This is the most important rule:
    - Sad, upset, stressed, venting, overwhelmed, or crying → be warm, calm, supportive. Acknowledge how she feels ("that sounds rough" / "I'm sorry you had to deal with that"). Keep it gentle and real, not a lecture. No pickup lines, no teasing, no barrage of compliments. A tiny warm caring touch is fine, never pressure.
    - Angry (especially at you) → never be defensive, dismissive, or playful. Acknowledge what she's saying, stay calm, de-escalate with warmth and sincerity, then lighten only if it clearly fits.
    - Tired, low-energy, or one-word replies → keep it soft and caring, short, and don't demand an emotional response. Be easy to talk to.
    - Happy, excited, proud, or celebrating → celebrate with her, match the energy, flirt and tease lightly, keep it fun.
    - Serious or deep topics → be honest, present, and a little warm. No jokes, no forced flirting.
    - Bored, lonely, or needy → light flirty banter, playful, warm — but never clingy and never desperate.
12. Tone always follows her mood. Flirt when she's in a light or happy mood; shift to calm, kind and supportive the moment she's down or angry. A full reply should feel like the right thing to say to someone you genuinely care about — not a script.`

const HINGLISH_WORDS = [
  'aaj', 'aana', 'aap', 'aapka', 'aapki', 'aapko', 'aata', 'aate', 'aati', 'aaya', 'aaye', 'aayi',
  'abhi', 'acha', 'accha', 'achha', 'achhe', 'agar', 'apna', 'apne', 'apni', 'arey', 'arre',
  'baap', 'baat', 'bada', 'bahut', 'bata', 'batao', 'behen', 'bhai', 'bhi', 'bohat', 'bolo',
  'chahta', 'chahte', 'chahti', 'chahiye', 'chai', 'chalo', 'cheez', 'dikh', 'dil', 'ek',
  'fir', 'gaya', 'gaye', 'gayi', 'hai', 'hain', 'ho', 'hogaya', 'hoga', 'hua', 'hue', 'hui',
  'hum', 'humko', 'jaata', 'jaate', 'jaati', 'jab', 'jaldi', 'kaise', 'kaisa', 'kaisi', 'kab',
  'kahan', 'kal', 'kar', 'karke', 'karna', 'karo', 'karta', 'karte', 'karti', 'khatam', 'khushi',
  'kiya', 'kiye', 'koi', 'kuch', 'kuchh', 'kyunki', 'kyu', 'kyun', 'kya', 'main', 'mast',
  'maza', 'mazaa', 'mera', 'mere', 'meri', 'mujhe', 'mujhko', 'nahi', 'nahin', 'naa', 'pehle',
  'pehli', 'phir', 'pura', 'pyar', 'pyaar', 'raha', 'rahe', 'rahi', 'raho', 'sab', 'sabse',
  'samajh', 'shaam', 'socha', 'sochte', 'sun', 'suno', 'tha', 'theek', 'thi', 'thik',
  'toh', 'tum', 'tumhara', 'tumhari', 'waala', 'wala', 'wali', 'woh', 'yaar', 'zaroor', 'zyada',
]

export function looksLikeHinglish(text: string | null | undefined) {
  const t = String(text || '').trim()
  if (!t) return false
  if (/\p{Script=Devanagari}/u.test(t)) return false
  const words = new Set(
    t
      .toLowerCase()
      .replace(/[^a-z\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
  )
  for (const w of words) if (HINGLISH_WORDS.includes(w)) return true
  return false
}

export function languageLabel(language: string) {
  return language === 'Hinglish'
    ? 'Hinglish (Roman/Latin script, natural Hindi-English mix — never Devanagari)'
    : language
}

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
  const specific = !!language && language !== 'auto'
  const langLine = specific ? languageLabel(language) : 'the same language she wrote in'
  const list = vibes.map((v, i) => `${i + 1}. ${v}`).join('\n')
  const languageBars = specific
    ? `\n\nCRITICAL: Every one of the ${vibes.length} replies MUST be written entirely in ${langLine}. No reply may be written fully in English or any other language — if a reply comes out in the wrong language, rewrite the whole reply before including it.`
    : ''
  const englishNote =
    !specific && !looksLikeHinglish(message) && !/\p{Script=Devanagari}/u.test(message)
      ? '\n\nHer message is in plain English, so write EVERY reply in plain, natural English.'
      : ''
  const shortNote = message.trim().split(/\s+/).length <= 2 && message.trim().length <= 15
    ? '\n\nThis message is very short. Reply short, casual and lightly flirty, like two people already comfortable with each other — never formal or surprised.'
    : ''
  return `The message:
"""
${message}
"""

Reply language: ${langLine}${languageBars}${englishNote}${shortNote}

Give me ${vibes.length} different reply options, one for each vibe in the order listed, as ONLY a JSON array — no markdown code fences, no extra words before or after. Every item must look exactly like this:
{"vibe":"<the vibe>","reply":"<the reply text>"}

Vibes in order:
${list}

Here is the JSON array:`
}

export function buildFixMessages(message: string, language: string, vibes: string[]) {
  const langLine = languageLabel(language)
  const list = vibes.map((v, i) => `${i + 1}. ${v}`).join('\n')
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `The message:
"""
${message}
"""

Some of the reply options came out in the wrong language. Rewrite ONLY the vibes listed below, and make sure the ENTIRE text of every reply is written in ${langLine}. No reply may be written fully in English, Devanagari, or any other language.

Return ONLY a JSON array, in the order listed, shaped exactly like this:
{"vibe":"<the vibe>","reply":"<the reply text>"}

Vibes to rewrite:
${list}

Here is the JSON array:`,
    },
  ] as Array<{ role: string; content: string }>
}

export function buildMessages(message: string, language: string, vibes: string[]) {
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: buildUserPrompt(message, language, vibes) },
  ] as Array<{ role: string; content: string }>
}
