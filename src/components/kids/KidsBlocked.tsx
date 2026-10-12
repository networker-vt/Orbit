import { GraduationCap, Shield } from 'lucide-react'
import { Button, ButtonLink } from '../ui/Button'
import { useI18n } from '../../lib/i18n'

export function KidsBlocked({
  title,
  hint,
  onAskParent,
}: {
  title?: string
  hint?: string
  onAskParent?: () => void
}) {
  const { t } = useI18n()
  return (
    <div className="rounded-2xl border border-border bg-surface-2/70 p-5" data-kids-blocked="1">
      <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[var(--theme-accent)]">
        <Shield size={14} /> Allda Kids
      </p>
      <h2 className="mt-2 text-lg font-semibold text-ink">{title || t('kids.blockedTitle')}</h2>
      <p className="mt-1 text-sm text-muted">{hint || t('kids.blockedHint')}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <ButtonLink to="/campus" variant="secondary">
          <GraduationCap size={16} /> {t('campus.nav')}
        </ButtonLink>
        {onAskParent && (
          <Button variant="tonal" onClick={onAskParent}>
            {t('kids.askParent')}
          </Button>
        )}
      </div>
    </div>
  )
}
