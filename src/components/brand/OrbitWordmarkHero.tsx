import { ORBIT_BRAND, ORBIT_TAGLINE_DE } from '../../data/industries'
import { useI18n } from '../../lib/i18n'
import { cn } from '../../lib/utils'

const base = () => import.meta.env.BASE_URL

/** Adult Home hero — Wortmarke + Ring-Logo, keine Orbi-Kind-Posen. */
export function OrbitWordmarkHero({ className }: { className?: string }) {
  const { t } = useI18n()
  const logo = `${base()}icons/orbit-logo.png`

  return (
    <div
      className={cn('orbit-wordmark-hero flex flex-col items-center gap-3 px-2 text-center', className)}
      data-orbi-wordmark="1"
      aria-hidden={false}
    >
      <div className="orbit-wordmark-hero__mark relative flex h-[4.5rem] w-[4.5rem] items-center justify-center md:h-20 md:w-20">
        <span className="orbit-wordmark-hero__ring absolute inset-0 rounded-full border-2 border-[var(--theme-accent)]/35" />
        <span className="orbit-wordmark-hero__ring orbit-wordmark-hero__ring--outer absolute -inset-1 rounded-full border border-cyan/20" />
        <img
          src={logo}
          alt=""
          className="relative z-[1] h-14 w-14 rounded-2xl border border-cyan/25 object-cover shadow-[0_0_24px_color-mix(in_oklab,var(--theme-accent)_22%,transparent)] md:h-16 md:w-16"
        />
      </div>
      <div className="space-y-0.5">
        <p className="text-lg font-bold tracking-tight text-ink md:text-xl">{ORBIT_BRAND}</p>
        <p className="text-xs uppercase tracking-[0.2em] text-cyan">{ORBIT_TAGLINE_DE}</p>
        <p className="sr-only">{t('brand.tagline')}</p>
      </div>
    </div>
  )
}
