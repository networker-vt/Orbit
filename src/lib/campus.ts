/**
 * Allda Lernen — product name „Campus“.
 * Super veto: pick one path → one CTA „Lektion starten“.
 * 1 lesson/day free; extras SoftPaywall/Credits on adult accounts only.
 */
import { isKidsMode } from './kids'

export type CampusLevel =
  | 'grundschule'
  | 'weiterfuehrend'
  | 'ausbildung'
  | 'studium'
  | 'sprachen'
  | 'skills'

export interface CampusCourse {
  id: string
  level: CampusLevel
  titleDe: string
  titleEn: string
  blurbDe: string
  blurbEn: string
  durationDe: string
  durationEn: string
  safeForKids: boolean
  /** Extra lessons after the free daily one: adult SoftPaywall / Credits. */
  premium?: boolean
  emoji: string
}

export interface CampusProgress {
  courseId: string
  step: number
  at: string
}

export interface CampusState {
  path: CampusLevel | null
  selectedCourseId: string | null
  progress: CampusProgress | null
  lessonDay?: string
  lessonsToday?: number
}

export type LessonStartResult = 'started' | 'need_credits' | 'kids_quota' | 'no_path' | 'unknown_course'

const KEY = 'orbit_campus_v1'
const EVT = 'orbit-campus-changed'
const FREE_LESSONS_PER_DAY = 1

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function defaultCampusState(): CampusState {
  return { path: null, selectedCourseId: null, progress: null }
}

export const CAMPUS_LEVELS: CampusLevel[] = [
  'grundschule',
  'weiterfuehrend',
  'ausbildung',
  'studium',
  'sprachen',
  'skills',
]

