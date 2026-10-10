import { beforeEach, describe, expect, it } from 'vitest'
import {
  __resetSocialDmForTests,
  acceptSocialDm,
  declineSocialDm,
  getSocialDmPermission,
  openAcceptedSocialChat,
  requestSocialDm,
  startSocialDm,
} from './socialDm'
import { store } from './store'

describe('Social DM consent API', () => {
  beforeEach(() => {
    localStorage.clear()
    __resetSocialDmForTests()
  })

  it('starts as none and request creates outgoing pending', () => {
    expect(getSocialDmPermission('a', 'b')).toBe('none')
    const { created, permission } = requestSocialDm({
      meId: 'a',
      meName: 'A',
      otherId: 'b',
      otherName: 'B',
      note: 'Hi',
    })
    expect(created).toBe(true)
    expect(permission).toBe('outgoing')
    expect(getSocialDmPermission('a', 'b')).toBe('outgoing')
    expect(getSocialDmPermission('b', 'a')).toBe('incoming')
  })

  it('does not unlock chat until accept', () => {
    requestSocialDm({ meId: 'a', meName: 'A', otherId: 'b', otherName: 'B' })
    expect(openAcceptedSocialChat({ meId: 'a', meName: 'A', otherId: 'b', otherName: 'B' })).toBeNull()
    const before = store.listThreads('a').filter((t) => t.kind === 'social').length
    expect(before).toBe(0)
  })

  it('accept unlocks a social thread; decline blocks cold open', () => {
    const { request } = requestSocialDm({
      meId: 'a',
      meName: 'A',
      otherId: 'b',
      otherName: 'B',
    })
    const { threadId } = acceptSocialDm(request.id, 'b')
    expect(threadId).toBeTruthy()
    expect(getSocialDmPermission('a', 'b')).toBe('accepted')
    const thread = openAcceptedSocialChat({ meId: 'a', meName: 'A', otherId: 'b', otherName: 'B' })
    expect(thread?.id).toBe(threadId)
    expect(thread?.kind).toBe('social')

    __resetSocialDmForTests()
    const again = requestSocialDm({ meId: 'c', meName: 'C', otherId: 'd', otherName: 'D' })
    declineSocialDm(again.request.id, 'd')
    expect(getSocialDmPermission('c', 'd')).toBe('declined')
    expect(openAcceptedSocialChat({ meId: 'c', meName: 'C', otherId: 'd', otherName: 'D' })).toBeNull()
  })

  it('startSocialDm never cold-opens without consent', () => {
    const first = startSocialDm({ meId: 'a', meName: 'A', otherId: 'b', otherName: 'B' })
    expect(first.permission).toBe('outgoing')
    expect(first.thread).toBeUndefined()
    expect(first.request?.status).toBe('pending')
  })
})
