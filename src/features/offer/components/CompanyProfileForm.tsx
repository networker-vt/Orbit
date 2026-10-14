import { useRef, useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { readLogoAsDataUrl, validateCompanyProfile } from '../companyProfile'
import type { CompanyProfile } from '../types'
import { KLEINUNTERNEHMER_HINT } from '../types'
import { emptyCompanyProfile, saveCompanyProfile } from '../offerDb'

const fieldClass =
  'mt-1 min-h-12 w-full rounded-xl border border-border bg-surface-3 px-3 text-base text-ink'

export function CompanyProfileForm({
  initial,
  onSaved,
}: {
  initial: CompanyProfile | null
  onSaved: (profile: CompanyProfile) => void
}) {
  const [profile, setProfile] = useState<CompanyProfile>(initial ?? emptyCompanyProfile())
  const [status, setStatus] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const logoRef = useRef<HTMLInputElement>(null)

  const set = <K extends keyof CompanyProfile>(key: K, value: CompanyProfile[K]) => {
    setProfile((p) => ({ ...p, [key]: value }))
  }

  const save = async () => {
    const issues = validateCompanyProfile(profile)
    // Allow saving incomplete profile, but surface gaps for export readiness
    setErrors(issues.map((i) => i.labelDe))
    await saveCompanyProfile(profile)
    onSaved(profile)
    setStatus(issues.length ? 'Profil gespeichert — für Export fehlen noch Angaben.' : 'Profil gespeichert.')
  }

  return (
    <section className="space-y-3 rounded-2xl border border-border bg-surface-2 p-4" aria-labelledby="profile-heading">
      <h2 id="profile-heading" className="text-lg font-semibold text-ink">
        Firmenprofil
      </h2>
      <p className="text-sm text-muted">
        Wird lokal auf diesem Gerät gespeichert und in jedes Angebot bzw. jede Rechnung übernommen. Die App prüft
        nicht, ob Sie Kleinunternehmer sind.
      </p>

      <label className="block text-sm text-ink">
        Name
        <input
          className={fieldClass}
          value={profile.name}
          autoComplete="organization"
          onChange={(e) => set('name', e.target.value)}
        />
      </label>
      <label className="block text-sm text-ink">
        Straße und Hausnummer
        <input
          className={fieldClass}
          value={profile.street}
          autoComplete="street-address"
          onChange={(e) => set('street', e.target.value)}
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm text-ink">
          PLZ
          <input
            className={fieldClass}
            inputMode="numeric"
            autoComplete="postal-code"
            value={profile.postCode}
            onChange={(e) => set('postCode', e.target.value)}
          />
        </label>
        <label className="block text-sm text-ink">
          Ort
          <input
            className={fieldClass}
            autoComplete="address-level2"
            value={profile.city}
            onChange={(e) => set('city', e.target.value)}
          />
        </label>
      </div>
      <label className="block text-sm text-ink">
        Steuernummer
        <input
          className={fieldClass}
          inputMode="text"
          value={profile.taxNumber}
          onChange={(e) => set('taxNumber', e.target.value)}
        />
      </label>
      <label className="block text-sm text-ink">
        USt-IdNr. (alternativ zur Steuernummer)
        <input
          className={fieldClass}
          inputMode="text"
          value={profile.vatId}
          onChange={(e) => set('vatId', e.target.value)}
        />
      </label>
      <label className="block text-sm text-ink">
        IBAN
        <input
          className={fieldClass}
          inputMode="text"
          autoComplete="off"
          spellCheck={false}
          value={profile.iban}
          onChange={(e) => set('iban', e.target.value.toUpperCase())}
        />
      </label>
      <label className="block text-sm text-ink">
        BIC
        <input
          className={fieldClass}
          inputMode="text"
          spellCheck={false}
          value={profile.bic}
          onChange={(e) => set('bic', e.target.value.toUpperCase())}
        />
      </label>
      <label className="block text-sm text-ink">
        E-Mail
        <input
          className={fieldClass}
          type="email"
          inputMode="email"
          autoComplete="email"
          value={profile.email}
          onChange={(e) => set('email', e.target.value)}
        />
      </label>
      <label className="block text-sm text-ink">
        Logo
        <input
          ref={logoRef}
          type="file"
          accept="image/*"
          className="mt-1 block w-full text-sm"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (!f) return
            void readLogoAsDataUrl(f).then((url) => set('logoDataUrl', url))
          }}
        />
      </label>
      {profile.logoDataUrl ? (
        <img src={profile.logoDataUrl} alt="Firmenlogo" className="max-h-20 rounded-lg border border-border" />
      ) : null}

      <label className="flex min-h-12 items-start gap-3 text-sm text-ink">
        <input
          type="checkbox"
          className="mt-1 size-5 accent-[var(--theme-accent,#0f766e)]"
          checked={profile.kleinunternehmer}
          onChange={(e) => set('kleinunternehmer', e.target.checked)}
        />
        <span>
          Kleinunternehmer
          {profile.kleinunternehmer ? (
            <span className="mt-1 block text-muted">{KLEINUNTERNEHMER_HINT}</span>
          ) : null}
        </span>
      </label>

      <div aria-live="polite" className="space-y-1 text-sm">
        {status ? <p className="text-cyan-200">{status}</p> : null}
        {errors.length > 0 ? (
          <ul className="space-y-1 text-amber-200">
            {errors.map((e) => (
              <li key={e}>Für Export fehlt: {e}</li>
            ))}
          </ul>
        ) : null}
      </div>

      <Button type="button" size="lg" className="min-h-14 w-full" onClick={() => void save()}>
        Firmenprofil speichern
      </Button>
    </section>
  )
}
