#!/usr/bin/env node
/** Regenerate fixtures/einvoice/fixture-*.xml from shared demo payloads. */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { InvoiceService } from '@e-invoice-eu/core'
import { buildFixtureInvoices } from './einvoice-fixture-data.mjs'

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'einvoice')
mkdirSync(outDir, { recursive: true })

const svc = new InvoiceService({ log: () => {}, warn: () => {}, error: console.error })

for (const { name, invoice } of buildFixtureInvoices()) {
  const xml = await svc.generate(invoice, { format: 'XRECHNUNG-UBL', lang: 'de-de' })
  const path = join(outDir, `${name}.xml`)
  writeFileSync(path, xml)
  console.log('wrote', path)
}
