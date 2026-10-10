import { isFlagOn } from './flags'

export type ProductMode = 'orbit' | 'kids'

function productMode(): ProductMode | null {
  try {
    const m = localStorage.getItem('orbit_product_mode')
    return m === 'orbit' || m === 'kids' ? m : null
  } catch {
    return null
  }
}

/** Kids UI when flag is on or the user chose Orbit Kids in onboarding (demo builds). */
export function kidsSurfaceEnabled() {
  if (isFlagOn('kids')) return true
  return productMode() === 'kids'
}

export function campusSurfaceEnabled() {
  if (isFlagOn('campus')) return true
  return productMode() === 'kids'
}

export function enableKidsFlagForProductMode(mode: ProductMode) {
  try {
    localStorage.setItem('orbit_product_mode', mode)
    if (mode === 'kids') localStorage.setItem('orbit_flag_kids', '1')
  } catch {
    /* ignore */
  }
}
