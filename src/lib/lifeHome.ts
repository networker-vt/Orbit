/**
 * Everyday-life choices on the first screen.
 * Essen, Trinken and Freizeit start off. Old industries never switch them on.
 * Fitness, Auto and Arbeit are not buttons — only words in the sentence.
 */

export const LIFE_EXAMPLES = ['Essen', 'Trinken', 'Freizeit'] as const

export type LifeExample = (typeof LIFE_EXAMPLES)[number]

/** Named in the room so they stay sentences, not extra buttons. */
export const SENTENCE_ONLY = ['Fitness', 'Auto', 'Arbeit'] as const

const EXAMPLE_TERMS: Record<LifeExample, readonly string[]> = {
  Essen: ['essen', 'mahlzeit', 'restaurant', 'kochen', 'küche', 'kueche', 'imbiss', 'lebensmittel', 'pizza', 'suppe'],
  Trinken: ['trinken', 'getränk', 'getraenk', 'kaffee', 'tee', 'wasser', 'saft', 'limonade', 'café', 'cafe'],
  Freizeit: ['freizeit', 'hobby', 'kino', 'ausflug', 'museum', 'konzert', 'spazieren', 'spaziergang'],
}

const STOP = new Set([
  'ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr', 'mir', 'mich', 'dir', 'dich',
  'ein', 'eine', 'einer', 'einen', 'einem', 'der', 'die', 'das', 'den', 'dem', 'des',
  'und', 'oder', 'mit', 'für', 'fuer', 'von', 'vom', 'im', 'in', 'am', 'an', 'auf',
  'zu', 'zum', 'zur', 'ist', 'sind', 'bin', 'bitte', 'heute', 'mal', 'was', 'wie', 'wer', 'wo',
  'nicht', 'auch', 'nur', 'noch', 'beim', 'nach', 'vor', 'aus', 'bei', 'dass',
  'the', 'and', 'for', 'you', 'your', 'with', 'from', 'this', 'that', 'need', 'offer',
  'brauche', 'suche', 'bietest', 'biete', 'anbieten', 'etwas',
])

const ALCOHOL = new Set([
  'alkohol', 'alkoholisch', 'bier', 'biere', 'wein', 'weine', 'cocktail', 'cocktails',
  'schnaps', 'kneipe', 'bar', 'sekt', 'prosecco', 'whisky', 'whiskey', 'gin', 'vodka',
  'likör', 'likoer', 'pils', 'aperitif', 'longdrink', 'spirituose', 'spirituosen', 'rum',
])

export function sanitizeLifeExamples(value: unknown): LifeExample[] {
  if (!Array.isArray(value)) return []
  return LIFE_EXAMPLES.filter((name) => value.includes(name))
}

export function meaningfulTokens(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .map((word) => word.trim())
    .filter((word) => word.length >= 2 && !STOP.has(word))
}

export function isAlcoholToken(token: string): boolean {
  return ALCOHOL.has(token.toLowerCase())
}

export function textIsAlcohol(text: string): boolean {
  return meaningfulTokens(text).some((token) => isAlcoholToken(token))
}

export function hayHasTerm(hay: string, term: string): boolean {
  const needle = term.trim().toLowerCase()
  if (needle.length < 2) return false
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(?:^|[^\\p{L}\\p{N}])${escaped}(?:$|[^\\p{L}\\p{N}])`, 'iu').test(` ${hay.toLowerCase()} `)
}

/** Longer words may start a compound (Fitness → Fitnessstudio). Short words stay whole (Auto). */
export function tokenInHay(hay: string, token: string): boolean {
  if (hayHasTerm(hay, token)) return true
  if (token.length < 5) return false
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(?:^|[^\\p{L}\\p{N}])${escaped}`, 'iu').test(` ${hay.toLowerCase()} `)
}

export interface LifeChoice {
  lifeExamples?: readonly string[]
  lifeSentence?: string
  occupations?: string[]
  occupationTerms?: string[]
  occupationOther?: string
  industries?: string[]
}

/** A real choice is an example, a sentence, or an occupation the person picked. Saved industries are not one. */
export function hasRealLifeChoice(intent: LifeChoice | null | undefined): boolean {
  if (!intent) return false
  if ((intent.lifeExamples?.length ?? 0) > 0) return true
  if ((intent.lifeSentence ?? '').trim().length > 1) return true
  if ((intent.occupations?.length ?? 0) > 0) return true
  if ((intent.occupationTerms?.length ?? 0) > 0) return true
  if ((intent.occupationOther ?? '').trim().length > 1) return true
  return false
}

export function lifeExampleHit(hay: string, examples: readonly string[] | undefined): boolean {
  if (!examples?.length) return false
  return examples.some((name) => {
    const terms = EXAMPLE_TERMS[name as LifeExample]
    if (!terms) return false
    return terms.some((term) => hayHasTerm(hay, term))
  })
}

export function sentenceHit(hay: string, sentence: string | undefined): boolean {
  const tokens = meaningfulTokens(sentence ?? '')
  if (!tokens.length) return false
  return tokens.some((token) => tokenInHay(hay, token))
}

export function lifeHay(parts: Array<string | undefined | null>): string {
  return parts
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(' ')
    .toLowerCase()
}

/**
 * Alcohol stays closed until the same 18+ confirmation as Menschen treffen.
 * A life example or another real word keeps the rest of the choice open.
 */
export function alcoholChoiceBlocked(intent: LifeChoice | null | undefined, adult: boolean): boolean {
  if (adult || !intent) return false
  if ((intent.lifeExamples?.length ?? 0) > 0) return false
  if ((intent.occupations?.length ?? 0) > 0) return false
  if ((intent.occupationTerms?.length ?? 0) > 0) return false
  const text = `${intent.lifeSentence ?? ''} ${intent.occupationOther ?? ''}`.trim()
  if (!text || !textIsAlcohol(text)) return false
  const leftover = meaningfulTokens(text).filter((token) => !isAlcoholToken(token))
  return leftover.length === 0
}

export function listingIsAlcohol(listing: {
  title?: string
  description?: string
  tags?: string[]
  industry?: string
}): boolean {
  const head = lifeHay([listing.title, listing.industry, ...(listing.tags ?? [])])
  if (meaningfulTokens(head).some((token) => isAlcoholToken(token))) return true
  const body = meaningfulTokens(listing.description ?? '')
  if (!body.length) return false
  const alcohol = body.filter((token) => isAlcoholToken(token)).length
  return alcohol > 0 && alcohol * 2 >= body.length
}

const FULFILLED = /(?:^|[^\p{L}\p{N}])(gebucht|reserviert|bestellt|booked|reserved|ordered)(?:$|[^\p{L}\p{N}])/iu

/** No row that pretends a booking, reservation, or order already happened. */
export function pretendsFulfilled(listing: {
  status?: string
  title?: string
  description?: string
  tags?: string[]
}): boolean {
  if (listing.status === 'booked' || listing.status === 'completed') return true
  const hay = lifeHay([listing.title, listing.description, ...(listing.tags ?? [])])
  return FULFILLED.test(` ${hay} `)
}

/** Visible line under a match. Other people's places stay off this line. */
export function publicMatchLine(ownerName?: string): string {
  return ownerName?.trim() ?? ''
}
