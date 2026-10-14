/**
 * „Als PDF teilen“ — Web Share API / iOS Share Sheet for ZUGFeRD PDF.
 * PDF generation stays behind dynamic import in einvoiceExport (on click).
 */

export async function sharePdfFile(filename: string, pdfBytes: Uint8Array): Promise<'shared' | 'downloaded'> {
  const blob = new Blob([Uint8Array.from(pdfBytes)], { type: 'application/pdf' })
  const file = new File([blob], filename, { type: 'application/pdf' })

  const nav = navigator as Navigator & {
    canShare?: (data?: ShareData) => boolean
    share?: (data?: ShareData) => Promise<void>
  }

  if (typeof nav.share === 'function') {
    const data: ShareData = { files: [file], title: filename }
    const can = typeof nav.canShare === 'function' ? nav.canShare(data) : true
    if (can) {
      await nav.share(data)
      return 'shared'
    }
  }

  // Fallback: download
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
  return 'downloaded'
}
