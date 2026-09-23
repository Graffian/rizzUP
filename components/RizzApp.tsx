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
      showToast('paste a message first', true)
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
    'cursor-pointer appearance-none rounded-xl border border-line bg-ink2/80 px-3.5 py-2.5 pr-8 font-mono text-[11px] uppercase tracking-[0.1em] text-paper outline-none transition hover:border-line2 focus:border-rust focus:ring-2 focus:ring-rust/10'

  const selectStyle = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23657078' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 9px center',
  } as const

  return (
    <div className="relative isolate min-h-screen overflow-hidden text-paper">
      <div className="fixed inset-0 -z-20 bg-ink" />
      <div
        className="fixed inset-0 -z-20"
        style={{
          background:
            'radial-gradient(720px 480px at 92% -10%, rgba(238,109,82,0.11), transparent 64%), radial-gradient(620px 480px at -10% 105%, rgba(220,174,63,0.08), transparent 62%)',
        }}
      />

      <main className="relative z-10 mx-auto w-full max-w-[980px] px-5 py-6 sm:px-10 sm:py-10 lg:py-14">
        {/* header */}
        <header className="animate-entrance animate-delay-1 flex items-center justify-between pb-2">
          <div>
            <div className="inline-flex rounded-xl bg-[#202a31] px-3 py-2 shadow-sm">
              <img
                src="/rizzup-wordmark-128h.png"
                srcSet="/rizzup-wordmark-256h.png 2x, /rizzup-wordmark-512h.png 4x"
                alt="RizzUp"
                className="h-7 w-auto select-none sm:h-8"
              />
            </div>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted/70">
              a wingman in your pocket
            </p>
          </div>
          <button
            onClick={() => setShowSettings((v) => !v)}
            className="flex items-center gap-2 rounded-full border border-line2/80 bg-panel/60 px-3.5 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted transition hover:border-paper/30 hover:bg-panel hover:text-paper"
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
        <section className="mt-16 grid items-end gap-12 sm:mt-20 md:grid-cols-[minmax(0,1fr)_280px] md:gap-16">
          <div className="animate-entrance animate-delay-2 max-w-3xl">
            <p className="mb-5 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-rust">better words, less overthinking</p>
            <h1 className="max-w-2xl font-head text-[44px] font-bold leading-[0.98] tracking-[-0.045em] sm:text-[72px]">
              Reply like you{' '}
              <em className="font-serifit font-normal italic text-rust">mean it.</em>
            </h1>
            <p className="mt-6 max-w-xl text-[16px] leading-[1.65] text-muted">
              Paste the message. Get a handful of replies that sound like you on a
              good day — one to tease, one to charm, one to keep short. No pickup
              lines. No cringe. Built on a free AI.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-semibold tracking-[0.1em] text-muted/80">
              <span>13 languages</span>
              <span className="text-rust">↯</span>
              <span>enter to generate</span>
              <span className="text-rust">↯</span>
              <span>nothing stored</span>
            </div>
          </div>
          <div className="animate-entrance animate-delay-3 relative hidden overflow-hidden rounded-2xl border border-line bg-panel/70 p-5 shadow-[0_18px_50px_rgba(32,42,49,0.06)] md:block">
            <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-rust/10 blur-2xl" />
            <div className="relative">
              <div className="flex items-center justify-between border-b border-line pb-4">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">your energy</span>
                <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-rust">
                  <span className="h-1.5 w-1.5 rounded-full bg-rust" /> live
                </span>
              </div>
              <p className="mt-5 font-head text-[21px] font-bold leading-tight tracking-[-0.03em] text-paper">
                Specific beats smooth.
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">
                Pick a direction and we’ll find the words that sound like you.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-rust px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-ink">playful</span>
                <span className="rounded-full border border-line2 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">warm</span>
                <span className="rounded-full border border-line2 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">direct</span>
              </div>
            </div>
          </div>
        </section>

        {/* settings */}
        {showSettings && (
          <section className="mt-10 animate-fadeIn overflow-hidden rounded-2xl border border-line bg-panel/90 shadow-2xl shadow-black/10">
            <div className="border-b border-line px-5 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              <span className="text-rust">02</span>&ensp;/&ensp;api access
            </div>
            <div className="grid gap-7 p-5 sm:p-6 md:grid-cols-[1.4fr_1fr]">
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
                    className="w-full flex-1 rounded-xl border border-line bg-ink2/80 px-3.5 py-3 text-[13.5px] text-paper outline-none transition focus:border-rust focus:ring-2 focus:ring-rust/10 placeholder:text-faint"
                  />
                  <button
                    onClick={() => savePrefs(prefs)}
                    className="shrink-0 rounded-xl border border-line2 bg-panel2 px-4 font-mono text-[10px] uppercase tracking-[0.14em] text-paper transition hover:border-rust hover:text-rust"
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
                  className="mt-2 w-full rounded-xl border border-line bg-ink2/80 px-3.5 py-3 font-mono text-[12px] text-paper outline-none transition focus:border-rust focus:ring-2 focus:ring-rust/10 placeholder:text-faint"
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
        <section className="animate-entrance animate-delay-4 mt-12 overflow-hidden rounded-2xl border border-line bg-panel shadow-[0_18px_50px_rgba(32,42,49,0.08)] sm:mt-14">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              <span className="mr-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rust px-1.5 text-[9px] font-bold text-ink">01</span> the text
            </span>
            <button
              onClick={pasteFromClipboard}
              className="rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-muted transition hover:bg-rust/10 hover:text-rust"
            >
              paste
            </button>
          </div>
          <div className="p-5 sm:p-6">
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
              placeholder="what they sent…"
              spellCheck
              className="min-h-[128px] w-full resize-y rounded-xl border border-line bg-ink2/80 px-4 py-4 text-[16px] leading-relaxed text-paper outline-none transition focus:border-rust focus:ring-4 focus:ring-rust/10 placeholder:text-faint"
            />
            <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
              <div className="flex flex-wrap items-end gap-3.5">
                <label>
                  <span className="mb-2 block font-mono text-[9px] uppercase tracking-[0.16em] text-muted/75">
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
                  <span className="mb-2 block font-mono text-[9px] uppercase tracking-[0.16em] text-muted/75">
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
                className="inline-flex items-center gap-2.5 rounded-xl bg-rust px-6 py-3.5 text-[14px] font-semibold text-ink shadow-lg shadow-rust/10 transition hover:-translate-y-0.5 hover:bg-[#ff9b7e] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
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
        <section className="animate-entrance animate-delay-5 mt-16 sm:mt-20">
          <div className="mb-5 flex items-baseline justify-between border-b border-line pb-3">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              <span className="mr-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rust px-1.5 text-[9px] font-bold text-ink">03</span> your options
            </span>
            {meta && (
              <span className="text-[11px] font-medium tracking-[0.08em] text-faint">
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
                  className="animate-fadeUp overflow-hidden rounded-2xl border border-line bg-panel/90 shadow-lg shadow-black/5 transition hover:border-line2 hover:bg-panel2/70"
                  style={{ animationDelay: i * 60 + 'ms' }}
                >
                  <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
                    <span className="font-mono text-[13px] text-rust">{num(i)}</span>
                    <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-paper/70">
                      {r.vibe}
                    </span>
                  </div>
                  <div className="px-5 py-5">
                    <p className="whitespace-pre-wrap break-words text-[16px] leading-relaxed text-paper/90">
                      {r.reply}
                    </p>
                    <div className="mt-4 flex items-center gap-2">
                      <button
                        onClick={(e) => copy(r.reply, e.currentTarget)}
                        className="rounded-lg border border-line2 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted transition hover:border-rust hover:bg-rust/10 hover:text-paper"
                      >
                        <span data-copy-label>copy</span>
                      </button>
                      <button
                        onClick={() => swap(i, r.vibe, message.trim())}
                        disabled={!!swapping.current[i]}
                        className="rounded-lg border border-line2 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted transition hover:border-rust hover:bg-rust/10 hover:text-paper disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {swapping.current[i] ? 'replacing…' : 'replace'}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-line2/80 bg-panel/40 px-6 py-16 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-faint">
                awaiting input
              </p>
              <p className="mt-2.5 text-sm text-muted">
                paste the message, hit{' '}
                <span className="font-mono text-[12px] uppercase tracking-[0.1em] text-paper">
                  generate
                </span>
                .
              </p>
            </div>
          )}
        </section>

        {/* footer */}
        <footer className="animate-entrance animate-delay-6 mt-20 flex flex-wrap items-center justify-between gap-3 border-t border-line py-7 text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">
          <span>
            rizzup <span className="text-rust">✳</span> 2026
          </span>
          <span className="flex items-center gap-2">
            free hf inference <span className="text-line2">·</span> nothing stored
          </span>
        </footer>
      </main>

      {/* toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-fadeUp rounded-xl border border-line border-l-2 border-l-rust bg-panel2 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.1em] shadow-2xl">
          {toast.msg}
        </div>
      )}
    </div>
  )
}
