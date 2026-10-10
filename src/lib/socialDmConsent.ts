/**
 * Orbit Social ↔ Orbit Chat — 1:1 DM consent hook.
 *
 * Topic / search-term rooms (Suchbegriff-Chats) stay open without consent.
 * Person-to-person DMs are request → recipient accepts → Orbit Chat binds a threadId.
 *
 * Do not invent a parallel chat store here. Orbit Chat owns Telegram-like threads;
 * this module only tracks consent + the optional bound thread id.
 */

import { uid } from './utils'

export const SOCIAL_DM_REQUESTS_KEY = 'orbit_social_dm_requests_v1'
export const SOCIAL_DM_REQUESTS_EVT = 'orbit-social-dm-requests'

export type SocialDmRequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled'

export interface SocialDmRequest {
  id: string
  fromId: string
  fromName: string
  toId: string
  toName: string
  /** Optional intro line shown with the request (not a chat message). */
  note?: string
  status: SocialDmRequestStatus
  /**
   * Bound only after accept. Prefer Orbit Chat’s thread ids via
   * `registerSocialDmThreadBinder` / `attachSocialDmThreadId`.
   * Null/undefined means consent exists but chat UI is not live yet.
   */
  threadId?: string | null
  createdAt: string
  updatedAt: string
}

/** Orbit Chat may register this to create/reuse its thread when a request is accepted. */
export type SocialDmThreadBinder = (request: SocialDmRequest) => string | null | undefined

let threadBinder: SocialDmThreadBinder | null = null

export function registerSocialDmThreadBinder(binder: SocialDmThreadBinder | null) {
  threadBinder = binder
}

function pairKey(a: string, b: string) {
  return [a, b].sort().join('::')
}

function load(): SocialDmRequest[] {
  try {
    const raw = localStorage.getItem(SOCIAL_DM_REQUESTS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (r): r is SocialDmRequest =>
        Boolean(r) &&
        typeof r === 'object' &&
        typeof (r as SocialDmRequest).id === 'string' &&
        typeof (r as SocialDmRequest).fromId === 'string' &&
        typeof (r as SocialDmRequest).toId === 'string',
    )
  } catch {
    return []
  }
}

let cache: SocialDmRequest[] | null = null

function get(): SocialDmRequest[] {
  if (!cache) cache = load()
  return cache
}

function commit(next: SocialDmRequest[]) {
  cache = next
  localStorage.setItem(SOCIAL_DM_REQUESTS_KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent(SOCIAL_DM_REQUESTS_EVT))
}

export function subscribeSocialDmRequests(cb: () => void) {
  const h = () => cb()
  window.addEventListener(SOCIAL_DM_REQUESTS_EVT, h)
  window.addEventListener('storage', h)
  return () => {
    window.removeEventListener(SOCIAL_DM_REQUESTS_EVT, h)
    window.removeEventListener('storage', h)
  }
}

export function listSocialDmRequests(userId?: string): SocialDmRequest[] {
  const all = structuredClone(get()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  if (!userId) return all
  return all.filter((r) => r.fromId === userId || r.toId === userId)
}

export function getSocialDmRequest(id: string): SocialDmRequest | undefined {
  return structuredClone(get().find((r) => r.id === id))
}

/** Latest non-declined/cancelled request for a pair (either direction). */
export function findSocialDmRequestBetween(a: string, b: string): SocialDmRequest | undefined {
  const key = pairKey(a, b)
  return structuredClone(
    get()
      .filter((r) => pairKey(r.fromId, r.toId) === key && r.status !== 'declined' && r.status !== 'cancelled')
      .sort((x, y) => y.updatedAt.localeCompare(x.updatedAt))[0],
  )
}

export function canOpenSocialDm(meId: string, otherId: string): boolean {
  const req = findSocialDmRequestBetween(meId, otherId)
  return Boolean(req && req.status === 'accepted' && req.threadId)
}

export function getAcceptedSocialDmThreadId(meId: string, otherId: string): string | null {
  const req = findSocialDmRequestBetween(meId, otherId)
  if (!req || req.status !== 'accepted' || !req.threadId) return null
  return req.threadId
}

/**
 * Request a 1:1 Orbit Social DM. Does **not** open a chat thread.
 * Recipient must accept; Orbit Chat then binds `threadId`.
 */
export function requestSocialDm(input: {
  fromId: string
  fromName: string
  toId: string
  toName: string
  note?: string
}): SocialDmRequest {
  if (input.fromId === input.toId) {
    throw new Error('social_dm_self')
  }
  const existing = findSocialDmRequestBetween(input.fromId, input.toId)
  if (existing?.status === 'accepted') return existing
  if (existing?.status === 'pending') {
    // Refresh note / bump updatedAt if same direction; otherwise keep pending inbound.
    if (existing.fromId === input.fromId) {
      const note = input.note?.trim() || existing.note
      const next = get().map((r) =>
        r.id === existing.id
          ? { ...r, note, fromName: input.fromName, toName: input.toName, updatedAt: new Date().toISOString() }
          : r,
      )
      commit(next)
      return getSocialDmRequest(existing.id)!
    }
    return existing
  }

  const now = new Date().toISOString()
  const req: SocialDmRequest = {
    id: uid('dmreq'),
    fromId: input.fromId,
    fromName: input.fromName,
    toId: input.toId,
    toName: input.toName,
    note: input.note?.trim() || undefined,
    status: 'pending',
    threadId: null,
    createdAt: now,
    updatedAt: now,
  }
  commit([req, ...get()])
  return structuredClone(req)
}

export function acceptSocialDmRequest(requestId: string, acceptorId: string): SocialDmRequest | null {
  const s = structuredClone(get())
  const req = s.find((r) => r.id === requestId)
  if (!req || req.toId !== acceptorId || req.status !== 'pending') return null
  req.status = 'accepted'
  req.updatedAt = new Date().toISOString()
  if (threadBinder) {
    try {
      const bound = threadBinder(req)
      if (bound) req.threadId = bound
    } catch {
      /* Chat binder optional in demo */
    }
  }
  commit(s)
  return structuredClone(req)
}

export function declineSocialDmRequest(requestId: string, actorId: string): SocialDmRequest | null {
  const s = structuredClone(get())
  const req = s.find((r) => r.id === requestId)
  if (!req || req.status !== 'pending') return null
  if (req.toId !== actorId && req.fromId !== actorId) return null
  req.status = req.toId === actorId ? 'declined' : 'cancelled'
  req.updatedAt = new Date().toISOString()
  commit(s)
  return structuredClone(req)
}

/** Orbit Chat calls this after creating its thread for an accepted request. */
export function attachSocialDmThreadId(requestId: string, threadId: string): SocialDmRequest | null {
  const clean = threadId.trim()
  if (!clean) return null
  const s = structuredClone(get())
  const req = s.find((r) => r.id === requestId)
  if (!req || req.status !== 'accepted') return null
  req.threadId = clean
  req.updatedAt = new Date().toISOString()
  commit(s)
  return structuredClone(req)
}

export function __resetSocialDmConsentForTests() {
  cache = null
  threadBinder = null
}
