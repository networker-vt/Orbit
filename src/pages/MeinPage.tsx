import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Briefcase,
  GraduationCap,
  Heart,
  Languages,
  LayoutDashboard,
  ScrollText,
  SlidersHorizontal,
  UserRound,
  Wallet,
} from 'lucide-react'
import { TileGrid } from '../components/ui/TileGrid'
import { meinAccountTiles } from '../lib/hubTiles'
import { isKidsMode, kidsHideTravel, kidsHideWallet } from '../lib/kids'
import { FavoriteButton } from '../components/favorites/FavoriteButton'
import { ListingCard } from '../components/listings/ListingCard'
import { Badge } from '../components/ui/Badge'
import { Empty } from '../components/ui/Empty'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { StarRating } from '../components/ui/StarRating'
import { LanguageSwitcher } from '../components/i18n/LanguageSwitcher'
import { SpeakButton } from '../components/a11y/SpeakButton'
import { RoleSwitcher } from '../components/role/RoleSwitcher'
import { ChannelLinks } from '../components/mein/ChannelLinks'
import { VerifyPanel } from '../components/verify/VerifyPanel'
import { ReminderOptIn } from '../components/reminders/ReminderOptIn'
import { CATALOG_KIND_LABEL, catalogSectionPath, resolveCatalogEntry } from '../data/catalog/lookup'
import { useFavorites } from '../hooks/useFavorites'
import { store } from '../lib/store'
import { formatDate } from '../lib/utils'
import { listLocalCalendar, removeLocalCalendarItem, type LocalCalItem } from '../lib/calendar'
import { CalendarExport } from '../components/calendar/CalendarExport'
import { useI18n } from '../lib/i18n'
import {
  addDocFromFile,
  addSkill,
  getHub,
  profileCompleteness,
  removeDoc,
  removeSkill,
  setRadiusKm,
  setSkillStars,
  subscribeHub,
  type HubDocKind,
} from '../lib/profileHub'
import { getPrefs, savePrefs, subscribePrefs } from '../lib/prefs'
import { getCredits, subscribeCredits } from '../lib/credits'
import { isFlagOn } from '../lib/flags'
import { INDUSTRIES, JOB_TYPES } from '../data/industries'
import { JobSelect } from '../components/profile/JobSelect'
import { cn } from '../lib/utils'
import { useAuth } from '../lib/auth'

const DOC_KINDS: { id: HubDocKind; key: 'mein.qual' | 'mein.cert' | 'mein.train' }[] = [
  { id: 'qualification', key: 'mein.qual' },
  { id: 'certificate', key: 'mein.cert' },
  { id: 'training', key: 'mein.train' },
]

