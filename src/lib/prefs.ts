import { JOB_TYPES, type Industry, type JobType, type WorkMode } from '../data/industries'
import { sanitizeLifeExamples, type LifeExample } from './lifeHome'
import { deriveMarketType, isSeekerFeedListing } from './market'
import type { Listing, MarketType, Profile } from '../types'

const KEY = 'orbit_prefs_v1'
const EVT = 'orbit-prefs-changed'

/** seeker = person; employer = company/hiring (legacy key); both = dual mode. */
export type PrefsSide = 'seeker' | 'employer' | 'both'

export function isCompanySide(side: PrefsSide) {
  return side === 'employer' || side === 'both'
}

export function isSeekerSide(side: PrefsSide) {
  return side === 'seeker' || side === 'both'
}

export interface SeekerPrefs {
  countries: string[]
  languages: string[]
  industries: Industry[]
  /** Occupation catalog ids. Empty means no job preference yet. */
  occupations: string[]
  occupationTerms: string[]
  occupationOther: string
  /** Everyday examples. Empty until the person turns one on. Never derived from industries. */
  lifeExamples: LifeExample[]
  /** Free sentence: any need or offer, including Fitness, Auto, Arbeit. */
  lifeSentence: string
  jobTypes: JobType[]
  /** False until the person toggles an employment type. The old full default does not count. */
  jobTypesChosen: boolean
  workModes: WorkMode[]
  salaryMin: number
  radiusKm: number
  cities: string[]
  mustHaveSkills: string[]
}

export interface EmployerPrefs {
  countries: string[]
  languages: string[]
  rolesHiring: string[]
  companySize: string
  mustHaveSkills: string[]
  industries: Industry[]
  occupations: string[]
  occupationTerms: string[]
  occupationOther: string
  /** B2B match radius (km) for on-site partners / assets. */
  radiusKm: number
}

export interface OrbitPrefs {
  side: PrefsSide
  completed: boolean
  seeker: SeekerPrefs
  employer: EmployerPrefs
  updatedAt: string
}

export function defaultPrefs(): OrbitPrefs {
  return {
    side: 'seeker',
    completed: false,
    seeker: {
      countries: ['Deutschland', 'Remote / Global'],
      languages: ['Deutsch', 'Englisch'],
      industries: [],
      occupations: [],
      occupationTerms: [],
      occupationOther: '',
      lifeExamples: [],
      lifeSentence: '',
      jobTypes: [],
      jobTypesChosen: false,
      workModes: ['remote', 'hybrid', 'onsite'],
      salaryMin: 0,
      radiusKm: 50,
      cities: [],
      mustHaveSkills: [],
    },
    employer: {
      countries: ['Deutschland', 'Remote / Global'],
      languages: ['Deutsch', 'Englisch'],
      rolesHiring: [],
      companySize: '11–50',
      mustHaveSkills: [],
      industries: [],
      occupations: [],
      occupationTerms: [],
      occupationOther: '',
      radiusKm: 80,
    },
    updatedAt: new Date().toISOString(),
  }
}

const LEGACY_PRESELECTED_JOB_TYPES: readonly JobType[] = ['Vollzeit', 'Teilzeit', 'Minijob', 'Freelance']

function sameJobSet(a: readonly string[], b: readonly string[]) {
  if (a.length !== b.length) return false
  const set = new Set(a)
  return b.every((item) => set.has(item))
}

export function seekerFromStored(raw: Partial<SeekerPrefs> | undefined): SeekerPrefs {
  const base = defaultPrefs().seeker
  const storedTypes = Array.isArray(raw?.jobTypes)
    ? raw.jobTypes.filter((item): item is JobType => (JOB_TYPES as readonly string[]).includes(item))
    : []
  const chosen =
    raw?.jobTypesChosen === true ||
    (storedTypes.length > 0 && !sameJobSet(storedTypes, LEGACY_PRESELECTED_JOB_TYPES))
  return {
    ...base,
    ...raw,
    industries: Array.isArray(raw?.industries) ? raw.industries : [],
    occupations: Array.isArray(raw?.occupations) ? raw.occupations : [],
    occupationTerms: Array.isArray(raw?.occupationTerms) ? raw.occupationTerms : [],
    occupationOther: typeof raw?.occupationOther === 'string' ? raw.occupationOther : '',
    lifeExamples: sanitizeLifeExamples(raw?.lifeExamples),
    lifeSentence: typeof raw?.lifeSentence === 'string' ? raw.lifeSentence : '',
    cities: Array.isArray(raw?.cities) ? raw.cities : base.cities,
    jobTypes: chosen ? storedTypes : [],
    jobTypesChosen: chosen,
  }
}

