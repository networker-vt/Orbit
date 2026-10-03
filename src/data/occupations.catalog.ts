/**
 * Berufskatalog für Mein, Prefs, Profil und Match-Filter.
 * Liegt in einem eigenen Chunk (dynamic import) — nicht statisch aus der App laden.
 *
 * Zwei belegte Schichten, keine eigene Rangliste. Die Anzeige sortiert alphabetisch.
 *
 * Weltweit:
 * - WEF Future of Jobs 2025, Digest und Kap. 2 Jobs outlook
 *   https://www.weforum.org/publications/the-future-of-jobs-report-2025/digest/
 *   Absolutes Wachstum: Farmworkers, Delivery Drivers, Construction Workers,
 *   Salespersons, Food Processing Workers. Prozentuales Wachstum: Big Data,
 *   FinTech, AI and Machine Learning, Software and Applications Developers,
 *   Information Security, Renewable Energy. Außerdem Pflege, Bildung sowie
 *   Social Work and Counselling (keine separate Consulting-Rangliste im Digest).
 * - LinkedIn, Davos-Pressemitteilung Januar 2026
 *   https://news.linkedin.com/2026/2026-Davos-Press-Release
 *   KI-enabled Rollen (AI Engineer, Data Annotator, Forward-Deployed Engineer)
 *   und Gesundheit als einer der wenigen Wachstumspockets. Keine Farm-/Liefer-Rangliste.
 *
 * Deutschland:
 * - Bundesagentur für Arbeit, Fachkräfteengpassanalyse 2025, Presseinfo 32/2026
 *   https://www.arbeitsagentur.de/presse/2026-32-fachkraefte-bleiben-knapp-zuwanderung-gewinnt-weiter-an-bedeutung
 *   Pflege, Bau und Handwerk, Köche, Berufskraftfahrer, Erziehung, Sozialarbeit.
 *   Die BA meldet 2025 keinen Engpass mehr in der Softwareentwicklung — deshalb
 *   steht Software hier bei Weltweit, nicht als DE-Engpass.
 * - DEKRA Arbeitsmarktreport 2026
 *   https://www.dekra-arbeit.de/news/aktuelles/detail/dekra-arbeistmarktreport-2026
 *   Elektronik, Pflege, Erziehung, Maschinen- und Anlagenführung, Stapler,
 *   Verkauf, Hauspflege, Produktion, Sozialarbeit. Ohne Platzziffern.
 *
 * „Weitere“ sind Lebensbereiche, die diese Berichte nicht als Wachstum listen.
 * Events ist eine davon, nicht die Vorgabe und nicht vorausgewählt.
 * Keine Telefonnummern und keine E-Mail-Adressen. Kein Boost und kein Hervorheben.
 */

import { QUICK_OCCUPATION_GROUPS } from './occupationGroups'

export { QUICK_OCCUPATION_GROUPS }
export type QuickOccupationGroup = (typeof QUICK_OCCUPATION_GROUPS)[number]

export type OccupationLayer = 'welt' | 'de' | 'weitere'

export type OccupationSourceId =
  | 'wef-2025'
  | 'linkedin-2026'
  | 'ba-2025'
  | 'dekra-2026'
  | 'leben'

export interface OccupationEntry {
  id: string
  label: string
  group: string
  layer: OccupationLayer
  sources: OccupationSourceId[]
  /** Match-Tokens, klein, ohne Kontaktdaten. */
  terms: string[]
  /** Bestehende Listing-Branchen, nur wenn sie den Beruf wirklich tragen. */
  industries: string[]
}

export const OCCUPATION_SOURCE_NOTES: Record<OccupationSourceId, string> = {
  'wef-2025': 'WEF Future of Jobs 2025',
  'linkedin-2026': 'LinkedIn Davos, Januar 2026',
  'ba-2025': 'BA Fachkräfteengpassanalyse 2025',
  'dekra-2026': 'DEKRA Arbeitsmarktreport 2026',
  leben: 'Lebensbereich, keine Wachstumsliste',
}

