import { Link } from 'react-router-dom'
import { useRef, useState } from 'react'
import { ArrowLeft, Camera, ImageIcon } from 'lucide-react'
import { OrbitRobot } from '../../components/home/OrbitRobot'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { DemoOnboardingBanner } from '../../components/onboarding/DemoOnboardingBanner'
import { useI18n } from '../../lib/i18n'
import { explainPhotoStub, type EntdeckerExplain } from '../../lib/entdecker'
import { recordNatureExplain } from '../../lib/kidsHub'

export function KidsNaturPage() {
  const { t, resolved } = useI18n()
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [explain, setExplain] = useState<EntdeckerExplain | null>(null)
  const [busy, setBusy] = useState(false)

  const onFile = (f: File | undefined) => {
    if (!f) return
    setFile(f)
    setExplain(null)
    setPreview(URL.createObjectURL(f))
  }

  const run = () => {
    if (!file) return
    setBusy(true)
    window.setTimeout(() => {
      setExplain(explainPhotoStub(file, resolved))
      recordNatureExplain()
      setBusy(false)
    }, 600)
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-scroll-chrome">
      <Link to="/kids" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft size={16} /> {t('kids.hub.back')}
      </Link>
      <DemoOnboardingBanner />
      <div className="flex items-center gap-3">
        <OrbitRobot motion="arbeiten" size="compact" />
        <div>
          <h1 className="text-xl font-bold">{t('kids.pillar.nature')}</h1>
          <p className="text-sm text-muted">{t('kids.natur.lead')}</p>
        </div>
      </div>
      <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
        {t('kids.natur.disclaimer')}
      </p>
      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={() => cameraRef.current?.click()}>
          <Camera size={16} /> {t('photo.camera')}
        </Button>
        <Button variant="secondary" className="flex-1" onClick={() => galleryRef.current?.click()}>
          <ImageIcon size={16} /> {t('photo.gallery')}
        </Button>
      </div>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
      <input ref={galleryRef} type="file" accept="image/*" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
      {preview && <img src={preview} alt="" className="max-h-64 w-full rounded-2xl border border-border object-cover" />}
      <Button onClick={run} disabled={!file || busy} className="w-full">
        {busy ? t('kids.natur.orbiThinking') : t('kids.natur.explain')}
      </Button>
      {explain && (
        <article className="space-y-2 rounded-2xl border border-border bg-surface-2 p-4">
          <div className="flex items-center gap-2">
            <Badge tone="cyan">{t('kids.natur.orbiSays')}</Badge>
            <Badge tone="amber">Demo</Badge>
          </div>
          <h2 className="text-lg font-semibold">{explain.title}</h2>
          <p className="text-sm text-ink-soft">{explain.body}</p>
        </article>
      )}
    </div>
  )
}