export const CAMPUS_CATALOG: CampusCourse[] = [
  {
    id: 'gs-lesen',
    level: 'grundschule',
    titleDe: 'Lesen mit Allda',
    titleEn: 'Reading with Allda',
    blurbDe: 'Kurze Geschichten, Fragen, ein Sticker — Demo, kein Schulabschluss.',
    blurbEn: 'Short stories, questions, a sticker — demo, not a diploma.',
    durationDe: '10 Min',
    durationEn: '10 min',
    safeForKids: true,
    emoji: '📖',
  },
  {
    id: 'gs-rechnen',
    level: 'grundschule',
    titleDe: 'Rechnen bis 100',
    titleEn: 'Maths to 100',
    blurbDe: 'Plus und minus spielerisch. Keine Werbung, kein Chat.',
    blurbEn: 'Plus and minus, playful. No ads, no chat.',
    durationDe: '12 Min',
    durationEn: '12 min',
    safeForKids: true,
    emoji: '➕',
  },
  {
    id: 'sek-bio',
    level: 'weiterfuehrend',
    titleDe: 'Biologie: Zelle',
    titleEn: 'Biology: the cell',
    blurbDe: 'Ein Kapitel, Quiz, Weiterlernen-Karte. Stub.',
    blurbEn: 'One chapter, a quiz, a resume card. Stub.',
    durationDe: '20 Min',
    durationEn: '20 min',
    safeForKids: true,
    emoji: '🔬',
  },
  {
    id: 'sek-geschichte',
    level: 'weiterfuehrend',
    titleDe: 'Geschichte kompakt',
    titleEn: 'History, compact',
    blurbDe: 'Zeitstrahl + 5 Fragen. Kein Social.',
    blurbEn: 'Timeline + 5 questions. No social.',
    durationDe: '18 Min',
    durationEn: '18 min',
    safeForKids: true,
    emoji: '🏛️',
  },
  {
    id: 'azubi-ihk',
    level: 'ausbildung',
    titleDe: 'IHK-Prüfung: Einstieg',
    titleEn: 'Chamber exam: start',
    blurbDe: 'Prüfungsformat erklären, eine Demo-Aufgabe. Keine echte IHK.',
    blurbEn: 'Explain the exam format, one demo task. Not a real chamber.',
    durationDe: '25 Min',
    durationEn: '25 min',
    safeForKids: false,
    emoji: '🛠️',
  },
  {
    id: 'azubi-office',
    level: 'ausbildung',
    titleDe: 'Büro-Alltag',
    titleEn: 'Office basics',
    blurbDe: 'Mails, Termine, Ton. Stub für Azubis.',
    blurbEn: 'Mail, calendar, tone. Stub for apprentices.',
    durationDe: '15 Min',
    durationEn: '15 min',
    safeForKids: false,
    emoji: '📎',
  },
  {
    id: 'uni-expose',
    level: 'studium',
    titleDe: 'Exposé in 30 Minuten',
    titleEn: 'Proposal in 30 minutes',
    blurbDe: 'Struktur, Quellen, ehrliche Demo — kein Ghostwriting.',
    blurbEn: 'Structure, sources, honest demo — no ghostwriting.',
    durationDe: '30 Min',
    durationEn: '30 min',
    safeForKids: false,
    premium: true,
    emoji: '🎓',
  },
  {
    id: 'uni-cite',
    level: 'studium',
    titleDe: 'Zitieren ohne Stress',
    titleEn: 'Citing without stress',
    blurbDe: 'APA/Chicago in Beispielen. Free discovery.',
    blurbEn: 'APA/Chicago by example. Free discovery.',
    durationDe: '16 Min',
    durationEn: '16 min',
    safeForKids: false,
    emoji: '📚',
  },
  {
    id: 'lang-en',
    level: 'sprachen',
    titleDe: 'Englisch: Small Talk Job',
    titleEn: 'English: job small talk',
    blurbDe: '10 Sätze für Assist und Treffer. Kids-safe.',
    blurbEn: '10 phrases for Assist and Treffer. Kids-safe.',
    durationDe: '14 Min',
    durationEn: '14 min',
    safeForKids: true,
    emoji: '🇬🇧',
  },
  {
    id: 'lang-de',
    level: 'sprachen',
    titleDe: 'Deutsch: Ankommen',
    titleEn: 'German: arriving',
    blurbDe: 'Begrüßung, Wegbeschreibung, Assist-Prompt.',
    blurbEn: 'Greeting, directions, Assist prompt.',
    durationDe: '14 Min',
    durationEn: '14 min',
    safeForKids: true,
    emoji: '🇩🇪',
  },
  {
    id: 'skill-assist',
    level: 'skills',
    titleDe: 'Allda fragen lernen',
    titleEn: 'Learn to ask Allda',
    blurbDe: 'Ein guter Satz statt Katalog-Spam. Free.',
    blurbEn: 'One good sentence instead of catalogue spam. Free.',
    durationDe: '8 Min',
    durationEn: '8 min',
    safeForKids: true,
    emoji: '🤖',
  },
  {
    id: 'skill-cv',
    level: 'skills',
    titleDe: 'Lebenslauf-Check (Stub)',
    titleEn: 'CV check (stub)',
    blurbDe: 'Checkliste, kein Upload-Zwang. Premium später.',
    blurbEn: 'Checklist, no forced upload. Premium later.',
    durationDe: '12 Min',
    durationEn: '12 min',
    safeForKids: false,
    premium: true,
    emoji: '📝',
  },
]

function loadState(): CampusState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultCampusState()
    const parsed = JSON.parse(raw) as Partial<CampusState> & Partial<CampusProgress> & {
      path?: CampusLevel | null
    }
    const path = CAMPUS_LEVELS.includes(parsed.path as CampusLevel) ? (parsed.path as CampusLevel) : null
    const progress: CampusProgress | null = parsed.progress?.courseId
      ? parsed.progress
      : parsed.courseId
        ? { courseId: parsed.courseId, step: parsed.step ?? 1, at: parsed.at || new Date().toISOString() }
        : null
    return {
      path,
      selectedCourseId: parsed.selectedCourseId ?? progress?.courseId ?? null,
      progress,
      lessonDay: parsed.lessonDay,
      lessonsToday: parsed.lessonsToday,
    }
  } catch {
    return defaultCampusState()
  }
}

let cache: CampusState | null = null

function getState(): CampusState {
  if (!cache) cache = loadState()
  return cache
}

function commit(next: CampusState) {
  cache = next
  localStorage.setItem(KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent(EVT))
}

