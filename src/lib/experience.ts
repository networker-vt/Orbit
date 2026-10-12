import { uid } from './utils'
import { grantReviewReward } from './rewards'

const KEY = 'orbit_experience_v1'
const EVT = 'orbit-experience-changed'

export type ExperienceTarget = 'app' | 'company' | 'job' | 'agency_client'

export interface ExperienceReview {
  id: string
  target: ExperienceTarget
  targetId: string
  targetLabel: string
  rating: number
  comment: string
  createdAt: string
  fromName: string
}

export const EXPERIENCE_LABEL_DE: Record<ExperienceTarget, string> = {
  app: 'Allda App',
  company: 'Firma',
  job: 'Job',
  agency_client: 'Agentur ↔ Auftraggeber',
}

function load(): ExperienceReview[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return seedReviews()
    const parsed = JSON.parse(raw) as ExperienceReview[]
    return Array.isArray(parsed) ? parsed : seedReviews()
  } catch {
    return seedReviews()
  }
}

function seedReviews(): ExperienceReview[] {
  return [
    {
      id: 'exp-seed-1',
      target: 'company',
      targetId: 'user-retail-1',
      targetLabel: 'CityMart HR',
      rating: 4,
      comment: 'Klare Schichten, freundliches Team. Demo-Review.',
      createdAt: '2026-08-20T10:00:00Z',
      fromName: 'Alex Müller',
    },
    {
      id: 'exp-seed-2',
      target: 'job',
      targetId: 'lst-g-it-1',
      targetLabel: 'React Developer Remote — Freelance',
      rating: 5,
      comment: 'Scope klar, async-first. Demo-Review.',
      createdAt: '2026-08-28T10:00:00Z',
      fromName: 'Sara König',
    },
  ]
}

let cache: ExperienceReview[] | null = null
function get(): ExperienceReview[] {
  if (!cache) cache = load()
  return cache
}
function commit(next: ExperienceReview[]) {
  cache = next
  localStorage.setItem(KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent(EVT))
}

export function subscribeExperience(cb: () => void) {
  const h = () => cb()
  window.addEventListener(EVT, h)
  window.addEventListener('storage', h)
  return () => {
    window.removeEventListener(EVT, h)
    window.removeEventListener('storage', h)
  }
}

export function listExperience(target?: ExperienceTarget, targetId?: string): ExperienceReview[] {
  return get()
    .filter((r) => (target ? r.target === target : true))
    .filter((r) => (targetId ? r.targetId === targetId : true))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function avgRating(rows: ExperienceReview[]) {
  if (!rows.length) return null
  return Math.round((rows.reduce((s, r) => s + r.rating, 0) / rows.length) * 10) / 10
}

export function addExperience(input: {
  target: ExperienceTarget
  targetId: string
  targetLabel: string
  rating: number
  comment: string
  fromName: string
}): ExperienceReview {
  const review: ExperienceReview = {
    id: uid('exp'),
    target: input.target,
    targetId: input.targetId,
    targetLabel: input.targetLabel,
    rating: Math.min(5, Math.max(1, Math.round(input.rating))),
    comment: input.comment.trim().slice(0, 280),
    createdAt: new Date().toISOString(),
    fromName: input.fromName || 'Allda User',
  }
  const next = [review, ...get().filter((r) => !(r.target === review.target && r.targetId === review.targetId && r.fromName === review.fromName))]
  commit(next)
  void grantReviewReward()
  return review
}

export function listForListing(listingId: string, ownerName?: string): ExperienceReview[] {
  return get().filter(
    (r) =>
      (r.target === 'job' && r.targetId === listingId) ||
      (r.target === 'company' && ownerName && r.targetLabel === ownerName) ||
      (r.target === 'company' && r.targetId === listingId),
  )
}
