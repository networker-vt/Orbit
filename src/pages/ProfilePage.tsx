import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Heart, Gift, Wallet } from 'lucide-react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Input, Select, Textarea } from '../components/ui/Input'
import { CITIES, ROLE_LABELS } from '../data/constants'
import { OccupationField } from '../components/prefs/OccupationField'
import { useAuth } from '../lib/auth'
import { store, resetStore } from '../lib/store'
import { giftWalletHref } from '../lib/gift'
import { isFlagOn } from '../lib/flags'
import { useI18n } from '../lib/i18n'
import { ReportButton } from '../components/report/ReportButton'
import { verificationLabel } from '../lib/utils'
import type { Role } from '../types'
import { OrbitPlusThemes } from '../components/credits/OrbitPlusThemes'

export function ProfilePage() {
  const { profile, user, updateProfile, logout, loginDemo } = useAuth()
  const navigate = useNavigate()
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [city, setCity] = useState(profile?.city ?? 'Berlin')
  const [craft, setCraft] = useState<string>(profile?.crafts[0] ?? '')
  const [occupationIds, setOccupationIds] = useState<string[]>([])
  const [travelRadiusKm, setTravelRadiusKm] = useState(
    profile?.travelRadiusKm?.toString() ?? '200',
  )
  const [certs, setCerts] = useState((profile?.certifications ?? []).join(', '))
  const [available, setAvailable] = useState(profile?.available ?? true)
  const [insured, setInsured] = useState(profile?.insured ?? false)
  const [saved, setSaved] = useState(false)

  if (!user || !profile) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-surface-2 p-8 text-center">
        <h1 className="text-xl font-bold">Profil</h1>
        <p className="mt-2 text-sm text-muted">Melde dich an, um dein Profil zu verwalten.</p>
        <div className="mt-4 flex justify-center gap-2">
          <Button onClick={() => loginDemo()}>Demo</Button>
          <Button variant="secondary" onClick={() => navigate('/auth')}>
            Auth
          </Button>
        </div>
      </div>
    )
  }

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    const next = {
      ...profile,
      bio,
      city,
      crafts: craft.trim() ? [craft.trim()] : [],
      travelRadiusKm: travelRadiusKm ? Number(travelRadiusKm) : undefined,
      certifications: certs
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean),
      available,
      insured,
    }
    updateProfile(next)
    store.upsertProfile(next)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div className="rounded-2xl border border-border bg-surface-2 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{profile.name}</h1>
            <p className="text-sm text-muted">{profile.email}</p>
          </div>
          <Badge tone="cyan">{ROLE_LABELS[profile.role]}</Badge>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge tone="teal">{verificationLabel(profile.verified)}</Badge>
          <Badge>
            ⭐ {profile.rating.toFixed(1)} · {profile.reviewCount} Reviews
          </Badge>
          {available && <Badge tone="green">Verfügbar</Badge>}
          {insured && <Badge tone="teal">Versichert</Badge>}
          {profile.travelRadiusKm != null && (
            <Badge>Radius {profile.travelRadiusKm} km</Badge>
          )}
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Link
          to="/mein"
          className="card-hover flex items-center gap-3 rounded-2xl border border-border bg-surface-2 px-4 py-3"
        >
          <Heart size={18} className="text-rose-300" />
          <span>
            <span className="block text-sm font-semibold">Favoriten</span>
            <span className="block text-xs text-muted">Jobs, Listings, Katalog</span>
          </span>
        </Link>
        {isFlagOn('credits') && (
        <Link
          to="/wallet"
          className="card-hover flex items-center gap-3 rounded-2xl border border-border bg-surface-2 px-4 py-3"
        >
          <Wallet size={18} className="text-cyan" />
          <span>
            <span className="block text-sm font-semibold">Wallet</span>
            <span className="block text-xs text-muted">Zahlungen · Demo, kein echtes Geld</span>
          </span>
        </Link>
        )}
      </div>

      {isFlagOn('credits') && <OrbitPlusThemes />}

      <form onSubmit={save} className="space-y-3 rounded-2xl border border-border bg-surface-2 p-5">
        <h2 className="font-semibold">Profil bearbeiten</h2>
        <Textarea label="Bio" value={bio} onChange={(e) => setBio(e.target.value)} />
        <Select label="Stadt" value={city} onChange={(e) => setCity(e.target.value)}>
          {CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <OccupationField
          mode="single"
          selectedIds={occupationIds}
          other={occupationIds.length ? '' : craft}
          onChange={(next) => {
            setOccupationIds(next.occupations)
            setCraft(next.labels[0] || next.occupationOther)
          }}
        />
        {craft && <p className="text-xs text-muted">Gewählt: {craft}</p>}
        <Input
          label="Reise-Radius (km)"
          type="number"
          min="0"
          value={travelRadiusKm}
          onChange={(e) => setTravelRadiusKm(e.target.value)}
        />
        <Input
          label="Zertifikate (Komma)"
          value={certs}
          onChange={(e) => setCerts(e.target.value)}
          placeholder="z. B. Ausbildung, Führerschein, Sprachzertifikat"
        />
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="inline-flex min-h-11 items-center gap-2">
            <input
              type="checkbox"
              checked={available}
              onChange={(e) => setAvailable(e.target.checked)}
              className="h-4 w-4 accent-cyan"
            />
            Verfügbar für Gigs
          </label>
          <label className="inline-flex min-h-11 items-center gap-2">
            <input
              type="checkbox"
              checked={insured}
              onChange={(e) => setInsured(e.target.checked)}
              className="h-4 w-4 accent-cyan"
            />
            Versicherung vorhanden
          </label>
        </div>
        <Select
          label="Rolle"
          value={profile.role}
          onChange={(e) => updateProfile({ role: e.target.value as Role })}
        >
          {Object.entries(ROLE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
        <Button type="submit">Profil speichern</Button>
        {saved && <span className="ml-2 text-sm text-teal">Gespeichert ✓</span>}
      </form>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          onClick={() => {
            logout()
            navigate('/auth')
          }}
        >
          Abmelden
        </Button>
        {user && (
          <ReportButton targetKind="profile" targetId={user.id} />
        )}
        <Button
          variant="ghost"
          onClick={() => {
            resetStore()
            alert('Seed-Daten zurückgesetzt. Bitte Seite neu laden für frische Demo-Daten.')
          }}
        >
          Demo-Daten reset
        </Button>
      </div>
    </div>
  )
}

export function PublicProfilePage() {
  const { t } = useI18n()
  const { id } = useParams()
  const profile = store.getProfile(id!)
  const navigate = useNavigate()

  if (!profile) {
    return (
      <div className="p-8 text-center">
        Profil nicht gefunden.
        <Button className="mt-3" onClick={() => navigate('/')}>
          Home
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-border bg-surface-2 p-6">
      <div className="flex flex-wrap gap-2">
        <Badge tone="cyan">{ROLE_LABELS[profile.role]}</Badge>
        <Badge tone="teal">{verificationLabel(profile.verified)}</Badge>
        {profile.available && <Badge tone="green">Verfügbar</Badge>}
        {profile.insured && <Badge>Versichert</Badge>}
      </div>
      <h1 className="mt-3 text-2xl font-bold">{profile.name}</h1>
      <p className="text-sm text-muted">
        {profile.city}
        {profile.travelRadiusKm != null ? ` · Radius ${profile.travelRadiusKm} km` : ''}
      </p>
      <p className="mt-4 text-neutral-300">{profile.bio}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {profile.crafts.map((c) => (
          <Badge key={c}>{c}</Badge>
        ))}
        {(profile.certifications ?? []).map((c) => (
          <Badge key={c} tone="teal">
            {c}
          </Badge>
        ))}
      </div>
      <p className="mt-4 text-amber-300">
        ⭐ {profile.rating.toFixed(1)} ({profile.reviewCount} Bewertungen)
      </p>
      {isFlagOn('credits') && (
      <Link
        to={giftWalletHref({
          kind: profile.companyName ? 'company' : 'profile',
          id: profile.id,
          label: profile.companyName || profile.name,
          hint: profile.city,
        })}
        className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-violet-400/40 px-3 py-2 text-sm text-violet-100"
      >
        <Gift size={16} /> {t('gift.nudgeDemo')}
      </Link>
      )}
      <div className="mt-4">
        <ReportButton targetKind="profile" targetId={profile.id} />
      </div>
    </div>
  )
}
