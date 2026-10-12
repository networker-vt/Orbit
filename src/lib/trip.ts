/**
 * Orbi trip options — Assist result only.
 * Super veto: max 2–3 cards (Preis / Balance / Schnell). Voice whitelist
 * selects a card; it never books. The follow-up opens a public search.
 * Stub sketches — not live GDS. Do not claim 100% secure.
 */
import { flightSearchUrl, hotelSearchUrl } from './travelConnectors'

export type TripAxis = 'preis' | 'balance' | 'schnell'
export type TripSeed = 'koeln-monaco-landsberg' | 'generic'

export interface TripScores {
  preis: number
  balance: number
  shortest: number
}

export interface TripOption {
  id: string
  axis: TripAxis
  labelDe: string
  labelEn: string
  priceHintDe: string
  priceHintEn: string
  durationHintDe: string
  durationHintEn: string
  hotelHintDe: string
  hotelHintEn: string
  transferHintDe: string
  transferHintEn: string
  flightSketchDe: string
  flightSketchEn: string
  priceEur: number
  scores: TripScores
  demo: true
  seed: TripSeed
}

export interface TripIntent {
  matched: boolean
  seed: TripSeed | null
  from?: string
  to?: string
  returnTo?: string
  wantsFlight: boolean
  wantsHotel: boolean
  wantsTransfer: boolean
  messe: boolean
}

export const TRIP_AXES: TripAxis[] = ['preis', 'balance', 'schnell']
export const TRIP_CARD_MAX = 3

const KOELN = /\b(k[oö]ln|koeln|cologne|cgn)\b/i
const MONACO = /\b(monaco|monte[\s-]?carlo|nce)\b/i
const LANDSBERG = /\b(landsberg(\s+am\s+lech)?)\b/i

const VOICE_WHITELIST: Record<string, 1 | 2 | 3> = {
  '1': 1,
  '2': 2,
  '3': 3,
  eins: 1,
  zwei: 2,
  drei: 3,
  one: 1,
  two: 2,
  three: 3,
  'option 1': 1,
  'option 2': 2,
  'option 3': 3,
  'option eins': 1,
  'option zwei': 2,
  'option drei': 3,
  'option one': 1,
  'option two': 2,
  'option three': 3,
}

/** Booking / pay verbs — if present, voice is not a whitelist select. */
const VOICE_BOOK_VERBS =
  /\b(buch|book|kauf|buy|zahl|pay|checkout|bestell|order|confirm|bestätig)\w*/i

export function normalizeVoiceUtterance(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[.,!?…]+/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^option\s+/i, 'option ')
}

/**
 * Whitelist only: 1/2/3, eins/zwei/drei, Option eins…
 * Extra words or booking verbs → null. Never books.
 */
export function matchSpokenTripChoice(raw: string): 1 | 2 | 3 | null {
  const text = String(raw || '').trim()
  if (!text) return null
  if (VOICE_BOOK_VERBS.test(text)) return null
  const key = normalizeVoiceUtterance(text)
  return VOICE_WHITELIST[key] ?? null
}

export function isTripVoiceWhitelist(raw: string): boolean {
  return matchSpokenTripChoice(raw) != null
}

function hasKoeln(text: string) {
  return KOELN.test(text)
}
function hasMonaco(text: string) {
  return MONACO.test(text)
}
function hasLandsberg(text: string) {
  return LANDSBERG.test(text)
}

export function detectTripIntent(raw: string): TripIntent {
  const text = String(raw || '').trim()
  const lower = text.toLowerCase()
  const wantsFlight = /\b(flug|flüge|fluege|flight|fliegen|flieger|airline)\b/i.test(lower)
  const wantsHotel = /\b(hotel|hostel|übernacht|uebernacht|unterkunft|overnight)\b/i.test(lower)
  const wantsTransfer = /\b(transfer|shuttle|zubringer|flughafentransfer)\b/i.test(lower)
  const messe = /\bmesse|fair|expo\b/i.test(lower)
  const seedHit = hasKoeln(lower) && hasMonaco(lower) && hasLandsberg(lower)

  if (seedHit) {
    return {
      matched: true,
      seed: 'koeln-monaco-landsberg',
      from: 'Köln',
      to: 'Monaco',
      returnTo: 'Landsberg am Lech',
      wantsFlight: true,
      wantsHotel: true,
      wantsTransfer: true,
      messe: true,
    }
  }

  const arrow = text.match(
    /([A-Za-zÄÖÜäöüß.]+)\s*(?:→|->|–|—)\s*([A-Za-zÄÖÜäöüß.]+)/,
  )
  const zurueck = text.match(
    /\b(?:zur[uü]ck|return|back(?:\s+to)?)\s+([A-Za-zÄÖÜäöüß]+(?:\s+am\s+[A-Za-zÄÖÜäöüß]+)?)/i,
  )
  const from = arrow?.[1]
  const to = arrow?.[2]
  const returnTo = zurueck?.[1]
  const packageLike = (wantsFlight && (wantsHotel || wantsTransfer)) || Boolean(from && to && returnTo)
  if (!packageLike) {
    return {
      matched: false,
      seed: null,
      wantsFlight,
      wantsHotel,
      wantsTransfer,
      messe,
    }
  }

  const title = (s?: string) => (s ? s[0].toUpperCase() + s.slice(1) : undefined)
  return {
    matched: true,
    seed: 'generic',
    from: title(from),
    to: title(to),
    returnTo: returnTo ? title(returnTo) : undefined,
    wantsFlight,
    wantsHotel,
    wantsTransfer,
    messe,
  }
}

