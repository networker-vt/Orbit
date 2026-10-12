import { beforeEach, describe, expect, it } from 'vitest'
import {
  __resetSocialDmConsentForTests,
  acceptSocialDmRequest,
  attachSocialDmThreadId,
  canOpenSocialDm,
  declineSocialDmRequest,
  getAcceptedSocialDmThreadId,
  registerSocialDmThreadBinder,
  requestSocialDm,
} from './socialDmConsent'
import { startSocialDm } from './social'

describe('Allda Social DM consent (1:1)', () => {
  beforeEach(() => {
    localStorage.clear()
    __resetSocialDmConsentForTests()
  })

  it('request does not open a thread and stays pending', () => {
    const req = requestSocialDm({
      fromId: 'u1',
      fromName: 'Alex',
      toId: 'u2',
      toName: 'Nora',
      note: 'Hi from Allda Social',
    })
    expect(req.status).toBe('pending')
    expect(req.threadId).toBeNull()
    expect(canOpenSocialDm('u1', 'u2')).toBe(false)
  })

  it('startSocialDm is request-only (no createDirectThread)', () => {
    const req = startSocialDm({
      meId: 'u1',
      meName: 'Alex',
      otherId: 'u2',
      otherName: 'Nora',
    })
    expect(req.status).toBe('pending')
    expect(req.id).toMatch(/^dmreq/)
  })

  it('accept + Chat binder attaches threadId; only then canOpen', () => {
    registerSocialDmThreadBinder((r) => `orbit-chat:${r.fromId}:${r.toId}`)
    const req = requestSocialDm({
      fromId: 'u1',
      fromName: 'Alex',
      toId: 'u2',
      toName: 'Nora',
    })
    const accepted = acceptSocialDmRequest(req.id, 'u2')
    expect(accepted?.status).toBe('accepted')
    expect(accepted?.threadId).toBe('orbit-chat:u1:u2')
    expect(canOpenSocialDm('u1', 'u2')).toBe(true)
    expect(getAcceptedSocialDmThreadId('u2', 'u1')).toBe('orbit-chat:u1:u2')
  })

  it('accept without binder leaves threadId null until attachSocialDmThreadId', () => {
    const req = requestSocialDm({
      fromId: 'u1',
      fromName: 'Alex',
      toId: 'u2',
      toName: 'Nora',
    })
    const accepted = acceptSocialDmRequest(req.id, 'u2')
    expect(accepted?.threadId).toBeNull()
    expect(canOpenSocialDm('u1', 'u2')).toBe(false)
    attachSocialDmThreadId(req.id, 'thr_chat_demo')
    expect(canOpenSocialDm('u1', 'u2')).toBe(true)
  })

  it('decline blocks open; wrong acceptor cannot accept', () => {
    const req = requestSocialDm({
      fromId: 'u1',
      fromName: 'Alex',
      toId: 'u2',
      toName: 'Nora',
    })
    expect(acceptSocialDmRequest(req.id, 'u1')).toBeNull()
    const declined = declineSocialDmRequest(req.id, 'u2')
    expect(declined?.status).toBe('declined')
    expect(canOpenSocialDm('u1', 'u2')).toBe(false)
  })
})
