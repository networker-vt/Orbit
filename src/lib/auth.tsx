import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { DEMO_USER_ID, seedProfiles } from '../data/seed'
import { store } from './store'
import type { AuthUser, Profile, Role } from '../types'
import { uid } from './utils'
import { consumePendingReferral } from './referral'
import { isSupabaseConfigured, supabase } from './supabase'
import { markDemoPhoneVerified, markEmailVerified } from './verify'
import { hydrateCreditsLedger } from './credits'
import {
  clearAppUnlock,
  hasLocalPassword,
  isTotpEnabled,
  markAppUnlocked,
  setUserPassword,
  verifySecondFactor,
  verifyUserPassword,
} from './accountSecurity'

const AUTH_KEY = 'el_auth_user'
const MAGIC_PENDING_KEY = 'orbit_magic_pending_v1'

interface AuthContextValue {
  user: AuthUser | null
  profile: Profile | null
  loading: boolean
  authBackend: 'supabase' | 'demo'
  magicPending: string | null
  loginDemo: (profileId?: string) => void
  login: (email: string, name: string, role: Role) => void
  register: (email: string, name: string, role: Role, city: string) => Profile
  requestMagicLink: (email: string, name?: string) => Promise<{ ok: boolean; backend: 'supabase' | 'demo' }>
  confirmDemoMagic: () => void
  loginWithPassword: (
    email: string,
    password: string,
  ) => Promise<{ ok: boolean; needsTotp?: boolean; reason?: 'unknown' | 'wrong' }>
  completePasswordLoginWithTotp: (code: string) => boolean
  registerWithPassword: (
    email: string,
    name: string,
    role: Role,
    city: string,
    password: string,
  ) => Promise<{ ok: boolean; reason?: 'weak' }>
  pendingTotpUserId: string | null
  logout: () => void
  updateProfile: (patch: Partial<Profile>) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadStored(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

function profileFromUser(stored: AuthUser): Profile {
  return (
    store.getProfile(stored.id) ??
    seedProfiles.find((x) => x.id === stored.id) ??
    ({
      id: stored.id,
      name: stored.name,
      email: stored.email,
      role: stored.role,
      city: 'Berlin',
      bio: '',
      crafts: [],
      verified: 'email',
      rating: 5,
      reviewCount: 0,
      createdAt: new Date().toISOString(),
    } satisfies Profile)
  )
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [pendingTotpUserId, setPendingTotpUserId] = useState<string | null>(null)
  const [magicPending, setMagicPending] = useState<string | null>(() => {
    try {
      return localStorage.getItem(MAGIC_PENDING_KEY)
    } catch {
      return null
    }
  })
  const authBackend: 'supabase' | 'demo' = isSupabaseConfigured && supabase ? 'supabase' : 'demo'

  const persist = useCallback((u: AuthUser | null, p: Profile | null) => {
    setUser(u)
    setProfile(p)
    if (u) localStorage.setItem(AUTH_KEY, JSON.stringify(u))
    else localStorage.removeItem(AUTH_KEY)
    if (u) {
      markEmailVerified()
      void hydrateCreditsLedger(u.id)
    }
  }, [])

  useEffect(() => {
    let unsub: (() => void) | undefined
    const boot = async () => {
      if (supabase) {
        const { data } = await supabase.auth.getSession()
        const sessionUser = data.session?.user
        if (sessionUser?.email) {
          const id = sessionUser.id
          const name =
            (sessionUser.user_metadata?.name as string | undefined) ||
            sessionUser.email.split('@')[0]
          const existing = store.getProfile(id)
          const p: Profile = existing ?? {
            id,
            name,
            email: sessionUser.email,
            role: 'freelancer',
            city: 'Berlin',
            bio: '',
            crafts: [],
            verified: 'email',
            rating: 5,
            reviewCount: 0,
            createdAt: new Date().toISOString(),
          }
          store.upsertProfile(p)
          persist({ id, email: p.email, name: p.name, role: p.role }, p)
          setLoading(false)
          return
        }
        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
          const su = session?.user
          if (!su?.email) return
          const id = su.id
          const name = (su.user_metadata?.name as string | undefined) || su.email.split('@')[0]
          const existing = store.getProfile(id)
          const p: Profile = existing ?? {
            id,
            name,
            email: su.email,
            role: 'freelancer',
            city: 'Berlin',
            bio: '',
            crafts: [],
            verified: 'email',
            rating: 5,
            reviewCount: 0,
            createdAt: new Date().toISOString(),
          }
          store.upsertProfile(p)
          persist({ id, email: p.email, name: p.name, role: p.role }, p)
          consumePendingReferral(id)
          void import('./rewards').then((m) => m.grantWelcomeOnSignup()).catch(() => undefined)
        })
        unsub = () => listener.subscription.unsubscribe()
      }
      const stored = loadStored()
      if (stored) persist(stored, profileFromUser(stored))
      setLoading(false)
    }
    void boot()
    return () => unsub?.()
  }, [persist])

