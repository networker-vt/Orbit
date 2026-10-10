/**
 * One-off screenshots for Project store media (requires: npx playwright install chromium).
 * Usage: node scripts/capture-onboarding-media.mjs <outDir>
 */
import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const outDir = process.argv[2]
if (!outDir) {
  console.error('Usage: node scripts/capture-onboarding-media.mjs <outDir>')
  process.exit(1)
}

const port = 4173
const base = `http://127.0.0.1:${port}/`

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

const preview = spawn('npm', ['run', 'preview', '--', '--port', String(port), '--host', '127.0.0.1'], {
  shell: true,
  stdio: 'ignore',
})

await wait(2500)

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
const page = await ctx.newPage()

await mkdir(outDir, { recursive: true })

const shots = [
  { file: 'orbit-beta-prerelease-banner.png', path: '', clear: true },
  { file: 'orbit-onboarding-chooser.png', path: 'willkommen', clear: true },
  { file: 'orbit-kids-consent.png', path: 'willkommen/kids', clear: false },
  { file: 'orbit-registration-tour.png', path: 'willkommen/orbit', clear: false },
  { file: 'orbit-mitentwickeln.png', path: 'mitentwickeln', clear: false },
]

for (const shot of shots) {
  if (shot.clear) {
    await page.goto(base)
    await page.evaluate(() => localStorage.clear())
  }
  await page.goto(base + shot.path)
  await wait(800)
  await page.screenshot({ path: path.join(outDir, shot.file), fullPage: true })
}

// Kids hub: set demo state
await page.evaluate(() => {
  localStorage.setItem('orbit_product_mode', 'kids')
  localStorage.setItem(
    'orbit_registration_v1',
    JSON.stringify({
      productMode: 'kids',
      kidsConsent: { guardianName: 'Demo', agreedAt: new Date().toISOString(), consentTextVersion: '2026-10-10' },
      kidsProfileComplete: true,
      adultTourComplete: false,
      adultStep: 'tour',
      profile: {},
      tourSlidesSeen: 0,
      updatedAt: new Date().toISOString(),
    }),
  )
  localStorage.setItem(
    'orbit_kids_v1',
    JSON.stringify({ ageBand: 'under13', kidsMode: true, pinHash: 'abc123' }),
  )
})
await page.goto(base + 'kids')
await wait(800)
await page.screenshot({ path: path.join(outDir, 'orbit-kids-hub.png'), fullPage: true })

await browser.close()
preview.kill()
console.log('Saved screenshots to', outDir)
