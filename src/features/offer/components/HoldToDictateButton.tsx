import { Mic } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
function canListen(): boolean {
  if (typeof window === 'undefined') return false
  const w = window as Window & {
    SpeechRecognition?: unknown
    webkitSpeechRecognition?: unknown
  }
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition)
}

type Props = {
  onTranscript: (text: string) => void
  disabled?: boolean
}

export function HoldToDictateButton({ onTranscript, disabled }: Props) {
  const [recording, setRecording] = useState(false)
  const recRef = useRef<{ stop: () => void } | null>(null)
  const supported = canListen()

  const stop = useCallback(() => {
    recRef.current?.stop()
    recRef.current = null
    setRecording(false)
  }, [])

  const start = useCallback(() => {
    if (disabled || !supported) return
    const w = window as Window & {
      SpeechRecognition?: new () => {
        lang: string
        interimResults: boolean
        maxAlternatives: number
        onresult: ((ev: { results: { 0: { 0: { transcript: string } } } }) => void) | null
        onerror: (() => void) | null
        onend: (() => void) | null
        start: () => void
        stop: () => void
      }
      webkitSpeechRecognition?: new () => {
        lang: string
        interimResults: boolean
        maxAlternatives: number
        onresult: ((ev: { results: { 0: { 0: { transcript: string } } } }) => void) | null
        onerror: (() => void) | null
        onend: (() => void) | null
        start: () => void
        stop: () => void
      }
    }
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition
    if (!Ctor) return
    const rec = new Ctor()
    rec.lang = 'de-DE'
    rec.interimResults = false
    rec.maxAlternatives = 1
    rec.onresult = (ev) => {
      const text = ev.results[0]?.[0]?.transcript ?? ''
      if (text.trim()) onTranscript(text.trim())
    }
    rec.onerror = () => stop()
    rec.onend = () => setRecording(false)
    recRef.current = rec
    setRecording(true)
    try {
      rec.start()
    } catch {
      stop()
    }
  }, [disabled, onTranscript, stop, supported])

  if (!supported) {
    return (
      <p className="text-sm text-muted">
        Diktat wird in diesem Browser nicht unterstützt. Bitte nutzen Sie Foto oder Tastatur.
      </p>
    )
  }

  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={recording}
      className={[
        'tap-target flex min-h-14 w-full select-none items-center justify-center gap-2 rounded-2xl border-2 px-4 text-base font-semibold touch-manipulation',
        recording
          ? 'border-rose-400 bg-rose-600/25 text-rose-50'
          : 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/15 text-ink',
        disabled ? 'opacity-50' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onPointerDown={(e) => {
        e.preventDefault()
        start()
      }}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
    >
      <Mic size={22} aria-hidden />
      {recording ? 'Loslassen zum Beenden' : 'Gedrückt halten zum Diktieren'}
    </button>
  )
}
