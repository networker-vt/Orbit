import { useMemo, useRef, useState } from 'react'
import { Camera, ImageIcon } from 'lucide-react'
import { ListingCard } from '../components/listings/ListingCard'
import { AnschreibenButton } from '../components/chat/AnschreibenButton'
import { Button } from '../components/ui/Button'
import { SpeakButton } from '../components/a11y/SpeakButton'
import { useListings } from '../hooks/useStore'
import { listingsFromGuess, mockVisionFromFile, type VisionGuess } from '../lib/photoJobs'
import { useI18n } from '../lib/i18n'

export function PhotoJobsPage() {
  const { t } = useI18n()
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [guess, setGuess] = useState<VisionGuess | null>(null)
  const [busy, setBusy] = useState(false)
  const { listings } = useListings({ vertical: 'job', kind: 'offer' })

  const nearby = useMemo(() => (guess ? listingsFromGuess(guess, listings) : []), [guess, listings])

  const onFile = (f: File | undefined) => {
    if (!f) return
    setFile(f)
    setGuess(null)
    const url = URL.createObjectURL(f)
    setPreview(url)
  }

  const analyze = () => {
    if (!file) return
    setBusy(true)
    window.setTimeout(() => {
      setGuess(mockVisionFromFile(file))
      setBusy(false)
    }, 700)
  }

  return (
    <div className="mx-auto max-w-lg space-y-5 pb-scroll-chrome">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">{t('photo.title')}</h1>
        <p className="text-sm text-muted">{t('photo.lead')}</p>
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          {t('photo.disclaimer')}
        </p>
        <SpeakButton text={`${t('photo.title')}. ${t('photo.lead')}. ${t('photo.disclaimer')}`} />
      </header>

      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={() => cameraRef.current?.click()}>
          <Camera size={16} /> {t('photo.camera')}
        </Button>
        <Button variant="secondary" className="flex-1" onClick={() => galleryRef.current?.click()}>
          <ImageIcon size={16} /> {t('photo.gallery')}
        </Button>
      </div>
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => onFile(e.target.files?.[0])}
      />

      {preview && (
        <img
          src={preview}
          alt="Aufnahme für Demo-Vision"
          className="max-h-64 w-full rounded-2xl border border-border object-cover"
        />
      )}

      <Button disabled={!file || busy} onClick={analyze} className="w-full">
        {busy ? '…' : t('photo.analyze')}
      </Button>

      {guess && (
        <section className="space-y-3 rounded-2xl border border-[var(--theme-accent)]/35 bg-[var(--theme-accent)]/10 p-4">
          <p className="text-xs uppercase tracking-wider text-[var(--theme-accent)]">{t('photo.guess')}</p>
          <h2 className="text-xl font-bold">{guess.company}</h2>
          <p className="text-sm text-neutral-300">
            {guess.city} · {guess.country} · {Math.round(guess.confidence * 100)}% (Demo)
          </p>
          <p className="text-xs text-muted">{guess.disclaimer}</p>
          <h3 className="pt-2 text-sm font-semibold">{t('photo.jobs')}</h3>
          <div className="grid gap-3">
            {nearby.map((l) => (
              <div key={l.id} className="space-y-2">
                <ListingCard listing={l} highlightRate />
                <AnschreibenButton listing={l} source="foto" variant="secondary" fullWidth />
              </div>
            ))}
            {nearby.length === 0 && <p className="text-sm text-muted">Keine Demo-Jobs in der Nähe.</p>}
          </div>
        </section>
      )}
    </div>
  )
}
