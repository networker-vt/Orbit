import { useNavigate } from 'react-router-dom'
import { Shield, Sparkles } from 'lucide-react'
import { OrbitWordmarkHero } from '../../components/brand/OrbitWordmarkHero'
import { OrbitRobot } from '../../components/home/OrbitRobot'
import { DemoOnboardingBanner } from '../../components/onboarding/DemoOnboardingBanner'
import { useI18n } from '../../lib/i18n'
import { chooseProductMode } from '../../lib/registration'

export function ModeChooserPage() {
  const { t } = useI18n()
  const navigate = useNavigate()

  const pick = (mode: 'orbit' | 'kids') => {
    chooseProductMode(mode)
    navigate(mode === 'kids' ? '/willkommen/kids' : '/willkommen/orbit')
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 py-6" data-onboarding-chooser="1">
      <DemoOnboardingBanner />
      <header className="text-center">
        <h1 className="text-2xl font-bold">{t('onboarding.chooser.title')}</h1>
        <p className="mt-2 text-sm text-muted">{t('onboarding.chooser.lead')}</p>
      </header>

      <button
        type="button"
        onClick={() => pick('orbit')}
        className="card-hover w-full rounded-2xl border-2 border-border bg-surface-2 p-5 text-left hover:border-cyan/50"
      >
        <OrbitWordmarkHero className="mb-3" />
        <p className="flex items-center gap-2 font-semibold text-ink">
          <Sparkles size={18} className="text-cyan" /> {t('onboarding.chooser.orbitTitle')}
        </p>
        <p className="mt-1 text-sm text-muted">{t('onboarding.chooser.orbitHint')}</p>
      </button>

      <button
        type="button"
        onClick={() => pick('kids')}
        className="card-hover w-full rounded-2xl border-2 border-border bg-surface-2 p-5 text-left hover:border-[var(--theme-accent)]/50"
        data-onboarding-kids-card="1"
      >
        <div className="mb-3 flex justify-center">
          <OrbitRobot motion="winken" size="compact" />
        </div>
        <p className="flex items-center gap-2 font-semibold text-ink">
          <Shield size={18} /> {t('onboarding.chooser.kidsTitle')}
        </p>
        <p className="mt-1 text-sm text-muted">{t('onboarding.chooser.kidsHint')}</p>
        <ul className="mt-3 space-y-1 text-xs text-muted">
          <li>{t('kids.pillar.games')}</li>
          <li>{t('kids.pillar.learn')}</li>
          <li>{t('kids.pillar.hobbies')}</li>
          <li>{t('kids.pillar.nature')}</li>
          <li>{t('kids.pillar.fit')}</li>
        </ul>
      </button>

      <p className="text-center text-xs text-muted">{t('onboarding.chooser.switchLater')}</p>
    </div>
  )
}
