export type CourseFormat = 'online' | 'hybrid' | 'praesenz'

export interface FortbildungCourse {
  id: string
  title: string
  provider: string
  format: CourseFormat
  datesHint?: string
  url: string
  tags: string[]
  blurbDe: string
  source: string
}

/** Public course listings — outbound links only, no enrollment. */
export const fortbildungen: FortbildungCourse[] = [
  {
    id: 'fb-meister-eabb-2026',
    title: 'Meister/-in für Veranstaltungstechnik (IHK) — Hybrid',
    provider: 'Event-Akademie Baden-Baden',
    format: 'hybrid',
    datesHint: 'Start ca. 12.10.2026 – 03.09.2027 (Blöcke)',
    url: 'https://www.event-akademie.de/termine?id=2123',
    tags: ['Meister', 'IHK', 'VT', 'Führung'],
    blurbDe:
      'Vorbereitungslehrgang Bachelor Professional / Meister VT (IHK). Prüfung separat bei der IHK anmelden. Angaben laut öffentlicher Kursseite — ohne Gewähr.',
    source: 'event-akademie.de',
  },
  {
    id: 'fb-meister-vt-stage',
    title: 'Meister/-in für Veranstaltungstechnik (IHK) — Hybrid (Listing)',
    provider: 'Event-Akademie Baden-Baden (via vt-stage)',
    format: 'hybrid',
    datesHint: '12.10.2026 – 03.09.2027',
    url: 'https://vt-stage.com/weiterbildung/meister-in-fuer-veranstaltungstechnik-ihk-hybrid/',
    tags: ['Meister', 'IHK', 'VT'],
    blurbDe:
      'Öffentliche Kursbeschreibung mit Blockterminen. Immer Anbieterseite und IHK-Zulassung prüfen.',
    source: 'vt-stage.com',
  },
  {
    id: 'fb-meister-btrend',
    title: 'Meister/in für Veranstaltungstechnik (IHK)',
    provider: 'b-trend.academy',
    format: 'praesenz',
    datesHint: 'Berlin: u. a. ab 18.01.2027 (laut Anbieter)',
    url: 'https://b-trend.academy/seminare/meister-fuer-veranstaltungstechnik/',
    tags: ['Meister', 'IHK', 'VT'],
    blurbDe:
      'Berufsbegleitende Blöcke Richtung Meister VT. Termine und Gebühren auf der Anbieterseite prüfen.',
    source: 'b-trend.academy',
  },
  {
    id: 'fb-sqq1-btrend',
    title: 'SQQ1 Elektrofachkraft für Veranstaltungstechnik (+ mobile Stromerzeuger)',
    provider: 'b-trend.academy / igvw SQQ1',
    format: 'praesenz',
    datesHint: 'Berlin & München: 12.10.2026 – 18.12.2026 (laut Anbieter)',
    url: 'https://b-trend.academy/seminare/elektrofachkraft-fuer-veranstaltungstechnik-nach-sqq1/',
    tags: ['SQQ1', 'Elektro', 'igvw', 'Sicherheit'],
    blurbDe:
      'Qualifizierung nach igvw SQQ1 für den Einsatz als Elektrofachkraft VT inkl. Erweiterungsmodul mobile Stromerzeuger.',
    source: 'b-trend.academy',
  },
  {
    id: 'fb-sqq2-category',
    title: 'SQQ2 Rigging / Tragwerke (Kategorie)',
    provider: 'igvw-Standard · diverse Anbieter',
    format: 'praesenz',
    datesHint: 'Termine anbieterabhängig — öffentlich ausschreiben',
    url: 'https://www.vplt.org',
    tags: ['SQQ2', 'Rigging', 'igvw', 'Sicherheit'],
    blurbDe:
      'SQQ2 beschreibt Kompetenzen rund um Rigging/Tragwerke in der VT. Konkrete Lehrgänge bei zertifizierten Anbietern / über Verbandsseiten suchen — hier nur Kategorie-Hinweis.',
    source: 'igvw / VPLT context',
  },
  {
    id: 'fb-aevo',
    title: 'AEVO — Ausbildung der Ausbilder (AdA)',
    provider: 'IHK / diverse Anbieter',
    format: 'hybrid',
    datesHint: 'Laufend bundesweit',
    url: 'https://www.dihk.de',
    tags: ['AEVO', 'Ausbildung', 'IHK'],
    blurbDe:
      'Ausbildereignung (AEVO) ist relevant für Betriebe, die Fachkräfte VT ausbilden. Kurse über IHK und Bildungsanbieter — verwandte Qualifikation zur VT-Karriere.',
    source: 'DIHK / IHK öffentlich',
  },
  {
    id: 'fb-iffma',
    title: 'Fortbildungen Veranstaltungstechnik (IFFMA u. a.)',
    provider: 'IFFMA / Partner',
    format: 'praesenz',
    datesHint: 'siehe Anbieterkalender',
    url: 'https://www.iffma.de',
    tags: ['VT', 'Fortbildung', 'Meister-Kontext'],
    blurbDe:
      'Öffentliche Bildungsangebote im Umfeld Medien-/Veranstaltungstechnik. Immer aktuelle Termine auf der Anbieterseite prüfen.',
    source: 'iffma.de',
  },
  {
    id: 'fb-buehnenwerk',
    title: 'bühnenwerk — Fortbildung & Praxis VT',
    provider: 'bühnenwerk',
    format: 'praesenz',
    datesHint: 'siehe Kurskalender',
    url: 'https://www.buehnenwerk.de',
    tags: ['VT', 'Praxis', 'Fortbildung'],
    blurbDe:
      'Praxisnahe Angebote rund um Bühne und Veranstaltungstechnik. Outbound-Link, keine Buchung über Allda.',
    source: 'buehnenwerk.de',
  },
]

export const FORTBILDUNG_COUNT = fortbildungen.length
