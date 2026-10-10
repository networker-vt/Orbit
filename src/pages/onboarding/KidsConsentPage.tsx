import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { OrbitRobot } from '../../components/home/OrbitRobot'
import { DemoOnboardingBanner } from '../../components/onboarding/DemoOnboardingBanner'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useI18n } from '../../lib/i18n'
import { AGE_BANDS, AGE_BAND_COPY, isUnder18, type AgeBand } from '../../lib/kids'
import { completeKidsProfile, recordKidsConsent } from '../../lib/registration'
import { cn } from '../../lib/utils'

export function KidsConsentPage() {
  const { t, resolved } = useI18n()
  const navigate = useNavigate()
  const [guardian, setGuardian] = useState('')
  const [consent, setConsent] = useState(false)
  const [band, setBand] = useState<AgeBand>('under13')
  const [pin, setPin] = useState('')
  const [pin2, setPin2] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [step, setStep] = useState<'consent' | 'pin'>('consent')

  const continueConsent = () => {
    setErr(null)
    if (!consent || !guardian.trim()) {
      setErr(t('onboarding.kids.consentRequired'))
      return
    }
    if (!recordKidsConsent(guardian)) {
      setErr(t('onboarding.kids.consentRequired'))
      return
    }
    setStep('pin')
  }

  const finish = () => {
    setErr(null)
    if (pin !== pin2) {
      setErr(t('kids.pinMismatch'))
      return
    }
    if (!completeKidsProfile(band, pin)) {
      setErr(t('kids.pinInvalid'))
      return
    }
    navigate('/kids', { replace: true })
  }

  return (
    <div className="mx-auto max-w-lg space-y-5 py-4" data-kids-consent="1">
      <DemoOnboardingBanner />
      <div className="flex flex-col items-center gap-2 text-center">
        <OrbitRobot motion="winken" size="compact" />
        <h1 className="text-2xl font-bold">{t('onboarding.kids.title')}</h1>
        <p className="text-sm text-muted">{t('onboarding.kids.lead')}</p>
      </div>

      {step === 'consent' && (
        <section className="space-y-3 rounded-2xl border border-border bg-surface-2 p-4">
          <p className="text-sm">{t('onboarding.kids.consentText')}</p>
          <Input
            label={t('onboarding.kids.guardianName')}
            value={guardian}
            onChange={(e) => setGuardian(e.target.value)}
            autoComplete="name"
          />
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
            <span>{t('onboarding.kids.consentCheckbox')}</span>
          </label>
          {err && <p className="text-xs text-rose-300">{err}</p>}
          <Button type="button" onClick={continueConsent}>
            {t('onboarding.kids.continuePin')}
          </Button>
        </section>
      )}

      {step === 'pin' && (
        <section className="space-y-3 rounded-2xl border border-border bg-surface-2 p-4">
          <h2 className="text-sm font-semibold">{t('kids.pinSetupTitle')}</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {AGE_BANDS.filter(isUnder18).map((id) => {
              const copy = AGE_BAND_COPY[id]
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setBand(id)}
                  className={cn(
                    'rounded-2xl border-2 p-3 text-left text-sm',
                    band === id ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/10' : 'border-border',
                  )}
                >
                  <span className="font-semibold">{t(`kids.band.${id}`)}</span>
                  <span className="mt-1 block text-xs text-muted">{resolved === 'de' ? copy.hintDe : copy.hintEn}</span>
                </button>
              )
            })}
          </div>
          <Input
            label={t('kids.pinLabel')}
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          />
          <Input
            label={t('kids.pinConfirm')}
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin2}
            onChange={(e) => setPin2(e.target.value.replace(/\D/g, '').slice(0, 4))}
          />
          {err && <p className="text-xs text-rose-300">{err}</p>}
          <Button type="button" onClick={finish}>
            {t('onboarding.kids.openHub')}
          </Button>
        </section>
      )}
    </div>
  )
}
