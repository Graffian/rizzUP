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
  const tryParse = (s: string): unknown => {
    try {
      return JSON.parse(s)
    } catch {
      return null
    }
  }
  const start = t.indexOf('[')
  const end = t.lastIndexOf(']')
  if (start !== -1 && end !== -1 && end > start) {
    const arr = tryParse(t.slice(start, end + 1))
    if (Array.isArray(arr)) return arr
  }
  const firstBrace = t.indexOf('{')
  const lastBrace = t.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    let slice = t.slice(firstBrace, lastBrace + 1)
    slice = slice
      .replace(/^[\s]*[\d]+[.):]?\s+/gm, '')
      .replace(/^[\s]*[-*•]\s+/gm, '')
    const joined = slice.replace(/\}\s*\{/g, '},{')
    const arr = tryParse(`[${joined}]`)
    if (Array.isArray(arr)) return arr
    const obj = tryParse(slice)
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) return [obj]
  }
  return null
}

export function parseReplies(raw: string, vibes: string[]) {
  const out: Array<{
    vibe: string
    reply: string
    yes?: string
    no?: string
  }> = []
  const arr = extractJSON(raw)
  if (Array.isArray(arr)) {
    arr.forEach((it: any, i: number) => {
      if (typeof it === 'string') {
        const r = String(it).trim()
        if (r) out.push({ vibe: vibes[i] || 'Reply', reply: r })
      } else if (it && typeof it === 'object') {
        const r = String(it.reply || it.text || it.content || '').trim()
        const v = String(it.vibe || it.tone || it.label || vibes[i] || 'Reply').trim()
        const yes = it.yes ? String(it.yes).trim() : ''
        const no = it.no ? String(it.no).trim() : ''
        if (r) {
          out.push({
            vibe: v,
            reply: r,
            ...(yes ? { yes } : {}),
            ...(no ? { no } : {}),
          })
        }
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

export type Scenario = {
  id: string
  tag: string
  title: string
  description: string
  instruction: string
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'icebreaker',
    tag: 'SCENARIO 01',
    title: 'The Icebreaker',
    description: "Sliding into DMs like it's nothing. First message, no cringe.",
    instruction:
      "You're sending a first DM to someone you barely know. Open with a cheeky, out-of-nowhere YES/NO question — a bit random and charming, the kind that could work on anyone and nobody sees coming ('Is your dad a thief?', 'Do you believe in love at first sight?', 'Is that your natural smile?'). The question MUST NOT contain the word 'or' — one clean question, no second option; if you catch the word 'or', rewrite without it (never: 'Is your username a reference to something or did you just like how it sounds?'). Then the follow-ups are the payoff that lands it laughing: if she says YES, deliver the smooth reveal that completes the thought ('I knew it — he stole the stars and put them in your eyes.'); if she says NO, pivot the same theme with a foot in the door, never groveling ('Then who stole your heart... because I want to know who I'm up against.'). All three lines short, smooth, confident and playful — no flat praise like 'Nice work, looks professional', nothing creepy or over the line, and the tease must ALWAYS be an inverted compliment: she should end up smiling, never mocked or slighted. NEVER joke that she's fake or commercial — 'Did you steal that smile from a toothpaste commercial?' reads mean. NEVER a question that doesn't make sense — 'Is your workout routine secretly just charming people?' is nonsense word-salad; if you can't picture the joke landing, rewrite it. RULE: if you wouldn't send that exact text message to a crush you just met, rewrite it.",
  },
  {
    id: 'comeback',
    tag: 'SCENARIO 02',
    title: 'The Comeback',
    description: "Left on read? It happens. Here's how you come back from it.",
    instruction:
      "You were left on read. Bring it back without looking needy or bitter. Open with something confident and light — as if you're genuinely unbothered and the momentum is yours. A playful tease or a fun assumption about what she's up to works well. No \"so you ignored me\", no guilt-trips, no apologies for double-texting, no needy follow-up energy. Keep it cool, short, and easy to reply to.",
  },
  {
    id: 'smooth_ask',
    tag: 'SCENARIO 03',
    title: 'The Smooth Ask',
    description: 'DMs are warming up — time to take this offline.',
    instruction:
      "The conversation is going well — time to take it offline. Ask her out (or propose meeting up) smoothly: tie it to something the conversation already established (a shared interest, a joke, a mutual place), be specific about the plan, keep it low-pressure with an easy out, and stay confident and calm. Never beg, never hinge her answer on your mood, and never make it sound like a big deal — it's just a fun thing to do together.",
  },
]

export function scenarioBlock(id: string | null | undefined): string {
  const s = SCENARIOS.find((x) => x.id === id)
  if (!s) return ''
  return `\n\nSCENARIO ${s.tag}: ${s.title} — ${s.description}\nStrategy: ${s.instruction}`
}

function scenarioJsonShape(scenario?: string): string {
  if (scenario === 'icebreaker') {
    return `Every item must look exactly like this:
{"vibe":"<the vibe>","reply":"<a playful, out-of-nowhere YES/NO question — no 'or' in it>","yes":"<charming reveal/payoff if she says yes>","no":"<smooth pivot on the same theme if she says no>"}

The "reply" is a cheeky, random YES/NO question that could work on anyone — nobody sees it coming but it makes her smirk ('Is your dad a thief?', 'Do you believe in love at first sight?', 'Is that your natural smile?'). The question MUST NOT contain the word 'or' — one clean question, no second option. Then the "yes" and "no" lines are the payoff that lands the joke:
- yes → the charming reveal that completes the thought ('I knew it — he stole the stars and put them in your eyes.').
- no → pivot the same theme smoothly and keep a foot in the door ('Then who stole your heart... because I want to know who I'm up against.').
All three lines short, smooth, confident and playful. NO flat praise ('nice work' is wrong), nothing creepy or over the line, and the tease must ALWAYS be an inverted compliment — she ends up smiling, never mocked. NEVER 'Did you steal that smile from a toothpaste commercial?' (mean), and NEVER nonsense like 'Is your workout routine secretly just charming people?'.`
  }
  return `Every item must look exactly like this:
{"vibe":"<the vibe>","reply":"<the reply text>"}`
}

export function buildUserPrompt(
  message: string,
  language: string,
  vibes: string[],
  scenario?: string
) {
  const specific = !!language && language !== 'auto'
  const langLine = specific ? languageLabel(language) : 'the same language she wrote in'
  const list = vibes.map((v, i) => `${i + 1}. ${v}`).join('\n')
  const hasMsg = !!message.trim()
  const languageBars = specific
    ? `\n\nCRITICAL: Every one of the ${vibes.length} replies MUST be written entirely in ${langLine}. No reply may be written fully in English or any other language — if a reply comes out in the wrong language, rewrite the whole reply before including it.`
    : ''
  const englishNote =
    hasMsg && !specific && !looksLikeHinglish(message) && !/\p{Script=Devanagari}/u.test(message)
      ? '\n\nHer message is in plain English, so write EVERY reply in plain, natural English.'
      : ''
  const shortNote =
    hasMsg && message.trim().split(/\s+/).length <= 2 && message.trim().length <= 15
      ? '\n\nThis message is very short. Reply short, casual and lightly flirty, like two people already comfortable with each other — never formal or surprised.'
      : ''
  const head = hasMsg
    ? `The message:
"""
${message}
"""`
    : scenario === 'icebreaker'
      ? 'There is no incoming message yet — you are opening the conversation cold (first DM).'
      : `The message:
"""
${message}
"""`
  return `${head}
${scenarioBlock(scenario)}

Reply language: ${langLine}${languageBars}${englishNote}${shortNote}

${personNote('text')}

Give me ${vibes.length} different reply options, one for each vibe in the order listed, as ONLY a JSON array — no markdown code fences, no extra words before or after. ${scenarioJsonShape(scenario)}

Vibes in order:
${list}

Here is the JSON array:`
}

export function buildFixMessages(
  message: string,
  language: string,
  vibes: string[],
  scenario?: string
) {
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

Return ONLY a JSON array, in the order listed. ${scenarioJsonShape(scenario)}

Vibes to rewrite:
${list}

Here is the JSON array:`,
    },
  ] as Array<{ role: string; content: string }>
}

export function openingIssue(item: { reply: string; yes?: string; no?: string }): string {
  const t = String(item.reply || '')
    .trim()
    .toLowerCase()
  if (/\bor\b/.test(t)) {
    return 'Contains the word "or" in the question — rewrite as ONE clean yes/no question with no "or" and no second option.'
  }
  if (/toothpaste commercial|steal that smile|secretly just|that fake|commercial-grade|barely real/.test(t)) {
    return 'This reads mean or backhanded (or nonsense) — rewrite so the tease is an inverted compliment that leaves her smiling, never mocked.'
  }
  if (/\bnice work\b|\bgreat work\b|\bgood job\b|\bwell done\b|looks professional|nailed it|deserves a raise/.test(t)) {
    return 'This reads like flat neutral praise — rewrite it to sound like a plain, real first DM instead.'
  }
  const praise = /\bnice work\b|\bgreat work\b|\bgood job\b|\bwell done\b|looks professional|nailed it|deserves a raise/
  for (const f of [item.yes, item.no]) {
    if (f && praise.test(String(f).toLowerCase())) {
      return 'A yes/no follow-up is flat neutral praise ("nice work", "deserves a raise") with no flirty pull — rewrite the whole item with smooth, flirty all three lines.'
    }
  }
  return ''
}

export function buildStyleFixMessages(
  message: string,
  language: string,
  vibes: string[],
  scenario?: string
) {
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

Some of these opening lines are too flat, contain the word "or", read mean, or have dead praise for the yes/no. Rewrite ONLY the vibes listed below in the icebreaker style: a cheeky, out-of-nowhere YES/NO question that works on anyone and has no "or" in it; the "yes" line is the smooth reveal that lands the joke; the "no" line pivots the same theme with a foot in the door. No flat praise ('nice work'), nothing creepy, and the tease must be an INVERTED COMPLIMENT — she smiles, never mocked (never 'Did you steal that smile from a toothpaste commercial?', and never nonsense word-salad that doesn't land). Make each rewritten line clearly DIFFERENT from every other line (varied phrasing, not the same template repeated).

${scenarioJsonShape(scenario)}

Vibes to rewrite:
${list}

Here is the JSON array:`,
    },
  ] as Array<{ role: string; content: string }>
}

export function buildMessages(message: string, language: string, vibes: string[], scenario?: string) {
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: buildUserPrompt(message, language, vibes, scenario) },
  ] as Array<{ role: string; content: string }>
}

