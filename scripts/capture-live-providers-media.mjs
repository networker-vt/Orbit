/**
 * Capture Abflug + Match provider screenshots into Project media store.
 * Usage: node scripts/capture-live-providers-media.mjs [outDir]
 */
import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const defaultOut =
  process.env.ORBIT_MEDIA_OUT ||
  path.resolve(repoRoot, '../../AgentStores/cursor_agent_stores/bc-4cd1dea6-e7a9-4a3d-9efc-4bf273d3a6e8/files/media')

const outDir = process.argv[2] ? path.resolve(process.argv[2]) : defaultOut

async function wait(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function main() {
  await mkdir(outDir, { recursive: true })
  const { chromium } = await import('playwright')
  const preview = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4173'], {
    cwd: repoRoot,
    shell: true,
    stdio: 'ignore',
  })
  await wait(2500)
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  const shots = [
    {
      file: 'orbit-abflug-partner-search.png',
      url: 'http://127.0.0.1:4173/abflug?from=Frankfurt&to=Berlin&date=2026-10-16',
    },
    {
      file: 'orbit-match-jobs-search.png',
      url: 'http://127.0.0.1:4173/match?rubric=jobs&q=Gastro',
    },
    {
      file: 'orbit-match-goods-search.png',
      url: 'http://127.0.0.1:4173/match?rubric=social&q=Fahrrad',
    },
  ]
  for (const s of shots) {
    await page.goto(s.url, { waitUntil: 'networkidle' })
    await wait(800)
    await page.screenshot({ path: path.join(outDir, s.file), fullPage: true })
    console.log('wrote', path.join(outDir, s.file))
  }
  await browser.close()
  preview.kill()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
