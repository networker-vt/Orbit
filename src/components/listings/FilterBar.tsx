import { useState } from 'react'
import { CITIES } from '../../data/constants'
import { OccupationField } from '../prefs/OccupationField'
import type { ListingFilters, ListingKind, Vertical } from '../../types'
import { Input, Select } from '../ui/Input'
import { cn } from '../../lib/utils'

export function FilterBar({
  value,
  onChange,
  showVertical = true,
  showRate = false,
  sticky = false,
}: {
  value: ListingFilters
  onChange: (next: ListingFilters) => void
  showVertical?: boolean
  showRate?: boolean
  sticky?: boolean
}) {
  const [occupationIds, setOccupationIds] = useState<string[]>([])
  return (
    <div
      className={cn(
        'grid gap-2 rounded-2xl border border-border bg-surface-2 p-3 sm:grid-cols-2 lg:grid-cols-6',
        sticky && 'shadow-lg shadow-black/20',
      )}
    >
      <div className={showRate ? 'lg:col-span-2' : 'lg:col-span-2'}>
        <Input
          placeholder="Suche Titel, Tag, Anbieter…"
          value={value.q ?? ''}
          onChange={(e) => onChange({ ...value, q: e.target.value })}
        />
      </div>
      <Select
        value={value.city ?? ''}
        onChange={(e) => onChange({ ...value, city: e.target.value || undefined })}
      >
        <option value="">Alle Städte</option>
        {CITIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </Select>
      <div className="sm:col-span-2 lg:col-span-2">
        <OccupationField
          mode="single"
          selectedIds={occupationIds}
          other={occupationIds.length ? '' : value.craft ?? ''}
          onChange={(next) => {
            setOccupationIds(next.occupations)
            onChange({
              ...value,
              craft: next.labels[0] || next.occupationOther || undefined,
            })
          }}
        />
      </div>
      <Select
        value={value.kind ?? 'all'}
        onChange={(e) =>
          onChange({ ...value, kind: e.target.value as ListingKind | 'all' })
        }
      >
        <option value="all">Angebot + Gesuch</option>
        <option value="offer">Nur Angebote</option>
        <option value="request">Nur Gesuche</option>
      </Select>
      {showVertical ? (
        <Select
          value={value.vertical ?? 'all'}
          onChange={(e) =>
            onChange({ ...value, vertical: e.target.value as Vertical | 'all' })
          }
        >
          <option value="all">Alle Vertikalen</option>
          <option value="freelancer">Freelancer</option>
          <option value="company">Firmen</option>
          <option value="material">Material</option>
          <option value="transporter">Transporter</option>
          <option value="courier">Kuriere</option>
          <option value="hotel">Hotels</option>
          <option value="job">Jobs</option>
          <option value="partnership">Partnerschaften</option>
        </Select>
      ) : (
        <Input
          type="date"
          value={value.dateFrom ?? ''}
          onChange={(e) => onChange({ ...value, dateFrom: e.target.value || undefined })}
          aria-label="Datum ab"
        />
      )}
      {showRate && (
        <>
          <Select
            value={value.priceMin?.toString() ?? ''}
            onChange={(e) =>
              onChange({
                ...value,
                priceMin: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          >
            <option value="">Tagessatz ab</option>
            <option value="400">ab 400 € (Fachkraft)</option>
            <option value="500">ab 500 €</option>
            <option value="600">ab 600 € (Specialist)</option>
            <option value="700">ab 700 €</option>
          </Select>
          <Select
            value={value.priceMax?.toString() ?? ''}
            onChange={(e) =>
              onChange({
                ...value,
                priceMax: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          >
            <option value="">Tagessatz bis</option>
            <option value="500">bis 500 € (Fachkraft)</option>
            <option value="600">bis 600 €</option>
            <option value="800">bis 800 € (Specialist)</option>
            <option value="1000">bis 1.000 €</option>
          </Select>
        </>
      )}
    </div>
  )
}