function card(
  axis: TripAxis,
  seed: TripSeed,
  priceEur: number,
  scores: TripScores,
  de: {
    price: string
    duration: string
    hotel: string
    transfer: string
    flight: string
  },
  en: {
    price: string
    duration: string
    hotel: string
    transfer: string
    flight: string
  },
): TripOption {
  const labels: Record<TripAxis, { de: string; en: string }> = {
    preis: { de: 'Preis', en: 'Price' },
    balance: { de: 'Balance', en: 'Balance' },
    schnell: { de: 'Schnell', en: 'Fast' },
  }
  return {
    id: `trip-${seed}-${axis}`,
    axis,
    labelDe: labels[axis].de,
    labelEn: labels[axis].en,
    priceHintDe: de.price,
    priceHintEn: en.price,
    durationHintDe: de.duration,
    durationHintEn: en.duration,
    hotelHintDe: de.hotel,
    hotelHintEn: en.hotel,
    transferHintDe: de.transfer,
    transferHintEn: en.transfer,
    flightSketchDe: de.flight,
    flightSketchEn: en.flight,
    priceEur,
    scores,
    demo: true,
    seed,
  }
}

function koelnMonacoLandsbergOptions(): TripOption[] {
  return [
    card(
      'preis',
      'koeln-monaco-landsberg',
      289,
      { preis: 96, balance: 62, shortest: 48 },
      {
        price: 'ca. 289 € gesamt (Stub)',
        duration: '11h 40m Tür-zu-Tür',
        hotel: '2★ Budget nahe Messe',
        transfer: 'Shuttle + Tram, beide Enden',
        flight: 'CGN 06:40 → NCE 08:25 · zurück NCE → MUC + RB Landsberg',
      },
      {
        price: 'about €289 total (stub)',
        duration: '11h 40m door-to-door',
        hotel: '2★ budget near the fair',
        transfer: 'Shuttle + tram, both ends',
        flight: 'CGN 06:40 → NCE 08:25 · return NCE → MUC + rail to Landsberg',
      },
    ),
    card(
      'balance',
      'koeln-monaco-landsberg',
      449,
      { preis: 70, balance: 94, shortest: 72 },
      {
        price: 'ca. 449 € gesamt (Stub)',
        duration: '8h 15m Tür-zu-Tür',
        hotel: '4★ Messe-nah',
        transfer: 'Privater Shuttle NCE ↔ Monaco',
        flight: 'CGN 08:10 → NCE 09:50 Direkt · zurück NCE → MUC',
      },
      {
        price: 'about €449 total (stub)',
        duration: '8h 15m door-to-door',
        hotel: '4★ near the fair',
        transfer: 'Private shuttle NCE ↔ Monaco',
        flight: 'CGN 08:10 → NCE 09:50 direct · return NCE → MUC',
      },
    ),
    card(
      'schnell',
      'koeln-monaco-landsberg',
      589,
      { preis: 48, balance: 74, shortest: 97 },
      {
        price: 'ca. 589 € gesamt (Stub)',
        duration: '6h 20m Tür-zu-Tür',
        hotel: '4★ zu Fuß zur Messe',
        transfer: 'Privater Wagen beide Enden',
        flight: 'CGN 07:05 → NCE 08:40 Direkt · zurück NCE → FMM (näher Landsberg)',
      },
      {
        price: 'about €589 total (stub)',
        duration: '6h 20m door-to-door',
        hotel: '4★ walk to the fair',
        transfer: 'Private car both ends',
        flight: 'CGN 07:05 → NCE 08:40 direct · return NCE → FMM (nearer Landsberg)',
      },
    ),
  ]
}

