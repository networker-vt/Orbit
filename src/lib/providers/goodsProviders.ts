import { store } from '../store'
import { deriveMarketType, listingHaystack } from '../market'
import { rankForWorld } from '../behavior'
import type { OrbitPrefs } from '../prefs'
import type { Listing } from '../../types'
import { ebayPartnerSearchUrl } from './partnerLinks'

export type GoodsHitMode = 'orbit' | 'partner-link'

export interface GoodsSearchHit {
  id: string
  title: string
  priceLabel?: string
  location?: string
  mode: GoodsHitMode
  listingId?: string
  externalUrl?: string
  sourceLabel: string
}

const GOODS_LANES = new Set(['sell', 'barter', 'asset', 'service'])

function listingToHit(listing: Listing): GoodsSearchHit {
  const priceFrom = listing.priceFrom
  const price =
    priceFrom != null && Number.isFinite(priceFrom) ? `€ ${priceFrom.toFixed(0)}` : undefined
  return {
    id: `orbit-goods-${listing.id}`,
    title: listing.title,
    priceLabel: price,
    location: listing.city,
    mode: 'orbit',
    listingId: listing.id,
    sourceLabel: 'Allda',
  }
}

function matchesQuery(listing: Listing, q: string): boolean {
  if (!q.trim()) return true
  return listingHaystack(listing).includes(q.trim().toLowerCase())
}

export async function searchGoodsProviders(input: {
  q?: string
  prefs: OrbitPrefs
  locale?: 'de' | 'en'
}): Promise<GoodsSearchHit[]> {
  const locale = input.locale ?? 'de'
  const q = input.q?.trim() || ''

  const orbitPool = store
    .listListings({})
    .filter((l) => l.status === 'active' && GOODS_LANES.has(deriveMarketType(l)))
    .filter((l) => matchesQuery(l, q))

  const orbit = rankForWorld(orbitPool, input.prefs).map(listingToHit)

  const partners: GoodsSearchHit[] = q
    ? [
        {
          id: `partner-ebay-${q}`,
          title: locale === 'de' ? `eBay: „${q}“` : `eBay: “${q}”`,
          mode: 'partner-link',
          externalUrl: ebayPartnerSearchUrl(q),
          sourceLabel: 'eBay',
        },
      ]
    : []

  return [...orbit, ...partners]
}
