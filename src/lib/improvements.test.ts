import { beforeEach, describe, expect, it } from 'vitest'
import { addImprovement, exportImprovementsJson, listImprovements, __resetImprovementsForTests } from './improvements'

describe('improvements', () => {
  beforeEach(() => {
    localStorage.clear()
    __resetImprovementsForTests()
  })

  it('stores and exports ideas locally', () => {
    addImprovement('Mehr Kontrast', 5, 'mitentwickeln')
    expect(listImprovements()).toHaveLength(1)
    expect(exportImprovementsJson()).toContain('Mehr Kontrast')
  })
})
