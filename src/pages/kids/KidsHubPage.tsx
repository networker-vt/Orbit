import { Link } from 'react-router-dom'
import {
  Camera,
  Gamepad2,
  GraduationCap,
  Heart,
  Settings,
  Sparkles,
  Target,
} from 'lucide-react'
import { OrbitRobot } from '../../components/home/OrbitRobot'
import { DemoOnboardingBanner } from '../../components/onboarding/DemoOnboardingBanner'
import { Badge } from '../../components/ui/Badge'
import { ButtonLink } from '../../components/ui/Button'
import { useI18n } from '../../lib/i18n'
import { kidsAgeBand } from '../../lib/kids'
import { getKidsHub } from '../../lib/kidsHub'

const PILLARS = [
  { to: '/kids/spiele', icon: Gamepad2, key: 'kids.pillar.games' as const, hint: 'kids.pillar.gamesHint' as const },
  { to: '/kids/lernen', icon: GraduationCap, key: 'kids.pillar.learn' as const, hint: 'kids.pillar.learnHint' as const },
  { to: '/kids/hobbies', icon: Heart, key: 'kids.pillar.hobbies' as const, hint: 'kids.pillar.hobbiesHint' as const },
  { to: '/kids/natur', icon: Camera, key: 'kids.pillar.nature' as const, hint: 'kids.pillar.natureHint' as const },
  { to: '/kids/passung', icon: Target, key: 'kids.pillar.fit' as const, hint: 'kids.pillar.fitHint' as const },
]

export function KidsHubPage() {
  const { t } = useI18n()
  const hub = getKidsHub()
  const band = kidsAgeBand()

  return (
    <div className="mx-auto max-w-lg space-y-5 pb-scroll-chrome" data-kids-hub="1">
      <DemoOnboardingBanner />
      <header className="flex flex-col items-center gap-3 text-center">
        <OrbitRobot motion="winken" size="hero" />
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--theme-accent)]">Orbit Kids</p>
          <h1 className="text-2xl font-bold tracking-tight">{t('kids.hub.title')}</h1>
          <p className="mt-1 text-sm text-muted">{t('kids.hub.lead')}</p>
          {band && (
            <p className="mt-2 text-xs text-muted">
              {t('kids.ageTitle')}: {t(`kids.band.${band}`)} · {t('kids.hub.until18')}
            </p>
          )}
        </div>
        <Badge tone="amber">Demo</Badge>
      </header>

      {hub.hobbies.length > 0 && (
        <p className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs text-muted">
          {t('kids.hub.savedHobbies')}: {hub.hobbies.join(', ')}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {PILLARS.map(({ to, icon: Icon, key, hint }) => (
          <Link
            key={to}
            to={to}
            className="card-hover flex flex-col gap-2 rounded-2xl border border-border bg-surface-2 p-4 text-left"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--theme-accent)]/15 text-[var(--theme-accent)]">
              <Icon size={20} />
            </span>
            <span className="font-semibold text-ink">{t(key)}</span>
            <span className="text-xs text-muted">{t(hint)}</span>
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <ButtonLink to="/kids/einstellungen" variant="secondary">
          <Settings size={16} /> {t('kids.settings')}
        </ButtonLink>
        <ButtonLink to="/campus" variant="ghost">
          <Sparkles size={16} /> {t('campus.nav')}
        </ButtonLink>
      </div>
    </div>
  )
}
