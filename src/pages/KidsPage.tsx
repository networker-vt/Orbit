import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield } from 'lucide-react'
import { ParentalGate } from '../components/kids/ParentalGate'
import { Button, ButtonLink } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useI18n } from '../lib/i18n'
import {
  AGE_BANDS,
  AGE_BAND_COPY,
  enableKids,
  getKids,
  hasParentalPin,
  isKidsMode,
  isUnder18,
  kidsAgeBand,
  leaveKidsMode,
  type AgeBand,
} from '../lib/kids'
import { cn } from '../lib/utils'

export function KidsPage() {
  const { t, resolved } = useI18n()
  const navigate = useNavigate()
  const [band, setBand] = useState<AgeBand | null>(kidsAgeBand)
  const [kids, setKids] = useState(isKidsMode)
  const [pinReady, setPinReady] = useState(hasParentalPin)
  const [pin, setPin] = useState('')
  const [pin2, setPin2] = useState('')
  const [setupBand, setSetupBand] = useState<AgeBand>('under13')
  const [gate, setGate] = useState(false)
  const [flash, setFlash] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const showKidUi = pinReady && kids

  const setup = () => {
    setErr(null)
    if (pin !== pin2) {
      setErr(t('kids.pinMismatch'))
      return
    }
    const next = enableKids(setupBand, pin)
    if (!next) {
      setErr(t('kids.pinInvalid'))
      return
    }
    setPin('')
    setPin2('')
    setPinReady(true)
    setBand(setupBand)
    setKids(true)
    setFlash(t('kids.pinSaved'))
    window.setTimeout(() => navigate('/kids', { replace: true }), 400)
  }

  return (
    <div className="mx-auto max-w-lg space-y-5 pb-scroll-chrome">
      <header className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--theme-accent)]">Orbit Kids</p>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Shield size={22} /> {t('kids.title')}
        </h1>
        <p className="text-sm text-muted">{t('kids.lead')}</p>
      </header>

      {flash && (
        <p className="rounded-xl border border-[var(--theme-accent)]/30 bg-[var(--theme-accent)]/10 px-3 py-2 text-xs">
          {flash}
        </p>
      )}

      {!showKidUi && (
        <section className="space-y-3 rounded-2xl border border-border bg-surface-2/60 p-4" data-kids-pin-setup="1">
          <h2 className="text-sm font-semibold">{t('kids.pinSetupTitle')}</h2>
          <p className="text-xs text-muted">{t('kids.pinSetupHint')}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {AGE_BANDS.filter(isUnder18).map((id) => {
              const copy = AGE_BAND_COPY[id]
              const active = setupBand === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSetupBand(id)}
                  className={cn(
                    'btn-press rounded-2xl border-2 p-4 text-left',
                    active
                      ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/10'
                      : 'border-border bg-surface-2 hover:border-[var(--theme-accent)]/50',
                  )}
                >
                  <span className="block font-semibold text-ink">{t(`kids.band.${id}`)}</span>
                  <span className="mt-1 block text-xs text-muted">{resolved === 'de' ? copy.hintDe : copy.hintEn}</span>
                </button>
              )
            })}
          </div>
          <Input
            label={t('kids.pinLabel')}
            type="password"
            inputMode="numeric"
            autoComplete="new-password"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          />
          <Input
            label={t('kids.pinConfirm')}
            type="password"
            inputMode="numeric"
            autoComplete="new-password"
            maxLength={4}
            value={pin2}
            onChange={(e) => setPin2(e.target.value.replace(/\D/g, '').slice(0, 4))}
          />
          {err && <p className="text-xs text-rose-300">{err}</p>}
          <Button type="button" onClick={setup}>
            {t('kids.pinSave')}
          </Button>
        </section>
      )}

      {showKidUi && (
        <>
          <p className="text-sm text-muted" data-kids-ui="1">
            {t('kids.modeOn')} · {getKids().ageBand ? t(`kids.band.${getKids().ageBand}`) : ''} · {t('kids.zeroCredits')}
          </p>
          <p className="text-xs text-muted">{t('kids.ageTitle')}: {band ? t(`kids.band.${band}`) : t('kids.settings')}</p>
          <div className="flex flex-wrap gap-2">
            <ButtonLink to="/kids" variant="secondary">
              {t('kids.hub.title')}
            </ButtonLink>
            <ButtonLink to="/campus" variant="secondary">
              {t('campus.nav')}
            </ButtonLink>
            <ButtonLink to="/treffer" variant="secondary">
              {t('nav.match')}
            </ButtonLink>
            <ButtonLink to="/" variant="ghost">
              {t('nav.home')}
            </ButtonLink>
            <Button type="button" variant="secondary" onClick={() => setGate(true)}>
              {t('kids.leaveCta')}
            </Button>
          </div>
        </>
      )}

      <ParentalGate
        open={gate}
        reason="leave_kids"
        onClose={() => setGate(false)}
        onUnlocked={() => {
          setGate(false)
          if (leaveKidsMode()) {
            setBand('18+')
            setKids(false)
            setFlash(t('kids.left'))
          }
        }}
      />
    </div>
  )
}
