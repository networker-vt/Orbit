import QRCode from 'qrcode'
import { useEffect, useState } from 'react'
import { KeyRound, ShieldCheck, ScanFace } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useAuth } from '../../lib/auth'
import { useI18n } from '../../lib/i18n'
import {
  beginTotpSetup,
  changeUserPassword,
  confirmTotpSetup,
  disableBiometricUnlock,
  disableTotp,
  enableBiometricUnlock,
  getUserSecurity,
  hasLocalPassword,
  isBiometricUnlockEnabled,
  isTotpEnabled,
  setUserPassword,
  subscribeAccountSecurity,
  verifyUserPassword,
} from '../../lib/accountSecurity'
import { probeBiometricAvailability } from '../../lib/biometricUnlock'

export function SecuritySettingsPanel() {
  const { t } = useI18n()
  const { user } = useAuth()
  const [, bump] = useState(0)
  const [pwdCurrent, setPwdCurrent] = useState('')
  const [pwdNew, setPwdNew] = useState('')
  const [pwdConfirm, setPwdConfirm] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [totpStep, setTotpStep] = useState<'off' | 'setup' | 'confirm'>('off')
  const [totpSecret, setTotpSecret] = useState<string | null>(null)
  const [totpUri, setTotpUri] = useState<string | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [totpCode, setTotpCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null)
  const [bioAvailable, setBioAvailable] = useState(false)
  const [bioKind, setBioKind] = useState<'face' | 'fingerprint' | 'unknown'>('unknown')

  const userId = user?.id ?? ''
  const email = user?.email ?? ''

  useEffect(() => subscribeAccountSecurity(() => bump((n) => n + 1)), [])

  useEffect(() => {
    void probeBiometricAvailability().then((r) => {
      setBioAvailable(r.available)
      if (r.kind === 'face' || r.kind === 'fingerprint') setBioKind(r.kind)
    })
  }, [])

  useEffect(() => {
    if (!totpUri) {
      setQrDataUrl(null)
      return
    }
    void QRCode.toDataURL(totpUri, { width: 200, margin: 1 }).then(setQrDataUrl).catch(() => setQrDataUrl(null))
  }, [totpUri])

  if (!user) {
    return (
      <section className="rounded-2xl border border-border bg-surface-2 p-4" id="sicherheit">
        <p className="text-sm text-muted">{t('security.signInFirst')}</p>
      </section>
    )
  }

  const hasPwd = hasLocalPassword(userId)
  const totpOn = isTotpEnabled(userId)
  const bioOn = isBiometricUnlockEnabled(userId)
  const sec = getUserSecurity(userId)

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(null)
    setErr(null)
    if (pwdNew !== pwdConfirm) {
      setErr(t('security.passwordMismatch'))
      return
    }
    if (hasPwd) {
      const res = await changeUserPassword(userId, pwdCurrent, pwdNew)
      if (!res.ok) {
        setErr(res.reason === 'weak' ? t('security.passwordWeak') : t('security.passwordWrong'))
        return
      }
    } else {
      const res = await setUserPassword(userId, pwdNew)
      if (!res.ok) {
        setErr(t('security.passwordWeak'))
        return
      }
    }
    setPwdCurrent('')
    setPwdNew('')
    setPwdConfirm('')
    setMsg(t('security.passwordSaved'))
  }

  const startTotp = () => {
    setErr(null)
    setMsg(null)
    setBackupCodes(null)
    const { secret, otpauthUri } = beginTotpSetup(userId, email)
    setTotpSecret(secret)
    setTotpUri(otpauthUri)
    setTotpStep('setup')
  }

  const confirmTotp = () => {
    setErr(null)
    const res = confirmTotpSetup(userId, totpCode)
    if (!res.ok) {
      setErr(t('security.totpInvalid'))
      return
    }
    setBackupCodes(res.backupCodes ?? null)
    setTotpStep('off')
    setTotpCode('')
    setTotpSecret(null)
    setTotpUri(null)
    setMsg(t('security.totpEnabled'))
  }

  const toggleBio = async () => {
    setErr(null)
    setMsg(null)
    if (bioOn) {
      await disableBiometricUnlock(userId)
      setMsg(t('security.biometricOff'))
      return
    }
    if (!hasPwd) {
      setErr(t('security.biometricNeedsPassword'))
      return
    }
    if (!bioAvailable) {
      setErr(t('security.biometricUnavailable'))
      return
    }
    if (!(await verifyUserPassword(userId, pwdCurrent))) {
      setErr(t('security.passwordWrong'))
      return
    }
    const res = await enableBiometricUnlock(userId)
    if (!res.ok) {
      setErr(t('security.biometricEnableFailed'))
      return
    }
    setPwdCurrent('')
    setMsg(t('security.biometricOn'))
  }

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-surface-2 p-4" id="sicherheit">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan/30 bg-cyan/10 text-cyan">
          <ShieldCheck size={20} />
        </span>
        <div>
          <h2 className="text-lg font-semibold">{t('security.title')}</h2>
          <p className="text-xs text-muted">{t('security.lead')}</p>
          <p className="mt-1 text-xs text-amber-200/90">{t('security.localOnlyHint')}</p>
        </div>
      </div>

      <form onSubmit={(e) => void savePassword(e)} className="space-y-3 rounded-xl border border-border/70 bg-black/20 p-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <KeyRound size={16} /> {hasPwd ? t('security.changePassword') : t('security.setPassword')}
        </h3>
        {hasPwd && (
          <Input
            label={t('security.currentPassword')}
            type="password"
            autoComplete="current-password"
            value={pwdCurrent}
            onChange={(e) => setPwdCurrent(e.target.value)}
          />
        )}
        <Input
          label={t('security.newPassword')}
          type="password"
          autoComplete={hasPwd ? 'new-password' : 'new-password'}
          value={pwdNew}
          onChange={(e) => setPwdNew(e.target.value)}
        />
        <Input
          label={t('security.confirmPassword')}
          type="password"
          autoComplete="new-password"
          value={pwdConfirm}
          onChange={(e) => setPwdConfirm(e.target.value)}
        />
        <p className="text-xs text-muted">{t('security.passwordRules')}</p>
        <Button type="submit" size="sm" disabled={!pwdNew || !pwdConfirm}>
          {t('security.savePassword')}
        </Button>
      </form>

      <div className="space-y-2 rounded-xl border border-border/70 bg-black/20 p-3">
        <h3 className="text-sm font-semibold">{t('security.totpTitle')}</h3>
        <p className="text-xs text-muted">{t('security.totpHint')}</p>
        {totpOn ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-teal-200">{t('security.totpOn')}</span>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                disableTotp(userId)
                setMsg(t('security.totpDisabled'))
              }}
            >
              {t('security.totpDisable')}
            </Button>
          </div>
        ) : totpStep === 'setup' ? (
          <div className="space-y-2">
            {qrDataUrl && (
              <img src={qrDataUrl} alt="" className="mx-auto rounded-lg border border-border bg-white p-2" width={200} height={200} />
            )}
            {totpSecret && (
              <p className="break-all text-center font-mono text-xs text-muted">
                {t('security.totpManual')}: {totpSecret}
              </p>
            )}
            <Input
              label={t('security.totpCode')}
              inputMode="numeric"
              autoComplete="one-time-code"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
            />
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={confirmTotp} disabled={totpCode.length < 6}>
                {t('security.totpConfirm')}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setTotpStep('off')}>
                {t('assist.clear')}
              </Button>
            </div>
          </div>
        ) : (
          <Button type="button" size="sm" variant="secondary" onClick={startTotp}>
            {t('security.totpSetup')}
          </Button>
        )}
        {backupCodes && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-2">
            <p className="text-xs font-semibold text-amber-100">{t('security.backupTitle')}</p>
            <ul className="mt-1 font-mono text-xs">
              {backupCodes.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
            <p className="mt-1 text-xs text-muted">{t('security.backupHint')}</p>
          </div>
        )}
      </div>

      <div className="space-y-2 rounded-xl border border-border/70 bg-black/20 p-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <ScanFace size={16} /> {t('security.biometricTitle')}
        </h3>
        <p className="text-xs text-muted">
          {bioAvailable
            ? bioKind === 'face'
              ? t('security.biometricFaceHint')
              : t('security.biometricFingerHint')
            : t('security.biometricWebHint')}
        </p>
        {bioOn && !sec.biometricUnlockToken && (
          <p className="text-xs text-amber-200">{t('security.biometricResetHint')}</p>
        )}
        {!bioOn && hasPwd && bioAvailable && (
          <Input
            label={t('security.currentPassword')}
            type="password"
            autoComplete="current-password"
            value={pwdCurrent}
            onChange={(e) => setPwdCurrent(e.target.value)}
          />
        )}
        <Button type="button" size="sm" variant={bioOn ? 'ghost' : 'secondary'} disabled={!bioAvailable && !bioOn} onClick={() => void toggleBio()}>
          {bioOn ? t('security.biometricDisable') : t('security.biometricEnable')}
        </Button>
      </div>

      {msg && <p className="text-sm text-teal-200">{msg}</p>}
      {err && <p className="text-sm text-rose-300">{err}</p>}
    </section>
  )
}
