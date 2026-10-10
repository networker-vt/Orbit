/**
 * Startseite — Alltag shortcuts (separate from Essen / Money / Reise core presets).
 */

export type HomeDailyPresetId = 'outfit' | 'tanken' | 'kalender' | 'einkauf'

export type HomeDailyPreset = {
  id: HomeDailyPresetId
  labelDe: string
  labelEn: string
  to: string
}

export const HOME_DAILY_PRESETS: readonly HomeDailyPreset[] = [
  {
    id: 'outfit',
    labelDe: 'Was ziehe ich heute an?',
    labelEn: 'What should I wear today?',
    to: '/outfit',
  },
  {
    id: 'tanken',
    labelDe: 'Wo tanken am günstigsten?',
    labelEn: 'Cheapest fuel nearby?',
    to: '/tanken',
  },
  {
    id: 'kalender',
    labelDe: 'Kalender',
    labelEn: 'Calendar',
    to: '/kalender',
  },
  {
    id: 'einkauf',
    labelDe: 'Einkaufszettel',
    labelEn: 'Shopping list',
    to: '/einkauf',
  },
] as const

export function dailyPresetLabel(preset: HomeDailyPreset, locale: 'de' | 'en'): string {
  return locale === 'de' ? preset.labelDe : preset.labelEn
}
