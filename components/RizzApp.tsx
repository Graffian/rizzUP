'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

type Reply = { vibe: string; reply: string }
type Prefs = { token: string; model: string; lang: string; count: string }

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
}

function loadPrefs(): Prefs {
  if (typeof window === 'undefined') return initialPrefs
  let stored: Prefs | null = null
  try {
    stored = JSON.parse(localStorage.getItem('rz_prefs') || 'null')
  } catch {
    // ignore corrupt storage
  }
  return { ...initialPrefs, ...(stored || {}) }
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
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs)
  const [showSettings, setShowSettings] = useState(false)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [replies, setReplies] = useState<Reply[] | null>(null)
  const [meta, setMeta] = useState('')
  const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null)

  const taRef = useRef<HTMLTextAreaElement>(null)
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

  const gen = useCallback(async () => {
    if (busy) return
    const msg = message.trim()
    if (!msg) {
      showToast('paste her message first', true)
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
          language: prefs.lang,
          count: parseInt(prefs.count, 10) || 3,
          token: prefs.token,
          model: prefs.model,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Request failed')
      setReplies(data.replies || [])
      setMeta(`${prefs.count} versions · ${data.model || 'default model'}`)
    } catch (err) {
      showToast(errorMessage(err), true)
    } finally {
      setBusy(false)
    }
  }, [busy, message, prefs, showToast])

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
            vibe,
            language: prefs.lang,
            token: prefs.token,
            model: prefs.model,
          }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || 'Request failed')
        setReplies((prev) =>
          prev
            ? prev.map((r, i) => (i === index ? { ...r, reply: data.reply } : r))
            : prev
        )
      } catch (err) {
        showToast(errorMessage(err), true)
      } finally {
        swapping.current[index] = false
      }
    },
    [prefs, showToast]
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
    'cursor-pointer appearance-none rounded-[4px] border border-line bg-ink2 px-3 py-2 pr-8 font-mono text-[12px] uppercase tracking-[0.12em] text-paper outline-none transition hover:border-line2 focus:border-rust'

  const selectStyle = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238a857a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 9px center',
  } as const

  return (
    <div className="relative isolate min-h-screen text-paper">
      {/* backdrop */}
      <div className="fixed inset-0 -z-20 bg-ink" />
      <div
        className="fixed inset-0 -z-20"
        style={{
          background:
            'radial-gradient(900px 520px at 82% -8%, rgba(255,90,54,0.07), transparent 60%), radial-gradient(760px 520px at -8% 112%, rgba(255,180,84,0.05), transparent 60%)',
        }}
      />
      {/* giant watermark */}
      <div
        aria-hidden
        className="pointer-events-none fixed -right-8 top-6 z-0 select-none font-head text-[46vw] leading-none text-transparent sm:text-[30rem]"
        style={{ WebkitTextStroke: '1.5px rgba(244,241,234,0.045)' }}
      >
        R
      </div>

      <main className="relative z-10 mx-auto w-full max-w-[840px] px-5 py-8 sm:px-8 sm:py-10">
        {/* header */}
        <header className="flex items-end justify-between border-b border-line pb-4">
          <div>
            <div className="flex items-center gap-2.5 font-mono text-[13px] font-bold uppercase tracking-[0.3em] text-paper">
              rizzup
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-rust" />
            </div>
            <p className="mt-1.5 font-mono text-[10.5px] uppercase tracking-[0.22em] text-faint">
              a wingman in your pocket
            </p>
          </div>
          <button
            onClick={() => setShowSettings((v) => !v)}
            className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-muted transition hover:text-paper"
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
        </header>

        {/* hero */}
        <section className="mt-12 max-w-2xl sm:mt-16">
          <h1 className="font-head text-[40px] font-bold leading-[1.02] tracking-[-0.03em] sm:text-[60px]">
            Text her back like you{' '}
            <em className="font-serifit font-normal italic text-rust">mean it.</em>
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted">
            Paste what she sent. Get a handful of replies that sound like you on a
            good day — one to tease, one to charm, one to keep short. No pickup
            lines. No cringe. Built on a free AI.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-faint">
            <span>13 languages</span>
            <span className="text-rust">↯</span>
            <span>enter to generate</span>
            <span className="text-rust">↯</span>
            <span>nothing stored</span>
          </div>
        </section>

        {/* settings */}
        {showSettings && (
          <section className="mt-10 animate-fadeIn border border-line bg-panel">
            <div className="border-b border-line px-5 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
              <span className="text-rust">02</span>&ensp;/&ensp;api access
            </div>
            <div className="grid gap-6 p-5 md:grid-cols-[1.4fr_1fr]">
              <div>
                <label className="block font-mono text-[10.5px] uppercase tracking-[0.18em] text-faint">
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
                    className="w-full flex-1 rounded-[4px] border border-line bg-ink2 px-3.5 py-2.5 text-[13.5px] text-paper outline-none transition focus:border-rust placeholder:text-faint"
                  />
                  <button
                    onClick={() => savePrefs(prefs)}
                    className="shrink-0 rounded-[4px] border border-line2 bg-panel2 px-4 font-mono text-[11px] uppercase tracking-[0.15em] text-paper transition hover:border-rust hover:text-rust"
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
                <label className="block font-mono text-[10.5px] uppercase tracking-[0.18em] text-faint">
                  model
                </label>
                <input
                  type="text"
                  value={prefs.model}
                  onChange={(e) => setPrefs((p) => ({ ...p, model: e.target.value }))}
                  placeholder="deepseek-ai/DeepSeek-V3-0324"
                  spellCheck={false}
                  className="mt-2 w-full rounded-[4px] border border-line bg-ink2 px-3.5 py-2.5 font-mono text-[12px] text-paper outline-none transition focus:border-rust placeholder:text-faint"
                />
                <p className="mt-2 text-[12px] leading-relaxed text-faint">
                  Any chat model enabled on your HF account. Default:
                  DeepSeek-V3.
                </p>
              </div>
            </div>
            <div className="border-t border-line px-5 py-3 text-[12px] text-faint">
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
        <section className="mt-10 border border-line bg-panel">
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
              <span className="text-rust">01</span>&ensp;/&ensp;her message
            </span>
            <button
              onClick={pasteFromClipboard}
              className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted transition hover:text-rust"
            >
              paste
            </button>
          </div>
          <div className="p-5">
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
              placeholder="what she sent…"
              spellCheck
              className="min-h-[96px] w-full resize-y rounded-[4px] border border-line bg-ink2 px-4 py-3.5 text-[15.5px] leading-relaxed text-paper outline-none transition focus:border-rust placeholder:text-faint"
            />
            <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
              <div className="flex flex-wrap items-end gap-3.5">
                <label>
                  <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
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
                  <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
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
                className="inline-flex items-center gap-2.5 rounded-[5px] bg-rust px-6 py-3.5 text-[15px] font-semibold text-ink transition hover:bg-[#ff6f4a] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
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
            <p className="mt-3.5 font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
              [enter] to generate · [shift]+[enter] for a new line
            </p>
          </div>
        </section>

        {/* results */}
        <section className="mt-12">
          <div className="mb-4 flex items-baseline justify-between border-b border-line pb-2.5">
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
              <span className="text-rust">03</span>&ensp;/&ensp;your options
            </span>
            {meta && (
              <span className="font-mono text-[10.5px] uppercase tracking-[0.15em] text-faint">
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
                  className="animate-fadeUp border border-line bg-panel transition hover:border-line2"
                  style={{ animationDelay: i * 60 + 'ms' }}
                >
                  <div className="flex items-center justify-between border-b border-line px-5 py-2.5">
                    <span className="font-mono text-[13px] text-rust">{num(i)}</span>
                    <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-paper/70">
                      {r.vibe}
                    </span>
                  </div>
                  <div className="px-5 py-4">
                    <p className="whitespace-pre-wrap break-words text-[16px] leading-relaxed text-paper/90">
                      {r.reply}
                    </p>
                    <div className="mt-4 flex items-center gap-2">
                      <button
                        onClick={(e) => copy(r.reply, e.currentTarget)}
                        className="rounded-[4px] border border-line2 px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.15em] text-muted transition hover:border-rust hover:text-paper"
                      >
                        <span data-copy-label>copy</span>
                      </button>
                      <button
                        onClick={() => swap(i, r.vibe, message.trim())}
                        disabled={!!swapping.current[i]}
                        className="rounded-[4px] border border-line2 px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.15em] text-muted transition hover:border-rust hover:text-paper disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {swapping.current[i] ? 'replacing…' : 'replace'}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-line px-6 py-14 text-center">
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-faint">
                awaiting input
              </p>
              <p className="mt-2.5 text-sm text-muted">
                paste her message, hit{' '}
                <span className="font-mono text-[12px] uppercase tracking-[0.1em] text-paper">
                  generate
                </span>
                .
              </p>
            </div>
          )}
        </section>

        {/* footer */}
        <footer className="mt-14 flex flex-wrap items-center justify-between gap-3 border-t border-line py-6 font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
          <span>
            rizzup <span className="text-rust">✳</span> 2026
          </span>
          <span className="flex items-center gap-2">
            free hf inference <span className="text-line2">·</span> nothing stored
          </span>
        </footer>
      </main>

      {/* grain */}
      <div className="grain pointer-events-none fixed inset-0 z-30 opacity-[0.045]" aria-hidden />

      {/* toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-fadeUp border border-line border-l-2 border-l-rust bg-panel2 px-4 py-2.5 font-mono text-[11.5px] uppercase tracking-[0.12em] shadow-2xl">
          {toast.msg}
        </div>
      )}
    </div>
  )
}