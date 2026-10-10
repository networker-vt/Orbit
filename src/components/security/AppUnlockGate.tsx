import { useEffect, useState, type ReactNode } from 'react'
import { Fingerprint, ScanFace } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import {
  hasLocalPassword,
  isAppUnlocked,
  isBiometricUnlockEnabled,
  markAppUnlocked,
  subscribeAccountSecurity,
  verifyBiometricUnlockToken,
  verifyUserPassword,
} from '../../lib/accountSecurity'
import { probeBiometricAvailability, unlockWithBiometric } from '../../lib/biometricUnlock'
import { useAuth } from '../../lib/auth'
import { useI18n } from '../../lib/i18n'

export function AppUnlockGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const [, bump] = useState(0)

  useEffect(() => subscribeAccountSecurity(() => bump((n) => n + 1)), [])

  if (loading || !user) return children
  if (!hasLocalPassword(user.id) || isAppUnlocked(user.id)) return children

  return <UnlockScreen userId={user.id} />
}

function UnlockScreen({ userId }: { userId: string }) {
  const { t } = useI18n()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [bioKind, setBioKind] = useState<'face' | 'fingerprint' | 'none'>('none')
  const bioOn = isBiometricUnlockEnabled(userId)

  useEffect(() => {
    void probeBiometricAvailability().then((r) => {
      if (r.available && (r.kind === 'face' || r.kind === 'fingerprint')) setBioKind(r.kind)
    })
  }, [])

  const unlockOk = () => {
    markAppUnlocked(userId)
    setError(null)
  }

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (!(await verifyUserPassword(userId, password))) {
        setError(t('security.unlockWrong'))
        return
      }
      unlockOk()
    } finally {
      setBusy(false)
    }
  }

  const tryBiometric = async () => {
    setBusy(true)
    setError(null)
    try {
      const res = await unlockWithBiometric(t('security.biometricReason'))
      if (!res.ok || !res.token) {
        setError(t('security.biometricFailed'))
        return
      }
      if (!verifyBiometricUnlockToken(userId, res.token)) {
        setError(t('security.biometricFailed'))
        return
      }
      unlockOk()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-surface-2 p-6">
        <h1 className="text-xl font-bold">{t('security.unlockTitle')}</h1>
        <p className="text-sm text-muted">{t('security.unlockLead')}</p>
        {bioOn && bioKind !== 'none' && (
          <Button type="button" className="w-full" variant="secondary" disabled={busy} onClick={() => void tryBiometric()}>
            {bioKind === 'face' ? <ScanFace size={18} className="mr-2 inline" /> : <Fingerprint size={18} className="mr-2 inline" />}
            {bioKind === 'face' ? t('security.unlockFace') : t('security.unlockFinger')}
          </Button>
        )}
        <form onSubmit={(e) => void submitPassword(e)} className="space-y-3">
          <Input
            label={t('security.password')}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-sm text-rose-300">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy || !password}>
            {t('security.unlockSubmit')}
          </Button>
        </form>
        <p className="text-xs text-muted">{t('security.localOnlyHint')}</p>
      </div>
    </div>
  )
}
