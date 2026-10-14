/**
 * Swappable AI interface for offer line extraction.
 * Beta: mock mode only — no external API until AVV/DPF.
 */
import type { AiAnalysisInput, AiAnalysisResult } from './types'

export type OfferAiMode = 'mock'

const MODE: OfferAiMode = 'mock'

const MOCK_FROM_PHOTO: AiAnalysisResult = {
  title: 'Angebot Veranstaltungstechnik',
  lines: [
    {
      quantity: 12,
      unit: 'Stück',
      unitCode: 'H87',
      description: 'LED-PAR Scheinwerfer inkl. Kabel',
      unitPriceNet: 18.5,
      taxRate: null,
    },
    {
      quantity: 6,
      unit: 'Std',
      unitCode: 'HUR',
      description: 'Montage und Einmessung Traversensystem',
      unitPriceNet: 65,
      taxRate: null,
    },
    {
      quantity: 1,
      unit: 'Pauschale',
      unitCode: 'C62',
      description: 'Transport und Rücktransport Equipment',
      unitPriceNet: 120,
      taxRate: null,
    },
  ],
}

const MOCK_FROM_DICTATION: AiAnalysisResult = {
  title: 'Angebot aus Diktat',
  lines: [
    {
      quantity: 2,
      unit: 'Stück',
      unitCode: 'H87',
      description: 'Digitalmischpult 32 Kanäle',
      unitPriceNet: 95,
      taxRate: null,
    },
    {
      quantity: 8,
      unit: 'Std',
      unitCode: 'HUR',
      description: 'Tontechniker Vor-Ort',
      unitPriceNet: 58,
      taxRate: null,
    },
  ],
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

export function getOfferAiMode(): OfferAiMode {
  return MODE
}

export async function analyzeOfferInput(input: AiAnalysisInput): Promise<AiAnalysisResult> {
  if (MODE !== 'mock') {
    throw new Error('Nur Mock-Modus in der Beta verfügbar.')
  }
  await delay(input.kind === 'photo' ? 900 : 650)
  if (input.kind === 'dictation' && input.transcript.trim().length > 0) {
    return {
      ...MOCK_FROM_DICTATION,
      title: `Angebot: ${input.transcript.trim().slice(0, 48)}`,
    }
  }
  if (input.kind === 'photo') void input.file.name
  return structuredClone(MOCK_FROM_PHOTO)
}
