import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, ImageIcon, X } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useAuth } from '../../lib/auth'
import { useI18n } from '../../lib/i18n'
import { store } from '../../lib/store'
import { DEMO_USER_ID, seedProfiles } from '../../data/seed'
import {
  CONDITION_LABELS_DE,
  CONDITION_LABELS_EN,
  ITEM_CONDITIONS,
  hasLiveSellVision,
  proposeSellFromPhoto,
  type SellProposal,
} from '../../lib/sellByPhoto'
import type { ItemCondition } from '../../types'
import { cn } from '../../lib/utils'

type Props = {
  open: boolean
  onClose: () => void
}

type Draft = {
  title: string
  description: string
  condition: ItemCondition
  category: string
  priceHintEur: number
}

export function SellByPhotoSheet({ open, onClose }: Props) {
  const { t, resolved } = useI18n()
  const navigate = useNavigate()
  const { user, profile, loginDemo } = useAuth()
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [proposal, setProposal] = useState<SellProposal | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const live = hasLiveSellVision()
  const condLabels = resolved === 'de' ? CONDITION_LABELS_DE : CONDITION_LABELS_EN

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  useEffect(() => {
    if (open) return
    setPreview(null)
    setProposal(null)
    setDraft(null)
    setConfirmed(false)
    setBusy(false)
  }, [open])

  if (!open) return null

  const onFile = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    setProposal(null)
    setDraft(null)
    setConfirmed(false)
    const url = URL.createObjectURL(file)
    setPreview(url)
    const next = await proposeSellFromPhoto(file)
    setProposal(next)
    setDraft({
      title: next.title,
      description: next.description,
      condition: next.condition,
      category: next.category,
      priceHintEur: next.priceHintEur,
    })
    setBusy(false)
  }

  const publish = () => {
    if (!draft || !confirmed || !draft.title.trim()) return
    let u = user
    let p = profile
    if (!u || !p) {
      loginDemo()
      const demo = seedProfiles.find((x) => x.id === DEMO_USER_ID)!
      u = { id: demo.id, email: demo.email, name: demo.name, role: demo.role }
      p = demo
    }
    const listing = store.createListing({
      kind: 'offer',
      vertical: 'material',
      marketType: 'sell',
      title: draft.title.trim(),
      description: draft.description.trim() || draft.title.trim(),
      city: p.city || 'Köln',
      crafts: [draft.category],
      priceFrom: draft.priceHintEur,
      priceUnit: 'Stück',
      currency: 'EUR',
      ownerId: u.id,
      ownerName: u.name,
      ownerVerified: p.verified,
      rating: p.rating,
      tags: ['Verkauf', 'Foto', draft.category, draft.condition],
      offerTags: [draft.category, draft.condition],
      imageEmoji: '📷',
      industry: draft.category,
      itemCondition: draft.condition,
      source: proposal?.source === 'vision' ? 'Orbit Vision' : 'Orbit Foto-Demo',
      sellerKind: 'private',
      matchReason: 'Foto-Verkauf · user-confirmed',
    })
    onClose()
    navigate(`/listings/${listing.id}`)
  }

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={t('sell.title')} data-sell-sheet="1">
      <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-label={t('create.close')} onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 max-h-[92dvh] overflow-y-auto safe-pb rounded-t-3xl border border-border bg-surface-2 p-4 shadow-2xl">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-ink">{t('sell.title')}</h2>
            <p className="text-xs text-muted">{t('sell.lead')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="tap-target flex h-10 w-10 items-center justify-center rounded-full border border-border text-neutral-400"
            aria-label={t('create.close')}
          >
            <X size={18} />
          </button>
        </div>

        <p
          className={cn(
            'mb-3 rounded-xl border px-3 py-2 text-xs',
            live ? 'border-teal/40 bg-teal/10 text-teal-100' : 'border-amber-500/40 bg-amber-500/10 text-amber-100',
          )}
          data-sell-vision={live ? 'live' : 'stub'}
        >
          {live ? t('sell.visionLive') : t('sell.visionStub')}
        </p>

        <div className="mb-3 flex gap-2">
          <Button variant="secondary" className="flex-1" type="button" onClick={() => cameraRef.current?.click()}>
            <Camera size={16} /> {t('photo.camera')}
          </Button>
          <Button variant="secondary" className="flex-1" type="button" onClick={() => galleryRef.current?.click()}>
            <ImageIcon size={16} /> {t('photo.gallery')}
          </Button>
        </div>
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          data-sell-camera="1"
          onChange={(e) => void onFile(e.target.files?.[0])}
        />
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          className="sr-only"
          data-sell-gallery="1"
          onChange={(e) => void onFile(e.target.files?.[0])}
        />

        {preview && (
          <img src={preview} alt="" className="mb-3 max-h-48 w-full rounded-2xl border border-border object-cover" />
        )}

        {busy && <p className="mb-3 text-sm text-muted">{t('sell.analyzing')}</p>}

        {proposal && draft && (
          <div className="space-y-3" data-sell-confirm="1">
            <p className="text-xs text-muted">{resolved === 'de' ? proposal.disclaimerDe : proposal.disclaimerEn}</p>
            <Input
              label={t('sell.fieldTitle')}
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
            <label className="block space-y-1 text-sm">
              <span className="text-muted">{t('sell.fieldDesc')}</span>
              <textarea
                className="min-h-20 w-full rounded-xl border border-border bg-black/20 px-3 py-2 text-sm text-ink"
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="text-muted">{t('sell.fieldCondition')}</span>
              <select
                className="min-h-11 w-full rounded-xl border border-border bg-black/20 px-3 text-sm text-ink"
                value={draft.condition}
                onChange={(e) => setDraft({ ...draft, condition: e.target.value as ItemCondition })}
              >
                {ITEM_CONDITIONS.map((c) => (
                  <option key={c} value={c}>
                    {condLabels[c]}
                  </option>
                ))}
              </select>
            </label>
            <Input
              label={t('sell.fieldCategory')}
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
            />
            <Input
              label={t('sell.fieldPrice')}
              type="number"
              min={1}
              step={1}
              value={String(draft.priceHintEur)}
              onChange={(e) => setDraft({ ...draft, priceHintEur: Number(e.target.value) || 2 })}
            />
            <label className="flex items-start gap-2 rounded-xl border border-border bg-black/20 px-3 py-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={confirmed}
                data-sell-confirm-check="1"
                onChange={(e) => setConfirmed(e.target.checked)}
              />
              <span>{t('sell.confirmCheck')}</span>
            </label>
            <Button
              type="button"
              className="w-full"
              disabled={!confirmed || !draft.title.trim()}
              data-sell-publish="1"
              onClick={publish}
            >
              {t('sell.publish')}
            </Button>
            <p className="text-center text-xs text-muted">{t('sell.noSilent')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
