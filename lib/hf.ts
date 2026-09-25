const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

import { buildVisionTranscriptMessages } from '@/lib/ai'
import { geminiApiKey, geminiChat } from '@/lib/gemini'
export { geminiApiKey } from '@/lib/gemini'

export class HFError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'HFError'
    this.status = status
  }
}

export function readEnv(key: string): string | undefined {
  const val = process.env[key]
  return val && String(val).trim() !== '' ? String(val) : undefined
}

export type ChatMessage = {
  role: string
  content: string | Array<Record<string, any>>
}
export type ChatMessages = ChatMessage[]

const VISION_FALLBACKS = [
  'google/gemma-3-27b-it',
  'Qwen/Qwen3-VL-235B-A22B-Instruct',
  'Qwen/Qwen2.5-VL-3B-Instruct',
  'HuggingFaceTB/SmolVLM2-2.2B-Instruct',
]

export function defaultVisionModel(): string {
  return readEnv('HF_VISION_MODEL') || 'Qwen/Qwen3-VL-30B-A3B-Instruct'
}

export function visionModelCandidates(): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const m of [defaultVisionModel(), ...VISION_FALLBACKS]) {
    if (!seen.has(m)) {
      seen.add(m)
      out.push(m)
    }
  }
  return out
}

export function isModelUnavailableError(e: unknown): boolean {
  if (!(e instanceof HFError)) return false
  if (e.status === 404) return true
  if (e.status !== 400 && e.status !== 401 && e.status !== 403) return false
  return /not supported|model_not_supported|not a chat model|does not exist|not found|not available|not deployed|not in your plan|no such model|not valid/i.test(
    e.message
  )
}

export function hfUrl(): string {
  return readEnv('HF_URL') || 'https://router.huggingface.co/v1/chat/completions'
}

export const LEGACY_DEFAULT_MODEL = 'deepseek-ai/DeepSeek-V3-0324'

export function defaultModel(): string {
  if (geminiApiKey()) return geminiModel()
  return readEnv('HF_MODEL') || LEGACY_DEFAULT_MODEL
}

export function geminiModel(): string {
  return readEnv('GEMINI_CHAT_MODEL') || 'gemini-flash-latest'
}

export function geminiVisionModel(): string {
  return readEnv('GEMINI_QUALITY_MODEL') || 'gemini-flash-latest'
}

export function resolveModel(clientModel: string): string {
  const m = String(clientModel || '').trim()
  if (!m || m === LEGACY_DEFAULT_MODEL) return defaultModel()
  return m
}

export function isGeminiModel(model: string): boolean {
  return /^gemini-/i.test(String(model || '').trim())
}

function withHfDirective(messages: ChatMessages): ChatMessages {
  return [
    ...messages,
    {
      role: 'user',
      content:
        'Style note: write crisp, natural, real-sounding replies. Never use the word "or" — avoid "either \u2026 or \u2026" constructions and restructure any sentence that needs it so it flows without "or". Never sound AI-generated — no \'spill the wildest one\', no movie-trailer or greeting-card phrases, no exclamation flurries; type like a real person texting off the top of their head. If the message is an opening line / icebreaker, open with ONE clean yes/no question with no second option.',
    },
  ]
}

export async function chat(
  token: string,
  model: string,
  messages: ChatMessages,
  maxTries = 4,
  maxTokens = 700,
  temperature = 0.9
) {
  const key = geminiApiKey()
  if (key && isGeminiModel(model)) {
    const tries = token ? 1 : maxTries
    try {
      return await geminiChat(key, model, messages, tries, maxTokens, temperature)
    } catch (e) {
      if (!token) throw e
      // Gemini unavailable (rate limit, outage, bad key) → fall back to Hugging Face
    }
  }
  const hfModel = readEnv('HF_MODEL') || LEGACY_DEFAULT_MODEL
  return hfChat(token, hfModel, withHfDirective(messages), maxTries, maxTokens, temperature)
}

export async function hfChat(
  token: string,
  model: string,
  messages: ChatMessages,
  maxTries = 4,
  maxTokens = 700,
  temperature = 0.9
) {
  const url = hfUrl()
  let lastStatus = 0
  let lastNetworkError = ''
  const payload: Record<string, any> = {
    model,
    messages,
    temperature,
    top_p: 0.95,
    max_tokens: maxTokens,
    extra_body: { wait_for_model: true },
  }
  for (let attempt = 0; attempt < maxTries; attempt++) {
    let resp: Response
    try {
      resp = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
    } catch (e) {
      lastNetworkError = e instanceof Error ? e.message : 'fetch failed'
      await sleep(1500 * (attempt + 1))
      continue
    }
    lastStatus = resp.status
    if (resp.status === 503 || resp.status === 429) {
      await sleep(1500 * (attempt + 1))
      continue
    }
    const data = await resp.json().catch(() => ({}))
    if (resp.status === 400 && /extra_body|wait_for_model/i.test(JSON.stringify(data))) {
      payload.extra_body = undefined
      continue
    }
    if (!resp.ok) {
      const msg =
        (data as any).error?.message ||
        (data as any).message ||
        (data as any).error ||
        `HTTP ${resp.status}`
      throw new HFError(String(msg), resp.status)
    }
    const content = (data as any).choices?.[0]?.message?.content as
      | string
      | null
      | undefined
    if (!content) throw new HFError('Model returned no text.', 502)
    return { text: content, model }
  }
  const lastMsg = lastNetworkError
    ? 'Could not reach the Hugging Face API. Check your internet connection and try again.'
    : lastStatus === 429
      ? 'Free tier rate limit reached. Wait a few seconds and try again.'
      : 'The free model is busy loading. Try again in a few seconds.'
  throw new HFError(lastMsg, lastStatus || 503)
}

export async function transcribeImage(token: string, image: string): Promise<string> {
  const key = geminiApiKey()
  if (key) {
    try {
      const { text } = await geminiChat(
        key,
        geminiVisionModel(),
        buildVisionTranscriptMessages(image),
        4,
        1200,
        0.1
      )
      const t = String(text || '').trim()
      if (t && (t.includes('TRANSCRIPT') || /^PLATFORM\s*:/m.test(t))) return t
    } catch {
      // Gemini unavailable → fall through to the Hugging Face vision models
    }
  }
  let lastErr: HFError | null = null
  for (const visionModel of visionModelCandidates()) {
    try {
      const { text } = await hfChat(
        token,
        visionModel,
        buildVisionTranscriptMessages(image),
        4,
        1200,
        0.1
      )
      const t = String(text || '').trim()
      if (t && (t.includes('TRANSCRIPT') || /^PLATFORM\s*:/m.test(t))) return t
      lastErr = new HFError('Vision model returned no readable transcript.', 502)
    } catch (e: any) {
      if (e?.status === 429 || e?.status === 503) throw e
      if (!isModelUnavailableError(e)) throw e
      lastErr = e
    }
  }
  throw new HFError(
    lastErr?.message || 'No vision model is available right now. Try again in a moment.',
    502
  )
}