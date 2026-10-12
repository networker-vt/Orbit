import { CITIES } from '../data/constants'
import type { Listing, MarketType } from '../types'
import { trackBehavior } from './behavior'
import { getCompany } from './company'
import { deriveMarketType, listingHaystack, overlapCount } from './market'
import { scoreB2bMatch, scoreJobMatch } from './match'
import { getPrefs, isCompanySide } from './prefs'
import { store } from './store'
import {
  searchTravelForNeed,
  type TravelKind,
  type TravelOffer,
} from './travel'
import { uid } from './utils'
import { detectCampusIntent } from './campus'
import { detectLookIntent } from './look'
import { isFlagOn } from './flags'
import { detectTripIntent, proposeTripOptions, type TripIntent, type TripOption } from './trip'

const KEY = 'orbit_assist_v1'
const EVT = 'orbit-assist-changed'

export type AssistKind =
  | 'everyday'
  | 'event'
  | 'staffing'
  | 'b2b'
  | 'job'
  | 'service'
  | 'partnership'
  | 'travel'
  | 'look'
  | 'campus'

export interface ParsedIntent {
  text: string
  kind: AssistKind
  items: string[]
  city?: string
  fromCity?: string
  dateIso?: string
  dateLabel?: string
  peopleCount?: number
  companyNeed: boolean
  marketTypes: MarketType[]
  travelKinds: TravelKind[]
  cheapest: boolean
  lookIntent?: ReturnType<typeof detectLookIntent>
  trip?: TripIntent
  returnCity?: string
}

export interface PlanStep {
  id: string
  title: string
  hint: string
  actionTo?: string
  actionLabel?: string
  remindable: boolean
  done: boolean
}

export interface AssistTip {
  title: string
  body: string
}

export interface AssistPlan {
  id: string
  createdAt: string
  intent: ParsedIntent
  summary: string
  steps: PlanStep[]
  tips: AssistTip[]
  disclaimer: string
  matchIds: string[]
  travelIds: string[]
  tripOptions?: TripOption[]
  source: 'heuristic' | 'llm'
}

interface AssistState {
  lastPlan: AssistPlan | null
}

function defaultState(): AssistState {
  return { lastPlan: null }
}

function load(): AssistState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultState()
    return { ...defaultState(), ...(JSON.parse(raw) as AssistState) }
  } catch {
    return defaultState()
  }
}

let cache: AssistState | null = null
function get(): AssistState {
  if (!cache) cache = load()
  return cache
}
function commit(next: AssistState) {
  cache = next
  localStorage.setItem(KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent(EVT))
}

export function subscribeAssist(cb: () => void) {
  const h = () => cb()
  window.addEventListener(EVT, h)
  window.addEventListener('storage', h)
  return () => {
    window.removeEventListener(EVT, h)
    window.removeEventListener('storage', h)
  }
}

export function getLastPlan(): AssistPlan | null {
  const plan = get().lastPlan ? structuredClone(get().lastPlan) : null
  if (!plan) return null
  plan.travelIds = plan.travelIds || []
  plan.intent.travelKinds = plan.intent.travelKinds || []
  plan.intent.cheapest = Boolean(plan.intent.cheapest)
  plan.tripOptions = Array.isArray(plan.tripOptions) ? plan.tripOptions.slice(0, 3) : []
  return plan
}

export function savePlan(plan: AssistPlan) {
  commit({ lastPlan: plan })
}

export function clearPlan() {
  commit({ lastPlan: null })
}

export function togglePlanStep(stepId: string) {
  const plan = get().lastPlan
  if (!plan) return
  savePlan({
    ...plan,
    steps: plan.steps.map((s) => (s.id === stepId ? { ...s, done: !s.done } : s)),
  })
}

const CITY_ALIASES: Record<string, string> = {
  muenchen: 'München',
  münchen: 'München',
  munich: 'München',
  koeln: 'Köln',
  köln: 'Köln',
  cologne: 'Köln',
  frankfurt: 'Frankfurt',
  hamburg: 'Hamburg',
  berlin: 'Berlin',
  amsterdam: 'Amsterdam',
  london: 'London',
  paris: 'Paris',
  warsaw: 'Warsaw',
  warszawa: 'Warsaw',
  wien: 'Wien',
  vienna: 'Wien',
  zürich: 'Zürich',
  zurich: 'Zürich',
  madrid: 'Madrid',
  milan: 'Milan',
  milano: 'Milan',
  rotterdam: 'Rotterdam',
}

