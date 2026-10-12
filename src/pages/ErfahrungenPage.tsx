import { useEffect, useMemo, useState } from 'react'
import { Button } from '../components/ui/Button'
import { Input, Select, Textarea } from '../components/ui/Input'
import { StarRating } from '../components/ui/StarRating'
import { ExperienceList } from '../components/reviews/ExperienceList'
import { SpeakButton } from '../components/a11y/SpeakButton'
import { useI18n } from '../lib/i18n'
import { isFlagOn } from '../lib/flags'
import { useAuth } from '../lib/auth'
import {
  EXPERIENCE_LABEL_DE,
  addExperience,
  listExperience,
  subscribeExperience,
  type ExperienceTarget,
} from '../lib/experience'
import { store } from '../lib/store'

const TARGETS: ExperienceTarget[] = ['app', 'company', 'job', 'agency_client']

export function ErfahrungenPage() {
  const { t } = useI18n()
  const { user, loginDemo } = useAuth()
  const [, setTick] = useState(0)
  const [target, setTarget] = useState<ExperienceTarget>('app')
  const [targetId, setTargetId] = useState('orbit')
  const [targetLabel, setTargetLabel] = useState('Allda')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [flash, setFlash] = useState<string | null>(null)

  useEffect(() => subscribeExperience(() => setTick((n) => n + 1)), [])

  const jobs = useMemo(
    () => store.listListings({ vertical: 'job', kind: 'offer' }).slice(0, 24),
    [],
  )
  const companies = useMemo(() => {
    const map = new Map<string, string>()
    for (const l of jobs) {
      if (l.ownerName) map.set(l.ownerId, l.ownerName)
    }
    return [...map.entries()]
  }, [jobs])

  const reviews = listExperience()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) loginDemo()
    addExperience({
      target,
      targetId,
      targetLabel,
      rating,
      comment,
      fromName: user?.name || 'Alex Müller',
    })
    setComment('')
    setFlash(isFlagOn('credits') ? t('reviews.thanks') : t('reviews.thanksPlain'))
  }

  return (
    <div className="mx-auto max-w-lg space-y-5 pb-scroll-chrome">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">{t('reviews.title')}</h1>
        <p className="text-sm text-muted">{t('reviews.lead')}</p>
        <SpeakButton text={`${t('reviews.title')}. ${t('reviews.lead')}`} />
      </header>

      <form onSubmit={submit} className="space-y-3 rounded-2xl border border-border bg-surface-2 p-4">
        <Select
          label="Was bewertest du?"
          value={target}
          onChange={(e) => {
            const next = e.target.value as ExperienceTarget
            setTarget(next)
            if (next === 'app') {
              setTargetId('orbit')
              setTargetLabel('Allda')
            }
          }}
        >
          {TARGETS.map((k) => (
            <option key={k} value={k}>
              {EXPERIENCE_LABEL_DE[k]}
            </option>
          ))}
        </Select>

        {target === 'company' && (
          <Select
            label="Firma"
            value={targetId}
            onChange={(e) => {
              setTargetId(e.target.value)
              setTargetLabel(companies.find((c) => c[0] === e.target.value)?.[1] || e.target.value)
            }}
          >
            {companies.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </Select>
        )}
        {target === 'job' && (
          <Select
            label="Job"
            value={targetId}
            onChange={(e) => {
              const job = jobs.find((j) => j.id === e.target.value)
              setTargetId(e.target.value)
              setTargetLabel(job?.title || e.target.value)
            }}
          >
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </Select>
        )}
        {target === 'agency_client' && (
          <Input
            label="Agentur / Auftraggeber"
            value={targetLabel}
            onChange={(e) => {
              setTargetLabel(e.target.value)
              setTargetId(e.target.value.toLowerCase().replace(/\s+/g, '-'))
            }}
            placeholder="z. B. Nordlicht ↔ CityMart"
          />
        )}

        <div>
          <p className="mb-1 text-sm text-muted">Sterne</p>
          <StarRating value={rating} onChange={setRating} label="Bewertung" />
        </div>
        <Textarea
          label="Kurztext"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Pünktlichkeit, Kommunikation, Fairness…"
          maxLength={280}
        />
        <Button type="submit" className="w-full">
          {t('reviews.submit')}
        </Button>
        {flash && <p className="text-sm text-[var(--theme-accent)]">{flash}</p>}
      </form>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Feed</h2>
        <ExperienceList reviews={reviews} />
      </section>
    </div>
  )
}