const personNote = (source: 'text' | 'image' | 'context') =>
  source === 'context'
    ? `READ THE SITUATION FIRST: use WHAT'S HAPPENING and the TRANSCRIPT to understand the platform, the back-and-forth and the tease — reply as someone who is fully in on the joke. If they are teasing you, tease back and land it; never take a joke literally. Use the recorded details (like a selfie or story description) to make the reply specific and real.
PERSON ON THE OTHER END: write to the person described in THEM with the right gender and energy — if THEM says a man, that overrides any "she/her" assumed in the system prompt; if THEM says UNKNOWN, stop worrying about gender and just write a great, natural message. Never mention gender or the detection in the reply — landing the comeback is what matters.`
    : source === 'image'
      ? `READ THE SITUATION FIRST: work out what's really happening between these two people — the platform (DM, story reply, etc.), the back-and-forth, the tease — and reply as someone who is fully in on the joke. If they are teasing you, tease back and land it; never take a joke literally and never get defensive. Use what is visible in the screenshot (like a selfie or the story they posted) to make the reply specific and real.
PERSON ON THE OTHER END: if the screenshot makes it clear (a selfie, their name, pronouns), write to them as the right gender — if they are a man, that overrides any "she/her" assumed in the system prompt. If it is NOT obvious, stop worrying about gender: natural flirting is almost always gender-neutral anyway, so just write a great, natural message to this person. Never mention gender or the detection in the reply — landing the comeback is what matters.`
      : `READ THE SITUATION FIRST: parse what's actually going on in the exchange — the tease, the mood, the subtext — and reply as someone who is in on it. If they are teasing you, tease back and land it; never take a joke literally. If their gender is obvious from the message (name, pronouns), write to them accordingly — a man overrides any "she/her" assumed in the system prompt. If not, just write a natural, gender-neutral message and don't overthink it. Never mention gender in the reply itself.`

