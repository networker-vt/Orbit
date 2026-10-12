/**
 * Allda Kabine — demo photo/video try-on.
 * Base (photo + 1–2 variants) is free. Credits only on extra variants / nearby shop boosts.
 * No on-device ML. Filters + labeled variants + seeded shops / nearby services.
 */
import { getPrefs } from './prefs'
import { uid } from './utils'

const KEY = 'orbit_look_v1'
const EVT = 'orbit-look-changed'

export type LookIntent = 'kleidung' | 'schuhe' | 'frisur' | 'makeup' | 'brille' | 'kids'

export const LOOK_INTENTS: {
  id: LookIntent
  labelDe: string
  hintDe: string
  emoji: string
}[] = [
  { id: 'kleidung', labelDe: 'Kleidung', hintDe: 'Outfit, Farben, Läden', emoji: '👕' },
  { id: 'schuhe', labelDe: 'Schuhe', hintDe: 'Sneaker & Stores', emoji: '👟' },
  { id: 'frisur', labelDe: 'Frisur', hintDe: 'Schnitt, Farbe, Friseur', emoji: '✂️' },
  { id: 'makeup', labelDe: 'Make-up', hintDe: 'Töne, Kosmetik', emoji: '💄' },
  { id: 'brille', labelDe: 'Brille', hintDe: 'Fassungen, Optiker', emoji: '👓' },
  { id: 'kids', labelDe: 'Kids', hintDe: 'Kinderarzt & Kids-Shops', emoji: '🧸' },
]

const LOOK_CUES: Record<LookIntent, string[]> = {
  kleidung: ['kleid', 'outfit', 'mode', 'style', 'stil', 'jacke', 'hose', 'shirt', 'wardrobe'],
  schuhe: ['sneaker', 'schuh', 'schuhe', 'boots', 'trainer'],
  frisur: ['frisur', 'haar', 'haare', 'schnitt', 'undercut', 'barber', 'friseur'],
  makeup: ['makeup', 'make-up', 'schmink', 'kosmetik', 'lippen'],
  brille: ['brille', 'optiker', 'fassung', 'sonnenbrille'],
  kids: ['kinderarzt', 'kinder', 'kids', 'pädiatr'],
}

export const LOOK_WORDS = [
  'look',
  'style',
  'stil',
  'kabine',
  'anprobe',
  'try-on',
  'tryon',
  ...Object.values(LOOK_CUES).flat(),
]

export function detectLookIntent(text: string): LookIntent | null {
  const lower = text.toLowerCase()
  let best: LookIntent | null = null
  let score = 0
  for (const intent of LOOK_INTENTS) {
    const hits = LOOK_CUES[intent.id].filter((w) => lower.includes(w)).length
    if (hits > score) {
      score = hits
      best = intent.id
    }
  }
  if (score > 0) return best
  if (LOOK_WORDS.some((w) => lower.includes(w))) return 'kleidung'
  return null
}

export interface LookVariant {
  id: string
  labelDe: string
  hintDe: string
  /** CSS filter on the media — demo composite, not ML. */
  filter: string
  overlay: string
  free: boolean
  intents: LookIntent[]
}

