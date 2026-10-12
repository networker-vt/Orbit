/**
 * Shared outbound text safety for messenger + voice (minimal gate; aligns with Allda Free AI).
 */

export type SafetyBlockReason = 'hate' | 'discrimination' | 'illegal' | 'kids'

export type SafetyVerdict = { ok: true } | { ok: false; reason: SafetyBlockReason }

function fold(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function softenObfuscation(folded: string): string {
  return folded.replace(/0/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e').replace(/4/g, 'a').replace(/5/g, 's')
}

function wordHit(hay: string, word: string): boolean {
  const w = word.replace(/\s+/g, ' ').trim()
  if (!w) return false
  if (w.includes(' ')) return hay.includes(w)
  const re = new RegExp(`(?:^|\\s)${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\s|$)`)
  return re.test(hay)
}

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
  if (
    ['wie hack', 'how to hack', 'phishing bauen', 'build phishing', 'betrug anleitung'].some((w) =>
      folded.includes(w),
    )
  ) {
    return { ok: false, reason: 'illegal' }
  }
  if (opts?.kids && KIDS_EXTRA.some((w) => folded.includes(w))) {
    return { ok: false, reason: 'kids' }
  }
  return { ok: true }
}

export const MESSENGER_BLOCKED_DE = 'Das kann Allda nicht senden.'
export const MESSENGER_BLOCKED_EN = 'Allda cannot send that.'