export function MeinPage() {
  const { t } = useI18n()
  const { items } = useFavorites()
  const { user, profile, updateProfile } = useAuth()
  const navigate = useNavigate()
  const { hash } = useLocation()
  const [cal, setCal] = useState<LocalCalItem[]>(() => listLocalCalendar())
  const [hub, setHub] = useState(getHub)
  const [prefs, setPrefs] = useState(getPrefs)
  const [credits, setCredits] = useState(getCredits)
  const [skillDraft, setSkillDraft] = useState('')
  const [docKind, setDocKind] = useState<HubDocKind>('certificate')
  const complete = profileCompleteness()
  const hideWallet = kidsHideWallet()

  const hubTiles = meinAccountTiles(
    t,
    { kids: isKidsMode(), hideTravel: kidsHideTravel(), hideWallet },
    { profile: user?.name.split(' ')[0] ?? t('nav.mein') },
  )

  useEffect(() => {
    const h = () => setCal(listLocalCalendar())
    window.addEventListener('orbit-cal-changed', h)
    window.addEventListener('storage', h)
    const u1 = subscribeHub(() => {
      setHub(getHub())
    })
    const u2 = subscribePrefs(() => setPrefs(getPrefs()))
    const u3 = subscribeCredits(() => setCredits(getCredits()))
    return () => {
      window.removeEventListener('orbit-cal-changed', h)
      window.removeEventListener('storage', h)
      u1()
      u2()
      u3()
    }
  }, [])

  useEffect(() => {
    if (!hash) return
    const id = decodeURIComponent(hash.replace(/^#/, ''))
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [hash])

  const listingFavs = items.filter((f) => f.type === 'listing')
  const catalogFavs = items.filter((f) => f.type === 'catalog')
  const jobListings = listingFavs
    .map((f) => store.getListing(f.id))
    .filter((l): l is NonNullable<typeof l> => Boolean(l && l.vertical === 'job'))
  const otherListings = listingFavs
    .map((f) => store.getListing(f.id))
    .filter((l): l is NonNullable<typeof l> => Boolean(l && l.vertical !== 'job'))
  const catalogRows = catalogFavs.map((f) => ({
    fav: f,
    entry: resolveCatalogEntry(f.kind, f.id),
  }))

  const toggleIndustry = (ind: (typeof INDUSTRIES)[number]) => {
    const cur = prefs.seeker.industries
    const next = cur.includes(ind) ? cur.filter((x) => x !== ind) : [...cur, ind]
    savePrefs({ seeker: { ...prefs.seeker, industries: next } })
  }

  const toggleJobType = (jt: (typeof JOB_TYPES)[number]) => {
    const cur = prefs.seeker.jobTypes
    const next = cur.includes(jt) ? cur.filter((x) => x !== jt) : [...cur, jt]
    savePrefs({ seeker: { ...prefs.seeker, jobTypes: next } })
  }

  const onDoc = async (file: File | undefined) => {
    if (!file) return
    await addDocFromFile(file, docKind)
  }

  return (
    <div className="space-y-6 pb-scroll-chrome">
      <header className="space-y-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--theme-accent)]">
            {t('mein.kicker')}
          </p>
          <h1 className="text-2xl font-bold tracking-tight">{t('mein.title')}</h1>
          <p className="mt-1 text-sm text-muted">{t('mein.lead')}</p>
        </div>
        <TileGrid tiles={hubTiles} label={t('mein.hub')} />
        <div className="flex flex-wrap gap-2">
          <SpeakButton text={`${t('mein.title')}. ${t('mein.lead')}`} />
          {!hideWallet && isFlagOn('credits') && (
          <Link
            to="/wallet"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-[var(--theme-accent)]/30 bg-[var(--theme-accent)]/10 px-3 py-2 text-sm"
          >
            <Wallet size={16} /> {credits.balance} Credits
          </Link>
          )}
          <Link
            to="/empfehlen"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-neutral-300 hover:border-[var(--theme-accent)]/40"
          >
            {isFlagOn('credits') ? 'Empfehlen' : 'Orbit weiterempfehlen'}
          </Link>
          <Link
            to="/erfahrungen"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-neutral-300 hover:border-[var(--theme-accent)]/40"
          >
            {t('reviews.title')}
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-neutral-300"
          >
            <LayoutDashboard size={16} /> Dashboard
          </Link>
          <Link
            to="/firma"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-neutral-300"
          >
            {t('firma.nav')}
          </Link>
          <Link
            to="/profile"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-neutral-300"
          >
            <UserRound size={16} /> {user?.name.split(' ')[0] ?? 'Profil'}
          </Link>
        </div>
      </header>

      {isFlagOn('verifyId') && <VerifyPanel />}
      <ReminderOptIn />

      <RoleSwitcher />

      {isFlagOn('channels') && <ChannelLinks />}

      <section className="rounded-2xl border border-border bg-surface-2 p-4" id="sprache">
        <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
          <Languages size={18} className="text-[var(--theme-accent)]" /> {t('mein.language')}
        </h2>
        <p className="mb-3 text-xs text-muted">{t('mein.languageHint')}</p>
        <LanguageSwitcher />
      </section>

      <section className="rounded-2xl border border-[var(--theme-accent)]/30 bg-[var(--theme-accent)]/10 p-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{t('mein.completeness')}</h2>
            <p className="text-xs text-muted">{complete.parts.filter((p) => p.ok).length}/5</p>
          </div>
          <p className="text-3xl font-bold tabular-nums text-[var(--theme-accent)]">{complete.score}%</p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/40">
          <div
            className="h-full rounded-full bg-[var(--theme-accent)]"
            style={{ width: `${complete.score}%` }}
          />
        </div>
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {complete.parts.map((p) => (
            <li key={p.label}>
              <Badge tone={p.ok ? 'teal' : 'default'}>
                {p.ok ? '✓' : '·'} {p.label}
              </Badge>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-border bg-surface-2 p-4" id="radius">
        <h2 className="text-lg font-semibold">{t('mein.radius')}</h2>
        <p className="mt-1 text-xs text-muted">{t('mein.radiusHint')}</p>
        <div className="mt-3 flex items-center gap-3">
          <input
            type="range"
            min={5}
            max={500}
            step={5}
            value={prefs.seeker.radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="h-11 flex-1 accent-[var(--theme-accent)]"
            aria-valuemin={5}
            aria-valuemax={500}
            aria-valuenow={prefs.seeker.radiusKm}
            aria-label={t('mein.radius')}
          />
          <span className="min-w-16 text-right text-lg font-bold tabular-nums">
            {prefs.seeker.radiusKm} {t('mein.km')}
          </span>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-border bg-surface-2 p-4" id="seeker">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <SlidersHorizontal size={18} className="text-[var(--theme-accent)]" /> {t('mein.seeker')}
          </h2>
          <Button size="sm" variant="ghost" onClick={() => navigate('/prefs')}>
            Wizard
          </Button>
        </div>
        <p className="text-xs text-muted">
          Seite:{' '}
          {prefs.side === 'seeker'
            ? t('mein.sideSeeker')
            : prefs.side === 'employer'
              ? t('mein.sideOffer')
              : t('role.both')}
        </p>
        <JobSelect
          label={t('job.label')}
          value={profile?.crafts[0] || prefs.seeker.occupation || ''}
          onChange={(occupation) => {
            savePrefs({ seeker: { ...prefs.seeker, occupation } })
            if (profile) {
              const next = { ...profile, crafts: occupation ? [occupation] : [] }
              updateProfile({ crafts: next.crafts })
              store.upsertProfile(next)
            }
          }}
        />
        <h3 className="text-sm font-semibold">Branchen</h3>
        <div className="flex flex-wrap gap-2">
          {INDUSTRIES.map((ind) => (
            <button
              key={ind}
              type="button"
              onClick={() => toggleIndustry(ind)}
              className={cn(
                'min-h-10 rounded-full border px-3 py-1.5 text-xs font-medium',
                prefs.seeker.industries.includes(ind)
                  ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/15 text-ink'
                  : 'border-border bg-black/20 text-neutral-300',
              )}
            >
              {ind}
            </button>
          ))}
        </div>
        <h3 className="text-sm font-semibold">Job-Typen</h3>
        <div className="flex flex-wrap gap-2">
          {JOB_TYPES.map((jt) => (
            <button
              key={jt}
              type="button"
              onClick={() => toggleJobType(jt)}
              className={cn(
                'min-h-10 rounded-full border px-3 py-1.5 text-xs font-medium',
                prefs.seeker.jobTypes.includes(jt)
                  ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/15 text-ink'
                  : 'border-border bg-black/20 text-neutral-300',
              )}
            >
              {jt}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-border bg-surface-2 p-4" id="employer">
        <h2 className="text-lg font-semibold">{t('mein.employer')}</h2>
        <label className="block text-sm">
          Rollen (Komma)
          <Input
            className="mt-1"
            value={prefs.employer.rolesHiring.join(', ')}
            placeholder="z. B. Pflegekraft, React Dev"
            onChange={(e) =>
              savePrefs({
                employer: {
                  ...prefs.employer,
                  rolesHiring: e.target.value
                    .split(',')
                    .map((x) => x.trim())
                    .filter(Boolean),
                },
              })
            }
          />
        </label>
        <p className="text-xs text-muted">Größe: {prefs.employer.companySize || '—'}</p>
      </section>

      <section className="space-y-3 rounded-2xl border border-border bg-surface-2 p-4" id="skills">
        <h2 className="text-lg font-semibold">{t('mein.skills')}</h2>
        <p className="text-xs text-muted">{t('mein.skillsHint')}</p>
        <ul className="space-y-2">
          {hub.skills.map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 bg-black/20 px-3 py-2"
            >
              <span className="font-medium">{s.name}</span>
              <div className="flex items-center gap-2">
                <StarRating
                  value={s.stars}
                  onChange={(n) => setSkillStars(s.id, n)}
                  label={`${s.name} ${s.stars} von 5`}
                />
                <button
                  type="button"
                  className="text-xs text-rose-300 hover:underline"
                  onClick={() => removeSkill(s.id)}
                >
                  ×
                </button>
              </div>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <Input
            value={skillDraft}
            onChange={(e) => setSkillDraft(e.target.value)}
            placeholder={t('mein.skillAdd')}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addSkill(skillDraft)
                setSkillDraft('')
              }
            }}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              addSkill(skillDraft)
              setSkillDraft('')
            }}
          >
            +
          </Button>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-border bg-surface-2 p-4" id="docs">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <GraduationCap size={18} className="text-[var(--theme-accent)]" /> {t('mein.docs')}
        </h2>
        <p className="text-xs text-muted">{t('mein.docsHint')}</p>
        <div className="flex flex-wrap gap-2">
          {DOC_KINDS.map((k) => (
            <button
              key={k.id}
              type="button"
              onClick={() => setDocKind(k.id)}
              className={cn(
                'min-h-10 rounded-full border px-3 py-1.5 text-xs font-medium',
                docKind === k.id
                  ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/15'
                  : 'border-border',
              )}
            >
              {t(k.key)}
            </button>
          ))}
        </div>
        <label className="flex min-h-12 cursor-pointer items-center justify-center rounded-xl border border-dashed border-border bg-black/20 px-3 py-3 text-sm text-neutral-300">
          <input
            type="file"
            accept="image/*,.pdf,.doc,.docx"
            capture="environment"
            className="sr-only"
            onChange={(e) => {
              void onDoc(e.target.files?.[0])
              e.target.value = ''
            }}
          />
          Datei / Kamera wählen
        </label>
        <ul className="space-y-2">
          {hub.docs.map((d) => (
            <li
              key={d.id}
              className="flex items-center justify-between gap-2 rounded-xl border border-border/70 bg-black/20 px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <ScrollText size={14} className="shrink-0 text-[var(--theme-accent)]" />
                  <span className="truncate font-medium">{d.name}</span>
                </div>
                <p className="text-xs text-muted">
                  {d.kind} · {Math.round(d.size / 1024)} KB · {formatDate(d.addedAt.slice(0, 10))}
                </p>
              </div>
              <button type="button" className="text-xs text-rose-300" onClick={() => removeDoc(d.id)}>
                ×
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3 rounded-2xl border border-border bg-surface-2 p-4">
        <h2 className="text-lg font-semibold">{t('mein.calendar')}</h2>
        <p className="text-xs text-muted">{t('mein.remindersHint')}</p>
        {cal.filter((c) => c.kind === 'reminder' || c.kind === 'plan').length > 0 && (
          <ul className="space-y-2">
            {cal
              .filter((c) => c.kind === 'reminder' || c.kind === 'plan')
              .map((c) => (
                <li
                  key={c.id}
                  className="flex items-start justify-between gap-2 rounded-xl border border-[var(--theme-accent)]/30 bg-[var(--theme-accent)]/5 px-3 py-2 text-sm"
                >
                  <div>
                    <div className="font-medium text-ink">{c.title}</div>
                    <div className="text-xs text-muted">
                      {formatDate(c.startIso.slice(0, 10))}
                      {c.location ? ` · ${c.location}` : ''}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="text-xs text-rose-300 hover:underline"
                    onClick={() => setCal(removeLocalCalendarItem(c.id))}
                  >
                    {t('assist.clear')}
                  </button>
                </li>
              ))}
          </ul>
        )}
        {cal.filter((c) => c.kind !== 'reminder' && c.kind !== 'plan').length === 0 &&
        cal.filter((c) => c.kind === 'reminder' || c.kind === 'plan').length === 0 ? (
          <p className="text-sm text-muted">Noch keine Einträge.</p>
        ) : (
          <ul className="space-y-2">
            {cal
              .filter((c) => c.kind !== 'reminder' && c.kind !== 'plan')
              .map((c) => (
              <li
                key={c.id}
                className="flex items-start justify-between gap-2 rounded-xl border border-border/60 bg-black/20 px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <div className="font-medium text-ink">{c.title}</div>
                  <div className="text-xs text-muted">
                    {c.kind} · {formatDate(c.startIso.slice(0, 10))}
                    {c.location ? ` · ${c.location}` : ''}
                  </div>
                  <div className="mt-1">
                    <CalendarExport
                      compact
                      kind={c.kind}
                      event={{
                        title: c.title,
                        startIso: c.startIso,
                        endIso: c.endIso,
                        location: c.location,
                      }}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  className="text-xs text-rose-300 hover:underline"
                  onClick={() => setCal(removeLocalCalendarItem(c.id))}
                >
                  Entfernen
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Briefcase size={18} className="text-[var(--theme-accent)]" /> {t('mein.favorites')}
        </h2>
        {jobListings.length === 0 ? (
          <Empty
            emoji="💼"
            title="Noch keine Job-Favoriten"
            hint="Herz auf einer Jobkarte tippen."
            actionLabel={t('home.ctaMatch')}
            onAction={() => navigate('/match')}
          />
        ) : (
          <div className="stagger-in grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {jobListings.map((l) => (
              <ListingCard key={l.id} listing={l} highlightRate />
            ))}
          </div>
        )}
      </section>

      {otherListings.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Heart size={18} /> Marktplatz
          </h2>
          <div className="stagger-in grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {otherListings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </section>
      )}

      {catalogRows.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Katalog (Event-Modul)</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {catalogRows.map(({ fav, entry }) => (
              <article
                key={`${fav.kind}-${fav.id}`}
                className="card-elevated flex items-start gap-3 rounded-2xl border border-border p-4"
              >
                <div className="min-w-0 flex-1">
                  <Badge tone="teal">{CATALOG_KIND_LABEL[fav.kind]}</Badge>
                  <Link to={catalogSectionPath(fav.kind)} className="mt-1 block text-sm font-semibold">
                    {entry?.name ?? 'Eintrag nicht mehr vorhanden'}
                  </Link>
                </div>
                <FavoriteButton catalog={{ kind: fav.kind, id: fav.id }} />
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
