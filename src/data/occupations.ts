/**
 * Jobs a person can put on their own profile, prefs, or Mein.
 * Event technology is one group among many. A custom entry covers anything not listed.
 */
export const OCCUPATION_GROUPS = [
  { id: 'land', de: 'Landwirtschaft und Natur', en: 'Agriculture and nature' },
  { id: 'make', de: 'Handwerk, Bau und Produktion', en: 'Trades, construction and production' },
  { id: 'care', de: 'Pflege, Gesundheit und Soziales', en: 'Care, health and social work' },
  { id: 'teach', de: 'Bildung und Wissenschaft', en: 'Education and research' },
  { id: 'tech', de: 'IT, Software und Daten', en: 'IT, software and data' },
  { id: 'office', de: 'Büro, Verwaltung und Recht', en: 'Office, admin and law' },
  { id: 'shop', de: 'Handel, Verkauf und Service', en: 'Retail, sales and service' },
  { id: 'food', de: 'Gastronomie, Hotel und Tourismus', en: 'Food, hotels and tourism' },
  { id: 'move', de: 'Logistik, Verkehr und Sicherheit', en: 'Logistics, transport and security' },
  { id: 'home', de: 'Haushalt, Reinigung und Alltag', en: 'Household, cleaning and everyday help' },
  { id: 'media', de: 'Medien, Marketing und Gestaltung', en: 'Media, marketing and design' },
  { id: 'money', de: 'Finanzen, Beratung und Immobilien', en: 'Finance, consulting and property' },
  { id: 'public', de: 'Öffentlicher Dienst und Organisationen', en: 'Public service and organisations' },
  { id: 'event', de: 'Kultur, Sport und Veranstaltung', en: 'Culture, sport and events' },
] as const

export type OccupationGroupId = (typeof OCCUPATION_GROUPS)[number]['id']

export type Occupation = {
  id: string
  group: OccupationGroupId
  /** Canonical label stored on the profile (matches existing German listings). */
  de: string
  en: string
}

