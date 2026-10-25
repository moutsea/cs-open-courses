import assert from 'node:assert/strict'
import { before, test } from 'node:test'

/**
 * /admin/gaps 每次请求都重建内容索引（约 400–600ms）。生产环境按部署缓存，
 * 开发环境不缓存（改了 md 刷新就能看到）。缓存开关在模块加载时读 NODE_ENV，
 * 所以这里先设环境变量再动态 import；node --test 每个文件独立进程，不影响别的测试。
 */
type GapIndexModule = typeof import('../src/lib/searchGapIndex')
type SearchIndexModule = typeof import('../src/lib/searchIndex')
let buildContentIndex: GapIndexModule['buildContentIndex']
let countSearchHits: GapIndexModule['countSearchHits']
let getContentIndex: GapIndexModule['getContentIndex']
let buildSearchIndex: SearchIndexModule['buildSearchIndex']
let searchCourses: SearchIndexModule['searchCourses']

before(async () => {
  ;(process.env as Record<string, string>).NODE_ENV = 'production'
  ;({ buildContentIndex, countSearchHits, getContentIndex } = await import('../src/lib/searchGapIndex'))
  ;({ buildSearchIndex, searchCourses } = await import('../src/lib/searchIndex'))
})

test('production reuses the content index per locale and matches a fresh build', async () => {
  const first = await getContentIndex('zh')
  const second = await getContentIndex('zh')
  assert.equal(first, second, 'same locale must hit the cache')

  const english = await getContentIndex('en')
  assert.notEqual(english, first, 'locales are cached separately')

  // 缓存的是同一份结果，不是近似值。
  const fresh = await buildContentIndex('zh')
  assert.deepEqual(first.entries, fresh.entries)
  assert.deepEqual([...first.courseCodes].sort(), [...fresh.courseCodes].sort())
})

test('concurrent first requests share one build', async () => {
  const [a, b] = await Promise.all([getContentIndex('zh'), getContentIndex('zh')])
  assert.equal(a, b)
})

test('cached search hit counts equal a direct search', async () => {
  const searchIndex = await buildSearchIndex()
  for (const term of ['CS61B', 'cs61b', '操作系统', 'zzz-not-a-course']) {
    const expected = searchCourses(term, searchIndex).length
    assert.equal(countSearchHits(term, searchIndex), expected, term)
    // 第二次走缓存，结果不变。
    assert.equal(countSearchHits(term, searchIndex), expected, term)
  }
  assert.ok(countSearchHits('CS61B', searchIndex) > 0)
  assert.equal(countSearchHits('zzz-not-a-course', searchIndex), 0)
})
