import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Input, Select, Textarea } from '../components/ui/Input'
import { MarketRateHint } from '../components/listings/MarketRateHint'
import {
  CITIES,
  EXPENSES_OPTIONS,
  MARKET_RATE,
  OVERNIGHT_OPTIONS,
  TRAVEL_OPTIONS,
  VERTICAL_META,
} from '../data/constants'
import { INDUSTRIES } from '../data/industries'
import { OccupationField } from '../components/prefs/OccupationField'
import { DEMO_USER_ID, seedProfiles } from '../data/seed'
import { useAuth } from '../lib/auth'
import { getCompany } from '../lib/company'
import { CREDITS_COSTS, boostCost, getCredits, spendCredits } from '../lib/credits'
import { canOffer, subscribeVerify } from '../lib/verify'
import { isFlagOn } from '../lib/flags'
import { commercialTraderComplete, type SellerKind, type TraderDetails } from '../lib/seller'
import { SellerFields, emptyTrader } from '../components/listings/SellerFields'
import { VerifyPanel } from '../components/verify/VerifyPanel'
import { LaneBadge } from '../components/credits/LaneBadge'
import { useI18n } from '../lib/i18n'
import { CREATE_INTENTS, intentToDraft, MARKET_EMOJI, MARKET_TYPES, verticalForMarket } from '../lib/market'
import { store } from '../lib/store'
import { cn } from '../lib/utils'
import type {
  CreateIntent,
  ExpensesCover,
  ListingKind,
  MarketType,
  OvernightCover,
  TravelCover,
  Vertical,
} from '../types'
import { vehicleSizes } from '../data/catalog'

const EMOJI: Record<Vertical, string> = {
  freelancer: '🛠️',
  company: '🤝',
  material: '📦',
  transporter: '🚛',
  courier: '🏍️',
  hotel: '🏨',
  job: '💼',
  partnership: '🔗',
}

function parseIntent(params: URLSearchParams): CreateIntent {
  const raw = params.get('intent') as CreateIntent | null
  if (raw && CREATE_INTENTS.includes(raw)) return raw
  const vertical = params.get('vertical')
  const kind = params.get('kind')
  if (kind === 'request') return 'need'
  if (vertical === 'job') return 'job'
  if (vertical === 'partnership') return 'partnership'
  if (vertical && vertical !== 'job') return 'service'
  return 'job'
}

export function CreateListingPage() {
  const [params] = useSearchParams()
  if (params.get('full') === '1') return <FullCreateListing />
  return <SimpleCreateListing />
}

