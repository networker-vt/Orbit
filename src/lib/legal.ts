/** Operator contact — natürliche Person, kein Handelsregister. */
export const LEGAL = {
  operatorName: 'Mirco Küßner',
  street: 'Schlebuscher Weg 8',
  zip: '51061',
  city: 'Köln',
  country: 'Deutschland',
  email: 'mirco.kuessner@gmail.com',
  /**
   * Phone is intentionally not published — Impressum contact is email/form only.
   * Keep placeholder so accidental fill-in stays out of the public bundle check.
   */
  phone: '[BITTE AUSFÜLLEN]',
  /** Remove the private-operation note once the project is run for profit. */
  tradeStatus: '[BITTE AUSFÜLLEN: Gewerbe ja/nein]',
  brand: 'Allda',
  form: 'natürliche Person / Privatperson',
  register: null as string | null,
  vatId: null as string | null,
  year: new Date().getFullYear(),
} as const

export const LEGAL_ADDRESS_LINE = `${LEGAL.street}, ${LEGAL.zip} ${LEGAL.city}`

/** True while Mirco has not replaced a `[BITTE AUSFÜLLEN]` value. */
export function isLegalPlaceholder(value: string) {
  return value.includes('BITTE AUSFÜLLEN')
}

export function copyrightLine(year = LEGAL.year) {
  return `© ${year} ${LEGAL.operatorName} / ${LEGAL.brand}`
}
