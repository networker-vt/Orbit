import { useEffect } from 'react'
import { useIncomingTranslation } from '../../hooks/useMessengerTranslate'
import { useI18n } from '../../lib/i18n'
import { speakText } from '../../lib/tts'
import { speechLangForIso } from '../../lib/translateLanguages'

type Props = {
  messageId: string
  body: string
  mine: boolean
  senderName?: string
  footer?: React.ReactNode
  timestamp?: React.ReactNode
  bubbleClass: string
  enabled: boolean
  myLang: string
  partnerLang: string
  autoDetect: boolean
  ttsIncoming: boolean
}

export function TranslatedMessageBubble({
  messageId,
  body,
  mine,
  senderName,
  footer,
  timestamp,
  bubbleClass,
  enabled,
  myLang,
  partnerLang,
  autoDetect,
  ttsIncoming,
}: Props) {
  const { t } = useI18n()
  const incoming = useIncomingTranslation({
    messageId,
    body,
    mine,
    enabled,
    myLang,
    partnerLang,
    autoDetect,
  })

  useEffect(() => {
    if (!enabled || mine || !ttsIncoming || incoming.status !== 'ok') return
    speakText(incoming.text, speechLangForIso(myLang))
  }, [enabled, mine, ttsIncoming, incoming.status, incoming.status === 'ok' ? incoming.text : '', myLang])

  const showTranslation =
    enabled && !mine && incoming.status === 'ok' && incoming.text.trim() && incoming.text.trim() !== body.trim()

  return (
    <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${bubbleClass}`} data-message-bubble="1">
      {!mine && senderName && <div className="mb-0.5 text-xs opacity-70">{senderName}</div>}
      <div className="whitespace-pre-wrap">{body}</div>
      {showTranslation && (
        <div className="mt-2 rounded-lg border border-white/10 bg-black/15 px-2 py-1.5 text-xs" data-translated="1">
          <div className="mb-0.5 font-medium uppercase tracking-wide opacity-70">{t('translate.incomingLabel')}</div>
          <div className="whitespace-pre-wrap">{incoming.text}</div>
        </div>
      )}
      {enabled && !mine && incoming.status === 'loading' && (
        <p className="mt-1 text-xs opacity-70">{t('translate.loading')}</p>
      )}
      {enabled && !mine && incoming.status === 'error' && (
        <p className="mt-1 text-xs text-amber-200/90">{t('translate.unavailable')}</p>
      )}
      {footer}
      {timestamp}
    </div>
  )
}
