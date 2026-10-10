/**
 * Local safety gate for home voice/text — no blocked text persisted or logged verbatim.
 */

export type SafetyBlockReason = 'hate' | 'discrimination' | 'illegal' | 'kids'

export type SafetyVerdict =
  | { ok: true }
  | { ok: false; reason: SafetyBlockReason }

function fold(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Collapse basic leetspeak digits without merging normal words. */
function softenObfuscation(folded: string): string {
  return folded
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
}

function hasAny(hay: string, needles: readonly string[]): boolean {
  return needles.some((n) => hay.includes(n))
}

function wordHit(hay: string, word: string): boolean {
  const w = word.replace(/\s+/g, ' ').trim()
  if (!w) return false
  if (w.includes(' ')) return hay.includes(w)
  const re = new RegExp(`(?:^|\\s)${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\s|$)`)
  return re.test(hay)
}

/** Insult / slur stems (DE/EN) — matched on folded text only. */
const HATE_STEMS = [
  'scheiss',
  ' scheis ',
  'fotze',
  'hurensohn',
  'wichser',
  'arschloch',
  'missgeburt',
  'fuck you',
  'motherfucker',
  'bitch',
  'bastard',
  'asshole',
  'kill yourself',
  'bring dich um',
] as const

const DISCRIM_STEMS = [
  'heil hitler',
  'sieg heil',
  'white power',
  'juden ',
  ' juden',
  'judenhass',
  'nigger',
  'neger',
  'kanake',
  'schwuchtel',
  'transfeind',
  'auslander raus',
  'auslaender raus',
  'gas die',
  'holocaust luge',
  'holocaust lüge',
] as const

const ILLEGAL_STEMS = [
  'bombe bauen',
  'bomb bauen',
  'make a bomb',
  'make bomb',
  'build a bomb',
  'terror anschlag',
  'terror attack',
  'kindesmissbrauch',
  'child porn',
  'kinderporn',
  'drogen deal',
  'sell drugs',
  'kreditkarte hack',
  'credit card fraud',
  'bank hacken',
  'identity theft',
  'waffe kaufen illegal',
  'buy gun illegal',
  'mord beauftragen',
  'hire a hitman',
] as const

const KIDS_EXTRA = [
  'porno',
  'porn ',
  'nacktbild',
  'nude pic',
  'schnaps kaufen',
  'buy alcohol',
  'wodka',
  'vodka',
  'dating erwachsen',
  'adult dating',
] as const

export function assessInputSafety(text: string, opts?: { kids?: boolean }): SafetyVerdict {
  const raw = text.trim()
  if (!raw) return { ok: true }
  const folded = softenObfuscation(fold(raw))
  if (!folded) return { ok: true }

  if (HATE_STEMS.some((w) => wordHit(folded, w) || folded.includes(w.replace(/\s+/g, '')))) {
    return { ok: false, reason: 'hate' }
  }
  if (DISCRIM_STEMS.some((w) => wordHit(folded, w) || folded.includes(w))) {
    return { ok: false, reason: 'discrimination' }
  }
  if (ILLEGAL_STEMS.some((w) => folded.includes(w))) {
    return { ok: false, reason: 'illegal' }
  }
  if (hasAny(folded, ['wie hack', 'how to hack', 'phishing bauen', 'build phishing', 'betrug anleitung'])) {
    return { ok: false, reason: 'illegal' }
  }
  if (opts?.kids && KIDS_EXTRA.some((w) => folded.includes(w))) {
    return { ok: false, reason: 'kids' }
  }
  return { ok: true }
}

export function logSafetyBlock(reason: SafetyBlockReason): void {
  console.info('[orbit-ai] input blocked', { reason })
}

export const ORBIT_AI_BLOCKED_DE = 'Das kann Orbit nicht annehmen.'
export const ORBIT_AI_BLOCKED_EN = 'Orbit cannot accept that.'
