import { Link } from 'react-router-dom'
import { Button, ButtonLink } from '../ui/Button'
import { AnschreibenButton } from '../chat/AnschreibenButton'
import { useI18n } from '../../lib/i18n'
import { openPartnerUrl } from '../../lib/providers/openPartnerUrl'
import type { JobSearchHit } from '../../lib/providers/jobProviders'
import type { GoodsSearchHit } from '../../lib/providers/goodsProviders'
import { store } from '../../lib/store'

export function MatchJobResults({ hits, query }: { hits: JobSearchHit[]; query: string }) {
  const { t } = useI18n()
  if (!hits.length && !query.trim()) return null
  return (
    <section className="space-y-2 rounded-2xl border border-border bg-surface-2/60 p-3" data-match-job-results="1">
      <h2 className="text-sm font-semibold text-ink">{t('match.searchResultsJobs')}</h2>
      {!hits.length ? (
        <p className="text-xs text-muted">{t('match.searchEmpty')}</p>
      ) : (
        <ul className="space-y-2">
          {hits.map((hit) => (
            <li key={hit.id} className="rounded-xl border border-border bg-black/20 px-3 py-2">
              <p className="text-sm font-semibold text-ink">{hit.title}</p>
              <p className="text-xs text-muted">
                {hit.company}
                {hit.location ? ` · ${hit.location}` : ''} · {hit.sourceLabel}
              </p>
              {hit.snippet && <p className="mt-1 line-clamp-2 text-xs text-neutral-400">{hit.snippet}</p>}
              <div className="mt-2 flex flex-wrap gap-2">
                {hit.orbitListingId && store.getListing(hit.orbitListingId) ? (
                  <>
                    <AnschreibenButton
                      listing={store.getListing(hit.orbitListingId)!}
                      source="job"
                      size="sm"
                      variant="primary"
                    />
                    <ButtonLink size="sm" variant="secondary" to={`/listings/${hit.orbitListingId}`}>
                      {t('match.openListing')}
                    </ButtonLink>
                  </>
                ) : hit.externalUrl ? (
                  <Button size="sm" type="button" onClick={() => void openPartnerUrl(hit.externalUrl!)}>
                    {t('providers.openLive')}
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function MatchGoodsResults({ hits, query }: { hits: GoodsSearchHit[]; query: string }) {
  const { t } = useI18n()
  if (!hits.length && !query.trim()) return null
  return (
    <section className="space-y-2 rounded-2xl border border-border bg-surface-2/60 p-3" data-match-goods-results="1">
      <h2 className="text-sm font-semibold text-ink">{t('match.searchResultsGoods')}</h2>
      {!hits.length ? (
        <p className="text-xs text-muted">{t('match.searchEmpty')}</p>
      ) : (
        <ul className="space-y-2">
          {hits.map((hit) => (
            <li key={hit.id} className="rounded-xl border border-border bg-black/20 px-3 py-2">
              <p className="text-sm font-semibold text-ink">{hit.title}</p>
              <p className="text-xs text-muted">
                {hit.priceLabel ? `${hit.priceLabel} · ` : ''}
                {hit.location ? `${hit.location} · ` : ''}
                {hit.sourceLabel}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {hit.listingId && store.getListing(hit.listingId) ? (
                  <>
                    <AnschreibenButton
                      listing={store.getListing(hit.listingId)!}
                      source="market"
                      size="sm"
                      variant="primary"
                    />
                    <Link
                      to={`/listings/${hit.listingId}`}
                      className="inline-flex min-h-9 items-center rounded-lg border border-border px-3 text-xs font-medium"
                    >
                      {t('match.openListing')}
                    </Link>
                  </>
                ) : hit.externalUrl ? (
                  <Button size="sm" type="button" onClick={() => void openPartnerUrl(hit.externalUrl!)}>
                    {t('providers.openLive')}
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
