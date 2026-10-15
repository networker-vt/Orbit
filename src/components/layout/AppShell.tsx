import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Home, Sparkles, Target, UserRound } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAuth } from '../../lib/auth'
import { useI18n } from '../../lib/i18n'
import { themeForPath } from '../../lib/theme'
import { PwaInstallBanner } from './PwaInstallBanner'
import { DemoStoreBanner } from './DemoStoreBanner'
import { PreReleaseBetaBanner } from './PreReleaseBetaBanner'
import { CreateSheet } from './CreateSheet'
import { BrandIcon, BrandMark } from '../brand/BrandMark'
import { UserProfileMark } from '../profile/UserProfileMark'
import { SkipLink } from '../a11y/SkipLink'
import { copyrightLine } from '../../lib/legal'
import { getPrefs, subscribePrefs } from '../../lib/prefs'
import { touchResume } from '../../lib/resume'
import { SchemeToggle } from '../theme/SchemeToggle'
import { KidsBanner } from '../kids/KidsBanner'
import { ParentalGateHost } from '../kids/ParentalGate'
import { isKidsMode, subscribeKids } from '../../lib/kids'
import { kidsSurfaceEnabled } from '../../lib/registrationFlags'
import { OnboardingGate } from '../onboarding/OnboardingGate'
import { cueOrbiNavRun } from '../../lib/orbiMotion'
import { recordWidgetVisit } from '../../lib/widgetUsage'

function documentTitleFor(pathname: string, t: (key: string) => string) {
  if (pathname === '/' || pathname === '') return `Allda — ${t('brand.tagline')}`
  if (pathname.startsWith('/kabine') || pathname.startsWith('/look')) return `${t('look.title')} · Allda`
  if (pathname.startsWith('/abflug') || pathname.startsWith('/reise')) return `${t('travel.title')} · Allda`
  if (pathname.startsWith('/crew')) return `${t('nav.crew')} · Allda`
  if (pathname.startsWith('/treffer')) return `${t('match.kicker')} · Allda`
  if (pathname.startsWith('/match')) return `${t('nav.match')} · Allda`
  if (pathname.startsWith('/wallet')) return `${t('nav.wallet')} · Allda`
  if (
    pathname.startsWith('/social/chat') ||
    pathname.startsWith('/messages') ||
    pathname === '/chat' ||
    pathname.startsWith('/chat/')
  )
    return `${t('chat.brand')} · Allda`
  if (pathname.startsWith('/social')) return `${t('social.title')} · Allda`
  if (pathname.startsWith('/einstellung')) return `${t('einstellung.title')} · Allda`
  if (pathname.startsWith('/mein')) return `${t('mein.title')} · Allda`
  if (pathname.startsWith('/entdecker')) return `${t('tile.entdecker')} · Allda`
  if (pathname.startsWith('/campus') || pathname.startsWith('/lernen')) return `${t('campus.title')} · Allda`
  if (pathname.startsWith('/kids')) return `${t('kids.title')} · Allda`
  if (pathname.startsWith('/mehr')) return `${t('mehr.title')} · Allda`
  if (pathname.startsWith('/essen')) return `${t('essen.title')} · Allda`
  if (pathname.startsWith('/parkmerke')) return 'Parkmerke · Allda'
  if (pathname.startsWith('/impressum')) return `${t('footer.impressum')} · Allda`
  if (pathname.startsWith('/datenschutz') || pathname.startsWith('/privacy'))
    return `${t('footer.privacy')} · Allda`
  if (pathname.startsWith('/support')) return `${t('footer.support')} · Allda`
  if (pathname.startsWith('/news')) return `${t('archive.newsTitle')} · Allda`
  if (pathname.startsWith('/innovation')) return `${t('archive.innovationTitle')} · Allda`
  if (pathname.startsWith('/wissen')) return `${t('archive.wissenTitle')} · Allda`
  if (pathname.startsWith('/katalog')) return `${t('archive.katalogTitle')} · Allda`
  return `Allda — ${t('brand.tagline')}`
}

