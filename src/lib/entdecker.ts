export interface EntdeckerExplain {
  title: string
  body: string
  tags: string[]
}

const DE: EntdeckerExplain[] = [
  {
    title: 'Szene im Freien',
    body: 'Allda sieht Licht, Horizont und ein paar Formen — eher draußen als drinnen. Demo-Erklärung, kein Live-Vision.',
    tags: ['Outdoor', 'Demo'],
  },
  {
    title: 'Schrift / Schild',
    body: 'Kontrast und Kanten wirken wie Text. Ein Übersetzer kommt später — hier nur die Demo-Lesart.',
    tags: ['Text', 'Demo'],
  },
  {
    title: 'Objekt in der Hand',
    body: 'Ein klarer Gegenstand vor dem Hintergrund. Produkt oder Werkzeug — Schätzung, keine Erkennung.',
    tags: ['Objekt', 'Demo'],
  },
  {
    title: 'Innenraum',
    body: 'Wände und Licht von oben. Allda beschreibt die Stimmung, nicht die Adresse.',
    tags: ['Indoor', 'Demo'],
  },
]

const EN: EntdeckerExplain[] = [
  {
    title: 'Outdoor scene',
    body: 'Light, horizon, a few shapes — more outside than inside. Demo explanation, not live vision.',
    tags: ['Outdoor', 'Demo'],
  },
  {
    title: 'Text / sign',
    body: 'Contrast and edges look like writing. A translator comes later — this is the demo reading only.',
    tags: ['Text', 'Demo'],
  },
  {
    title: 'Object in frame',
    body: 'A clear object against the background. Product or tool — a guess, not recognition.',
    tags: ['Object', 'Demo'],
  },
  {
    title: 'Indoor space',
    body: 'Walls and overhead light. Allda describes the mood, not the address.',
    tags: ['Indoor', 'Demo'],
  },
]

function hashName(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return h
}

/** Demo photo→explain. Not live vision / translator / WhatsApp. */
export function explainPhotoStub(file: File, locale: 'de' | 'en'): EntdeckerExplain {
  const pool = locale === 'de' ? DE : EN
  return pool[hashName(file.name + file.size) % pool.length]
}
