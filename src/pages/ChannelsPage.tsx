import { Hash, MessageCircle, Plane, Briefcase, Building2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { ChannelLinks } from '../components/mein/ChannelLinks'
import { useI18n } from '../lib/i18n'

const COMMUNITY = [
  {
    id: 'general',
    title: 'Allda General',
    hint: 'Alles-App, Ankündigungen, Hilfe',
    icon: Hash,
    to: '/',
  },
  {
    id: 'match',
    title: 'Match',
    hint: 'Angebote und Gesuche über den Marktplatz',
    icon: Briefcase,
    to: '/match',
  },
  {
    id: 'reise',
    title: 'Reise',
    hint: 'Bahn live oder Suchlink — keine Buchung',
    icon: Plane,
    to: '/abflug',
  },
  {
    id: 'firma',
    title: 'Firma / B2B',
    hint: 'Partner, Hiring, Angebote',
    icon: Building2,
    to: '/firma',
  },
  {
    id: 'social',
    title: 'Social',
    hint: 'Leichte Posts zum Marktplatz',
    icon: MessageCircle,
    to: '/social',
  },
] as const

export function ChannelsPage() {
  const { t } = useI18n()
  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-scroll-chrome">
      <header className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wider text-cyan">{t('channels.kicker')}</p>
        <h1 className="text-2xl font-bold tracking-tight">{t('channels.nav')}</h1>
        <p className="text-sm text-muted">{t('channels.pageLead')}</p>
      </header>

      <ChannelLinks />

      <section className="space-y-2" aria-labelledby="community-stubs">
        <h2 id="community-stubs" className="text-sm font-semibold">
          {t('channels.communityTitle')}
        </h2>
        <p className="text-xs text-muted">{t('channels.hint')}</p>
        <ul className="space-y-2">
          {COMMUNITY.map((ch) => (
            <li key={ch.id}>
              <Link
                to={ch.to}
                className="card-hover flex min-h-12 items-center gap-3 rounded-xl border border-border bg-surface-2 px-3 py-3"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-3 text-[var(--theme-accent)]">
                  <ch.icon size={18} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-medium text-ink">{ch.title}</span>
                    <Badge tone="amber">Demo</Badge>
                  </span>
                  <span className="block text-xs text-muted">{ch.hint}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