export const OCCUPATIONS: OccupationEntry[] = [
  {
    id: 'wef-farm',
    label: 'Landwirtschaft',
    group: 'Landwirtschaft',
    layer: 'welt',
    sources: ['wef-2025'],
    terms: ['landwirtschaft', 'ernte', 'farmworker', 'acker'],
    industries: [],
  },
  {
    id: 'wef-delivery',
    label: 'Lieferfahrer',
    group: 'Logistik',
    layer: 'welt',
    sources: ['wef-2025'],
    terms: ['lieferfahrer', 'liefer', 'delivery', 'last-mile', 'zustellung'],
    industries: ['Logistik / Lager'],
  },
  {
    id: 'wef-construction',
    label: 'Bau',
    group: 'Handwerk',
    layer: 'welt',
    sources: ['wef-2025'],
    terms: ['bau', 'construction', 'baustelle'],
    industries: ['Handwerk / Bau'],
  },
  {
    id: 'wef-sales',
    label: 'Verkauf',
    group: 'Verkauf',
    layer: 'welt',
    sources: ['wef-2025'],
    terms: ['verkauf', 'verkäufer', 'sales', 'retail', 'boutique', 'vendeur', 'einzelhandel'],
    industries: ['Einzelhandel'],
  },
  {
    id: 'wef-food',
    label: 'Lebensmittelverarbeitung',
    group: 'Produktion',
    layer: 'welt',
    sources: ['wef-2025'],
    terms: ['lebensmittelverarbeitung', 'food processing', 'produktion'],
    industries: ['Produktion'],
  },
  {
    id: 'wef-software',
    label: 'Softwareentwicklung',
    group: 'IT',
    layer: 'welt',
    sources: ['wef-2025'],
    terms: ['software', 'developer', 'entwickl', 'react', 'informat'],
    industries: ['IT / Software'],
  },
  {
    id: 'wef-data',
    label: 'KI und Daten',
    group: 'IT',
    layer: 'welt',
    sources: ['wef-2025'],
    terms: ['daten', 'data analyst', 'machine learning', 'big data'],
    industries: ['IT / Software'],
  },
  {
    id: 'wef-fintech',
    label: 'Fintech',
    group: 'Finanzen',
    layer: 'welt',
    sources: ['wef-2025'],
    terms: ['fintech'],
    industries: [],
  },
  {
    id: 'wef-security',
    label: 'IT-Sicherheit',
    group: 'IT',
    layer: 'welt',
    sources: ['wef-2025'],
    terms: ['it-sicherheit', 'informationssicherheit', 'cybersecurity', 'security analyst'],
    industries: ['IT / Software'],
  },
  {
    id: 'wef-energy',
    label: 'Erneuerbare Energie',
    group: 'Energie',
    layer: 'welt',
    sources: ['wef-2025'],
    terms: ['erneuerbar', 'renewable', 'solar', 'windkraft'],
    industries: [],
  },
  {
    id: 'wef-nursing',
    label: 'Pflegefachkraft',
    group: 'Pflege',
    layer: 'welt',
    sources: ['wef-2025'],
    terms: ['pflege', 'krankenpflege', 'nursing', 'care', 'opiekun', 'ambulant'],
    industries: ['Pflege / Care', 'Gesundheit'],
  },
  {
    id: 'wef-aide',
    label: 'Persönliche Betreuung',
    group: 'Pflege',
    layer: 'welt',
    sources: ['wef-2025'],
    terms: ['betreuung', 'personal care', 'alltagshilfe'],
    industries: ['Pflege / Care', 'Gesundheit'],
  },
  {
    id: 'wef-teaching',
    label: 'Lehrkraft',
    group: 'Bildung',
    layer: 'welt',
    sources: ['wef-2025'],
    terms: ['lehr', 'teacher', 'unterricht', 'bildung', 'nachhilfe'],
    industries: ['Bildung'],
  },
  {
    id: 'wef-counsel',
    label: 'Soziale Beratung',
    group: 'Soziales',
    layer: 'welt',
    sources: ['wef-2025'],
    terms: ['sozialberatung', 'counselling', 'counseling', 'soziale arbeit'],
    industries: [],
  },
  {
    id: 'li-ai',
    label: 'KI-Entwicklung',
    group: 'IT',
    layer: 'welt',
    sources: ['linkedin-2026'],
    terms: ['ki-entwicklung', 'ai engineer', 'künstliche intelligenz'],
    industries: ['IT / Software'],
  },
  {
    id: 'li-annotate',
    label: 'Datenannotation',
    group: 'IT',
    layer: 'welt',
    sources: ['linkedin-2026'],
    terms: ['annotation', 'data annotat'],
    industries: ['IT / Software'],
  },
  {
    id: 'li-fde',
    label: 'KI-Einführung im Betrieb',
    group: 'IT',
    layer: 'welt',
    sources: ['linkedin-2026'],
    terms: ['forward-deployed', 'ki-einführung'],
    industries: ['IT / Software'],
  },
  {
    id: 'li-health',
    label: 'Gesundheit',
    group: 'Pflege',
    layer: 'welt',
    sources: ['linkedin-2026'],
    terms: ['gesundheit', 'healthcare', 'klinik'],
    industries: ['Gesundheit', 'Pflege / Care'],
  },
  {
    id: 'de-electronics',
    label: 'Elektronik',
    group: 'Handwerk',
    layer: 'de',
    sources: ['dekra-2026'],
    terms: ['elektronik', 'elektro', 'elektrik', 'installateur', 'monteur'],
    industries: ['Handwerk / Bau'],
  },
  {
    id: 'de-nursing',
    label: 'Gesundheits- und Krankenpflege',
    group: 'Pflege',
    layer: 'de',
    sources: ['ba-2025', 'dekra-2026'],
    terms: ['pflegefach', 'krankenpflege', 'pflege', 'care'],
    industries: ['Pflege / Care', 'Gesundheit'],
  },
  {
    id: 'de-education',
    label: 'Erziehung und Bildung',
    group: 'Bildung',
    layer: 'de',
    sources: ['ba-2025', 'dekra-2026'],
    terms: ['erzieh', 'kinderbetreuung', 'bildung', 'lehr', 'pädagog'],
    industries: ['Bildung'],
  },
  {
    id: 'de-machines',
    label: 'Maschinen- und Anlagenführung',
    group: 'Handwerk',
    layer: 'de',
    sources: ['dekra-2026'],
    terms: ['anlagenführ', 'maschinenführ', 'maschinist'],
    industries: ['Produktion', 'Handwerk / Bau'],
  },
  {
    id: 'de-forklift',
    label: 'Stapler und Transportgeräte',
    group: 'Logistik',
    layer: 'de',
    sources: ['dekra-2026'],
    terms: ['stapler', 'transportgerät', 'flurförder'],
    industries: ['Logistik / Lager'],
  },
  {
    id: 'de-sales',
    label: 'Verkauf und Vertrieb',
    group: 'Verkauf',
    layer: 'de',
    sources: ['dekra-2026'],
    terms: ['verkauf', 'vertrieb', 'sales manager', 'verkäufer', 'einzelhandel'],
    industries: ['Einzelhandel', 'Marketing / Sales'],
  },
  {
    id: 'de-home-care',
    label: 'Hauspflege',
    group: 'Pflege',
    layer: 'de',
    sources: ['dekra-2026'],
    terms: ['hauspflege', 'ambulante pflege', 'hauswirtschaftl'],
    industries: ['Pflege / Care'],
  },
  {
    id: 'de-production',
    label: 'Produktion',
    group: 'Produktion',
    layer: 'de',
    sources: ['dekra-2026'],
    terms: ['produktion', 'produktionshelfer', 'fertigung'],
    industries: ['Produktion'],
  },
  {
    id: 'de-social',
    label: 'Sozialarbeit',
    group: 'Soziales',
    layer: 'de',
    sources: ['ba-2025', 'dekra-2026'],
    terms: ['sozialarbeit', 'sozialpäd', 'sozialpädagog'],
    industries: [],
  },
  {
    id: 'de-cooks',
    label: 'Köchinnen und Köche',
    group: 'Gastro',
    layer: 'de',
    sources: ['ba-2025'],
    terms: ['koch', 'köch', 'küche', 'gastronomie', 'barista', 'servicekraft'],
    industries: ['Gastronomie / Hotel'],
  },
  {
    id: 'de-drivers',
    label: 'Berufskraftfahrer',
    group: 'Logistik',
    layer: 'de',
    sources: ['ba-2025'],
    terms: ['berufskraftfahrer', 'kraftfahrer', 'lkw', 'fahrer', 'driver'],
    industries: ['Logistik / Lager'],
  },
  {
    id: 'de-trades',
    label: 'Bau und Handwerk',
    group: 'Handwerk',
    layer: 'de',
    sources: ['ba-2025'],
    terms: ['handwerk', 'bau', 'gewerk'],
    industries: ['Handwerk / Bau'],
  },
  {
    id: 'life-office',
    label: 'Büro und Verwaltung',
    group: 'Verwaltung',
    layer: 'weitere',
    sources: ['leben'],
    terms: ['büro', 'verwaltung', 'office manager', 'assistenz'],
    industries: ['Büro / Admin'],
  },
  {
    id: 'life-support',
    label: 'Kundenservice',
    group: 'Kundenservice',
    layer: 'weitere',
    sources: ['leben'],
    terms: ['kundenservice', 'customer support', 'support'],
    industries: ['Kundenservice'],
  },
  {
    id: 'life-clean',
    label: 'Reinigung und Facility',
    group: 'Reinigung',
    layer: 'weitere',
    sources: ['leben'],
    terms: ['reinigung', 'facility', 'putzen', 'housekeeping'],
    industries: [],
  },
  {
    id: 'life-finance',
    label: 'Buchhaltung',
    group: 'Finanzen',
    layer: 'weitere',
    sources: ['leben'],
    terms: ['buchhaltung', 'payroll', 'accounting'],
    industries: [],
  },
  {
    id: 'life-creative',
    label: 'Kreativ und Medien',
    group: 'Kreativ',
    layer: 'weitere',
    sources: ['leben'],
    terms: ['grafik', 'redaktion', 'medienproduktion', 'journal'],
    industries: [],
  },
  {
    id: 'life-events',
    label: 'Veranstaltungstechnik',
    group: 'Events',
    layer: 'weitere',
    sources: ['leben'],
    terms: ['veranstaltungstechnik', 'stagehand', 'lichttechn', 'rigger', 'foh', 'festival'],
    industries: ['Event / Veranstaltungstechnik'],
  },
]

