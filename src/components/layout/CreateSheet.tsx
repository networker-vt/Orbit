import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Briefcase, Camera, Car, HelpCircle, Package, RefreshCw, Timer, Wrench, X } from 'lucide-react'
import { useI18n } from '../../lib/i18n'

type Props = {
  open: boolean
  onClose: () => void
}

export function CreateSheet({ open, onClose }: Props) {
  const navigate = useNavigate()
  const { t } = useI18n()

  const options = [
    {
      to: '/listings/new?intent=job',
      label: t('create.job'),
      hint: t('create.jobHint'),
      icon: Briefcase,
      accent: 'text-cyan border-cyan/40 bg-cyan/10',
    },
    {
      to: '/listings/new?intent=minijob',
      label: t('create.minijob'),
      hint: t('create.minijobHint'),
      icon: Timer,
      accent: 'text-teal border-teal/40 bg-teal/10',
    },
    {
      to: '/listings/new?intent=service',
      label: t('create.service'),
      hint: t('create.serviceHint'),
      icon: Wrench,
      accent: 'text-teal border-teal/40 bg-teal/10',
    },
    {
      to: '/listings/new?intent=courier',
      label: t('create.courier'),
      hint: t('create.courierHint'),
      icon: Package,
      accent: 'text-cyan border-cyan/40 bg-cyan/10',
    },
    {
      to: '/listings/new?intent=ride',
      label: t('create.ride'),
      hint: t('create.rideHint'),
      icon: Car,
      accent: 'text-amber-200 border-amber-500/40 bg-amber-500/10',
    },
    {
      to: '/match?lane=sell&photo=1&photoMode=sell',
      label: t('sell.cta'),
      hint: t('create.sellHint'),
      icon: Camera,
      accent: 'text-cyan border-cyan/40 bg-cyan/10',
    },
    {
      to: '/match?lane=barter&photo=1&photoMode=barter',
      label: t('photoTrade.cta'),
      hint: t('photoTrade.lead'),
      icon: RefreshCw,
      accent: 'text-violet-300 border-violet-500/40 bg-violet-500/10',
    },
    {
      to: '/listings/new?intent=barter',
      label: t('create.barter'),
      hint: t('create.barterHint'),
      icon: RefreshCw,
      accent: 'text-violet-300/80 border-violet-500/30 bg-violet-500/5',
    },
    {
      to: '/listings/new?intent=need',
      label: t('create.need'),
      hint: t('create.needHint'),
      icon: HelpCircle,
      accent: 'text-amber-300 border-amber-500/40 bg-amber-500/10',
    },
  ]

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

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={t('nav.create')}>
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label={t('create.close')}
        onClick={onClose}
      />
      <div className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto safe-pb rounded-t-3xl border border-border bg-surface-2 p-4 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink">{t('nav.create')}</h2>
            <p className="text-xs text-muted">{t('create.lead')}</p>
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
        <div className="space-y-2 pb-2">
          {options.map((opt) => (
            <button
              key={opt.to}
              type="button"
              onClick={() => {
                onClose()
                navigate(opt.to)
              }}
              className={`flex w-full min-h-14 items-center gap-3 rounded-2xl border px-4 py-3 text-left transition active:scale-[0.98] ${opt.accent}`}
            >
              <opt.icon size={22} />
              <span>
                <span className="block font-semibold text-ink">{opt.label}</span>
                <span className="block text-xs text-neutral-300">{opt.hint}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
