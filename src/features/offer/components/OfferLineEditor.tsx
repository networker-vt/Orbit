import { Check } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import type { OfferLineItem, OfferTaxRate } from '../types'

const UNITS: { label: string; code: string }[] = [
  { label: 'Stück', code: 'H87' },
  { label: 'Std', code: 'HUR' },
  { label: 'Tag', code: 'DAY' },
  { label: 'Pauschale', code: 'C62' },
  { label: 'm', code: 'MTR' },
]

const TAX_OPTIONS: { label: string; value: OfferTaxRate }[] = [
  { label: '19 %', value: 19 },
  { label: '7 %', value: 7 },
  { label: '0 %', value: 0 },
]

type Props = {
  line: OfferLineItem
  onChange: (line: OfferLineItem) => void
  onConfirm: () => void
}

export function OfferLineEditor({ line, onChange, onConfirm }: Props) {
  const unitIdx = UNITS.findIndex((u) => u.code === line.unitCode)
  return (
    <article
      className={`space-y-3 rounded-2xl border p-4 ${line.confirmed ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-border bg-surface-2'}`}
    >
      <label className="block text-sm">
        Beschreibung
        <input
          className="mt-1 min-h-12 w-full rounded-xl border border-border bg-surface-3 px-3 text-base"
          value={line.description}
          onChange={(e) => onChange({ ...line, description: e.target.value, confirmed: false })}
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm">
          Menge
          <input
            type="number"
            min={0}
            step="any"
            className="mt-1 min-h-12 w-full rounded-xl border border-border bg-surface-3 px-3 text-base"
            value={line.quantity}
            onChange={(e) =>
              onChange({ ...line, quantity: Number(e.target.value) || 0, confirmed: false })
            }
          />
        </label>
        <label className="block text-sm">
          Einheit
          <select
            className="mt-1 min-h-12 w-full rounded-xl border border-border bg-surface-3 px-3 text-base"
            value={unitIdx >= 0 ? unitIdx : 0}
            onChange={(e) => {
              const u = UNITS[Number(e.target.value)] ?? UNITS[0]
              onChange({ ...line, unit: u.label, unitCode: u.code, confirmed: false })
            }}
          >
            {UNITS.map((u, i) => (
              <option key={u.code} value={i}>
                {u.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm">
          Einzelpreis netto (EUR)
          <input
            type="number"
            min={0}
            step="0.01"
            className="mt-1 min-h-12 w-full rounded-xl border border-border bg-surface-3 px-3 text-base"
            value={line.unitPriceNet}
            onChange={(e) =>
              onChange({ ...line, unitPriceNet: Number(e.target.value) || 0, confirmed: false })
            }
          />
        </label>
        <label className="block text-sm">
          Umsatzsteuer
          <select
            className="mt-1 min-h-12 w-full rounded-xl border border-border bg-surface-3 px-3 text-base"
            value={line.taxRate === null ? '' : line.taxRate}
            onChange={(e) => {
              const v = e.target.value
              onChange({
                ...line,
                taxRate: v === '' ? null : (Number(v) as OfferTaxRate),
                confirmed: false,
              })
            }}
          >
            <option value="">Bitte wählen</option>
            {TAX_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <Button
        type="button"
        size="lg"
        className="w-full min-h-12"
        variant={line.confirmed ? 'secondary' : 'primary'}
        onClick={onConfirm}
      >
        <Check size={18} aria-hidden />
        {line.confirmed ? 'Bestätigt' : 'Position bestätigen'}
      </Button>
    </article>
  )
}
