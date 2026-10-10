import { useNavigate } from 'react-router-dom'
import { HOME_DAILY_PRESETS, dailyPresetLabel } from '../../lib/homeDailyPresets'
import { useI18n } from '../../lib/i18n'

export function HomeDailyPresets() {
  const navigate = useNavigate()
  const { t, resolved } = useI18n()

  return (
    <div
      role="group"
      aria-label={t('home.dailyPresetsAria')}
      data-home-daily-presets="1"
      className="flex flex-wrap gap-2"
    >
      {HOME_DAILY_PRESETS.map((preset) => (
        <button
          key={preset.id}
          type="button"
          data-home-daily-preset={preset.id}
          onClick={() => navigate(preset.to)}
          className="min-h-10 rounded-full border border-[var(--theme-accent)]/30 bg-surface-2 px-3 py-1.5 text-sm text-ink hover:border-[var(--theme-accent)]/60"
        >
          {dailyPresetLabel(preset, resolved)}
        </button>
      ))}
    </div>
  )
}
