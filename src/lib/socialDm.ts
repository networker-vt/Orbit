/**
 * Allda Chat — Social DM permission API (stable for Social redesign).
 *
 * Social cold-DMs require recipient consent: request → accept → chat unlocks.
 * Match / listing / booking threads do NOT use this gate.
 */
import { store } from './store'
import { uid } from './utils'
import type { Thread } from '../types'

const KEY = 'orbit_social_dm_v1'
const EVT = 'orbit-social-dm-changed'

export type SocialDmPermission = 'none' | 'outgoing' | 'incoming' | 'accepted' | 'declined'

export type SocialDmRequestStatus = 'pending' | 'accepted' | 'declined'

export interface SocialDmRequest {
  id: string
  fromId: string
  fromName: string
  toId: string
  toName: string
  note?: string
  status: SocialDmRequestStatus
  createdAt: string
  resolvedAt?: string
  threadId?: string
}

interface SocialDmState {
  requests: SocialDmRequest[]
}

function defaultState(): SocialDmState {
  return {
    requests: [
      {
        id: 'dmreq-seed-1',
        fromId: 'user-svc-1',
        fromName: 'Nora Patel',
        toId: 'user-demo-1',
        toName: 'Alex Müller',
        note: 'Kurz zu Buchhaltungs-Sprints — darf ich dich in Allda Chat anschreiben?',
        status: 'pending',
        createdAt: '2026-10-09T12:00:00Z',
      },
    ],
  }
}

function load(): SocialDmState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw) as SocialDmState
    if (!Array.isArray(parsed.requests)) return defaultState()
    return { requests: parsed.requests }
  } catch {
    return defaultState()
  }
}

let cache: SocialDmState | null = null

function get(): SocialDmState {
  if (!cache) cache = load()
  return cache
}

function commit(next: SocialDmState) {
  cache = next
  localStorage.setItem(KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent(EVT))
}

export function subscribeSocialDm(cb: () => void) {
  const h = () => cb()
  window.addEventListener(EVT, h)
  window.addEventListener('storage', h)
  return () => {
    window.removeEventListener(EVT, h)
    window.removeEventListener('storage', h)
  }
}

export function listSocialDmRequests(): SocialDmRequest[] {
  return structuredClone(get().requests)
}

