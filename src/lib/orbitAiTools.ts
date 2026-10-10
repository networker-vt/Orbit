/**
 * Local tool router for Orbit AI — navigation and app actions without LLM.
 */

export type OrbitAiToolName =
  | 'navigate'
  | 'credits_status'
  | 'search_need'
  | 'open_chat'
  | 'recommend'
  | 'help'

export type OrbitAiToolCall =
  | { tool: 'navigate'; path: string; labelDe: string; labelEn: string }
  | { tool: 'credits_status' }
  | { tool: 'search_need'; query: string }
  | { tool: 'open_chat' }
  | { tool: 'recommend'; query: string }
  | { tool: 'help' }

type RouteRule = {
  re: RegExp
  path: string
  labelDe: string
  labelEn: string
  blockKidsTravel?: boolean
}

const NAV_RULES: RouteRule[] = [
  {
    re: /\b(match|treffer|swipe|crew)\b/i,
    path: '/match',
    labelDe: 'Match Finder',
    labelEn: 'Match Finder',
  },
  {
    re: /\b(abflug|reise|flug|hotel|travel|trip)\b/i,
    path: '/abflug',
    labelDe: 'Abflug / Reise',
    labelEn: 'Travel',
    blockKidsTravel: true,
  },
  {
    re: /\b(einstellung|settings|konto)\b/i,
    path: '/einstellung',
    labelDe: 'Einstellungen',
    labelEn: 'Settings',
  },
  {
    re: /\b(prefs|präferenz|praeferenz|filter)\b/i,
    path: '/prefs',
    labelDe: 'Präferenzen',
    labelEn: 'Preferences',
  },
  {
    re: /\b(marktplatz|marketplace|katalog)\b/i,
    path: '/marktplatz',
    labelDe: 'Marktplatz',
    labelEn: 'Marketplace',
  },
  {
    re: /\b(firma|company|unternehmen)\b/i,
    path: '/firma',
    labelDe: 'Firma',
    labelEn: 'Company hub',
  },
  {
    re: /\b(wallet|guthaben|credits|orbit\s*credits)\b/i,
    path: '/wallet',
    labelDe: 'Wallet / Credits',
    labelEn: 'Wallet / credits',
  },
  {
    re: /\b(parkmerke|parkplatz|parken)\b/i,
    path: '/parkmerke',
    labelDe: 'Parkmerke',
    labelEn: 'Parkmerke',
  },
  {
    re: /\b(essen|food|restaurant)\b/i,
    path: '/essen',
    labelDe: 'Essen',
    labelEn: 'Food',
  },
  {
    re: /\b(mein\s*orbit|mein)\b/i,
    path: '/mein',
    labelDe: 'Mein Orbit',
    labelEn: 'My Orbit',
  },
  {
    re: /\b(social|community)\b/i,
    path: '/social',
    labelDe: 'Social',
    labelEn: 'Social',
  },
  {
    re: /\b(campus|lernen|kurs)\b/i,
    path: '/campus',
    labelDe: 'Campus',
    labelEn: 'Campus',
  },
  {
    re: /\b(inserat|listing|angebot\s*erstellen|bedarf\s*posten)\b/i,
    path: '/listings/new',
    labelDe: 'Inserat erstellen',
    labelEn: 'Create listing',
  },
  {
    re: /\b(empfehlen|referral|freunde\s*einladen)\b/i,
    path: '/empfehlen',
    labelDe: 'Empfehlen',
    labelEn: 'Referrals',
  },
]

const OPEN_VERBS =
  /\b(öffne|oeffne|open|geh\s*(zu|nach)|navigiere|zeig\s*(mir)?|starte|go\s*to)\b/i

export function parseLocalToolCall(
  text: string,
  opts?: { kids?: boolean; hideTravel?: boolean },
): OrbitAiToolCall | null {
  const q = text.trim()
  if (!q) return null
  const lower = q.toLowerCase()

  if (/^(hilfe|help|\?|was\s+kannst\s+du|what\s+can\s+you\s+do)/i.test(lower)) {
    return { tool: 'help' }
  }

  if (
    /\b(credits?\s*status|guthaben|wie\s+viele\s+credits|credit\s*balance|kontostand)\b/i.test(
      lower,
    )
  ) {
    return { tool: 'credits_status' }
  }

  if (/\b(chat|nachricht|message|dm)\b/i.test(lower) && OPEN_VERBS.test(lower)) {
    return { tool: 'open_chat' }
  }

  if (/\b(empfehl|recommend|vorschlag|plan\s+für|plan\s+for)\b/i.test(lower)) {
    return { tool: 'recommend', query: q }
  }

  const searchMatch = lower.match(
    /(?:suche|such\s+nach|search\s+for|finde|find)\s+(.+)/i,
  )
  if (searchMatch?.[1]?.trim()) {
    return { tool: 'search_need', query: searchMatch[1].trim() }
  }

  if (OPEN_VERBS.test(lower) || /\bwo\s+ist\b/i.test(lower)) {
    for (const rule of NAV_RULES) {
      if (!rule.re.test(lower)) continue
      if (opts?.hideTravel && rule.blockKidsTravel) continue
      if (opts?.kids && rule.path === '/wallet') continue
      return {
        tool: 'navigate',
        path: rule.path,
        labelDe: rule.labelDe,
        labelEn: rule.labelEn,
      }
    }
  }

  for (const rule of NAV_RULES) {
    if (rule.re.test(lower) && lower.length < 48) {
      if (opts?.hideTravel && rule.blockKidsTravel) continue
      if (opts?.kids && rule.path === '/wallet') continue
      return {
        tool: 'navigate',
        path: rule.path,
        labelDe: rule.labelDe,
        labelEn: rule.labelEn,
      }
    }
  }

  return null
}

export function helpText(locale: 'de' | 'en'): string {
  return locale === 'de'
    ? 'Ich kann dich zu Match, Abflug, Einstellungen, Chat, Wallet und mehr navigieren — oder deinen Bedarf suchen und empfehlen. Sprich oder tippe z. B. „Öffne Match“ oder „Suche Techniker München“.'
    : 'I can navigate you to Match, Travel, Settings, Chat, Wallet, and more — or search and recommend for your need. Try “Open Match” or “Search technicians Munich”.'
}
