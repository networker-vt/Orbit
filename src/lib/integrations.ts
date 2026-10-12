const KEY = 'el_integrations_v1'
const EVT = 'el-integrations-changed'

export type IntegrationStatus = 'connected' | 'disconnected' | 'linkout' | 'soon'
export type SyncDir = 'in' | 'out' | 'both' | 'none'

export interface IntegrationDef {
  id: string
  name: string
  vendor: string
  blurb: string
  docs: string
  connect: 'oauth' | 'apikey' | 'linkout' | 'waitlist'
  availability: 'demo' | 'linkout' | 'planned'
  sync: { projects: SyncDir; jobs: SyncDir; crew: SyncDir }
  notes: string
}

export const INTEGRATIONS: IntegrationDef[] = [
  {
    id: 'easyjob',
    name: 'easyjob',
    vendor: 'Protonic Software',
    blurb: 'Event-ERP: Projekte, Artikel, Personal. WebAPI-Stub.',
    docs: 'https://www.protonic-software.com/de/easyjob/',
    connect: 'apikey',
    availability: 'demo',
    sync: { projects: 'both', jobs: 'in', crew: 'both' },
    notes: 'Projekte/Jobs/Crew bidirektional geplant. Mock-Connect, kein echter API-Key.',
  },
  {
    id: 'eventworx',
    name: 'EP Rent / Eventworx',
    vendor: 'Eventworx',
    blurb: 'Rental & Disposition — relevant für Material/Transport.',
    docs: 'https://www.eventworx.biz/',
    connect: 'apikey',
    availability: 'demo',
    sync: { projects: 'in', jobs: 'none', crew: 'none' },
    notes: 'Projekte/Artikel inbound. Crew nicht im Kernumfang.',
  },
  {
    id: 'crewbrain',
    name: 'Crewbrain',
    vendor: 'Crewbrain',
    blurb: 'Crew-Scheduling, API v2 — Personal & Schichten.',
    docs: 'https://www.crewbrain.com/',
    connect: 'oauth',
    availability: 'demo',
    sync: { projects: 'in', jobs: 'both', crew: 'both' },
    notes: 'OAuth-Stub. Jobs & Crew two-way, Projekte inbound.',
  },
  {
    id: 'rentman',
    name: 'Rentman',
    vendor: 'Rentman',
    blurb: 'Rental-ERP, weit verbreitet in EU-Technikfirmen.',
    docs: 'https://rentman.io/',
    connect: 'oauth',
    availability: 'demo',
    sync: { projects: 'both', jobs: 'in', crew: 'in' },
    notes: 'Projekte both, Crew/Jobs inbound. Mock.',
  },
  {
    id: 'intellievent',
    name: 'IntelliEvent',
    vendor: 'IntelliEvent',
    blurb: 'Event- & Gäste-Ops — ergänzend, kein Kern-ERP.',
    docs: 'https://www.intellievent.com/',
    connect: 'apikey',
    availability: 'planned',
    sync: { projects: 'in', jobs: 'none', crew: 'none' },
    notes: 'Geplant. Karte sichtbar, Connect disabled.',
  },
  {
    id: 'currentrms',
    name: 'Current RMS',
    vendor: 'Current RMS',
    blurb: 'Internationales Rental-OS, ähnlich Rentman.',
    docs: 'https://www.current-rms.com/',
    connect: 'apikey',
    availability: 'planned',
    sync: { projects: 'in', jobs: 'none', crew: 'none' },
    notes: 'Geplant für international tätige Häuser.',
  },
  {
    id: 'disguise',
    name: 'Disguise',
    vendor: 'Disguise',
    blurb: 'Media-Server / Playback — kein ERP, Link-out.',
    docs: 'https://www.disguise.one/',
    connect: 'linkout',
    availability: 'linkout',
    sync: { projects: 'none', jobs: 'none', crew: 'none' },
    notes: 'Kein Datensync. Doku/Community außerhalb von Allda.',
  },
]

export interface IntegrationState {
  connected: Record<string, { at: string; mode: string }>
}

function defaultState(): IntegrationState {
  return { connected: {} }
}

function load(): IntegrationState {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as IntegrationState) : defaultState()
  } catch {
    return defaultState()
  }
}

let cache: IntegrationState | null = null

function get(): IntegrationState {
  if (!cache) cache = load()
  return cache
}

function commit(next: IntegrationState) {
  cache = next
  localStorage.setItem(KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent(EVT))
}

export function subscribeIntegrations(cb: () => void) {
  const h = () => cb()
  window.addEventListener(EVT, h)
  window.addEventListener('storage', h)
  return () => {
    window.removeEventListener(EVT, h)
    window.removeEventListener('storage', h)
  }
}

export function getIntegrationState(): IntegrationState {
  return structuredClone(get())
}

export function isConnected(id: string) {
  return Boolean(get().connected[id])
}

export function mockConnect(id: string) {
  const def = INTEGRATIONS.find((i) => i.id === id)
  if (!def || def.connect === 'linkout' || def.availability === 'planned') return
  const next = structuredClone(get())
  next.connected[id] = { at: new Date().toISOString(), mode: def.connect }
  commit(next)
}

export function mockDisconnect(id: string) {
  const next = structuredClone(get())
  delete next.connected[id]
  commit(next)
}

export function syncLabel(d: SyncDir) {
  if (d === 'both') return '↔ beide'
  if (d === 'in') return '→ Allda'
  if (d === 'out') return '← Zielsystem'
  return '—'
}
