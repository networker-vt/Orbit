import { Capacitor } from '@capacitor/core'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import { bootNativeShell } from './lib/nativeShell'
import { initOrbitPlusDom } from './lib/orbitPlus'
import { applyScheme, getScheme } from './lib/scheme'
import App from './App'
import './index.css'

applyScheme(getScheme())
initOrbitPlusDom()

if (!Capacitor.isNativePlatform()) {
  registerSW({
    immediate: true,
    onOfflineReady() {
      console.info('[Allda] Offline-Shell bereit')
    },
  })
}

void bootNativeShell()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
