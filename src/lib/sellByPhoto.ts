/**
 * Foto verkaufen / Foto tauschen — Vinted-painkiller.
 * Camera → AI/stub propose → user must confirm before publish. Never silent publish.
 * Real vision when VITE_VISION_API_URL or VITE_SELL_VISION_URL is set.
 */
import type { BarterMode, ItemCondition } from '../types'

export type PhotoListingMode = 'sell' | 'barter'
export type SellProposalSource = 'vision' | 'demo-stub'

export interface PhotoProposal {
  title: string
  description: string
  condition: ItemCondition
  category: string
  /** Sell: price hint. Barter: optional Aufpreis only. */
  priceHintEur: number
  confidence: number
  source: SellProposalSource
  disclaimerDe: string
  disclaimerEn: string
  /** Barter: what you offer (from photo). */
  offerLabel?: string
  /** Barter: what you want — open prompt or suggested need. */
  needLabel?: string
  barterMode?: BarterMode
}

/** @deprecated alias — use PhotoProposal */
export type SellProposal = PhotoProposal

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

type StubItem = {
  offerLabel: string
  category: string
  condition: ItemCondition
  sellDesc: string
  priceHintEur: number
  confidence: number
  needSuggestions: string[]
}

const STUB_POOL: StubItem[] = [
  {
    offerLabel: 'Keramiktasse — schlicht weiß',
    category: 'Haushalt',
    condition: 'good',
    sellDesc: 'Alltagstasse, leichte Gebrauchsspuren am Boden. Ideal für ~2 € Kleinanzeige.',
    priceHintEur: 2,
    confidence: 0.42,
    needSuggestions: ['Nachhilfe 1×', 'Pflanzenableger', 'Offen — was bietest du?'],
  },
  {
    offerLabel: 'Taschenbuch Paperback',
    category: 'Bücher',
    condition: 'good',
    sellDesc: 'Gebrauchtes Buch, Seiten sauber. Schneller Foto-Listing ohne lange Tipparbeit.',
    priceHintEur: 2,
    confidence: 0.4,
    needSuggestions: ['Anderes Buch', 'Kaffee-Gutschein', 'Offen — was bietest du?'],
  },
  {
    offerLabel: 'Kabel / Ladekabel USB',
    category: 'Elektronik',
    condition: 'fair',
    sellDesc: 'Kurzes Kabel, Funktion nicht geprüft in der Demo. Preis-Hint für Kleinigkeit.',
    priceHintEur: 3,
    confidence: 0.38,
    needSuggestions: ['USB-C Adapter', 'Kopfhörer', 'Offen — was bietest du?'],
  },
  {
    offerLabel: 'Stoffbeutel / Tote Bag',
    category: 'Mode',
    condition: 'like_new',
    sellDesc: 'Leichter Beutel, waschbar. Foto → Vorschlag → du bestätigst.',
    priceHintEur: 2,
    confidence: 0.45,
    needSuggestions: ['Schal', 'Pflanze', 'Offen — was bietest du?'],
  },
  {
    offerLabel: 'Pflanzen-Topf klein',
    category: 'Garten',
    condition: 'good',
    sellDesc: 'Blumentopf ohne Pflanze. Günstig abgeben — Vorschlag bitte prüfen.',
    priceHintEur: 2,
    confidence: 0.41,
    needSuggestions: ['Kräutersteckling', 'Erde/Substrat', 'Offen — was bietest du?'],
  },
]

function hashFile(file: File) {
  let h = file.size >>> 0
  const name = file.name || 'photo'
  for (let i = 0; i < name.length; i++) h = (h * 33 + name.charCodeAt(i)) >>> 0
  return h
}

function pickStub(file: File): StubItem {
  const name = (file.name || '').toLowerCase()
  let pick = STUB_POOL[hashFile(file) % STUB_POOL.length]
  if (/book|buch|pdf/.test(name)) pick = STUB_POOL[1]
  else if (/cable|kabel|usb|wire/.test(name)) pick = STUB_POOL[2]
  else if (/bag|beutel|tote|shirt|hose/.test(name)) pick = STUB_POOL[3]
  else if (/pot|topf|plant|blume/.test(name)) pick = STUB_POOL[4]
  else if (/cup|tasse|mug|bowl/.test(name)) pick = STUB_POOL[0]
  return pick
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

function toSellProposal(item: StubItem, source: SellProposalSource): PhotoProposal {
  const base = {
    title: item.offerLabel,
    description: item.sellDesc,
    condition: item.condition,
    category: item.category,
    priceHintEur: item.priceHintEur,
    confidence: item.confidence,
    offerLabel: item.offerLabel,
  }
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
      'Demo-Stub (keine Vision-API). Gleicher Bestätigungsdialog — nichts wird stillschweigend veröffentlicht.',
    disclaimerEn:
      'Demo stub (no vision API). Same confirm dialog — nothing is published silently.',
  }
}