export function prefsFromStored(raw: string | null): OrbitPrefs {
  if (!raw) return defaultPrefs()
  const parsed = JSON.parse(raw) as OrbitPrefs
  const base = defaultPrefs()
  const side: PrefsSide =
    parsed.side === 'both' || parsed.side === 'employer' || parsed.side === 'seeker' ? parsed.side : base.side
  return {
    ...base,
    ...parsed,
    side,
    seeker: seekerFromStored(parsed.seeker),
    employer: { ...base.employer, ...parsed.employer },
  }
}

function load(): OrbitPrefs {
  try {
    return prefsFromStored(localStorage.getItem(KEY))
  } catch {
    return defaultPrefs()
  }
}

let cache: OrbitPrefs | null = null

function get(): OrbitPrefs {
  if (!cache) cache = load()
  return cache
}

function commit(next: OrbitPrefs) {
  cache = next
  localStorage.setItem(KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent(EVT))
}

export function subscribePrefs(cb: () => void) {
  const h = () => cb()
  window.addEventListener(EVT, h)
  window.addEventListener('storage', h)
  return () => {
    window.removeEventListener(EVT, h)
    window.removeEventListener('storage', h)
  }
}

export function getPrefs(): OrbitPrefs {
  return structuredClone(get())
}

export function savePrefs(partial: Partial<OrbitPrefs>): OrbitPrefs {
  const next: OrbitPrefs = {
    ...get(),
    ...partial,
    seeker: partial.seeker ? { ...get().seeker, ...partial.seeker } : get().seeker,
    employer: partial.employer
      ? { ...get().employer, ...partial.employer }
      : get().employer,
    updatedAt: new Date().toISOString(),
  }
  commit(next)
  return structuredClone(next)
}

export function completePrefs(side: PrefsSide): OrbitPrefs {
  const next = savePrefs({ side, completed: true })
  void import('./rewards').then((m) => m.maybeGrantPrefsComplete()).catch(() => undefined)
  return next
}

export function resetPrefs() {
  const d = defaultPrefs()
  commit(d)
  return d
}

