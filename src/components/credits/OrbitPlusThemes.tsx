import { useEffect, useState } from 'react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { boostCost, buyOrbitPlusTheme, getCredits, subscribeCredits } from '../../lib/credits'
import {
  ORBIT_PLUS_THEMES,
  getOrbitPlus,
  isThemeUnlocked,
  setActiveOrbitPlusTheme,
  subscribeOrbitPlus,
  type OrbitPlusThemeId,
} from '../../lib/orbitPlus'
import { useI18n } from '../../lib/i18n'

export function OrbitPlusThemes() {
  const { resolved } = useI18n()
  const de = resolved.startsWith('de')
  const [plus, setPlus] = useState(getOrbitPlus)
  const [balance, setBalance] = useState(getCredits().balance)
  const [flash, setFlash] = useState<string | null>(null)

  useEffect(() => subscribeOrbitPlus(() => setPlus(getOrbitPlus())), [])
  useEffect(() => subscribeCredits(() => setBalance(getCredits().balance)), [])

  const unlock = (id: OrbitPlusThemeId) => {
    void buyOrbitPlusTheme(id).then((ok) => {
      setFlash(
        ok
          ? de
            ? 'Theme freigeschaltet — kein echtes Geld.'
            : 'Theme unlocked — not real money.'
          : de
            ? 'Nicht genug Credits oder bereits frei.'
            : 'Not enough credits or already unlocked.',
      )
      window.setTimeout(() => setFlash(null), 2200)
    })
  }

  return (
    <section className="space-y-3 rounded-2xl border border-border bg-surface-2 p-4" data-orbit-plus-themes="1">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Allda+</h2>
        <Badge tone="teal">{balance} Credits</Badge>
      </div>
      <p className="text-xs text-muted">
        {de
          ? 'Kosmetische Profil-/Accent-Themes — Allda Credits, kein Auszahlungsanspruch.'
          : 'Cosmetic profile/accent themes — Allda Credits, no cash-out.'}
      </p>
      {flash && <p className="text-xs text-[var(--theme-accent)]">{flash}</p>}
      <ul className="grid gap-2 sm:grid-cols-3">
        {ORBIT_PLUS_THEMES.map((theme) => {
          const unlocked = isThemeUnlocked(theme.id)
          const active = plus.active === theme.id
          const cost = boostCost('orbit_plus_theme')
          return (
            <li
              key={theme.id}
              className="flex flex-col gap-2 rounded-xl border border-border/80 bg-black/10 p-3"
            >
              <span className="text-2xl" aria-hidden>
                {theme.emoji}
              </span>
              <span className="text-sm font-medium">{de ? theme.labelDe : theme.labelEn}</span>
              {unlocked ? (
                <Button
                  size="sm"
                  variant={active ? 'primary' : 'secondary'}
                  onClick={() => setActiveOrbitPlusTheme(active ? null : theme.id)}
                >
                  {active ? (de ? 'Aktiv' : 'Active') : de ? 'Aktivieren' : 'Activate'}
                </Button>
              ) : (
                <Button
                  size="sm"
                  disabled={balance < cost}
                  onClick={() => unlock(theme.id)}
                >
                  {de ? 'Freischalten' : 'Unlock'} (−{cost})
                </Button>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
