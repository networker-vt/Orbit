import { Languages, Mic, Volume2 } from 'lucide-react'
import { useI18n } from '../../lib/i18n'
import { TRANSLATE_LANGUAGES, translateLangLabel } from '../../lib/translateLanguages'
import { cn } from '../../lib/utils'
import type { MessengerTranslatePrefs } from '../../lib/messengerTranslatePrefs'

type Props = {
  prefs: MessengerTranslatePrefs
  onChange: (patch: Partial<MessengerTranslatePrefs>) => void
  compact?: boolean
  threadOverride?: boolean
  onResetThread?: () => void
  listening?: boolean
  onMic?: () => void
  micDisabled?: boolean
  showMic?: boolean
}

export function MessengerTranslateControls({
  prefs,
  onChange,
  compact,
  threadOverride,
  onResetThread,
  listening,
  onMic,
  micDisabled,
  showMic,
}: Props) {
  const { t, locale } = useI18n()
  const uiLocale = locale === 'en' ? 'en' : 'de'

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-surface-3/80',
        compact ? 'space-y-2 p-2' : 'space-y-3 p-3',
      )}
      data-messenger-translate="1"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="flex min-h-9 items-center gap-2 text-xs font-medium text-ink">
          <input
            type="checkbox"
            checked={prefs.enabled}
            onChange={(e) => onChange({ enabled: e.target.checked })}
          />
          <Languages size={14} className="text-[var(--theme-accent)]" />
          {t('translate.enable')}
        </label>
        {threadOverride && onResetThread && (
          <button type="button" className="text-xs text-[var(--theme-accent)] hover:underline" onClick={onResetThread}>
            {t('translate.useGlobal')}
          </button>
        )}
      </div>

      {prefs.enabled && (
        <>
          <div className={cn('grid gap-2', compact ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2')}>
            <label className="block text-xs text-muted">
              {t('translate.myLang')}
              <select
                className="mt-1 w-full min-h-9 rounded-lg border border-border bg-surface-2 px-2 text-sm text-ink"
                value={prefs.myLang}
                onChange={(e) => onChange({ myLang: e.target.value })}
              >
                {TRANSLATE_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {translateLangLabel(l.code, uiLocale)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-muted">
              {t('translate.partnerLang')}
              <select
                className="mt-1 w-full min-h-9 rounded-lg border border-border bg-surface-2 px-2 text-sm text-ink"
                value={prefs.partnerLang}
                onChange={(e) => onChange({ partnerLang: e.target.value })}
              >
                {TRANSLATE_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {translateLangLabel(l.code, uiLocale)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-wrap gap-3 text-xs text-muted">
            <label className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={prefs.autoDetectIncoming}
                onChange={(e) => onChange({ autoDetectIncoming: e.target.checked })}
              />
              {t('translate.autoDetect')}
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={prefs.ttsPreview}
                onChange={(e) => onChange({ ttsPreview: e.target.checked })}
              />
              <Volume2 size={12} /> {t('translate.ttsPreview')}
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={prefs.ttsIncoming}
                onChange={(e) => onChange({ ttsIncoming: e.target.checked })}
              />
              <Volume2 size={12} /> {t('translate.ttsIncoming')}
            </label>
          </div>

          {showMic && onMic && (
            <button
              type="button"
              disabled={micDisabled}
              onClick={onMic}
              className={cn(
                'flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border text-sm font-medium',
                listening
                  ? 'border-rose-500/60 bg-rose-500/15 text-rose-100'
                  : 'border-border bg-surface-2 hover:border-[var(--theme-accent)]/50',
              )}
              data-messenger-mic="1"
            >
              <Mic size={16} /> {listening ? t('translate.listening') : t('translate.speak')}
            </button>
          )}
        </>
      )}
    </div>
  )
}
