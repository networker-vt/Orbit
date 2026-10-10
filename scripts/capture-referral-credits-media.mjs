/**
 * Capture Empfehlen + Einstellung credits screenshots for Project media store.
 * Usage: node scripts/capture-referral-credits-media.mjs [outDir]
 */
import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const outDir =
  process.argv[2] ||
  path.join(
    process.env.ORBIT_MEDIA_OUT ||
      'C:/Users/mirco/AppData/Local/Cursor/AgentStores/cursor_agent_stores/bc-4cd1dea6-e7a9-4a3d-9efc-4bf273d3a6e8/files/media',
    'referral-credits',
  )

const preview = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', '4173'], {
  cwd: root,
  shell: true,
  stdio: 'ignore',
})

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

try {
  await mkdir(outDir, { recursive: true })
  await sleep(2500)
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  const base = 'http://127.0.0.1:4173/eventlogistik-event-os/'

  await page.goto(`${base}empfehlen`, { waitUntil: 'networkidle' })
  await page.screenshot({ path: path.join(outDir, '01-empfehlen.png'), fullPage: true })

  await page.goto(`${base}einstellung#credits`, { waitUntil: 'networkidle' })
  await page.screenshot({ path: path.join(outDir, '02-einstellung-credits.png'), fullPage: true })

  await page.goto(`${base}profile`, { waitUntil: 'networkidle' })
  await page.screenshot({ path: path.join(outDir, '03-profile-orbit-plus.png'), fullPage: true })

  await browser.close()
  console.log('Wrote media to', outDir)
} finally {
  preview.kill('SIGTERM')
}