export function subscribeCampus(cb: () => void) {
  const h = () => {
    cache = null
    cb()
  }
  window.addEventListener(EVT, h)
  window.addEventListener('storage', h)
  return () => {
    window.removeEventListener(EVT, h)
    window.removeEventListener('storage', h)
  }
}

export function getCampusState(): CampusState {
  return { ...getState() }
}

export function getCampusProgress(): CampusProgress | null {
  return getState().progress
}

export function getCampusPath(): CampusLevel | null {
  return getState().path
}

export function pickCampusPath(level: CampusLevel) {
  const prev = getState()
  const selected =
    prev.selectedCourseId && getCourse(prev.selectedCourseId)?.level === level
      ? prev.selectedCourseId
      : filterCourses(level)[0]?.id ?? null
  const next: CampusState = {
    ...prev,
    path: level,
    selectedCourseId: selected,
  }
  commit(next)
  return next
}

export function selectCampusCourse(courseId: string) {
  const course = getCourse(courseId)
  if (!course) return getCampusState()
  const prev = getState()
  const next: CampusState = {
    ...prev,
    path: course.level,
    selectedCourseId: courseId,
  }
  commit(next)
  return next
}

export function lessonsUsedToday() {
  const s = getState()
  return s.lessonDay === todayKey() ? s.lessonsToday ?? 0 : 0
}

export function campusFreeLessonRemaining() {
  return Math.max(0, FREE_LESSONS_PER_DAY - lessonsUsedToday())
}

export function getCourse(id: string) {
  return CAMPUS_CATALOG.find((c) => c.id === id)
}

export function filterCourses(level: CampusLevel | 'all', kidsOnly = false) {
  return CAMPUS_CATALOG.filter((c) => {
    if (level !== 'all' && c.level !== level) return false
    if (kidsOnly && !c.safeForKids) return false
    return true
  })
}

export function resumeCampus(courseId: string, step = 1) {
  const course = getCourse(courseId)
  if (!course) return null
  const prev = getState()
  const progress: CampusProgress = { courseId, step, at: new Date().toISOString() }
  commit({
    ...prev,
    path: prev.path ?? course.level,
    selectedCourseId: courseId,
    progress,
  })
  return progress
}

/**
 * Start the selected lesson. Requires a chosen path.
 * First lesson each UTC day is free. Further lessons: adult SoftPaywall (`need_credits`);
 * kids stay at the free quota (`kids_quota`) — never Credits.
 */
export function startLesson(courseId: string, opts?: { paid?: boolean }): LessonStartResult {
  const course = getCourse(courseId)
  if (!course) return 'unknown_course'
  const prev = getState()
  if (!prev.path) return 'no_path'
  if (course.level !== prev.path) return 'no_path'
  const used = lessonsUsedToday()
  const paid = Boolean(opts?.paid)
  if (used >= FREE_LESSONS_PER_DAY && !paid) {
    if (isKidsMode()) return 'kids_quota'
    return 'need_credits'
  }
  const day = todayKey()
  const lessonsToday = prev.lessonDay === day ? used + 1 : 1
  const progress: CampusProgress = {
    courseId,
    step: (prev.progress?.courseId === courseId ? prev.progress.step : 0) + 1,
    at: new Date().toISOString(),
  }
  commit({
    ...prev,
    path: course.level,
    selectedCourseId: courseId,
    progress,
    lessonDay: day,
    lessonsToday,
  })
  return 'started'
}

export function campusCopy(course: CampusCourse, locale: 'de' | 'en') {
  return locale === 'de'
    ? { title: course.titleDe, blurb: course.blurbDe, duration: course.durationDe }
    : { title: course.titleEn, blurb: course.blurbEn, duration: course.durationEn }
}

export const CAMPUS_WORDS = [
  'lernen',
  'campus',
  'schule',
  'unterricht',
  'kurs',
  'hausaufgabe',
  'nachhilfe',
  'studium',
  'ausbildung',
  'sprache',
  'english',
  'deutsch lernen',
  'learn',
  'course',
  'homework',
  'school',
]

export function detectCampusIntent(text: string) {
  const lower = text.toLowerCase()
  return CAMPUS_WORDS.some((w) => lower.includes(w))
}

export function __resetCampusForTests() {
  cache = null
  localStorage.removeItem(KEY)
}
