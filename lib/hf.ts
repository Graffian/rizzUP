export const DEFAULT_MODEL = process.env.HF_MODEL || 'deepseek-ai/DeepSeek-V3-0324'
export const HF_URL =
  process.env.HF_URL || 'https://router.huggingface.co/v1/chat/completions'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export class HFError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'HFError'
    this.status = status
  }
}

export async function hfChat(
  token: string,
  model: string,
  messages: Array<{ role: string; content: string }>,
  maxTries = 4
) {
  let lastStatus = 0
  let lastNetworkError = ''
  const payload: Record<string, any> = {
    model,
    messages,
    temperature: 0.9,
    top_p: 0.95,
    max_tokens: 700,
    extra_body: { wait_for_model: true },
  }
  for (let attempt = 0; attempt < maxTries; attempt++) {
    let resp: Response
    try {
      resp = await fetch(HF_URL, {
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