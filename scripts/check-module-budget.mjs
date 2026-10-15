#!/usr/bin/env node
/**
 * After `vite build`, ensure each module-* chunk is ≤ 50 KB gzip.
 * No-op (exit 0) when dist is missing or no module chunks exist.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const distAssets = join(root, 'dist', 'assets')
const modulesRoot = join(root, 'src', 'modules')
const MAX = 50 * 1024

function moduleDirs() {
  if (!existsSync(modulesRoot)) return []
  return readdirSync(modulesRoot).filter((name) => {
    const path = join(modulesRoot, name)
    return statSync(path).isDirectory() && !name.startsWith('.')
  })
}

if (!existsSync(distAssets)) {
  console.log('module budget: dist/assets missing — skip')
  process.exit(0)
}

const dirs = moduleDirs()
const files = readdirSync(distAssets).filter((f) => f.endsWith('.js'))
const errors = []

for (const name of dirs) {
  const chunk = files.find((f) => f.startsWith(`module-${name}-`) || f.includes(`module-${name}`))
  if (!chunk) continue
  const gz = gzipSync(readFileSync(join(distAssets, chunk)))
  if (gz.length > MAX) {
    errors.push(`${chunk}: ${gz.length} B gzip > ${MAX} B`)
  } else {
    console.log(`module budget ok: ${chunk} (${gz.length} B gzip)`)
  }
}

// Also flag any orphan module-* chunks
for (const f of files.filter((n) => n.startsWith('module-'))) {
  const gz = gzipSync(readFileSync(join(distAssets, f)))
  if (gz.length > MAX) errors.push(`${f}: ${gz.length} B gzip > ${MAX} B`)
}

if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}

if (!dirs.length && !files.some((f) => f.startsWith('module-'))) {
  console.log('module budget: no modules yet — ok')
}
