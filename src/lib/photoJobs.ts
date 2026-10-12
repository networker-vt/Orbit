import type { Listing } from '../types'

export interface VisionGuess {
  company: string
  city: string
  country: string
  confidence: number
  listingIds: string[]
  disclaimer: string
}

const POOL: Omit<VisionGuess, 'disclaimer'>[] = [
  {
    company: 'CityMart',
    city: 'Hamburg',
    country: 'Deutschland',
    confidence: 0.74,
    listingIds: ['lst-g-retail-1'],
  },
  {
    company: 'FleetMove Logistics',
    city: 'Frankfurt',
    country: 'Deutschland',
    confidence: 0.69,
    listingIds: ['lst-g-log-1'],
  },
  {
    company: 'Nordlicht Events GmbH',
    city: 'Berlin',
    country: 'Deutschland',
    confidence: 0.51,
    listingIds: ['lst-g-it-1', 'lst-g-admin-1'],
  },
  {
    company: 'QuickRun Kuriere',
    city: 'Berlin',
    country: 'Deutschland',
    confidence: 0.66,
    listingIds: ['lst-g-mini-2'],
  },
  {
    company: 'Allda Direct · Remote Hub',
    city: 'Amsterdam',
    country: 'Niederlande',
    confidence: 0.62,
    listingIds: ['lst-g-nl-cafe', 'lst-g-uk-warehouse', 'lst-g-remote-cs'],
  },
  {
    company: 'CareCircle',
    city: 'Warsaw',
    country: 'Polen',
    confidence: 0.58,
    listingIds: ['lst-g-pl-care'],
  },
]

const DISCLAIMER =
  'Demo-Vision: kein echtes Bilderkennen. Firma und Jobs sind gemockt. Später On-Device- oder Partner-Vision.'

function hashName(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return h
}

export function mockVisionFromFile(file: File): VisionGuess {
  const idx = hashName(file.name + file.size + file.type) % POOL.length
  const pick = POOL[idx]
  const jitter = ((file.size % 13) - 6) / 100
  return {
    ...pick,
    confidence: Math.max(0.42, Math.min(0.88, pick.confidence + jitter)),
    disclaimer: DISCLAIMER,
  }
}

export function listingsFromGuess(guess: VisionGuess, all: Listing[]): Listing[] {
  const byId = guess.listingIds
    .map((id) => all.find((l) => l.id === id))
    .filter((l): l is Listing => Boolean(l))
  if (byId.length) return byId
  return all
    .filter(
      (l) =>
        l.vertical === 'job' &&
        l.status === 'active' &&
        (l.city === guess.city || (l.ownerName || '').toLowerCase().includes(guess.company.toLowerCase().split(' ')[0])),
    )
    .slice(0, 4)
}
