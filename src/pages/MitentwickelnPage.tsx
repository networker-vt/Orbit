import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Download, ExternalLink, GitBranch, HeartHandshake } from 'lucide-react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Input, Textarea } from '../components/ui/Input'
import { DemoOnboardingBanner } from '../components/onboarding/DemoOnboardingBanner'
import { isDemoMode } from '../lib/flags'
import { useI18n } from '../lib/i18n'
import {
  ORBIT_CONTRIBUTING,
  ORBIT_GITHUB_REPO,
  addImprovement,
  exportImprovementsJson,
  listImprovements,
  removeImprovement,
  subscribeImprovements,
} from '../lib/improvements'

export function MitentwickelnPage() {
  const { t } = useI18n()
  const [ideas, setIdeas] = useState(listImprovements)
  const [text, setText] = useState('')
  const [rating, setRating] = useState('4')
  const [flash, setFlash] = useState<string | null>(null)

  useEffect(() => subscribeImprovements(() => setIdeas(listImprovements())), [])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    addImprovement(text, Number(rating), 'mitentwickeln')
    setText('')
    setFlash(t('mitentwickeln.saved'))
    window.setTimeout(() => setFlash(null), 2500)
  }

  const download = () => {
    const blob = new Blob([exportImprovementsJson()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'orbit-verbesserungsvorschlaege.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto max-w-lg space-y-5 pb-scroll-chrome" data-mitentwickeln="1">
      <Link to="/mein" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft size={16} /> {t('mein.title')}
      </Link>

      {isDemoMode() && <DemoOnboardingBanner />}

      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--theme-accent)]">
          {t('mitentwickeln.kicker')}
        </p>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <HeartHandshake size={22} /> {t('mitentwickeln.title')}
        </h1>
        <p className="text-sm text-muted">{t('mitentwickeln.lead')}</p>
      </header>

      <section className="space-y-2 rounded-2xl border border-cyan/25 bg-cyan/5 p-4 text-sm">
        <p className="flex items-center gap-2 font-semibold text-ink">
          <GitBranch size={16} /> {t('mitentwickeln.opensourceTitle')}
        </p>
        <p className="text-muted">{t('mitentwickeln.opensourceLead')}</p>
        <div className="flex flex-wrap gap-2">
          <a
            href={ORBIT_GITHUB_REPO}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs font-medium hover:border-cyan/40"
          >
            GitHub <ExternalLink size={12} />
          </a>
          <a
            href={ORBIT_CONTRIBUTING}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs font-medium hover:border-cyan/40"
          >
            CONTRIBUTING <ExternalLink size={12} />
          </a>
        </div>
        <p className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          {t('mitentwickeln.hausRule')}
        </p>
      </section>

      <form onSubmit={submit} className="space-y-3 rounded-2xl border border-border bg-surface-2 p-4">
        <Textarea
          label={t('mitentwickeln.fieldLabel')}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          required
          placeholder={t('mitentwickeln.placeholder')}
        />
        <Input
          label={t('mitentwickeln.rating')}
          type="number"
          min={1}
          max={5}
          value={rating}
          onChange={(e) => setRating(e.target.value)}
        />
        <Button type="submit" className="w-full" disabled={!text.trim()}>
          {t('mitentwickeln.submit')}
        </Button>
        {flash && <p className="text-center text-xs text-cyan">{flash}</p>}
      </form>

      <div className="flex gap-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={download}>
          <Download size={16} /> {t('mitentwickeln.export')}
        </Button>
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">{t('mitentwickeln.listTitle')}</h2>
        {ideas.length === 0 ? (
          <p className="text-sm text-muted">{t('mitentwickeln.empty')}</p>
        ) : (
          <ul className="space-y-2">
            {ideas.map((idea) => (
              <li key={idea.id} className="rounded-xl border border-border bg-surface-2 p-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <Badge tone="teal">{idea.rating > 0 ? `${idea.rating}/5` : '—'}</Badge>
                  <button
                    type="button"
                    className="text-xs text-muted hover:text-rose-300"
                    onClick={() => removeImprovement(idea.id)}
                  >
                    {t('mitentwickeln.remove')}
                  </button>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-ink">{idea.text}</p>
                <p className="mt-1 text-xs text-muted">
                  {new Date(idea.createdAt).toLocaleString('de-DE')} · {idea.source}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
