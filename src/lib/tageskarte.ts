/**
 * Money Boy daily rotation — exactly one Home Tageskarte.
 * Time-of-day slots (Europe/Berlin, local fallback):
 *   Morgen → Job / Laune
 *   Tag    → Alltag / Familie / Kids
 *   Abend  → Look / Laune / Freizeit
 * Daily seed so the card feels new without a catalogue of equal buttons.
 */

export type DaySlot = 'morgen' | 'tag' | 'abend'

export type TageskarteTheme = 'job' | 'laune' | 'alltag' | 'familie' | 'kids' | 'look' | 'freizeit' | 'lernen'

export interface TageskarteItem {
  id: string
  slot: DaySlot
  themes: TageskarteTheme[]
  /** Parent / kids tips stay in the pool (Tag + a few Abend). */
  parentKids?: boolean
  titleDe: string
  titleEn: string
  bodyDe: string
  bodyEn: string
  promptDe: string
  promptEn: string
  to?: string
}

export const TAGESKARTE_POOL: TageskarteItem[] = [
  // Morgen — Job / Laune
  {
    id: 'mo-job-1',
    slot: 'morgen',
    themes: ['job'],
    titleDe: 'Job für den Vormittag',
    titleEn: 'A job for this morning',
    bodyDe: 'Schicht, Freelance oder Minijob in der Nähe — Allda sucht, du entscheidest.',
    bodyEn: 'Shift, freelance or minijob nearby — Allda searches, you decide.',
    promptDe: 'Ich suche heute einen Job für den Vormittag in meiner Stadt',
    promptEn: 'I’m looking for a morning job in my city today',
    to: '/treffer',
  },
  {
    id: 'mo-job-2',
    slot: 'morgen',
    themes: ['job'],
    titleDe: 'Easy: Job finden, nicht scrollen',
    titleEn: 'Easy: find a job, don’t scroll',
    bodyDe: 'Money-Boy-Rotation: ein Vorschlag statt fünf gleicher Kategorien.',
    bodyEn: 'Money Boy rotation: one suggestion instead of five equal categories.',
    promptDe: 'Finde mir heute einen passenden Job — ohne Katalog-Spam',
    promptEn: 'Find me a fitting job today — no catalogue spam',
    to: '/treffer',
  },
  {
    id: 'mo-laune-1',
    slot: 'morgen',
    themes: ['laune'],
    titleDe: 'Laune checken, dann Match',
    titleEn: 'Check the mood, then match',
    bodyDe: '20 Free-Swipes. Erst die Laune, dann die Karte — ohne Paywall am Morgen.',
    bodyEn: '20 free swipes. Mood first, then the card — no morning paywall.',
    promptDe: 'Ich will heute swipen, passend zu meiner Laune',
    promptEn: 'I want to swipe today, matching my mood',
    to: '/treffer',
  },
  {
    id: 'mo-job-3',
    slot: 'morgen',
    themes: ['job', 'laune'],
    titleDe: 'Was verdient sich heute?',
    titleEn: 'What pays today?',
    bodyDe: 'Ein Gig, kein Feed. Frag Allda nach Schicht oder Sprint.',
    bodyEn: 'One gig, not a feed. Ask Allda for a shift or a sprint.',
    promptDe: 'Welcher Gig oder welche Schicht lohnt sich heute?',
    promptEn: 'Which gig or shift is worth it today?',
  },
  {
    id: 'mo-laune-2',
    slot: 'morgen',
    themes: ['laune', 'job'],
    titleDe: 'Kaffee, dann der eine Schritt',
    titleEn: 'Coffee, then the one next step',
    bodyDe: 'Weitermachen statt neu anfangen — Allda merkt den letzten Job.',
    bodyEn: 'Continue instead of starting over — Allda remembers the last job.',
    promptDe: 'Weitermachen: was war der letzte offene Schritt?',
    promptEn: 'Continue: what was the last open step?',
  },
  {
    id: 'mo-job-4',
    slot: 'morgen',
    themes: ['job'],
    titleDe: 'Remote oder vor Ort — du sagst’s',
    titleEn: 'Remote or on-site — you say',
    bodyDe: 'Kein Branchen-Raster. Ein Satz reicht, Allda plant.',
    bodyEn: 'No industry grid. One sentence is enough, Allda plans.',
    promptDe: 'Ich suche heute remote oder vor Ort — was passt?',
    promptEn: 'I’m looking remote or on-site today — what fits?',
  },

  // Tag — Alltag / Familie / Kids
  {
    id: 'tg-alltag-1',
    slot: 'tag',
    themes: ['alltag'],
    titleDe: 'Alltag, nicht Katalog',
    titleEn: 'Everyday, not a catalogue',
    bodyDe: 'Milch, Regal, ein Handwerker — Allda macht daraus einen kurzen Plan.',
    bodyEn: 'Milk, a shelf, a tradesperson — Allda turns it into a short plan.',
    promptDe: 'Alltag: ich brauche heute etwas Praktisches in der Nähe',
    promptEn: 'Everyday: I need something practical nearby today',
  },
  {
    id: 'tg-familie-1',
    slot: 'tag',
    themes: ['familie', 'kids'],
    parentKids: true,
    titleDe: 'Familie: wer holt die Kids?',
    titleEn: 'Family: who’s picking up the kids?',
    bodyDe: 'Alltag mit Kindern — ein Tipp, kein fünf-Button-Menü.',
    bodyEn: 'Everyday with kids — one tip, not a five-button menu.',
    promptDe: 'Familie heute: Abholen, Alltag, was liegt an?',
    promptEn: 'Family today: pickup, everyday stuff, what’s on?',
  },
  {
    id: 'tg-kids-1',
    slot: 'tag',
    themes: ['kids', 'familie'],
    parentKids: true,
    titleDe: 'Kinderarzt oder Kids-Slot?',
    titleEn: 'Pediatrician or a kids slot?',
    bodyDe: 'Eltern-Tipp im Pool: Termin, Betreuung oder Spielplatz — Allda fragt nach.',
    bodyEn: 'Parent tip in the pool: appointment, care or playground — Allda follows up.',
    promptDe: 'Kids: Kinderarzt, Betreuung oder etwas in der Nähe für heute Nachmittag?',
    promptEn: 'Kids: pediatrician, care, or something nearby this afternoon?',
    to: '/kabine',
  },
  {
    id: 'tg-alltag-2',
    slot: 'tag',
    themes: ['alltag', 'familie'],
    parentKids: true,
    titleDe: 'Nachmittag mit Familie',
    titleEn: 'Afternoon with family',
    bodyDe: 'Kurzer Plan für Eltern: Alltag zuerst, Match später.',
    bodyEn: 'A short plan for parents: everyday first, match later.',
    promptDe: 'Nachmittag mit Familie — Alltag und Kids, was hilft jetzt?',
    promptEn: 'Afternoon with family — everyday and kids, what helps now?',
  },
  {
    id: 'tg-kids-2',
    slot: 'tag',
    themes: ['kids'],
    parentKids: true,
    titleDe: 'Spielplatz + Kaffee',
    titleEn: 'Playground + coffee',
    bodyDe: 'Kids beschäftigen, du atmest durch. Ein Vorschlag für heute.',
    bodyEn: 'Kids occupied, you breathe. One suggestion for today.',
    promptDe: 'Spielplatz oder Kids-Aktivität in der Nähe, plus etwas für mich',
    promptEn: 'A playground or kids activity nearby, plus something for me',
  },
  {
    id: 'tg-alltag-3',
    slot: 'tag',
    themes: ['alltag'],
    titleDe: 'Was liegt noch im Alltag?',
    titleEn: 'What’s still on in everyday life?',
    bodyDe: 'Ein Satz reicht — Allda sortiert Job, Hilfe oder Termin.',
    bodyEn: 'One sentence is enough — Allda sorts job, help or appointment.',
    promptDe: 'Alltag heute: was sollte ich jetzt klären?',
    promptEn: 'Everyday today: what should I sort out now?',
  },
  {
    id: 'tg-familie-2',
    slot: 'tag',
    themes: ['familie'],
    parentKids: true,
    titleDe: 'Eltern-Minute',
    titleEn: 'A parent minute',
    bodyDe: 'Kein Super-App-Spam. Ein Familien-Tipp, dann weiter.',
    bodyEn: 'No super-app spam. One family tip, then move on.',
    promptDe: 'Kurzer Eltern-Tipp für den Rest des Tages',
    promptEn: 'A short parent tip for the rest of the day',
  },

  // Abend — Look / Laune / Freizeit
  {
    id: 'ab-look-1',
    slot: 'abend',
    themes: ['look'],
    titleDe: 'Kabine fürs Abendlicht',
    titleEn: 'Kabine for evening light',
    bodyDe: 'Outfit, Haare, Nearby — Kabine ist ein Stub, der Tipp ist frei.',
    bodyEn: 'Outfit, hair, nearby — Kabine is a stub; the tip is free.',
    promptDe: 'Neue Frisur oder Look für heute Abend',
    promptEn: 'A new haircut or look for this evening',
    to: '/kabine',
  },
  {
    id: 'ab-laune-1',
    slot: 'abend',
    themes: ['laune', 'freizeit'],
    titleDe: 'Laune: runterfahren oder raus?',
    titleEn: 'Mood: wind down or go out?',
    bodyDe: 'Freizeit ohne fünf Kategorien. Sag Allda, wie du dich fühlst.',
    bodyEn: 'Leisure without five categories. Tell Allda how you feel.',
    promptDe: 'Abend-Laune: runterfahren oder etwas Freizeit in der Nähe?',
    promptEn: 'Evening mood: wind down or a bit of leisure nearby?',
  },
  {
    id: 'ab-freizeit-1',
    slot: 'abend',
    themes: ['freizeit'],
    titleDe: 'Freizeit, ein Plan',
    titleEn: 'Leisure, one plan',
    bodyDe: 'Leute treffen, kurz weg, oder bleiben. Ein Vorschlag für heute.',
    bodyEn: 'Meet people, head out, or stay in. One suggestion for tonight.',
    promptDe: 'Freizeit heute Abend — was passt, ohne Katalog?',
    promptEn: 'Leisure tonight — what fits, without a catalogue?',
  },
  {
    id: 'ab-look-2',
    slot: 'abend',
    themes: ['look', 'laune'],
    titleDe: 'Was ziehst du morgen an?',
    titleEn: 'What are you wearing tomorrow?',
    bodyDe: 'Kurzer Kabine-Tipp. Foto optional — Home bleibt frei.',
    bodyEn: 'A short Kabine tip. Photo optional — Home stays free.',
    promptDe: 'Kabine für morgen früh, einfach halten',
    promptEn: 'Kabine for tomorrow morning, keep it simple',
    to: '/kabine',
  },
  {
    id: 'ab-kids-1',
    slot: 'abend',
    themes: ['kids', 'look'],
    parentKids: true,
    titleDe: 'Kids-Look für morgen',
    titleEn: 'Kids look for tomorrow',
    bodyDe: 'Eltern-Abend: was ziehen die Kleinen an — und wo liegt’s?',
    bodyEn: 'Parent evening: what are the little ones wearing — and where is it?',
    promptDe: 'Kids-Look für morgen, plus was noch im Familien-Alltag liegt',
    promptEn: 'Kids look for tomorrow, plus what’s still on in family everyday',
    to: '/kabine',
  },
  {
    id: 'ab-freizeit-2',
    slot: 'abend',
    themes: ['freizeit', 'laune'],
    titleDe: 'Feierabend-Allda',
    titleEn: 'After-work Allda',
    bodyDe: 'Kein Matching-Stress. Ein Freizeit-Tipp, dann Gute Nacht.',
    bodyEn: 'No matching stress. One leisure tip, then good night.',
    promptDe: 'Was geht heute Abend noch, locker, in der Nähe?',
    promptEn: 'What’s still on tonight — easy, nearby?',
  },
  {
    id: 'ab-laune-2',
    slot: 'abend',
    themes: ['laune'],
    titleDe: 'Gute Laune, kleiner Schritt',
    titleEn: 'Good mood, small step',
    bodyDe: 'Money-Boy-Abend: easy. Ein Satz an Allda reicht.',
    bodyEn: 'Money Boy evening: easy. One sentence to Allda is enough.',
    promptDe: 'Ich will den Abend easy halten — was schlägst du vor?',
    promptEn: 'I want to keep the evening easy — what do you suggest?',
  },
]