export const OCCUPATIONS: Occupation[] = [
  { id: 'farmer', group: 'land', de: 'Landwirt/in', en: 'Farmer' },
  { id: 'gardener', group: 'land', de: 'Gärtner/in', en: 'Gardener' },
  { id: 'forester', group: 'land', de: 'Forstwirt/in', en: 'Forester' },
  { id: 'animal', group: 'land', de: 'Tierpfleger/in', en: 'Animal keeper' },
  { id: 'vet', group: 'land', de: 'Tiermedizin', en: 'Veterinary work' },

  { id: 'electrician', group: 'make', de: 'Elektriker/in', en: 'Electrician' },
  { id: 'plumber', group: 'make', de: 'Anlagenmechaniker/in Sanitär', en: 'Plumber' },
  { id: 'carpenter', group: 'make', de: 'Schreiner/in', en: 'Carpenter' },
  { id: 'painter', group: 'make', de: 'Maler/in und Lackierer/in', en: 'Painter' },
  { id: 'roofer', group: 'make', de: 'Dachdecker/in', en: 'Roofer' },
  { id: 'mason', group: 'make', de: 'Maurer/in', en: 'Bricklayer' },
  { id: 'auto', group: 'make', de: 'Kfz-Mechatroniker/in', en: 'Automotive technician' },
  { id: 'mechanic', group: 'make', de: 'Industriemechaniker/in', en: 'Industrial mechanic' },
  { id: 'welder', group: 'make', de: 'Schweißer/in', en: 'Welder' },
  { id: 'cnc', group: 'make', de: 'Maschinenbedienung', en: 'Machine operator' },
  { id: 'production', group: 'make', de: 'Produktion', en: 'Production work' },
  { id: 'quality', group: 'make', de: 'Qualitätsprüfung', en: 'Quality inspection' },
  { id: 'warehouse-tech', group: 'make', de: 'Mechatronik', en: 'Mechatronics' },

  { id: 'nurse', group: 'care', de: 'Pflegefachkraft', en: 'Nurse' },
  { id: 'elder', group: 'care', de: 'Altenpflege', en: 'Elder care' },
  { id: 'ambulant', group: 'care', de: 'Ambulante Pflege', en: 'Home care' },
  { id: 'mfa', group: 'care', de: 'Medizinische Fachangestellte', en: 'Medical assistant' },
  { id: 'doctor', group: 'care', de: 'Arzt / Ärztin', en: 'Doctor' },
  { id: 'physio', group: 'care', de: 'Physiotherapie', en: 'Physiotherapy' },
  { id: 'dental', group: 'care', de: 'Zahnmedizin', en: 'Dental work' },
  { id: 'midwife', group: 'care', de: 'Hebamme', en: 'Midwife' },
  { id: 'pharmacy', group: 'care', de: 'Pharmazie', en: 'Pharmacy' },
  { id: 'social', group: 'care', de: 'Sozialarbeit', en: 'Social work' },
  { id: 'childcare', group: 'care', de: 'Erzieher/in', en: 'Childcare worker' },
  { id: 'psych', group: 'care', de: 'Psychologie', en: 'Psychology' },

  { id: 'teacher', group: 'teach', de: 'Lehrkraft', en: 'Teacher' },
  { id: 'tutor', group: 'teach', de: 'Nachhilfe', en: 'Tutor' },
  { id: 'trainer-voc', group: 'teach', de: 'Ausbilder/in', en: 'Vocational trainer' },
  { id: 'research', group: 'teach', de: 'Forschung', en: 'Research' },
  { id: 'uni', group: 'teach', de: 'Hochschule', en: 'Higher education' },
  { id: 'library', group: 'teach', de: 'Bibliothek', en: 'Library' },

  { id: 'software', group: 'tech', de: 'Softwareentwickler/in', en: 'Software developer' },
  { id: 'web', group: 'tech', de: 'Webentwicklung', en: 'Web development' },
  { id: 'it-support', group: 'tech', de: 'IT-Support', en: 'IT support' },
  { id: 'sysadmin', group: 'tech', de: 'Systemadministration', en: 'System administration' },
  { id: 'data', group: 'tech', de: 'Datenanalyse', en: 'Data analysis' },
  { id: 'product', group: 'tech', de: 'Produktmanagement', en: 'Product management' },
  { id: 'security-it', group: 'tech', de: 'IT-Sicherheit', en: 'IT security' },
  { id: 'ux', group: 'tech', de: 'UX / Design', en: 'UX / design' },

  { id: 'office', group: 'office', de: 'Bürokaufleute', en: 'Office clerk' },
  { id: 'assistant', group: 'office', de: 'Assistenz', en: 'Assistant' },
  { id: 'clerk', group: 'office', de: 'Sachbearbeitung', en: 'Case worker' },
  { id: 'hr', group: 'office', de: 'Personal / HR', en: 'People / HR' },
  { id: 'legal', group: 'office', de: 'Recht / Kanzlei', en: 'Law' },
  { id: 'tax', group: 'office', de: 'Steuerberatung', en: 'Tax advice' },
  { id: 'accounting', group: 'office', de: 'Buchhaltung', en: 'Bookkeeping' },
  { id: 'payroll', group: 'office', de: 'Entgeltabrechnung', en: 'Payroll' },

  { id: 'retail', group: 'shop', de: 'Einzelhandel', en: 'Retail' },
  { id: 'sales', group: 'shop', de: 'Verkauf', en: 'Sales' },
  { id: 'customer', group: 'shop', de: 'Kundenservice', en: 'Customer service' },
  { id: 'callcenter', group: 'shop', de: 'Callcenter', en: 'Call centre' },
  { id: 'ecommerce', group: 'shop', de: 'E-Commerce', en: 'E-commerce' },
  { id: 'cashier', group: 'shop', de: 'Kasse', en: 'Cashier' },

  { id: 'cook', group: 'food', de: 'Köchin / Koch', en: 'Cook' },
  { id: 'service', group: 'food', de: 'Servicekraft', en: 'Waiting staff' },
  { id: 'barista', group: 'food', de: 'Barista', en: 'Barista' },
  { id: 'hotel', group: 'food', de: 'Hotelfach', en: 'Hotel work' },
  { id: 'reception', group: 'food', de: 'Rezeption', en: 'Reception' },
  { id: 'tourism', group: 'food', de: 'Tourismus', en: 'Tourism' },
  { id: 'kitchen', group: 'food', de: 'Küchenhilfe', en: 'Kitchen help' },

  { id: 'driver', group: 'move', de: 'Berufskraftfahrer/in', en: 'Professional driver' },
  { id: 'courier', group: 'move', de: 'Kurier', en: 'Courier' },
  { id: 'logistics', group: 'move', de: 'Spedition', en: 'Freight forwarding' },
  { id: 'warehouse', group: 'move', de: 'Lager und Kommissionierung', en: 'Warehouse and picking' },
  { id: 'transit', group: 'move', de: 'ÖPNV', en: 'Public transport' },
  { id: 'security', group: 'move', de: 'Sicherheitsdienst', en: 'Security work' },
  { id: 'dispatch', group: 'move', de: 'Disposition', en: 'Dispatch' },

  { id: 'cleaning', group: 'home', de: 'Reinigung', en: 'Cleaning' },
  { id: 'facility', group: 'home', de: 'Gebäudeservice', en: 'Facility service' },
  { id: 'household', group: 'home', de: 'Haushaltshilfe', en: 'Household help' },
  { id: 'care-home', group: 'home', de: 'Alltagsbegleitung', en: 'Everyday companion' },
  { id: 'janitor', group: 'home', de: 'Hausmeisterei', en: 'Caretaker' },

  { id: 'marketing', group: 'media', de: 'Marketing', en: 'Marketing' },
  { id: 'copy', group: 'media', de: 'Text', en: 'Copywriting' },
  { id: 'graphic', group: 'media', de: 'Grafik', en: 'Graphic design' },
  { id: 'photo', group: 'media', de: 'Foto / Video', en: 'Photo / video' },
  { id: 'journalism', group: 'media', de: 'Journalismus', en: 'Journalism' },
  { id: 'translate', group: 'media', de: 'Übersetzung', en: 'Translation' },
  { id: 'social-media', group: 'media', de: 'Social Media', en: 'Social media' },

  { id: 'consulting', group: 'money', de: 'Unternehmensberatung', en: 'Consulting' },
  { id: 'project', group: 'money', de: 'Projektleitung', en: 'Project lead' },
  { id: 'finance', group: 'money', de: 'Finanzen', en: 'Finance' },
  { id: 'insurance', group: 'money', de: 'Versicherung', en: 'Insurance' },
  { id: 'property', group: 'money', de: 'Immobilien', en: 'Property' },
  { id: 'banking', group: 'money', de: 'Bank', en: 'Banking' },

  { id: 'civil', group: 'public', de: 'Öffentlicher Dienst', en: 'Civil service' },
  { id: 'ngo', group: 'public', de: 'Verein und Organisation', en: 'Association / NGO' },
  { id: 'admin-public', group: 'public', de: 'Verwaltung', en: 'Public administration' },

  { id: 'event-logistics', group: 'event', de: 'Logistik / Fahrer', en: 'Event logistics / driver' },
  { id: 'licht', group: 'event', de: 'Lichttechnik', en: 'Lighting' },
  { id: 'ton', group: 'event', de: 'Tontechnik', en: 'Sound' },
  { id: 'rigging', group: 'event', de: 'Rigging', en: 'Rigging' },
  { id: 'video', group: 'event', de: 'Video / LED', en: 'Video / LED' },
  { id: 'stage', group: 'event', de: 'Stage / Bühne', en: 'Stage' },
  { id: 'power', group: 'event', de: 'Strom / Generator', en: 'Power / generator' },
  { id: 'deko', group: 'event', de: 'Dekoration', en: 'Decoration' },
  { id: 'catering', group: 'event', de: 'Catering Support', en: 'Catering support' },
  { id: 'event-security', group: 'event', de: 'Security', en: 'Event security' },
  { id: 'camera', group: 'event', de: 'Kameratechnik', en: 'Camera' },
  { id: 'pyro', group: 'event', de: 'Pyrotechnik', en: 'Pyrotechnics' },
  { id: 'media-server', group: 'event', de: 'Medienserver', en: 'Media server' },
  { id: 'foh', group: 'event', de: 'FOH / Systemtech', en: 'FOH / systems' },
  { id: 'music', group: 'event', de: 'Musik', en: 'Music' },
  { id: 'sport', group: 'event', de: 'Sport und Training', en: 'Sport and coaching' },
  { id: 'culture', group: 'event', de: 'Kulturarbeit', en: 'Cultural work' },
]

const byDe = new Map(OCCUPATIONS.map((job) => [job.de, job]))

export function occupationByLabel(label: string): Occupation | undefined {
  return byDe.get(label)
}

export function occupationText(job: Occupation, locale: 'de' | 'en'): string {
  return locale === 'de' ? job.de : job.en
}

export function groupText(groupId: OccupationGroupId, locale: 'de' | 'en'): string {
  const group = OCCUPATION_GROUPS.find((item) => item.id === groupId)
  if (!group) return groupId
  return locale === 'de' ? group.de : group.en
}

export function occupationsInGroup(groupId: OccupationGroupId): Occupation[] {
  return OCCUPATIONS.filter((job) => job.group === groupId)
}

/** True when every listed label sits in the event group — the old public picker. */
export function labelsAreEventOnly(labels: string[]): boolean {
  if (labels.length === 0) return false
  return labels.every((label) => byDe.get(label)?.group === 'event')
}
