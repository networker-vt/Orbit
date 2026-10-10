import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { OrbitWordmarkHero } from '../../components/brand/OrbitWordmarkHero'
import { DemoOnboardingBanner } from '../../components/onboarding/DemoOnboardingBanner'
import { Button } from '../../components/ui/Button'
import { Input, Textarea } from '../../components/ui/Input'
import { CITIES } from '../../data/constants'
import { useAuth } from '../../lib/auth'
import { addSkill } from '../../lib/profileHub'
import {
  ADULT_TOUR_STEPS,
  advanceAdultTourStep,
  applyRegistrationToLocalProfile,
  completeAdultTour,
  getRegistration,
  patchRegistrationProfile,
  setAdultTourStep,
  type AdultTourStepId,
  type MarketIntent,
  type OfferingEntity,
} from '../../lib/registration'
import { getPrefs, savePrefs } from '../../lib/prefs'
import { useI18n } from '../../lib/i18n'
import { addImprovement } from '../../lib/improvements'

const TOUR_SLIDES = [
  'onboarding.orbit.tour1',
  'onboarding.orbit.tour2',
  'onboarding.orbit.tour3',
] as const

function stepLabel(step: AdultTourStepId, t: (k: string) => string) {
  const map: Record<AdultTourStepId, string> = {
    tour: t('onboarding.orbit.step.tour'),
    prefs: t('onboarding.orbit.step.prefs'),
    skills: t('onboarding.orbit.step.skills'),
    role: t('onboarding.orbit.step.role'),
    compliance: t('onboarding.orbit.step.compliance'),
    avatar: t('onboarding.orbit.step.avatar'),
    bio: t('onboarding.orbit.step.bio'),
    homepage: t('onboarding.orbit.step.homepage'),
    interests: t('onboarding.orbit.step.interests'),
    feedback: t('onboarding.orbit.step.feedback'),
    done: t('onboarding.orbit.step.done'),
  }
  return map[step]
}