function SimpleCreateListing() {
  const [params] = useSearchParams()
  const { t } = useI18n()
  const { user, profile, loginDemo } = useAuth()
  const navigate = useNavigate()
  const company = getCompany()
  const credits = getCredits()

  const [intent, setIntent] = useState<CreateIntent>(() => parseIntent(params))
  const [needLane, setNeedLane] = useState<MarketType>('b2b')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [priceUnit, setPriceUnit] = useState('')
  const [city, setCity] = useState(profile?.city || company.locations[0] || 'Berlin')
  const [industry, setIndustry] = useState(company.industry || '')
  const [boost, setBoost] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [offerOk, setOfferOk] = useState(canOffer)
  const [sellerKind, setSellerKind] = useState<SellerKind>('private')
  const [trader, setTrader] = useState<TraderDetails>(emptyTrader)
  const [sellerError, setSellerError] = useState<string | null>(null)

  useEffect(() => subscribeVerify(() => setOfferOk(canOffer())), [])

  const draft = useMemo(() => {
    if (intent === 'need') {
      return { kind: 'request' as const, marketType: needLane, vertical: verticalForMarket(needLane) }
    }
    return intentToDraft(intent)
  }, [intent, needLane])

  const cost = { ...CREDITS_COSTS.featured, credits: boostCost('featured') }
  const canBoost = credits.balance >= cost.credits

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    let u = user
    let p = profile
    if (!u || !p) {
      loginDemo()
      const demo = seedProfiles.find((x) => x.id === DEMO_USER_ID)!
      u = { id: demo.id, email: demo.email, name: demo.name, role: demo.role }
      p = demo
    }
    const trimmed = title.trim()
    if (!trimmed) return
    if (isFlagOn('verifyId') && intent !== 'need' && !canOffer()) return
    if (sellerKind === 'commercial' && !commercialTraderComplete(trader)) {
      setSellerError('Gewerblich: Name, Anschrift, E-Mail und Telefon sind Pflicht.')
      return
    }
    setSellerError(null)
    const desc = description.trim() || `${trimmed}`
    let featured = false
    if (isFlagOn('credits') && boost && canBoost) {
      const spent = await spendCredits(cost.credits, 'featured', `${cost.label}: ${trimmed}`)
      featured = Boolean(spent)
    }
    const ownerName = company.firmName || p.companyName || u.name
    const listing = store.createListing({
      kind: draft.kind,
      vertical: draft.vertical,
      marketType: draft.marketType,
      title: trimmed,
      description: desc,
      city,
      crafts: [],
      priceFrom: price ? Number(price) : undefined,
      priceUnit: priceUnit || undefined,
      currency: 'EUR',
      ownerId: u.id,
      ownerName,
      ownerVerified: p.verified,
      rating: p.rating,
      tags: [draft.marketType, draft.kind === 'request' ? 'Gesuch' : 'Angebot'],
      imageEmoji: MARKET_EMOJI[draft.marketType] || EMOJI[draft.vertical],
      featured,
      industry: industry || undefined,
      jobType: draft.marketType === 'minijob' ? 'Minijob' : draft.marketType === 'job' ? 'Freelance' : undefined,
      country: city === 'Remote' ? 'Remote / Global' : undefined,
      languages: company.languages.length ? company.languages : undefined,
      source: 'Orbit Direct',
      offerTags: draft.kind === 'offer' ? company.offers.slice(0, 4) : undefined,
      needTags: draft.kind === 'request' ? company.seeks.slice(0, 4) : undefined,
      matchReason: featured ? 'Orbit Credits Boost (Demo)' : undefined,
      sellerKind,
      trader: sellerKind === 'commercial' ? trader : undefined,
    })
    navigate(`/listings/${listing.id}`)
  }

  return (
    <div className="mx-auto max-w-lg space-y-5 pb-scroll-chrome">
      <div>
        <h1 className="text-2xl font-bold">{t('create.title')}</h1>
        <p className="text-sm text-muted">{isFlagOn('credits') ? t('create.simpleLead') : t('create.simpleLeadPlain')}</p>
      </div>
      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border bg-surface-2 p-5">
        <fieldset>
          <legend className="mb-2 text-sm text-muted">{t('create.type')}</legend>
          <div className="grid grid-cols-2 gap-2">
            {CREATE_INTENTS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setIntent(id)}
                className={cn(
                  'min-h-12 rounded-2xl border px-3 py-2 text-left text-sm font-medium',
                  intent === id
                    ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/15 text-ink'
                    : 'border-border bg-black/20 text-neutral-300',
                )}
              >
                {t(`create.${id}`)}
              </button>
            ))}
          </div>
        </fieldset>
        {intent === 'need' && (
          <div className="flex flex-wrap gap-1.5">
            {MARKET_TYPES.filter((m) => m !== 'minijob').map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setNeedLane(m)}
                className={cn(
                  'min-h-9 rounded-full border px-3 text-xs',
                  needLane === m
                    ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/15'
                    : 'border-border',
                )}
              >
                {t(`market.${m}`)}
              </button>
            ))}
          </div>
        )}
        <Input
          label={t('create.titleField')}
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('create.titlePh')}
        />
        <Textarea
          label={t('create.descOptional')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('create.descPh')}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label={t('create.priceOptional')}
            type="number"
            min="0"
            step="1"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="—"
          />
          <Input
            label={t('create.unit')}
            value={priceUnit}
            onChange={(e) => setPriceUnit(e.target.value)}
            placeholder={t('create.unitPh')}
          />
        </div>
        {isFlagOn('credits') && (
        <label className="flex min-h-11 items-start gap-2 rounded-xl border border-border bg-black/20 px-3 py-2 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={boost}
            disabled={!canBoost}
            onChange={(e) => setBoost(e.target.checked)}
          />
          <span>
            {t('create.boost')} ({cost.credits} Credits) <LaneBadge lane="credits" />
            <span className="block text-xs text-muted">{t('create.boostHint')}</span>
          </span>
        </label>
        )}
        <SellerFields kind={sellerKind} onKind={setSellerKind} trader={trader} onTrader={setTrader} />
        {sellerError && <p className="text-sm text-amber-200">{sellerError}</p>}
        <button
          type="button"
          className="text-sm text-[var(--theme-accent)] hover:underline"
          onClick={() => setDetailsOpen((v) => !v)}
        >
          {detailsOpen ? t('create.hideDetails') : t('create.moreDetails')}
        </button>
        {detailsOpen && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Select label={t('create.city')} value={city} onChange={(e) => setCity(e.target.value)}>
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            <Select label={t('create.industry')} value={industry} onChange={(e) => setIndustry(e.target.value)}>
              <option value="">{t('create.industryAny')}</option>
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </Select>
          </div>
        )}
        {!user && (
          <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
            {t('create.demoNote')}
          </p>
        )}
        {isFlagOn('verifyId') && intent !== 'need' && !offerOk && <VerifyPanel focus="offer" />}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={intent !== 'need' && !offerOk}>
            {t('create.publish')}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            {t('create.cancel')}
          </Button>
        </div>
        <p className="text-xs text-muted">
          <Link to="/listings/new?full=1" className="hover:underline">
            {t('create.classic')}
          </Link>
        </p>
      </form>
    </div>
  )
}

