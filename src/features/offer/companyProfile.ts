import type { CompanyProfile, InvoiceDraft, InvoiceParty } from './types'

export type ProfileFieldKey =
  | 'profile.name'
  | 'profile.street'
  | 'profile.postCode'
  | 'profile.city'
  | 'profile.taxOrVat'
  | 'profile.iban'

export type ProfileValidationIssue = {
  field: ProfileFieldKey
  labelDe: string
}

const LABELS: Record<ProfileFieldKey, string> = {
  'profile.name': 'Firmenprofil: Name',
  'profile.street': 'Firmenprofil: Anschrift (Straße)',
  'profile.postCode': 'Firmenprofil: Anschrift (PLZ)',
  'profile.city': 'Firmenprofil: Anschrift (Ort)',
  'profile.taxOrVat': 'Firmenprofil: Steuernummer oder USt-IdNr.',
  'profile.iban': 'Firmenprofil: IBAN',
}

/** §14 required seller fields from company profile — export blocked naming the field. */
export function validateCompanyProfile(profile: CompanyProfile | null): ProfileValidationIssue[] {
  if (!profile) {
    return [
      { field: 'profile.name', labelDe: LABELS['profile.name'] },
      { field: 'profile.street', labelDe: LABELS['profile.street'] },
      { field: 'profile.postCode', labelDe: LABELS['profile.postCode'] },
      { field: 'profile.city', labelDe: LABELS['profile.city'] },
      { field: 'profile.taxOrVat', labelDe: LABELS['profile.taxOrVat'] },
      { field: 'profile.iban', labelDe: LABELS['profile.iban'] },
    ]
  }
  const issues: ProfileValidationIssue[] = []
  if (!profile.name.trim()) issues.push({ field: 'profile.name', labelDe: LABELS['profile.name'] })
  if (!profile.street.trim()) issues.push({ field: 'profile.street', labelDe: LABELS['profile.street'] })
  if (!profile.postCode.trim()) issues.push({ field: 'profile.postCode', labelDe: LABELS['profile.postCode'] })
  if (!profile.city.trim()) issues.push({ field: 'profile.city', labelDe: LABELS['profile.city'] })
  if (!profile.vatId.trim() && !profile.taxNumber.trim()) {
    issues.push({ field: 'profile.taxOrVat', labelDe: LABELS['profile.taxOrVat'] })
  }
  if (!profile.iban.trim()) issues.push({ field: 'profile.iban', labelDe: LABELS['profile.iban'] })
  return issues
}

export function profileToSeller(profile: CompanyProfile): InvoiceParty {
  return {
    name: profile.name,
    street: profile.street,
    postCode: profile.postCode,
    city: profile.city,
    countryCode: 'DE',
    email: profile.email,
    vatId: profile.vatId,
    taxNumber: profile.taxNumber,
    contactName: profile.contactName || profile.name,
    contactPhone: profile.contactPhone,
  }
}

/** Copy profile into invoice draft (seller, IBAN/BIC, Kleinunternehmer). */
export function applyProfileToInvoice(draft: InvoiceDraft, profile: CompanyProfile): InvoiceDraft {
  return {
    ...draft,
    iban: profile.iban,
    bic: profile.bic,
    kleinunternehmer: profile.kleinunternehmer,
    seller: profileToSeller(profile),
  }
}

export async function readLogoAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error ?? new Error('logo'))
    reader.readAsDataURL(file)
  })
}