export function OrbitRegistrationPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { register, user } = useAuth()
  const reg = getRegistration()
  const [step, setStep] = useState<AdultTourStepId>(reg.adultStep)
  const [profile, setProfile] = useState(reg.profile)
  const [slide, setSlide] = useState(reg.tourSlidesSeen)
  const [skillDraft, setSkillDraft] = useState('')
  const [skills, setSkills] = useState<string[]>([])

  const stepIndex = ADULT_TOUR_STEPS.indexOf(step)
  const progress = Math.round(((stepIndex + 1) / ADULT_TOUR_STEPS.length) * 100)

  const syncProfile = (patch: Partial<typeof profile>) => {
    const next = { ...profile, ...patch }
    setProfile(next)
    patchRegistrationProfile(patch)
  }

  const nextStep = () => {
    const n = advanceAdultTourStep().adultStep
    setStep(n)
    setAdultTourStep(n)
  }

  const finish = () => {
    patchRegistrationProfile(profile)
    applyRegistrationToLocalProfile()
    completeAdultTour()
    if (!user && profile.displayName.trim()) {
      register(
        `${profile.displayName.toLowerCase().replace(/\s+/g, '.')}@orbit.demo`,
        profile.displayName.trim(),
        profile.offeringEntity === 'company' ? 'agency' : 'freelancer',
        getPrefs().seeker.cities[0] || 'Berlin',
      )
    }
    navigate('/', { replace: true })
  }

  const body = useMemo(() => {
    switch (step) {
      case 'tour': {
        const text = t(TOUR_SLIDES[Math.min(slide, TOUR_SLIDES.length - 1)])
        return (
          <div className="space-y-4 text-center">
            <OrbitWordmarkHero />
            <p className="text-sm text-muted">{text}</p>
            <Button
              type="button"
              onClick={() => {
                if (slide < TOUR_SLIDES.length - 1) {
                  setSlide(slide + 1)
                  patchRegistrationProfile({})
                } else nextStep()
              }}
            >
              {slide < TOUR_SLIDES.length - 1 ? t('onboarding.orbit.next') : t('onboarding.orbit.startPrefs')}
            </Button>
          </div>
        )
      }
      case 'prefs':
        return (
          <div className="space-y-3">
            <p className="text-sm text-muted">{t('onboarding.orbit.prefsLead')}</p>
            <label className="text-sm">
              {t('onboarding.orbit.city')}
              <select
                className="mt-1 w-full rounded-xl border border-border bg-surface-2 px-3 py-2"
                value={getPrefs().seeker.cities[0] || 'Berlin'}
                onChange={(e) => {
                  savePrefs({ seeker: { ...getPrefs().seeker, cities: [e.target.value] } })
                }}
              >
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <Button type="button" onClick={nextStep}>
              {t('onboarding.orbit.next')}
            </Button>
          </div>
        )
      case 'skills':
        return (
          <div className="space-y-3">
            <p className="text-sm text-muted">{t('onboarding.orbit.skillsLead')}</p>
            <div className="flex gap-2">
              <Input value={skillDraft} onChange={(e) => setSkillDraft(e.target.value)} placeholder={t('onboarding.orbit.skillPlaceholder')} />
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  const n = skillDraft.trim()
                  if (!n) return
                  addSkill(n, 4)
                  setSkills([...skills, n])
                  setSkillDraft('')
                }}
              >
                +
              </Button>
            </div>
            <p className="text-xs text-muted">{skills.join(', ') || '—'}</p>
            <Button type="button" onClick={nextStep}>
              {t('onboarding.orbit.next')}
            </Button>
          </div>
        )
      case 'role':
        return (
          <div className="space-y-3">
            {(['seeking', 'offering', 'both'] as MarketIntent[]).map((intent) => (
              <button
                key={intent}
                type="button"
                onClick={() => syncProfile({ marketIntent: intent })}
                className={`block w-full rounded-xl border px-3 py-2 text-left text-sm ${
                  profile.marketIntent === intent ? 'border-cyan bg-cyan/10' : 'border-border'
                }`}
              >
                {t(`onboarding.orbit.intent.${intent}`)}
              </button>
            ))}
            {(profile.marketIntent === 'offering' || profile.marketIntent === 'both') && (
              <div className="flex gap-2">
                {(['private', 'company'] as OfferingEntity[]).map((entity) => (
                  <button
                    key={entity}
                    type="button"
                    onClick={() => syncProfile({ offeringEntity: entity })}
                    className={`flex-1 rounded-xl border px-3 py-2 text-sm ${
                      profile.offeringEntity === entity ? 'border-cyan bg-cyan/10' : 'border-border'
                    }`}
                  >
                    {t(`onboarding.orbit.entity.${entity}`)}
                  </button>
                ))}
              </div>
            )}
            <Button type="button" onClick={nextStep}>
              {t('onboarding.orbit.next')}
            </Button>
          </div>
        )
      case 'compliance':
        return (
          <div className="space-y-3">
            <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
              {t('onboarding.orbit.complianceDisclaimer')}
            </p>
            <p className="text-sm font-semibold">{t('onboarding.orbit.vat')}</p>
            <div className="flex gap-2">
              <Button type="button" variant={profile.vatRegistered === true ? 'primary' : 'secondary'} onClick={() => syncProfile({ vatRegistered: true })}>
                {t('onboarding.orbit.vatYes')}
              </Button>
              <Button type="button" variant={profile.vatRegistered === false ? 'primary' : 'secondary'} onClick={() => syncProfile({ vatRegistered: false })}>
                {t('onboarding.orbit.vatNo')}
              </Button>
            </div>
            <label className="flex gap-2 text-sm">
              <input type="checkbox" checked={profile.checklistHandelsregister} onChange={(e) => syncProfile({ checklistHandelsregister: e.target.checked })} />
              {t('onboarding.orbit.checkHandelsregister')}
            </label>
            <label className="flex gap-2 text-sm">
              <input type="checkbox" checked={profile.checklistGewerbe} onChange={(e) => syncProfile({ checklistGewerbe: e.target.checked })} />
              {t('onboarding.orbit.checkGewerbe')}
            </label>
            <Button type="button" onClick={nextStep}>
              {t('onboarding.orbit.next')}
            </Button>
          </div>
        )
      case 'avatar':
        return (
          <div className="space-y-3">
            <Input label={t('onboarding.orbit.displayName')} value={profile.displayName} onChange={(e) => syncProfile({ displayName: e.target.value })} />
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                const stub =
                  'data:image/svg+xml,' +
                  encodeURIComponent(
                    `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect fill="#0ea5e9" width="128" height="128"/><text x="50%" y="50%" fill="white" font-size="48" text-anchor="middle" dy=".35em">O</text></svg>`,
                  )
                syncProfile({ avatarDataUrl: stub, avatarSource: 'ai-stub' })
              }}
            >
              {t('onboarding.orbit.avatarAi')}
            </Button>
            <label className="block text-sm">
              {t('onboarding.orbit.avatarUpload')}
              <input
                type="file"
                accept="image/*"
                className="mt-1 block w-full text-xs"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (!f) return
                  const reader = new FileReader()
                  reader.onload = () => syncProfile({ avatarDataUrl: String(reader.result), avatarSource: 'upload' })
                  reader.readAsDataURL(f)
                }}
              />
            </label>
            {profile.avatarDataUrl && (
              <img src={profile.avatarDataUrl} alt="" className="h-20 w-20 rounded-full border border-border object-cover" />
            )}
            <Button type="button" onClick={nextStep}>
              {t('onboarding.orbit.next')}
            </Button>
          </div>
        )
      case 'bio':
        return (
          <div className="space-y-3">
            <Textarea label={t('onboarding.orbit.bio')} value={profile.bio} onChange={(e) => syncProfile({ bio: e.target.value })} rows={4} />
            {(['instagram', 'linkedin', 'homepage'] as const).map((key) => (
              <Input
                key={key}
                label={key}
                value={profile.social[key] || ''}
                onChange={(e) => syncProfile({ social: { ...profile.social, [key]: e.target.value } })}
              />
            ))}
            <label className="flex gap-2 text-xs text-muted">
              <input type="checkbox" checked={profile.allowKleinanzeigen} onChange={(e) => syncProfile({ allowKleinanzeigen: e.target.checked })} />
              {t('onboarding.orbit.kleinanzeigenFlag')}
            </label>
            <Button type="button" onClick={nextStep}>
              {t('onboarding.orbit.next')}
            </Button>
          </div>
        )
      case 'homepage':
        return (
          <div className="space-y-3">
            <Button
              type="button"
              variant={profile.homepageMode === 'builder-demo' ? 'primary' : 'secondary'}
              className="w-full"
              onClick={() => syncProfile({ homepageMode: 'builder-demo', homepageBuilderAck: true })}
            >
              {t('onboarding.orbit.homepageBuilder')}
            </Button>
            {profile.homepageMode === 'builder-demo' && (
              <div className="rounded-xl border border-dashed border-cyan/40 p-3 text-xs text-muted">{t('onboarding.orbit.homepageBuilderDemo')}</div>
            )}
            <Input
              label={t('onboarding.orbit.homepageUrl')}
              value={profile.social.homepage}
              onChange={(e) => syncProfile({ social: { ...profile.social, homepage: e.target.value }, homepageMode: 'external-url' })}
            />
            <Button type="button" onClick={nextStep}>
              {t('onboarding.orbit.next')}
            </Button>
          </div>
        )
      case 'interests':
        return (
          <div className="space-y-3">
            <Input label={t('onboarding.orbit.jobTitle')} value={profile.jobTitle} onChange={(e) => syncProfile({ jobTitle: e.target.value })} />
            <Input label={t('onboarding.orbit.familienstand')} value={profile.familienstand} onChange={(e) => syncProfile({ familienstand: e.target.value })} />
            <Input
              label={t('onboarding.orbit.hobbies')}
              placeholder={t('onboarding.orbit.hobbiesPlaceholder')}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return
                e.preventDefault()
                const v = (e.target as HTMLInputElement).value.trim()
                if (!v) return
                syncProfile({ hobbies: [...profile.hobbies, v] })
                ;(e.target as HTMLInputElement).value = ''
              }}
            />
            <p className="text-xs text-muted">{profile.hobbies.join(', ')}</p>
            <Button type="button" onClick={nextStep}>
              {t('onboarding.orbit.next')}
            </Button>
          </div>
        )
      case 'feedback':
        return (
          <div className="space-y-3">
            <p className="text-sm text-muted">{t('onboarding.orbit.feedbackLead')}</p>
            <Input
              label={t('onboarding.orbit.rating')}
              type="number"
              min={1}
              max={5}
              value={profile.feedbackRating || ''}
              onChange={(e) => syncProfile({ feedbackRating: Number(e.target.value) })}
            />
            <Textarea label={t('onboarding.orbit.feedbackText')} value={profile.feedbackText} onChange={(e) => syncProfile({ feedbackText: e.target.value })} rows={3} />
            <Link to="/mitentwickeln" className="block text-center text-xs text-cyan hover:underline">
              {t('mitentwickeln.title')} →
            </Link>
            <Button
              type="button"
              onClick={() => {
                if (profile.feedbackText.trim()) {
                  addImprovement(profile.feedbackText, profile.feedbackRating, 'registration')
                }
                nextStep()
                finish()
              }}
            >
              {t('onboarding.orbit.finish')}
            </Button>
          </div>
        )
      default:
        return null
    }
  }, [step, slide, profile, skillDraft, skills, t, navigate, user])

  return (
    <div className="mx-auto max-w-lg space-y-4 py-4" data-orbit-registration="1">
      <DemoOnboardingBanner />
      <div className="h-2 overflow-hidden rounded-full bg-surface-3">
        <div className="h-full bg-cyan transition-all" style={{ width: `${progress}%` }} />
      </div>
      <p className="text-xs text-muted">
        {stepLabel(step, t)} ({stepIndex + 1}/{ADULT_TOUR_STEPS.length})
      </p>
      {body}
    </div>
  )
}
