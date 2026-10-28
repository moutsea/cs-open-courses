import assert from 'node:assert/strict'
import test from 'node:test'
import {
  ANALYTICS_PURGE_CHUNK,
  ANALYTICS_RETENTION_DAYS,
  analyticsCutoffDay,
  purgeAnalyticsEvents
} from '../src/lib/analyticsRetention'

function fakeDb(changes: number) {
  const calls: { sql: string; args: unknown[] }[] = []
  return {
    calls,
    db: {
      prepare(sql: string) {
        return {
          bind(...args: unknown[]) {
            calls.push({ sql, args })
            return { run: async () => ({ meta: { changes } }) }
          }
        }
      }
    } as unknown as CloudflareEnv['DB']
  }
}

test('retention cutoff is a Beijing calendar day derived from the retention window', () => {
  const now = Date.UTC(2026, 0, 31, 12, 0, 0)
  assert.equal(ANALYTICS_RETENTION_DAYS, 180)
  assert.equal(analyticsCutoffDay(180, now), '2025-08-04')
  assert.equal(analyticsCutoffDay(1, now), '2026-01-30')
})

test('purge deletes only rows older than the cutoff, in bounded chunks', async () => {
  const { db, calls } = fakeDb(42)
  const result = await purgeAnalyticsEvents(db, { days: 30, now: Date.UTC(2026, 5, 15) })
  assert.deepEqual(result, { cutoffDay: '2026-05-16', deleted: 42 })
  assert.equal(calls.length, 1)
  assert.match(calls[0].sql, /DELETE FROM analytics_events WHERE rowid IN/)
  assert.match(calls[0].sql, /day < \? LIMIT \?/)
  assert.deepEqual(calls[0].args, ['2026-05-16', ANALYTICS_PURGE_CHUNK])
})
