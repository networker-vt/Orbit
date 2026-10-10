import { beforeEach, describe, expect, it } from 'vitest'
import { __resetKidsHubForTests, computeFit, toggleKidsHobby } from './kidsHub'

describe('kidsHub', () => {
  beforeEach(() => {
    localStorage.clear()
    __resetKidsHubForTests()
  })

  it('toggles hobbies and computes fit demo', () => {
    toggleKidsHobby('Malen')
    toggleKidsHobby('Malen')
    const fit = computeFit({ energy: 9, social: 3, music: 8, outdoor: 7 })
    expect(fit.sport).toBeTruthy()
    expect(fit.instrument).toMatch(/Klavier|Gitarre/)
  })
})
