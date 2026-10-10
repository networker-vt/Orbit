import { UserRound } from 'lucide-react'
import { cn } from '../../lib/utils'

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
}

export function UserProfileMark({
  name,
  avatarUrl,
  compact = false,
  className,
}: {
  name: string
  avatarUrl?: string
  compact?: boolean
  className?: string
}) {
  const size = compact ? 'h-9 w-9' : 'h-10 w-10'
  return (
    <span className={cn('flex min-w-0 items-center gap-2.5', className)}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          className={cn(size, 'shrink-0 rounded-full border border-border object-cover')}
        />
      ) : (
        <span
          className={cn(
            size,
            'flex shrink-0 items-center justify-center rounded-full border border-border bg-surface-3 text-sm font-semibold text-ink',
          )}
          aria-hidden
        >
          {name.trim() ? initials(name) : <UserRound size={compact ? 18 : 20} className="text-muted" />}
        </span>
      )}
      <span className="min-w-0 truncate font-bold tracking-tight text-ink">{name}</span>
    </span>
  )
}
