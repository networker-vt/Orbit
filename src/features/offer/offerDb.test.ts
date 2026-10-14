import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  allocateInvoiceNumber,
  getBusinessConsent,
  getCompanyProfile,
  getInvoiceCounter,
  mergeInvoiceCounter,
  saveCompanyProfile,
  setBusinessConsentAccepted,
  setInvoiceCounterForTests,
} from './offerDb'
import { emptyCompanyProfile } from './offerDb'

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

describe('invoice counter', () => {
  beforeEach(async () => {
    indexedDB.deleteDatabase('orbit-offers')
  })

  it('allocates sequential unique numbers', async () => {
    const a = await allocateInvoiceNumber()
    const b = await allocateInvoiceNumber()
    expect(a).not.toBe(b)
    expect((await getInvoiceCounter()).lastSeq).toBe(2)
  })

  it('import merge never resets counter', async () => {
    await setInvoiceCounterForTests({ lastSeq: 7, prefix: 'RE' })
    await mergeInvoiceCounter({ lastSeq: 3, prefix: 'RE' })
    expect((await getInvoiceCounter()).lastSeq).toBe(7)
  })
})

describe('company profile', () => {
  beforeEach(async () => {
    indexedDB.deleteDatabase('orbit-offers')
  })

  it('stores device-only profile', async () => {
    const profile = { ...emptyCompanyProfile(), name: 'Firma', street: 'A 1', postCode: '1', city: 'B', iban: 'DE00', taxNumber: '1' }
    await saveCompanyProfile(profile)
    expect((await getCompanyProfile())?.name).toBe('Firma')
  })
})
