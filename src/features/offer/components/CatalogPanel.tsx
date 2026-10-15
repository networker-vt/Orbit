import { useEffect, useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { ensureDefaultCatalog } from '../offerDb'
import type { CatalogItem, OfferLineItem } from '../types'

function lineId() {
  return `ln-${Math.random().toString(36).slice(2, 10)}`
}

export function CatalogPanel({ onAddLine }: { onAddLine: (line: OfferLineItem) => void }) {
  const [items, setItems] = useState<CatalogItem[]>([])

  useEffect(() => {
    void ensureDefaultCatalog().then(setItems)
  }, [])

  return (
    <section className="space-y-3 rounded-2xl border border-border bg-surface-2 p-4" aria-labelledby="catalog-heading">
      <h2 id="catalog-heading" className="text-lg font-semibold text-ink">
        Leistungs- / Materialliste
      </h2>
      <p className="text-sm text-muted">
        Feste Preise antippen — Positionen werden ins Angebot übernommen. Steuersatz wählen Sie selbst (nie
        automatisch).
      </p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <Button
              type="button"
              variant="secondary"
              className="min-h-14 w-full justify-between px-4"
              onClick={() =>
                onAddLine({
                  id: lineId(),
                  quantity: 1,
                  unit: item.unit,
                  unitCode: item.unitCode,
                  description: item.label,
                  unitPriceNet: item.unitPriceNet,
                  taxRate: null,
                  confirmed: false,
                })
              }
            >
              <span className="text-left">{item.label}</span>
              <span className="tabular-nums">{item.unitPriceNet.toFixed(2)} €</span>
            </Button>
          </li>
        ))}
      </ul>
    </section>
  )
}