export function buildVisionTranscriptMessages(image: string) {
  return [
    {
      role: 'system',
      content:
        'You are a meticulous screenshot transcriber. You never write replies or give advice — you only describe what is on the screenshot so another AI that cannot see it can reply perfectly.',
    },
    {
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: image } },
        {
          type: 'text',
          text: `Analyze this conversation screenshot and describe exactly what is on it.

Output ONLY this structure, nothing else:

PLATFORM: one line — e.g. Instagram DM, Instagram story reply, WhatsApp, iMessage, Snapchat, Telegram, or "unknown"
WHAT'S HAPPENING: 2-3 sentences — the situation, the mood, who is flirting with whom, and any context visible in the image (including what is in a selfie/story photo).
THEM: what you can tell about the person who will be replied to — visible name, pronouns, appearance in a selfie, and their apparent gender ("male", "female", or "UNKNOWN"). Never invent what you cannot see.
TRANSCRIPT (oldest to newest, one message per line):
YOU: <exact words>
THEM: <exact words>
(repeat for every visible message — verbatim, keeping emojis, slang, typos and casing. If a message is cut off in the screenshot, end that line with [cut off].)

Rules: transcribe text EXACTLY as written. Never invent messages that are not visible. THEM = the person who will receive the reply; YOU = the other side. If there is no readable chat, write only "TRANSCRIPT: NONE".`,
        },
      ],
    },
  ] as Array<{ role: string; content: Array<Record<string, any>> }>
}

