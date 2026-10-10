/**
 * Legal translation providers — LibreTranslate-compatible, MyMemory, optional DeepL.
 * No HTML scraping. Configure via VITE_TRANSLATE_* env.
 */

export type TranslateProvider = 'libretranslate' | 'mymemory' | 'deepl' | 'none'

export type TranslateOutcome =
  | { ok: true; text: string; detectedSource?: string; provider: TranslateProvider }
  | { ok: false; error: string; provider: TranslateProvider }

const MYMEMORY_DAILY_HINT =
  'MyMemory free tier ~1000 words/day (anonymous). Email in langpair raises quota per MyMemory docs.'

function envProvider(): 'auto' | TranslateProvider {
  const p = (import.meta.env.VITE_TRANSLATE_PROVIDER || 'auto').toLowerCase()
  if (p === 'libretranslate' || p === 'mymemory' || p === 'deepl' || p === 'none') return p
  return 'auto'
}

function pickProviders(): TranslateProvider[] {
  const forced = envProvider()
  if (forced !== 'auto') return forced === 'none' ? [] : [forced]

  const list: TranslateProvider[] = []
  if (import.meta.env.VITE_TRANSLATE_DEEPL_KEY) list.push('deepl')
  if (import.meta.env.VITE_TRANSLATE_URL) list.push('libretranslate')
  list.push('mymemory')
  return list
}

async function translateLibre(
  text: string,
  source: string,
  target: string,
): Promise<TranslateOutcome> {
  const base = (import.meta.env.VITE_TRANSLATE_URL || '').replace(/\/$/, '')
  if (!base) return { ok: false, error: 'LibreTranslate URL not configured', provider: 'libretranslate' }

  const res = await fetch(`${base}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      q: text,
      source: source === 'auto' ? 'auto' : source,
      target,
      format: 'text',
      api_key: import.meta.env.VITE_TRANSLATE_API_KEY || undefined,
    }),
  })
  if (!res.ok) {
    return { ok: false, error: `LibreTranslate HTTP ${res.status}`, provider: 'libretranslate' }
  }
  const data = (await res.json()) as { translatedText?: string; detectedLanguage?: { language?: string } }
  const out = data.translatedText?.trim()
  if (!out) return { ok: false, error: 'Empty LibreTranslate response', provider: 'libretranslate' }
  return {
    ok: true,
    text: out,
    detectedSource: data.detectedLanguage?.language,
    provider: 'libretranslate',
  }
}

async function translateMyMemory(
  text: string,
  source: string,
  target: string,
): Promise<TranslateOutcome> {
  const src = source === 'auto' ? 'autodetect' : source
  const url = new URL('https://api.mymemory.translated.net/get')
  url.searchParams.set('q', text.slice(0, 500))
  url.searchParams.set('langpair', `${src}|${target}`)

  const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } })
  if (!res.ok) {
    return { ok: false, error: `MyMemory HTTP ${res.status}`, provider: 'mymemory' }
  }
  const data = (await res.json()) as {
    responseStatus?: number
    responseDetails?: string
    responseData?: { translatedText?: string }
  }
  if (data.responseStatus && data.responseStatus !== 200) {
    return {
      ok: false,
      error: data.responseDetails || MYMEMORY_DAILY_HINT,
      provider: 'mymemory',
    }
  }
  const out = data.responseData?.translatedText?.trim()
  if (!out || out.toUpperCase() === text.toUpperCase()) {
    return { ok: false, error: data.responseDetails || 'MyMemory could not translate', provider: 'mymemory' }
  }
  return { ok: true, text: out, provider: 'mymemory' }
}

async function translateDeepL(text: string, source: string, target: string): Promise<TranslateOutcome> {
  const key = import.meta.env.VITE_TRANSLATE_DEEPL_KEY
  if (!key) return { ok: false, error: 'DeepL key not configured', provider: 'deepl' }

  const isFreeKey = key.endsWith(':fx')
  const endpoint = isFreeKey
    ? 'https://api-free.deepl.com/v2/translate'
    : 'https://api.deepl.com/v2/translate'

  const body = new URLSearchParams()
  body.set('text', text)
  body.set('target_lang', target.toUpperCase())
  if (source !== 'auto') body.set('source_lang', source.toUpperCase())

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `DeepL-Auth-Key ${key}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })
  if (!res.ok) {
    return { ok: false, error: `DeepL HTTP ${res.status}`, provider: 'deepl' }
  }
  const data = (await res.json()) as { translations?: { text: string; detected_source_language?: string }[] }
  const out = data.translations?.[0]?.text?.trim()
  if (!out) return { ok: false, error: 'Empty DeepL response', provider: 'deepl' }
  return {
    ok: true,
    text: out,
    detectedSource: data.translations?.[0]?.detected_source_language?.toLowerCase(),
    provider: 'deepl',
  }
}

export async function translateText(input: {
  text: string
  source: string
  target: string
}): Promise<TranslateOutcome> {
  const text = input.text.trim()
  if (!text) return { ok: true, text: '', provider: 'none' }
  if (input.source !== 'auto' && input.source === input.target) {
    return { ok: true, text, provider: 'none' }
  }

  const providers = pickProviders()
  if (!providers.length) {
    return { ok: false, error: 'No translation provider configured', provider: 'none' }
  }

  let last: TranslateOutcome = { ok: false, error: 'No provider tried', provider: 'none' }
  for (const provider of providers) {
    try {
      if (provider === 'deepl') last = await translateDeepL(text, input.source, input.target)
      else if (provider === 'libretranslate') last = await translateLibre(text, input.source, input.target)
      else last = await translateMyMemory(text, input.source, input.target)
      if (last.ok) return last
    } catch (e) {
      last = { ok: false, error: e instanceof Error ? e.message : 'Translate failed', provider }
    }
  }
  return last
}

export function translateProviderHint(): string {
  const providers = pickProviders()
  if (providers.includes('deepl')) return 'DeepL (VITE_TRANSLATE_DEEPL_KEY)'
  if (providers.includes('libretranslate')) return 'LibreTranslate (VITE_TRANSLATE_URL)'
  return `MyMemory (free, limits apply). ${MYMEMORY_DAILY_HINT}`
}

/** In-memory cache for message bubbles (per session). */
const cache = new Map<string, TranslateOutcome & { ok: true }>()

export function translationCacheKey(messageId: string, target: string) {
  return `${messageId}:${target}`
}

export function getCachedTranslation(messageId: string, target: string) {
  return cache.get(translationCacheKey(messageId, target))
}

export function setCachedTranslation(messageId: string, target: string, value: TranslateOutcome & { ok: true }) {
  cache.set(translationCacheKey(messageId, target), value)
}

export function clearTranslationCache() {
  cache.clear()
}
