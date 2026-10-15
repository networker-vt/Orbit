#!/usr/bin/env node
/**
 * KoSIT validator + XRechnung configuration on fixture UBL invoices.
 */
import { spawnSync } from 'node:child_process'
import { createWriteStream, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pipeline } from 'node:stream/promises'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const cacheDir = join(root, '.cache', 'kosit')
const fixturesDir = join(root, 'fixtures', 'einvoice')
const reportPath = join(fixturesDir, 'validation-report.txt')

const VALIDATOR_URL =
  'https://github.com/itplr-kosit/validator/releases/download/v1.6.3/validator-1.6.3-standalone.jar'
const CONFIG_URL =
  'https://github.com/itplr-kosit/validator-configuration-xrechnung/releases/download/release-2024-06-20/validator-configuration-xrechnung_3.0.2_2024-06-20.zip'

async function download(url, dest) {
  if (existsSync(dest)) return
  mkdirSync(dirname(dest), { recursive: true })
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Download failed ${url}: ${res.status}`)
  await pipeline(res.body, createWriteStream(dest))
}

async function ensureTools() {
  mkdirSync(cacheDir, { recursive: true })
  const jar = join(cacheDir, 'validator.jar')
  const configZip = join(cacheDir, 'xrechnung-config.zip')
  const configDir = join(cacheDir, 'xrechnung-config')
  await download(VALIDATOR_URL, jar)
  await download(CONFIG_URL, configZip)
  if (!existsSync(join(configDir, 'scenarios.xml'))) {
    const unzip = spawnSync('unzip', ['-qo', configZip, '-d', configDir], { stdio: 'inherit' })
    if (unzip.status !== 0) throw new Error('unzip xrechnung config failed')
  }
  return { jar, configDir }
}

function fixtureFiles() {
  return readdirSync(fixturesDir)
    .filter((f) => f.endsWith('.xml') && f.startsWith('fixture-'))
    .map((f) => join(fixturesDir, f))
    .sort()
}

async function main() {
  const files = fixtureFiles()
  if (files.length !== 3) {
    console.error(`Expected 3 fixture-*.xml files, found ${files.length}`)
    process.exit(1)
  }
  const { jar, configDir } = await ensureTools()
  const outDir = join(cacheDir, 'reports')
  mkdirSync(outDir, { recursive: true })
  const lines = [`KoSIT validation ${new Date().toISOString()}`, '']
  let failed = false
  for (const file of files) {
    const hash = createHash('sha256').update(readFileSync(file)).digest('base64')
    const run = spawnSync(
      'java',
      ['-jar', jar, '-s', join(configDir, 'scenarios.xml'), '-r', configDir, '-o', outDir, file],
      { encoding: 'utf8' },
    )
    const ok = run.status === 0
    if (!ok) failed = true
    lines.push(`${ok ? 'OK' : 'FAIL'} ${file}`)
    lines.push(`  sha256: ${hash}`)
    if (run.stdout) lines.push(run.stdout.trim())
    if (run.stderr) lines.push(run.stderr.trim())
    lines.push('')
  }
  const report = lines.join('\n')
  writeFileSync(reportPath, report, 'utf8')
  console.log(report)
  if (failed) process.exit(1)
  console.log('All fixture invoices acceptable.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
