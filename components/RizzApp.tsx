'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { SCENARIOS } from '@/lib/ai'

type Reply = { vibe: string; reply: string; yes?: string; no?: string }
type Theme = 'light' | 'dark' | 'system'
type Prefs = {
  token: string
  model: string
  lang: string
  count: string
  theme: Theme
  scenario: string
}

const LANGUAGES = [
  { value: 'auto', label: 'auto' },
  { value: 'English', label: 'English' },
  { value: 'Spanish', label: 'Español' },
  { value: 'French', label: 'Français' },
  { value: 'German', label: 'Deutsch' },
  { value: 'Italian', label: 'Italiano' },
  { value: 'Portuguese', label: 'Português' },
  { value: 'Hindi', label: 'हिन्दी' },
  { value: 'Hinglish', label: 'Hinglish' },
  { value: 'Japanese', label: '日本語' },
  { value: 'Korean', label: '한국어' },
  { value: 'Turkish', label: 'Türkçe' },
  { value: 'Arabic', label: 'العربية' },
  { value: 'Chinese', label: '中文' },
]

const initialPrefs: Prefs = {
  token: '',
  model: 'deepseek-ai/DeepSeek-V3-0324',
  lang: 'auto',
  count: '3',
  theme: 'light',
  scenario: 'icebreaker',
}

function loadPrefs(): Prefs {
  if (typeof window === 'undefined') return initialPrefs
  let stored: Partial<Prefs> | null = null
  try {
    stored = JSON.parse(localStorage.getItem('rz_prefs') || 'null')
  } catch {
    stored = null
  }
  const scenario =
    stored?.scenario && SCENARIOS.some((s) => s.id === stored!.scenario)
      ? (stored!.scenario as string)
      : 'icebreaker'
  return {
    ...initialPrefs,
    ...(stored || {}),
    scenario,
    theme: stored?.theme === 'dark' || stored?.theme === 'system' ? stored!.theme : 'light',
  }
}

function downscaleImage(
  file: File,
  maxEdge = 1400,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxEdge / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        URL.revokeObjectURL(url)
        reject(new Error('canvas unavailable'))
        return
      }
      ctx.drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      const data = canvas.toDataURL('image/jpeg', quality)
      if (!data || data.length < 100) reject(new Error('could not encode image'))
      else resolve(data)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('could not read image'))
    }
    img.src = url
  })
}

function errorMessage(err: unknown): string {
  const m = err instanceof Error ? err.message : 'Something went wrong.'
  if (/401|403|token/i.test(m)) {
    return 'Invalid token. Get a free one at huggingface.co/settings/tokens.'
  }
  if (/404|doesn't exist|not found|not supported/i.test(m)) {
    return "That model isn't enabled on your account. Try deepseek-ai/DeepSeek-V3-0324."
  }
  if (/429|rate limit/i.test(m)) {
    return 'Free tier rate limit hit — wait a few seconds and try again.'
  }
  return m
}

