import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { ButtonLink } from '../../components/ui/Button'
import { DemoOnboardingBanner } from '../../components/onboarding/DemoOnboardingBanner'
import { useI18n } from '../../lib/i18n'
import { learnTasksForBand } from '../../lib/kidsHub'

export function KidsLernenPage() {
  const { t } = useI18n()
  const tasks = learnTasksForBand()

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-scroll-chrome">
      <Link to="/kids" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft size={16} /> {t('kids.hub.back')}
      </Link>
      <DemoOnboardingBanner />
      <h1 className="text-xl font-bold">{t('kids.pillar.learn')}</h1>
      <p className="text-sm text-muted">{t('kids.lernen.lead')}</p>
      <ul className="space-y-3">
        {tasks.map((task) => (
          <li key={task.id} className="rounded-2xl border border-border bg-surface-2 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold">{task.title}</span>
              <Badge>{task.minutes} min</Badge>
            </div>
            <p className="mt-2 text-sm text-muted">{task.prompt}</p>
          </li>
        ))}
      </ul>
      <ButtonLink to="/campus" variant="secondary">
        {t('kids.lernen.campusLink')}
      </ButtonLink>
    </div>
  )
}
