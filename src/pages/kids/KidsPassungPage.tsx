import { Link } from 'react-router-dom'
import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { DemoOnboardingBanner } from '../../components/onboarding/DemoOnboardingBanner'
import { useI18n } from '../../lib/i18n'
import { computeFit, getKidsHub, saveKidsHub, type KidsFitResult } from '../../lib/kidsHub'

function Slider({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (n: number) => void
}) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="text-muted">{label}</span>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
      <span className="text-xs text-muted">{value}/10</span>
    </label>
  )
}

export function KidsPassungPage() {
  const { t } = useI18n()
  const [energy, setEnergy] = useState(5)
  const [social, setSocial] = useState(5)
  const [music, setMusic] = useState(5)
  const [outdoor, setOutdoor] = useState(5)
  const [result, setResult] = useState<KidsFitResult | null>(() => getKidsHub().fit)

  const run = () => {
    const fit = computeFit({ energy, social, music, outdoor })
    saveKidsHub({ fit })
    setResult(fit)
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-scroll-chrome">
      <Link to="/kids" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft size={16} /> {t('kids.hub.back')}
      </Link>
      <DemoOnboardingBanner />
      <h1 className="text-xl font-bold">{t('kids.pillar.fit')}</h1>
      <p className="text-sm text-muted">{t('kids.passung.lead')}</p>
      <div className="space-y-4 rounded-2xl border border-border bg-surface-2 p-4">
        <Slider label={t('kids.passung.energy')} value={energy} onChange={setEnergy} />
        <Slider label={t('kids.passung.social')} value={social} onChange={setSocial} />
        <Slider label={t('kids.passung.music')} value={music} onChange={setMusic} />
        <Slider label={t('kids.passung.outdoor')} value={outdoor} onChange={setOutdoor} />
        <Button onClick={run}>{t('kids.passung.submit')}</Button>
      </div>
      {result && (
        <article className="space-y-2 rounded-2xl border border-cyan/30 bg-cyan/5 p-4 text-sm">
          <p>
            <strong>{t('kids.passung.sport')}:</strong> {result.sport}
          </p>
          <p>
            <strong>{t('kids.passung.instrument')}:</strong> {result.instrument}
          </p>
          <p>
            <strong>{t('kids.passung.language')}:</strong> {result.language}
          </p>
          <p className="text-xs text-muted">{result.rationale}</p>
        </article>
      )}
    </div>
  )
}
