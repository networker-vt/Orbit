import { Navigate, useLocation } from 'react-router-dom'
import { onboardingRedirect } from '../../lib/registration'

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()
  const target = onboardingRedirect(pathname)
  if (target && target !== pathname) return <Navigate to={target} replace />
  return children
}
