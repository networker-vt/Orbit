import { formatSupplyLine, getProtocol, supplyMeterPct, wertIndex } from '../../lib/creditProtocol'
import { MAX_SUPPLY } from '../../lib/credits'
import { cn } from '../../lib/utils'

export function SupplyMeter({ className }: { className?: string }) {
  const p = getProtocol()
  const pct = supplyMeterPct(p)
  const wert = wertIndex(p)
  const reservePct = Math.min(100, (p.remainingReserve / MAX_SUPPLY) * 100)

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-semibold tabular-nums text-ink">{formatSupplyLine(p)}</p>
        <p className="text-xs text-muted">Cap 21.000.000</p>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-black/40"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={MAX_SUPPLY}
        aria-valuenow={p.circulating}
        aria-label="Allda Credits im Umlauf"
      >
        <div className="h-full rounded-full bg-violet-400" style={{ width: `${Math.max(pct, 0.4)}%` }} />
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-300">
        <span>
          Reserve {p.remainingReserve.toLocaleString('de-DE')} ({reservePct.toFixed(1)} %)
        </span>
        <span>Burned {p.burned.toLocaleString('de-DE')}</span>
        <span>P2P-Float {p.p2pFloat.toLocaleString('de-DE')}</span>
      </div>
      <div className="rounded-lg border border-violet-400/25 bg-black/20 px-3 py-2">
        <p className="text-xs uppercase tracking-wider text-violet-200">Wert-Index (Stub)</p>
        <p className="text-xl font-bold tabular-nums text-ink">{wert.value.toLocaleString('de-DE')}</p>
        <p className="text-xs text-muted">
          {wert.activeUsers.toLocaleString('de-DE')} aktive Nutzer (Demo) · {wert.formula}
        </p>
      </div>
    </div>
  )
}
