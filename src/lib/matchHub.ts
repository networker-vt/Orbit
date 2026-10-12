/**
 * Match hub — marketplace lanes live on /match (not scattered desks).
 * Vermittler-first; Credits = demo/boost only; no payroll.
 */
import type { Listing, MarketType } from '../types'
import { deriveMarketType } from './market'

/** Hub filter chips on Match. `all` = prefs-ranked mix. */
export type MatchHubLane = 'all' | MarketType

export const MATCH_HUB_LANES: MatchHubLane[] = [
  'all',
  'job',
  'minijob',
  'service',
  'courier',
  'ride',
  'barter',
  'sell',
]

export function parseMatchHubLane(raw: string | null | undefined): MatchHubLane {
  if (!raw) return 'all'
  if (raw === 'all') return 'all'
  if ((MATCH_HUB_LANES as string[]).includes(raw)) return raw as MatchHubLane
  return 'all'
}

export function listingMatchesHubLane(listing: Listing, lane: MatchHubLane): boolean {
  if (lane === 'all') return true
  return deriveMarketType(listing) === lane
}

export function createPathForHubLane(lane: MatchHubLane): string {
  if (lane === 'all') return '/listings/new'
  if (lane === 'job') return '/listings/new?intent=job'
  if (lane === 'minijob') return '/listings/new?intent=minijob'
  if (lane === 'service') return '/listings/new?intent=service'
  if (lane === 'courier') return '/listings/new?intent=courier'
  if (lane === 'ride') return '/listings/new?intent=ride'
  if (lane === 'sell') return '/match?lane=sell&photo=1&photoMode=sell'
  if (lane === 'barter') return '/match?lane=barter&photo=1&photoMode=barter'
  if (lane === 'partnership') return '/listings/new?intent=partnership'
  if (lane === 'b2b') return '/listings/new?intent=need&lane=b2b'
  if (lane === 'asset') return '/listings/new?intent=need&lane=asset'
  return '/listings/new'
}

/** Lane may be browsed on Match without occupation prefs (hub marketplace mode). */
export function hubLaneBypassesOccupation(lane: MatchHubLane): boolean {
  return lane !== 'all'
}

export type LaneLegalTone = 'info' | 'warn'

export interface LaneLegalNote {
  tone: LaneLegalTone
  de: string
  en: string
}

export function hubLaneLegalNote(lane: MatchHubLane): LaneLegalNote {
  switch (lane) {
    case 'minijob':
      return {
        tone: 'warn',
        de: 'Demo-Vermittlung: Allda meldet keinen Minijob an und zahlt keinen Lohn. SV/Steuer bleiben bei Auftraggeber und Beschäftigten. Kein Rechtsrat.',
        en: 'Demo brokerage: Allda does not register minijobs or pay wages. Social security/tax stay with employer and worker. Not legal advice.',
      }
    case 'courier':
      return {
        tone: 'info',
        de: 'Kurier = Sachen, keine Personen. Demo: Apply/Accept wie Jobs. Gewerbe/Versicherung später prüfen. Kein Rechtsrat.',
        en: 'Courier = goods, not people. Demo: apply/accept like jobs. Trade licence/insurance later. Not legal advice.',
      }
    case 'ride':
      return {
        tone: 'warn',
        de: 'Personenbeförderung (UX wie Ride-Hailing, keine Uber/Bolt-Marke). Live erst mit Schein/PBefG/Versicherung. Demo-Lane · kein Rechtsrat.',
        en: 'Passenger transport (ride-hailing-like UX, not Uber/Bolt branding). Live only with licence/PBefG/insurance. Demo lane · not legal advice.',
      }
    case 'sell':
      return {
        tone: 'info',
        de: 'Per Foto verkaufen: KI schlägt Titel/Zustand/Preis vor — du bestätigst immer vor Publish. Ohne Vision-API: Demo-Stub. Kein stilles Veröffentlichen.',
        en: 'Sell by photo: AI suggests title/condition/price — you always confirm before publish. Without vision API: demo stub. Never silent publish.',
      }
    case 'barter':
      return {
        tone: 'info',
        de: 'Per Foto tauschen (oder Text-Tausch): biete X / brauche Y oder „was bietest du?“. Natural + später Aufpreis; Escrow gated. Nie still publish. Credits ≠ Gegenwert.',
        en: 'Barter by photo (or text): offer X / need Y or “what do you offer?”. Natural + later top-up; escrow gated. Never silent publish. Credits ≠ value.',
      }
    case 'service':
      return {
        tone: 'info',
        de: 'Lokale Services: Allda vermittelt Kontakt. Leistung und Haftung beim Anbieter. Zahlung vorerst offline / Demo.',
        en: 'Local services: Allda connects people. Delivery and liability sit with the provider. Payment offline / demo for now.',
      }
    case 'job':
      return {
        tone: 'info',
        de: 'Job-Board: Interesse = Bewerbung (Demo). Allda ist nicht Arbeitgeber und ersetzt keinen Arbeitsvertrag.',
        en: 'Job board: interest = apply (demo). Allda is not the employer and does not replace a contract.',
      }
    default:
      return {
        tone: 'info',
        de: 'Match-Hub: Rubriken + per Foto verkaufen/tauschen. Allda vermittelt — kein Lohn, kein echtes EUR in-app, Credits nur Demo/Boost.',
        en: 'Match hub: rubrics + sell/barter by photo. Allda brokers — no wages, no real in-app EUR, Credits are demo/boost only.',
      }
  }
}

