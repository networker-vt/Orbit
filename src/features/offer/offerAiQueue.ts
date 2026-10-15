/**
 * Queues AI analysis while offline; drains when back online.
 */
import { analyzeOfferInput } from './aiProvider'
import { getOffer, saveOffer } from './offerDb'
import type { AiQueueJob, OfferLineItem, StoredOffer } from './types'

function lineId() {
  return `ln-${Math.random().toString(36).slice(2, 10)}`
}

const QUEUE_KEY = 'orbit-offer-ai-queue'

function readQueue(): AiQueueJob[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as AiQueueJob[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeQueue(jobs: AiQueueJob[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(jobs))
}

export function queueAiJob(job: AiQueueJob): void {
  writeQueue([...readQueue(), job])
}

export function pendingAiCount(): number {
  return readQueue().length
}

export async function drainAiQueue(): Promise<number> {
  if (!navigator.onLine) return 0
  const jobs = readQueue()
  if (jobs.length === 0) return 0
  let done = 0
  const remaining: AiQueueJob[] = []
  for (const job of jobs) {
    try {
      const offer = await getOffer(job.offerId)
      if (!offer) continue
      const result = await analyzeOfferInput(
        job.inputKind === 'dictation'
          ? { kind: 'dictation', transcript: job.payload.transcript ?? '' }
          : { kind: 'photo', file: new File([], job.payload.fileName ?? 'photo.jpg') },
      )
      const lines: OfferLineItem[] = result.lines.map((line) => ({
        ...line,
        id: lineId(),
        confirmed: false,
      }))
      const updated: StoredOffer = {
        ...offer,
        title: result.title,
        lines,
        updatedAt: Date.now(),
        synced: false,
      }
      await saveOffer(updated)
      done += 1
    } catch {
      remaining.push(job)
    }
  }
  writeQueue(remaining)
  return done
}

export function listenOnlineDrain(onDone: (count: number) => void): () => void {
  const handler = () => {
    void drainAiQueue().then(onDone)
  }
  window.addEventListener('online', handler)
  void drainAiQueue().then(onDone)
  return () => window.removeEventListener('online', handler)
}