export function AppShell() {
  const { user, profile } = useAuth()
  const { t, stub } = useI18n()
  const navigate = useNavigate()
  const location = useLocation()
  const onHome = location.pathname === '/' || location.pathname === ''
  const profileName = user?.name?.trim() || t('home.guestName')
  const [seenPath, setSeenPath] = useState(location.pathname)
  if (seenPath !== location.pathname) {
    setSeenPath(location.pathname)
    cueOrbiNavRun()
  }
  const [createOpen, setCreateOpen] = useState(false)
  const [prefs, setPrefs] = useState(getPrefs)
  const [kids, setKids] = useState(isKidsMode)
  /** Mount footer only after route content has painted (lazy chunk + async gates). */
  const [footerReady, setFooterReady] = useState(false)
  const theme = themeForPath(location.pathname)
  const matchTo = prefs.completed ? '/match' : '/prefs'

  useEffect(() => subscribePrefs(() => setPrefs(getPrefs())), [])
  useEffect(() => subscribeKids(() => setKids(isKidsMode())), [])
  useEffect(() => {
    document.title = documentTitleFor(location.pathname, t)
    touchResume(`${location.pathname}${location.hash}`, document.title)
    recordWidgetVisit(location.pathname)
  }, [location.pathname, location.hash, t])
  useEffect(() => {
    setFooterReady(false)
    let alive = true
    const timer = window.setTimeout(() => {
      if (alive) setFooterReady(true)
    }, 500)
    return () => {
      alive = false
      window.clearTimeout(timer)
    }
  }, [location.pathname])

  const primaryNav = [
    { to: '/', label: t('nav.home'), icon: Home, end: true },
    { to: matchTo, label: t('nav.match'), icon: Target },
    { to: '/social', label: t('nav.social'), icon: Sparkles },
    { to: '/mein', label: t('nav.mein'), icon: UserRound },
  ]

  return (
    <div
      data-theme={theme}
      className="theme-shell mx-auto flex min-h-dvh max-w-6xl flex-col overflow-x-hidden"
    >
      <SkipLink />
      <PreReleaseBetaBanner />
      <DemoStoreBanner />
      {kidsSurfaceEnabled() && kids && <KidsBanner />}
      {import.meta.env.DEV && stub && location.pathname !== '/' && (
        <p className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-xs text-amber-100">
          {t('stub.banner')}
        </p>
      )}

      <header className="sticky top-0 z-30 hidden border-b border-border bg-surface/95 backdrop-blur md:block">
        <div className="flex items-center gap-3 px-4 py-3 lg:px-6">
          <button
            type="button"
            onClick={() => navigate(onHome ? '/mein' : '/')}
            className="mr-2 flex shrink-0 items-center gap-2 text-left"
            aria-label={onHome ? profileName : 'Allda Start'}
          >
            {onHome ? (
              <UserProfileMark name={profileName} avatarUrl={profile?.avatarUrl} />
            ) : (
              <>
                <BrandIcon size={36} />
                <div className="leading-tight">
                  <div className="font-bold tracking-tight text-ink">Allda</div>
                  <div className="text-xs uppercase tracking-wider text-[var(--theme-accent)]">
                    {t('brand.tagline')}
                  </div>
                </div>
              </>
            )}
          </button>

          <nav className="flex min-w-0 flex-1 flex-wrap items-center gap-0.5" aria-label="Primary">
            {primaryNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={'end' in item ? item.end : false}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3 py-2 text-sm text-neutral-300 hover:bg-ink/5 hover:text-ink',
                    isActive && 'bg-[var(--theme-accent)]/10 text-[var(--theme-accent)]',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <SchemeToggle compact />
            {location.pathname !== '/' && !kids && (
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-[var(--theme-accent)] px-3 py-2 text-sm font-semibold text-[var(--theme-on-accent)]"
              >
                {t('nav.create')}
              </button>
            )}
            {user ? (
              <button
                type="button"
                onClick={() => navigate('/mein')}
                className="tap-target rounded-full border border-border bg-surface-3 px-3 py-2 text-sm"
              >
                {user.name.split(' ')[0]}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/auth')}
                className="tap-target rounded-full bg-[var(--theme-accent)]/15 px-3 py-2 text-sm text-[var(--theme-accent)]"
              >
                {t('nav.login')}
              </button>
            )}
          </div>
        </div>
      </header>

      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-surface/90 px-4 py-3 backdrop-blur safe-pt md:hidden">
        <button
          type="button"
          onClick={() => navigate(onHome ? '/mein' : '/')}
          className="flex min-h-11 min-w-0 max-w-[55%] items-center gap-2"
        >
          {onHome ? (
            <UserProfileMark name={profileName} avatarUrl={profile?.avatarUrl} compact className="min-w-0" />
          ) : (
            <BrandMark compact />
          )}
        </button>
        <div className="flex items-center gap-2">
          <SchemeToggle compact />
          {location.pathname !== '/' && !kids && (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              aria-label={t('nav.create')}
              className="tap-target flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface-3"
            >
              <span className="text-lg leading-none">+</span>
            </button>
          )}
          {user ? (
            <button
              type="button"
              onClick={() => navigate('/mein')}
              className="tap-target rounded-full border border-border bg-surface-3 px-3 py-2 text-sm"
            >
              {user.name.split(' ')[0]}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/auth')}
              className="tap-target rounded-full bg-[var(--theme-accent)]/15 px-3 py-2 text-sm text-[var(--theme-accent)]"
            >
              {t('nav.login')}
            </button>
          )}
        </div>
      </header>

      <div className="flex min-w-0 flex-1 flex-col pb-app-chrome">
        <main
          id="main-content"
          tabIndex={-1}
          className="min-h-[100dvh] flex-1 px-4 py-4 outline-none md:px-6 md:py-6 max-md:pb-2"
        >
          <div key={location.pathname + location.search} className="page-enter">
            <OnboardingGate>
              <Outlet />
            </OnboardingGate>
          </div>
          {footerReady ? (
            <footer className="mt-16 space-y-2 border-t border-border/80 pt-6 text-xs text-muted">
              <nav className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Legal">
                <Link to="/impressum" className="hover:text-[var(--theme-accent)]">
                  {t('footer.impressum')}
                </Link>
                <Link to="/privacy" className="hover:text-[var(--theme-accent)]">
                  {t('footer.privacy')}
                </Link>
                <Link to="/support" className="hover:text-[var(--theme-accent)]">
                  {t('footer.support')}
                </Link>
                <Link to="/agb" className="hover:text-[var(--theme-accent)]">
                  {t('footer.terms')}
                </Link>
                <Link to="/ranking" className="hover:text-[var(--theme-accent)]">
                  Ranking
                </Link>
              </nav>
              <p>{copyrightLine()}</p>
            </footer>
          ) : null}
        </main>
      </div>

      <CreateSheet open={createOpen} onClose={() => setCreateOpen(false)} />
      <PwaInstallBanner />
      {kidsSurfaceEnabled() && <ParentalGateHost />}

      <nav
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-border bg-surface/95 safe-pb backdrop-blur md:hidden"
        aria-label="Primary"
        data-bottom-nav="start-match-social-mein"
      >
        {primaryNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={'end' in item ? item.end : false}
            className={({ isActive }) =>
              cn(
                'relative flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 px-1 text-xs text-neutral-500 touch-manipulation transition-colors duration-200',
                isActive && 'text-[var(--theme-accent)]',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'absolute top-0 h-0.5 w-6 rounded-full bg-[var(--theme-accent)] transition-all duration-200',
                    isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-50',
                  )}
                />
                <item.icon
                  size={22}
                  className={cn('transition-transform duration-200', isActive && 'scale-110')}
                  aria-hidden
                />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
