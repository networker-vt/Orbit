import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const read = (relative) => readFileSync(new URL(relative, import.meta.url), 'utf8')

const SECRET_NAMES = [
  'APP_STORE_CONNECT_API_KEY_ID',
  'APP_STORE_CONNECT_ISSUER_ID',
  'APP_STORE_CONNECT_API_KEY',
  'APPLE_TEAM_ID',
]

const VALID = {
  APP_STORE_CONNECT_API_KEY_ID: 'ABCDEFGHIJ',
  APP_STORE_CONNECT_ISSUER_ID: '12345678-1234-1234-1234-123456789abc',
  APPLE_TEAM_ID: 'ABCDE12345',
}

function runBash(script, args, env) {
  try {
    const stdout = execFileSync('bash', [script, ...args], {
      cwd: root,
      env: { PATH: process.env.PATH, ...env },
      encoding: 'utf8',
    })
    return { code: 0, out: stdout }
  } catch (error) {
    const stdout = error.stdout ? String(error.stdout) : ''
    const stderr = error.stderr ? String(error.stderr) : ''
    return { code: error.status ?? 1, out: `${stdout}${stderr}` }
  }
}

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') continue
    const path = join(dir, entry.name)
    if (entry.isDirectory()) walk(path, acc)
    else acc.push(path)
  }
  return acc
}