const SLOT_THEMES: Record<DaySlot, TageskarteTheme[]> = {
  morgen: ['job', 'laune'],
  tag: ['alltag', 'familie', 'kids'],
  abend: ['look', 'laune', 'freizeit'],
}

const KIDS_SLOT_THEMES: Record<DaySlot, TageskarteTheme[]> = {
  morgen: ['job', 'laune'],
  tag: ['kids', 'familie', 'alltag'],
  abend: ['kids', 'laune', 'freizeit'],
}

export function berlinOrLocalClock(now = new Date()): {
  dateKey: string
  hour: number
  zone: 'Europe/Berlin' | 'local'
} {
  try {
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Berlin',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hourCycle: 'h23',
    })
    const bag: Record<string, string> = {}
    for (const p of fmt.formatToParts(now)) {
      if (p.type !== 'literal') bag[p.type] = p.value
    }
    const hour = Number(bag.hour)
    if (!bag.year || Number.isNaN(hour)) throw new Error('incomplete')
    return {
      dateKey: `${bag.year}-${bag.month}-${bag.day}`,
      hour,
      zone: 'Europe/Berlin',
    }
  } catch {
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    return { dateKey: `${y}-${m}-${d}`, hour: now.getHours(), zone: 'local' }
  }
}

/** Morgen 05–10, Tag 11–16, Abend 17–04 (Berlin or local). */
export function slotFromHour(hour: number): DaySlot {
  const h = ((hour % 24) + 24) % 24
  if (h >= 5 && h < 11) return 'morgen'
  if (h >= 11 && h < 17) return 'tag'
  return 'abend'
}

