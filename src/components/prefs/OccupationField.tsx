import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { QUICK_OCCUPATION_GROUPS } from '../../data/occupationGroups'
import type { OccupationEntry, OccupationLayer, OccupationSelection } from '../../data/occupations.catalog'
import { cn } from '../../lib/utils'

type CatalogModule = typeof import('../../data/occupations.catalog')

const LAYER_LABEL: Record<OccupationLayer, string> = {
  welt: 'Weltweit',
  de: 'Deutschland',
  weitere: 'Weitere Lebensbereiche',
}

function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'min-h-10 rounded-full border px-3 py-1.5 text-xs font-medium',
        active
          ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/15 text-ink'
          : 'border-border bg-black/20 text-neutral-300',
      )}
    >
      {children}
    </button>
  )
}

/**
 * Search first. Quick groups only until the person types.
 * The catalog itself is loaded with import(), not the main chunk.
 */
export function OccupationField({
  selectedIds,
  other,
  onChange,
  mode = 'multi',
}: {
  selectedIds: string[]
  other: string
  onChange: (next: OccupationSelection) => void
  mode?: 'multi' | 'single'
}) {
  const [catalog, setCatalog] = useState<CatalogModule | null>(null)
  const [query, setQuery] = useState('')
  const [openGroup, setOpenGroup] = useState<string | null>(null)

  useEffect(() => {
    let cancel = false
    void import('../../data/occupations.catalog').then((mod) => {
      if (!cancel) setCatalog(mod)
    })
    return () => {
      cancel = true
    }
  }, [])

  const selected = useMemo(() => {
    if (!catalog) return []
    return catalog.OCCUPATIONS.filter((entry) => selectedIds.includes(entry.id))
  }, [catalog, selectedIds])

  const emit = (ids: string[], nextOther = other) => {
    if (!catalog) return
    onChange(catalog.selectionFromIds(ids, nextOther))
  }

  const toggle = (entry: OccupationEntry) => {
    if (mode === 'single') {
      emit(selectedIds.includes(entry.id) ? [] : [entry.id], '')
      return
    }
    const next = selectedIds.includes(entry.id)
      ? selectedIds.filter((id) => id !== entry.id)
      : [...selectedIds, entry.id]
    emit(next)
  }

  const queryHits = catalog && query.trim().length >= 2 ? catalog.searchOccupations(query) : []
  const groupEntries =
    catalog && openGroup && query.trim().length < 2 ? catalog.occupationsInGroup(openGroup) : []
  const visible = query.trim().length >= 2 ? queryHits : groupEntries

  const layers = (['welt', 'de', 'weitere'] as const).filter((layer) =>
    visible.some((entry) => entry.layer === layer),
  )

  return (
    <div className="space-y-3" data-occupation-field="1">
      <label className="block text-sm font-semibold">
        Beruf suchen
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            if (e.target.value.trim().length >= 2) setOpenGroup(null)
          }}
          placeholder="z. B. Pflege, Verkauf, Buchhaltung"
          className="mt-1 w-full min-h-11 rounded-xl border border-border bg-surface-3 px-3 text-sm text-ink outline-none focus:border-[var(--theme-accent)]/50"
          autoComplete="off"
        />
      </label>

      {query.trim().length < 2 && (
        <div className="flex flex-wrap gap-2" data-occupation-quick="1">
          {QUICK_OCCUPATION_GROUPS.map((group) => (
            <Chip key={group} active={openGroup === group} onClick={() => setOpenGroup(openGroup === group ? null : group)}>
              {group}
            </Chip>
          ))}
        </div>
      )}

      {!catalog && <p className="text-xs text-muted">Berufe werden geladen…</p>}

      {layers.map((layer) => (
        <div key={layer}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{LAYER_LABEL[layer]}</h3>
          <div className="flex flex-wrap gap-2">
            {visible
              .filter((entry) => entry.layer === layer)
              .map((entry) => (
                <Chip key={entry.id} active={selectedIds.includes(entry.id)} onClick={() => toggle(entry)}>
                  {entry.label}
                </Chip>
              ))}
          </div>
        </div>
      ))}

      {catalog && query.trim().length >= 2 && queryHits.length === 0 && (
        <button
          type="button"
          className="min-h-10 text-left text-sm text-[var(--theme-accent)] hover:underline"
          onClick={() => emit(mode === 'single' ? [] : selectedIds, query.trim())}
        >
          Sonstiges: „{query.trim()}“ übernehmen
        </button>
      )}

      {(selected.length > 0 || other.trim()) && (
        <div className="flex flex-wrap gap-2" data-occupation-selected="1">
          {selected.map((entry) => (
            <Chip key={entry.id} active onClick={() => toggle(entry)}>
              {entry.label} ×
            </Chip>
          ))}
          {other.trim() && (
            <Chip active onClick={() => emit(selectedIds, '')}>
              Sonstiges: {other.trim()} ×
            </Chip>
          )}
        </div>
      )}
    </div>
  )
}