  const loginDemo = useCallback(
    (profileId?: string) => {
      const id = typeof profileId === 'string' ? profileId : undefined
      const p =
        seedProfiles.find((x) => x.id === id) ?? seedProfiles.find((x) => x.id === DEMO_USER_ID)!
      store.upsertProfile(p)
      persist({ id: p.id, email: p.email, name: p.name, role: p.role }, p)
      consumePendingReferral(p.id)
      markDemoPhoneVerified()
      void import('./rewards').then((m) => m.grantWelcomeOnSignup()).catch(() => undefined)
    },
    [persist],
  )

  const login = useCallback(
    (email: string, name: string, role: Role) => {
      const existing = seedProfiles.find((x) => x.email === email)
      if (existing) {
        persist(
          {
            id: existing.id,
            email: existing.email,
            name: existing.name,
            role: existing.role,
          },
          existing,
        )
        return
      }
      const id = uid('user')
      const p: Profile = {
        id,
        name,
        email,
        role,
        city: 'Berlin',
        bio: '',
        crafts: [],
        verified: 'email',
        rating: 5,
        reviewCount: 0,
        createdAt: new Date().toISOString(),
      }
      store.upsertProfile(p)
      persist({ id, email, name, role }, p)
      consumePendingReferral(id)
      void import('./rewards').then((m) => m.grantWelcomeOnSignup()).catch(() => undefined)
    },
    [persist],
  )

  const register = useCallback(
    (email: string, name: string, role: Role, city: string) => {
      const id = uid('user')
      const p: Profile = {
        id,
        name,
        email,
        role,
        city,
        bio: '',
        crafts: [],
        verified: 'email',
        rating: 5,
        reviewCount: 0,
        createdAt: new Date().toISOString(),
      }
      store.upsertProfile(p)
      persist({ id, email, name, role }, p)
      consumePendingReferral(id)
      void import('./rewards').then((m) => m.grantWelcomeOnSignup()).catch(() => undefined)
      return p
    },
    [persist],
  )

  const requestMagicLink = useCallback(
    async (email: string, name?: string): Promise<{ ok: boolean; backend: 'supabase' | 'demo' }> => {
      const trimmed = email.trim()
      if (!trimmed) return { ok: false, backend: authBackend }
      localStorage.setItem(MAGIC_PENDING_KEY, trimmed)
      if (name) localStorage.setItem(`${MAGIC_PENDING_KEY}_name`, name)
      setMagicPending(trimmed)
      if (supabase) {
        const redirect =
          import.meta.env.VITE_APP_URL ||
          (typeof window !== 'undefined' ? window.location.origin + import.meta.env.BASE_URL : undefined)
        const { error } = await supabase.auth.signInWithOtp({
          email: trimmed,
          options: { emailRedirectTo: redirect, data: { name: name || trimmed.split('@')[0] } },
        })
        if (error) {
          console.info('[orbit] magic link supabase skip:', error.message)
          return { ok: true, backend: 'demo' }
        }
        return { ok: true, backend: 'supabase' }
      }
      return { ok: true, backend: 'demo' }
    },
    [authBackend],
  )

