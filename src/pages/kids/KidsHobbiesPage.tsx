import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { DemoOnboardingBanner } from '../../components/onboarding/DemoOnboardingBanner'
import { useI18n } from '../../lib/i18n'
import { getKidsHub, hobbyDiscoveryChips, subscribeKidsHub, toggleKidsHobby } from '../../lib/kidsHub'
import { cn } from '../../lib/utils'

export function KidsHobbiesPage() {
  const { t } = useI18n()
  const [hobbies, setHobbies] = useState(() => getKidsHub().hobbies)

  useEffect(() => subscribeKidsHub(() => setHobbies(getKidsHub().hobbies)), [])

  const toggle = (name: string) => {
    toggleKidsHobby(name)
    setHobbies(getKidsHub().hobbies)
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-scroll-chrome">
      <Link to="/kids" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft size={16} /> {t('kids.hub.back')}
      </Link>
      <DemoOnboardingBanner />
      <h1 className="text-xl font-bold">{t('kids.pillar.hobbies')}</h1>
      <p className="text-sm text-muted">{t('kids.hobbies.lead')}</p>
      <div className="flex flex-wrap gap-2">
        {hobbyDiscoveryChips().map((name) => {
          const active = hobbies.includes(name)
          return (
            <button
              key={name}
              type="button"
              onClick={() => toggle(name)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-sm',
                active ? 'border-cyan bg-cyan/15 text-cyan' : 'border-border bg-surface-2 text-muted',
              )}
            >
              {name}
            </button>
          )
        })}
      </div>
    </div>
  )
}