export function isQuickOccupationGroup(group: string): group is QuickOccupationGroup {
  return (QUICK_OCCUPATION_GROUPS as readonly string[]).includes(group)
}

export function occupationsInGroup(group: string): OccupationEntry[] {
  return OCCUPATIONS.filter((entry) => entry.group === group).sort((a, b) =>
    a.label.localeCompare(b.label, 'de'),
  )
}

export function searchOccupations(query: string): OccupationEntry[] {
  const q = query.trim().toLowerCase()
  if (q.length < 2) return []
  return OCCUPATIONS.filter((entry) => {
    const hay = [entry.label, entry.group, ...entry.terms].join(' ').toLowerCase()
    return hay.includes(q)
  }).sort((a, b) => a.label.localeCompare(b.label, 'de'))
}

export interface OccupationSelection {
  occupations: string[]
  labels: string[]
  occupationTerms: string[]
  occupationOther: string
  industries: string[]
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))]
}

export function selectionFromIds(ids: string[], other = ''): OccupationSelection {
  const picked = OCCUPATIONS.filter((entry) => ids.includes(entry.id))
  return {
    occupations: picked.map((entry) => entry.id),
    labels: picked.map((entry) => entry.label),
    occupationTerms: unique(picked.flatMap((entry) => entry.terms)),
    occupationOther: other.trim(),
    industries: unique(picked.flatMap((entry) => entry.industries)),
  }
}