export function listSocialDmRequestsFor(userId: string): SocialDmRequest[] {
  return listSocialDmRequests()
    .filter((r) => r.fromId === userId || r.toId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function listIncomingPending(userId: string): SocialDmRequest[] {
  return listSocialDmRequestsFor(userId).filter((r) => r.toId === userId && r.status === 'pending')
}

function pairKey(a: string, b: string) {
  return [a, b].sort().join(':')
}

export function getSocialDmPermission(meId: string, otherId: string): SocialDmPermission {
  if (!meId || !otherId || meId === otherId) return 'none'
  const pair = pairKey(meId, otherId)
  const related = get().requests.filter((r) => pairKey(r.fromId, r.toId) === pair)
  if (related.some((r) => r.status === 'accepted')) return 'accepted'
  const pending = related.find((r) => r.status === 'pending')
  if (pending) {
    if (pending.fromId === meId) return 'outgoing'
    if (pending.toId === meId) return 'incoming'
  }
  if (related.some((r) => r.status === 'declined')) return 'declined'
  return 'none'
}

export function requestSocialDm(input: {
  meId: string
  meName: string
  otherId: string
  otherName: string
  note?: string
}): { request: SocialDmRequest; created: boolean; permission: SocialDmPermission } {
  if (input.meId === input.otherId) {
    throw new Error('Cannot request Social DM with yourself')
  }
  const permission = getSocialDmPermission(input.meId, input.otherId)
  if (permission === 'accepted') {
    const accepted = get().requests.find(
      (r) =>
        r.status === 'accepted' &&
        pairKey(r.fromId, r.toId) === pairKey(input.meId, input.otherId),
    )
    return {
      request: accepted!,
      created: false,
      permission: 'accepted',
    }
  }
  if (permission === 'outgoing' || permission === 'incoming') {
    const pending = get().requests.find(
      (r) =>
        r.status === 'pending' &&
        pairKey(r.fromId, r.toId) === pairKey(input.meId, input.otherId),
    )!
    return { request: structuredClone(pending), created: false, permission }
  }

  const request: SocialDmRequest = {
    id: uid('dmreq'),
    fromId: input.meId,
    fromName: input.meName,
    toId: input.otherId,
    toName: input.otherName,
    note: input.note?.trim() || undefined,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
  const s = get()
  commit({ requests: [request, ...s.requests] })
  return { request: structuredClone(request), created: true, permission: 'outgoing' }
}

function ensureSocialThread(input: {
  meId: string
  meName: string
  otherId: string
  otherName: string
  openerBody: string
}): Thread {
  return store.createDirectThread({
    participantIds: [input.meId, input.otherId],
    participantNames: [input.meName, input.otherName],
    listingTitle: input.otherName,
    senderId: input.meId,
    senderName: input.meName,
    body: input.openerBody,
    kind: 'social',
  })
}

export function acceptSocialDm(
  requestId: string,
  accepterId: string,
): { request: SocialDmRequest; threadId: string } {
  const s = structuredClone(get())
  const req = s.requests.find((r) => r.id === requestId)
  if (!req) throw new Error('Social DM request not found')
  if (req.toId !== accepterId) throw new Error('Only the recipient can accept')
  if (req.status === 'accepted' && req.threadId) {
    return { request: req, threadId: req.threadId }
  }
  if (req.status !== 'pending') throw new Error('Request is not pending')

  const thread = ensureSocialThread({
    meId: accepterId,
    meName: req.toName,
    otherId: req.fromId,
    otherName: req.fromName,
    openerBody: `Allda Chat freigeschaltet — ${req.toName} hat die Social-Anfrage angenommen.`,
  })
  req.status = 'accepted'
  req.resolvedAt = new Date().toISOString()
  req.threadId = thread.id
  commit(s)
  return { request: structuredClone(req), threadId: thread.id }
}

export function declineSocialDm(requestId: string, declinerId: string): SocialDmRequest {
  const s = structuredClone(get())
  const req = s.requests.find((r) => r.id === requestId)
  if (!req) throw new Error('Social DM request not found')
  if (req.toId !== declinerId) throw new Error('Only the recipient can decline')
  if (req.status !== 'pending') return structuredClone(req)
  req.status = 'declined'
  req.resolvedAt = new Date().toISOString()
  commit(s)
  return structuredClone(req)
}

/** Open chat only when Social consent is accepted. Returns null otherwise. */
export function openAcceptedSocialChat(input: {
  meId: string
  meName: string
  otherId: string
  otherName: string
}): Thread | null {
  if (getSocialDmPermission(input.meId, input.otherId) !== 'accepted') return null
  const existing = store.listThreads(input.meId).find(
    (t) =>
      (t.kind ?? 'match') === 'social' &&
      t.participantIds.includes(input.otherId) &&
      t.participantIds.includes(input.meId),
  )
  if (existing) return existing
  return ensureSocialThread({
    ...input,
    openerBody: 'Allda Social — Chat freigeschaltet.',
  })
}

/**
 * @deprecated Prefer requestSocialDm / openAcceptedSocialChat.
 * Kept for callers: never cold-opens a Social thread without consent.
 */
export function startSocialDm(input: {
  meId: string
  meName: string
  otherId: string
  otherName: string
}): { permission: SocialDmPermission; request?: SocialDmRequest; thread?: Thread } {
  const permission = getSocialDmPermission(input.meId, input.otherId)
  if (permission === 'accepted') {
    const thread = openAcceptedSocialChat(input)
    return { permission, thread: thread ?? undefined }
  }
  const { request, permission: next } = requestSocialDm(input)
  return { permission: next, request }
}

/** Test helper — clears local Social DM state (no seed). */
export function __resetSocialDmForTests() {
  cache = { requests: [] }
  localStorage.setItem(KEY, JSON.stringify(cache))
}