export function interestChecklist(lane: MarketType): { de: string[]; en: string[] } {
  switch (lane) {
    case 'minijob':
      return {
        de: [
          'Auftraggeber prüft Minijob-Meldung (nicht Allda).',
          'Kein Gewerbe nötig nur weil du dich bewirbst — Anstellung ≠ Selbstständigkeit.',
          'Allda Credits sind kein Lohnersatz.',
        ],
        en: [
          'Employer handles minijob registration (not Allda).',
          'Applying does not require a trade licence — employment ≠ self-employment.',
          'Allda Credits are not a wage substitute.',
        ],
      }
    case 'courier':
      return {
        de: ['Nur Lieferungen/Sachen — keine Fahrgäste.', 'Führerschein/Fahrzeug: Self-Declare in der Demo.', 'Zahlung offline, bis EUR live ist.'],
        en: ['Goods only — no passengers.', 'Licence/vehicle: self-declare in the demo.', 'Pay offline until EUR is live.'],
      }
    case 'ride':
      return {
        de: [
          'Personenbeförderungsschein / legale Konstruktion nötig für Live.',
          'Versicherungspflicht beachten (Demo zeigt nur Hinweis).',
          'Keine Uber/Bolt-Marke oder Assets.',
        ],
        en: [
          'Passenger licence / legal setup required for live.',
          'Insurance rules apply (demo shows a hint only).',
          'No Uber/Bolt branding or assets.',
        ],
      }
    case 'barter':
      return {
        de: [
          'Natural: X gegen Y ohne Pflicht-Geld.',
          'Hybrid-Aufpreis: Escrow später, jetzt nur Kennzeichnung.',
          'Privat vs. gewerblich kennzeichnen.',
        ],
        en: [
          'Natural: X for Y without required money.',
          'Hybrid top-up: escrow later; label only for now.',
          'Mark private vs commercial.',
        ],
      }
    case 'sell':
      return {
        de: [
          'Nur nach deiner Bestätigung veröffentlicht.',
          'Preis-Hinweis ist Vorschlag — du entscheidest.',
          'Zahlung offline / Demo; Credits sind kein Kaufpreis.',
        ],
        en: [
          'Published only after you confirm.',
          'Price hint is a suggestion — you decide.',
          'Payment offline / demo; Credits are not the purchase price.',
        ],
      }
    default:
      return {
        de: ['Allda vermittelt Kontakt.', 'Vertrag zwischen euch.', 'Kein echtes In-App-Geld in dieser Demo.'],
        en: ['Allda connects you.', 'Contract is between you.', 'No real in-app money in this demo.'],
      }
  }
}
