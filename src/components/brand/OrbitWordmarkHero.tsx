import { cn } from '../../lib/utils'

const base = () => import.meta.env.BASE_URL

/** Home background watermark — full-area Allda mark, readable content stays on top. */
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
        className="orbit-brand-watermark__mark absolute left-1/2 top-[38%] h-[min(105vw,28rem)] w-[min(105vw,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-[2.5rem] object-cover opacity-[0.32] md:h-[32rem] md:w-[32rem] md:opacity-[0.36]"
      />
      <span className="orbit-brand-watermark__ring absolute left-1/2 top-[38%] h-[min(92vw,24rem)] w-[min(92vw,24rem)] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--theme-accent)]/35 md:h-[28rem] md:w-[28rem]" />
    </div>
  )
}
