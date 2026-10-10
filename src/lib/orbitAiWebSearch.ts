import type { AssistPlan } from './assist'
import { assessInputSafety } from './orbitAiSafety'
import type { OrbitAiOutcome } from './orbitAi'

export type WebSearchProviderId = 'duckduckgo' | 'google' | 'bing'

export interface OrbitAiWebSearchLink {
  label: string
  href: string
  provider: WebSearchProviderId
  providerLabel: string
}

export interface OrbitAiWebSearchOffer {
  links: OrbitAiWebSearchLink[]
}

const ORBIT_SCOPE =
  /\b(match|orbit|inserat|listing|marktplatz|marketplace|job|stelle|techniker|crew|abflug|reise|travel|firma|wallet|credits|chat|prefs|parkmerke|campus|kabine|swipe|angebot|partner|b2b|minijob|grocery|einkauf|messe|event)\b/i

const GENERAL_KNOWLEDGE =
  /^(was|wie|wer|wann|wo|warum|welche|welcher|welches|what|how|why|who|when|where|which|explain|erkl[äa]r|bedeutet|definition|capital|hauptstadt)\b/i

const UNKNOWN_REPLY_DE = /nicht verstanden|probiere „hilfe“/i
const UNKNOWN_REPLY_EN = /did not catch that|try “help”/i

const UNCERTAIN_LLM =
  /\b(weiß ich nicht|weiss ich nicht|kann ich (dir )?nicht|don't know|cannot answer|can't answer|no puedo|outside my knowledge|nicht sicher)\b/i

const PROVIDER_LABELS: Record<WebSearchProviderId, { de: string; en: string }> = {
  duckduckgo: { de: 'DuckDuckGo', en: 'DuckDuckGo' },
  google: { de: 'Google', en: 'Google' },
  bing: { de: 'Bing', en: 'Bing' },
}

export function searchUrlForProvider(provider: WebSearchProviderId, query: string): string {
  const q = encodeURIComponent(query.trim())
  switch (provider) {
    case 'google':
      return `https://www.google.com/search?q=${q}`
    case 'bing':
      return `https://www.bing.com/search?q=${q}`
    case 'duckduckgo':
    default:
      return `https://duckduckgo.com/?q=${q}`
  }
}

function configuredProviders(): WebSearchProviderId[] {
  const raw = import.meta.env.VITE_ORBIT_WEB_SEARCH_PROVIDERS?.trim()
  if (!raw) return ['duckduckgo']
  const ids = raw
    .split(/[,;\s]+/)
    .map((p) => p.toLowerCase())
    .filter(Boolean)
  const out: WebSearchProviderId[] = []
  for (const id of ids) {
    if (id === 'duckduckgo' || id === 'google' || id === 'bing') out.push(id)
  }
  return out.length ? out : ['duckduckgo']
}

export function suggestSearchQueries(text: string, locale: 'de' | 'en'): string[] {
  const base = text.trim().replace(/\s+/g, ' ')
  if (!base) return []
  const out: string[] = [base.slice(0, 120)]
  if (base.length > 48) {
    const short = base.replace(/\?+$/, '').split(/[,;]/)[0]?.trim()
    if (short && short.length >= 8 && short !== out[0]) out.push(short.slice(0, 80))
  }
  if (GENERAL_KNOWLEDGE.test(base) && locale === 'de' && !/\berklärt\b/i.test(base)) {
    out.push(`${base.replace(/\?+$/, '')} einfach erklärt`.slice(0, 100))
  }
  if (GENERAL_KNOWLEDGE.test(base) && locale === 'en' && !/\bexplained\b/i.test(base)) {
    out.push(`${base.replace(/\?+$/, '')} explained`.slice(0, 100))
  }
  const uniq: string[] = []
  for (const q of out) {
    const n = q.trim()
    if (n && !uniq.some((u) => u.toLowerCase() === n.toLowerCase())) uniq.push(n)
  }
  return uniq.slice(0, 3)
}

export function isOrbitScopeQuery(text: string): boolean {
  return ORBIT_SCOPE.test(text)
}

export function isGeneralKnowledgeQuestion(text: string): boolean {
  const t = text.trim()
  if (!t) return false
  if (GENERAL_KNOWLEDGE.test(t)) return true
  return t.includes('?') && !isOrbitScopeQuery(t)
}

export function isLowConfidencePlan(plan: AssistPlan): boolean {
  const trips = plan.tripOptions?.length ?? 0
  if (plan.matchIds.length > 0 || plan.travelIds.length > 0 || trips > 0) return false
  return true
}

function isUnknownFallbackReply(reply: string, locale: 'de' | 'en'): boolean {
  return locale === 'de' ? UNKNOWN_REPLY_DE.test(reply) : UNKNOWN_REPLY_EN.test(reply)
}

function isUncertainLlmReply(reply: string): boolean {
  return UNCERTAIN_LLM.test(reply)
}

/** When Orbit AI could not answer in-app — offer legal search deep-links (never for blocked input). */
export function shouldOfferWebSearch(outcome: OrbitAiOutcome, userText: string, locale: 'de' | 'en'): boolean {
  if (outcome.kind === 'blocked' || outcome.kind === 'navigate') return false
  if (!assessInputSafety(userText).ok) return false

  if (outcome.source === 'local') return false

  if (outcome.kind === 'reply' && outcome.source === 'llm') {
    return isUncertainLlmReply(outcome.reply) || isGeneralKnowledgeQuestion(userText)
  }

  if (outcome.kind === 'reply' && !outcome.plan) {
    return isUnknownFallbackReply(outcome.reply, locale)
  }

  if (outcome.kind === 'plan' && outcome.plan) {
    if (!isLowConfidencePlan(outcome.plan)) return false
    return isGeneralKnowledgeQuestion(userText) && !isOrbitScopeQuery(userText)
  }

  return false
}

export function buildWebSearchOffer(text: string, locale: 'de' | 'en'): OrbitAiWebSearchOffer | null {
  if (!assessInputSafety(text).ok) return null
  const queries = suggestSearchQueries(text, locale)
  if (!queries.length) return null
  const providers = configuredProviders()
  const links: OrbitAiWebSearchLink[] = []

  for (let i = 0; i < Math.min(3, queries.length); i++) {
    const provider = providers[i % providers.length] ?? 'duckduckgo'
    const label = queries[i]!
    links.push({
      label,
      href: searchUrlForProvider(provider, label),
      provider,
      providerLabel: PROVIDER_LABELS[provider][locale],
    })
  }

  const extra = import.meta.env.VITE_ORBIT_WEB_SEARCH_ALSO?.trim()
  if (extra && links.length < 3) {
    const primary = queries[0]!
    for (const token of extra.split(/[,;\s]+/)) {
      if (links.length >= 3) break
      const id = token.toLowerCase()
      if (id !== 'google' && id !== 'bing' && id !== 'duckduckgo') continue
      const provider = id as WebSearchProviderId
      if (links.some((l) => l.provider === provider && l.label === primary)) continue
      links.push({
        label: primary,
        href: searchUrlForProvider(provider, primary),
        provider,
        providerLabel: PROVIDER_LABELS[provider][locale],
      })
    }
  }

  return links.length ? { links: links.slice(0, 3) } : null
}

export async function openExternalSearchUrl(href: string): Promise<void> {
  try {
    const { Capacitor } = await import('@capacitor/core')
    if (Capacitor.isNativePlatform()) {
      const { Browser } = await import('@capacitor/browser')
      await Browser.open({ url: href })
      return
    }
  } catch {
    /* web fallback */
  }
  window.open(href, '_blank', 'noopener,noreferrer')
}
