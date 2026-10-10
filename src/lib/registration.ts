import { confirmAdult } from './ageGate'
import { completeCompany, getCompany, saveCompany } from './company'
import { enableKidsFlagForProductMode } from './registrationFlags'
import type { ProductMode } from './registrationFlags'

export type { ProductMode } from './registrationFlags'
import { addSkill, getHub } from './profileHub'
import { completePrefs, getPrefs, savePrefs, type PrefsSide } from './prefs'
import { enableKids, getKids, type AgeBand } from './kids'

const KEY = 'orbit_registration_v1'
const EVT = 'orbit-registration-changed'
const CONSENT_VERSION = '2026-10-10'

export type MarketIntent = 'seeking' | 'offering' | 'both'

export type OfferingEntity = 'company' | 'private'

export type AdultTourStepId =
  | 'tour'
  | 'prefs'
  | 'skills'
  | 'role'
  | 'compliance'
  | 'avatar'
  | 'bio'
  | 'homepage'
  | 'interests'
  | 'feedback'
  | 'done'

export const ADULT_TOUR_STEPS: AdultTourStepId[] = [
  'tour',
  'prefs',
  'skills',
  'role',
  'compliance',
  'avatar',
  'bio',
  'homepage',
  'interests',
  'feedback',
  'done',
]

export interface SocialLinks {
  instagram: string
  facebook: string
  linkedin: string
  x: string
  vinted: string
  kleinanzeigen: string
  homepage: string
}

export interface KidsConsentRecord {
  guardianName: string
  agreedAt: string
  consentTextVersion: string
}

export interface RegistrationProfile {
  displayName: string
  avatarDataUrl: string
  avatarSource: '' | 'upload' | 'ai-stub'
  bio: string
  social: SocialLinks
  homepageMode: 'none' | 'builder-demo' | 'external-url'
  homepageBuilderAck: boolean
  marketIntent: MarketIntent
  offeringEntity: OfferingEntity | ''
  vatRegistered: boolean | null
  checklistHandelsregister: boolean
  checklistGewerbe: boolean
  allowKleinanzeigen: boolean
  hobbies: string[]
  jobTitle: string
  familienstand: string
  feedbackRating: number
  feedbackText: string
}

export interface RegistrationState {
  productMode: ProductMode | null
  modeChosenAt: string
  kidsConsent: KidsConsentRecord | null
  kidsProfileComplete: boolean
  adultStep: AdultTourStepId
  adultTourComplete: boolean
  profile: RegistrationProfile
  tourSlidesSeen: number
  updatedAt: string
}

function defaultSocial(): SocialLinks {
  return {
    instagram: '',
    facebook: '',
    linkedin: '',
    x: '',
    vinted: '',
    kleinanzeigen: '',
    homepage: '',
  }
}

export function defaultRegistrationProfile(): RegistrationProfile {
  return {
    displayName: '',
    avatarDataUrl: '',
    avatarSource: '',
    bio: '',
    social: defaultSocial(),
    homepageMode: 'none',
    homepageBuilderAck: false,
    marketIntent: 'seeking',
    offeringEntity: '',
    vatRegistered: null,
    checklistHandelsregister: false,
    checklistGewerbe: false,
    allowKleinanzeigen: false,
    hobbies: [],
    jobTitle: '',
    familienstand: '',
    feedbackRating: 0,
    feedbackText: '',
  }
}

function defaultState(): RegistrationState {
  return {
    productMode: null,
    modeChosenAt: '',
    kidsConsent: null,
    kidsProfileComplete: false,
    adultStep: 'tour',
    adultTourComplete: false,
    profile: defaultRegistrationProfile(),
    tourSlidesSeen: 0,
    updatedAt: new Date().toISOString(),
  }
}

function normalizeProfile(raw: Partial<RegistrationProfile> | undefined): RegistrationProfile {
  const base = defaultRegistrationProfile()
  if (!raw) return base
  return {
    ...base,
    ...raw,
    social: { ...base.social, ...(raw.social || {}) },
    hobbies: Array.isArray(raw.hobbies) ? raw.hobbies.filter(Boolean) : [],
  }
}

function load(): RegistrationState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw) as Partial<RegistrationState>
    const adultStep = ADULT_TOUR_STEPS.includes(parsed.adultStep as AdultTourStepId)
      ? (parsed.adultStep as AdultTourStepId)
      : 'tour'
    return {
      ...defaultState(),
      ...parsed,
      productMode:
        parsed.productMode === 'orbit' || parsed.productMode === 'kids' ? parsed.productMode : null,
      profile: normalizeProfile(parsed.profile),
      adultStep,
    }
  } catch {
    return defaultState()
  }
}

let cache: RegistrationState | null = null

function get(): RegistrationState {
  if (!cache) cache = load()
  return cache
}

function commit(next: RegistrationState) {
  cache = { ...next, updatedAt: new Date().toISOString() }
  localStorage.setItem(KEY, JSON.stringify(cache))
  window.dispatchEvent(new CustomEvent(EVT))
}