function toBarterProposal(item: StubItem, source: SellProposalSource): PhotoProposal {
  const need = item.needSuggestions[item.needSuggestions.length - 1] // open by default
  const title = `Biete: ${item.offerLabel} · ${need.startsWith('Offen') ? 'Was bietest du?' : `Brauche: ${need}`}`
  const base = {
    title,
    description: `Tausch per Foto: ich biete „${item.offerLabel}“. ${need}. Zustand: bitte prüfen. Kein Pflicht-Geld — optionaler Aufpreis später (Escrow gated).`,
    condition: item.condition,
    category: item.category,
    priceHintEur: 0,
    confidence: item.confidence,
    offerLabel: item.offerLabel,
    needLabel: need,
    barterMode: 'natural' as BarterMode,
  }
  if (source === 'vision') {
    return {
      ...base,
      source,
      disclaimerDe:
        'KI-Vorschlag für Tausch. Biete/brauche und Zustand prüfen — Publish erst nach deiner Bestätigung. Escrow gesperrt.',
      disclaimerEn:
        'AI barter suggestion. Review offer/need and condition — publish only after you confirm. Escrow locked.',
    }
  }
  return {
    ...base,
    source,
    disclaimerDe:
      'Demo-Stub Foto-Tausch. Natural oder später Aufpreis — nichts wird still veröffentlicht.',
    disclaimerEn:
      'Demo stub photo-barter. Natural or later top-up — nothing publishes silently.',
  }
}

export function stubSellProposal(file: File): PhotoProposal {
  return toSellProposal(pickStub(file), 'demo-stub')
}

export function stubBarterProposal(file: File): PhotoProposal {
  return toBarterProposal(pickStub(file), 'demo-stub')
}

export function stubPhotoProposal(file: File, mode: PhotoListingMode): PhotoProposal {
  return mode === 'barter' ? stubBarterProposal(file) : stubSellProposal(file)
}

async function fetchVisionProposal(file: File, mode: PhotoListingMode): Promise<PhotoProposal | null> {
  const endpoint = visionEndpoint()
  if (!endpoint) return null
  try {
    const body = new FormData()
    body.append('image', file)
    body.append('locale', 'de')
    body.append('mode', mode)
    const res = await fetch(endpoint, { method: 'POST', body })
    if (!res.ok) return null
    const data = (await res.json()) as Partial<PhotoProposal> & { offerLabel?: string; needLabel?: string }
    if (!data.title && !data.offerLabel) return null
    const condition = ITEM_CONDITIONS.includes(data.condition as ItemCondition)
      ? (data.condition as ItemCondition)
      : 'good'
    const offerLabel = String(data.offerLabel || data.title || '').slice(0, 80)
    if (mode === 'barter') {
      const needLabel = String(data.needLabel || 'Offen — was bietest du?').slice(0, 80)
      return {
        title: String(data.title || `Biete: ${offerLabel} · Was bietest du?`).slice(0, 100),
        description: String(data.description || '').slice(0, 400),
        condition,
        category: String(data.category || 'Sonstiges').slice(0, 40),
        priceHintEur: Math.max(0, Math.min(500, Number(data.priceHintEur) || 0)),
        confidence: Math.max(0, Math.min(1, Number(data.confidence) || 0.5)),
        source: 'vision',
        offerLabel,
        needLabel,
        barterMode: data.barterMode === 'hybrid' ? 'hybrid' : 'natural',
        disclaimerDe:
          'KI-Vorschlag für Tausch. Biete/brauche prüfen — Publish erst nach Bestätigung.',
        disclaimerEn: 'AI barter suggestion. Review offer/need — publish only after confirm.',
      }
    }
    return {
      title: String(data.title || offerLabel).slice(0, 80),
      description: String(data.description || '').slice(0, 400),
      condition,
      category: String(data.category || 'Sonstiges').slice(0, 40),
      priceHintEur: Math.max(1, Math.min(500, Number(data.priceHintEur) || 2)),
      confidence: Math.max(0, Math.min(1, Number(data.confidence) || 0.5)),
      source: 'vision',
      offerLabel,
      disclaimerDe:
        'KI-Vorschlag aus Vision-API. Bitte prüfen — Veröffentlichung erst nach deiner Bestätigung.',
      disclaimerEn: 'AI suggestion from vision API. Review — publish only after you confirm.',
    }
  } catch {
    return null
  }
}

/** Propose listing from photo. Never publishes. */
export async function proposePhotoFromFile(file: File, mode: PhotoListingMode): Promise<PhotoProposal> {
  const live = await fetchVisionProposal(file, mode)
  if (live) return live
  await new Promise((r) => window.setTimeout(r, 450))
  return stubPhotoProposal(file, mode)
}

/** @deprecated use proposePhotoFromFile(file, 'sell') */
export async function proposeSellFromPhoto(file: File): Promise<PhotoProposal> {
  return proposePhotoFromFile(file, 'sell')
}

export function parsePhotoMode(raw: string | null | undefined): PhotoListingMode {
  return raw === 'barter' || raw === 'tausch' ? 'barter' : 'sell'
}