/** Hard-filter listings by seeker prefs before any feed/cards. */
export function filterListingsByPrefs(listings: Listing[], prefs?: OrbitPrefs): Listing[] {
  const p = prefs ?? get()
  if (!p.completed || !isSeekerSide(p.side)) return listings
  const s = p.seeker
  return listings.filter((l) => {
    if (l.vertical !== 'job' && l.kind !== 'offer') {
      // keep non-job marketplace loosely if industries empty; else require industry tag
    }
    if (s.industries.length) {
      const industry = (l as Listing & { industry?: string }).industry
      const tags = [...(l.tags || []), ...(l.crafts || []), industry || ''].map((t) =>
        t.toLowerCase(),
      )
      const hit = s.industries.some((ind) =>
        tags.some((t) => t.includes(ind.toLowerCase().split('/')[0].trim().toLowerCase())),
      )
      if (!hit && industry) {
        if (!s.industries.includes(industry as Industry)) return false
      } else if (!hit && !industry) {
        // Event VT listings: map to Event industry
        const isEvent =
          l.vertical !== 'job' ||
          (l.crafts || []).some((c) =>
            ['Licht', 'Ton', 'Rigging', 'Stage', 'Video', 'FOH', 'Medienserver'].some((k) =>
              c.includes(k),
            ),
          )
        if (isEvent && !s.industries.some((i) => i.startsWith('Event'))) return false
        if (!isEvent) return false
      }
    }
    if (s.cities.length && !s.cities.some((c) => l.city.toLowerCase() === c.toLowerCase())) {
      // allow remote-tagged
      const mode = (l as Listing & { workMode?: WorkMode }).workMode
      if (mode !== 'remote' && !l.tags?.some((t) => /remote/i.test(t))) return false
    }
    if (s.salaryMin > 0) {
      const pay = l.priceFrom ?? l.priceTo ?? 0
      // normalize monthly-ish: if unit is Stunde, rough *160; Tag *20; Monat as-is
      let monthly = pay
      const u = (l.priceUnit || '').toLowerCase()
      if (u.includes('stunde') || u === 'h' || u === 'std') monthly = pay * 160
      else if (u.includes('tag')) monthly = pay * 20
      else if (u.includes('woche')) monthly = pay * 4
      if (monthly > 0 && monthly < s.salaryMin) return false
    }
    if (s.jobTypes.length) {
      const jt = (l as Listing & { jobType?: string }).jobType
      if (jt && !s.jobTypes.includes(jt as JobType)) return false
      // tag fallback
      if (!jt) {
        const tagHit = s.jobTypes.some((t) =>
          (l.tags || []).some((x) => x.toLowerCase().includes(t.toLowerCase())),
        )
        // if listing has no jobType and no matching tags, still show (legacy seed)
        if ((l.tags || []).some((x) => /minijob|vollzeit|teilzeit|freelance|werkstudent/i.test(x)) && !tagHit)
          return false
      }
    }
    if (s.workModes.length) {
      const mode = (l as Listing & { workMode?: WorkMode }).workMode
      if (mode && !s.workModes.includes(mode)) return false
    }
    if (s.mustHaveSkills.length) {
      const hay = [...(l.crafts || []), ...(l.requirements || []), ...(l.tags || [])]
        .join(' ')
        .toLowerCase()
      const ok = s.mustHaveSkills.every((sk) => hay.includes(sk.toLowerCase()))
      if (!ok) return false
    }
    if (s.countries.length && !s.countries.includes('Remote / Global')) {
      const country = (l as Listing & { country?: string }).country || 'Deutschland'
      if (!s.countries.includes(country) && country !== 'Remote / Global') {
        // default DE seed → Deutschland
        if (!(s.countries.includes('Deutschland') && (!country || country === 'Deutschland')))
          return false
      }
    }
    return true
  })
}

export function filterCandidatesByEmployerPrefs(
  profiles: Profile[],
  prefs?: OrbitPrefs,
): Profile[] {
  const p = prefs ?? get()
  if (!p.completed || !isCompanySide(p.side)) return profiles
  const e = p.employer
  return profiles.filter((prof) => {
    if (e.mustHaveSkills.length) {
      const hay = [...(prof.crafts || []), ...(prof.certifications || []), prof.bio]
        .join(' ')
        .toLowerCase()
      if (!e.mustHaveSkills.every((sk) => hay.includes(sk.toLowerCase()))) return false
    }
    if (e.rolesHiring.length) {
      const hay = [...(prof.crafts || []), prof.role, prof.bio].join(' ').toLowerCase()
      if (!e.rolesHiring.some((r) => hay.includes(r.toLowerCase()))) return false
    }
    return true
  })
}

/** Preference-first marketplace filter (jobs + services + B2B + partners). Soft on missing fields. */
export function filterMarketplaceByPrefs(
  listings: Listing[],
  prefs?: OrbitPrefs,
  marketType?: MarketType | 'all',
): Listing[] {
  const p = prefs ?? get()
  return listings.filter((l) => {
    if (l.status !== 'active') return false
    const lane = deriveMarketType(l)
    if (marketType && marketType !== 'all' && lane !== marketType) return false
    const industries = isCompanySide(p.side) ? p.employer.industries : p.seeker.industries
    if (industries.length && l.industry && !industries.includes(l.industry as Industry)) {
      const hay = [...(l.tags || []), ...(l.crafts || []), l.title].join(' ').toLowerCase()
      const hit = industries.some((ind) => hay.includes(ind.toLowerCase().split('/')[0].trim()))
      if (!hit) return false
    }
    const countries = isCompanySide(p.side) ? p.employer.countries : p.seeker.countries
    if (countries.length && !countries.includes('Remote / Global')) {
      const country = l.country || 'Deutschland'
      if (!countries.includes(country) && country !== 'Remote / Global') return false
    }
    if (isSeekerSide(p.side) && isSeekerFeedListing(l) && p.seeker.jobTypes.length && lane === 'job') {
      if (l.jobType && !p.seeker.jobTypes.includes(l.jobType as JobType)) return false
    }
    return true
  })
}