const EVERYDAY = [
  'milch',
  'milk',
  'regal',
  'shelf',
  'einkauf',
  'grocery',
  'lebensmittel',
  'möbel',
  'moebel',
  'furniture',
  'laptop',
  'hardware',
]
const EVENT_WORDS = [
  'veranstaltung',
  'event',
  'messe',
  'festival',
  'gala',
  'konzert',
  'show',
  'location',
]
const STAFF_WORDS = ['techniker', 'stagehand', 'crew', 'personal', 'staffing', 'hiring', 'mitarbeiter']
const B2B_WORDS = ['partner', 'partnerschaft', 'b2b', 'led wall', 'led-wall', 'saas', 'fulfillment', '3pl']
const SERVICE_WORDS = ['dienstleistung', 'hilfe', 'service', 'übersetz', 'buchhaltung', 'ux']
const JOB_WORDS = ['job', 'minijob', 'stelle', 'schicht']
const COMPANY_CUE = ['wir brauchen', 'wir suchen', 'firma', 'unser team', 'b2b', 'partner']

function parseDate(text: string): { iso?: string; label?: string } {
  const m = text.match(/\b(\d{1,2})\.(\d{1,2})\.(\d{2,4})\b/) || text.match(/\b(\d{1,2})\.(\d{1,2})\b/)
  if (m) {
    const d = Number(m[1])
    const mo = Number(m[2])
    let y = m[3] ? Number(m[3]) : new Date().getFullYear()
    if (y < 100) y += 2000
    const now = new Date()
    let dt = new Date(y, mo - 1, d)
    if (!m[3] && dt.getTime() < now.getTime() - 86400000) dt = new Date(y + 1, mo - 1, d)
    const iso = `${dt.getFullYear()}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    return { iso, label: `${String(d).padStart(2, '0')}.${String(mo).padStart(2, '0')}.${dt.getFullYear()}` }
  }
  const iso = text.match(/\b(\d{4}-\d{2}-\d{2})\b/)
  if (iso) return { iso: iso[1], label: iso[1] }
  if (/\bheute\b|today/i.test(text)) {
    const t = new Date()
    const stamp = t.toISOString().slice(0, 10)
    return { iso: stamp, label: 'heute' }
  }
  const days: Record<string, number> = {
    sonntag: 0,
    sunday: 0,
    montag: 1,
    monday: 1,
    dienstag: 2,
    tuesday: 2,
    mittwoch: 3,
    wednesday: 3,
    donnerstag: 4,
    thursday: 4,
    freitag: 5,
    friday: 5,
    samstag: 6,
    saturday: 6,
  }
  for (const [name, dow] of Object.entries(days)) {
    if (text.includes(name)) {
      const now = new Date()
      const add = (dow - now.getDay() + 7) % 7
      const dt = new Date(now.getFullYear(), now.getMonth(), now.getDate() + add)
      const stamp = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
      return { iso: stamp, label: name }
    }
  }
  return {}
}

function parseCity(text: string): string | undefined {
  const lower = text.toLowerCase()
  for (const [alias, city] of Object.entries(CITY_ALIASES)) {
    if (lower.includes(alias)) return city
  }
  for (const c of CITIES) {
    if (c !== 'Remote' && lower.includes(c.toLowerCase())) return c
  }
  return undefined
}

function titleCaseCity(raw: string): string {
  const key = raw.toLowerCase()
  return CITY_ALIASES[key] || parseCity(raw) || raw[0]?.toUpperCase() + raw.slice(1)
}

function parseFromTo(text: string, fallbackCity?: string): { to?: string; from?: string } {
  const arrow = text.match(/([A-Za-zÄÖÜäöüß\-]+)\s*(?:→|->|–|—)\s*([A-Za-zÄÖÜäöüß\-]+)/)
  const nach = text.match(/\b(?:nach|to)\s+([A-Za-zÄÖÜäöüß\-]+)/i)
  const von = text.match(/\b(?:von|from|ab)\s+([A-Za-zÄÖÜäöüß\-]+)/i)
  return {
    to: arrow ? titleCaseCity(arrow[2]) : nach ? titleCaseCity(nach[1]) : fallbackCity,
    from: arrow ? titleCaseCity(arrow[1]) : von ? titleCaseCity(von[1]) : undefined,
  }
}

const TRAVEL_FLIGHT = ['flug', 'flüge', 'fluege', 'flight', 'airline', 'fliegen', 'flieger']
const TRAVEL_HOTEL = ['hotel', 'hostel', 'übernacht', 'uebernacht', 'unterkunft', 'overnight']
const TRAVEL_RAIL = ['bahn', 'ice', 'zug', 'rail', 'train']
const TRAVEL_CAR = ['mietwagen', 'rental', 'mietauto', 'leihwagen', 'hire car']
const TRAVEL_PKG = ['urlaub', 'package', 'pauschal', 'weekend']
const TRAVEL_TRANSFER = ['transfer', 'shuttle', 'zubringer', 'flughafentransfer']
const TRAVEL_ANY = [
  'reise',
  'travel',
  'trip',
  'fliegen',
  ...TRAVEL_FLIGHT,
  ...TRAVEL_HOTEL,
  ...TRAVEL_RAIL,
  ...TRAVEL_CAR,
  ...TRAVEL_PKG,
  ...TRAVEL_TRANSFER,
]

function detectTravelKinds(lower: string): TravelKind[] {
  const kinds: TravelKind[] = []
  if (TRAVEL_FLIGHT.some((w) => lower.includes(w))) kinds.push('flight')
  if (TRAVEL_HOTEL.some((w) => lower.includes(w))) kinds.push('hotel')
  if (TRAVEL_RAIL.some((w) => lower.includes(w))) kinds.push('rail')
  if (TRAVEL_CAR.some((w) => lower.includes(w))) kinds.push('car')
  if (TRAVEL_PKG.some((w) => lower.includes(w))) kinds.push('package')
  return kinds
}

function parsePeople(text: string): number | undefined {
  const m = text.match(/\b(\d{1,2})\s*(techniker|leute|personen|köpfe|heads|crew|staff)\b/i)
  if (m) return Number(m[1])
  return undefined
}

function extractItems(text: string): string[] {
  const items: string[] = []
  const cleaned = text.replace(/ich brauche|i need|wir brauchen|we need|heute|today|hilfe bei|help with/gi, '')
  cleaned.split(/,| und | and | \+ |;/i).forEach((part) => {
    const p = part.trim()
    if (p.length < 2 || p.length > 48) return
    if (/^(für|for|am|on|in|bei|the|a|an)$/i.test(p)) return
    if (/\d{1,2}\.\d{1,2}/.test(p)) return
    items.push(p.replace(/\s+/g, ' '))
  })
  return items.slice(0, 6)
}

export function parseIntent(raw: string): ParsedIntent {
  const text = raw.trim()
  const lower = text.toLowerCase()
  const { iso, label } = parseDate(lower)
  const cityGuess = parseCity(lower)
  const { to, from } = parseFromTo(lower, cityGuess)
  const city = to || cityGuess
  const peopleCount = parsePeople(lower)
  const items = extractItems(text)
  const companyNeed = COMPANY_CUE.some((c) => lower.includes(c)) || isCompanySide(getPrefs().side)
  const travelKinds = detectTravelKinds(lower)
  const cheapest = /billigst|günstigst|guenstigst|cheapest|lowest/i.test(lower)
  const lookIntent = detectLookIntent(lower)
  const campusIntent = detectCampusIntent(lower)
  const trip = detectTripIntent(text)
  let kind: AssistKind = 'everyday'
  if (campusIntent) kind = 'campus'
  else if (trip.matched) kind = 'travel'
  else if (lookIntent && !TRAVEL_ANY.some((w) => lower.includes(w))) kind = 'look'
  else if (travelKinds.length || TRAVEL_ANY.some((w) => lower.includes(w))) kind = 'travel'
  else if (EVENT_WORDS.some((w) => lower.includes(w))) kind = 'event'
  else if (B2B_WORDS.some((w) => lower.includes(w)) && (STAFF_WORDS.some((w) => lower.includes(w)) || peopleCount))
    kind = 'staffing'
  else if (B2B_WORDS.some((w) => lower.includes(w))) kind = 'b2b'
  else if (STAFF_WORDS.some((w) => lower.includes(w)) || peopleCount) kind = 'staffing'
  else if (JOB_WORDS.some((w) => lower.includes(w))) kind = 'job'
  else if (SERVICE_WORDS.some((w) => lower.includes(w))) kind = 'service'
  else if (lower.includes('partner')) kind = 'partnership'
  else if (EVERYDAY.some((w) => lower.includes(w))) kind = 'everyday'

  const marketTypes: MarketType[] =
    kind === 'travel'
      ? ['service', 'asset']
      : kind === 'everyday'
      ? ['asset', 'service', 'minijob']
      : kind === 'event'
        ? ['service', 'job', 'b2b', 'asset', 'partnership']
        : kind === 'staffing'
          ? ['job', 'service', 'b2b']
          : kind === 'b2b'
            ? ['b2b', 'partnership', 'service']
            : kind === 'job'
              ? ['job', 'minijob']
              : kind === 'partnership'
                ? ['partnership', 'b2b']
              : kind === 'look'
                ? ['asset', 'service']
                : kind === 'campus'
                  ? ['minijob', 'service']
                : ['service', 'job']

  return {
    text,
    kind,
    items: items.length ? items : [text.slice(0, 80)],
    city: trip.matched ? trip.to || city : city,
    fromCity: trip.matched ? trip.from || from : from,
    dateIso: iso,
    dateLabel: label,
    peopleCount,
    companyNeed,
    marketTypes,
    travelKinds,
    cheapest,
    lookIntent: lookIntent || undefined,
    trip: trip.matched ? trip : undefined,
    returnCity: trip.returnTo,
  }
}

function step(title: string, hint: string, extra?: Partial<PlanStep>): PlanStep {
  return {
    id: uid('ps'),
    title,
    hint,
    remindable: extra?.remindable ?? true,
    done: false,
    actionTo: extra?.actionTo,
    actionLabel: extra?.actionLabel,
  }
}

export function heuristicPlan(intent: ParsedIntent, locale: 'de' | 'en'): Omit<AssistPlan, 'id' | 'createdAt' | 'matchIds' | 'travelIds' | 'source'> {
  const de = locale === 'de'
  const where = intent.city || (de ? 'dein Ort' : 'your city')
  const when = intent.dateLabel || (de ? 'der Termin' : 'the date')
  const n = intent.peopleCount
  const tips: AssistTip[] = []
  const steps: PlanStep[] = []
  let summary = ''

  if (intent.kind === 'campus') {
    summary = de
      ? 'Campus: ein Kurs, Weiterlernen, Filter nach Stufe — Entdecken bleibt frei.'
      : 'Campus: one course, resume, filter by level — discovery stays free.'
    steps.push(
      step(
        de ? 'Katalog öffnen' : 'Open the catalog',
        de
          ? 'Grundschule bis Skills. Kids sehen nur safeForKids-Kurse.'
          : 'Primary school through skills. Kids only see safeForKids courses.',
        { actionTo: '/campus', actionLabel: de ? 'Campus' : 'Campus', remindable: false },
      ),
      step(
        de ? 'Weiterlernen' : 'Resume learning',
        de ? 'Allda merkt den letzten Kurs auf diesem Gerät.' : 'Allda remembers the last course on this device.',
        { actionTo: '/campus', actionLabel: de ? 'Weiterlernen' : 'Resume' },
      ),
    )
    tips.push({
      title: de ? 'Allda berät (Campus)' : 'Allda advises (Campus)',
      body: de
        ? 'Demo-Katalog, keine echten Schulabschlüsse. Premium-Unlock kommt später über SoftPaywall — Entdecken bleibt frei.'
        : 'Demo catalog, no real diplomas. Premium unlock comes later via SoftPaywall — discovery stays free.',
    })
  } else if (intent.kind === 'look') {
    const look = intent.lookIntent || 'kleidung'
    const qs = new URLSearchParams({ intent: look })
    summary = de
      ? `Kabine (${look}): Foto oder kurzes Video — Allda schlägt Varianten, Shops und Nearby vor.`
      : `Kabine (${look}): photo or short video — Allda suggests variants, shops and nearby.`
    steps.push(
      step(
        de ? 'Foto aufnehmen' : 'Take a photo',
        de
          ? 'Selfie, Upload oder kurzes Video. Basis-Analyse ist frei — Demo/Vision-Stub, kein Live-ML.'
          : 'Selfie, upload or short video. Basic analysis is free — demo/vision stub, no live ML.',
        { actionTo: `/kabine?${qs.toString()}`, actionLabel: de ? 'Kabine öffnen' : 'Open Kabine', remindable: false },
      ),
      step(
        de ? 'Varianten vergleichen' : 'Compare variants',
        de
          ? isFlagOn('credits')
            ? 'Foto plus 1–2 Filter frei. Extra-Try-on-Pack aus dem 21M-Credits-Pool.'
            : 'Foto plus 1–2 Filter. Die Vorschläge bleiben ohne Aufpreis.'
          : isFlagOn('credits')
            ? 'Photo plus 1–2 filters free. Extra try-on pack from the 21M credits pool.'
            : 'Photo plus 1–2 filters. Suggestions stay free of charge.',
        { actionTo: `/kabine?${qs.toString()}`, actionLabel: de ? 'Anprobe (Demo)' : 'Try-on (demo)' },
      ),
      step(
        de ? 'Shops & Nearby' : 'Shops & nearby',
        de
          ? 'Produktkacheln + Friseur, Optiker, Läden in deinem Radius (Prefs).'
          : 'Product tiles + hair, optician, shops in your radius (prefs).',
        { actionTo: `/kabine?${qs.toString()}`, actionLabel: de ? 'In der Nähe' : 'Nearby' },
      ),
    )
    tips.push({
      title: de ? 'Allda berät (Kabine)' : 'Allda advises (Kabine)',
      body: de
        ? isFlagOn('credits')
          ? 'Kein echtes Virtual-Try-on-ML auf dem Gerät. Filter + Labels + Seed-Shops. Featured Nearby kostet Credits, mintet nicht über 21M.'
          : 'Kein echtes Virtual-Try-on-ML auf dem Gerät. Filter, Labels und Beispiel-Shops. Kein Aufpreis.'
        : isFlagOn('credits')
          ? 'No real virtual try-on ML on device. Filters + labels + seeded shops. Featured nearby costs Credits, never mints above 21M.'
          : 'No real virtual try-on ML on device. Filters, labels and sample shops. No extra charge.',
    })
  } else if (intent.kind === 'travel') {
    const dest = intent.city || (de ? 'dein Ziel' : 'your destination')
    const when = intent.dateLabel || (de ? 'dein Datum' : 'your date')
    const kinds = intent.travelKinds.length
      ? intent.travelKinds.join(' + ')
      : de
        ? 'Reise'
        : 'travel'
    const tripCards = intent.trip ? proposeTripOptions(intent.trip) : []
    summary =
      tripCards.length && de
        ? `Orbi: ${tripCards.length} Optionen nach ${dest}${intent.returnCity ? ` · zurück ${intent.returnCity}` : ''} — Preis, Balance, Schnell.`
        : tripCards.length
          ? `Orbi: ${tripCards.length} options to ${dest}${intent.returnCity ? ` · back ${intent.returnCity}` : ''} — Price, Balance, Fast.`
          : de
            ? `${intent.cheapest ? 'Günstigste Optionen' : 'Optionen'} nach ${dest}${intent.dateLabel ? ` (${when})` : ''} — ${kinds}.`
            : `${intent.cheapest ? 'Cheapest options' : 'Options'} to ${dest}${intent.dateLabel ? ` (${when})` : ''} — ${kinds}.`
    const qs = new URLSearchParams()
    if (intent.travelKinds[0]) qs.set('kind', intent.travelKinds[0])
    if (intent.city) qs.set('to', intent.city)
    if (intent.fromCity) qs.set('from', intent.fromCity)
    if (intent.dateIso) qs.set('date', intent.dateIso)
    if (intent.cheapest) qs.set('sort', 'price')
    steps.push(
      step(
        de ? 'Optionen ansehen' : 'See the sketches',
        de
          ? 'Skizze, kein Live-Tarif. Bahn kommt auf Abflug aus der Fahrplan-API, sonst Suchlink.'
          : 'A sketch, not a live fare. Rail on Abflug uses the timetable API, otherwise a search link.',
        { actionTo: `/abflug?${qs.toString()}`, actionLabel: de ? 'Abflug' : 'Abflug', remindable: false },
      ),
      step(
        de ? 'Beim Anbieter suchen' : 'Search with the provider',
        de
          ? 'Flüge und Hotels verlassen Allda. Kein Ticket, kein Geld.'
          : 'Flights and hotels leave Allda. No ticket, no money.',
        { actionTo: `/abflug?${qs.toString()}`, actionLabel: de ? 'Suche öffnen' : 'Open search' },
      ),
      step(
        de ? 'Kein Ticket in Allda' : 'No ticket inside Allda',
        de
          ? 'Allda speichert keine Buchung. Der QR-Stub ist keine Fahrkarte.'
          : 'Allda does not store a booking. A QR stub is not a ticket.',
        { actionTo: `/abflug?${qs.toString()}`, actionLabel: de ? 'Abflug' : 'Abflug' },
      ),
    )
    tips.push({
      title: de ? 'Allda berät (Reise)' : 'Allda advises (travel)',
      body: de
        ? 'Stub ≠ Live. Tippen oder Stimme 1/2/3 wählt eine Skizze. Der nächste Schritt ist die öffentliche Suche, keine Buchung.'
        : 'Stub ≠ live. Tap or say 1/2/3 to pick a sketch. The next step is a public search, not a booking.',
    })
  } else if (intent.kind === 'everyday') {
    summary = de
      ? `Kurzer Plan für heute: ${intent.items.slice(0, 3).join(', ')}.`
      : `A short plan for today: ${intent.items.slice(0, 3).join(', ')}.`
    steps.push(
      step(
        de ? 'Liste klären' : 'Clarify the list',
        de
          ? `Bedarf: ${intent.items.join(', ')}. Allda sucht Angebote statt Katalog-Spam.`
          : `Need: ${intent.items.join(', ')}. Allda matches offers instead of dumping a catalogue.`,
        { actionTo: '/marktplatz?type=asset', actionLabel: de ? 'Marktplatz' : 'Marketplace', remindable: false },
      ),
      step(
        de ? 'Passende Angebote prüfen' : 'Review matching offers',
        de ? 'Max. ein paar Treffer — Interesse oder selbst posten.' : 'A few matches — Interest or post a need.',
        { actionTo: '/match', actionLabel: 'Match' },
      ),
      step(
        de ? 'Erinnerung setzen' : 'Set a reminder',
        de ? 'Heute erledigen — landet in Mein Bereich.' : 'Do it today — lands in Me.',
      ),
    )
    tips.push({
      title: de ? 'Allda berät' : 'Allda advises',
      body: de
        ? 'Alltagsbedarf: erst Liste, dann 1–2 Anbieter, dann Erinnerung. Kein Same-Day-Amazon-Feed.'
        : 'Everyday needs: list first, then 1–2 providers, then a reminder. No same-day Amazon feed.',
    })
  } else if (intent.kind === 'event') {
    summary = de
      ? `Plan für eine Veranstaltung in ${where}${intent.dateLabel ? ` am ${when}` : ''}.`
      : `Plan for an event in ${where}${intent.dateLabel ? ` on ${when}` : ''}.`
    steps.push(
      step(
        de ? 'Ort / Location (Stub)' : 'Venue / location (stub)',
        de
          ? 'Keine Live-Suche — Demo-Hinweis + Archiv-Locations. Später Partner-APIs.'
          : 'No live search — demo note + archive locations. Partner APIs later.',
        { actionTo: '/marktplatz', actionLabel: de ? 'Marktplatz' : 'Marketplace' },
      ),
      step(
        de ? 'Dienstleister matchen' : 'Match service partners',
        de ? 'Technik, Crew-Services, Material — preference-first.' : 'Tech, crew services, assets — preference-first.',
        { actionTo: '/marktplatz?type=service', actionLabel: de ? 'Dienstleistungen' : 'Services' },
      ),
      step(
        de ? 'Personal / Crew' : 'Staffing / crew',
        n
          ? de
            ? `${n} Personen einplanen — Jobs + Kandidaten im Match Finder.`
            : `Plan for ${n} people — jobs + candidates in Match Finder.`
          : de
            ? 'Crew über Match Finder, nicht über Listen-Spam.'
            : 'Crew via Match Finder, not list spam.',
        { actionTo: '/match', actionLabel: 'Match' },
      ),
      step(
        de ? 'Ticketing & Ideen' : 'Ticketing & ideas',
        de ? 'Ideen-Box für Ablauf; Ticketing ist ein Stub / Partner später.' : 'Ideas box for run-of-show; ticketing is a stub / partner later.',
        { actionTo: '/ideen', actionLabel: de ? 'Ideen' : 'Ideas' },
      ),
      step(
        de ? 'Timeline & Erinnerungen' : 'Timeline & reminders',
        de
          ? `Anker: ${when}. Erinnerungen für Location, Crew-Lock, Load-in.`
          : `Anchor: ${when}. Reminders for venue, crew lock, load-in.`,
      ),
    )
    tips.push(
      {
        title: de ? 'Best practice' : 'Best practice',
        body: de
          ? 'Location und Crew früh locken; LED/Ton als B2B-Partner, nicht als Job-Spam. Call-Zeit + Spesen schriftlich.'
          : 'Lock venue and crew early; LED/audio as B2B partners, not job spam. Call time + expenses in writing.',
      },
      {
        title: de ? 'Demo-Recherche' : 'Demo research',
        body: de
          ? 'Keine Live-LLM-Pflicht. Tipps sind Heuristiken auf diesem Gerät. Optionaler API-Key: VITE_LLM_API_KEY.'
          : 'No live LLM required. Tips are on-device heuristics. Optional API key: VITE_LLM_API_KEY.',
      },
    )
  } else if (intent.kind === 'staffing' || (intent.companyNeed && n)) {
    summary = de
      ? `Firma: ${n ? `${n} ` : ''}Leute${intent.city ? ` in ${intent.city}` : ''} plus passende Partner.`
      : `Company: ${n ? `${n} ` : ''}people${intent.city ? ` in ${intent.city}` : ''} plus matching partners.`
    steps.push(
      step(de ? 'Hiring-Bedarf festhalten' : 'Capture hiring need', intent.items.join(', '), {
        actionTo: '/firma',
        actionLabel: de ? 'Firmen-Hub' : 'Company hub',
      }),
      step(
        de ? 'Kandidaten swipen' : 'Swipe candidates',
        de ? 'Employer Match Finder — Mutual Match öffnet Chat.' : 'Employer Match Finder — mutual match seeds chat.',
        { actionTo: '/match', actionLabel: 'Match' },
      ),
      step(
        de ? 'B2B / Material-Partner' : 'B2B / asset partners',
        de ? 'LED, Locations, Ops — komplementäre Angebote.' : 'LED, venues, ops — complementary offers.',
        { actionTo: '/marktplatz?type=b2b', actionLabel: 'B2B' },
      ),
      step(
        de ? 'Bedarf posten' : 'Post a need',
        de ? 'Ein Sheet: Typ Bedarf, Titel, optional Budget.' : 'One sheet: type Need, title, optional budget.',
        { actionTo: '/listings/new?intent=need', actionLabel: de ? 'Erstellen' : 'Create' },
      ),
    )
    tips.push({
      title: de ? 'Allda berät (B2B)' : 'Allda advises (B2B)',
      body: de
        ? 'Rollen + Must-haves in Prefs. Partner über Angebot↔Bedarf matchen, nicht über Kataloge.'
        : 'Roles + must-haves in prefs. Match partners via offer↔need, not catalogues.',
    })
  } else if (intent.kind === 'b2b' || intent.kind === 'partnership') {
    summary = de
      ? 'B2B-/Partner-Plan: komplementäre Angebote, dann Mutual Match.'
      : 'B2B/partner plan: complementary offers, then a mutual match.'
    steps.push(
      step(de ? 'Angebot vs. Bedarf' : 'Offer vs need', de ? 'Im Firmen-Hub pflegen.' : 'Keep this in the company hub.', {
        actionTo: '/firma',
        actionLabel: de ? 'Firma' : 'Company',
      }),
      step(de ? 'Marktplatz filtern' : 'Filter marketplace', de ? 'B2B und Partnerschaften.' : 'B2B and partnerships.', {
        actionTo: intent.kind === 'partnership' ? '/marktplatz?type=partnership' : '/marktplatz?type=b2b',
        actionLabel: de ? 'Marktplatz' : 'Marketplace',
      }),
      step(de ? 'Match Finder' : 'Match Finder', de ? 'Swipe Partner, nicht Listen.' : 'Swipe partners, not lists.', {
        actionTo: '/match',
        actionLabel: 'Match',
      }),
    )
    tips.push({
      title: de ? 'Partnerschaft' : 'Partnership',
      body: de
        ? 'Komplementär matchen (ihr bietet X, die andere Seite braucht X). Ein Inserat reicht.'
        : 'Match complementary sides (you offer X, they need X). One listing is enough.',
    })
  } else {
    summary = de ? `Plan zu: ${intent.text}` : `Plan for: ${intent.text}`
    steps.push(
      step(de ? 'Prefs prüfen' : 'Check prefs', de ? 'Hard-Filter vor dem Feed.' : 'Hard-filter before the feed.', {
        actionTo: '/prefs',
        actionLabel: 'Prefs',
        remindable: false,
      }),
      step(de ? 'Match Finder' : 'Match Finder', de ? 'Swipe passender Karten.' : 'Swipe matching cards.', {
        actionTo: '/match',
        actionLabel: 'Match',
      }),
      step(de ? 'Oder Bedarf posten' : 'Or post a need', '', {
        actionTo: '/listings/new?intent=need',
        actionLabel: de ? 'Erstellen' : 'Create',
      }),
    )
    tips.push({
      title: de ? 'Allda berät' : 'Allda advises',
      body: de
        ? 'Preference-first: ohne Prefs kein Spam-Feed. 1-Tap Interesse statt Anschreiben.'
        : 'Preference-first: no prefs, no spam feed. 1-tap Interest instead of a cover letter.',
    })
  }

  const disclaimer = de
    ? 'Allda Assist ist ein lokaler Planer (Heuristik). Live-Recherche nur mit optionalem VITE_LLM_API_KEY — sonst Demo-Recherche. Keine echten Zahlungen.'
    : 'Allda Assist is a local planner (heuristics). Live research only with optional VITE_LLM_API_KEY — otherwise demo research. No real payments.'

  return { intent, summary, steps, tips, disclaimer }
}

export function matchListingsForIntent(intent: ParsedIntent, limit = 4): Listing[] {
  const prefs = getPrefs()
  const company = getCompany()
  const all = store.listListings({})
  const needles = [...intent.items, intent.city || '', ...(intent.kind === 'event' ? ['event', 'technik', 'led'] : [])]
  const scored = all
    .filter((l) => l.status === 'active')
    .map((l) => {
      const lane = deriveMarketType(l)
      let score = 0
      if (intent.marketTypes.includes(lane)) score += 20
      const hay = listingHaystack(l)
      score += overlapCount(needles, hay) * 12
      if (intent.city && l.city.toLowerCase() === intent.city.toLowerCase()) score += 16
      if (intent.dateIso && l.dateFrom && Math.abs(Date.parse(l.dateFrom) - Date.parse(intent.dateIso)) < 14 * 86400000)
        score += 8
      if (intent.kind === 'everyday' && (lane === 'asset' || lane === 'minijob' || lane === 'service')) score += 10
      if (intent.kind === 'event' && (l.industry || '').toLowerCase().startsWith('event')) score += 8
      if (intent.companyNeed && (lane === 'b2b' || lane === 'partnership')) score += 10
      const ms =
        lane === 'job' || lane === 'minijob'
          ? scoreJobMatch(l, prefs).percent
          : scoreB2bMatch(l, prefs, company).percent
      score += Math.round(ms / 12)
      return { l, score }
    })
    .filter((x) => x.score >= 12)
    .sort((a, b) => b.score - a.score)
  return scored.slice(0, limit).map((x) => x.l)
}

function llmConfigured() {
  const key = import.meta.env.VITE_LLM_API_KEY
  return Boolean(key && key.trim())
}

async function tryLlmEnrich(
  intent: ParsedIntent,
  locale: 'de' | 'en',
  signal?: AbortSignal,
): Promise<AssistTip[] | null> {
  const key = import.meta.env.VITE_LLM_API_KEY?.trim()
  if (!key) return null
  const url = import.meta.env.VITE_LLM_URL?.trim() || 'https://api.openai.com/v1/chat/completions'
  const model = import.meta.env.VITE_LLM_MODEL?.trim() || 'gpt-4o-mini'
  const prompt =
    locale === 'de'
        ? `Du bist Allda, ein klarer Job-/Marktplatz-Concierge. Gib 2 kurze Tipps (je max 220 Zeichen) als JSON {"tips":[{"title":"...","body":"..."}]} ohne Katalog-Spam. Anfrage: ${intent.text}`
        : `You are Allda, a clear job/marketplace concierge. Return 2 short tips (max 220 chars each) as JSON {"tips":[{"title":"...","body":"..."}]} with no catalogue spam. Ask: ${intent.text}`
  try {
    const ctrl = new AbortController()
    const t = window.setTimeout(() => ctrl.abort(), 8000)
    const onAbort = () => ctrl.abort()
    signal?.addEventListener('abort', onAbort)
    const res = await fetch(url, {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 280,
      }),
    })
    window.clearTimeout(t)
    signal?.removeEventListener('abort', onAbort)
    if (!res.ok) return null
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] }
    const content = json.choices?.[0]?.message?.content || ''
    const parsed = JSON.parse(content.replace(/```json|```/g, '').trim()) as { tips?: AssistTip[] }
    if (Array.isArray(parsed.tips) && parsed.tips.length) return parsed.tips.slice(0, 3)
  } catch {
    return null
  }
  return null
}

export function primaryAssistAction(plan: AssistPlan): PlanStep | null {
  return plan.steps.find((s) => !s.done && s.actionTo) || plan.steps.find((s) => s.actionTo) || null
}

export async function buildAssistPlan(
  text: string,
  locale: 'de' | 'en',
  signal?: AbortSignal,
): Promise<AssistPlan | null> {
  if (signal?.aborted) return null
  const intent = parseIntent(text)
  const base = heuristicPlan(intent, locale)
  let source: AssistPlan['source'] = 'heuristic'
  if (llmConfigured()) {
    const extra = await tryLlmEnrich(intent, locale, signal)
    if (extra?.length) {
      base.tips = [...extra, ...base.tips].slice(0, 4)
      source = 'llm'
    }
  }
  if (signal?.aborted) return null
  const matches = intent.kind === 'travel' ? [] : matchListingsForIntent(intent, 4)
  const tripOptions = intent.trip ? proposeTripOptions(intent.trip).slice(0, 3) : []
  const travel =
    intent.kind === 'travel' && !tripOptions.length
      ? searchTravelForNeed({
          kinds: intent.travelKinds,
          to: intent.city,
          from: intent.fromCity,
          dateIso: intent.dateIso,
          q: intent.text,
        }).slice(0, 4)
      : []
  const plan: AssistPlan = {
    id: uid('plan'),
    createdAt: new Date().toISOString(),
    ...base,
    matchIds: matches.map((m) => m.id),
    travelIds: travel.map((o) => o.id),
    tripOptions,
    source,
  }
  savePlan(plan)
  trackBehavior({
    kind: 'assist',
    query: text,
    city: intent.city,
  })
  return plan
}

export function listingsForPlan(plan: AssistPlan): Listing[] {
  return plan.matchIds.map((id) => store.getListing(id)).filter((l): l is Listing => Boolean(l))
}

export function travelForPlan(plan: AssistPlan): Array<TravelOffer & { cheapest?: boolean }> {
  const ids = plan.travelIds || []
  return searchTravelForNeed({
    kinds: plan.intent.travelKinds,
    to: plan.intent.city,
    from: plan.intent.fromCity,
    dateIso: plan.intent.dateIso,
    q: plan.intent.text,
  }).filter((o) => ids.includes(o.id))
}
