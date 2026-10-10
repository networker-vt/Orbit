import { cn } from '../../lib/utils'

const base = () => import.meta.env.BASE_URL

/** Soft home watermark — Orbit mark only, no wordmark stack or tagline. */
export function OrbitWordmarkHero({ className }: { className?: string }) {
  const logo = `${base()}icons/orbit-logo.png`

  return (
    <div
      className={cn('orbit-brand-watermark pointer-events-none absolute inset-0 overflow-hidden', className)}
      aria-hidden
      data-orbi-watermark="1"
    >
      <img
        src={logo}
        alt=""
        className="orbit-brand-watermark__mark absolute -right-6 -top-4 h-[9.5rem] w-[9.5rem] rounded-[1.75rem] object-cover opacity-[0.06] blur-[0.3px] md:-right-4 md:-top-2 md:h-[11rem] md:w-[11rem] md:opacity-[0.08]"
      />
      <span className="orbit-brand-watermark__ring absolute -right-3 top-6 h-[8.5rem] w-[8.5rem] rounded-full border border-[var(--theme-accent)]/10 md:h-[10rem] md:w-[10rem]" />
    </div>
  )
}
