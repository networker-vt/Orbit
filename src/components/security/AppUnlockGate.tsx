import { useEffect, useState, type ReactNode } from 'react'
import { Fingerprint } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import {
  defaultBiometricPromptLabels,
  probeBiometricAvailability,
  type BiometricKind,
} from '../../lib/biometricUnlock'
import {
  deviceUnlockButtonKey,
} from '../../lib/deviceUnlockCopy'
import {
  deviceUnlockMode,
  hasLocalPassword,
  isAppUnlocked,
  isDeviceUnlockEnabled,
  markAppUnlocked,
  subscribeAccountSecurity,
  unlockWithDeviceCredential,
  verifyUserPassword,
} from '../../lib/accountSecurity'
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
  const [bioKind, setBioKind] = useState<BiometricKind>('none')
  const deviceOn = isDeviceUnlockEnabled(userId)
  const mode = deviceUnlockMode(userId)

  useEffect(() => {
    void probeBiometricAvailability().then((r) => {
      if (r.available) setBioKind(r.kind)
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

  const tryDeviceUnlock = async () => {
    setBusy(true)
    setError(null)
    try {
      const ok = await unlockWithDeviceCredential(userId, defaultBiometricPromptLabels(t))
      if (!ok) {
        setError(t('security.biometricFailed'))
        return
      }
      setError(null)
    } finally {
      setBusy(false)
    }
  }

  const unlockLabelKey = deviceUnlockButtonKey(bioKind, mode)

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-surface-2 p-6">
        <h1 className="text-xl font-bold">{t('security.unlockTitle')}</h1>
        <p className="text-sm text-muted">{t('security.unlockLead')}</p>
        {deviceOn && (
          <Button type="button" className="w-full" variant="secondary" disabled={busy} onClick={() => void tryDeviceUnlock()}>
            <Fingerprint size={18} className="mr-2 inline" aria-hidden />
            {t(unlockLabelKey)}
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
