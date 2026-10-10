import { cn } from '../../lib/utils'
import { useI18n } from '../../lib/i18n'
import { MATCH_RUBRICS, rubricHint, type MatchRubric } from '../../lib/matchRubrics'

export function MatchRubricBar({
  rubric,
  onRubric,
}: {
  rubric: MatchRubric
  onRubric: (r: MatchRubric) => void
}) {
  const { t, resolved } = useI18n()
  const hint = rubricHint(rubric)

  return (
    <div className="space-y-2" data-match-rubrics="1">
      <header className="space-y-0.5">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--theme-accent)]">
          {t('match.findIn')}
        </p>
        <h1 className="text-xl font-bold tracking-tight">{t('match.findInTitle')}</h1>
      </header>

      <div
        className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label={t('match.findIn')}
        data-match-rubric-tabs="1"
      >
        {MATCH_RUBRICS.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={rubric === id}
            data-match-rubric={id}
            onClick={() => onRubric(id)}
            className={cn(
              'min-h-10 shrink-0 rounded-full border px-3.5 text-xs font-semibold whitespace-nowrap',
              rubric === id
                ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)] text-[var(--theme-on-accent)]'
                : 'border-border bg-surface-2 text-neutral-300',
            )}
          >
            {t(`match.rubric.${id}` as 'match.rubric.jobs')}
          </button>
        ))}
      </div>

      <p className="text-xs text-muted" data-match-rubric-hint={rubric}>
        {resolved === 'de' ? hint.de : hint.en}
      </p>
    </div>
  )
}
