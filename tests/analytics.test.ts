import assert from 'node:assert/strict'
import test from 'node:test'
import { ALLOWED_EVENTS, normalizeBatch, normalizeEvent } from '../src/lib/analyticsServer'
import { normalizeDays, sinceDay } from '../src/lib/analyticsReport'

test('analytics accepts whitelisted events', () => {
  const event = normalizeEvent({
    name: 'outbound_click',
    path: '/zh/course/data-structures-algorithms/CS61B',
    locale: 'zh',
    targetHost: 'cs61b.org',
    props: { host: 'cs61b.org', label: '课程官网' }
  })
  assert.ok(event)
  assert.equal(event.name, 'outbound_click')
  assert.equal(event.path, '/zh/course/data-structures-algorithms/CS61B')
  assert.deepEqual(JSON.parse(event.props), { host: 'cs61b.org', label: '课程官网' })
})

test('analytics drops unknown events', () => {
  assert.equal(normalizeEvent({ name: 'pageview' }), null)
  assert.equal(normalizeEvent({ name: '__proto__' }), null)
  assert.equal(normalizeEvent(null), null)
  assert.equal(normalizeEvent('outbound_click'), null)
})

test('analytics clamps path, strips query and rejects relative paths', () => {
  assert.equal(normalizeEvent({ name: 'search', path: '/courses?q=cs61b' })?.path, '/courses')
  assert.equal(normalizeEvent({ name: 'search', path: 'https://evil.example/x' })?.path, '/')
  assert.equal(normalizeEvent({ name: 'search', path: '/'.repeat(500) + 'x' })?.path.length, 200)
})

test('analytics caps string props and rejects non primitive values', () => {
  const event = normalizeEvent({
    name: 'search',
    path: '/search',
    props: { q: 'a'.repeat(300), nested: { a: 1 }, list: [1, 2], count: 3, ok: true }
  })
  assert.ok(event)
  const props = JSON.parse(event.props)
  assert.equal(props.q.length, 120)
  assert.equal('nested' in props, false)
  assert.equal('list' in props, false)
  assert.equal(props.count, 3)
  assert.equal(props.ok, true)
})

test('analytics falls back to a marker when props are too large', () => {
  const props: Record<string, string> = {}
  for (let index = 0; index < 40; index += 1) props[`k${index}`] = 'v'.repeat(119)
  const event = normalizeEvent({ name: 'search', path: '/search', props })
  assert.ok(event)
  assert.deepEqual(JSON.parse(event.props), { truncated: true })
})

test('analytics batch keeps order, filters invalid entries and honours the limit', () => {
  const batch = normalizeBatch(
    [{ name: 'search' }, { name: 'evil' }, { name: 'course_filter' }],
    20
  )
  assert.deepEqual(batch.map(item => item.name), ['search', 'course_filter'])
  assert.equal(normalizeBatch(Array.from({ length: 50 }, () => ({ name: 'search' }))).length, 20)
  assert.deepEqual(normalizeBatch('nope'), [])
})

test('analytics allowlist matches the client side union', () => {
  assert.deepEqual(
    [...ALLOWED_EVENTS].sort(),
    ['course_favorite', 'course_filter', 'course_progress', 'language_switch', 'outbound_click', 'search']
  )
})

test('analytics dashboard resolves the reporting window', () => {
  const now = Date.UTC(2026, 9, 24, 12, 0, 0)
  assert.equal(sinceDay(30, now), '2026-09-25')
  assert.equal(sinceDay(1, now), '2026-10-24')
  assert.equal(sinceDay(0, now), '2026-10-24')
  assert.equal(sinceDay(9_999, now), '2025-10-25')
  assert.match(sinceDay(7, now), /^\d{4}-\d{2}-\d{2}$/)
})

test('analytics dashboard only accepts the preset ranges', () => {
  assert.equal(normalizeDays('7'), 7)
  assert.equal(normalizeDays('90'), 90)
  assert.equal(normalizeDays('30'), 30)
  // 任意值都回落 30，避免被抓参数打全表扫描
  assert.equal(normalizeDays('365'), 30)
  assert.equal(normalizeDays('abc'), 30)
  assert.equal(normalizeDays(null), 30)
  assert.equal(normalizeDays('-5'), 30)
})