export function poolForSlot(slot: DaySlot, kids = false): TageskarteItem[] {
  const allowed = new Set(kids ? KIDS_SLOT_THEMES[slot] : SLOT_THEMES[slot])
  return TAGESKARTE_POOL.filter((item) => {
    if (item.slot !== slot) return false
    if (!item.themes.some((th) => allowed.has(th))) return false
    if (kids && item.to?.startsWith('/kabine')) return false
    if (kids && item.to?.startsWith('/abflug')) return false
    if (item.to?.startsWith('/campus')) return false
    return true
  })
}

/** FNV-1a — stable daily seed, no Math.random. */
export function dailySeed(dateKey: string, slot: DaySlot): number {
  const s = `orbit-tageskarte-mb:${dateKey}:${slot}`
  let h = 2166136261
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function pickFromPool(pool: TageskarteItem[], seed: number): TageskarteItem {
  if (pool.length === 0) return TAGESKARTE_POOL[0]
  return pool[seed % pool.length]
}

export function pickTageskarte(
  now = new Date(),
  opts?: { kids?: boolean },
): {
  item: TageskarteItem
  slot: DaySlot
  dateKey: string
  hour: number
  zone: 'Europe/Berlin' | 'local'
  seed: number
} {
  const clock = berlinOrLocalClock(now)
  const slot = slotFromHour(clock.hour)
  const pool = poolForSlot(slot, opts?.kids)
  const seed = dailySeed(clock.dateKey, slot)
  return { item: pickFromPool(pool, seed), slot, dateKey: clock.dateKey, hour: clock.hour, zone: clock.zone, seed }
}

export function tageskarteCopy(item: TageskarteItem, locale: 'de' | 'en') {
  return locale === 'de'
    ? { title: item.titleDe, body: item.bodyDe, prompt: item.promptDe }
    : { title: item.titleEn, body: item.bodyEn, prompt: item.promptEn }
}
