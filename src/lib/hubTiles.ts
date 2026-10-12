/**
 * Allda 2.8.1 — Home discover vs Mein account tile catalogs.
 * Home never lists Mein / Social / Wallet (those live in bottom nav or Mein).
 * Each tile has a visible emoji (or optional thematic image).
 */
import type { HubTile, TileTone } from '../components/ui/TileGrid'
import { isFlagOn } from './flags'
import { isKidsMode, kidsHideTravel, kidsHideWallet, kidsMaySeeJobs } from './kids'
import { getWidgetTaps, type WidgetArea } from './widgetUsage'

export type HubSurface = 'discover' | 'account'

export type HubTileId =
  | 'abflug'
  | 'campus'
  | 'entdecker'
  | 'kabine'
  | 'firma'
  | 'crew'
  | 'marktplatz'
  | 'mehr'
  | 'wallet'
  | 'prefs'
  | 'verify'
  | 'create'
  | 'offer'
  | 'ideas'
  | 'channels'
  | 'profile'
  | 'language'
  | 'dashboard'
  | 'kids'
  | 'refer'
  | 'match'
  | 'jobs'
  | 'einstellung'
  | 'chat'

export type HubTileDef = {
  id: HubTileId
  to: string
  labelKey: string
  emoji: string
  image?: string
  tone: TileTone
  surface: HubSurface
  demo?: boolean
  hide?: (ctx: HubCtx) => boolean
}

export type HubCtx = {
  kids: boolean
  hideTravel: boolean
  hideWallet: boolean
}

export function hubCtx(): HubCtx {
  return {
    kids: isKidsMode(),
    hideTravel: kidsHideTravel(),
    hideWallet: kidsHideWallet(),
  }
}

/** Home „Mehr entdecken“ — destinations only. No Mein / Social / Wallet / Firma. */
export const HOME_DISCOVER_DEFS: HubTileDef[] = [
  { id: 'match', to: '/match', labelKey: 'nav.match', emoji: '🎯', tone: 'teal', surface: 'discover' },
  { id: 'abflug', to: '/abflug', labelKey: 'travel.nav', emoji: '✈️', tone: 'sky', surface: 'discover', hide: (c) => c.hideTravel },
  { id: 'kabine', to: '/kabine', labelKey: 'look.nav', emoji: '🪞', tone: 'rose', surface: 'discover', demo: true, hide: (c) => !isFlagOn('kabine') || c.kids },
  { id: 'dashboard', to: '/dashboard', labelKey: 'mein.dashboard', emoji: '📊', tone: 'sky', surface: 'discover' },
  { id: 'campus', to: '/campus', labelKey: 'campus.nav', emoji: '🎓', tone: 'indigo', surface: 'discover', hide: () => !isFlagOn('campus') },
  { id: 'entdecker', to: '/entdecker', labelKey: 'tile.entdecker', emoji: '🔎', tone: 'lime', surface: 'discover', demo: true, hide: () => !isFlagOn('entdecker') },
  { id: 'crew', to: '/crew', labelKey: 'nav.crew', emoji: '🤝', tone: 'amber', surface: 'discover', hide: (c) => c.kids },
  { id: 'mehr', to: '/mehr', labelKey: 'nav.mehr', emoji: '✨', tone: 'orange', surface: 'discover' },
]

/** Mehr page — fuller discover catalog. Still no Mein / Social / Wallet. Firma stays off Home only. */
export const MEHR_DISCOVER_DEFS: HubTileDef[] = [
  ...HOME_DISCOVER_DEFS.filter((d) => d.id !== 'mehr'),
  { id: 'firma', to: '/firma', labelKey: 'firma.nav', emoji: '🏢', tone: 'slate', surface: 'discover', hide: (c) => c.kids },
  { id: 'marktplatz', to: '/marktplatz', labelKey: 'mehr.market', emoji: '🛒', tone: 'teal', surface: 'discover' },
]

