/**
 * Sell-by-photo — Vinted-painkiller for low-value items.
 * Proposes title/description/condition/category/price; user must confirm before publish.
 * Real vision only when VITE_VISION_API_URL (or VITE_SELL_VISION_URL) is set.
 */
import type { ItemCondition } from '../types'

export type SellProposalSource = 'vision' | 'demo-stub'

export interface SellProposal {
  title: string
  description: string
  condition: ItemCondition
  category: string
  priceHintEur: number
  confidence: number
  source: SellProposalSource
  disclaimerDe: string
  disclaimerEn: string
}

export const ITEM_CONDITIONS: ItemCondition[] = ['new', 'like_new', 'good', 'fair', 'parts']

export const CONDITION_LABELS_DE: Record<ItemCondition, string> = {
  new: 'Neu',
  like_new: 'Neuwertig',
  good: 'Gut',
  fair: 'Akzeptabel',
  parts: 'Defekt / Teile',
}

export const CONDITION_LABELS_EN: Record<ItemCondition, string> = {
  new: 'New',
  like_new: 'Like new',
  good: 'Good',
  fair: 'Fair',
  parts: 'For parts',
}

const STUB_POOL: Array<Omit<SellProposal, 'source' | 'disclaimerDe' | 'disclaimerEn'>> = [
  {
    title: 'Keramiktasse — schlicht weiß',
    description: 'Alltagstasse, leichte Gebrauchsspuren am Boden. Ideal für ~2 € Kleinanzeige.',
    condition: 'good',
    category: 'Haushalt',
    priceHintEur: 2,
    confidence: 0.42,
  },
  {
    title: 'Taschenbuch Paperback',
    description: 'Gebrauchtes Buch, Seiten sauber. Schneller Foto-Verkauf ohne lange Tipparbeit.',
    condition: 'good',
    category: 'Bücher',
    priceHintEur: 2,
    confidence: 0.4,
  },
  {
    title: 'Kabel / Ladekabel USB',
    description: 'Kurzes Kabel, Funktion nicht geprüft in der Demo. Preis-Hint für Kleinigkeit.',
    condition: 'fair',
    category: 'Elektronik',
    priceHintEur: 3,
    confidence: 0.38,
  },
  {
    title: 'Stoffbeutel / Tote Bag',
    description: 'Leichter Beutel, waschbar. Vinted-Style Listing aus einem Foto.',
    condition: 'like_new',
    category: 'Mode',
    priceHintEur: 2,
    confidence: 0.45,
  },
  {
    title: 'Pflanzen-Topf klein',
    description: 'Blumentopf ohne Pflanze. Günstig abgeben — Vorschlag bitte prüfen.',
    condition: 'good',
    category: 'Garten',
    priceHintEur: 2,
    confidence: 0.41,
  },
]

function hashFile(file: File) {
  let h = file.size >>> 0
  const name = file.name || 'photo'
  for (let i = 0; i < name.length; i++) h = (h * 33 + name.charCodeAt(i)) >>> 0
  return h
}

function visionEndpoint(): string | null {
  const url =
    (import.meta.env.VITE_SELL_VISION_URL as string | undefined) ||
    (import.meta.env.VITE_VISION_API_URL as string | undefined)
  if (!url || !String(url).trim()) return null
  return String(url).trim()
}

export function hasLiveSellVision(): boolean {
  return Boolean(visionEndpoint())
}

function withMeta(
  base: Omit<SellProposal, 'source' | 'disclaimerDe' | 'disclaimerEn'>,
  source: SellProposalSource,
): SellProposal {
  if (source === 'vision') {
    return {
      ...base,
      source,
      disclaimerDe:
        'KI-Vorschlag aus Vision-API. Bitte Titel, Zustand und Preis prüfen — Veröffentlichung erst nach deiner Bestätigung.',
      disclaimerEn:
        'AI suggestion from vision API. Review title, condition and price — publish only after you confirm.',
    }
  }
  return {
    ...base,
    source,
    disclaimerDe:
      'Demo-Stub (keine Vision-API in der Umgebung). Spiegelt den Bestätigungsdialog — nichts wird stillschweigend veröffentlicht.',
    disclaimerEn:
      'Demo stub (no vision API in this environment). Mirrors the confirm dialog — nothing is published silently.',
  }
}

/** Deterministic demo proposal from file name/size heuristics. */
export function stubSellProposal(file: File): SellProposal {
  const name = (file.name || '').toLowerCase()
  let pick = STUB_POOL[hashFile(file) % STUB_POOL.length]
  if (/book|buch|pdf/.test(name)) pick = STUB_POOL[1]
  else if (/cable|kabel|usb|wire/.test(name)) pick = STUB_POOL[2]
  else if (/bag|beutel|tote|shirt|hose/.test(name)) pick = STUB_POOL[3]
  else if (/pot|topf|plant|blume/.test(name)) pick = STUB_POOL[4]
  else if (/cup|tasse|mug|bowl/.test(name)) pick = STUB_POOL[0]
  return withMeta(pick, 'demo-stub')
}

async function fetchVisionProposal(file: File): Promise<SellProposal | null> {
  const endpoint = visionEndpoint()
  if (!endpoint) return null
  try {
    const body = new FormData()
    body.append('image', file)
    body.append('locale', 'de')
    const res = await fetch(endpoint, { method: 'POST', body })
    if (!res.ok) return null
    const data = (await res.json()) as Partial<SellProposal>
    if (!data.title || !data.description) return null
    const condition = ITEM_CONDITIONS.includes(data.condition as ItemCondition)
      ? (data.condition as ItemCondition)
      : 'good'
    return withMeta(
      {
        title: String(data.title).slice(0, 80),
        description: String(data.description).slice(0, 400),
        condition,
        category: String(data.category || 'Sonstiges').slice(0, 40),
        priceHintEur: Math.max(1, Math.min(500, Number(data.priceHintEur) || 2)),
        confidence: Math.max(0, Math.min(1, Number(data.confidence) || 0.5)),
      },
      'vision',
    )
  } catch {
    return null
  }
}

/**
 * Propose a sell listing from a photo. Never publishes.
 * Falls back to demo stub when vision env is missing or the call fails.
 */
export async function proposeSellFromPhoto(file: File): Promise<SellProposal> {
  const live = await fetchVisionProposal(file)
  if (live) return live
  // Small delay so the confirm UI feels like analysis even in stub mode.
  await new Promise((r) => window.setTimeout(r, 450))
  return stubSellProposal(file)
}
