/**
 * Pinnable Schnellzugriffe catalog for Mein Allda.
 * Persistence lives in `homePins.ts` (`orbit_home_pins_v1`) — this file is UI catalog only.
 */
import { isFlagOn } from './flags'
import { hubCtx, type HubCtx } from './hubTiles'
import { kidsMaySeeJobs } from './kids'
import type { HomePin } from './homePins'

export type MeinPinOption = {
  id: string
  to: string
  labelKey: string
  emoji: string
  hide?: (ctx: HubCtx) => boolean
}

export const MEIN_PIN_OPTIONS: MeinPinOption[] = [
  {
    id: 'kabine',
    to: '/kabine',
    labelKey: 'look.nav',
    emoji: '🪞',
    hide: () => !isFlagOn('kabine'),
  },
  { id: 'parkmerke', to: '/parkmerke', labelKey: 'pin.parkmerke', emoji: '🅿️' },
  { id: 'social', to: '/social', labelKey: 'nav.social', emoji: '✨' },
  {
    id: 'jobs',
    to: '/jobs',
    labelKey: 'tile.jobs',
    emoji: '🧰',
    hide: (c) => c.kids && !kidsMaySeeJobs(),
  },
  { id: 'match', to: '/match', labelKey: 'nav.match', emoji: '🎯' },
  {
    id: 'abflug',
    to: '/abflug',
    labelKey: 'travel.nav',
    emoji: '✈️',
    hide: (c) => c.hideTravel,
  },
  {
    id: 'dashboard',
    to: '/dashboard',
    labelKey: 'mein.dashboard',
    emoji: '📊',
    hide: (c) => c.kids,
  },
]

export function visibleMeinPinOptions(ctx: HubCtx = hubCtx()): MeinPinOption[] {
  return MEIN_PIN_OPTIONS.filter((d) => !d.hide?.(ctx))
}

export function toHomePin(opt: MeinPinOption, t: (key: string) => string): HomePin {
  return {
    id: opt.id,
    to: opt.to,
    label: t(opt.labelKey),
    emoji: opt.emoji,
  }
}
