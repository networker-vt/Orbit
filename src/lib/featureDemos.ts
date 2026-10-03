import { FEATURE_FLAG_DEFS, isFlagOn, type FeatureFlag } from './flags'

/** Hidden public capabilities. `publishListings` stays live and is not a demo. */
export const DEMO_FEATURES = [
  'credits',
  'kids',
  'channels',
  'ideas',
  'integrations',
  'kabine',
  'campus',
  'photoJobs',
  'verifyId',
  'entdecker',
  'interview',
] as const satisfies readonly FeatureFlag[]

export type DemoFeature = (typeof DEMO_FEATURES)[number]

export type DemoCopy = {
  title: string
  lead: string
  samples: string[]
  action: string
}

const de: Record<DemoFeature, DemoCopy> = {
  credits: {
    title: 'Wallet',
    lead: 'Demonstration. So sähe ein Guthaben aus. Es wird nichts gebucht und kein Geld bewegt.',
    samples: ['Beispielguthaben · 120', 'Schicht-Boost · Beispiel, nicht gebucht'],
    action: 'Demo: Buchen ansehen',
  },
  kids: {
    title: 'Orbit Kids',
    lead: 'Demonstration. So sähe ein Kinderbereich aus. Es entsteht kein Kinderkonto.',
    samples: ['Beispiel · Alter 13–15', 'PIN bleibt leer · nichts gespeichert'],
    action: 'Demo: Kinderkonto ansehen',
  },
  channels: {
    title: 'Kanäle',
    lead: 'Demonstration. So sähen verbundene Kanäle aus. Es wird niemand kontaktiert.',
    samples: ['Beispielkanal · nicht verbunden', 'Community · nur Ansicht'],
    action: 'Demo: Verbinden ansehen',
  },
  ideas: {
    title: 'Ideen-Box',
    lead: 'Demonstration. So sähe eine Idee aus. Sie wird nicht gespeichert.',
    samples: ['Beispiel · „Ruhemodus am Abend“', 'Status · nur Ansicht'],
    action: 'Demo: Idee ansehen',
  },
  integrations: {
    title: 'Integrationen',
    lead: 'Demonstration. So sähe ein Anschluss aus. Es geht keine Verbindung raus.',
    samples: ['Beispiel-Planung · nicht verbunden', 'Sync · nur Ansicht'],
    action: 'Demo: Verbinden ansehen',
  },
  kabine: {
    title: 'Kabine',
    lead: 'Demonstration. So sähe eine Anprobe aus. Es wird kein Foto gespeichert.',
    samples: ['Beispiel-Outfit · Abend', 'Beispiel-Schuhe · Größe 42'],
    action: 'Demo: Anprobe ansehen',
  },
  campus: {
    title: 'Campus',
    lead: 'Demonstration. So sähe eine Lektion aus. Es startet kein Kurs.',
    samples: ['Beispiel · Alltag planen', 'Fortschritt · 0 von 3, nur Ansicht'],
    action: 'Demo: Lektion ansehen',
  },
  photoJobs: {
    title: 'Foto-Jobs',
    lead: 'Demonstration. So sähe eine Foto-Auswertung aus. Es wird kein Inserat veröffentlicht.',
    samples: ['Beispielfoto · Lagerhalle', 'Vorschlag · Lagerhilfe, nicht veröffentlicht'],
    action: 'Demo: Vorschlag ansehen',
  },
  verifyId: {
    title: 'Verifizierung',
    lead: 'Demonstration. So sähe eine Prüfung aus. Es wird kein Ausweis gespeichert.',
    samples: ['Status · nicht geprüft', 'Dokument · Beispiel, nicht hochgeladen'],
    action: 'Demo: Prüfung ansehen',
  },
  entdecker: {
    title: 'Entdecker',
    lead: 'Demonstration. So sähe eine Foto-Erklärung aus. Es wird nichts erkannt und nichts gespeichert.',
    samples: ['Beispielfoto · Schild an einer Tür', 'Erklärung · „Sieht nach Schrift aus“, nur Ansicht'],
    action: 'Demo: Erklärung ansehen',
  },
  interview: {
    title: 'Interview',
    lead: 'Demonstration. So sähe ein Gesprächsraum aus. Es startet kein Anruf.',
    samples: ['Beispielraum · Pflegefachkraft', 'Nachricht · „Hallo, das ist ein Beispiel.“'],
    action: 'Demo: Gespräch ansehen',
  },
}