export const LOOK_VARIANTS: LookVariant[] = [
  {
    id: 'original',
    labelDe: 'Original',
    hintDe: 'Dein Foto, unverändert',
    filter: 'none',
    overlay: 'transparent',
    free: true,
    intents: ['kleidung', 'schuhe', 'frisur', 'makeup', 'brille', 'kids'],
  },
  {
    id: 'klar',
    labelDe: 'Klar',
    hintDe: 'Demo-Filter · etwas mehr Kontrast — frei',
    filter: 'contrast(1.06) saturate(1.08)',
    overlay: 'transparent',
    free: true,
    intents: ['kleidung', 'schuhe', 'frisur', 'makeup', 'brille', 'kids'],
  },
  {
    id: 'warm',
    labelDe: 'Warm Gold',
    hintDe: 'Demo-Filter · wärmere Hauttöne',
    filter: 'sepia(0.28) saturate(1.15) brightness(1.04)',
    overlay: 'linear-gradient(180deg, transparent 40%, rgba(212, 160, 80, 0.22))',
    free: true,
    intents: ['kleidung', 'makeup', 'frisur'],
  },
  {
    id: 'cool',
    labelDe: 'Cool Studio',
    hintDe: 'Demo-Filter · kühler Kontrast',
    filter: 'hue-rotate(196deg) saturate(0.9) contrast(1.08)',
    overlay: 'linear-gradient(180deg, rgba(80, 140, 220, 0.12), transparent 50%)',
    free: false,
    intents: ['kleidung', 'brille', 'schuhe'],
  },
  {
    id: 'hair',
    labelDe: 'Schnitt-Skizze',
    hintDe: 'Label-Stub · kein Haar-ML',
    filter: 'contrast(1.12) grayscale(0.15)',
    overlay: 'linear-gradient(180deg, rgba(20, 20, 20, 0.35) 0%, transparent 38%)',
    free: false,
    intents: ['frisur'],
  },
  {
    id: 'sneaker',
    labelDe: 'Sneaker-Fokus',
    hintDe: 'Demo-Vignette unten',
    filter: 'saturate(1.2) contrast(1.05)',
    overlay: 'linear-gradient(0deg, rgba(34, 211, 238, 0.28), transparent 42%)',
    free: false,
    intents: ['schuhe'],
  },
  {
    id: 'soft',
    labelDe: 'Soft Glow',
    hintDe: 'Demo-Filter · Make-up Light',
    filter: 'brightness(1.08) contrast(0.94) saturate(1.2)',
    overlay: 'radial-gradient(circle at 50% 30%, rgba(255, 180, 200, 0.22), transparent 55%)',
    free: false,
    intents: ['makeup', 'kleidung'],
  },
  {
    id: 'frames',
    labelDe: 'Fassung-Hinweis',
    hintDe: 'Label-Stub · Optiker später',
    filter: 'contrast(1.1) saturate(0.85)',
    overlay: 'radial-gradient(ellipse at 50% 38%, transparent 28%, rgba(0,0,0,0.28) 70%)',
    free: false,
    intents: ['brille'],
  },
]

export interface LookProduct {
  id: string
  intent: LookIntent
  title: string
  shop: string
  priceLabel: string
  href: string
  internal?: boolean
}

export const LOOK_PRODUCTS: LookProduct[] = [
  {
    id: 'lp-1',
    intent: 'kleidung',
    title: 'Overshirt Sand — Demo',
    shop: 'Allda Marktplatz',
    priceLabel: '89 €',
    href: '/marktplatz?type=asset',
    internal: true,
  },
  {
    id: 'lp-2',
    intent: 'kleidung',
    title: 'Relaxed Tailoring Set',
    shop: 'Zalando (extern)',
    priceLabel: 'ab 120 €',
    href: 'https://www.zalando.de',
  },
  {
    id: 'lp-3',
    intent: 'schuhe',
    title: 'Court Sneaker Weiß',
    shop: 'Allda Marktplatz',
    priceLabel: '110 €',
    href: '/marktplatz?q=sneaker',
    internal: true,
  },
  {
    id: 'lp-4',
    intent: 'schuhe',
    title: 'Runner Grau',
    shop: 'Shop-Stub',
    priceLabel: '95 €',
    href: 'https://www.zalando.de',
  },
  {
    id: 'lp-5',
    intent: 'frisur',
    title: 'Textur-Paste · Demo',
    shop: 'Drogerie-Stub',
    priceLabel: '12 €',
    href: 'https://www.dm.de',
  },
  {
    id: 'lp-6',
    intent: 'makeup',
    title: 'Skin Tint Warm',
    shop: 'Kosmetik-Stub',
    priceLabel: '24 €',
    href: 'https://www.douglas.de',
  },
  {
    id: 'lp-7',
    intent: 'brille',
    title: 'Acetat-Fassung 51-20',
    shop: 'Optiker-Stub',
    priceLabel: '149 €',
    href: '/marktplatz?type=service',
    internal: true,
  },
  {
    id: 'lp-8',
    intent: 'kids',
    title: 'Kids-Sneaker 28',
    shop: 'Allda Marktplatz',
    priceLabel: '39 €',
    href: '/marktplatz?type=asset',
    internal: true,
  },
]

export type PlaceKind = 'friseur' | 'optiker' | 'kinderarzt' | 'kleiderladen' | 'schuhladen' | 'kosmetik'

export interface LookPlace {
  id: string
  name: string
  kind: PlaceKind
  city: string
  km: number
  hint: string
}

