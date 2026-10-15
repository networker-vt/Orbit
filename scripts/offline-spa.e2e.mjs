#!/usr/bin/env node
/**
 * Playwright: online load → offline reload → /willkommen and /angebot render.
 * Expects `dist/` already built + emit-pages-legal applied. Starts vite preview.
 */
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { setTimeout as sleep } from 'node:timers/promises'
import { chromium } from 'playwright'

const BASE = '/orbit/'
const HARD_TIMEOUT_MS = 90_000

async function freePort() {
  return new Promise((resolve, reject) => {
    const s = createServer()
    s.listen(0, '127.0.0.1', () => {
      const { port } = s.address()
      s.close(() => resolve(port))
    })
    s.on('error', reject)
  })
}

async function waitForUrl(url, attempts = 80) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url)
      if (res.ok || res.status === 404) return
    } catch {
      /* retry */
    }
    await sleep(250)
  }
  throw new Error(`preview not ready: ${url}`)
}

async function main() {
  const port = await freePort()
  const origin = `http://127.0.0.1:${port}`
  const preview = spawn(
    process.execPath,
    [
      'node_modules/vite/bin/vite.js',
      'preview',
      '--host',
      '127.0.0.1',
      '--port',
      String(port),
      '--strictPort',
    ],
    { stdio: ['ignore', 'pipe', 'pipe'], env: process.env, detached: true },
  )
  let logs = ''
  preview.stdout.on('data', (d) => {
    logs += d
  })
  preview.stderr.on('data', (d) => {
    logs += d
  })

  const shutdown = () => {
    try {
      process.kill(-preview.pid, 'SIGTERM')
    } catch {
      try {
        preview.kill('SIGTERM')
      } catch {
        /* ignore */
      }
    }
  }

  const watchdog = setTimeout(() => {
    shutdown()
    console.error(logs)
    console.error('offline-spa e2e timed out')
    process.exit(1)
  }, HARD_TIMEOUT_MS)

  try {
    await waitForUrl(`${origin}${BASE}`)
    const browser = await chromium.launch()
    const context = await browser.newContext()
    const page = await context.newPage()

    // Online: load willkommen so SW can install + precache.
    // Prefer `load` over `networkidle` — SW keepalives can stall networkidle.
    await page.goto(`${origin}${BASE}willkommen/`, { waitUntil: 'load', timeout: 30000 })
    await page.waitForSelector('#root', { timeout: 15000 })
    await page.waitForFunction(
      () => {
        if (!('serviceWorker' in navigator)) return true
        return Boolean(navigator.serviceWorker.controller)
      },
      { timeout: 25000 },
    ).catch(async () => {
      // Controller may lag; wait for an active registration instead.
      await page.waitForFunction(async () => {
        if (!('serviceWorker' in navigator)) return true
        const reg = await navigator.serviceWorker.getRegistration()
        return Boolean(reg?.active)
      }, { timeout: 15000 })
    })
    await sleep(2000)

    // Also warm angebot online once so its shell is in runtime/precache.
    await page.goto(`${origin}${BASE}angebot/`, { waitUntil: 'load', timeout: 30000 })
    await page.waitForSelector('#root', { timeout: 15000 })
    await sleep(1000)

    await context.setOffline(true)

    for (const path of ['willkommen/', 'angebot/']) {
      await page.goto(`${origin}${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 20000 })
      await page.waitForSelector('#root', { timeout: 15000 })
      const hasContent = await page.evaluate(() => {
        const root = document.getElementById('root')
        return Boolean(root && root.childElementCount > 0 && (root.textContent || '').trim().length > 0)
      })
      if (!hasContent) {
        throw new Error(`offline render failed for /${path}: #root empty`)
      }
      console.log(`offline ok: /${path}`)
    }

    await browser.close()
    console.log('offline-spa e2e ok')
  } catch (err) {
    console.error(logs)
    throw err
  } finally {
    clearTimeout(watchdog)
    shutdown()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
