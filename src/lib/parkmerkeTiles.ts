/**
 * OpenStreetMap tile images for the open pin view.
 * The only network call in Parkmerke. No photo, no raw coordinates, no body.
 * Tiles are not stored and are not requested before that view is on screen.
 */
import { isOsmTileGet, osmTileUrl } from './parkmerke'

export async function loadMapTile(
  z: number,
  x: number,
  y: number,
  online: boolean,
  signal: AbortSignal,
  fetchImpl: typeof fetch = fetch,
): Promise<Blob | null> {
  if (!online || signal.aborted) return null
  const url = osmTileUrl(z, x, y)
  if (!isOsmTileGet(url)) return null
  let res: Response
  try {
    res = await fetchImpl(url, {
      method: 'GET',
      signal,
      credentials: 'omit',
      referrerPolicy: 'strict-origin',
      cache: 'no-store',
    })
  } catch {
    return null
  }
  if (!res.ok) return null
  const blob = await res.blob()
  if (blob.size <= 0) return null
  return blob
}