export const LOOK_PLACES: LookPlace[] = [
  { id: 'pl-1', name: 'Schnittwerk Mitte', kind: 'friseur', city: 'Berlin', km: 1.2, hint: 'Walk-in Demo' },
  { id: 'pl-2', name: 'Barber 17', kind: 'friseur', city: 'Berlin', km: 3.4, hint: 'Undercut · Demo' },
  { id: 'pl-3', name: 'Salon Elb', kind: 'friseur', city: 'Hamburg', km: 2.1, hint: 'Farbe · Demo' },
  { id: 'pl-4', name: 'Blickpunkt Optik', kind: 'optiker', city: 'Berlin', km: 0.8, hint: 'Fassungen vor Ort' },
  { id: 'pl-5', name: 'Sehfeld', kind: 'optiker', city: 'München', km: 4.0, hint: 'Gleitsicht-Stub' },
  { id: 'pl-6', name: 'Kinderpraxis Kiez', kind: 'kinderarzt', city: 'Berlin', km: 1.6, hint: 'Termine Demo' },
  { id: 'pl-7', name: 'Pädiatrie Nord', kind: 'kinderarzt', city: 'Hamburg', km: 5.2, hint: 'Impfen Demo' },
  { id: 'pl-8', name: 'Atelier Stoff', kind: 'kleiderladen', city: 'Berlin', km: 2.0, hint: 'Second Hand' },
  { id: 'pl-9', name: 'Form & Faden', kind: 'kleiderladen', city: 'München', km: 3.1, hint: 'Tailoring' },
  { id: 'pl-10', name: 'Court Store', kind: 'schuhladen', city: 'Berlin', km: 1.1, hint: 'Sneaker' },
  { id: 'pl-11', name: 'Sohle & Co.', kind: 'schuhladen', city: 'Köln', km: 2.8, hint: 'Repair + Neu' },
  { id: 'pl-12', name: 'Glow Room', kind: 'kosmetik', city: 'Berlin', km: 0.9, hint: 'Make-up Demo' },
  { id: 'pl-13', name: 'Teint Studio', kind: 'kosmetik', city: 'Frankfurt', km: 4.4, hint: 'Beratung Stub' },
]

const PLACE_FOR_INTENT: Record<LookIntent, PlaceKind[]> = {
  kleidung: ['kleiderladen'],
  schuhe: ['schuhladen'],
  frisur: ['friseur'],
  makeup: ['kosmetik'],
  brille: ['optiker'],
  kids: ['kinderarzt', 'schuhladen', 'kleiderladen'],
}

export function variantsFor(intent: LookIntent, extraUnlocked: boolean): LookVariant[] {
  const pool = LOOK_VARIANTS.filter((v) => v.intents.includes(intent) || v.id === 'original')
  const free = pool.filter((v) => v.free)
  if (extraUnlocked) return pool
  /** Photo (original) + 1–2 free variants. Credits only on extras. */
  const photo = free.filter((v) => v.id === 'original')
  const extras = free.filter((v) => v.id !== 'original').slice(0, 2)
  return [...photo, ...extras]
}

export function productsFor(intent: LookIntent): LookProduct[] {
  const own = LOOK_PRODUCTS.filter((p) => p.intent === intent)
  return own.length ? own : LOOK_PRODUCTS.slice(0, 3)
}

export function nearbyFor(intent: LookIntent, boostedId?: string | null): LookPlace[] {
  const prefs = getPrefs()
  const city = prefs.seeker.cities[0] || 'Berlin'
  const radius = prefs.seeker.radiusKm || 50
  const kinds = PLACE_FOR_INTENT[intent]
  const ranked = LOOK_PLACES.filter((p) => kinds.includes(p.kind) && p.km <= radius)
    .map((p) => ({
      ...p,
      km: p.city.toLowerCase() === city.toLowerCase() ? p.km : p.km + 40,
    }))
    .sort((a, b) => {
      if (boostedId && a.id === boostedId) return -1
      if (boostedId && b.id === boostedId) return 1
      return a.km - b.km
    })
  return ranked.slice(0, 5)
}

export interface LookState {
  intent: LookIntent
  boostedShopId: string | null
  lastAt?: string
}

function defaultState(): LookState {
  return { intent: 'kleidung', boostedShopId: null }
}

function load(): LookState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultState()
    return { ...defaultState(), ...(JSON.parse(raw) as LookState) }
  } catch {
    return defaultState()
  }
}

let cache: LookState | null = null
function get(): LookState {
  if (!cache) cache = load()
  return cache
}
function commit(next: LookState) {
  cache = next
  localStorage.setItem(KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent(EVT))
}

export function getLook(): LookState {
  return structuredClone(get())
}

export function setLookIntent(intent: LookIntent) {
  const next = structuredClone(get())
  next.intent = intent
  next.lastAt = new Date().toISOString()
  commit(next)
}

export function setBoostedShop(id: string | null) {
  const next = structuredClone(get())
  next.boostedShopId = id
  commit(next)
}

export function subscribeLook(cb: () => void) {
  const h = () => cb()
  window.addEventListener(EVT, h)
  window.addEventListener('storage', h)
  return () => {
    window.removeEventListener(EVT, h)
    window.removeEventListener('storage', h)
  }
}

export function lookSessionId() {
  return uid('look')
}
