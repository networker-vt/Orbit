import { cn } from '../../lib/utils'

const base = () => import.meta.env.BASE_URL

/** Home background watermark — full-area Orbit mark, readable content stays on top. */
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
        className="orbit-brand-watermark__mark absolute left-1/2 top-[42%] h-[min(88vw,22rem)] w-[min(88vw,22rem)] -translate-x-1/2 -translate-y-1/2 rounded-[2.5rem] object-cover opacity-[0.14] md:h-[26rem] md:w-[26rem] md:opacity-[0.16]"
      />
      <span className="orbit-brand-watermark__ring absolute left-1/2 top-[42%] h-[min(76vw,19rem)] w-[min(76vw,19rem)] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--theme-accent)]/20 md:h-[22rem] md:w-[22rem]" />
    </div>
  )
}
