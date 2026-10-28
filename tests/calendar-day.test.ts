import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test, { type TestContext } from 'node:test'
import { POST } from '../src/app/api/track/route'
import { sinceDay } from '../src/lib/analyticsReport'
import { analyticsCutoffDay } from '../src/lib/analyticsRetention'
import { shanghaiDateTime, shanghaiDay, shanghaiDaysAgo, weekdayLabel } from '../src/lib/calendarDay'
import { applyMigration, createTestDatabase } from './helpers/d1'
import { backfillAnalyticsDays, parseBackfillArgs } from '../scripts/backfill-analytics-days'

/**
 * 日历日口径回归。
 *
 * 历史上 `analytics_events.day` 写的是 UTC 日，而 `page_views.day` 是北京时间日，
 * 于是北京时间 00:00–08:00 这段时间两张图会差一天。这组用例把边界钉死：
 * 写入（track）、报表窗口（sinceDay）、保留期截止日（analyticsCutoffDay）都必须按北京时间。
 */

/** 2026-10-27 00:30 北京时间 = 2026-10-26 16:30 UTC：一天里最容易出错的时刻。 */
const BEIJING_EARLY_MORNING = Date.UTC(2026, 9, 26, 16, 30, 0)
/** 2026-10-26 23:30 北京时间 = 2026-10-26 15:30 UTC。 */
const BEIJING_LATE_EVENING = Date.UTC(2026, 9, 26, 15, 30, 0)

function stubClock(t: TestContext, now: number) {
  const original = Date.now
  Date.now = () => now
  t.after(() => {
    Date.now = original
  })
}

function captureBatches(t: TestContext) {
  const batches: Array<Array<{ sql: string; args: unknown[] }>> = []
  const symbol = Symbol.for('__cloudflare-context__')
  const original = Object.getOwnPropertyDescriptor(globalThis, symbol)
  Object.defineProperty(globalThis, symbol, {
    configurable: true,
    value: {
      env: {
        DB: {
          prepare: (sql: string) => ({ bind: (...args: unknown[]) => ({ sql, args }) }),
          batch: async (statements: unknown[]) => {
            batches.push(statements as Array<{ sql: string; args: unknown[] }>)
            return []
          }
        }
      }
    }
  })
  t.after(() => {
    if (original) Object.defineProperty(globalThis, symbol, original)
    else Reflect.deleteProperty(globalThis, symbol)
  })
  return batches
}

const body = JSON.stringify({
  events: [{ name: 'search', path: '/zh/search', locale: 'zh', props: { q: '课程' } }]
})

function trackRequest() {
  return new Request('https://example.test/api/track', {
    method: 'POST',
    body,
    headers: { 'content-type': 'application/json' },
    duplex: 'half'
  } as RequestInit)
}

test('calendar day is Asia/Shanghai, not UTC', () => {
  // 00:30 北京时间已经是新的一天，UTC 还是前一天。
  assert.equal(shanghaiDay(BEIJING_EARLY_MORNING), '2026-10-27')
  assert.equal(shanghaiDay(BEIJING_LATE_EVENING), '2026-10-26')
  assert.equal(shanghaiDaysAgo(0, BEIJING_EARLY_MORNING), '2026-10-27')
  assert.equal(shanghaiDaysAgo(6, BEIJING_EARLY_MORNING), '2026-10-21')
  // 星期几按日历日算，不受时区影响。
  assert.equal(weekdayLabel('2026-10-21'), '周三')
  assert.equal(weekdayLabel('2026-10-27'), '周二')
  assert.equal(weekdayLabel('not-a-day'), '')
})

test('track writes the Beijing day for events that arrive after midnight', async t => {
  stubClock(t, BEIJING_EARLY_MORNING)
  const batches = captureBatches(t)
  assert.equal((await POST(trackRequest())).status, 204)
  assert.equal(batches.length, 1)

  const insert = batches[0][0]
  assert.match(insert.sql, /INSERT INTO analytics_events/)
  // 参数顺序：occurred_at, day, name, path, locale, target_host, props_json, country, device
  assert.equal(insert.args[0], BEIJING_EARLY_MORNING)
  assert.equal(insert.args[1], '2026-10-27')
})

test('documented SQL date windows include exactly the requested number of days', async () => {
  const report = await readFile('reports/analytics.md', 'utf8')
  const offsets = [...report.matchAll(/day >= date\('now', '\+8 hours', '(-\d+) day'\)/g)].map(match => match[1])
  assert.equal(offsets.filter(offset => offset === '-6').length, 3, 'all 7-day SQL windows start six days before today')
  assert.equal(offsets.filter(offset => offset === '-29').length, 8, 'all 30-day SQL windows start 29 days before today')
  assert.equal(offsets.length, 11, 'all documented rolling date windows are covered')
})

