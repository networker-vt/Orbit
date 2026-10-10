/**
 * Home preset chips — short routes into Essen / Prefs (money) / Abflug.
 * Labels stay product voice; they are not lifeExample toggles.
 */

export type HomePresetId = 'essen' | 'money' | 'reise'

export type HomePreset = {
  id: HomePresetId
  labelDe: string
  labelEn: string
  to: string
  /** Hide when Kids blocks travel booking. */
  hideTravel?: boolean
}

export const HOME_PRESETS: readonly HomePreset[] = [
  {
    id: 'essen',
    labelDe: "Was gibt's heute zu essen",
    labelEn: "What's for food today",
    to: '/essen',
  },
  {
    id: 'money',
    labelDe: 'I need money',
    labelEn: 'I need money',
    to: '/prefs?intent=money',
  },
  {
    id: 'reise',
    labelDe: 'plane meine Reise',
    labelEn: 'plan my trip',
    to: '/abflug',
    hideTravel: true,
  },
] as const

export function presetLabel(preset: HomePreset, locale: 'de' | 'en'): string {
  return locale === 'de' ? preset.labelDe : preset.labelEn
}

export function visibleHomePresets(hideTravel: boolean): HomePreset[] {
  return HOME_PRESETS.filter((p) => !(p.hideTravel && hideTravel))
}