export function transcriptThemLines(transcript: string): string {
  return String(transcript || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => /^THEM\s*:\s*/.test(l))
    .map((l) => l.replace(/^THEM\s*:\s*/, ''))
    .filter(Boolean)
    .join('\n')
}

export function buildContextUserPrompt(
  transcript: string,
  note: string,
  language: string,
  vibes: string[],
  scenario?: string
) {
  const specific = !!language && language !== 'auto'
  const langLine = specific ? languageLabel(language) : 'the same language she wrote in'
  const list = vibes.map((v, i) => `${i + 1}. ${v}`).join('\n')
  const hasNote = note.trim().length > 0
  const noteLine = hasNote
    ? `\nThe exact message I want to reply to (or my note):\n"""\n${note.trim()}\n"""`
    : ''
  const taskLine = hasNote
    ? scenario === 'icebreaker'
      ? 'The note above is the exact message to reply to (or context to use for the opening line).'
      : 'The note above is the exact message to reply to.'
    : scenario === 'icebreaker'
      ? "You're opening the conversation cold — use the screenshot (profile, story, photo) to come up with the opening line."
      : "The person's last message in the TRANSCRIPT is what I need to reply to."
  const rulesLine =
    scenario === 'icebreaker'
      ? 'Rules: sound like a real, charming person sending a first message. The opening line IS the pickup line — honest, specific and funny, never gross or try-hard, no generic compliments, no emoji spam.'
      : 'Rules: sound like a real person texting, never cringe or try-hard, no pickup lines, no generic compliments, no emoji spam, and reference something specific so it clearly fits the conversation.'
  const languageBars = specific
    ? `\n\nCRITICAL: Every one of the ${vibes.length} replies MUST be written entirely in ${langLine}. No reply may be written fully in English or any other language — if a reply comes out in the wrong language, rewrite the whole reply before including it.`
    : ''
  return `A screenshot of a real conversation was read by a vision model. Here is exactly what it shows:
"""
${transcript}
"""
${noteLine}

${taskLine}
${scenarioBlock(scenario)}

${rulesLine}

${personNote('context')}

Reply language: ${langLine}${languageBars}

Give me ${vibes.length} different reply options, one for each vibe in the order listed, as ONLY a JSON array — no markdown code fences, no extra words before or after. ${scenarioJsonShape(scenario)}

Vibes in order:
${list}

Here is the JSON array:`
}

export function buildContextMessages(
  transcript: string,
  note: string,
  language: string,
  vibes: string[],
  scenario?: string
) {
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: buildContextUserPrompt(transcript, note, language, vibes, scenario),
    },
  ] as Array<{ role: string; content: string }>
}