export default function RizzApp() {
  const [prefs, setPrefs] = useState<Prefs>(initialPrefs)
  const [showSettings, setShowSettings] = useState(false)
  const [message, setMessage] = useState('')
  const [image, setImage] = useState<string | null>(null)
  const [imageBusy, setImageBusy] = useState(false)
  const [busy, setBusy] = useState(false)
  const [replies, setReplies] = useState<Reply[] | null>(null)
  const [meta, setMeta] = useState('')
  const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null)

  const taRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const swapping = useRef<Record<number, boolean>>({})

  const savePrefs = useCallback((p: Prefs) => {
    setPrefs(p)
    try {
      localStorage.setItem('rz_prefs', JSON.stringify(p))
    } catch {
      // storage unavailable
    }
  }, [])

  const showToast = useCallback((msg: string, err?: boolean) => {
    setToast({ msg, err })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3200)
  }, [])

  useEffect(() => {
    setPrefs(loadPrefs())
  }, [])

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current)
    }
  }, [])

  const autoGrow = useCallback(() => {
    const t = taRef.current
    if (!t) return
    t.style.height = 'auto'
    t.style.height = Math.min(t.scrollHeight, 320) + 'px'
  }, [])

  const pasteFromClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) {
        setMessage(text)
        showToast('pasted')
        requestAnimationFrame(autoGrow)
      } else {
        showToast('clipboard is empty')
      }
    } catch {
      showToast('clipboard blocked — paste manually (ctrl+v)', true)
    }
  }, [showToast, autoGrow])

  const handleImageFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        showToast('that file is not an image', true)
        return
      }
      if (file.size > 15 * 1024 * 1024) {
        showToast('image too big — max 15MB', true)
        return
      }
      setImageBusy(true)
      try {
        const data = await downscaleImage(file)
        setImage(data)
        showToast('screenshot attached')
      } catch {
        showToast('could not read that image', true)
      } finally {
        setImageBusy(false)
      }
    },
    [showToast]
  )

  const pickImage = useCallback(() => {
    fileRef.current?.click()
  }, [])

  const onEditorPaste = useCallback(
    (e: React.ClipboardEvent) => {
      const f = e.clipboardData?.files?.[0]
      if (f && f.type.startsWith('image/')) {
        e.preventDefault()
        handleImageFile(f)
      }
    },
    [handleImageFile]
  )

  const onEditorDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const f = e.dataTransfer?.files?.[0]
      if (f) handleImageFile(f)
    },
    [handleImageFile]
  )

  const onEditorDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer?.types?.includes('Files')) e.preventDefault()
  }, [])

  const gen = useCallback(async () => {
    if (busy) return
    const msg = message.trim()
    if (!msg && !image && prefs.scenario !== 'icebreaker') {
      showToast('paste a message or attach a screenshot', true)
      taRef.current?.focus()
      return
    }

    setBusy(true)
    setReplies(null)
    setMeta('')

    try {
      const res = await fetch('/api/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          image: image || undefined,
          language: prefs.lang,
          count: parseInt(prefs.count, 10) || 3,
          token: prefs.token,
          model: prefs.model,
          scenario: prefs.scenario,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Request failed')
      setReplies(data.replies || [])
      const source = image ? 'screenshot' : 'text'
      const scenarioTag =
        SCENARIOS.find((s) => s.id === prefs.scenario)?.tag || ''
      setMeta(
        `${prefs.count} versions · ${source} · ${scenarioTag} · ${data.model || 'default model'}`
      )
    } catch (err) {
      showToast(errorMessage(err), true)
    } finally {
      setBusy(false)
    }
  }, [busy, message, image, prefs, showToast])

  const swap = useCallback(
    async (index: number, vibe: string, base: string) => {
      if (swapping.current[index]) return
      swapping.current[index] = true
      try {
        const res = await fetch('/api/swap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: base,
            image: image || undefined,
            vibe,
            language: prefs.lang,
            token: prefs.token,
            model: prefs.model,
            scenario: prefs.scenario,
          }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || 'Request failed')
        setReplies((prev) =>
          prev
            ? prev.map((r, i) =>
                i === index
                  ? { ...r, reply: data.reply, yes: data.yes, no: data.no }
                  : r
              )
            : prev
        )
      } catch (err) {
        showToast(errorMessage(err), true)
      } finally {
        swapping.current[index] = false
      }
    },
    [prefs, showToast, image]
  )

  const copy = useCallback(
    async (text: string, btn: HTMLElement) => {
      const done = () => {
        btn.classList.add('border-rust/70', 'text-rust')
        const label = btn.querySelector('[data-copy-label]')
        if (label) label.textContent = 'copied ✓'
        setTimeout(() => {
          btn.classList.remove('border-rust/70', 'text-rust')
          if (label) label.textContent = 'copy'
        }, 1600)
      }
      try {
        await navigator.clipboard.writeText(text)
        done()
      } catch {
        showToast('could not copy', true)
      }
    },
    [showToast]
  )

  const num = useCallback((i: number) => String(i + 1).padStart(2, '0'), [])

  const selectBaseClass =
    'min-w-[112px] cursor-pointer appearance-none rounded-2xl border-2 border-line bg-ink2/80 px-3.5 py-2.5 pr-8 font-body text-[12px] font-semibold text-paper outline-none transition hover:border-line2 focus:border-rust focus:ring-4 focus:ring-rust/10'

  const selectStyle = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23696056' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 9px center',
  } as const

  return (
    <div className={`theme-${prefs.theme} relative isolate min-h-screen overflow-hidden text-paper`}>
      <div className="intro-screen pointer-events-none fixed inset-0 z-[100] flex items-center justify-center bg-ink">
        <div className="intro-logo flex flex-col items-center">
          <div className="inline-flex rounded-2xl bg-[#242727] px-4 py-3 shadow-xl shadow-black/10">
            <img
              src="/rizzup-wordmark-128h.png"
              srcSet="/rizzup-wordmark-256h.png 2x, /rizzup-wordmark-512h.png 4x"
              alt="RizzUp"
              className="h-9 w-auto select-none sm:h-10"
            />
          </div>
          <span className="mt-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">a wingman in your pocket</span>
        </div>
      </div>
      <div className="fixed inset-0 -z-20 bg-ink" />
      <main className="relative z-10 mx-auto w-full max-w-[980px] px-5 py-6 sm:px-10 sm:py-10 lg:py-14">
        {/* header */}
        <header className="animate-entrance animate-delay-1 flex items-center justify-between pb-2">
          <div>
            <div className="inline-flex -rotate-2 rounded-xl bg-[#242727] px-3 py-2 shadow-sm">
              <img
                src="/rizzup-wordmark-128h.png"
                srcSet="/rizzup-wordmark-256h.png 2x, /rizzup-wordmark-512h.png 4x"
                alt="RizzUp"
                className="h-7 w-auto select-none sm:h-8"
              />
            </div>
            <p className="mt-2 font-body text-[11px] font-semibold tracking-[0.08em] text-muted/80">
              a wingman in your pocket
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => savePrefs({ ...prefs, theme: prefs.theme === 'dark' ? 'light' : 'dark' })}
              aria-label={prefs.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="flex h-10 w-10 items-center justify-center rounded-[14px] border-2 border-line2/70 bg-panel/80 text-muted transition hover:border-rust hover:bg-rust/10 hover:text-paper"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden
              >
                {prefs.theme === 'dark' ? (
                  <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.7 6.7 0 0 0 21 12.8Z" />
                ) : (
                  <>
                    <circle cx="12" cy="12" r="3.5" />
                    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                  </>
                )}
              </svg>
            </button>
            <button
              onClick={() => setShowSettings((v) => !v)}
              className="flex items-center gap-2 rounded-[14px] border-2 border-line2/70 bg-panel/80 px-3.5 py-2 font-body text-[11px] font-bold tracking-[0.03em] text-muted transition hover:border-rust hover:bg-rust/10 hover:text-paper"
            >
            <span className="hidden sm:inline">{showSettings ? 'close' : 'settings'}</span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            </button>
          </div>
        </header>

        {/* hero */}
        <section className="mt-16 sm:mt-20">
          <div className="animate-entrance animate-delay-2 max-w-3xl">
            <p className="mb-5 font-body text-[12px] font-bold tracking-[0.06em] text-rust">better words, less overthinking</p>
            <h1 className="max-w-2xl font-head text-[38px] font-bold leading-[0.98] tracking-[-0.045em] sm:text-[72px]">
              Reply like you{' '}
              <em className="font-serifit font-normal italic text-rust">mean it.</em>
            </h1>
            <p className="mt-6 max-w-xl text-[16px] leading-[1.65] text-muted">
              Paste the message. Get a handful of replies that sound like you on a
              good day — one to tease, one to charm, one to keep short.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-semibold tracking-[0.1em] text-muted/80">
              <span>13 languages</span>
              <span>enter to generate</span>
              <span>nothing stored</span>
            </div>
          </div>
        </section>

        <section className="animate-entrance animate-delay-3 mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-[18px] border-2 border-line bg-panel/75 p-4 shadow-[0_2px_0_rgb(var(--color-paper)_/_0.08)] sm:p-5">
            <p className="font-head text-[16px] font-bold tracking-[-0.02em] text-paper">Start with context</p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-muted">Paste the message as it happened for a more natural reply.</p>
          </div>
          <div className="rounded-[18px] border-2 border-line bg-panel/75 p-4 shadow-[0_2px_0_rgb(var(--color-paper)_/_0.08)] sm:p-5">
            <p className="font-head text-[16px] font-bold tracking-[-0.02em] text-paper">Keep it yours</p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-muted">Use each draft as a starting point, then make it sound like you.</p>
          </div>
          <div className="rounded-[18px] border-2 border-line bg-panel/75 p-4 shadow-[0_2px_0_rgb(var(--color-paper)_/_0.08)] sm:p-5">
            <p className="font-head text-[16px] font-bold tracking-[-0.02em] text-paper">Ready when you are</p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-muted">Press enter to generate, or use shift + enter for a new line.</p>
          </div>
        </section>

        {/* settings */}
        {showSettings && (
          <section className="mt-10 animate-fadeIn overflow-hidden rounded-[22px] border-2 border-line2/60 bg-panel/90 shadow-[0_2px_0_rgb(var(--color-paper)_/_0.1)]">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-5 py-3.5">
              <span className="font-head text-[15px] font-bold tracking-[-0.02em] text-paper">
                api access
              </span>
              <div className="flex items-center gap-1 rounded-xl border-2 border-line bg-ink2/70 p-1">
                {(['light', 'dark', 'system'] as const).map((themeOption) => (
                  <button
                    key={themeOption}
                    onClick={() => savePrefs({ ...prefs, theme: themeOption })}
                    className={`rounded-lg px-2.5 py-1.5 text-[10px] font-semibold capitalize tracking-[0.04em] transition ${prefs.theme === themeOption ? 'bg-paper text-ink shadow-sm' : 'text-muted hover:text-paper'}`}
                  >
                    {themeOption}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-7 p-5 sm:p-6 md:grid-cols-[1.4fr_1fr]">
              <div>
                <label className="block font-body text-sm font-bold tracking-[0.01em] text-muted">
                  hf token{' '}
                  <span className="ml-1 rounded-[3px] border border-rust/40 px-1.5 py-0.5 text-[9.5px] normal-case tracking-normal text-rust">
                    free
                  </span>
                </label>
                <div className="mt-2 flex gap-2">
                  <input
                    type="password"
                    value={prefs.token}
                    onChange={(e) => setPrefs((p) => ({ ...p, token: e.target.value }))}
                    placeholder="hf_xxxxxxxx…"
                    autoComplete="off"
                    className="w-full flex-1 rounded-[14px] border-2 border-line bg-ink2/80 px-3.5 py-3 text-[13.5px] text-paper outline-none transition focus:border-rust focus:ring-2 focus:ring-rust/10 placeholder:text-faint"
                  />
                  <button
                    onClick={() => savePrefs(prefs)}
                    className="shrink-0 rounded-[14px] border-2 border-line2 bg-panel2 px-4 font-body text-[12px] font-bold text-paper transition hover:border-rust hover:text-rust"
                  >
                    save
                  </button>
                </div>
                <p className="mt-2 text-[12px] leading-relaxed text-faint">
                  Free tier, no card. Already configured via <span className="text-muted">.env</span> — only set
                  this to override it. Otherwise leave blank.
                </p>
              </div>
              <div>
                <label className="block font-body text-sm font-bold tracking-[0.01em] text-muted">
                  model
                </label>
                <input
                  type="text"
                  value={prefs.model}
                  onChange={(e) => setPrefs((p) => ({ ...p, model: e.target.value }))}
                  placeholder="deepseek-ai/DeepSeek-V3-0324"
                  spellCheck={false}
                  className="mt-2 w-full rounded-[14px] border-2 border-line bg-ink2/80 px-3.5 py-3 font-body text-[12px] text-paper outline-none transition focus:border-rust focus:ring-2 focus:ring-rust/10 placeholder:text-faint"
                />
                <p className="mt-2 text-[12px] leading-relaxed text-faint">
                  Any chat model enabled on your HF account. Default:
                  DeepSeek-V3.
                </p>
              </div>
            </div>
            <div className="border-t border-line px-5 py-3.5 text-[12px] text-faint">
              Need a token?{' '}
              <a
                href="https://huggingface.co/settings/tokens"
                target="_blank"
                rel="noopener"
                className="text-rust underline decoration-rust/40 underline-offset-2 hover:decoration-rust"
              >
                huggingface.co/settings/tokens
              </a>
            </div>
          </section>
        )}

        {/* editor */}
        <section
          onPaste={onEditorPaste}
          onDrop={onEditorDrop}
          onDragOver={onEditorDragOver}
          className="animate-entrance animate-delay-4 mt-12 overflow-hidden rounded-[24px] border-2 border-line2/60 bg-panel shadow-[0_2px_0_rgb(var(--color-paper)_/_0.1)] sm:mt-14"
        >
          <div className="flex items-center justify-between border-b-2 border-line px-5 py-4">
            <span className="font-head text-[15px] font-bold tracking-[-0.02em] text-paper">
              the text
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={pasteFromClipboard}
                className="rounded-lg px-2.5 py-1 font-body text-[11px] font-bold tracking-[0.03em] text-muted transition hover:bg-rust/10 hover:text-rust"
              >
                paste
              </button>
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleImageFile(f)
              e.target.value = ''
            }}
          />
          <div className="p-5 sm:p-6">
            <div className="mb-4 grid gap-2 sm:grid-cols-3">
              {SCENARIOS.map((s) => {
                const active = prefs.scenario === s.id
                return (
                  <button
                    key={s.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => savePrefs({ ...prefs, scenario: s.id })}
                    className={`rounded-[16px] border-2 px-4 py-3 text-left transition ${
                      active
                        ? 'border-rust/80 bg-rust/10 text-rust'
                        : 'border-line2 bg-ink2/40 text-muted hover:border-rust hover:text-rust'
                    }`}
                  >
                    <span
                      className={`block text-[10px] font-bold tracking-[0.1em] ${
                        active ? 'text-rust/70' : ''
                      }`}
                    >
                      {s.tag}
                    </span>
                    <span
                      className={`mt-0.5 block font-head text-[13px] font-bold tracking-[-0.01em] ${
                        active ? 'text-paper' : ''
                      }`}
                    >
                      {s.title}
                    </span>
                    <span
                      className={`mt-0.5 block text-[11px] leading-snug ${
                        active ? 'text-paper/60' : 'text-faint'
                      }`}
                    >
                      {s.description}
                    </span>
                  </button>
                )
              })}
            </div>
            <div className="relative">
              <textarea
                ref={taRef}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value)
                  autoGrow()
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    gen()
                  }
                }}
                rows={3}
                maxLength={1000}
                placeholder={image ? 'optional — add a note or the exact message…' : prefs.scenario === 'icebreaker' ? 'optional — leave blank to open cold, or add a photo/story context…' : 'what they sent…'}
                spellCheck
                className="min-h-[128px] w-full resize-y rounded-[18px] border-2 border-line bg-ink2/80 px-4 py-4 pr-12 text-[16px] leading-relaxed text-paper outline-none transition placeholder:text-faint focus:border-rust focus:ring-4 focus:ring-rust/10"
              />
              <div className="absolute right-3 bottom-3.5 flex h-8 w-8 items-center justify-center">
                {!image && !imageBusy && (
                  <>
                    <span
                      aria-hidden
                      className="animate-hint-ring pointer-events-none absolute -inset-0.5 rounded-[11px] border-2 border-rust/60"
                    />
                    <button
                      onClick={pickImage}
                      className="animate-hint-bob absolute right-[calc(100%+10px)] flex items-center gap-1.5 rounded-full border-2 border-rust/40 bg-panel px-2.5 py-1 font-body text-[10px] font-bold whitespace-nowrap tracking-[0.02em] text-rust shadow-sm transition hover:border-rust hover:bg-rust/10"
                    >
                      add a screenshot
                      <span aria-hidden>→</span>
                    </button>
                  </>
                )}
                <button
                  onClick={pickImage}
                  disabled={imageBusy}
                  title="attach a screenshot"
                  aria-label="attach a screenshot"
                  className={`flex h-8 w-8 items-center justify-center rounded-[10px] border-2 text-[15px] leading-none font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    image
                      ? 'border-rust/60 bg-rust/10 text-rust'
                      : 'border-line2 text-muted hover:border-rust hover:text-rust'
                  }`}
                >
                  {imageBusy ? '…' : '+'}
                </button>
              </div>
            </div>
            {image && (
              <div className="mt-3 flex items-center gap-3 rounded-[14px] border-2 border-dashed border-line2/70 bg-ink2/40 p-3">
                <img
                  src={image}
                  alt="attached screenshot"
                  className="h-20 w-auto rounded-lg border border-line object-contain"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-semibold text-paper/80">
                    screenshot attached
                  </p>
                  <p className="text-[11px] leading-relaxed text-faint">
                    the ai reads this conversation to write your replies
                  </p>
                </div>
                <button
                  onClick={() => setImage(null)}
                  className="shrink-0 rounded-xl border-2 border-line2 px-3 py-1.5 font-body text-[11px] font-bold text-muted transition hover:border-rust hover:bg-rust/10 hover:text-paper"
                >
                  remove
                </button>
              </div>
            )}
            <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-wrap items-end gap-3.5">
                <label>
                  <span className="mb-2 block font-body text-[11px] font-bold tracking-[0.04em] text-muted/80">
                    reply in
                  </span>
                  <select
                    value={prefs.lang}
                    onChange={(e) => savePrefs({ ...prefs, lang: e.target.value })}
                    className={selectBaseClass}
                    style={selectStyle}
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l.value} value={l.value} className="bg-ink2 text-paper">
                        {l.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="mb-2 block font-body text-[11px] font-bold tracking-[0.04em] text-muted/80">
                    versions
                  </span>
                  <select
                    value={prefs.count}
                    onChange={(e) => savePrefs({ ...prefs, count: e.target.value })}
                    className={selectBaseClass}
                    style={selectStyle}
                  >
                    <option value="3" className="bg-ink2 text-paper">
                      3
                    </option>
                    <option value="5" className="bg-ink2 text-paper">
                      5
                    </option>
                  </select>
                </label>
              </div>
              <button
                onClick={gen}
                disabled={busy}
                className="inline-flex w-full items-center justify-center gap-2.5 rounded-[16px] border-2 border-rust bg-rust px-6 py-3.5 text-[14px] font-bold text-ink shadow-none transition hover:-translate-y-0.5 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {busy ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink/25 border-t-ink" />
                    working…
                  </>
                ) : (
                  <>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-[17px] w-[17px]"
                      aria-hidden
                    >
                      <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
                    </svg>
                    generate
                    <span className="font-mono text-[13px]">→</span>
                  </>
                )}
              </button>
            </div>
            <p className="mt-3.5 text-[11px] font-semibold tracking-[0.04em] text-faint">
              [enter] to generate · paste, drag or ctrl/⌘+v a screenshot · [shift]+[enter] for a new line
            </p>
          </div>
        </section>

        {/* results */}
        <section className="animate-entrance animate-delay-5 mt-16 sm:mt-20">
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-3">
            <span className="font-head text-[15px] font-bold tracking-[-0.02em] text-paper">
              your options
            </span>
            {meta && (
              <span className="text-[12px] font-semibold tracking-[0.02em] text-faint">
                {meta}
              </span>
            )}
          </div>

          {busy ? (
            <div className="flex flex-col gap-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="shimmer h-[148px] border border-line" />
              ))}
            </div>
          ) : replies && replies.length > 0 ? (
            <div className="flex flex-col gap-3">
              {replies.map((r, i) => (
                <article
                  key={i}
                  className="animate-fadeUp overflow-hidden rounded-[22px] border-2 border-line2/60 bg-panel/90 shadow-[0_2px_0_rgb(var(--color-paper)_/_0.1)] transition hover:border-rust"
                  style={{ animationDelay: i * 60 + 'ms' }}
                >
                  <div className="flex items-center justify-between border-b-2 border-line px-5 py-3.5">
                    <span className="font-body text-[11px] font-bold tracking-[0.06em] text-paper/70">
                      {r.vibe}
                    </span>
                  </div>
                  <div className="px-5 py-5">
                    <p className="whitespace-pre-wrap break-words text-[16px] leading-relaxed text-paper/90">
                      {r.reply}
                    </p>
                    {(r.yes || r.no) && (
                      <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                        {r.yes && (
                          <div className="rounded-xl border-2 border-line2/70 bg-ink2/40 p-3">
                            <p className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold tracking-[0.08em] text-emerald-500 uppercase">
                                if yes
                              </span>
                              <button
                                onClick={(e) => copy(r.yes!, e.currentTarget)}
                                className="rounded-md border border-line2 px-1.5 py-0.5 font-body text-[10px] font-bold text-muted transition hover:border-emerald-500/60 hover:text-emerald-500"
                              >
                                <span data-copy-label>copy</span>
                              </button>
                            </p>
                            <p className="mt-1.5 text-[13.5px] leading-relaxed text-paper/85">
                              {r.yes}
                            </p>
                          </div>
                        )}
                        {r.no && (
                          <div className="rounded-xl border-2 border-line2/70 bg-ink2/40 p-3">
                            <p className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold tracking-[0.08em] text-rust uppercase">
                                if no
                              </span>
                              <button
                                onClick={(e) => copy(r.no!, e.currentTarget)}
                                className="rounded-md border border-line2 px-1.5 py-0.5 font-body text-[10px] font-bold text-muted transition hover:border-rust/60 hover:text-rust"
                              >
                                <span data-copy-label>copy</span>
                              </button>
                            </p>
                            <p className="mt-1.5 text-[13.5px] leading-relaxed text-paper/85">
                              {r.no}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="mt-4 flex items-center gap-2">
                      <button
                        onClick={(e) => copy(r.reply, e.currentTarget)}
                        className="rounded-xl border-2 border-line2 px-3 py-1.5 font-body text-[11px] font-bold tracking-[0.03em] text-muted transition hover:border-rust hover:bg-rust/10 hover:text-paper"
                      >
                        <span data-copy-label>copy</span>
                      </button>
                      <button
                        onClick={() => swap(i, r.vibe, message.trim())}
                        disabled={!!swapping.current[i]}
                        className="rounded-xl border-2 border-line2 px-3 py-1.5 font-body text-[11px] font-bold text-muted transition hover:border-rust hover:bg-rust/10 hover:text-paper disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {swapping.current[i] ? 'replacing…' : 'replace'}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-[24px] border-2 border-dashed border-line2/80 bg-panel/55 px-6 py-16 text-center shadow-[0_2px_0_rgb(var(--color-paper)_/_0.08)]">
              <p className="font-head text-[15px] font-bold tracking-[-0.02em] text-muted">
                awaiting input
              </p>
              <p className="mt-2.5 text-sm text-muted">
                paste the message or a screenshot, hit{' '}
                <span className="font-body text-[12px] font-bold text-paper">
                  generate
                </span>
                .
              </p>
            </div>
          )}
        </section>

        {/* footer */}
        <footer className="animate-entrance animate-delay-6 mt-20 flex flex-col items-start gap-3 border-t-2 border-line py-7 text-[11px] font-semibold tracking-[0.05em] text-faint sm:flex-row sm:items-center sm:justify-between">
          <span className="font-head text-[13px] font-bold tracking-[-0.01em] text-paper">
            rizzup 2026
          </span>
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>free hf inference</span>
            <span>nothing stored</span>
          </span>
        </footer>
      </main>

      {/* toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 w-[calc(100vw-2rem)] max-w-max -translate-x-1/2 animate-fadeUp rounded-xl border border-line border-l-2 border-l-rust bg-panel2 px-4 py-3 text-center font-body text-[11px] font-bold tracking-[0.04em] shadow-2xl">
          {toast.msg}
        </div>
      )}
    </div>
  )
}
