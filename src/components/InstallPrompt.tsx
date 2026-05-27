import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED_KEY = 'pwa-install-dismissed-at'
const DISMISS_DAYS = 14

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function isIos(): boolean {
  const ua = navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua) && !('MSStream' in window)
}

function wasRecentlyDismissed(): boolean {
  const raw = localStorage.getItem(DISMISSED_KEY)
  if (!raw) return false
  const at = Number(raw)
  if (Number.isNaN(at)) return false
  return Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [showIosHint, setShowIosHint] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (isStandalone() || wasRecentlyDismissed()) return

    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setDeferred(null)
      setShowIosHint(false)
    }

    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)

    if (isIos()) setShowIosHint(true)

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (dismissed) return null
  if (!deferred && !showIosHint) return null

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()))
    setDismissed(true)
  }

  async function handleInstall() {
    if (!deferred) return
    await deferred.prompt()
    const choice = await deferred.userChoice
    setDeferred(null)
    if (choice.outcome === 'dismissed') handleDismiss()
  }

  return (
    <section className="rounded-xl border border-emerald-900 bg-emerald-950/30 p-4 flex items-start gap-3">
      <div className="shrink-0 mt-0.5 w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-emerald-400"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <div>
          <p className="text-sm font-semibold">Instalar Toque Aquela</p>
          <p className="text-xs text-zinc-400 mt-0.5">
            {deferred
              ? 'Tenha acesso rápido pelo celular ou computador, mesmo offline.'
              : 'No Safari, toque em Compartilhar e depois em "Adicionar à Tela de Início".'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {deferred && (
            <button
              type="button"
              onClick={handleInstall}
              className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold transition-colors"
            >
              Instalar
            </button>
          )}
          <button
            type="button"
            onClick={handleDismiss}
            className="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white text-xs transition-colors"
          >
            Agora não
          </button>
        </div>
      </div>
    </section>
  )
}