function FullCreateListing() {
  const [params] = useSearchParams()
  const { user, profile, loginDemo } = useAuth()
  const navigate = useNavigate()
  const initialVertical = (params.get('vertical') as Vertical) || 'job'
  const initialKind = (params.get('kind') as ListingKind) || 'offer'

  const [kind, setKind] = useState<ListingKind>(initialKind)
  const [vertical, setVertical] = useState<Vertical>(initialVertical)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [city, setCity] = useState(profile?.city ?? 'Berlin')
  const [craft, setCraft] = useState('')
  const [occupationIds, setOccupationIds] = useState<string[]>([])
  const [priceFrom, setPriceFrom] = useState('')
  const [priceUnit, setPriceUnit] = useState('Tag')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [tags, setTags] = useState('')
  const [venue, setVenue] = useState('')
  const [callTime, setCallTime] = useState('')
  const [requirements, setRequirements] = useState('')
  const [priceTo, setPriceTo] = useState('')
  const [travel, setTravel] = useState<TravelCover>('tbd')
  const [overnight, setOvernight] = useState<OvernightCover>('tbd')
  const [expenses, setExpenses] = useState<ExpensesCover>('receipts')
  const [expensesNote, setExpensesNote] = useState('')
  const [dayHours, setDayHours] = useState(String(MARKET_RATE.dayHours))
  const [vehicleSizeId, setVehicleSizeId] = useState(vehicleSizes[0]?.id ?? '')
  const [sellerKind, setSellerKind] = useState<SellerKind>('private')
  const [trader, setTrader] = useState<TraderDetails>(emptyTrader)
  const [sellerError, setSellerError] = useState<string | null>(null)

  const meta = useMemo(() => VERTICAL_META[vertical], [vertical])
  const isJob = vertical === 'job'

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    let u = user
    let p = profile
    if (!u || !p) {
      loginDemo()
      const demo = seedProfiles.find((x) => x.id === DEMO_USER_ID)!
      u = { id: demo.id, email: demo.email, name: demo.name, role: demo.role }
      p = demo
    }
    if (!title.trim() || !description.trim()) return
    if (sellerKind === 'commercial' && !commercialTraderComplete(trader)) {
      setSellerError('Gewerblich: Name, Anschrift, E-Mail und Telefon sind Pflicht.')
      return
    }
    setSellerError(null)
    if (isJob && !priceFrom) {
      alert('Bitte Tagessatz / Budget angeben — Rates gehören upfront ins Inserat.')
      return
    }

    const reqs = requirements
      .split('\n')
      .map((t) => t.trim())
      .filter(Boolean)

    const listing = store.createListing({
      kind,
      vertical,
      title: title.trim(),
      description: description.trim(),
      city,
      crafts: craft ? [craft] : [],
      priceFrom: priceFrom ? Number(priceFrom) : undefined,
      priceTo: priceTo ? Number(priceTo) : undefined,
      priceUnit,
      currency: 'EUR',
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      ownerId: u.id,
      ownerName: p.companyName || u.name,
      ownerVerified: p.verified,
      rating: p.rating,
      tags: [
        ...tags.split(',').map((t) => t.trim()).filter(Boolean),
        ...(vertical === 'transporter' && vehicleSizeId
          ? [vehicleSizes.find((v) => v.id === vehicleSizeId)?.shortLabel ?? vehicleSizeId]
          : []),
      ],
      capacity:
        vertical === 'transporter' && vehicleSizeId
          ? vehicleSizes.find((v) => v.id === vehicleSizeId)?.label
          : undefined,
      imageEmoji: EMOJI[vertical],
      featured: false,
      venue: venue || undefined,
      callTime: callTime || undefined,
      requirements: reqs.length ? reqs : undefined,
      travel: isJob ? travel : undefined,
      overnight: isJob ? overnight : undefined,
      expenses: isJob ? expenses : undefined,
      expensesNote: isJob && expensesNote.trim() ? expensesNote.trim() : undefined,
      dayHours: isJob && dayHours ? Number(dayHours) : undefined,
      matchReason: isJob
        ? `Tagessatz ${priceFrom ? `${priceFrom} €` : 'klar'} · ${city} · ${TRAVEL_OPTIONS[travel]} · ${p.verified !== 'none' ? 'Verifiziertes Profil' : 'Neu'}`
        : undefined,
      sellerKind,
      trader: sellerKind === 'commercial' ? trader : undefined,
    })
    navigate(`/listings/${listing.id}`)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">
          {isJob ? (kind === 'offer' ? 'Job posten' : 'Verfügbarkeit / Gesuch') : 'Inserat erstellen'}
        </h1>
        <p className="text-sm text-muted">
          {isJob
            ? 'Strukturiert in unter 2 Minuten: Zeitraum, Ort, Qualifikation, Tagessatz, Anfahrt, Übernachtung, Spesen.'
            : `Dual Marketplace: als Angebot oder Gesuch für ${meta.labelPlural}.`}
        </p>
        <p className="mt-1 text-xs text-muted">
          <Link to="/listings/new" className="text-cyan hover:underline">
            ← Einfaches Sheet
          </Link>
        </p>
      </div>
      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border bg-surface-2 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Select label="Typ" value={kind} onChange={(e) => setKind(e.target.value as ListingKind)}>
            <option value="offer">{isJob ? 'Job-Angebot (ich suche Crew)' : 'Angebot'}</option>
            <option value="request">{isJob ? 'Gesuch (ich suche Arbeit)' : 'Gesuch'}</option>
          </Select>
          <Select
            label="Vertikale"
            value={vertical}
            onChange={(e) => setVertical(e.target.value as Vertical)}
          >
            {Object.entries(VERTICAL_META).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </Select>
        </div>
        <Input
          label="Titel"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={
            isJob
              ? kind === 'offer'
                ? 'z.B. Pflegefachkraft Köln oder React Remote'
                : 'z.B. Verfügbar: Buchhaltung remote'
              : `z.B. ${meta.label} …`
          }
        />
        <Textarea
          label="Beschreibung"
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Leistungen, Zeitraum, Besonderheiten…"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Select label="Stadt" value={city} onChange={(e) => setCity(e.target.value)}>
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <OccupationField
            mode="single"
            selectedIds={occupationIds}
            other={occupationIds.length ? '' : craft}
            onChange={(next) => {
              setOccupationIds(next.occupations)
              setCraft(next.labels[0] || next.occupationOther)
            }}
          />
        </div>

        {vertical === 'transporter' && (
          <Select
            label="Fahrzeuggröße"
            value={vehicleSizeId}
            onChange={(e) => setVehicleSizeId(e.target.value)}
          >
            {vehicleSizes.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label} ({v.volumeM3Hint ?? '—'} · {v.payloadHint ?? '—'})
              </option>
            ))}
          </Select>
        )}

        {isJob && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Venue / Ort"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="Halle, Festivalgelände…"
            />
            <Input
              label="Call-Zeiten"
              value={callTime}
              onChange={(e) => setCallTime(e.target.value)}
              placeholder="07:00 Call / Load-in"
            />
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          <Input
            label={isJob ? 'Tagessatz / Budget (€) *' : 'Preis ab (€)'}
            type="number"
            min="0"
            step="1"
            required={isJob}
            value={priceFrom}
            onChange={(e) => setPriceFrom(e.target.value)}
          />
          {isJob ? (
            <Input
              label="bis (€) optional"
              type="number"
              min="0"
              step="1"
              value={priceTo}
              onChange={(e) => setPriceTo(e.target.value)}
            />
          ) : (
            <Input
              label="Einheit"
              value={priceUnit}
              onChange={(e) => setPriceUnit(e.target.value)}
              placeholder="Tag / km / Zimmer"
            />
          )}
          <Input
            label={isJob ? 'Einheit' : 'Tags (Komma)'}
            value={isJob ? priceUnit : tags}
            onChange={(e) => (isJob ? setPriceUnit(e.target.value) : setTags(e.target.value))}
            placeholder={isJob ? 'Tag' : 'Corporate, LED'}
          />
        </div>
        {isJob && <MarketRateHint />}
        {isJob && (
          <Input label="Tags (Komma)" value={tags} onChange={(e) => setTags(e.target.value)} />
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Datum von"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            required={isJob}
          />
          <Input
            label="Datum bis"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>

        {isJob && (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Select
                label="Anfahrt"
                value={travel}
                onChange={(e) => setTravel(e.target.value as TravelCover)}
              >
                {Object.entries(TRAVEL_OPTIONS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
              <Select
                label="Übernachtung"
                value={overnight}
                onChange={(e) => setOvernight(e.target.value as OvernightCover)}
              >
                {Object.entries(OVERNIGHT_OPTIONS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
              <Select
                label="Spesen"
                value={expenses}
                onChange={(e) => setExpenses(e.target.value as ExpensesCover)}
              >
                {Object.entries(EXPENSES_OPTIONS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
              <Input
                label="Arbeitstag (Stunden)"
                type="number"
                min="4"
                max="16"
                value={dayHours}
                onChange={(e) => setDayHours(e.target.value)}
              />
            </div>
            <Input
              label="Spesen / Anfahrt — Kurznotiz"
              value={expensesNote}
              onChange={(e) => setExpensesNote(e.target.value)}
              placeholder="z.B. 0,35 €/km · 28 € Pauschale · Hotel auf Firmenkonto"
            />
            <Textarea
              label="Qualifikationen / Requirements (eine pro Zeile)"
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder={'GrandMA3 Programmer\nSicherheitsschuhe S3\nschwarze Showkleidung'}
            />
          </>
        )}

        <SellerFields kind={sellerKind} onKind={setSellerKind} trader={trader} onTrader={setTrader} />
        {sellerError && <p className="text-sm text-amber-200">{sellerError}</p>}
        {!user && (
          <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
            Nicht eingeloggt — beim Speichern starten wir die Demo-Session und veröffentlichen sofort.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button type="submit">Veröffentlichen</Button>
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            Abbrechen
          </Button>
        </div>
      </form>
    </div>
  )
}
