import { cn } from '../../lib/utils'
import { ORBIT_BRAND, ORBIT_TAGLINE_DE } from '../../data/industries'

const base = () => import.meta.env.BASE_URL

export function BrandMark({
  compact = false,
  className,
}: {
  compact?: boolean
  className?: string
}) {
  const logo = `${base()}icons/orbit-logo.png`
  if (compact) {
    return (
      <span className={cn('flex items-center gap-2', className)}>
        <img
          src={logo}
          alt=""
          className="h-8 w-8 rounded-lg border border-cyan/25 object-cover"
        />
        <span className="leading-tight">
          <span className="block font-bold tracking-tight text-ink">{ORBIT_BRAND}</span>
          <span className="hidden text-xs uppercase tracking-wider text-cyan sm:block">
            Für jeden Job
          </span>
        </span>
      </span>
    )
  }
  return (
    <span className={cn('flex items-center gap-2', className)}>
      <img
        src={logo}
        alt={ORBIT_BRAND}
        className="h-9 w-9 rounded-xl border border-cyan/25 object-cover md:h-10 md:w-10"
      />
      <span className="leading-tight">
        <span className="block font-bold tracking-tight text-ink">{ORBIT_BRAND}</span>
        <span className="block max-w-[11rem] truncate text-xs text-cyan">{ORBIT_TAGLINE_DE}</span>
      </span>
    </span>
  )
}

export function BrandIcon({ className, size = 36 }: { className?: string; size?: number }) {
  return (
    <img
      src={`${base()}icons/orbit-logo.png`}
      alt={ORBIT_BRAND}
      width={size}
      height={size}
      className={cn(
        'rounded-xl border border-cyan/25 object-cover shadow-[0_0_18px_color-mix(in_oklab,var(--theme-accent)_18%,transparent)]',
        className,
      )}
    />
  )
}
