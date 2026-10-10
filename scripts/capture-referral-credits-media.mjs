/**
 * Capture Empfehlen + Einstellung credits screenshots for Project media store.
 * Usage: node scripts/capture-referral-credits-media.mjs [outDir]
 */
import { spawn, execFileSync } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const cliArgs = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const outDir =
  cliArgs[0] ||
  path.join(
    process.env.ORBIT_MEDIA_OUT ||
      'C:/Users/mirco/AppData/Local/Cursor/AgentStores/cursor_agent_stores/bc-4cd1dea6-e7a9-4a3d-9efc-4bf273d3a6e8/files/media',
    'referral-credits',
  )

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function waitForPreview(url, ms = 45_000) {
  const start = Date.now()
  while (Date.now() - start < ms) {
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {
      /* preview still starting */
    }
    await sleep(400)
  }
  throw new Error(`Preview not ready: ${url}`)
}

const skipBuild = process.argv.slice(2).includes('--skip-build')
if (!skipBuild) {
  execFileSync('npm', ['run', 'build'], { cwd: root, shell: true, stdio: 'inherit' })
}

const previewPort = process.env.ORBIT_PREVIEW_PORT || '4199'
const preview = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', previewPort], {
  cwd: root,
  shell: true,
  stdio: 'ignore',
})

try {
  await mkdir(outDir, { recursive: true })
  const base = `http://127.0.0.1:${previewPort}/orbit/`
  await waitForPreview(`${base}index.html`)

  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })

  await page.goto(`${base}empfehlen`, { waitUntil: 'networkidle', timeout: 60_000 })
  await page.waitForSelector('[data-empfehlen-referral="1"]', { timeout: 60_000 })
  await page.waitForTimeout(1500)
  await page.screenshot({ path: path.join(outDir, '01-empfehlen.png'), fullPage: true })

  await page.goto(`${base}einstellung#credits`, { waitUntil: 'networkidle' })
  await page.waitForSelector('[data-einstellung-credits="1"]', { timeout: 15_000 })
  await page.locator('#credits').scrollIntoViewIfNeeded()
  await sleep(400)
  await page.screenshot({ path: path.join(outDir, '02-einstellung-credits.png'), fullPage: false })

  await page.goto(`${base}profile`, { waitUntil: 'networkidle' })
  await page.screenshot({ path: path.join(outDir, '03-profile-orbit-plus.png'), fullPage: true })

  await browser.close()
  console.log('Wrote media to', outDir)
} finally {
  preview.kill('SIGTERM')
}
