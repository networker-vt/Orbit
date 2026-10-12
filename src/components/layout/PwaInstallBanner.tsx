import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Download, X } from 'lucide-react'
import { Button } from '../ui/Button'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'el_pwa_dismiss'

function isIos() {
  if (typeof navigator === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isStandalone() {
  if (typeof window === 'undefined') return true
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // @ts-expect-error iOS Safari
    window.navigator.standalone === true
  )
}

export function PwaInstallBanner() {
  const { pathname } = useLocation()
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [showIos, setShowIos] = useState(false)
  const [hidden, setHidden] = useState(true)

  useEffect(() => {
    if (isStandalone() || localStorage.getItem(DISMISS_KEY)) {
      setHidden(true)
      return
    }
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setHidden(false)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    if (isIos()) {
      setShowIos(true)
      setHidden(false)
    }
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1')
    setHidden(true)
    setDeferred(null)
    setShowIos(false)
  }

  const install = async () => {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    dismiss()
  }

  if (pathname === '/' || hidden || (!deferred && !showIos)) return null

  return (
    <div className="bottom-above-nav fixed inset-x-0 z-40 mx-auto max-w-lg px-3 md:bottom-4">
      <div className="flex items-start gap-3 rounded-2xl border border-cyan/30 bg-surface-2/95 p-3 shadow-xl backdrop-blur safe-px">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan/15 text-cyan">
          <Download size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Allda installieren</p>
          <p className="mt-0.5 text-xs text-muted">
            {showIos && !deferred
              ? 'iPhone/iPad: Teilen-Symbol → „Zum Home-Bildschirm“ → Hinzufügen. Danach wie eine App öffnen (Offline-Shell).'
              : 'Allda als App auf den Homescreen — Offline-Shell, schneller Start, kein Store nötig.'}
          </p>
          {deferred && (
            <Button size="sm" className="mt-2" onClick={install}>
              Jetzt installieren
            </Button>
          )}
        </div>
        <button
          type="button"
          aria-label="Schließen"
          onClick={dismiss}
          className="tap-target flex items-center justify-center rounded-lg text-muted hover:text-ink"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  )
}
