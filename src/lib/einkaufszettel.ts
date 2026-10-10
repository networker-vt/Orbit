const KEY = 'orbit_einkaufszettel_v1'
const EVT = 'orbit-einkauf-changed'

export type ShoppingItem = {
  id: string
  text: string
  checked: boolean
  addedAt: string
}

function loadRaw(): ShoppingItem[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ShoppingItem[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveRaw(items: ShoppingItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items))
  window.dispatchEvent(new Event(EVT))
}

export function subscribeShoppingList(cb: () => void): () => void {
  const onStore = () => cb()
  window.addEventListener(EVT, onStore)
  window.addEventListener('storage', onStore)
  return () => {
    window.removeEventListener(EVT, onStore)
    window.removeEventListener('storage', onStore)
  }
}

export function listShoppingItems(): ShoppingItem[] {
  return loadRaw()
}

export function addShoppingItem(text: string): ShoppingItem | null {
  const t = text.trim()
  if (!t) return null
  const item: ShoppingItem = {
    id: crypto.randomUUID(),
    text: t,
    checked: false,
    addedAt: new Date().toISOString(),
  }
  saveRaw([...loadRaw(), item])
  return item
}

export function toggleShoppingItem(id: string) {
  saveRaw(loadRaw().map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)))
}

export function removeShoppingItem(id: string) {
  saveRaw(loadRaw().filter((i) => i.id !== id))
}

export function clearCheckedShopping() {
  saveRaw(loadRaw().filter((i) => !i.checked))
}

/** Infer meal mood from Essen prefs / life sentence (no scraping). */
export function hungerSearchTerms(lifeSentence: string, extra = ''): string[] {
  const blob = `${lifeSentence} ${extra}`.toLowerCase()
  const terms: string[] = []
  if (/pasta|nudel|italien/.test(blob)) terms.push('pasta', 'tomaten')
  if (/salat|leicht|detox/.test(blob)) terms.push('salat', 'gemüse')
  if (/suppe|warm|eintopf/.test(blob)) terms.push('gemüse', 'kartoffeln')
  if (/pizza|ofen/.test(blob)) terms.push('mehl', 'käse', 'tomaten')
  if (/bowl|reis|asiat/.test(blob)) terms.push('reis', 'gemüse', 'sojasauce')
  if (/kaffee|kuchen|süß|suess/.test(blob)) terms.push('mehl', 'zucker', 'butter')
  if (/smoothie|frucht|obst/.test(blob)) terms.push('banane', 'beeren', 'joghurt')
  if (/hunger|essen|kochen|mahlzeit/.test(blob) && terms.length === 0) {
    terms.push('nudeln', 'milch', 'eier', 'gemüse')
  }
  if (terms.length === 0) terms.push('milch', 'brot', 'obst')
  return [...new Set(terms)].slice(0, 6)
}
