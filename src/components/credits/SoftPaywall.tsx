import { Button, ButtonLink } from '../ui/Button'
import { CREDITS_FREE_DE, CREDITS_FREE_EN } from '../../lib/credits'
import { useI18n } from '../../lib/i18n'
import { isFlagOn } from '../../lib/flags'
import { kidsHideSoftPaywall } from '../../lib/kids'

/** Soft paywall — only at money moments (boosts, extra swipes, travel deep, priority interview). */
export function SoftPaywall({
  title,
  hint,
  cost,
  onBuy,
  onClose,
  walletTo = '/wallet',
}: {
  title: string
  hint?: string
  cost: number
  onBuy: () => void
  onClose: () => void
  walletTo?: string
}) {
  const { t, resolved } = useI18n()
  if (!isFlagOn('credits')) return null
  if (kidsHideSoftPaywall()) {
    return (
      <div className="fixed inset-x-4 bottom-28 z-40 mx-auto max-w-sm rounded-2xl border border-border bg-surface-2 p-4 shadow-xl md:bottom-8">
        <p className="text-sm font-semibold text-ink">{t('kids.paywallQuiet')}</p>
        <div className="mt-3 flex flex-col gap-2">
          <Button size="sm" variant="secondary" className="w-full" onClick={onClose}>
            {t('paywall.later')}
          </Button>
        </div>
      </div>
    )
  }
  const free = resolved === 'de' ? CREDITS_FREE_DE : CREDITS_FREE_EN
  return (
    <div className="fixed inset-x-4 bottom-28 z-40 mx-auto max-w-sm rounded-2xl border border-violet-400/40 bg-surface-2 p-4 shadow-xl md:bottom-8">
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="mt-1 text-xs text-muted">{hint || t('paywall.hint')}</p>
      <p className="mt-2 text-xs text-neutral-400">{t('paywall.freeLane')}</p>
      <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-neutral-400">
        {free.slice(0, 4).map((row) => (
          <li key={row}>{row}</li>
        ))}
      </ul>
      <div className="mt-3 flex flex-col gap-2">
        <Button size="sm" className="w-full" onClick={onBuy}>
          {t('paywall.buy')} · {cost} Credits
        </Button>
        <p className="text-center text-[11px] text-muted">{t('demo.bannerBody')}</p>
        <ButtonLink to={walletTo} size="sm" variant="secondary" className="w-full">
          {t('paywall.wallet')}
        </ButtonLink>
        <Button type="button" size="sm" variant="ghost" onClick={onClose}>
          {t('paywall.later')}
        </Button>
      </div>
    </div>
  )
}
