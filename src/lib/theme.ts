export type SectionTheme = 'home' | 'match' | 'mein' | 'inbox' | 'mehr'

export function themeForPath(pathname: string): SectionTheme {
  if (pathname === '/' || pathname === '') return 'home'
  if (
    pathname.startsWith('/match') ||
    pathname.startsWith('/jobs') ||
    pathname.startsWith('/prefs') ||
    pathname.startsWith('/foto') ||
    pathname.startsWith('/marktplatz') ||
    pathname.startsWith('/reise') ||
    pathname.startsWith('/abflug') ||
    pathname.startsWith('/essen') ||
    pathname.startsWith('/treffer') ||
    pathname.startsWith('/crew') ||
    pathname.startsWith('/campus')
  ) {
    return 'match'
  }
  if (
    pathname.startsWith('/mein') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/wallet') ||
    pathname.startsWith('/tickets') ||
    pathname.startsWith('/empfehlen') ||
    pathname.startsWith('/erfahrungen') ||
    pathname.startsWith('/firma')
  ) {
    return 'mein'
  }
  if (
    pathname.startsWith('/messages') ||
    pathname.startsWith('/social') ||
    pathname.startsWith('/bookings') ||
    pathname.startsWith('/interview')
  ) {
    return 'inbox'
  }
  return 'mehr'
}
