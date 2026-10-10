import { Languages } from 'lucide-react'
import { MessengerTranslateControls } from './MessengerTranslateControls'
import { useMessengerTranslatePrefs } from '../../hooks/useMessengerTranslate'
import { useI18n } from '../../lib/i18n'
import { translateProviderHint } from '../../lib/orbitTranslate'

export function MessengerTranslateSettings() {
  const { t } = useI18n()
  const { prefs, setPrefs } = useMessengerTranslatePrefs(null)

  return (
    <section className="rounded-2xl border border-border bg-surface-2 p-4" id="messenger-translate">
      <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
        <Languages size={18} className="text-[var(--theme-accent)]" /> {t('translate.settingsTitle')}
      </h2>
      <p className="mb-3 text-xs text-muted">{t('translate.settingsHint')}</p>
      <MessengerTranslateControls prefs={prefs} onChange={(patch) => setPrefs(patch, 'global')} showMic={false} />
      <p className="mt-3 text-xs text-muted">
        {t('translate.provider')}: {translateProviderHint()}
      </p>
    </section>
  )
}
