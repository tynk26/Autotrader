
import type { Candle } from '../types/indicatorTypes'
import { TF_SECONDS, Timeframe } from './timeframes'

export function resample(data: Candle[], tf: Timeframe): Candle[] {
  const sec = TF_SECONDS[tf]
  if (!sec) return data
  const out: Candle[] = []
  const byBucket = new Map<number, Candle>()
  for (const c of data) {
    const bucket = Math.floor(c.time / sec) * sec
    const prev = byBucket.get(bucket)
    if (!prev) {
      byBucket.set(bucket, { ...c, time: bucket })
    } else {
      prev.high = Math.max(prev.high, c.high)
      prev.low = Math.min(prev.low, c.low)
      prev.close = c.close
      prev.volume += c.volume
    }
  }
  for (const k of Array.from(byBucket.keys()).sort((a,b)=>a-b)) {
    out.push(byBucket.get(k)!)
  }
  return out
}
