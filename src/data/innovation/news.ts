export type InnovationTag =
  | 'KI'
  | 'AR'
  | 'VR'
  | 'XR'
  | 'LED'
  | 'Audio'
  | 'Licht'
  | 'Rigging'
  | 'Video'
  | 'Showcontrol'

export interface InnovationCard {
  id: string
  title: string
  summaryDe: string
  tags: InnovationTag[]
  company: string
  date: string
  sourceUrl: string
  sourceName: string
  imageEmoji?: string
  editorial: true
}

/** Curated industry news — editorial, public sources only. */
export const innovationNews: InnovationCard[] = [
  {
    id: 'inn-disguise-gx3',
    title: 'Disguise GX 3+: Media Server mit Blackwell-GPU & Notch 1.0',
    summaryDe:
      'Disguise stellt den GX 3+ vor — leistungsstärkerer Media Server auf NVIDIA-Blackwell-Basis, inklusive Notch-Playback für generative Echtzeit-Visuals auf Konzerten und immersiven Shows.',
    tags: ['KI', 'Video', 'XR', 'Showcontrol'],
    company: 'Disguise',
    date: '2025-10-01',
    sourceUrl: 'https://plsn.com/newsroom/product-news/disguise-unveils-gx-3-media-server/',
    sourceName: 'PLSN',
    imageEmoji: '🖥️',
    editorial: true,
  },
  {
    id: 'inn-disguise-ise-ai',
    title: 'ISE 2026: Disguise zeigt Ask AId3n & GX-3+-Workflows',
    summaryDe:
      'Auf der ISE präsentiert Disguise AI-Assistenten für komplexe Setups, Software-only Playback (X1) und Partnerschaften für interaktive LED-Flächen — Richtung Automatisierung im Show Control.',
    tags: ['KI', 'LED', 'Showcontrol', 'Video'],
    company: 'Disguise',
    date: '2026-02-04',
    sourceUrl: 'https://www.installation-international.com/business/ise-2026/disguise-debuts-gx-3-workflows-and-ai-tools',
    sourceName: 'Installation International',
    imageEmoji: '🤖',
    editorial: true,
  },
  {
    id: 'inn-aoto-vp',
    title: 'AOTO CITS 2026: AI trifft LED Virtual Production',
    summaryDe:
      'Beim CinemaTech Innovation Summit diskutiert AOTO mit Filmschaffenden, wie AI, LED-Volumes und Realtime-Rendering zu einem kreativen Workflow verschmelzen — inkl. Golden Screen Awards.',
    tags: ['KI', 'LED', 'XR', 'Video'],
    company: 'AOTO',
    date: '2026-08-20',
    sourceUrl: 'https://en.aoto.com/news/cits2026/',
    sourceName: 'AOTO',
    imageEmoji: '🎬',
    editorial: true,
  },
  {
    id: 'inn-notch-generative',
    title: 'Generative Content & Notch in Live Events',
    summaryDe:
      'Realtime-Tools wie Notch ermöglichen partikelreiche, raytracing-nahe Looks live auf der Timeline — Media Server und Creative Teams rücken näher an filmische Bildqualität heran.',
    tags: ['KI', 'Video', 'XR'],
    company: 'Notch / Industry',
    date: '2025-11-15',
    sourceUrl: 'https://www.tpimagazine.com/disguise-gx-3-more-power-and-possibilities/',
    sourceName: 'TPi Magazine',
    imageEmoji: '✨',
    editorial: true,
  },
  {
    id: 'inn-led-volume',
    title: 'LED Volumes: Virtual Production für Events & Broadcast',
    summaryDe:
      'LED-Wände ersetzen zunehmend Greenscreen in Corporate- und Broadcast-Produktionen — Tracking, Kamerasync und Farbmanagement werden zu Kernkompetenzen der VT-Crew.',
    tags: ['LED', 'XR', 'Video'],
    company: 'Industry overview',
    date: '2025-09-01',
    sourceUrl: 'https://en.aoto.com/news/cits2026/',
    sourceName: 'Industry / AOTO context',
    imageEmoji: '📺',
    editorial: true,
  },
  {
    id: 'inn-ai-showcontrol',
    title: 'KI im Show Control: Assistenz statt Autopilot',
    summaryDe:
      'Hersteller experimentieren mit LLM-Assistenten für API-Navigation, Preset-Vorschläge und Troubleshooting — Verantwortung und Cue-Sicherheit bleiben beim Operator.',
    tags: ['KI', 'Showcontrol'],
    company: 'Disguise & peers',
    date: '2026-02-04',
    sourceUrl: 'https://www.installation-international.com/business/ise-2026/disguise-debuts-gx-3-workflows-and-ai-tools',
    sourceName: 'Installation International',
    imageEmoji: '🎛️',
    editorial: true,
  },
  {
    id: 'inn-ar-stage',
    title: 'AR/XR auf der Bühne: Tracking & In-Camera FX',
    summaryDe:
      'Augmented Overlays und XR-Stages verbinden Live-Performer mit digitalen Sets — Voraussetzung sind stabile Tracking-Pipelines und latenzarme Medienserver.',
    tags: ['AR', 'XR', 'Video'],
    company: 'Industry',
    date: '2025-12-01',
    sourceUrl: 'https://www.tpimagazine.com/disguise-gx-3-more-power-and-possibilities/',
    sourceName: 'TPi / industry',
    imageEmoji: '🥽',
    editorial: true,
  },
  {
    id: 'inn-ip-st2110',
    title: 'SMPTE ST 2110: IP-Video in Event-Media-Servern',
    summaryDe:
      'IP-basierte Video-Inputs (ST 2110) erweitern IMAG- und Multi-Camera-Workflows auf GX/VX-Klassen — weniger SDI-Kabel, mehr Netzwerk-Disziplin.',
    tags: ['Video', 'Showcontrol'],
    company: 'Disguise',
    date: '2025-10-15',
    sourceUrl: 'https://www.tpimagazine.com/disguise-gx-3-more-power-and-possibilities/',
    sourceName: 'TPi Magazine',
    imageEmoji: '🌐',
    editorial: true,
  },
  {
    id: 'inn-audio-immersive',
    title: 'Immersives Audio: Objektbasiertes Mixing live',
    summaryDe:
      'Objektbasierte Formate und spatial audio halten Einzug in Arenen und Corporate — FOH braucht neue Monitoring- und Routing-Konzepte neben klassischem LCR.',
    tags: ['Audio'],
    company: 'Industry',
    date: '2025-08-20',
    sourceUrl: 'https://www.event-partner.de',
    sourceName: 'Event Partner (Fachportal)',
    imageEmoji: '🔊',
    editorial: true,
  },
  {
    id: 'inn-led-pixel',
    title: 'Fine-Pitch LED: höhere Pixeldichte, neue Cooling-Anforderungen',
    summaryDe:
      'Indoor Fine-Pitch-Panels ermöglichen kürzere Viewing Distances für Galas und Messen — Power, Gewicht und Heatload steigen mit der Auflösung.',
    tags: ['LED', 'Video'],
    company: 'Industry',
    date: '2025-07-10',
    sourceUrl: 'https://www.production-partner.de',
    sourceName: 'Production Partner',
    imageEmoji: '💡',
    editorial: true,
  },
  {
    id: 'inn-licht-spectrum',
    title: 'Full-Spectrum LED-Scheinwerfer & Camera Sync',
    summaryDe:
      'Hochleistungs-Fresnels mit erweiterten Farbsystemen und Kamerasync zielen auf Broadcast-taugliches Licht ohne Flimmern — Rec.2020-Abdeckung wird Verkaufsargument.',
    tags: ['Licht', 'Video'],
    company: 'Industry (z. B. Creamsource-Klasse)',
    date: '2025-06-01',
    sourceUrl: 'https://www.production-partner.de',
    sourceName: 'Production Partner / Fachpresse',
    imageEmoji: '🔦',
    editorial: true,
  },
  {
    id: 'inn-rigging-digital',
    title: 'Digitale Lastplanung & Sensorik im Rigging',
    summaryDe:
      'Lastzellen, digitale Plots und Simulationen verbessern Planungssicherheit — SQQ2- und Meister-Know-how bleiben die Basis für sichere Tragwerke.',
    tags: ['Rigging'],
    company: 'Industry / IGVW context',
    date: '2025-05-15',
    sourceUrl: 'https://www.vplt.org',
    sourceName: 'VPLT / Branchenstandards',
    imageEmoji: '🏗️',
    editorial: true,
  },
  {
    id: 'inn-matching-ai',
    title: 'KI-Matching für Crew & Gear (Plattform-Trend)',
    summaryDe:
      'Marktplätze experimentieren mit Matching nach Skills, Radius und Verfügbarkeit — Transparenz bei Rates und Zertifikaten bleibt entscheidender als Black-Box-Scores.',
    tags: ['KI'],
    company: 'Allda / Plattform-Trend',
    date: '2026-01-10',
    sourceUrl: 'https://networker-vt.github.io/orbit/',
    sourceName: 'Allda editorial',
    imageEmoji: '⚡',
    editorial: true,
  },
  {
    id: 'inn-renderstream',
    title: 'RenderStream: Unreal & TouchDesigner ans Medienserver-Cluster',
    summaryDe:
      'Bidirektionale Render-Protokolle verteilen Unreal/Notch/TD auf Node-Cluster — geringere Latenz bei Local-Render auf starken GX-Maschinen.',
    tags: ['XR', 'Video', 'Showcontrol'],
    company: 'Disguise',
    date: '2025-10-20',
    sourceUrl: 'https://www.tpimagazine.com/disguise-gx-3-more-power-and-possibilities/',
    sourceName: 'TPi Magazine',
    imageEmoji: '🎮',
    editorial: true,
  },
  {
    id: 'inn-sustainability-led',
    title: 'Energieeffizienz: LED & Smart Power in der Tournee',
    summaryDe:
      'Hersteller und Rentals optimieren Power Draw und Touring-Footprint — Messbarkeit von kWh pro Show wird Teil der Angebotskommunikation.',
    tags: ['LED', 'Licht', 'Audio'],
    company: 'Industry',
    date: '2025-04-01',
    sourceUrl: 'https://www.event-partner.de',
    sourceName: 'Event Partner',
    imageEmoji: '🌿',
    editorial: true,
  },
]

export const INNOVATION_COUNT = innovationNews.length
