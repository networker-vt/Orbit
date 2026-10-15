import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = new URL('..', import.meta.url)
const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi
const ALLOWED_EMAIL = /^(mirco\.kuessner@gmail\.com|[^@\s]+@example\.invalid|[^@\s]+@orbit\.local)$/i

/**
 * Exact +49 allowlist: one phone string + one dist basename pattern each.
 * No blanket regex — add a commented entry per allowed occurrence.
 */
export const PHONE_ALLOWLIST = [
  {
    // Fictitious demo trader phone — src/data/seed.ts (QuickRun Kuriere)
    phone: '+49 221 000000',
    file: /^store-.*\.js$/,
  },
  {
    // Fictitious demo trader phone — src/data/seed.ts (second hub listing)
    phone: '+49 221 000001',
    file: /^store-.*\.js$/,
  },
  {
    // XRechnung Contact telephone placeholder when seller phone empty —
    // src/features/offer/einvoiceMapper.ts
    phone: '+49 000 0000000',
    file: /^AngebotPage-.*\.js$/,
  },
]

function walk(dir, out = []) {
  if (!existsSync(dir)) return out
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    const stat = statSync(path)
    if (stat.isDirectory()) walk(path, out)
    else if (/\.(js|css|html|txt|svg)$/.test(name)) out.push(path)
  }
  return out
}

/** Strip only exact allowlisted phones that match this file's basename. */
export function stripAllowedPhones(filePath, text) {
  const base = basename(filePath)
  let out = text
  for (const entry of PHONE_ALLOWLIST) {
    if (!entry.file.test(base)) continue
    if (out.includes(entry.phone)) out = out.split(entry.phone).join('')
  }
  return out
}

export function checkSourceCatalog() {
  const errors = []
  const files = [
    'src/data/catalog/companies.ts',
    'src/data/catalog/venues.ts',
    'src/data/catalog/transporters.ts',
    'src/data/seed.ts',
    'src/lib/fx.ts',
    'src/lib/travelConnectors.ts',
  ]
  for (const file of files) {
    const text = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')
    if (/frankfurter\.app|transport\.rest/.test(text)) errors.push(`${file} still names a removed host`)
    if (file.includes('catalog/') && /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text)) {
      errors.push(`${file} still contains an email`)
    }
    if (file.includes('catalog/') && (/\bphone\s*:/.test(text) || /\+49/.test(text))) {
      errors.push(`${file} still contains a phone`)
    }
  }
  return errors
}

export function checkDist(distDir) {
  const errors = []
  const files = walk(distDir)
  if (!files.length) {
    errors.push(`no built files in ${distDir}`)
    return errors
  }
  for (const file of files) {
    const raw = readFileSync(file, 'utf8')
    if (raw.includes('frankfurter.app')) {
      errors.push(`dist contains frankfurter.app (${basename(file)})`)
    }
    const withoutAllowed = stripAllowedPhones(file, raw)
    if (withoutAllowed.includes('+49')) {
      errors.push(`dist contains a +49 phone pattern (${basename(file)})`)
    }
    const emails = withoutAllowed.match(EMAIL) ?? []
    for (const email of new Set(emails)) {
      if (!ALLOWED_EMAIL.test(email)) {
        errors.push(`dist contains unexpected email ${email} (${basename(file)})`)
      }
    }
  }
  return errors
}

function runCli() {
  const sourceErrors = checkSourceCatalog()
  const distPath = fileURLToPath(new URL('./dist/', root))
  const distErrors = existsSync(distPath) ? checkDist(distPath) : []
  const errors = [...sourceErrors, ...distErrors]
  if (errors.length) {
    console.error(errors.join('\n'))
    process.exit(1)
  }
  console.log(
    existsSync(distPath)
      ? 'public bundle check ok (source + dist)'
      : 'public bundle check ok (source; dist not built)',
  )
}

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
if (isDirectRun) runCli()
