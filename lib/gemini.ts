/*
 * Gemini provider — DISABLED. All generation + vision now runs on Hugging Face only.
 * Re-enable later by uncommenting this file and the Gemini branches in lib/hf.ts,
 * and restoring geminiApiKey in app/api/reply/route.ts + app/api/swap/route.ts.

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export type ChatMessage = {
  role: string
  content: string | Array<Record<string, any>>
}
export type ChatMessages = ChatMessage[]

export class GeminiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'GeminiError'
    this.status = status
  }
}

function geminiApiBase(): string {
  return (
    process.env.GEMINI_API_BASE ||
    'https://generativelanguage.googleapis.com/v1beta'
  )
}

export function geminiApiKey(): string | undefined {
  const val = process.env.GEMINI_API_KEY
  return val && String(val).trim() !== '' ? String(val) : undefined
}

type Part = Record<string, any>

function toParts(content: string | Array<Record<string, any>>): Part[] {
  if (typeof content === 'string') return [{ text: content }]
  const parts: Part[] = []
  for (const raw of content) {
    const part = raw as Record<string, any>
    if (part.type === 'image_url' && part.image_url?.url) {
      const url = String(part.image_url.url)
      if (url.startsWith('data:')) {
        const comma = url.indexOf(',')
        const meta = url.slice(0, comma)
        const data = url.slice(comma + 1)
        const mimeMatch = /data:([^;]+)/.exec(meta)
        parts.push({
          inlineData: { mimeType: mimeMatch?.[1] || 'image/jpeg', data },
        })
      }
    } else if (typeof part.text === 'string') {
      parts.push({ text: part.text })
    }
  }
  return parts
}

function toGeminiBody(
  messages: ChatMessages,
  temperature: number,
  topP: number,
  maxTokens: number
): Record<string, any> {
  const system = messages
    .filter((m) => m.role === 'system')
    .map((m) => m.content)
    .filter((c): c is string => typeof c === 'string')
  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: toParts(m.content),
    }))
    .filter((c) => c.parts.length)

  const body: Record<string, any> = {
    contents,
    generationConfig: {
      temperature,
      topP,
      maxOutputTokens: maxTokens,
      responseMimeType: 'application/json',
      thinkingConfig: { thinkingBudget: 0 },
    },
  }
  if (system.length) {
    body.systemInstruction = { parts: system.map((t) => ({ text: t })) }
  }
  return body
}

export async function geminiChat(
  apiKey: string,
  model: string,
  messages: ChatMessages,
  maxTries = 4,
  maxTokens = 700,
  temperature = 0.9
) {
  const base = geminiApiBase()
  const body = toGeminiBody(messages, temperature, 0.95, maxTokens)
  let lastStatus = 0
  let lastNetworkError = ''
  for (let attempt = 0; attempt < maxTries; attempt++) {
    let resp: Response
    try {
      resp = await fetch(
        `${base}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      )
    } catch (e) {
      lastNetworkError = e instanceof Error ? e.message : 'fetch failed'
      await sleep(1500 * (attempt + 1))
      continue
    }
    lastStatus = resp.status
    if (resp.status === 429 || resp.status === 503) {
      if (attempt < maxTries - 1) {
        const retryAfter = resp.headers.get('retry-after')
        const raw = retryAfter ? Number.parseInt(retryAfter, 10) : 0
        const wait = raw && Number.isFinite(raw)
          ? Math.min(raw * 1000, 60000)
          : Math.min(5000 * (attempt + 1), 30000)
        await sleep(wait)
        continue
      }
      break
    }
    const data = await resp.json().catch(() => ({}))
    if (!resp.ok) {
      const msg =
        (data as any).error?.message ||
        (data as any).error?.status ||
        `HTTP ${resp.status}`
      throw new GeminiError(String(msg), resp.status)
    }
    const parts = (data as any).candidates?.[0]?.content?.parts as
      | Array<{ text?: string }>
      | undefined
    const text = (parts || []).map((p) => String(p.text || '')).join('').trim()
    if (!text) throw new GeminiError('Model returned no text.', 502)
    return { text, model }
  }
  const lastMsg = lastNetworkError
    ? 'Could not reach the Gemini API. Check your internet connection and try again.'
    : lastStatus === 429
      ? 'Free tier rate limit reached. Wait a few seconds and try again.'
      : 'The Gemini model is busy loading. Try again in a few seconds.'
  throw new GeminiError(lastMsg, lastStatus || 503)
}
*/