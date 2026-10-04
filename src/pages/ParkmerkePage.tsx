import { useEffect, useRef, useState } from 'react'
import {
  MAX_PHOTO_BYTES,
  PARK_PRESETS_MIN,
  PARK_ZOOM,
  endAtFromCustom,
  endAtFromMinutes,
  formatEnd,
  formatPin,
  formatRemaining,
  latLngToWorld,
  remainingMs,
  shouldSendLocalWarning,
  tilesForPin,
  warningPhase,
  type ParkPreset,
  type ParkingSpot,
  type SpotDraft,
  type WarningPhase,
} from '../lib/parkmerke'
import {
  deleteParkingSpot,
  loadParkingSpot,
  markParkingWarned,
  saveParkingSpot,
} from '../lib/parkmerkeStore'
import { loadMapTile } from '../lib/parkmerkeTiles'
import { Button } from '../components/ui/Button'
import { cn } from '../lib/utils'

const COPY = {
  title: 'Parkmerke',
  lead: 'Merkt sich auf diesem Gerät, wo das Auto steht und wann die Zeit endet.',
  honest: 'Nur das eigene Foto, der eigene Standort und die eigene Zeit. Andere Autos oder Orte werden nicht gezeigt.',
  local: 'Nur auf diesem Gerät gespeichert.',
  offline: 'Offline. Der gespeicherte Platz bleibt auf diesem Gerät.',
  empty: 'Noch kein Platz auf diesem Gerät.',
  photo: 'Foto',
  photoHint: 'Ein Foto vom eigenen Auto oder vom Platz. Es bleibt auf diesem Gerät.',
  camera: 'Kamera',
  gallery: 'Galerie',
  where: 'Standort',
  locate: 'Diesen Standort als Pin',
  locating: 'Standort wird gelesen…',
  locFail: 'Der Standort ist auf diesem Gerät gerade nicht verfügbar.',
  time: 'Parkzeit',
  custom: 'Eigenes Ende',
  save: 'Platz merken',
  replace: 'Neuen Platz merken',
  confirmTitle: 'Gespeicherten Platz ersetzen?',
  confirmBody:
    'Der neue Platz ersetzt den alten erst nach dieser Bestätigung. Foto, Pin und Zeit des alten Platzes werden dann auf diesem Gerät gelöscht.',
  keep: 'Behalten',
  replaceDo: 'Ersetzen',
  delete: 'Platz löschen',
  remaining: 'Restzeit',
  ended: 'Die Parkzeit ist vorbei.',
  soon: 'Die Parkzeit endet bald.',
  ends: 'Ende',
  mapMiss: 'Die Kartenbilder sind ohne Netz nur da, wenn sie schon auf diesem Gerät liegen.',
  mapFail: 'Die Kartenbilder sind gerade nicht erreichbar. Der Pin bleibt auf diesem Gerät.',
  mapCredit: 'Kartenbilder © OpenStreetMap',
  needPhoto: 'Bitte ein Foto wählen.',
  needPin: 'Bitte den eigenen Standort als Pin setzen.',
  needTime: 'Bitte eine Parkzeit oder ein Ende wählen.',
  photoBig: 'Das Foto ist zu groß für dieses Gerät.',
  readFail: 'Auf diesem Gerät konnte nichts gelesen werden.',
  notify: 'Ein Hinweis erscheint auf diesem Bildschirm. Eine Mitteilung nur, wenn der Browser sie schon erlaubt.',
  newPin: 'Neuer Standort, noch nicht gespeichert.',
  photoAlt: 'Eigenes Foto vom Auto oder vom Platz',
} as const

function browserNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof Notification === 'undefined') return 'unsupported'
  return Notification.permission
}

function readOwnPosition(): Promise<{ lat: number; lng: number; accuracy: number | null }> {
  return new Promise((resolve, reject) => {
    const geo = navigator.geolocation
    if (!geo) {
      reject(new Error('geo'))
      return
    }
    geo.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Number.isFinite(pos.coords.accuracy) ? pos.coords.accuracy : null,
        })
      },
      () => reject(new Error('geo')),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 12000 },
    )
  })
}

function useOnline() {
  const [online, setOnline] = useState(() => navigator.onLine)
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])
  return online
}