/**
 * Slim account catalog (Einstellung holds prefs/language/role/reminders).
 * Discover destinations stay off this grid — users pin them as Schnellzugriffe instead.
 */
export const MEIN_ACCOUNT_DEFS: HubTileDef[] = [
  { id: 'einstellung', to: '/einstellung', labelKey: 'einstellung.title', emoji: '⚙️', tone: 'amber', surface: 'account' },
  { id: 'wallet', to: '/wallet', labelKey: 'nav.wallet', emoji: '👛', tone: 'teal', surface: 'account', hide: (c) => c.hideWallet || !isFlagOn('credits') },
  { id: 'profile', to: '/profile', labelKey: 'nav.mein', emoji: '👤', tone: 'slate', surface: 'account' },
  { id: 'chat', to: '/social/chat', labelKey: 'chat.brand', emoji: '💬', tone: 'sky', surface: 'account', hide: (c) => c.kids },
  { id: 'create', to: '/listings/new', labelKey: 'nav.create', emoji: '➕', tone: 'slate', surface: 'account', hide: (c) => c.kids },
  { id: 'offer', to: '/listings/new?kind=offer', labelKey: 'mein.offer', emoji: '📣', tone: 'orange', surface: 'account', hide: (c) => c.kids },
  { id: 'kids', to: '/kids', labelKey: 'kids.title', emoji: '🧒', tone: 'orange', surface: 'account', hide: () => !isFlagOn('kids') },
  { id: 'refer', to: '/empfehlen', labelKey: 'mehr.refer', emoji: '🎁', tone: 'sky', surface: 'account', hide: (c) => c.hideWallet },
]

const FORBIDDEN_HOME = new Set(['/mein', '/social', '/wallet', '/social/chat'])
const FORBIDDEN_MEIN_DISCOVER = new Set(['/campus', '/entdecker', '/kabine', '/abflug', '/firma', '/crew', '/social'])

export function visibleDefs(defs: HubTileDef[], ctx: HubCtx): HubTileDef[] {
  return defs.filter((d) => !d.hide?.(ctx))
}

export function resolveHubTiles(
  defs: HubTileDef[],
  ctx: HubCtx,
  t: (key: string) => string,
  labelOverrides?: Partial<Record<HubTileId, string>>,
): HubTile[] {
  return visibleDefs(defs, ctx).map((d) => {
    const shareRefer = d.id === 'refer' && !isFlagOn('credits')
    return {
      id: d.id,
      to: d.to,
      label: labelOverrides?.[d.id] ?? (shareRefer ? t('mehr.referPlain') : t(d.labelKey)),
      emoji: shareRefer ? '↗' : d.emoji,
      icon: shareRefer ? ('share' as const) : undefined,
      image: d.image,
      tone: d.tone,
      demo: d.demo,
    }
  })
}

export function homeDiscoverTiles(t: (key: string) => string, ctx: HubCtx = hubCtx()): HubTile[] {
  return resolveHubTiles(HOME_DISCOVER_DEFS, ctx, t)
}

/**
 * Home links that can rise or fold. Default order pins Match / Abflug / Kabine / Dashboard.
 * Firma is intentionally absent from Home.
 */