export function subscribeRegistration(cb: () => void) {
  const h = () => cb()
  window.addEventListener(EVT, h)
  window.addEventListener('storage', h)
  return () => {
    window.removeEventListener(EVT, h)
    window.removeEventListener('storage', h)
  }
}

export function getRegistration(): RegistrationState {
  return structuredClone(get())
}

export function patchRegistration(patch: Partial<RegistrationState>) {
  const next = { ...get(), ...patch }
  if (patch.profile) next.profile = normalizeProfile({ ...get().profile, ...patch.profile })
  commit(next)
  return next
}

export function patchRegistrationProfile(patch: Partial<RegistrationProfile>) {
  return patchRegistration({ profile: { ...get().profile, ...patch } })
}

export function chooseProductMode(mode: ProductMode) {
  enableKidsFlagForProductMode(mode)
  const next = patchRegistration({
    productMode: mode,
    modeChosenAt: new Date().toISOString(),
    adultStep: mode === 'orbit' ? 'tour' : get().adultStep,
  })
  return next
}

export function recordKidsConsent(guardianName: string) {
  const name = guardianName.trim()
  if (!name) return null
  return patchRegistration({
    kidsConsent: {
      guardianName: name,
      agreedAt: new Date().toISOString(),
      consentTextVersion: CONSENT_VERSION,
    },
  })
}

export function completeKidsProfile(band: AgeBand, pin: string): boolean {
  const reg = get()
  if (!reg.kidsConsent) return false
  const kids = enableKids(band, pin)
  if (!kids) return false
  patchRegistration({ kidsProfileComplete: true, productMode: 'kids' })
  enableKidsFlagForProductMode('kids')
  return true
}

export function setAdultTourStep(step: AdultTourStepId) {
  return patchRegistration({ adultStep: step })
}

export function advanceAdultTourStep() {
  const idx = ADULT_TOUR_STEPS.indexOf(get().adultStep)
  const next = ADULT_TOUR_STEPS[Math.min(idx + 1, ADULT_TOUR_STEPS.length - 1)]
  return setAdultTourStep(next)
}

export function completeAdultTour() {
  confirmAdult()
  return patchRegistration({ adultTourComplete: true, adultStep: 'done' })
}

/** Sync wizard answers into prefs / company / skills (demo-local). */
export function applyRegistrationToLocalProfile() {
  const { profile, productMode } = get()
  if (productMode !== 'orbit') return

  let side: PrefsSide = 'seeker'
  if (profile.marketIntent === 'offering') side = 'employer'
  if (profile.marketIntent === 'both') side = 'both'

  const prefs = getPrefs()
  savePrefs({
    side,
    seeker: {
      ...prefs.seeker,
      mustHaveSkills: [...new Set([...prefs.seeker.mustHaveSkills])],
    },
  })

  if (profile.marketIntent === 'offering' || profile.marketIntent === 'both') {
    const company = getCompany()
    completeCompany({
      ...company,
      firmName:
        profile.offeringEntity === 'company'
          ? company.firmName || 'Meine Firma (Demo)'
          : profile.displayName.trim() || 'Freelancer (Demo)',
      bio: profile.bio,
      website: profile.social.homepage || company.website,
    })
    if (profile.offeringEntity === 'private') {
      saveCompany({ firmName: profile.displayName.trim() || 'Privatperson' })
    }
  }

  const hub = getHub()
  for (const skill of hub.skills.slice(0, 3)) {
    void skill
  }
  if (profile.jobTitle.trim()) addSkill(profile.jobTitle.trim(), 4)

  completePrefs(side)
}

const LEGAL_PREFIXES = [
  '/impressum',
  '/datenschutz',
  '/privacy',
  '/support',
  '/agb',
  '/ranking',
]

export function isOnboardingExemptPath(pathname: string) {
  if (pathname.startsWith('/willkommen')) return true
  return LEGAL_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

/** Where to send the user if onboarding is incomplete. Null = OK to browse. */
export function onboardingRedirect(pathname: string): string | null {
  if (isOnboardingExemptPath(pathname)) return null
  const reg = get()
  if (!reg.productMode) return '/willkommen'

  if (reg.productMode === 'kids') {
    if (!reg.kidsConsent) return '/willkommen/kids'
    if (!reg.kidsProfileComplete && !getKids().pinHash) return '/willkommen/kids'
    return null
  }

  if (!reg.adultTourComplete) {
    if (pathname.startsWith('/willkommen/orbit')) return null
    return '/willkommen/orbit'
  }

  return null
}

export function requestSwitchToKids() {
  patchRegistration({
    productMode: 'kids',
    kidsConsent: null,
    kidsProfileComplete: false,
  })
  enableKidsFlagForProductMode('kids')
}

export function requestSwitchToOrbit() {
  patchRegistration({
    productMode: 'orbit',
    adultStep: get().adultTourComplete ? 'done' : 'tour',
  })
  enableKidsFlagForProductMode('orbit')
}

export function __resetRegistrationForTests() {
  cache = null
  localStorage.removeItem(KEY)
}