function SpotMap({
  lat,
  lng,
  persist,
  online,
}: {
  lat: number
  lng: number
  persist: boolean
  online: boolean
}) {
  const [shots, setShots] = useState<{ key: string; url: string; left: number; top: number }[]>([])
  const [miss, setMiss] = useState(false)
  useEffect(() => {
    const ctrl = new AbortController()
    let gone = false
    const urls: string[] = []
    const { fx, fy } = latLngToWorld(lat, lng, PARK_ZOOM)
    const tiles = tilesForPin(lat, lng, PARK_ZOOM)
    void (async () => {
      const loaded: { key: string; url: string; left: number; top: number }[] = []
      for (const tile of tiles) {
        if (ctrl.signal.aborted || gone) break
        const blob = await loadMapTile(tile.z, tile.x, tile.y, online, ctrl.signal, persist)
        if (!blob || gone) continue
        const url = URL.createObjectURL(blob)
        urls.push(url)
        loaded.push({
          key: `${tile.z}/${tile.x}/${tile.y}`,
          url,
          left: (tile.x - fx) * 256,
          top: (tile.y - fy) * 256,
        })
      }
      if (gone) {
        for (const url of urls) URL.revokeObjectURL(url)
        return
      }
      setShots(loaded)
      setMiss(loaded.length === 0)
    })()
    return () => {
      gone = true
      ctrl.abort()
      for (const url of urls) URL.revokeObjectURL(url)
    }
  }, [lat, lng, persist, online])

  return (
    <div className="space-y-1">
      <div
        data-park-map="1"
        className="relative h-56 overflow-hidden rounded-2xl border border-border bg-surface-2"
      >
        {shots.map((shot) => (
          <img
            key={shot.key}
            alt=""
            src={shot.url}
            width={256}
            height={256}
            className="absolute max-w-none"
            style={{ left: `calc(50% + ${shot.left}px)`, top: `calc(50% + ${shot.top}px)` }}
          />
        ))}
        <div
          data-park-pin="1"
          role="img"
          aria-label="Eigener Standort"
          className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-rose-600 shadow"
        />
        {miss && (
          <p className="absolute inset-x-3 bottom-3 text-xs text-muted" data-park-map-miss="1">
            {online ? COPY.mapFail : COPY.mapMiss}
          </p>
        )}
      </div>
      {shots.length > 0 && (
        <a
          href="https://www.openstreetmap.org/copyright"
          className="text-xs text-muted underline"
          rel="noreferrer"
        >
          {COPY.mapCredit}
        </a>
      )}
    </div>
  )
}

function WarningLine({ phase }: { phase: WarningPhase }) {
  if (phase === 'none') return null
  return (
    <p role="status" data-park-warn={phase} className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-ink">
      {phase === 'soon' ? COPY.soon : COPY.ended}
    </p>
  )
}