const en: Record<DemoFeature, DemoCopy> = {
  credits: {
    title: 'Wallet',
    lead: 'Demonstration. This is what a balance would look like. Nothing is booked and no money moves.',
    samples: ['Sample balance · 120', 'Shift boost · sample, not booked'],
    action: 'Demo: view booking',
  },
  kids: {
    title: 'Orbit Kids',
    lead: 'Demonstration. This is what a kids area would look like. No kids account is created.',
    samples: ['Sample · age 13–15', 'PIN stays empty · nothing stored'],
    action: 'Demo: view kids account',
  },
  channels: {
    title: 'Channels',
    lead: 'Demonstration. This is what linked channels would look like. Nobody is contacted.',
    samples: ['Sample channel · not connected', 'Community · view only'],
    action: 'Demo: view connect',
  },
  ideas: {
    title: 'Ideas box',
    lead: 'Demonstration. This is what an idea would look like. It is not saved.',
    samples: ['Sample · “Quiet mode in the evening”', 'Status · view only'],
    action: 'Demo: view idea',
  },
  integrations: {
    title: 'Integrations',
    lead: 'Demonstration. This is what a connection would look like. Nothing is contacted.',
    samples: ['Sample planner · not connected', 'Sync · view only'],
    action: 'Demo: view connect',
  },
  kabine: {
    title: 'Kabine',
    lead: 'Demonstration. This is what a try-on would look like. No photo is stored.',
    samples: ['Sample outfit · evening', 'Sample shoes · size 42'],
    action: 'Demo: view try-on',
  },
  campus: {
    title: 'Campus',
    lead: 'Demonstration. This is what a lesson would look like. No course starts.',
    samples: ['Sample · plan an everyday task', 'Progress · 0 of 3, view only'],
    action: 'Demo: view lesson',
  },
  photoJobs: {
    title: 'Photo jobs',
    lead: 'Demonstration. This is what a photo reading would look like. No listing is published.',
    samples: ['Sample photo · warehouse', 'Suggestion · warehouse help, not published'],
    action: 'Demo: view suggestion',
  },
  verifyId: {
    title: 'Verification',
    lead: 'Demonstration. This is what a check would look like. No ID document is stored.',
    samples: ['Status · not checked', 'Document · sample, not uploaded'],
    action: 'Demo: view check',
  },
  entdecker: {
    title: 'Entdecker',
    lead: 'Demonstration. This is what a photo explanation would look like. Nothing is recognised or stored.',
    samples: ['Sample photo · a sign on a door', 'Explanation · “Looks like writing”, view only'],
    action: 'Demo: view explanation',
  },
  interview: {
    title: 'Interview',
    lead: 'Demonstration. This is what a call room would look like. No call starts.',
    samples: ['Sample room · nurse', 'Message · “Hello, this is a sample.”'],
    action: 'Demo: view conversation',
  },
}

export function isDemoFeature(value: string | undefined): value is DemoFeature {
  return DEMO_FEATURES.includes(value as DemoFeature)
}

/** Public demo URLs may use a short name. `verify` is the verification flag `verifyId`. */
export function resolveDemoFeature(value: string | undefined): DemoFeature | undefined {
  if (!value) return undefined
  if (isDemoFeature(value)) return value
  if (value === 'verify') return 'verifyId'
  return undefined
}

export function demoCopy(feature: DemoFeature, locale: 'de' | 'en'): DemoCopy {
  return (locale === 'de' ? de : en)[feature]
}

/** Preview controls stop here. They never book, pay, store an ID, enable kids, or publish. */
export function demoActionResult(): 'blocked' {
  return 'blocked'
}

export function hiddenPublicFlags(): FeatureFlag[] {
  return FEATURE_FLAG_DEFS.filter((flag) => !flag.default).map((flag) => flag.id)
}

/** Live route while the flag is on. Closed flags stay on their route and render the demo page. */
export function featureIsLive(flag: FeatureFlag): boolean {
  return isFlagOn(flag)
}
