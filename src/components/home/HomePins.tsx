import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getHomePins, subscribeHomePins, type HomePin } from '../../lib/homePins'
import { useI18n } from '../../lib/i18n'

/**
 * Home slot for Mein Orbit Schnellzugriffe.
 * Renders nothing when empty so presets / news / Mehr Entdecken stay primary.
 * Writers: `src/lib/homePins.ts` (`orbit_home_pins_v1`).
 */
export function HomePins() {
  const { t } = useI18n()
  const [pins, setPins] = useState<HomePin[]>(getHomePins)

  useEffect(() => subscribeHomePins(() => setPins(getHomePins())), [])

  if (pins.length === 0) {
    return <div data-home-pins="0" hidden aria-hidden="true" />
  }

  return (
    <section className="space-y-2" aria-labelledby="home-pins" data-home-pins={pins.length}>
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="home-pins" className="text-xs font-medium uppercase tracking-wider text-muted">
          {t('home.pinsTitle')}
        </h2>
        <Link to="/mein#schnellzugriffe" className="text-xs text-muted hover:text-ink">
          {t('home.pinsEdit')}
        </Link>
      </div>
      <ul className="flex flex-wrap gap-2" data-home-pins-list="1">
        {pins.map((pin) => (
          <li key={pin.id}>
            <Link
              to={pin.to}
              data-home-pin={pin.id}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-surface-2 px-3 py-1.5 text-sm text-ink hover:border-[var(--theme-accent)]/45"
            >
              {pin.emoji ? <span aria-hidden>{pin.emoji}</span> : null}
              <span>{pin.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
