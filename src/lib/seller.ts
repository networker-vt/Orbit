import type { Listing } from '../types'

export type SellerKind = 'private' | 'commercial'

export interface TraderDetails {
  name: string
  address: string
  email: string
  phone: string
}

export function commercialTraderComplete(trader: Partial<TraderDetails> | undefined): boolean {
  return Boolean(
    trader?.name?.trim() && trader.address?.trim() && trader.email?.trim() && trader.phone?.trim(),
  )
}

export function resolveSeller(listing: Pick<Listing, 'sellerKind' | 'trader'>): {
  kind: SellerKind
  trader: TraderDetails | null
} {
  if (listing.sellerKind === 'commercial' && commercialTraderComplete(listing.trader)) {
    return {
      kind: 'commercial',
      trader: {
        name: listing.trader!.name.trim(),
        address: listing.trader!.address.trim(),
        email: listing.trader!.email.trim(),
        phone: listing.trader!.phone.trim(),
      },
    }
  }
  return { kind: 'private', trader: null }
}

export const SELLER_HINT_DE = {
  commercial:
    'Gewerblich: Schließt du als Verbraucherin oder Verbraucher einen Vertrag mit diesem Anbieter, können die Informationspflichten nach § 312l BGB gelten. Allda ist nicht Vertragspartner.',
  private:
    'Privat: Gesetzliche Verbraucherrechte gegenüber Unternehmern gelten hier in der Regel nicht.',
} as const

export const SELLER_HINT_EN = {
  commercial:
    'Commercial: if you contract as a consumer, the information duties in § 312l BGB may apply. Allda is not the contracting party.',
  private: 'Private: consumer rights against a business usually do not apply here.',
} as const
