import { listLedgerEvents } from '../../lib/creditLedger'
import { formatDateTime } from '../../lib/utils'

type Props = {
  limit?: number
  className?: string
}

/** Ledger „Rechnung“ rows — Beleg-ID = txn_id (append-only). */
export function CreditsBelegList({ limit = 12, className }: Props) {
  const rows = listLedgerEvents()
    .slice()
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit)

  if (!rows.length) {
    return <p className="text-sm text-muted">Noch keine Belege — Grants und Boosts erscheinen hier.</p>
  }

  return (
    <ul className={className ?? 'divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface-2 text-sm'}>
      {rows.map((e) => (
        <li key={e.txn_id} className="flex flex-col gap-0.5 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{e.label}</p>
            <p className="font-mono text-[10px] text-muted" title="Beleg-ID">
              {e.txn_id}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3 tabular-nums text-xs">
            <span className={e.delta >= 0 ? 'text-teal' : 'text-amber-200'}>
              {e.delta >= 0 ? '+' : ''}
              {e.delta}
            </span>
            <span className="text-muted">{formatDateTime(e.created_at)}</span>
          </div>
        </li>
      ))}
    </ul>
  )
}
