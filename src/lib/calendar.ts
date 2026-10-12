/** ICS / webcal / Google Calendar helpers for Allda interviews & starts. */

export interface CalEventInput {
  title: string
  description?: string
  location?: string
  startIso: string
  endIso?: string
  uid?: string
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

/** UTC ICS stamp: 20261022T140000Z */
export function toIcsUtc(iso: string): string {
  const d = new Date(iso)
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    'T' +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    'Z'
  )
}

function escapeIcs(text: string) {
  return text.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
}

export function buildIcs(ev: CalEventInput): string {
  const uid = ev.uid || `orbit-${Date.now()}@example.invalid`
  const start = toIcsUtc(ev.startIso)
  const end = toIcsUtc(
    ev.endIso || new Date(new Date(ev.startIso).getTime() + 60 * 60 * 1000).toISOString(),
  )
  const stamp = toIcsUtc(new Date().toISOString())
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Allda//Marketplace//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeIcs(ev.title)}`,
    ev.description ? `DESCRIPTION:${escapeIcs(ev.description)}` : '',
    ev.location ? `LOCATION:${escapeIcs(ev.location)}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n')
}

export function downloadIcs(ev: CalEventInput, filename = 'orbit-event.ics') {
  const blob = new Blob([buildIcs(ev)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function googleCalendarUrl(ev: CalEventInput): string {
  const start = toIcsUtc(ev.startIso).replace(/Z$/, '')
  const end = toIcsUtc(
    ev.endIso || new Date(new Date(ev.startIso).getTime() + 60 * 60 * 1000).toISOString(),
  ).replace(/Z$/, '')
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: ev.title,
    dates: `${start}/${end}`,
    details: ev.description || '',
    location: ev.location || '',
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

/** webcal: data URI is not widely supported; expose https download + note. */
export function webcalHint(): string {
  return 'ICS herunterladen und in Apple/Outlook/Google importieren. webcal:// folgt mit gehostetem Feed.'
}

const LOCAL_KEY = 'orbit_local_cal_v1'

export interface LocalCalItem {
  id: string
  title: string
  startIso: string
  endIso?: string
  location?: string
  kind: 'interview' | 'start' | 'application' | 'other' | 'reminder' | 'plan'
  createdAt: string
}

export function listLocalCalendar(): LocalCalItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    return raw ? (JSON.parse(raw) as LocalCalItem[]) : []
  } catch {
    return []
  }
}

export function addLocalCalendarItem(item: Omit<LocalCalItem, 'id' | 'createdAt'>): LocalCalItem[] {
  const next = [
    {
      ...item,
      id: `cal-${Date.now()}`,
      createdAt: new Date().toISOString(),
    },
    ...listLocalCalendar(),
  ]
  localStorage.setItem(LOCAL_KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent('orbit-cal-changed'))
  return next
}

export function removeLocalCalendarItem(id: string): LocalCalItem[] {
  const next = listLocalCalendar().filter((x) => x.id !== id)
  localStorage.setItem(LOCAL_KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent('orbit-cal-changed'))
  return next
}