export function ParkmerkePage() {
  const online = useOnline()
  const [ready, setReady] = useState(false)
  const [spot, setSpot] = useState<ParkingSpot | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [composing, setComposing] = useState(false)
  const [photo, setPhoto] = useState<Blob | null>(null)
  const [draftUrl, setDraftUrl] = useState<string | null>(null)
  const [savedUrl, setSavedUrl] = useState<string | null>(null)
  const draftUrlRef = useRef<string | null>(null)
  const savedUrlRef = useRef<string | null>(null)
  const [pin, setPin] = useState<{ lat: number; lng: number; accuracy: number | null } | null>(null)
  const [preset, setPreset] = useState<ParkPreset | null>(null)
  const [custom, setCustom] = useState('')
  const [pending, setPending] = useState<SpotDraft | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)
  const notifyOnce = useRef(false)

  const rememberSaved = (next: ParkingSpot | null) => {
    if (savedUrlRef.current) URL.revokeObjectURL(savedUrlRef.current)
    const url = next ? URL.createObjectURL(next.photo) : null
    savedUrlRef.current = url
    setSavedUrl(url)
    setSpot(next)
  }

  const rememberPhoto = (next: Blob | null) => {
    if (draftUrlRef.current) URL.revokeObjectURL(draftUrlRef.current)
    const url = next ? URL.createObjectURL(next) : null
    draftUrlRef.current = url
    setDraftUrl(url)
    setPhoto(next)
  }

  useEffect(() => {
    let gone = false
    void loadParkingSpot()
      .then((saved) => {
        if (gone) return
        rememberSaved(saved)
        setComposing(saved == null)
        setReady(true)
      })
      .catch(() => {
        if (gone) return
        setError(COPY.readFail)
        setComposing(true)
        setReady(true)
      })
    return () => {
      gone = true
    }
  }, [])

  useEffect(() => {
    if (!spot) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [spot])

  useEffect(() => {
    return () => {
      if (savedUrlRef.current) URL.revokeObjectURL(savedUrlRef.current)
      if (draftUrlRef.current) URL.revokeObjectURL(draftUrlRef.current)
    }
  }, [])

  useEffect(() => {
    if (!spot) return
    const phase = warningPhase(spot.endsAt, now)
    if (spot.warned) {
      notifyOnce.current = true
      return
    }
    if (notifyOnce.current) return
    if (!shouldSendLocalWarning(browserNotificationPermission(), phase, false)) return
    try {
      new Notification('Parkmerke', { body: COPY.soon })
    } catch {
      return
    }
    notifyOnce.current = true
    void markParkingWarned().then(() => {
      setSpot((prev) => (prev ? { ...prev, warned: true } : prev))
    })
  }, [spot, now])

  const resetForm = () => {
    rememberPhoto(null)
    setPin(null)
    setPreset(null)
    setCustom('')
    setPending(null)
  }

  const takePhoto = (file: File | undefined) => {
    setError(null)
    if (!file) return
    if (file.type && !file.type.startsWith('image/')) {
      setError(COPY.needPhoto)
      return
    }
    if (file.size <= 0 || file.size > MAX_PHOTO_BYTES) {
      setError(COPY.photoBig)
      return
    }
    rememberPhoto(file)
  }

  const onLocate = async () => {
    setError(null)
    setLocating(true)
    try {
      setPin(await readOwnPosition())
    } catch {
      setError(COPY.locFail)
    } finally {
      setLocating(false)
    }
  }

  const chosenEnd = (at: number): number | null => {
    if (custom.trim()) return endAtFromCustom(custom.trim(), at)
    if (preset) return endAtFromMinutes(at, preset)
    return null
  }

  const onSave = async () => {
    const at = Date.now()
    if (!photo) {
      setError(COPY.needPhoto)
      return
    }
    if (!pin) {
      setError(COPY.needPin)
      return
    }
    const endsAt = chosenEnd(at)
    if (endsAt == null) {
      setError(COPY.needTime)
      return
    }
    const draft: SpotDraft = {
      photo,
      lat: pin.lat,
      lng: pin.lng,
      accuracy: pin.accuracy,
      endsAt,
    }
    const result = await saveParkingSpot(draft, false, at)
    if (!result.ok && result.reason === 'confirm') {
      setPending(draft)
      setError(null)
      return
    }
    if (!result.ok) {
      setError(result.reason === 'photo' ? COPY.needPhoto : result.reason === 'pin' ? COPY.needPin : COPY.needTime)
      return
    }
    notifyOnce.current = false
    rememberSaved(result.spot)
    setNow(at)
    setComposing(false)
    resetForm()
    setError(null)
  }

  const onConfirm = async () => {
    if (!pending) return
    const at = Date.now()
    const result = await saveParkingSpot(pending, true, at)
    if (!result.ok) {
      setError(result.reason === 'confirm' ? COPY.confirmTitle : COPY.needTime)
      return
    }
    notifyOnce.current = false
    rememberSaved(result.spot)
    setNow(at)
    setComposing(false)
    resetForm()
    setError(null)
  }

  const onDelete = async () => {
    await deleteParkingSpot()
    notifyOnce.current = false
    rememberSaved(null)
    setComposing(true)
    resetForm()
    setError(null)
  }

  const phase: WarningPhase = spot ? warningPhase(spot.endsAt, now) : 'none'
  const showSaved = spot != null
  const showForm = composing && !pending

  return (
    <div className="mx-auto max-w-lg space-y-5 pb-scroll-chrome" data-park-root="1" data-park-ready={ready ? '1' : '0'}>
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">{COPY.title}</h1>
        <p className="text-sm text-ink">{COPY.lead}</p>
        <p className="text-sm text-muted">{COPY.honest}</p>
        <p className="text-sm text-muted" data-park-storage="local">
          {COPY.local}
        </p>
        {!online && (
          <p className="text-sm text-ink" data-park-offline="1" role="status">
            {COPY.offline}
          </p>
        )}
        <p className="text-xs text-muted">{COPY.notify}</p>
      </header>

      {error && (
        <p role="alert" className="text-sm text-amber-200" data-park-error="1">
          {error}
        </p>
      )}

      {showSaved && spot && (
        <section className="space-y-3" data-park-saved="1" aria-label="Gespeicherter Platz">
          {savedUrl && (
            <img src={savedUrl} alt={COPY.photoAlt} className="max-h-64 w-full rounded-2xl object-cover" data-park-photo="1" />
          )}
          <SpotMap lat={spot.lat} lng={spot.lng} persist online={online} />
          <p className="text-sm text-muted" data-park-coords={formatPin(spot.lat, spot.lng)}>
            {formatPin(spot.lat, spot.lng)}
          </p>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted">{COPY.remaining}</p>
            <p className="text-3xl font-bold tracking-tight" data-park-remaining={formatRemaining(remainingMs(spot.endsAt, now))}>
              {formatRemaining(remainingMs(spot.endsAt, now))}
            </p>
            <p className="text-sm text-muted">
              {COPY.ends}: {formatEnd(spot.endsAt)}
            </p>
          </div>
          <WarningLine phase={phase} />
          <div className="flex flex-wrap gap-2">
            {!composing && (
              <Button type="button" variant="secondary" data-park-new="1" onClick={() => setComposing(true)}>
                {COPY.replace}
              </Button>
            )}
            <Button type="button" variant="danger" data-park-delete="1" onClick={() => void onDelete()}>
              {COPY.delete}
            </Button>
          </div>
        </section>
      )}

      {!showSaved && ready && <p className="text-sm text-muted">{COPY.empty}</p>}

      {pending && (
        <div
          className="space-y-3 rounded-2xl border border-border bg-surface-2 p-4"
          data-park-confirm="1"
          role="alertdialog"
          aria-labelledby="park-confirm-title"
        >
          <h2 id="park-confirm-title" className="text-base font-semibold">
            {COPY.confirmTitle}
          </h2>
          <p className="text-sm text-muted">{COPY.confirmBody}</p>
          <p className="text-sm text-muted">
            {COPY.newPin} {formatPin(pending.lat, pending.lng)}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              data-park-keep="1"
              onClick={() => {
                setPending(null)
                setComposing(false)
                resetForm()
              }}
            >
              {COPY.keep}
            </Button>
            <Button type="button" data-park-replace="1" onClick={() => void onConfirm()}>
              {COPY.replaceDo}
            </Button>
          </div>
        </div>
      )}

      {showForm && (
        <form
          className="space-y-4"
          data-park-form="1"
          onSubmit={(event) => {
            event.preventDefault()
            void onSave()
          }}
        >
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold">{COPY.photo}</legend>
            <p className="text-xs text-muted">{COPY.photoHint}</p>
            {draftUrl && (
              <img src={draftUrl} alt={COPY.photoAlt} className="max-h-48 w-full rounded-2xl object-cover" data-park-draft="1" />
            )}
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex min-h-11 cursor-pointer items-center rounded-xl border border-border px-3 text-sm">
                {COPY.camera}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  data-park-camera="1"
                  onChange={(event) => takePhoto(event.target.files?.[0])}
                />
              </label>
              <label className="inline-flex min-h-11 cursor-pointer items-center rounded-xl border border-border px-3 text-sm">
                {COPY.gallery}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  data-park-gallery="1"
                  onChange={(event) => takePhoto(event.target.files?.[0])}
                />
              </label>
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold">{COPY.where}</legend>
            <Button type="button" variant="secondary" data-park-locate="1" onClick={() => void onLocate()} disabled={locating}>
              {locating ? COPY.locating : COPY.locate}
            </Button>
            {pin && (
              <p className="text-sm text-muted" data-park-draft-coords={formatPin(pin.lat, pin.lng)}>
                {formatPin(pin.lat, pin.lng)}
              </p>
            )}
            {pin && !spot && <SpotMap lat={pin.lat} lng={pin.lng} persist={false} online={online} />}
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold">{COPY.time}</legend>
            <div className="flex flex-wrap gap-2" role="group" aria-label={COPY.time}>
              {PARK_PRESETS_MIN.map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  data-park-preset={minutes}
                  aria-pressed={preset === minutes}
                  onClick={() => {
                    setPreset(minutes)
                    setCustom('')
                  }}
                  className={cn(
                    'min-h-10 rounded-full border px-3 py-1.5 text-sm',
                    preset === minutes
                      ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/15 text-ink'
                      : 'border-border text-muted',
                  )}
                >
                  {minutes} Minuten
                </button>
              ))}
            </div>
            <label className="block text-sm">
              <span className="text-muted">{COPY.custom}</span>
              <input
                type="datetime-local"
                value={custom}
                data-park-custom="1"
                onChange={(event) => {
                  setCustom(event.target.value)
                  setPreset(null)
                }}
                className="mt-1 w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-base text-ink"
              />
            </label>
          </fieldset>

          <Button type="submit" data-park-save="1">
            {COPY.save}
          </Button>
        </form>
      )}
    </div>
  )
}
