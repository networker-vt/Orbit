import type { CurrentWeather } from './openMeteo'
import { weatherLabel } from './openMeteo'

export type OutfitSuggestion = {
  headlineDe: string
  headlineEn: string
  itemsDe: string[]
  itemsEn: string[]
  noteDe: string
  noteEn: string
}

export function suggestOutfit(weather: CurrentWeather, locale: 'de' | 'en'): OutfitSuggestion {
  const t = weather.temperatureC
  const code = weather.weatherCode
  const rainy = [51, 53, 55, 61, 63, 65, 80, 95].includes(code)
  const snowy = code === 71 || code === 73 || code === 75
  const windy = weather.windKmh >= 25
  const label = weatherLabel(code, locale)

  const itemsDe: string[] = []
  const itemsEn: string[] = []

  if (t < 5 || snowy) {
    itemsDe.push('Warme Jacke', 'Mütze & Schal', 'Gefütterte Schuhe')
    itemsEn.push('Warm coat', 'Hat & scarf', 'Insulated shoes')
  } else if (t < 12) {
    itemsDe.push('Leichte Jacke oder Pullover', 'Lange Hose', 'Geschlossene Schuhe')
    itemsEn.push('Light jacket or sweater', 'Long pants', 'Closed shoes')
  } else if (t < 18) {
    itemsDe.push('Shirt + leichte Schicht', 'Jeans oder Chino', 'Bequeme Sneaker')
    itemsEn.push('Shirt + light layer', 'Jeans or chinos', 'Comfortable sneakers')
  } else if (t < 24) {
    itemsDe.push('T-Shirt oder leichtes Hemd', 'Shorts oder leichte Hose', 'Atmungsaktive Schuhe')
    itemsEn.push('T-shirt or light shirt', 'Shorts or light pants', 'Breathable shoes')
  } else {
    itemsDe.push('Leichte, luftige Kleidung', 'Sonnenschutz', 'Sandale oder Sneaker')
    itemsEn.push('Light airy clothes', 'Sun protection', 'Sandals or sneakers')
  }

  if (rainy) {
    itemsDe.unshift('Regenschirm oder Regenjacke')
    itemsEn.unshift('Umbrella or rain jacket')
  }
  if (windy) {
    itemsDe.push('Windfeste Jacke')
    itemsEn.push('Wind-resistant jacket')
  }

  const headlineDe = `${Math.round(t)} °C · ${label}`
  const headlineEn = `${Math.round(t)} °C · ${label}`

  return {
    headlineDe,
    headlineEn,
    itemsDe,
    itemsEn,
    noteDe: 'Regelbasiert aus Open-Meteo — kein Mode-KI-Stub.',
    noteEn: 'Rule-based from Open-Meteo — not a fashion AI stub.',
  }
}

export function outfitLines(s: OutfitSuggestion, locale: 'de' | 'en'): { headline: string; items: string[]; note: string } {
  return {
    headline: locale === 'de' ? s.headlineDe : s.headlineEn,
    items: locale === 'de' ? s.itemsDe : s.itemsEn,
    note: locale === 'de' ? s.noteDe : s.noteEn,
  }
}
