import { describe, expect, it } from 'vitest'
import { QUICK_OCCUPATION_GROUPS } from './occupationGroups'
import {
  OCCUPATIONS,
  isQuickOccupationGroup,
  searchOccupations,
  selectionFromIds,
} from './occupations.catalog'

describe('occupation catalog', () => {
  it('shows only the short group row before a search, and not Events', () => {
    expect([...QUICK_OCCUPATION_GROUPS]).toEqual([
      'Pflege',
      'Handwerk',
      'IT',
      'Verkauf',
      'Bildung',
      'Logistik',
      'Gastro',
    ])
    expect(isQuickOccupationGroup('Events')).toBe(false)
    expect(OCCUPATIONS.some((entry) => entry.group === 'Events')).toBe(true)
    expect(OCCUPATIONS.filter((entry) => entry.group === 'Events')).toHaveLength(1)
  })

  it('keeps two cited layers and does not number a ranking', () => {
    expect(OCCUPATIONS.some((entry) => entry.layer === 'welt' && entry.sources.includes('wef-2025'))).toBe(true)
    expect(OCCUPATIONS.some((entry) => entry.layer === 'welt' && entry.sources.includes('linkedin-2026'))).toBe(true)
    expect(OCCUPATIONS.some((entry) => entry.layer === 'de' && entry.sources.includes('ba-2025'))).toBe(true)
    expect(OCCUPATIONS.some((entry) => entry.layer === 'de' && entry.sources.includes('dekra-2026'))).toBe(true)
    for (const entry of OCCUPATIONS) {
      expect(entry).not.toHaveProperty('rank')
      expect(entry.label).not.toMatch(/\bPlatz\b/)
    }
  })

  it('reveals events and other life areas only through search', () => {
    expect(searchOccupations('')).toEqual([])
    expect(searchOccupations('v')).toEqual([])
    const events = searchOccupations('veranstaltung')
    expect(events.map((entry) => entry.id)).toContain('life-events')
    expect(searchOccupations('buchhaltung').some((entry) => entry.id === 'life-finance')).toBe(true)
    expect(searchOccupations('reinigung').some((entry) => entry.group === 'Reinigung')).toBe(true)
  })

  it('keeps contact data and boosts out of every entry', () => {
    for (const entry of OCCUPATIONS) {
      const blob = JSON.stringify(entry)
      expect(blob).not.toMatch(/@/)
      expect(blob).not.toMatch(/\+\d/)
      expect(blob.toLowerCase()).not.toContain('featured')
    }
  })

  it('does not preselect events when nothing is chosen', () => {
    const empty = selectionFromIds([])
    expect(empty.occupations).toEqual([])
    expect(empty.industries).not.toContain('Event / Veranstaltungstechnik')
  })
})