describe('ios testflight ci', () => {
  it('keeps the Pages build path and the Capacitor base split', () => {
    const pkg = JSON.parse(read('../package.json'))
    assert.equal(pkg.scripts.build, 'tsc -b && vite build')
    assert.equal(pkg.scripts['build:ios'], 'CAPACITOR=1 tsc -b && CAPACITOR=1 vite build')
    assert.equal(pkg.scripts['cap:sync'], 'npm run build:ios && npx cap sync ios')
    assert.equal(pkg.scripts['deploy:pages'], 'bash scripts/deploy-pages.sh')
    assert.match(pkg.scripts.test, /vitest run/)
    assert.match(pkg.scripts.test, /emit-pages-legal\.test\.mjs/)
    assert.equal(pkg.version, '2.9.1')

    const vite = read('../vite.config.ts')
    assert.match(vite, /\/eventlogistik-event-os\//)
    assert.match(vite, /CAPACITOR === '1'/)

    const cap = JSON.parse(read('../capacitor.config.json'))
    assert.equal(cap.appId, 'app.orbit.companion')

    const project = read('../ios/App/App.xcodeproj/project.pbxproj')
    assert.match(project, /PRODUCT_BUNDLE_IDENTIFIER = app\.orbit\.companion;/)
    assert.match(project, /MARKETING_VERSION = 2\.9\.1;/)
    assert.match(read('../ios/App/App/Info.plist'), /<key>ITSAppUsesNonExemptEncryption<\/key>\s*<false\/>/)

    const scheme = read('../ios/App/App.xcodeproj/xcshareddata/xcschemes/App.xcscheme')
    assert.match(scheme, /BlueprintIdentifier = "504EC3031FED79650016851F"/)
    assert.match(scheme, /<ArchiveAction[\s\S]*buildConfiguration = "Release"/)
  })

  it('runs TestFlight only on dispatch or ios-* tags', () => {
    const yml = read('../.github/workflows/ios-testflight.yml')
    assert.match(yml, /workflow_dispatch:/)
    assert.match(yml, /ios-\*/)
    assert.match(yml, /runs-on: macos-latest/)
    assert.match(yml, /npm ci/)
    assert.match(yml, /npm run cap:sync/)
    assert.match(yml, /bundle exec fastlane ios testflight/)
    assert.match(yml, /scripts\/check-ios-secrets\.sh/)
    assert.match(yml, /scripts\/check-ios-web-base\.sh/)
    for (const name of SECRET_NAMES) assert.match(yml, new RegExp(name))
    assert.doesNotMatch(yml, /deploy-pages\.sh/)
    assert.doesNotMatch(yml, /deploy:pages/)
    assert.doesNotMatch(yml, /bash scripts\/emit-pages-legal/)
    assert.doesNotMatch(yml, /pull_request:/)
    assert.doesNotMatch(yml, /branches:/)
    assert.doesNotMatch(yml, /android/)

    const fastfile = read('../ios/fastlane/Fastfile')
    const uploadAt = fastfile.indexOf('upload_args = {')
    const uploadEnd = fastfile.indexOf('}', uploadAt)
    const uploadBlock = fastfile.slice(uploadAt, uploadEnd)
    assert.match(uploadBlock, /distribute_external: false/)
    assert.match(uploadBlock, /uses_non_exempt_encryption: false/)
    assert.doesNotMatch(uploadBlock, /team_id/)
    assert.match(fastfile, /skip_waiting_for_build_processing: true/)
  })

  it('documents the four secrets and the Actions button', () => {
    const doc = read('../docs/TESTFLIGHT.md')
    const readme = read('../README.md')
    for (const name of SECRET_NAMES) assert.match(doc, new RegExp(name))
    assert.match(doc, /one line of base64|eine Zeile Base64/)
    assert.match(doc, /Admin/)
    assert.match(doc, /Internal Testing/)
    assert.match(readme, /## TestFlight via GitHub Actions/)
    assert.match(readme, /docs\/TESTFLIGHT\.md/)
    assert.match(readme, /does not deploy GitHub Pages/)
  })

  it('archives unsigned and cloud-signs only at export', () => {
    const script = read('../ios/fastlane/archive_export.sh')
    const archiveAt = script.indexOf('\nxcodebuild archive')
    const exportAt = script.indexOf('\nxcodebuild -exportArchive')
    assert.ok(archiveAt >= 0 && exportAt > archiveAt)
    const between = script.slice(archiveAt, exportAt)
    assert.match(between, /CODE_SIGNING_ALLOWED=NO/)
    assert.doesNotMatch(between, /allowProvisioningUpdates/)
    const exported = script.slice(exportAt)
    assert.match(exported, /-allowProvisioningUpdates/)
    assert.match(exported, /authenticationKeyPath/)
    assert.match(script, /testFlightInternalTestingOnly/)
    assert.match(script, /app-store-connect/)

    for (const file of [
      'ios/fastlane/archive_export.sh',
      'scripts/check-ios-secrets.sh',
      'scripts/check-ios-web-base.sh',
    ]) {
      execFileSync('bash', ['-n', join(root, file)], { cwd: root })
    }
  })

  it('fails clearly when secrets are missing and does not print values', () => {
    const sentinel = 'SENTINELKEYMATERIAL'
    const pem = `-----BEGIN PRIVATE KEY-----\n${sentinel}${'A'.repeat(40)}\n-----END PRIVATE KEY-----\n`
    const b64 = Buffer.from(pem).toString('base64')
    assert.ok(b64.length >= 80)

    const missing = runBash('scripts/check-ios-secrets.sh', [], {})
    assert.notEqual(missing.code, 0)
    assert.match(missing.out, /Missing GitHub Actions secrets/)
    for (const name of SECRET_NAMES) assert.match(missing.out, new RegExp(name))
    assert.match(missing.out, /docs\/TESTFLIGHT\.md/)

    const badTeam = runBash('scripts/check-ios-secrets.sh', [], {
      ...VALID,
      APP_STORE_CONNECT_API_KEY: b64,
      APPLE_TEAM_ID: 'short',
    })
    assert.notEqual(badTeam.code, 0)
    assert.match(badTeam.out, /APPLE_TEAM_ID/)
    assert.doesNotMatch(badTeam.out, new RegExp(sentinel))
    assert.doesNotMatch(badTeam.out, new RegExp(b64))

    const okB64 = runBash('scripts/check-ios-secrets.sh', [], {
      ...VALID,
      APP_STORE_CONNECT_API_KEY: b64,
    })
    assert.equal(okB64.code, 0, okB64.out)
    assert.doesNotMatch(okB64.out, new RegExp(sentinel))
    assert.doesNotMatch(okB64.out, new RegExp(b64))

    const okPem = runBash('scripts/check-ios-secrets.sh', [], {
      ...VALID,
      APP_STORE_CONNECT_API_KEY: pem,
    })
    assert.equal(okPem.code, 0, okPem.out)
    assert.doesNotMatch(okPem.out, new RegExp(sentinel))

    const badPem = runBash('scripts/check-ios-secrets.sh', [], {
      ...VALID,
      APP_STORE_CONNECT_API_KEY: '-----BEGIN PRIVATE KEY-----\nonly-half',
    })
    assert.notEqual(badPem.code, 0)
    assert.match(badPem.out, /END PRIVATE KEY/)
  })

  it('checks the iOS web bundle uses Vite base /', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ios-base-'))
    try {
      writeFileSync(join(dir, 'index.html'), '<script src="/eventlogistik-event-os/assets/app.js"></script>')
      const pages = runBash('scripts/check-ios-web-base.sh', [dir], {})
      assert.notEqual(pages.code, 0)
      assert.match(pages.out, /eventlogistik-event-os/)

      writeFileSync(join(dir, 'index.html'), '<script type="module" src="/assets/app.js"></script>')
      const native = runBash('scripts/check-ios-web-base.sh', [dir], {})
      assert.equal(native.code, 0, native.out)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('does not commit signing material', () => {
    for (const file of walk(root)) {
      assert.equal(file.endsWith('.p8'), false, file)
      assert.equal(file.endsWith('.mobileprovision'), false, file)
      assert.equal(file.endsWith('.ipa'), false, file)
    }
  })
})
