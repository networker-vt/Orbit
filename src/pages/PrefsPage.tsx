import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Check, Sparkles } from 'lucide-react'
import {
  COMPANY_SIZES,
  COUNTRIES,
  INDUSTRIES,
  ORBIT_TAGLINE_DE,
  type Industry,
} from '../data/industries'
import { OccupationField } from '../components/prefs/OccupationField'
import { OrbitRobot } from '../components/home/OrbitRobot'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
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
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const moneyIntent = params.get('intent') === 'money'
  const workRef = useRef<HTMLTextAreaElement>(null)
  const initial = useMemo(() => getPrefs(), [])
  const [side, setSide] = useState<PrefsSide>(moneyIntent ? 'seeker' : initial.side)
  const [step, setStep] = useState(moneyIntent ? 2 : 0)
  const [seeker, setSeeker] = useState<SeekerPrefs>(initial.seeker)
  const [employer, setEmployer] = useState<EmployerPrefs>(initial.employer)
  const [firmName, setFirmName] = useState(() => getCompany().firmName)
  const [offerDraft, setOfferDraft] = useState('')
  const [seekDraft, setSeekDraft] = useState('')
  const [skillDraft, setSkillDraft] = useState('')
  const [offers, setOffers] = useState(() => getCompany().offers)
  const [seeks, setSeeks] = useState(() => getCompany().seeks)

  const seekerSteps = moneyIntent
    ? ['Seite', 'Ort', 'Arbeit & Skills']
    : ['Seite', 'Ort', 'Kategorie']
  const employerSteps = ['Seite', 'Ort', 'Kategorie']
  const steps = side === 'seeker' ? seekerSteps : employerSteps

  useEffect(() => {
    if (!moneyIntent) return
    window.requestAnimationFrame(() => workRef.current?.focus())
  }, [moneyIntent])

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
          <Sparkles size={14} /> {moneyIntent ? 'I need money' : 'Preference-first'}
        </p>
        <div className="flex items-center gap-3">
          <OrbitRobot size="compact" />
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight">
              {moneyIntent ? 'Was du arbeiten willst' : 'Dein Orbit einrichten'}
            </h1>
            <p className="text-sm text-muted">
              {moneyIntent
                ? 'Beschreibe gewünschte Arbeit und Skills — Match vermittelt, kein Lohnversprechen.'
                : ORBIT_TAGLINE_DE}
            </p>
          </div>
        </div>
        <p className="text-xs text-neutral-400">
          {moneyIntent
            ? 'Kurz halten. Speichern öffnet Match — ohne Fake-Payroll.'
            : 'Drei Fragen. Überspringen geht — Login erst beim Speichern oder Zahlen.'}
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
        <section className="space-y-4" data-prefs-money={moneyIntent ? '1' : undefined}>
          <label className="block text-sm font-semibold">
            Gewünschte Arbeit
            <textarea
              ref={workRef}
              className="mt-1 w-full resize-none rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm text-ink outline-none focus:border-cyan/50"
              rows={3}
              value={seeker.desiredWork}
              placeholder="z. B. Minijob abends, Pflegevertretung, React-Freelance"
              data-prefs-desired-work="1"
              onChange={(e) => setSeeker({ ...seeker, desiredWork: e.target.value })}
            />
          </label>
          <label className="block text-sm font-semibold">
            Skills (Enter zum Hinzufügen)
            <div className="mt-1 flex gap-2">
              <Input
                value={skillDraft}
                placeholder="z. B. GrandMA3, React, Staplerschein"
                onChange={(e) => setSkillDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return
                  e.preventDefault()
                  const v = skillDraft.trim()
                  if (!v || seeker.mustHaveSkills.includes(v)) return
                  setSeeker({ ...seeker, mustHaveSkills: [...seeker.mustHaveSkills, v] })
                  setSkillDraft('')
                }}
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {seeker.mustHaveSkills.map((skill) => (
                <Chip
                  key={skill}
                  active
                  onClick={() =>
                    setSeeker({
                      ...seeker,
                      mustHaveSkills: seeker.mustHaveSkills.filter((s) => s !== skill),
                    })
                  }
                >
                  {skill}
                </Chip>
              ))}
            </div>
          </label>
          <OccupationField
            selectedIds={seeker.occupations}
            other={seeker.occupationOther}
            onChange={(next) =>
              setSeeker({
                ...seeker,
                occupations: next.occupations,
                occupationTerms: next.occupationTerms,
                occupationOther: next.occupationOther,
                industries: next.industries.filter((item): item is Industry =>
                  (INDUSTRIES as readonly string[]).includes(item),
                ),
              })
            }
          />
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
          <OccupationField
            selectedIds={employer.occupations}
            other={employer.occupationOther}
            onChange={(next) =>
              setEmployer({
                ...employer,
                occupations: next.occupations,
                occupationTerms: next.occupationTerms,
                occupationOther: next.occupationOther,
                industries: next.industries.filter((item): item is Industry =>
                  (INDUSTRIES as readonly string[]).includes(item),
                ),
              })
            }
          />
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
