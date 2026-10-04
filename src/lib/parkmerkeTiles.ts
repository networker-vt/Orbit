/**
 * OpenStreetMap tile images for the open Parkmerke page.
 * The only network call in Parkmerke. No photo, no raw coordinates, no body.
 */
import { isOsmTileGet, osmTileUrl } from './parkmerke'
import { readParkingTile, writeParkingTile } from './parkmerkeStore'

export async function loadMapTile(
  z: number,
  x: number,
  y: number,
  online: boolean,
  signal: AbortSignal,
  persist: boolean,
  fetchImpl: typeof fetch = fetch,
): Promise<Blob | null> {
  const key = `${z}/${x}/${y}`
  const cached = await readParkingTile(key)
  if (cached) return cached
  if (!online || signal.aborted) return null
  const url = osmTileUrl(z, x, y)
  if (!isOsmTileGet(url)) return null
  let res: Response
  try {
    res = await fetchImpl(url, {
      method: 'GET',
      signal,
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
    })
  } catch {
    return null
  }
  if (!res.ok) return null
  const blob = await res.blob()
  if (blob.size <= 0) return null
  if (persist && !signal.aborted) await writeParkingTile(key, blob)
  return blob
}