export const HOME_ADAPTIVE_DEFS: HubTileDef[] = [
  { id: 'match', to: '/match', labelKey: 'nav.match', emoji: '🎯', tone: 'teal', surface: 'discover' },
  { id: 'abflug', to: '/abflug', labelKey: 'travel.nav', emoji: '✈️', tone: 'sky', surface: 'discover', hide: (c) => c.hideTravel },
  { id: 'kabine', to: '/kabine', labelKey: 'look.nav', emoji: '🪞', tone: 'rose', surface: 'discover', demo: true, hide: (c) => !isFlagOn('kabine') || c.kids },
  { id: 'dashboard', to: '/dashboard', labelKey: 'mein.dashboard', emoji: '📊', tone: 'sky', surface: 'discover' },
  { id: 'campus', to: '/campus', labelKey: 'campus.nav', emoji: '🎓', tone: 'indigo', surface: 'discover', hide: () => !isFlagOn('campus') },
  { id: 'entdecker', to: '/entdecker', labelKey: 'tile.entdecker', emoji: '🔎', tone: 'lime', surface: 'discover', demo: true, hide: () => !isFlagOn('entdecker') },
  { id: 'crew', to: '/crew', labelKey: 'nav.crew', emoji: '🤝', tone: 'amber', surface: 'discover', hide: (c) => c.kids },
  { id: 'marktplatz', to: '/marktplatz', labelKey: 'mehr.market', emoji: '🛒', tone: 'teal', surface: 'discover' },
  {
    id: 'jobs',
    to: '/jobs',
    labelKey: 'tile.jobs',
    emoji: '🧰',
    tone: 'slate',
    surface: 'discover',
    hide: (c) => c.kids && !kidsMaySeeJobs(),
  },
]

const ADAPTIVE_ORDER: WidgetArea[] = [
  'match',
  'abflug',
  'kabine',
  'dashboard',
  'campus',
  'entdecker',
  'crew',
  'marktplatz',
  'jobs',
]

/** Four primary Home discover tiles with larger icons (Match, Abflug, Kabine, Dashboard). */
export const HOME_PRIMARY_COUNT = 4

const HOME_PINNED_IDS: HubTileId[] = ['match', 'abflug', 'kabine', 'dashboard']

export function splitAdaptiveHome(
  ctx: HubCtx,
  counts: Record<string, number> | undefined,
  t: (key: string) => string,
): { primary: HubTile[]; folded: HubTile[] } {
  const taps: Record<string, number> = counts ?? getWidgetTaps()
  const visible = visibleDefs(HOME_ADAPTIVE_DEFS, ctx)
  const pinned = HOME_PINNED_IDS.map((id) => visible.find((d) => d.id === id)).filter(
    (d): d is HubTileDef => Boolean(d),
  )
  const rest = visible
    .filter((d) => !HOME_PINNED_IDS.includes(d.id))
    .sort((a, b) => {
      const diff = (taps[b.id] ?? 0) - (taps[a.id] ?? 0)
      if (diff !== 0) return diff
      const ia = ADAPTIVE_ORDER.indexOf(a.id as WidgetArea)
      const ib = ADAPTIVE_ORDER.indexOf(b.id as WidgetArea)
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib)
    })
  const primaryDefs = pinned.slice(0, HOME_PRIMARY_COUNT)
  const foldedDefs = [...pinned.slice(HOME_PRIMARY_COUNT), ...rest]
  return {
    primary: resolveHubTiles(primaryDefs, ctx, t),
    folded: resolveHubTiles(foldedDefs, ctx, t),
  }
}

export function mehrDiscoverTiles(t: (key: string) => string, ctx: HubCtx = hubCtx()): HubTile[] {
  return resolveHubTiles(MEHR_DISCOVER_DEFS, ctx, t)
}

export function meinAccountTiles(
  t: (key: string) => string,
  ctx: HubCtx = hubCtx(),
  labelOverrides?: Partial<Record<HubTileId, string>>,
): HubTile[] {
  return resolveHubTiles(MEIN_ACCOUNT_DEFS, ctx, t, labelOverrides)
}

export function tilePaths(tiles: { to: string }[]): string[] {
  return tiles.map((tile) => tile.to.split('?')[0].split('#')[0])
}

export function homeDiscoverHasAccountLinks(tiles: { to: string }[]): boolean {
  return tilePaths(tiles).some((path) => FORBIDDEN_HOME.has(path))
}

export function meinHasDiscoverLinks(tiles: { to: string }[]): boolean {
  return tilePaths(tiles).some((path) => FORBIDDEN_MEIN_DISCOVER.has(path))
}

export function everyTileHasEmoji(tiles: { emoji?: string }[]): boolean {
  return tiles.length > 0 && tiles.every((tile) => Boolean(tile.emoji && tile.emoji.trim()))
}
