import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Sparkles } from 'lucide-react'
import {
  COMPANY_SIZES,
  COUNTRIES,
  INDUSTRIES,
  ORBIT_TAGLINE_DE,
  type Industry,
} from '../data/industries'
import { JobSelect } from '../components/profile/JobSelect'
import { OrbitRobot } from '../components/home/OrbitRobot'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useI18n } from '../lib/i18n'
import { CITIES } from '../data/constants'
import {
  completePrefs,
  getPrefs,
  savePrefs,
  type EmployerPrefs,
  type PrefsSide,
  type SeekerPrefs,
} from '../lib/prefs'
import { completeCompany, getCompany } from '../lib/company'
import { cn } from '../lib/utils'

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1.5 text-xs font-medium transition',
        active
          ? 'border-cyan bg-cyan/15 text-cyan'
          : 'border-border bg-surface-2 text-neutral-300 hover:border-cyan/40',
      )}
    >
      {children}
    </button>
  )
}

function toggle<T extends string>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]
}

export function PrefsPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const initial = useMemo(() => getPrefs(), [])
  const [side, setSide] = useState<PrefsSide>(initial.side)
  const [step, setStep] = useState(0)
  const [seeker, setSeeker] = useState<SeekerPrefs>(initial.seeker)
  const [employer, setEmployer] = useState<EmployerPrefs>(initial.employer)
  const [firmName, setFirmName] = useState(() => getCompany().firmName)
  const [offerDraft, setOfferDraft] = useState('')
  const [seekDraft, setSeekDraft] = useState('')
  const [offers, setOffers] = useState(() => getCompany().offers)
  const [seeks, setSeeks] = useState(() => getCompany().seeks)

  const seekerSteps = ['Seite', 'Ort', 'Kategorie']
  const employerSteps = ['Seite', 'Ort', 'Kategorie']
  const steps = side === 'seeker' ? seekerSteps : employerSteps

  const finish = () => {
    savePrefs({ side, seeker, employer })
    if (side !== 'seeker') {
      completeCompany({
        firmName: firmName.trim(),
        offers,
        seeks,
        industries: employer.industries,
        countries: employer.countries,
        languages: employer.languages,
        hiringNeeds: employer.rolesHiring,
        size: employer.companySize,
      })
    }
    completePrefs(side)
    navigate('/match')
  }

  return (
    <div className="mx-auto max-w-lg space-y-5 pb-scroll-chrome">
      <header className="space-y-2">
        <p className="inline-flex items-center gap-2 rounded-full border border-cyan/35 bg-cyan/10 px-3 py-1 text-xs font-medium text-cyan">
          <Sparkles size={14} /> Preference-first
        </p>
        <div className="flex items-center gap-3">
          <OrbitRobot size="compact" />
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight">Dein Orbit einrichten</h1>
            <p className="text-sm text-muted">{ORBIT_TAGLINE_DE}</p>
          </div>
        </div>
        <p className="text-xs text-neutral-400">
          Drei Fragen. Überspringen geht — Login erst beim Speichern oder Zahlen.
        </p>
      </header>

      <div className="flex gap-1">
        {steps.map((label, i) => (
          <div
            key={label}
            className={cn(
              'h-1.5 flex-1 rounded-full',
              i <= step ? 'bg-cyan' : 'bg-surface-3',
            )}
            title={label}
          />
        ))}
      </div>
      <p className="text-xs text-muted">
        Schritt {step + 1}/{steps.length}: {steps[step]}
      </p>

      {step === 0 && (
        <section className="grid gap-3 sm:grid-cols-3">
          {(
            [
              {
                id: 'seeker' as const,
                title: 'Ich suche Arbeit',
                hint: 'Jobs, Minijobs, Dienstleistungen nach Prefs',
              },
              {
                id: 'employer' as const,
                title: 'Ich bin eine Firma',
                hint: 'Kandidaten, B2B, Partnerschaften swipen',
              },
              {
                id: 'both' as const,
                title: 'Beides',
                hint: 'Suchende und Firma — Match-Decks umschalten',
              },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSide(opt.id)}
              className={cn(
                'rounded-2xl border p-4 text-left transition',
                side === opt.id
                  ? 'border-cyan bg-cyan/10'
                  : 'border-border bg-surface-2 hover:border-cyan/40',
              )}
            >
              <div className="font-semibold text-ink">{opt.title}</div>
              <p className="mt-1 text-xs text-muted">{opt.hint}</p>
              {side === opt.id && <Check size={16} className="mt-2 text-cyan" />}
            </button>
          ))}
        </section>
      )}

      {step === 1 && (
        <section className="space-y-4">
          <div>
            <h2 className="mb-2 text-sm font-semibold">Ort</h2>
            <div className="flex flex-wrap gap-2">
              {(side === 'seeker' ? CITIES : COUNTRIES).map((c) => (
                <Chip
                  key={c}
                  active={
                    side === 'seeker'
                      ? seeker.cities.includes(c)
                      : employer.countries.includes(c)
                  }
                  onClick={() =>
                    side === 'seeker'
                      ? setSeeker({ ...seeker, cities: toggle(seeker.cities, c) })
                      : setEmployer({ ...employer, countries: toggle(employer.countries, c) })
                  }
                >
                  {c}
                </Chip>
              ))}
            </div>
            {side === 'seeker' && (
              <label className="mt-3 block text-xs text-muted">
                Radius km
                <Input
                  type="number"
                  className="mt-1"
                  value={seeker.radiusKm}
                  onChange={(e) =>
                    setSeeker({ ...seeker, radiusKm: Number(e.target.value) || 0 })
                  }
                />
              </label>
            )}
          </div>
        </section>
      )}

      {step === 2 && side === 'seeker' && (
        <section className="space-y-4">
          <JobSelect
            label={t('job.label')}
            value={seeker.occupation}
            onChange={(occupation) => setSeeker({ ...seeker, occupation })}
          />
          <div>
            <h2 className="mb-2 text-sm font-semibold">Branche</h2>
            <div className="flex flex-wrap gap-2">
              {INDUSTRIES.map((ind) => (
                <Chip
                  key={ind}
                  active={seeker.industries.includes(ind)}
                  onClick={() =>
                    setSeeker({
                      ...seeker,
                      industries: toggle(seeker.industries, ind as Industry),
                    })
                  }
                >
                  {ind}
                </Chip>
              ))}
            </div>
          </div>
          <label className="block text-sm font-semibold">
            Budget / Gehalt min. (€ / Monat, optional)
            <Input
              type="number"
              className="mt-1"
              value={seeker.salaryMin || ''}
              placeholder="z. B. 2500"
              onChange={(e) =>
                setSeeker({ ...seeker, salaryMin: Number(e.target.value) || 0 })
              }
            />
          </label>
        </section>
      )}

      {step === 2 && side !== 'seeker' && (
        <section className="space-y-4">
          <label className="block text-sm font-semibold">
            Firmenname
            <Input
              className="mt-1"
              value={firmName}
              placeholder="Northline Ops B.V."
              onChange={(e) => setFirmName(e.target.value)}
            />
          </label>
          <JobSelect
            label={t('job.label')}
            value={employer.rolesHiring[0] ?? ''}
            onChange={(occupation) => {
              const rest = employer.rolesHiring.slice(1)
              setEmployer({
                ...employer,
                rolesHiring: occupation
                  ? [occupation, ...rest.filter((role) => role !== occupation)]
                  : rest,
              })
            }}
          />
          <div>
            <h2 className="mb-2 text-sm font-semibold">Branchen</h2>
            <div className="flex flex-wrap gap-2">
              {INDUSTRIES.map((ind) => (
                <Chip
                  key={ind}
                  active={employer.industries.includes(ind)}
                  onClick={() =>
                    setEmployer({
                      ...employer,
                      industries: toggle(employer.industries, ind as Industry),
                    })
                  }
                >
                  {ind}
                </Chip>
              ))}
            </div>
          </div>
          <label className="block text-sm font-semibold">
            Rollen (Komma-getrennt)
            <Input
              className="mt-1"
              placeholder="z. B. Pflegekraft, Lagerhelfer, React Dev"
              value={employer.rolesHiring.join(', ')}
              onChange={(e) =>
                setEmployer({
                  ...employer,
                  rolesHiring: e.target.value
                    .split(',')
                    .map((x) => x.trim())
                    .filter(Boolean),
                })
              }
            />
          </label>
          <div>
            <h2 className="mb-2 text-sm font-semibold">Unternehmensgröße</h2>
            <div className="flex flex-wrap gap-2">
              {COMPANY_SIZES.map((sz) => (
                <Chip
                  key={sz}
                  active={employer.companySize === sz}
                  onClick={() => setEmployer({ ...employer, companySize: sz })}
                >
                  {sz}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <h2 className="mb-2 text-sm font-semibold">Wir bieten / wir suchen</h2>
            <div className="flex gap-2">
              <Input
                value={offerDraft}
                placeholder="Angebot hinzufügen"
                onChange={(e) => setOfferDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    const v = offerDraft.trim()
                    if (v && !offers.includes(v)) setOffers([...offers, v])
                    setOfferDraft('')
                  }
                }}
              />
              <Input
                value={seekDraft}
                placeholder="Bedarf hinzufügen"
                onChange={(e) => setSeekDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    const v = seekDraft.trim()
                    if (v && !seeks.includes(v)) setSeeks([...seeks, v])
                    setSeekDraft('')
                  }
                }}
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {offers.map((o) => (
                <Chip key={o} active onClick={() => setOffers(offers.filter((x) => x !== o))}>
                  + {o}
                </Chip>
              ))}
              {seeks.map((o) => (
                <Chip key={o} active onClick={() => setSeeks(seeks.filter((x) => x !== o))}>
                  − {o}
                </Chip>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="flex flex-wrap gap-2 pt-2">
        {step > 0 && (
        <Button variant="secondary" onClick={() => setStep((s) => s - 1)}>
            Zurück
          </Button>
        )}
        <Button variant="secondary" onClick={finish}>
          Überspringen
        </Button>
        <div className="flex-1" />
        {step < steps.length - 1 ? (
          <Button onClick={() => setStep((s) => s + 1)}>Weiter</Button>
        ) : (
          <Button onClick={finish}>Find dein heutiges Match</Button>
        )}
      </div>
    </div>
  )
}
