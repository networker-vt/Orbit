import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Input'
import { CITIES, ROLE_LABELS } from '../data/constants'
import { confirmAdult } from '../lib/ageGate'
import { useAuth } from '../lib/auth'
import { EARLY_TESTER_GRANT, getSignupIdentity } from '../lib/credits'
import { isFlagOn } from '../lib/flags'
import { useI18n } from '../lib/i18n'
import type { Role } from '../types'

const ROLES = Object.keys(ROLE_LABELS).filter((r) => r !== 'admin') as Role[]

export function AuthPage() {
  const { t } = useI18n()
  const { login, register, loginDemo, user, requestMagicLink, confirmDemoMagic, magicPending, authBackend } =
    useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'magic' | 'register'>('magic')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<Role>('freelancer')
  const [city, setCity] = useState('Berlin')
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const [adult, setAdult] = useState(false)

  if (user) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-surface-2 p-6 text-center">
        <p className="text-lg font-semibold">
          {t('auth.signedIn')} {user.name}
        </p>
        <Button className="mt-4" onClick={() => navigate('/')}>
          {t('nav.home')}
        </Button>
      </div>
    )
  }

  const sendMagic = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adult) return
    confirmAdult()
    setBusy(true)
    try {
      const res = await requestMagicLink(email, name)
      setNote(res.backend === 'supabase' ? t('auth.magicSent') : t('auth.magicDemo'))
    } finally {
      setBusy(false)
    }
  }

  const submitRegister = (e: React.FormEvent) => {
    e.preventDefault()
    if (!adult) return
    confirmAdult()
    if (mode === 'register') {
      register(email, name, role, city)
      navigate('/')
      return
    }
    login(email || 'alex@example.invalid', name || 'Alex Müller', role)
    navigate('/')
  }

  return (
    <div className="mx-auto max-w-md space-y-5">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{t('auth.title')}</h1>
        <p className="mt-1 text-sm text-muted">{t('auth.lead')}</p>
        <p className="mt-1 text-xs text-muted">
          {authBackend === 'supabase' ? t('auth.backendLive') : t('auth.backendDemo')}
        </p>
        {isFlagOn('credits') && getSignupIdentity()?.earlyTester ? (
          <p className="mt-2 text-sm text-amber-200">
            Early Tester #{getSignupIdentity()?.ordinal} — {EARLY_TESTER_GRANT.toLocaleString('de-DE')} Credits
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted">{isFlagOn('credits') ? t('auth.welcomeHint') : t('auth.welcomePlain')}</p>
        )}
      </div>

      <form onSubmit={sendMagic} className="space-y-3 rounded-2xl border border-border bg-surface-2 p-5">
        <p className="text-sm font-semibold">{t('auth.magicTitle')}</p>
        <Input
          label={t('auth.email')}
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.invalid"
        />
        <Input
          label={t('auth.nameOptional')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Alex"
        />
        <Button type="submit" className="w-full" disabled={busy || !email.trim() || !adult}>
          {busy ? t('auth.sending') : t('auth.sendLink')}
        </Button>
        {note && <p className="text-xs text-amber-100">{note}</p>}
        {magicPending && (
          <Button type="button" variant="secondary" className="w-full" disabled={!adult} onClick={() => { if (!adult) return; confirmAdult(); confirmDemoMagic(); navigate('/') }}>
            {t('auth.openDemoLink')}
          </Button>
        )}
      </form>

      <div className="flex rounded-xl border border-border bg-surface-2 p-1">
        <button
          type="button"
          className={`flex-1 rounded-lg py-2 text-sm ${mode === 'magic' ? 'bg-cyan text-black font-semibold' : 'text-muted'}`}
          onClick={() => setMode('magic')}
        >
          {t('auth.magicTab')}
        </button>
        <button
          type="button"
          className={`flex-1 rounded-lg py-2 text-sm ${mode === 'register' ? 'bg-cyan text-black font-semibold' : 'text-muted'}`}
          onClick={() => setMode('register')}
        >
          {t('auth.registerTab')}
        </button>
      </div>

      {mode === 'register' && (
        <form onSubmit={submitRegister} className="space-y-3 rounded-2xl border border-border bg-surface-2 p-5">
          <Input label={t('auth.name')} required value={name} onChange={(e) => setName(e.target.value)} />
          <Input
            label={t('auth.email')}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Select label={t('role.label')} value={role} onChange={(e) => setRole(e.target.value as Role)}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </Select>
          <Select label={t('create.city')} value={city} onChange={(e) => setCity(e.target.value)}>
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Button type="submit" className="w-full" disabled={!adult}>
            {t('auth.createAccount')}
          </Button>
        </form>
      )}

      <Button
        variant="secondary"
        className="w-full"
        disabled={!adult}
        onClick={() => {
          if (!adult) return
          confirmAdult()
          loginDemo()
          navigate('/')
        }}
      >
        {t('auth.demoAgency')}
      </Button>
      <Button
        variant="ghost"
        className="w-full"
        disabled={!adult}
        onClick={() => {
          if (!adult) return
          confirmAdult()
          loginDemo('user-b2b-1')
          navigate('/firma')
        }}
      >
        {t('auth.demoFirm')}
      </Button>
      <label className="flex min-h-11 items-start gap-2 text-sm">
        <input type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} />
        <span>{t('auth.adult')}</span>
      </label>
      {!adult && <p className="text-sm text-amber-200">{t('auth.adultHint')}</p>}
      {isFlagOn('kids') && (
        <p className="text-xs text-muted">
          {t('auth.kidsNote')}{' '}
          <Link to="/kids" className="text-cyan">
            {t('kids.title')}
          </Link>
        </p>
      )}
      <p className="text-sm text-muted">
        {t('auth.acceptBefore')}
        <Link to="/agb" className="text-cyan">
          {t('auth.acceptAgb')}
        </Link>
        {t('auth.acceptMid')}
        <Link to="/privacy" className="text-cyan">
          {t('auth.acceptPrivacy')}
        </Link>
        .
      </p>
      <p className="text-center text-xs text-muted">{t('auth.footer')}</p>
    </div>
  )
}
