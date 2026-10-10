import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = new URL('..', import.meta.url)
const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi
const ALLOWED_EMAIL = /^(mirco\.kuessner@gmail\.com|[^@\s]+@example\.invalid|[^@\s]+@orbit\.local)$/i
const ALLOWED_PHONE = /\+49 221 00000[01]/

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
  const blob = files.map((file) => readFileSync(file, 'utf8')).join('\n')
  if (blob.includes('frankfurter.app')) errors.push('dist contains frankfurter.app')
  if (blob.includes('transport.rest')) errors.push('dist contains transport.rest')
  if (blob.includes('+49')) errors.push('dist contains a +49 phone pattern')
  const emails = blob.match(EMAIL) ?? []
  for (const email of new Set(emails)) {
    if (!ALLOWED_EMAIL.test(email)) errors.push(`dist contains unexpected email ${email}`)
  }
  return errors
}

const sourceErrors = checkSourceCatalog()
const distPath = fileURLToPath(new URL('./dist/', root))
const distErrors = existsSync(distPath) ? checkDist(distPath) : []
const errors = [...sourceErrors, ...distErrors]
if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}
console.log(existsSync(distPath) ? 'public bundle check ok (source + dist)' : 'public bundle check ok (source; dist not built)')
