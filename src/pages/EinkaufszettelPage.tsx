import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ListChecks, Plus, ShoppingCart, Sparkles } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import {
  addShoppingItem,
  clearCheckedShopping,
  listShoppingItems,
  removeShoppingItem,
  subscribeShoppingList,
  toggleShoppingItem,
} from '../lib/einkaufszettel'
import { searchOffersForList, osmSupermarketUrl } from '../lib/offerSearch'
import { getPrefs, subscribePrefs } from '../lib/prefs'
import { readGeoPosition } from '../lib/geo'
import { useI18n } from '../lib/i18n'

export function EinkaufszettelPage() {
  const { t, resolved } = useI18n()
  const [items, setItems] = useState(listShoppingItems)
  const [newItem, setNewItem] = useState('')
  const [lifeSentence, setLifeSentence] = useState(() => getPrefs().seeker.lifeSentence)
  const [offersLoading, setOffersLoading] = useState(false)
  const [offers, setOffers] = useState<Awaited<ReturnType<typeof searchOffersForList>> | null>(null)
  const [storeUrl, setStoreUrl] = useState(osmSupermarketUrl())

  useEffect(() => subscribeShoppingList(() => setItems(listShoppingItems())), [])
  useEffect(() => subscribePrefs(() => setLifeSentence(getPrefs().seeker.lifeSentence)), [])

  useEffect(() => {
    void readGeoPosition()
      .then(({ lat, lon }) => setStoreUrl(osmSupermarketUrl(lat, lon)))
      .catch(() => setStoreUrl(osmSupermarketUrl()))
  }, [])

  const uncheckedTexts = useMemo(
    () => items.filter((i) => !i.checked).map((i) => i.text),
    [items],
  )

  const searchOffers = async () => {
    setOffersLoading(true)
    const ac = new AbortController()
    try {
      const result = await searchOffersForList(uncheckedTexts, lifeSentence, resolved, ac.signal)
      setOffers(result)
    } finally {
      setOffersLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-5 pb-scroll-chrome pt-4" data-einkauf-page="1">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-amber-200">{t('daily.stubBadge')}</p>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-ink">
          <ShoppingCart size={22} aria-hidden />
          {t('daily.einkaufTitle')}
        </h1>
        <p className="text-sm text-muted">{t('daily.einkaufLead')}</p>
        <Link to="/essen" className="text-sm text-[var(--theme-accent)] hover:underline">
          {t('daily.einkaufEssenLink')}
        </Link>
      </header>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          addShoppingItem(newItem)
          setNewItem('')
        }}
      >
        <Input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder={t('daily.einkaufPlaceholder')}
          data-einkauf-input="1"
          className="flex-1"
        />
        <Button type="submit" aria-label={t('daily.einkaufAdd')}>
          <Plus size={18} />
        </Button>
      </form>

      <ul className="space-y-2" data-einkauf-list="1">
        {items.length === 0 && <li className="text-sm text-muted">{t('daily.einkaufEmpty')}</li>}
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-2 rounded-2xl border border-border bg-surface-2 px-3 py-2">
            <input
              type="checkbox"
              checked={item.checked}
              onChange={() => toggleShoppingItem(item.id)}
              aria-label={item.text}
            />
            <span className={item.checked ? 'flex-1 text-sm text-muted line-through' : 'flex-1 text-sm text-ink'}>
              {item.text}
            </span>
            <button type="button" className="text-xs text-muted hover:text-ink" onClick={() => removeShoppingItem(item.id)}>
              ×
            </button>
          </li>
        ))}
      </ul>

      {items.some((i) => i.checked) && (
        <Button type="button" variant="ghost" size="sm" onClick={clearCheckedShopping}>
          <ListChecks size={14} /> {t('daily.einkaufClearDone')}
        </Button>
      )}

      <section className="space-y-3 rounded-2xl border border-border bg-surface-2 p-4" data-einkauf-offers="1">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Sparkles size={16} />
          {t('daily.einkaufOffersTitle')}
        </h2>
        <p className="text-xs text-muted">{t('daily.einkaufOffersLead')}</p>
        <Button type="button" variant="secondary" disabled={offersLoading} onClick={() => void searchOffers()}>
          {offersLoading ? t('daily.loading') : t('daily.einkaufSearchOffers')}
        </Button>
        {offers && (
          <>
            <p className="text-xs text-muted">
              {t('daily.einkaufQuery')}: {offers.query}
              {!offers.liveProducts && ` · ${t('daily.einkaufOffFallback')}`}
            </p>
            <ul className="space-y-2">
              {offers.hints.map((hint) => (
                <li key={hint.id}>
                  <a
                    href={hint.kind === 'store_link' ? storeUrl : hint.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-xl border border-border px-3 py-2 text-sm hover:border-[var(--theme-accent)]/40"
                  >
                    <p className="font-medium text-ink">{hint.title}</p>
                    <p className="text-xs text-muted">{hint.source}</p>
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  )
}
