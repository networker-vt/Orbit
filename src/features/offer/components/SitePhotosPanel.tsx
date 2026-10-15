import { useRef, useState } from 'react'
import { Button } from '../../../components/ui/Button'
import type { SitePhoto } from '../types'
import { SITE_PHOTO_FIRST_HINT } from '../types'

export function SitePhotosPanel({
  photos,
  onChange,
}: {
  photos: SitePhoto[]
  onChange: (photos: SitePhoto[]) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [hintShown, setHintShown] = useState(photos.length === 0)
  const [message, setMessage] = useState('')

  const addPhoto = async (file: File) => {
    if (photos.length === 0) {
      setHintShown(true)
      setMessage(SITE_PHOTO_FIRST_HINT)
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result ?? ''))
      reader.onerror = () => reject(reader.error ?? new Error('photo'))
      reader.readAsDataURL(file)
    })
    onChange([
      ...photos,
      {
        id: `ph-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        dataUrl,
        createdAt: Date.now(),
      },
    ])
  }

  return (
    <section className="space-y-3 rounded-2xl border border-border bg-surface-2 p-4" aria-labelledby="photos-heading">
      <h2 id="photos-heading" className="text-lg font-semibold text-ink">
        Baustellenfotos
      </h2>
      <p className="text-sm text-muted">Nur auf diesem Gerät gespeichert.</p>
      {hintShown || photos.length === 0 ? (
        <p className="rounded-xl border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-50" role="status">
          {SITE_PHOTO_FIRST_HINT}
        </p>
      ) : null}
      <Button
        type="button"
        variant="secondary"
        size="lg"
        className="min-h-14 w-full"
        onClick={() => inputRef.current?.click()}
      >
        Foto hinzufügen
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void addPhoto(f)
          e.target.value = ''
        }}
      />
      <div aria-live="polite" className="text-sm text-cyan-200">
        {message}
      </div>
      {photos.length > 0 ? (
        <ul className="grid grid-cols-2 gap-2">
          {photos.map((p) => (
            <li key={p.id}>
              <img src={p.dataUrl} alt="Baustellenfoto" className="h-28 w-full rounded-xl object-cover" />
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
