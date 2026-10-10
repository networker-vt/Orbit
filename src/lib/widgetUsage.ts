const KEY = 'orbit_widget_taps_v1'
const LAST_KEY = 'orbit_widget_last_path'
const EVT = 'orbit-widget-taps'

/** Areas the Home discover links can promote or fold. */
export type WidgetArea =
  | 'abflug'
  | 'kabine'
  | 'match'
  | 'dashboard'
  | 'campus'
  | 'entdecker'
  | 'firma'
  | 'crew'
  | 'jobs'
  | 'marktplatz'

const AREAS = new Set<WidgetArea>([
  'abflug',
  'kabine',
  'match',
  'dashboard',
  'campus',
  'entdecker',
  'firma',
  'crew',
  'jobs',
  'marktplatz',
])

export function widgetIdForPath(pathname: string): WidgetArea | null {
  const path = pathname.split('?')[0].replace(/\/+$/, '') || '/'
  if (path === '/abflug' || path.startsWith('/abflug/') || path === '/reise' || path.startsWith('/reise/'))
    return 'abflug'
  if (path === '/kabine' || path.startsWith('/kabine/') || path === '/look' || path.startsWith('/look/'))
    return 'kabine'
  if (path === '/match' || path.startsWith('/match/')) return 'match'
  if (path === '/dashboard' || path.startsWith('/dashboard/')) return 'dashboard'
  if (path === '/essen' || path.startsWith('/essen/')) return 'match'
  if (path === '/campus' || path.startsWith('/campus/') || path === '/lernen') return 'campus'
  if (path === '/entdecker' || path.startsWith('/entdecker/')) return 'entdecker'
  if (path === '/firma' || path.startsWith('/firma/')) return 'firma'
  if (path === '/crew' || path.startsWith('/crew/')) return 'crew'
  if (path === '/jobs' || path.startsWith('/jobs/') || path === '/treffer' || path.startsWith('/treffer/') || path === '/foto')
    return 'jobs'
  if (path === '/marktplatz' || path.startsWith('/marktplatz/')) return 'marktplatz'
  return null
}

function emptyCounts(): Record<WidgetArea, number> {
  return {
    abflug: 0,
    kabine: 0,
    match: 0,
    dashboard: 0,
    campus: 0,
    entdecker: 0,
    firma: 0,
    crew: 0,
    jobs: 0,
    marktplatz: 0,
  }
}

function load(): Record<WidgetArea, number> {
  const base = emptyCounts()
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return base
    const parsed = JSON.parse(raw) as Record<string, number>
    for (const id of AREAS) {
      const n = parsed[id]
      if (typeof n === 'number' && Number.isFinite(n) && n > 0) base[id] = Math.floor(n)
    }
  } catch {
    /* ignore */
  }
  return base
}

let cache: Record<WidgetArea, number> | null = null

function get(): Record<WidgetArea, number> {
  if (!cache) cache = load()
  return cache
}

function commit(next: Record<WidgetArea, number>) {
  cache = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(EVT))
}

export function getWidgetTaps(): Record<WidgetArea, number> {
  return { ...get() }
}

export function recordWidgetTap(id: string) {
  if (!AREAS.has(id as WidgetArea)) return
  const area = id as WidgetArea
  const next = { ...get(), [area]: get()[area] + 1 }
  commit(next)
}

/** Count a navigation once per path, including React strict-mode replays. */
export function recordWidgetVisit(pathname: string) {
  try {
    if (sessionStorage.getItem(LAST_KEY) === pathname) return
    sessionStorage.setItem(LAST_KEY, pathname)
  } catch {
    /* private mode still counts */
  }
  const id = widgetIdForPath(pathname)
  if (id) recordWidgetTap(id)
}

export function subscribeWidgetTaps(cb: () => void) {
  const handler = () => cb()
  window.addEventListener(EVT, handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener(EVT, handler)
    window.removeEventListener('storage', handler)
  }
}

export function resetWidgetTaps() {
  commit(emptyCounts())
  try {
    sessionStorage.removeItem(LAST_KEY)
  } catch {
    /* ignore */
  }
}
