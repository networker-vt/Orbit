import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { getBusinessConsent, setBusinessConsentAccepted } from './offerDb'

describe('offer business consent', () => {
  beforeEach(async () => {
    indexedDB.deleteDatabase('orbit-offers')
  })

  it('persists § 14 BGB acknowledgment', async () => {
    expect(await getBusinessConsent()).toBeNull()
    await setBusinessConsentAccepted()
    const record = await getBusinessConsent()
    expect(record?.accepted).toBe(true)
    expect(record?.acceptedAt).toBeGreaterThan(0)
  })
})
