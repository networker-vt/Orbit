import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const root = fileURLToPath(new URL('../src/features/offer', import.meta.url))

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path, out)
    else if (/\.(ts|tsx)$/.test(name) && !name.endsWith('.test.ts')) out.push(path)
  }
  return out
}

const importRe = /(?:import|export)\s+(?:type\s+)?(?:[\w*{}\s,]+from\s+)?['"]([^'"]+)['"]/g

function isAllowed(spec, filePath) {
  if (spec.startsWith('.')) return true
  if (spec.startsWith('react') || spec === 'react-dom') return true
  if (spec.startsWith('react-router')) return true
  if (spec.startsWith('lucide-react')) return true
  if (spec.startsWith('@e-invoice-eu/') || spec.startsWith('@cantoo/')) return true
  if (spec.includes('/components/ui/')) return true
  if (spec.includes('/pages/AuthPage')) return true
  if (filePath.endsWith('.test.ts')) return true
  return false
}

test('offer feature imports stay within login, storage (internal), and UI primitives', () => {
  const files = walk(root)
  assert.ok(files.length > 0)
  for (const file of files) {
    const text = readFileSync(file, 'utf8')
    for (const match of text.matchAll(importRe)) {
      const spec = match[1]
      if (spec.startsWith('node:')) continue
      assert.ok(
        isAllowed(spec, file),
        `${file} must not import ${spec} — only shared UI, AuthPage, or internal offer modules`,
      )
    }
    assert.doesNotMatch(text, /from ['"][^'"]*\/lib\//)
    assert.doesNotMatch(text, /from ['"][^'"]*\/features\/(?!offer)/)
    assert.doesNotMatch(text, /from ['"][^'"]*\/pages\/(?!AuthPage)/)
    const isDictationModule = file.endsWith('HoldToDictateButton.tsx')
    if (!isDictationModule) {
      assert.doesNotMatch(text, /webkitSpeechRecognition|SpeechRecognition/)
    }
  }
})
