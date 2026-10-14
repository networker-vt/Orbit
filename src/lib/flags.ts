/** Demo vs prod. Pages stay demo until VITE_APP_MODE=prod (alias: VITE_ORBIT_MODE). */
export type AppMode = 'demo' | 'prod'

function readMode(): AppMode {
  const raw = (
    import.meta.env.VITE_APP_MODE ||
    import.meta.env.VITE_ORBIT_MODE ||
    'demo'
  )
    .toString()
    .toLowerCase()
    .trim()
  return raw === 'prod' ? 'prod' : 'demo'
}

export const APP_MODE: AppMode = readMode()
export const ORBIT_MODE = APP_MODE
export const isDemo = APP_MODE !== 'prod'
export const isProd = APP_MODE === 'prod'
export const useMock = import.meta.env.VITE_USE_MOCK !== 'false'

/** Test override — never used in UI. Null = env `APP_MODE`. */
let testOverride: AppMode | null = null

/** Runtime mode (env, unless tests override). Ledger/credits must use this, not the module const. */
export function getAppMode(): AppMode {
  return testOverride ?? APP_MODE
}

export function isProdMode(): boolean {
  return getAppMode() === 'prod'
}

export function isDemoMode(): boolean {
  return getAppMode() !== 'prod'
}

export function __setAppModeForTests(mode: AppMode | null) {
  testOverride = mode
}

/**
 * Public-build feature flags. Risky surfaces default OFF.
 * Re-enable without deleting code: `VITE_FLAG_<NAME>=1` or, in dev only,
 * `localStorage.setItem('orbit_flag_<id>', '1')`.
 */
export const FEATURE_FLAG_DEFS = [
  {
    id: 'credits',
    default: false,
    reason: 'Credits, Wallet, 21M-Cap, Featured, P2P, Geschenke und Auszahlung können erlaubnispflichtig sein (ZAG, E-Geld, MiCA) und sammeln Bankdaten.',
  },
  {
    id: 'kids',
    default: false,
    reason: 'Marktplatz-Konten ab 18; Kids ist Eltern-PIN-Modus (Hash im localStorage), keine zertifizierte Kindersicherung.',
  },
  {
    id: 'channels',
    default: false,
    reason: 'Kanäle speichern nur ein Häkchen (Netflix, Steam, Meta, …) und tun so, als wäre etwas verbunden.',
  },
  {
    id: 'ideas',
    default: false,
    reason: 'Ideen-Box ist ein Demo-Stub ohne echte Bearbeitung.',
  },
  {
    id: 'integrations',
    default: false,
    reason: 'Integrationen verbinden nichts; Connect ist nur ein lokales Häkchen.',
  },
  {
    id: 'kabine',
    default: true,
    reason: 'Kabine / Look ist ein Demo-Stub (Anprobe ohne echte Wirkung) — auf Home wieder sichtbar, klar als Demo gekennzeichnet.',
  },
  {
    id: 'campus',
    default: false,
    reason: 'Campus ist ein Demo-Stub und kein echtes Lernangebot.',
  },
  {
    id: 'photoJobs',
    default: false,
    reason: 'Foto-Jobs werten Personenfotos nur mit einem Stub aus. Vorsicht Jugendschutz und Datenschutz.',
  },
  {
    id: 'verifyId',
    default: false,
    reason: 'Ausweis- und Telefon-Verifizierung ist ein Stub und keine echte Identitätsprüfung.',
  },
  {
    id: 'entdecker',
    default: false,
    reason: 'Entdecker erklärt Fotos nur als Demo und ist kein echtes Erkennen.',
  },
  {
    id: 'interview',
    default: false,
    reason: 'Interview-Räume sind ein lokaler Video- und Chat-Stub ohne echten Call.',
  },
  {
    id: 'publishListings',
    default: true,
    reason: 'Veröffentlichen bleibt an, weil Inhalt melden und die Kennzeichnung Privat/Gewerblich umgesetzt sind.',
  },
  {
    id: 'offerBeta',
    default: false,
    reason: 'Angebot & E-Rechnung ist eine Beta mit Mock-KI und lokalem Export — standardmäßig aus, bis Tester freigeschaltet sind.',
  },
] as const

export type FeatureFlag = (typeof FEATURE_FLAG_DEFS)[number]['id']

const FLAG_ENV: Record<FeatureFlag, string | undefined> = {
  credits: import.meta.env.VITE_FLAG_CREDITS,
  kids: import.meta.env.VITE_FLAG_KIDS,
  channels: import.meta.env.VITE_FLAG_CHANNELS,
  ideas: import.meta.env.VITE_FLAG_IDEAS,
  integrations: import.meta.env.VITE_FLAG_INTEGRATIONS,
  kabine: import.meta.env.VITE_FLAG_KABINE,
  campus: import.meta.env.VITE_FLAG_CAMPUS,
  photoJobs: import.meta.env.VITE_FLAG_PHOTO_JOBS,
  verifyId: import.meta.env.VITE_FLAG_VERIFY_ID,
  entdecker: import.meta.env.VITE_FLAG_ENTDECKER,
  interview: import.meta.env.VITE_FLAG_INTERVIEW,
  publishListings: import.meta.env.VITE_FLAG_PUBLISH_LISTINGS,
  offerBeta: import.meta.env.VITE_FLAG_OFFER_BETA,
}

const flagDefaults: Record<FeatureFlag, boolean> = Object.fromEntries(
  FEATURE_FLAG_DEFS.map((flag) => [flag.id, flag.default]),
) as Record<FeatureFlag, boolean>

const testFlags = new Map<FeatureFlag, boolean>()

function parseFlagEnv(raw: string | undefined): boolean | null {
  if (raw == null || raw === '') return null
  const value = raw.toString().trim().toLowerCase()
  if (value === '1' || value === 'true' || value === 'on') return true
  if (value === '0' || value === 'false' || value === 'off') return false
  return null
}

/** True when the public surface may show this feature. */
export function isFlagOn(flag: FeatureFlag): boolean {
  if (testFlags.has(flag)) return testFlags.get(flag) === true
  const fromEnv = parseFlagEnv(FLAG_ENV[flag])
  if (fromEnv != null) return fromEnv
  if (import.meta.env.DEV && import.meta.env.MODE !== 'test') {
    try {
      const stored = localStorage.getItem(`orbit_flag_${flag}`)
      if (stored === '1' || stored === 'true') return true
      if (stored === '0' || stored === 'false') return false
    } catch {
      /* ignore */
    }
  }
  return flagDefaults[flag]
}

export function flagReason(flag: FeatureFlag): string {
  return FEATURE_FLAG_DEFS.find((item) => item.id === flag)?.reason ?? ''
}

/** `null` clears every override. Omit `on` to clear one flag. */
export function __setFlagForTests(flag: FeatureFlag | null, on?: boolean) {
  if (flag == null) {
    testFlags.clear()
    return
  }
  if (on === undefined) testFlags.delete(flag)
  else testFlags.set(flag, on)
}
