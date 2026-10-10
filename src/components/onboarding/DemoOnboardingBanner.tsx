import { isDemoMode } from '../../lib/flags'

export function DemoOnboardingBanner() {
  if (!isDemoMode()) return null
  return (
    <p
      className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-center text-xs text-amber-100"
      data-onboarding-demo-banner="1"
    >
      Demo: Registrierung speichert nur lokal (localStorage). Keine Rechtsberatung bei Gewerbe-/USt-Hinweisen.
    </p>
  )
}
