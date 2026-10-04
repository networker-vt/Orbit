/**
 * Tiny sentence check for the home field.
 * This file must stay free of the photo, the map, and the timer.
 */

const PARK_TERMS = new Set([
  'parkmerke',
  'parkzeit',
  'parkticket',
  'parkplatz',
  'parkhaus',
  'geparkt',
  'eingeparkt',
  'parken',
])

export function sentenceOpensParkmerke(text: string): boolean {
  const tokens = text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word.length >= 2)
  return tokens.some((word) => PARK_TERMS.has(word))
}
