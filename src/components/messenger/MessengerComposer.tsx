import { useEffect, useState } from 'react'
import { Button } from '../ui/Button'
import { translateOutgoingPreview, useMessengerTranslatePrefs } from '../../hooks/useMessengerTranslate'
import { assessInputSafety, MESSENGER_BLOCKED_DE, MESSENGER_BLOCKED_EN } from '../../lib/contentSafety'
import { isKidsMode } from '../../lib/kids'
import { useI18n } from '../../lib/i18n'
import { canListen, listenOnce } from '../../lib/speech'
import { speakText } from '../../lib/tts'
import { speechLangForIso } from '../../lib/translateLanguages'
import { MessengerTranslateControls } from './MessengerTranslateControls'

type Props = {
  threadKey: string
  placeholder: string
  sendLabel: string
  onSend: (body: string) => void
  className?: string
  showTranslateBar?: boolean
}

export function MessengerComposer({
  threadKey,
  placeholder,
  sendLabel,
  onSend,
  className,
  showTranslateBar = true,
}: Props) {
  const { t, locale } = useI18n()
  const { prefs, setPrefs, resetThread, threadOverride } = useMessengerTranslatePrefs(threadKey)
  const [body, setBody] = useState('')
  const [listening, setListening] = useState(false)
  const [blocked, setBlocked] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    if (!prefs.enabled || !body.trim() || prefs.myLang === prefs.partnerLang) {
      setPreview(null)
      return
    }
    let cancelled = false
    const handle = window.setTimeout(() => {
      void translateOutgoingPreview(body, prefs.myLang, prefs.partnerLang).then((out) => {
        if (cancelled) return
        setPreview(out.ok ? out.text : null)
      })
    }, 400)
    return () => {
      cancelled = true
      window.clearTimeout(handle)
    }
  }, [body, prefs.enabled, prefs.myLang, prefs.partnerLang])

  const send = (e: React.FormEvent) => {
    e.preventDefault()
    const text = body.trim()
    if (!text) return
    const verdict = assessInputSafety(text, { kids: isKidsMode() })
    if (!verdict.ok) {
      setBlocked(locale === 'en' ? MESSENGER_BLOCKED_EN : MESSENGER_BLOCKED_DE)
      return
    }
    setBlocked(null)
    onSend(text)
    setBody('')
    setPreview(null)
  }

  const onMic = async () => {
    if (!canListen()) return
    setListening(true)
    const transcript = await listenOnce(speechLangForIso(prefs.myLang))
    setListening(false)
    if (transcript) {
      const next = body ? `${body} ${transcript}` : transcript
      setBody(next)
      if (prefs.ttsPreview && prefs.enabled && prefs.myLang !== prefs.partnerLang) {
        void translateOutgoingPreview(next, prefs.myLang, prefs.partnerLang).then((out) => {
          if (out.ok) speakText(out.text, speechLangForIso(prefs.partnerLang))
        })
      }
    }
  }

  return (
    <div className={className}>
      {showTranslateBar && (
        <div className="border-t border-border px-3 pt-2">
          <MessengerTranslateControls
            compact
            prefs={prefs}
            onChange={(patch) => setPrefs(patch, 'thread')}
            threadOverride={threadOverride}
            onResetThread={resetThread}
            showMic
            listening={listening}
            onMic={onMic}
            micDisabled={!canListen()}
          />
        </div>
      )}
      {prefs.enabled && preview && body.trim() && (
        <div className="border-t border-border/60 bg-surface-3/40 px-3 py-2 text-xs" data-outgoing-preview="1">
          <div className="font-medium uppercase tracking-wide text-muted">{t('translate.outgoingLabel')}</div>
          <div className="mt-1 whitespace-pre-wrap text-ink">{preview}</div>
        </div>
      )}
      {blocked && <p className="px-3 pt-2 text-xs text-rose-300">{blocked}</p>}
      <form
        onSubmit={send}
        className="flex items-end gap-2 border-t border-border bg-surface-2/95 p-3 safe-pb backdrop-blur"
      >
        <input
          value={body}
          onChange={(e) => {
            setBody(e.target.value)
            setBlocked(null)
          }}
          placeholder={placeholder}
          className="min-h-11 flex-1 rounded-xl border border-border bg-surface-3 px-3 text-sm outline-none focus:border-[var(--theme-accent)]"
          aria-label={placeholder}
          data-messenger-compose="1"
        />
        <Button type="submit" disabled={!body.trim()} className="shrink-0">
          {sendLabel}
        </Button>
      </form>
    </div>
  )
}
