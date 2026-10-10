import { kidsAgeBand, type AgeBand } from './kids'

const KEY = 'orbit_kids_hub_v1'
const EVT = 'orbit-kids-hub-changed'

export interface KidsGameDraft {
  title: string
  hero: string
  goal: string
  blocks: string[]
  updatedAt: string
}

export interface KidsFitResult {
  sport: string
  instrument: string
  language: string
  rationale: string
  savedAt: string
}

export interface KidsHubState {
  hobbies: string[]
  game: KidsGameDraft
  fit: KidsFitResult | null
  naturePhotosExplained: number
}

function defaultGame(): KidsGameDraft {
  return {
    title: 'Mein Weltraum-Spiel',
    hero: 'Orbi',
    goal: 'Sterne sammeln und Freunde helfen',
    blocks: ['Bewegen', 'Springen', 'Stern sammeln'],
    updatedAt: new Date().toISOString(),
  }
}

function defaultState(): KidsHubState {
  return { hobbies: [], game: defaultGame(), fit: null, naturePhotosExplained: 0 }
}

function load(): KidsHubState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw) as Partial<KidsHubState>
    return {
      ...defaultState(),
      ...parsed,
      hobbies: Array.isArray(parsed.hobbies) ? parsed.hobbies.filter(Boolean) : [],
      game: { ...defaultGame(), ...(parsed.game || {}) },
      fit: parsed.fit ?? null,
    }
  } catch {
    return defaultState()
  }
}

let cache: KidsHubState | null = null

function get() {
  if (!cache) cache = load()
  return cache
}

function commit(next: KidsHubState) {
  cache = next
  localStorage.setItem(KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent(EVT))
}

export function subscribeKidsHub(cb: () => void) {
  const h = () => cb()
  window.addEventListener(EVT, h)
  window.addEventListener('storage', h)
  return () => {
    window.removeEventListener(EVT, h)
    window.removeEventListener('storage', h)
  }
}

export function getKidsHub(): KidsHubState {
  return structuredClone(get())
}

export function saveKidsHub(patch: Partial<KidsHubState>) {
  const next = { ...get(), ...patch }
  if (patch.game) next.game = { ...get().game, ...patch.game, updatedAt: new Date().toISOString() }
  commit(next)
  return next
}

export function toggleKidsHobby(name: string) {
  const n = name.trim()
  if (!n) return getKidsHub()
  const cur = get().hobbies
  const next = cur.includes(n) ? cur.filter((h) => h !== n) : [...cur, n]
  return saveKidsHub({ hobbies: next })
}

export function recordNatureExplain() {
  return saveKidsHub({ naturePhotosExplained: get().naturePhotosExplained + 1 })
}

export type LearnTask = { id: string; title: string; minutes: number; prompt: string }

export function learnTasksForBand(band: AgeBand | null = kidsAgeBand()): LearnTask[] {
  if (band === 'under13') {
    return [
      { id: 't1', title: 'Zählen im Park', minutes: 5, prompt: 'Zähle 10 Blätter oder Steine — male danach eins.' },
      { id: 't2', title: 'Wort des Tages', minutes: 8, prompt: 'Lerne ein neues Wort und erkläre es Orbi laut.' },
    ]
  }
  if (band === '13-15') {
    return [
      { id: 't3', title: 'Bruch-Rechnen', minutes: 12, prompt: 'Teile eine Pizza gedanklich in 8 Stücke — welche Menge ist 3/8?' },
      { id: 't4', title: 'Englisch Mini-Dialog', minutes: 10, prompt: 'Schreibe 4 Sätze: Vorstellen + Hobby auf Englisch.' },
    ]
  }
  if (band === '16-17') {
    return [
      { id: 't5', title: 'Prozent & Rabatt', minutes: 15, prompt: 'Ein Fahrrad kostet 400 € mit 15 % Rabatt — Endpreis?' },
      { id: 't6', title: 'Beruf & Stärken', minutes: 12, prompt: 'Liste 3 Stärken und einen Beruf, der dazu passt (Demo).' },
    ]
  }
  return [
    { id: 't0', title: 'Eltern wählen Altersband', minutes: 2, prompt: 'In Kids-Einstellungen Altersband setzen.' },
  ]
}

const HOBBY_CHIPS = [
  'Malen',
  'Fußball',
  'Musik',
  'Tiere',
  'Lesen',
  'Basteln',
  'Tanzen',
  'Programmieren',
  'Natur',
  'Kochen',
]

export function hobbyDiscoveryChips() {
  return HOBBY_CHIPS
}

export function computeFit(answers: { energy: number; social: number; music: number; outdoor: number }): KidsFitResult {
  const sport =
    answers.outdoor >= 7
      ? 'Schwimmen oder Leichtathletik'
      : answers.energy >= 7
        ? 'Basketball oder Klettern'
        : 'Yoga oder Badminton'
  const instrument =
    answers.music >= 8 ? 'Klavier oder Gitarre' : answers.music >= 5 ? 'Ukulele oder Schlagzeug' : 'Geige (sanfter Einstieg)'
  const language =
    answers.social >= 7 ? 'Spanisch (viele Gesprächspartner)' : answers.music >= 6 ? 'Italienisch (Musik & Kultur)' : 'Französisch (strukturiert)'
  const rationale =
    'Demo-Empfehlung aus deinen Antworten — kein wissenschaftlicher Test. Probiere Schnupperstunden mit Eltern.'
  return { sport, instrument, language, rationale, savedAt: new Date().toISOString() }
}

export function __resetKidsHubForTests() {
  cache = null
  localStorage.removeItem(KEY)
}
