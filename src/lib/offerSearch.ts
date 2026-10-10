/**
 * Legal offer hints — Open Food Facts API + Essen tips + OSM supermarket deep links.
 * No supermarket HTML scraping.
 */

import { filterTips, type EssenTip } from './essenTips'
import { hungerSearchTerms } from './einkaufszettel'

export type OfferHint = {
  id: string
  title: string
  source: string
  sourceUrl: string
  image?: string
  kind: 'product' | 'recipe' | 'store_link'
}

export type OfferSearchResult = {
  hints: OfferHint[]
  liveProducts: boolean
  query: string
}

export function osmSupermarketUrl(lat?: number, lon?: number): string {
  if (lat != null && lon != null) {
    return `https://www.openstreetmap.org/search?query=supermarkt#map=14/${lat.toFixed(5)}/${lon.toFixed(5)}`
  }
  return 'https://www.openstreetmap.org/search?query=supermarkt'
}

export async function searchOffersForList(
  listItems: string[],
  lifeSentence: string,
  locale: 'de' | 'en',
  signal?: AbortSignal,
): Promise<OfferSearchResult> {
  const fromList = listItems.map((t) => t.toLowerCase()).join(' ')
  const hungerTerms = hungerSearchTerms(lifeSentence, fromList)
  const query = hungerTerms.slice(0, 3).join(' ')
  const hints: OfferHint[] = []

  const tips: EssenTip[] = filterTips(hungerTerms.join(' '), locale).slice(0, 3)
  for (const tip of tips) {
    hints.push({
      id: `tip-${tip.id}`,
      title: locale === 'de' ? tip.titleDe : tip.titleEn,
      source: tip.source,
      sourceUrl: tip.sourceUrl,
      image: tip.image,
      kind: 'recipe',
    })
  }

  let liveProducts = false
  try {
    const url = new URL('https://world.openfoodfacts.org/cgi/search.pl')
    url.searchParams.set('search_terms', query)
    url.searchParams.set('search_simple', '1')
    url.searchParams.set('action', 'process')
    url.searchParams.set('json', '1')
    url.searchParams.set('page_size', '8')
    url.searchParams.set('fields', 'code,product_name,brands,url')
    const res = await fetch(url, { signal })
    if (res.ok) {
      const data = (await res.json()) as {
        products?: Array<{ code?: string; product_name?: string; brands?: string; url?: string }>
      }
      for (const p of data.products ?? []) {
        if (!p.product_name) continue
        hints.push({
          id: `off-${p.code ?? p.product_name}`,
          title: p.brands ? `${p.product_name} (${p.brands})` : p.product_name,
          source: 'Open Food Facts',
          sourceUrl: p.url ?? `https://world.openfoodfacts.org/product/${p.code}`,
          kind: 'product',
        })
      }
      liveProducts = (data.products?.length ?? 0) > 0
    }
  } catch {
    /* CORS or offline — recipe + store links still ok */
  }

  hints.push({
    id: 'osm-super',
    title: locale === 'de' ? 'Supermärkte in der Nähe (OSM)' : 'Nearby supermarkets (OSM)',
    source: 'OpenStreetMap',
    sourceUrl: osmSupermarketUrl(),
    kind: 'store_link',
  })

  return { hints, liveProducts, query }
}

export function offersForUncheckedItems(
  items: string[],
  lifeSentence: string,
): { suggestedMeals: EssenTip[]; searchTerms: string[] } {
  const unchecked = items.filter(Boolean)
  const searchTerms = hungerSearchTerms(lifeSentence, unchecked.join(' '))
  const suggestedMeals = filterTips(searchTerms.join(' '), 'de').slice(0, 4)
  return { suggestedMeals, searchTerms }
}