function genericOptions(intent: TripIntent): TripOption[] {
  const from = intent.from || 'Home'
  const to = intent.to || 'Destination'
  const back = intent.returnTo || from
  const seed: TripSeed = 'generic'
  return [
    card(
      'preis',
      seed,
      259,
      { preis: 94, balance: 60, shortest: 50 },
      {
        price: 'ca. 259 € gesamt (Stub)',
        duration: 'längere Umstiege',
        hotel: '2★ / Hostel',
        transfer: 'ÖPNV / Shuttle',
        flight: `${from} → ${to} Low-cost · zurück ${to} → ${back}`,
      },
      {
        price: 'about €259 total (stub)',
        duration: 'longer connections',
        hotel: '2★ / hostel',
        transfer: 'Transit / shuttle',
        flight: `${from} → ${to} low-cost · return ${to} → ${back}`,
      },
    ),
    card(
      'balance',
      seed,
      419,
      { preis: 72, balance: 93, shortest: 74 },
      {
        price: 'ca. 419 € gesamt (Stub)',
        duration: 'mittlere Gesamtzeit',
        hotel: '4★ Lage-Balance',
        transfer: 'Privater Shuttle am Ziel',
        flight: `${from} → ${to} Direkt · zurück ${to} → ${back}`,
      },
      {
        price: 'about €419 total (stub)',
        duration: 'mid door-to-door time',
        hotel: '4★ location balance',
        transfer: 'Private shuttle at destination',
        flight: `${from} → ${to} direct · return ${to} → ${back}`,
      },
    ),
    card(
      'schnell',
      seed,
      549,
      { preis: 50, balance: 76, shortest: 96 },
      {
        price: 'ca. 549 € gesamt (Stub)',
        duration: 'kürzeste Verbindung',
        hotel: '4★ zentral',
        transfer: 'Privater Wagen beide Enden',
        flight: `${from} → ${to} frühester Direkt · zurück ${to} → ${back}`,
      },
      {
        price: 'about €549 total (stub)',
        duration: 'shortest connection',
        hotel: '4★ central',
        transfer: 'Private car both ends',
        flight: `${from} → ${to} earliest direct · return ${to} → ${back}`,
      },
    ),
  ]
}

/** Exactly 2–3 cards, ranked Preis → Balance → Schnell. Never more than 3. */
export function proposeTripOptions(intent: TripIntent): TripOption[] {
  if (!intent.matched || !intent.seed) return []
  const cards =
    intent.seed === 'koeln-monaco-landsberg' ? koelnMonacoLandsbergOptions() : genericOptions(intent)
  const ranked = TRIP_AXES.map((axis) => cards.find((c) => c.axis === axis)).filter(
    (c): c is TripOption => Boolean(c),
  )
  return ranked.slice(0, TRIP_CARD_MAX)
}

export function tripOptionAt(options: TripOption[], index: 1 | 2 | 3): TripOption | null {
  return options[index - 1] ?? null
}

export function localizeTripOption(opt: TripOption, locale: 'de' | 'en') {
  const de = locale === 'de'
  return {
    label: de ? opt.labelDe : opt.labelEn,
    priceHint: de ? opt.priceHintDe : opt.priceHintEn,
    durationHint: de ? opt.durationHintDe : opt.durationHintEn,
    hotelHint: de ? opt.hotelHintDe : opt.hotelHintEn,
    transferHint: de ? opt.transferHintDe : opt.transferHintEn,
    flightSketch: de ? opt.flightSketchDe : opt.flightSketchEn,
  }
}

export const TRIP_DEMO_DISCLAIMER_DE =
  'Skizze (Stub), kein Live-Tarif. Tippen öffnet die öffentliche Suche. Allda bucht nicht und legt kein Ticket an.'

export const TRIP_DEMO_DISCLAIMER_EN =
  'A sketch (stub), not a live fare. Tap opens a public search. Allda does not book and does not create a ticket.'

function cleanPlace(raw: string) {
  return raw
    .replace(/\b(low-cost|direkt|direct|frühester|earliest)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Cities for the public search. Seed trips are explicit; generic sketches use the flight line. */
export function tripSearchPlaces(opt: TripOption): { from: string; to: string } {
  if (opt.seed === 'koeln-monaco-landsberg') return { from: 'Köln', to: 'Monaco' }
  const head = opt.flightSketchEn.split('·')[0] || ''
  const [fromRaw, toRaw] = head.split('→')
  return { from: cleanPlace(fromRaw || ''), to: cleanPlace(toRaw || '') }
}

export function tripFlightSearchHref(opt: TripOption, locale: 'de' | 'en' = 'de') {
  const { from, to } = tripSearchPlaces(opt)
  return flightSearchUrl(from, to, undefined, locale)
}

export function tripHotelSearchHref(opt: TripOption) {
  const { to } = tripSearchPlaces(opt)
  return to ? hotelSearchUrl(to) : ''
}
