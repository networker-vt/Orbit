import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import {
  demoActionResult,
  demoCopy,
  resolveDemoFeature,
  type DemoFeature,
} from '../lib/featureDemos'
import { useI18n } from '../lib/i18n'

export function FeatureDemoPage({ feature }: { feature?: DemoFeature }) {
  const params = useParams()
  const fromRoute = resolveDemoFeature(params.featureId)
  const id = feature ?? fromRoute
  const { t, resolved } = useI18n()
  const [note, setNote] = useState<string | null>(null)

  if (!id) {
    return (
      <div className="mx-auto max-w-lg space-y-3 pb-scroll-chrome">
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-200">{t('demo.kicker')}</p>
        <h1 className="text-2xl font-bold">{t('demo.missing')}</h1>
      </div>
    )
  }

  const copy = demoCopy(id, resolved)
  const showSample = () => {
    if (demoActionResult() !== 'blocked') return
    setNote(t('demo.blocked'))
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-scroll-chrome" data-feature-demo={id}>
      <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
        <strong className="uppercase tracking-wide">{t('demo.kicker')}</strong>
        {' — '}
        {t('demo.banner')}
      </p>
      <header className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wider text-muted">{t('demo.sample')}</p>
        <h1 className="text-2xl font-bold tracking-tight">{copy.title}</h1>
        <p className="text-sm text-muted">{copy.lead}</p>
      </header>
      <ul className="space-y-2">
        {copy.samples.map((sample) => (
          <li
            key={sample}
            className="rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm text-ink"
          >
            {sample}
          </li>
        ))}
      </ul>
      <Button type="button" variant="secondary" data-demo-action="1" onClick={showSample}>
        {copy.action}
      </Button>
      {note && (
        <p role="status" className="text-sm text-amber-100">
          {note}
        </p>
      )}
    </div>
  )
}