  const confirmDemoMagic = useCallback(() => {
    const email = magicPending || localStorage.getItem(MAGIC_PENDING_KEY)
    if (!email) return
    const name = localStorage.getItem(`${MAGIC_PENDING_KEY}_name`) || email.split('@')[0]
    localStorage.removeItem(MAGIC_PENDING_KEY)
    localStorage.removeItem(`${MAGIC_PENDING_KEY}_name`)
    setMagicPending(null)
    login(email, name, 'freelancer')
  }, [login, magicPending])

  const finishLogin = useCallback(
    (p: Profile) => {
      persist({ id: p.id, email: p.email, name: p.name, role: p.role }, p)
      consumePendingReferral(p.id)
      void import('./rewards').then((m) => m.grantWelcomeOnSignup()).catch(() => undefined)
      if (hasLocalPassword(p.id)) markAppUnlocked(p.id)
    },
    [persist],
  )

  const loginWithPassword = useCallback(
    async (email: string, password: string) => {
      const trimmed = email.trim().toLowerCase()
      const profile = store.listProfiles().find((p) => p.email.trim().toLowerCase() === trimmed)
      if (!profile || !hasLocalPassword(profile.id)) return { ok: false, reason: 'unknown' as const }
      if (!(await verifyUserPassword(profile.id, password))) return { ok: false, reason: 'wrong' as const }
      if (isTotpEnabled(profile.id)) {
        setPendingTotpUserId(profile.id)
        return { ok: true, needsTotp: true }
      }
      finishLogin(profile)
      return { ok: true, needsTotp: false }
    },
    [finishLogin],
  )

  const completePasswordLoginWithTotp = useCallback(
    (code: string) => {
      if (!pendingTotpUserId) return false
      if (!verifySecondFactor(pendingTotpUserId, code)) return false
      const profile = store.getProfile(pendingTotpUserId)
      if (!profile) return false
      setPendingTotpUserId(null)
      finishLogin(profile)
      return true
    },
    [finishLogin, pendingTotpUserId],
  )

  const registerWithPassword = useCallback(
    async (email: string, name: string, role: Role, city: string, password: string) => {
      const p = register(email, name, role, city)
      const res = await setUserPassword(p.id, password)
      if (!res.ok) return { ok: false, reason: 'weak' as const }
      markAppUnlocked(p.id)
      return { ok: true }
    },
    [register],
  )

  const logout = useCallback(() => {
    setPendingTotpUserId(null)
    clearAppUnlock()
    persist(null, null)
    if (supabase) void supabase.auth.signOut()
  }, [persist])

  const updateProfile = useCallback(
    (patch: Partial<Profile>) => {
      if (!profile || !user) return
      const next = { ...profile, ...patch }
      store.upsertProfile(next)
      setProfile(next)
      persist({ ...user, name: next.name, email: next.email, role: next.role }, next)
    },
    [persist, profile, user],
  )

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      authBackend,
      magicPending,
      loginDemo,
      login,
      register,
      requestMagicLink,
      confirmDemoMagic,
      loginWithPassword,
      completePasswordLoginWithTotp,
      registerWithPassword,
      pendingTotpUserId,
      logout,
      updateProfile,
    }),
    [
      user,
      profile,
      loading,
      authBackend,
      magicPending,
      pendingTotpUserId,
      loginDemo,
      login,
      register,
      requestMagicLink,
      confirmDemoMagic,
      loginWithPassword,
      completePasswordLoginWithTotp,
      registerWithPassword,
      logout,
      updateProfile,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
