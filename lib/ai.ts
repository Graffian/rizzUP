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
12. Tone always follows her mood. Flirt when she's in a light or happy mood; shift to calm, kind and supportive the moment she's down or angry. A full reply should feel like the right thing to say to someone you genuinely care about — not a script.
13. NEVER sound AI-generated. Before keeping any line, scan it for script-speak that no real person types — 'spill the wildest one', 'hit me with', 'color me impressed', 'say less', 'game on', 'leave me hanging', 'consider me intrigued', 'count me in', 'tell me more', 'ready when you are', exclamation flurries, dramatic em-dashes everywhere, forced alliteration, or any phrase that sounds like a movie trailer or a greeting card. If any of that shows up, delete the line and retype it the way you'd actually text a crush — plain, spoken, casual punctuation, natural contractions, like it's off the top of your head, not written copy.
14. SHORT BEATS CLEVER, EVERY TIME. If a line needs a setup, a trailing "or am I...?" rhetorical tag, dramatic framing ('Welcome back to civilization'), or more than ~15 words to land — it's wrong. Delete it and write the short, natural version. Most replies fit in one quick sentence; two only if the joke needs it. When in doubt, cut words.
15. THE REPLY MUST FLIRT — EVERY TIME. It has to land on HER and signal interest: forward, compliment-adjacent, pushing the conversation forward. Banned: detached one-liners, verdicts, reviews, or observations about the situation that could be sent to anyone ('Diagnosis: too much blue dress in my feed', 'Best story I've seen all day', 'Your posts are getting too good'). If the line doesn't make her smile AND feel like you're into her, rewrite it until it does. Never open with a detached verdict frame — 'Diagnosis:', 'Verdict:', 'Plot twist:' — those are review templates, not flirting, and they are banned as openings.
16. IF HER LAST WORDS ARE A DIRECT QUESTION, ANSWER IT — FIRST. Complete whatever joke or tease set the question up; never reboot the topic, never side-step with a meta one-liner ('Just checking if...' is a sidestep). She asked 'what's wrong?' after your 'something's wrong with my eyes' → the answer is the payoff ('...yeah, they won't stop staring at you in that dress'), NOT 'just checking if you're still analyzing those perfect eyes'. Answer her question directly, then ride the flirt on top of it.`

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
    const arr = tryParse(
      t
        .slice(start, end + 1)
        .replace(/,\s*\}/g, '}')
        .replace(/,\s*\]\s*$/, ']')
    )
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
        try {
          const parsed = JSON.parse(it)
          if (parsed && typeof parsed === 'object') it = parsed
        } catch {
          // keep as a plain string reply
        }
      }
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
      .filter((s) => s && !/^[\{\[]/.test(s) && !/"reply"\s*:/i.test(s))
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
      "You're sending a first DM to someone you barely know. Open with a cheeky, playful YES/NO question — but it must feel like a spontaneous, natural thing you'd actually say, as if you just noticed something and started talking. Make it specific to what you can actually see about her or this moment (her profile, story, photo, name, or the fact that you're opening cold) so it can never sound copy-pasted. The question MUST NOT contain the word 'or' — one clean question, no second option; if you catch the word 'or', rewrite without it. The 'yes' and 'no' lines are the natural bounce of the exchange — how a confident person would actually answer, playful and self-aware, keeping a foot in the door. They are NOT jokes with a rehearsed punchline. Before writing, read the whole line aloud: if it sounds like a pickup line pulled from a list — a pun, a compliment disguised as a joke, silver-tongued wordplay ('Is your dad a thief?', 'Did it hurt when you fell from heaven?', 'Is that your natural smile?') — trash it and think of a fresh, authentic line. The register to aim for is a self-aware micro-tease tied to something real (e.g. 'Do you always save your best lines for strangers?' when opening cold). No flat praise like 'Nice work, looks professional', nothing creepy or over the line, and the tease must ALWAYS be an inverted compliment: she should end up smiling, never mocked or slighted. NEVER joke that she's fake or commercial — 'Did you steal that smile from a toothpaste commercial?' reads mean. NEVER a question that doesn't make sense — 'Is your workout routine secretly just charming people?' is nonsense word-salad; if you can't picture the joke landing in a real conversation, rewrite it. RULE: if you wouldn't send that exact text message to a crush you just met, rewrite it.",
  },
  {
    id: 'comeback',
    tag: 'SCENARIO 02',
    title: 'The Comeback',
    description: "Left on read? It happens. Here's how you come back from it.",
    instruction:
      "This only applies if she truly left you on read. If her last message is a question or otherwise invites your answer, IGNORE the comeback frame completely and just reply to her directly: answer what she asked, land the joke, keep it flirty. But when she genuinely left you unread, bring it back without looking needy or bitter. Open with something confident and light — as if you're genuinely unbothered and the momentum is yours. A playful tease or a fun assumption about what she's up to works well. No \"so you ignored me\", no guilt-trips, no apologies for double-texting, no needy follow-up energy. Keep it cool, short, and easy to reply to.",
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
{"vibe":"<the vibe>","reply":"<a playful, spontaneous YES/NO question — no 'or' in it>","yes":"<keep-it-going line if she says yes>","no":"<smooth pivot on the same theme if she says no>"}

The "reply" is a cheeky, spontaneous YES/NO question that feels like something you'd actually say out loud — tied to something real about her or this moment (her profile, story, photo, name, or that you're opening cold), so it can never sound copy-pasted. The question MUST NOT contain the word 'or' — one clean question, no second option. The "yes" and "no" lines are the natural next lines of the exchange — playful, self-aware, keeping a foot in the door — NOT jokes with a rehearsed punchline. Read each line aloud before writing it: if it sounds like a pickup line off a list (a pun, compliment-disguised-as-a-joke, silver-tongued wordplay like 'Is your dad a thief?' / 'Did it hurt when you fell from heaven?' / 'Is that your natural smile?'), trash it and write a fresh, authentic line. Aim for a self-aware micro-tease tied to something real (e.g. 'Do you always save your best lines for strangers?'). NO flat praise ('nice work' is wrong), nothing creepy or over the line, and the tease must ALWAYS be an inverted compliment — she ends up smiling, never mocked (never 'Did you steal that smile from a toothpaste commercial?', and never nonsense like 'Is your workout routine secretly just charming people?').`
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

Give me ${vibes.length} different reply options, one for each vibe in the order listed, as ONLY a JSON array — no markdown code fences, no extra words before or after. Every reply must be short, spoken, natural — one quick sentence (two only if the joke needs it), under ~15 words, no dramatic setups and no trailing "or am I...?" rhetorical tags. Every reply must visibly flirt — signal interest in HER, land on her, compliment-adjacent, forward. Banned: cold observations, verdicts or reviews of the situation that could be sent to anyone ('Diagnosis: too much blue dress in my feed'). If her last line is a question, each reply answers it and lands the payoff — verdict frames ('Diagnosis:', 'Plot twist:', 'Just checking if…') are banned. Type the way you'd actually reply off the top of your head. ${scenarioJsonShape(scenario)}

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
  if (/\bdad a thief\b|\bfrom heaven\b|\bare you an angel\b|\bdid it hurt\b|\bstole the stars\b|\bpolice are waiting\b|\babout to be arrested\b|\bnatural smile\b/.test(t)) {
    return 'This is a recycled pickup line everyone has heard a hundred times — rewrite with a fresh, spontaneous, context-specific angle.'
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

Some of these opening lines are too flat, contain the word "or", read mean, or sound like a recycled pickup line with no hook. Rewrite ONLY the vibes listed below in the icebreaker style: a cheeky, spontaneous YES/NO question that feels like something you'd actually say — tied to something real about her or the moment, with the word "or" ABSOLUTELY FORBIDDEN ('either' too; no second option). Write the question in 4 to 8 words. The "yes" line keeps the exchange going the way a confident person naturally would (playful, self-aware — never a rehearsed punchline reveal); the "no" line pivots the same theme with a foot in the door. Read the question back to yourself: if the word 'or' appears anywhere, rewrite it without 'or' before sending. If a line sounds like a pickup line off a list (puns, compliment-disguised-as-joke, 'Is your dad a thief?' / 'Did it hurt when you fell from heaven?' / 'Is that your natural smile?'), trash it and think of a fresh, authentic angle. No flat praise ('nice work'), nothing creepy, and the tease must be an INVERTED COMPLIMENT — she smiles, never mocked (never 'Did you steal that smile from a toothpaste commercial?', and never nonsense word-salad that doesn't land). Make each rewritten line clearly DIFFERENT from every other line (varied phrasing, not the same template repeated).

${scenarioJsonShape(scenario)}

Vibes to rewrite:
${list}

Here is the JSON array:`,
    },
  ] as Array<{ role: string; content: string }>
}

export function flatReplyIssue(item: { reply: string; yes?: string; no?: string }): string {
  const t = String(item.reply || '').trim()
  if (/^\s*(diagnosis|verdict|review|plot\s*twist)\s*[:-]/i.test(t)) {
    return 'This opens with a detached verdict frame ("Diagnosis:", "Verdict:", "Plot twist:") — it reviews the situation instead of flirting with her. Rewrite it to answer her directly and land on her.'
  }
  if (/\bjust checking if\b/i.test(t)) {
    return 'This is a sidestep ("just checking if…") that ignores her last message. Rewrite it to answer her question and finish the joke.'
  }
  if (/\bworried (you|you'?d|ya)\s+won'?t believe\b/i.test(t)) {
    return 'This is a self-deprecating meta line that buries the compliment. Rewrite it so it lands on her confidently, short and flirty.'
  }
  if (/^\s+(so|well|honestly)\s*,?\s+(i|the|your|there|this)['’]?\b/.test(t) && t.length > 25) {
    return 'This reads as a rambling cold observation. Cut it down to a short, direct, flirty reply that lands on her.'
  }
  return ''
}

export function buildQualityFixMessages(
  message: string,
  vibes: string[],
  scenario?: string
) {
  const list = vibes.map((v, i) => `${i + 1}. ${v}`).join('\n')
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `The message:
"""
${message}
"""

Some of the reply options came out flat — they review the situation from the outside (a line that opens with a label and a colon, like a verdict), or they sidestep her last message instead of answering it, or they bury the compliment in self-deprecation. None of those flirt. Rewrite ONLY the vibes listed below: each reply must answer her last message directly (if she asked a question, complete the joke that set it up), land on her, and clearly signal interest — short, spoken, one quick sentence, under ~15 words. No labeled verdict openings, no "plot twist" reversals, no "just checking if…" reboots, no self-deprecating meta. If a reply needs more than one sentence to flirt, it is not flirty enough.

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

Give me ${vibes.length} different reply options, one for each vibe in the order listed, as ONLY a JSON array — no markdown code fences, no extra words before or after. Every reply must be short, spoken, natural — one quick sentence (two only if the joke needs it), under ~15 words, no dramatic setups and no trailing "or am I...?" rhetorical tags. Every reply must visibly flirt — signal interest in HER, land on her, compliment-adjacent, forward. Banned: cold observations, verdicts or reviews of the situation that could be sent to anyone ('Diagnosis: too much blue dress in my feed'). If her last line is a question, each reply answers it and lands the payoff — verdict frames ('Diagnosis:', 'Plot twist:', 'Just checking if…') are banned. Type the way you'd actually reply off the top of your head. ${scenarioJsonShape(scenario)}

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
      ? `Open with a cheeky, spontaneous YES/NO question that feels like a real spoken line — tied to something specific you can see about her or the moment (her profile, story, photo, name, or that you're opening cold), so it can't sound copy-pasted. The question MUST NOT contain the word 'or' — one clean question, no second option. The register to aim for is a self-aware micro-tease ('Do you always save your best lines for strangers?' hits it; 'Is your dad a thief?' misses it — that's a rehearsed pickup line). The "yes" line keeps the exchange going the way a confident person naturally would — playful and self-aware, never a rehearsed punchline reveal; the "no" line pivots the same theme with a foot in the door, never grovelling. Read the line aloud before keeping it: if it sounds like a pickup line from a list — puns, compliment-disguised-as-joke, silver-tongued wordplay ('Did it hurt when you fell from heaven?', 'Is that your natural smile?') — trash it and write a fresh, authentic line. NO flat praise like 'Nice work', nothing creepy or over the line, and the tease must ALWAYS be an inverted compliment — she ends up smiling, never mocked or slighted (never 'Did you steal that smile from a toothpaste commercial?', and never nonsense that wouldn't land in a real conversation). RULE: if you wouldn't send that exact text message to a crush you just met, rewrite it. Return ONLY this JSON object — no markdown, no extra words:
{"reply":"<the first DM — one clean simple YES/NO question, no 'or'>","yes":"<follow-up if she says yes>","no":"<follow-up if she says no>"}`
      : `Write exactly one reply with that vibe. Reply with ONLY the reply text — no quotes, no labels, no explanation. Sound like a real person, never cringe, no pickup lines, no generic compliments, and reference something specific so it fits the conversation. Keep it SHORT and casual — one quick sentence (or two only if the joke needs it), under ~15 words. No long setups, no dramatic framing, no trailing "or am I...?" rhetorical tags. It must visibly flirt — signal interest in HER, land on her, forward — never a cold observation or verdict about the situation ('Diagnosis: too much blue dress in my feed' is banned). If her last line is a question, answer it and land the payoff — no 'Diagnosis:', 'Plot twist:', or 'Just checking if…' reboots. Type the way you'd actually reply, off the top of your head.`
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
      ? `Open with a cheeky, spontaneous YES/NO question that feels like a real spoken line — tied to something specific about her or the moment (her profile, story, photo, name, or that you're opening cold), so it can't sound copy-pasted. The question MUST NOT contain the word 'or' — one clean question, no second option. The register to aim for is a self-aware micro-tease ('Do you always save your best lines for strangers?' hits it; 'Is your dad a thief?' misses it — that's a rehearsed pickup line). The "yes" line keeps the exchange going the way a confident person naturally would — playful and self-aware, never a rehearsed punchline reveal; the "no" line pivots the same theme with a foot in the door, never grovelling. Read the line aloud before keeping it: if it sounds like a pickup line from a list — puns, compliment-disguised-as-joke, silver-tongued wordplay ('Did it hurt when you fell from heaven?', 'Is that your natural smile?') — trash it and write a fresh, authentic line. NO flat praise like 'Nice work', nothing creepy or over the line, and the tease must ALWAYS be an inverted compliment — she ends up smiling, never mocked or slighted (never 'Did you steal that smile from a toothpaste commercial?', and never nonsense that wouldn't land in a real conversation). RULE: if you wouldn't send that exact text message to a crush you just met, rewrite it. Return ONLY this JSON object — no markdown, no extra words:
{"reply":"<the first DM — one clean simple YES/NO question, no 'or'>","yes":"<follow-up if she says yes>","no":"<follow-up if she says no>"}`
      : `Write exactly one reply with that vibe. Reply with ONLY the reply text — no quotes, no labels, no explanation. Sound like a real person, never cringe, no pickup lines, no generic compliments, and reference something specific so it fits the message. Keep it SHORT and casual — one quick sentence (or two only if the joke needs it), under ~15 words. No long setups, no dramatic framing, no trailing "or am I...?" rhetorical tags. It must visibly flirt — signal interest in HER, land on her, forward — never a cold observation or verdict about the situation ('Diagnosis: too much blue dress in my feed' is banned). If her last line is a question, answer it and land the payoff — no 'Diagnosis:', 'Plot twist:', or 'Just checking if…' reboots. Type the way you'd actually reply, off the top of your head.`
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
  if (!icebreaker) {
    const wrapped = extractJSON(text)
    const obj =
      Array.isArray(wrapped)
        ? wrapped.find((x: any) => x && typeof x === 'object')
        : wrapped && typeof wrapped === 'object'
          ? (wrapped as any)
          : null
    const pick = obj && typeof obj.reply === 'string' ? clean(obj.reply) : ''
    if (pick) return { reply: pick, yes: '', no: '' }
    return { reply: clean(text), yes: '', no: '' }
  }
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
