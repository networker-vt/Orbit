import {
  clearPlan,
  primaryAssistAction,
  type AssistPlan,
} from '../../lib/assist'
import { enqueueReminder } from '../../lib/reminders'
import type { ResumePoint } from '../../lib/resume'
import {
  tageskarteCopy,
  type DaySlot,
  type TageskarteItem,
} from '../../lib/tageskarte'
import { useI18n } from '../../lib/i18n'
import { Button, ButtonLink } from '../ui/Button'

/** Exactly one Home product card — resume / job default, with Assist plan merged in when present. */
export function Tageskarte({
  item,
  slot,
  plan,
  resume,
  onUsePrompt,
}: {
  item: TageskarteItem
  slot: DaySlot
  plan: AssistPlan | null
  resume: ResumePoint | null
  onUsePrompt: (prompt: string) => void
}) {
  const { t, resolved } = useI18n()
  const daily = tageskarteCopy(item, resolved)
  const action = plan ? primaryAssistAction(plan) : null

  const tripResult = Boolean(plan?.tripOptions?.length)

  return (
    <section
      className={
        plan
          ? 'rounded-[1.25rem] border border-border/70 bg-surface px-5 py-6'
          : 'rounded-2xl border border-border/80 bg-surface-2/40 p-4'
      }
      aria-label={plan ? t('assist.planKicker') : t('home.tageskarte')}
      data-tageskarte="1"
      data-assist-plan={plan ? '1' : undefined}
      data-tageskarte-mode={plan ? 'assist' : resume ? 'resume' : 'job-default'}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-muted">
          {plan ? t('assist.planKicker') : t('home.tageskarte')}
          {!plan && !resume && <span className="text-neutral-600"> · {t(`home.slot.${slot}`)}</span>}
        </p>
        {plan && (
          <Button type="button" size="sm" variant="ghost" onClick={() => clearPlan()}>
            {t('assist.clear')}
          </Button>
        )}
      </div>

      {plan ? (
        <>
          <h2 className="mt-3 text-[1.65rem] font-semibold leading-tight tracking-tight text-ink">{plan.summary}</h2>
          {action && !tripResult && <p className="mt-2 text-[15px] text-ink-soft">{action.title}</p>}
          {!tripResult && (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {action?.actionTo && (
                <ButtonLink to={action.actionTo} size="sm" variant="secondary">
                  {action.actionLabel || t('home.next')}
                </ButtonLink>
              )}
              {action?.actionTo && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    enqueueReminder({
                      title: plan.summary,
                      actionTo: action.actionTo!,
                      actionLabel: action.actionLabel || t('home.next'),
                    })
                  }}
                >
                  {t('assist.remind')}
                </Button>
              )}
            </div>
          )}
          <p className="mt-5 border-t border-border/50 pt-3 text-[13px] text-muted">
            {t('home.tageskarteAlso')}: {daily.title}
          </p>
        </>
      ) : resume ? (
        <>
          <h2 className="mt-1 text-base font-semibold text-ink">{resume.title}</h2>
          <p className="mt-1 text-sm text-neutral-300">{t('home.tageskarteContinueBody')}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <ButtonLink to={resume.path} size="sm" variant="secondary">
              {t('home.tageskarteContinue')}
            </ButtonLink>
          </div>
        </>
      ) : (
        <>
          <h2 className="mt-1 text-base font-semibold text-ink">{t('home.tageskarteJobTitle')}</h2>
          <p className="mt-1 text-sm text-neutral-300">{t('home.tageskarteJobBody')}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <ButtonLink to="/listings/new?intent=job" size="sm" variant="secondary">
              {t('home.tageskarteJobTitle')}
            </ButtonLink>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onUsePrompt('Was liegt heute an — Job oder Auftrag?')}
            >
              {t('home.tageskarteJobBody')}
            </Button>
          </div>
        </>
      )}
    </section>
  )
}