test('reporting window and retention cutoff follow the same Beijing calendar', () => {
  // 00:30 北京时间，「最近 1 天」的窗口就是今天这一天。
  assert.equal(sinceDay(1, BEIJING_EARLY_MORNING), '2026-10-27')
  assert.equal(sinceDay(7, BEIJING_EARLY_MORNING), '2026-10-21')
  // 保留期截止日同理，否则边界那天会被多删或少删。
  assert.equal(analyticsCutoffDay(1, BEIJING_EARLY_MORNING), '2026-10-26')
  assert.equal(analyticsCutoffDay(0, BEIJING_EARLY_MORNING), '2026-10-27')
})

for (const migration of ['0006_analytics_events_day_beijing.sql', '0007_analytics_events_beijing_day_trigger.sql']) {
  test(`${migration} protects old writers without updating historical rows`, async t => {
    const db = await createTestDatabase({ migrations: ['0004_analytics_events.sql'] })
    t.after(() => db.dispose())
    await db.all(`INSERT INTO analytics_events (occurred_at, day, name, path) VALUES (?, '2026-10-26', 'search', '/zh')`, BEIJING_EARLY_MORNING)
    await applyMigration(db.db, migration)
    await applyMigration(db.db, migration)
    await db.all(`INSERT INTO analytics_events (occurred_at, day, name, path) VALUES (?, '2026-10-26', 'search', '/zh')`, BEIJING_EARLY_MORNING)
    const rows = await db.all<{ day: string }>('SELECT day FROM analytics_events ORDER BY id')
    assert.deepEqual(rows, [{ day: '2026-10-26' }, { day: '2026-10-27' }])
  })
}

test('day backfill is bounded, resumable, idempotent, and preserves other fields', async t => {
  const db = await createTestDatabase({ migrations: ['0004_analytics_events.sql'] })
  t.after(() => db.dispose())
  // Gaps in primary keys must not skip rows. Invalid timestamps stay untouched.
  for (const [id, occurredAt] of [[1, BEIJING_EARLY_MORNING], [5, BEIJING_LATE_EVENING], [8, BEIJING_EARLY_MORNING], [20, 0], [30, BEIJING_EARLY_MORNING]]) {
    await db.all(`INSERT INTO analytics_events (id, occurred_at, day, name, path, props_json) VALUES (?, ?, '2026-10-26', 'search', '/zh/search', '{"q":"keep"}')`, id, occurredAt)
  }
  await applyMigration(db.db, '0006_analytics_events_day_beijing.sql')
  const execute = async (sql: string) => {
    const result = await db.db.prepare(sql).all<Record<string, unknown>>()
    assert.ok(result.meta.changes <= 2, 'a batch never updates more than two rows')
    // Match Wrangler local JSON, which omits meta.changes. Count RETURNING rows.
    return { results: result.results }
  }
  let cursor = 0
  await assert.rejects(backfillAnalyticsDays(execute, {
    batchSize: 2,
    onProgress: progress => {
      cursor = progress.afterId
      throw new Error('simulated interruption after commit')
    }
  }), /simulated interruption/)
  assert.equal(cursor, 5)
  const result = await backfillAnalyticsDays(execute, { batchSize: 2, afterId: cursor })
  assert.equal(result.changed, 2)
  assert.equal(result.batches, 2)
  assert.equal(result.afterId, 30)
  const rows = await db.all<{ id: number; day: string; path: string; props_json: string }>('SELECT id, day, path, props_json FROM analytics_events ORDER BY id')
  assert.deepEqual(rows.map(row => row.day), ['2026-10-27', '2026-10-26', '2026-10-27', '2026-10-26', '2026-10-27'])
  assert.ok(rows.every(row => row.path === '/zh/search' && row.props_json === '{"q":"keep"}'))
  assert.equal((await backfillAnalyticsDays(execute, { batchSize: 2 })).changed, 0)
})

test('backfill requires the write-protection trigger and validates CLI options', async t => {
  const db = await createTestDatabase({ migrations: ['0004_analytics_events.sql'] })
  t.after(() => db.dispose())
  await assert.rejects(backfillAnalyticsDays(async sql => ({ results: await db.all(sql) })), /Apply D1 migrations/)
  assert.throws(() => parseBackfillArgs([]), /exactly one/)
  assert.throws(() => parseBackfillArgs(['--local', '--remote']), /exactly one/)
  assert.throws(() => parseBackfillArgs(['--local', '--batch-size', '1001']), /batch-size/)
  assert.throws(() => parseBackfillArgs(['--local', '--after-id', '1;DROP TABLE']), /integer/)
  assert.deepEqual(parseBackfillArgs(['--local', '--batch-size', '2', '--after-id', '5', '--through-id', '30']), {
    target: '--local', options: { batchSize: 2, afterId: 5, throughId: 30 }
  })
})

test('timestamps shown in the dashboard use Beijing time too', () => {
  // 2026-10-26 16:12 UTC 就是北京时间 2026-10-27 00:12（跨了一天）。
  const ms = Date.UTC(2026, 9, 26, 16, 12)
  assert.equal(shanghaiDateTime(ms), '2026-10-27 00:12')
  // 与 day 列同一个边界：北京时间 00:12 属于 10-27，UTC 还停在 10-26。
  assert.equal(shanghaiDay(ms), '2026-10-27')
  assert.equal(new Date(ms).toISOString().slice(0, 10), '2026-10-26')
})
