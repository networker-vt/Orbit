import { Link } from 'react-router-dom'

export function OfferLegalFooter() {
  return (
    <footer className="border-t border-border pt-4 text-sm text-muted">
      <nav aria-label="Rechtliches" className="flex flex-wrap gap-4">
        <Link
          to="/impressum"
          className="inline-flex min-h-12 items-center text-cyan-200 underline underline-offset-2"
        >
          Impressum
        </Link>
        <Link
          to="/datenschutz"
          className="inline-flex min-h-12 items-center text-cyan-200 underline underline-offset-2"
        >
          Datenschutz
        </Link>
      </nav>
    </footer>
  )
}