export function buildContextSwapUserPrompt(
  transcript: string,
  note: string,
  language: string,
  vibe: string,
  scenario?: string
) {
  const langLine =
    !language || language === 'auto' ? 'the same language she wrote in' : languageLabel(language)
  const hasNote = note.trim().length > 0
  const noteLine = hasNote
    ? `\nThe exact message I want to reply to (or my note):\n"""\n${note.trim()}\n"""`
    : ''
  const taskLine = hasNote
    ? scenario === 'icebreaker'
      ? 'The note above is the exact message to reply to (or context to use for the opening line).'
      : 'The note above is the exact message to reply to.'
    : scenario === 'icebreaker'
      ? "You're opening the conversation cold — use the screenshot (profile, story, photo) to come up with the opening line."
      : "The person's last message in the TRANSCRIPT is what I want to reply to."
  const outSpec =
    scenario === 'icebreaker'
      ? `Open with a cheeky, out-of-nowhere YES/NO question that could work on anyone — a bit random and charming, nobody sees it coming ('Is your dad a thief?' style, short and smooth). The question MUST NOT contain the word 'or' — one clean question, no second option. Then the "yes" line delivers the smooth reveal that lands the joke ('I knew it — he stole the stars and put them in your eyes.'), and the "no" line pivots the same theme with a foot in the door, never grovelling ('Then who stole your heart... because I want to know who I'm up against.'). NO flat praise like 'Nice work', nothing creepy or over the line, and the tease must ALWAYS be an inverted compliment — never mock her or make it sound like a slight ('Did you steal that smile from a toothpaste commercial?' is mean; never nonsense either). Return ONLY this JSON object — no markdown, no extra words:
{"reply":"<the first DM — one clean simple YES/NO question, no 'or'>","yes":"<follow-up if she says yes>","no":"<follow-up if she says no>"}`
      : `Write exactly one reply with that vibe. Reply with ONLY the reply text — no quotes, no labels, no explanation. Sound like a real person, never cringe, no pickup lines, no generic compliments, and reference something specific so it fits the conversation.`
  return `A screenshot of a real conversation was read by a vision model. Here is exactly what it shows:
"""
${transcript}
"""
${noteLine}

${taskLine}
${scenarioBlock(scenario)}

${personNote('context')}

Vibe you must use: ${vibe}
Reply language: ${langLine}

${outSpec}`
}

export function buildSwapUserPrompt(
  message: string,
  language: string,
  vibe: string,
  scenario?: string
) {
  const langLine =
    !language || language === 'auto' ? 'the same language she wrote in' : languageLabel(language)
  const outSpec =
    scenario === 'icebreaker'
      ? `Open with a cheeky, out-of-nowhere YES/NO question that could work on anyone — a bit random and charming, nobody sees it coming ('Is your dad a thief?' style, short and smooth). The question MUST NOT contain the word 'or' — one clean question, no second option. Then the "yes" line delivers the smooth reveal that lands the joke ('I knew it — he stole the stars and put them in your eyes.'), and the "no" line pivots the same theme with a foot in the door, never grovelling ('Then who stole your heart... because I want to know who I'm up against.'). NO flat praise like 'Nice work', nothing creepy or over the line, and the tease must ALWAYS be an inverted compliment — never mock her or make it sound like a slight ('Did you steal that smile from a toothpaste commercial?' is mean; never nonsense either). Return ONLY this JSON object — no markdown, no extra words:
{"reply":"<the first DM — one clean simple YES/NO question, no 'or'>","yes":"<follow-up if she says yes>","no":"<follow-up if she says no>"}`
      : `Write exactly one reply with that vibe. Reply with ONLY the reply text — no quotes, no labels, no explanation. Sound like a real person, never cringe, no pickup lines, no generic compliments, and reference something specific so it fits the message.`
  const hasMsg = !!message.trim()
  const head = hasMsg
    ? `The message:
"""
${message}
"""`
    : scenario === 'icebreaker'
      ? 'There is no incoming message yet — you are opening the conversation cold (first DM).'
      : `The message:
"""
${message}
"""`
  return `${head}
${scenarioBlock(scenario)}

Reply language: ${langLine}
Vibe you must use: ${vibe}

${outSpec}`
}

export function parseSwapReply(raw: string, icebreaker: boolean) {
  const text = String(raw || '').trim()
  const clean = (s: string) => s.replace(/^("|'|«|“)|("|'|»|”)$/g, '').trim()
  if (!icebreaker) return { reply: clean(text), yes: '', no: '' }
  const arr = extractJSON(text)
  const obj = Array.isArray(arr) ? arr.find((x: any) => x && typeof x === 'object') : null
  const pick = clean(obj ? String(obj.reply || obj.pickup || '') : '')
  if (pick) {
    return {
      reply: pick,
      yes: clean(obj ? String(obj.yes || '') : ''),
      no: clean(obj ? String(obj.no || '') : ''),
    }
  }
  return { reply: clean(text), yes: '', no: '' }
}

export function buildContextSwapMessages(
  transcript: string,
  note: string,
  language: string,
  vibe: string
) {
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: buildContextSwapUserPrompt(transcript, note, language, vibe) },
  ] as Array<{ role: string; content: string }>
}
