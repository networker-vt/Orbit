/** Allda — global industries & job taxonomy (DE labels). */

export const COUNTRIES = [
  'Deutschland',
  'Österreich',
  'Schweiz',
  'Niederlande',
  'Belgien',
  'Frankreich',
  'Polen',
  'UK',
  'Spanien',
  'Remote / Global',
] as const

export const LANGUAGES = [
  'Deutsch',
  'Englisch',
  'Französisch',
  'Niederländisch',
  'Polnisch',
  'Spanisch',
  'Italienisch',
] as const

export const INDUSTRIES = [
  'Event / Veranstaltungstechnik',
  'IT / Software',
  'Einzelhandel',
  'Pflege / Care',
  'Logistik / Lager',
  'Gastronomie / Hotel',
  'Büro / Admin',
  'Handwerk / Bau',
  'Kundenservice',
  'Marketing / Sales',
  'Bildung',
  'Gesundheit',
  'Produktion',
  'Minijob / Nebenjob',
] as const

export const JOB_TYPES = [
  'Vollzeit',
  'Teilzeit',
  'Minijob',
  'Freelance',
  'Werkstudent',
  'Praktikum',
  'Zeitarbeit',
] as const

export type JobType = (typeof JOB_TYPES)[number]
export type Industry = (typeof INDUSTRIES)[number]
export type WorkMode = 'remote' | 'hybrid' | 'onsite'

export const WORK_MODES: { id: WorkMode; label: string }[] = [
  { id: 'remote', label: 'Remote' },
  { id: 'hybrid', label: 'Hybrid' },
  { id: 'onsite', label: 'Vor Ort' },
]

export const COMPANY_SIZES = [
  '1–10',
  '11–50',
  '51–200',
  '201–1000',
  '1000+',
] as const

export const AGGREGATOR_SOURCES = [
  {
    id: 'linkedin',
    name: 'LinkedIn',
    status: 'planned' as const,
    hint: 'Partner-API geplant — kein Scraping',
  },
  {
    id: 'stepstone',
    name: 'StepStone',
    status: 'planned' as const,
    hint: 'API/Partner-Import geplant',
  },
  {
    id: 'indeed',
    name: 'Indeed',
    status: 'planned' as const,
    hint: 'Publisher-API geplant',
  },
  {
    id: 'xing',
    name: 'Xing',
    status: 'planned' as const,
    hint: 'Partner-Import geplant',
  },
  {
    id: 'arbeitsagentur',
    name: 'Arbeitsagentur',
    status: 'mock' as const,
    hint: 'Demo-Sample · offizielle Schnittstelle geplant',
  },
  {
    id: 'reed',
    name: 'Reed',
    status: 'planned' as const,
    hint: 'UK/EU Partner geplant',
  },
  {
    id: 'seek',
    name: 'Seek',
    status: 'planned' as const,
    hint: 'APAC Partner geplant',
  },
  {
    id: 'orbit',
    name: 'Allda Direct',
    status: 'live' as const,
    hint: 'Native Inserate in Allda',
  },
] as const

export type AggregatorId = (typeof AGGREGATOR_SOURCES)[number]['id']

export const ORBIT_TAGLINE_DE = 'Dein Allda für Arbeit — Matching statt Spam.'
export const ORBIT_BRAND = 'Allda'
