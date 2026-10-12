/** Lightweight DE/EN natural language → calendar draft (no LLM). */

export type CalendarDraft = {
  title: string
  start: Date
  end: Date
  allDay: boolean
}

const WEEKDAYS_DE: Record<string, number> = {
  montag: 1,
  dienstag: 2,
  mittwoch: 3,
  donnerstag: 4,
  freitag: 5,
  samstag: 6,
  sonntag: 0,
}

function nextWeekday(from: Date, targetDow: number): Date {
  const d = new Date(from)
  d.setHours(0, 0, 0, 0)
  let diff = (targetDow - d.getDay() + 7) % 7
  if (diff === 0) diff = 7
  d.setDate(d.getDate() + diff)
  return d
}

function parseTime(text: string): { h: number; m: number } | null {
  const uhr = text.match(/(\d{1,2})\s*(?::(\d{2}))?\s*uhr?/i)
  if (uhr) {
    const h = Math.min(23, parseInt(uhr[1], 10))
    const m = uhr[2] ? parseInt(uhr[2], 10) : 0
    return { h, m }
  }
  const colon = text.match(/\b(\d{1,2}):(\d{2})\b/)
  if (colon) return { h: parseInt(colon[1], 10), m: parseInt(colon[2], 10) }
  return null
}

export function parseEventText(input: string, now = new Date()): CalendarDraft | null {
  const raw = input.trim()
  if (!raw) return null
  const lower = raw.toLowerCase()

  let base = new Date(now)
  base.setSeconds(0, 0)

  if (/\bheute\b/.test(lower)) {
    /* keep today */
  } else if (/\bmorgen\b/.test(lower)) {
    base.setDate(base.getDate() + 1)
  } else if (/\bübermorgen\b|\buebermorgen\b/.test(lower)) {
    base.setDate(base.getDate() + 2)
  } else {
    for (const [name, dow] of Object.entries(WEEKDAYS_DE)) {
      if (lower.includes(name)) {
        base = nextWeekday(now, dow)
        break
      }
    }
  }

  const time = parseTime(lower)
  const allDay = !time
  const start = new Date(base)
  if (time) {
    start.setHours(time.h, time.m, 0, 0)
  } else {
    start.setHours(9, 0, 0, 0)
  }
  const end = new Date(start)
  end.setMinutes(end.getMinutes() + (allDay ? 24 * 60 : 60))

  let title = raw
    .replace(/\b(heute|morgen|übermorgen|uebermorgen)\b/gi, '')
    .replace(/\b(montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag)\b/gi, '')
    .replace(/\d{1,2}\s*(?::\d{2})?\s*uhr?/gi, '')
    .replace(/\b(\d{1,2}):(\d{2})\b/g, '')
    .replace(/\bum\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (!title) title = raw.slice(0, 80)

  return { title, start, end, allDay }
}

export function formatIcsDate(d: Date, allDay: boolean): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  if (allDay) {
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
  }
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`
}

export function buildIcs(events: { id: string; title: string; start: string; end: string; allDay: boolean }[]): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Allda//Daily Calendar//DE',
    'CALSCALE:GREGORIAN',
  ]
  for (const ev of events) {
    const start = new Date(ev.start)
    const end = new Date(ev.end)
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${ev.id}@orbit.local`)
    lines.push(`DTSTAMP:${formatIcsDate(new Date(), false)}`)
    if (ev.allDay) {
      lines.push(`DTSTART;VALUE=DATE:${formatIcsDate(start, true)}`)
      lines.push(`DTEND;VALUE=DATE:${formatIcsDate(end, true)}`)
    } else {
      lines.push(`DTSTART:${formatIcsDate(start, false)}`)
      lines.push(`DTEND:${formatIcsDate(end, false)}`)
    }
    lines.push(`SUMMARY:${ev.title.replace(/[,\\;]/g, ' ')}`)
    lines.push('END:VEVENT')
  }
  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}
