import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input, Textarea } from '../../components/ui/Input'
import { DemoOnboardingBanner } from '../../components/onboarding/DemoOnboardingBanner'
import { useI18n } from '../../lib/i18n'
import { getKidsHub, saveKidsHub } from '../../lib/kidsHub'
import { useState } from 'react'

export function KidsSpielePage() {
  const { t } = useI18n()
  const initial = getKidsHub().game
  const [title, setTitle] = useState(initial.title)
  const [hero, setHero] = useState(initial.hero)
  const [goal, setGoal] = useState(initial.goal)
  const [saved, setSaved] = useState(false)

  const save = () => {
    saveKidsHub({ game: { ...initial, title, hero, goal, blocks: initial.blocks } })
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-scroll-chrome">
      <Link to="/kids" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft size={16} /> {t('kids.hub.back')}
      </Link>
      <DemoOnboardingBanner />
      <h1 className="text-xl font-bold">{t('kids.pillar.games')}</h1>
      <p className="text-sm text-muted">{t('kids.spiele.lead')}</p>
      <Input label={t('kids.spiele.title')} value={title} onChange={(e) => setTitle(e.target.value)} />
      <Input label={t('kids.spiele.hero')} value={hero} onChange={(e) => setHero(e.target.value)} />
      <Textarea label={t('kids.spiele.goal')} value={goal} onChange={(e) => setGoal(e.target.value)} rows={3} />
      <div className="rounded-2xl border border-dashed border-cyan/40 bg-cyan/5 p-4 text-xs text-muted">
        <p className="font-semibold text-ink">{t('kids.spiele.blocksTitle')}</p>
        <ul className="mt-2 list-inside list-disc">
          {initial.blocks.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
        <p className="mt-2">{t('kids.spiele.blocksHint')}</p>
      </div>
      <Button onClick={save}>{saved ? t('kids.spiele.saved') : t('kids.spiele.save')}</Button>
    </div>
  )
}
