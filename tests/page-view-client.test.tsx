import assert from 'node:assert/strict'
import test, { type TestContext } from 'node:test'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { runInNewContext } from 'node:vm'
import { act, StrictMode, useMemo, type ReactNode } from 'react'
import { JSDOM } from 'jsdom'
import { PathnameContext, SearchParamsContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime'
import { POST } from '../src/app/api/analytics/page-view/route'
import { loadTrafficSummary } from '../src/lib/pageViews'
import { createTestDatabase } from './helpers/d1'

const ORIGIN = 'https://www.cs61bbeyond.com'
const STORAGE_KEY = 'cs-courses:page-view-attribution:v1'

// HistoryUpdater 没有公开导出，直接从当前安装的 Next 模块提取并执行原函数。
// 只隔离无关的 prefetch 通知，历史状态的生成与 insertion effect 都使用真实实现。
const require = createRequire(import.meta.url)
const routerSource = readFileSync(require.resolve('next/dist/client/components/app-router'), 'utf8')
const historyUpdaterSource = routerSource.slice(routerSource.indexOf('function HistoryUpdater('), routerSource.indexOf('\nfunction copyNextJsInternalHistoryState('))
const HistoryUpdater = runInNewContext(`(${historyUpdaterSource})`, {
  _react: require('react'),
  _createhreffromurl: require('next/dist/client/components/router-reducer/create-href-from-url'),
  _committedstate: require('next/dist/client/components/router-reducer/reducers/committed-state'),
  _links: { pingVisibleLinks() {} },
  process: { env: {} },
  URL,
  get window() { return globalThis.window }
}) as (props: { appRouterState: object }) => null

interface Payload {
  eventId: string
  pathname: string
  referrer: string
  utmSource: string
  utmMedium: string
  utmCampaign: string
}

async function setup(t: TestContext, { path = '/zh', referrer = '' } = {}) {
  const createDocument = (path: string, referrer: string) => new JSDOM('<!doctype html><div id="root"></div>', {
    url: ORIGIN + path, referrer: referrer || undefined, pretendToBeVisual: true
  }).window
  let window = createDocument(path, referrer)
  const reports: Payload[] = []
  const pending: Promise<Response>[] = []
  const transport: { send: (body: string) => Promise<Response> } = {
    send: async () => new Response(null, { status: 204 })
  }
  const globals = {
    window, document: window.document, navigator: window.navigator, IS_REACT_ACT_ENVIRONMENT: true,
    fetch: async (url: string, options: RequestInit) => {
      assert.equal(url, '/api/analytics/page-view')
      assert.equal(options.referrerPolicy, 'no-referrer')
      const body = String(options.body)
      reports.push(JSON.parse(body))
      const result = transport.send(body)
      pending.push(result)
      return result
    }
  }
  const descriptors = Object.keys(globals).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const)
  for (const [key, value] of Object.entries(globals)) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value })
  const { createRoot } = await import('react-dom/client')
  const { default: PageViewTracker } = await import('../src/components/PageViewTracker')
  let root = createRoot(window.document.getElementById('root')!)
  let instanceId = 0
  let searchParams: URLSearchParams

  function RouterContexts({ canonicalUrl, children }: { canonicalUrl: string, children: ReactNode }) {
    // 与 Next Router 一致：完整 URL（含 hash）不变时复用同一个 searchParams 对象。
    const route = useMemo(() => new URL(canonicalUrl, ORIGIN), [canonicalUrl])
    searchParams = route.searchParams
    return (
      <PathnameContext.Provider value={route.pathname}>
        <SearchParamsContext.Provider value={searchParams}>{children}</SearchParamsContext.Provider>
      </PathnameContext.Provider>
    )
  }

  // 复用 tracker 元素，URL 不变时它可以完全跳过 render，不能靠无依赖 effect 补救。
  let tracker = <PageViewTracker key={instanceId} />
  async function render(path = window.location.pathname + window.location.search + window.location.hash, routerNavigation = false) {
    if (!routerNavigation) window.history.replaceState(window.history.state, '', path)
    const route = new URL(path, window.location.href)
    const canonicalUrl = route.pathname + route.search + route.hash
    const appRouterState = {
      canonicalUrl,
      tree: ['route', { children: [canonicalUrl, {}] }],
      renderedSearch: route.search,
      nextUrl: null,
      pushRef: { pendingPush: true, preserveCustomHistoryState: false }
    }
    await act(async () => root.render(
      <StrictMode>
        {routerNavigation && <HistoryUpdater appRouterState={appRouterState} />}
        <RouterContexts canonicalUrl={canonicalUrl}>{tracker}</RouterContexts>
      </StrictMode>
    ))
    await Promise.all(pending)
  }

  // 整页导航创建新 Document，只继承标签页存储；避免把组件重挂载当成新文档。
  async function newDocument(path: string, referrer: string, type = 'navigate', historyState: unknown = null) {
    const stored = window.sessionStorage.getItem(STORAGE_KEY)
    await act(async () => root.unmount())
    window.close()
    window = createDocument(path, referrer)
    if (stored !== null) window.sessionStorage.setItem(STORAGE_KEY, stored)
    for (const [key, value] of Object.entries({ window, document: window.document, navigator: window.navigator })) {
      Object.defineProperty(globalThis, key, { configurable: true, writable: true, value })
    }
    root = createRoot(window.document.getElementById('root')!)
    window.history.replaceState(historyState, '', path)
    Object.defineProperty(window.performance, 'getEntriesByType', { configurable: true, value: () => [{ type }] })
    await render(path)
  }

  async function remount(path: string) {
    instanceId++
    tracker = <PageViewTracker key={instanceId} />
    await render(path)
  }

  async function restore(persisted = true) {
    await act(async () => window.dispatchEvent(new window.PageTransitionEvent('pageshow', { persisted })))
    await Promise.all(pending)
  }

  async function visibility(state: 'visible' | 'hidden') {
    Object.defineProperty(window.document, 'visibilityState', { configurable: true, value: state })
    await act(async () => window.document.dispatchEvent(new window.Event('visibilitychange')))
    await Promise.all(pending)
  }

  async function online() {
    await act(async () => window.dispatchEvent(new window.Event('online')))
    await Promise.all(pending)
  }

  t.after(async () => {
    await act(async () => root.unmount())
    window.close()
    for (const [key, descriptor] of descriptors) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor)
      else Reflect.deleteProperty(globalThis, key)
    }
  })
  return { get window() { return window }, get searchParams() { return searchParams }, reports, transport, render, newDocument, remount, restore, visibility, online }
}

test('Google entry is retained through SPA navigation, without duplicate StrictMode reports', async t => {
  const ui = await setup(t, { referrer: 'https://www.google.com/search?q=private-query' })
  await ui.render()
  await ui.render('/zh/courses')
  await ui.render('/zh/course/programming-introduction/python/CS61A')
  await ui.render()
  assert.equal(ui.reports.length, 3)
  assert.deepEqual(ui.reports.map(row => row.referrer), Array(3).fill('https://www.google.com'))
  assert.equal(new Set(ui.reports.map(row => row.eventId)).size, 3)
  assert.equal(JSON.stringify(ui.reports).includes('private-query'), false)
})

test('all entry UTM fields survive internal links without leaking other query parameters', async t => {
  const ui = await setup(t, {
    path: '/zh?utm_source=newsletter&utm_medium=email&utm_campaign=autumn&token=private-token',
    referrer: 'https://www.google.com/search?q=private-query'
  })
  await ui.render()
  await ui.render('/zh/courses')
  await ui.render('/zh/course/example?utm_source=internal-link&filter=os')
  for (const row of ui.reports) {
    assert.equal(row.utmSource, 'newsletter')
    assert.equal(row.utmMedium, 'email')
    assert.equal(row.utmCampaign, 'autumn')
    assert.equal(row.referrer, 'https://www.google.com')
  }
  const stored = ui.window.sessionStorage.getItem(STORAGE_KEY)!
  assert.equal(stored.includes('private-'), false)
  assert.equal(stored.includes('token'), false)
  assert.equal(JSON.stringify(ui.reports).includes('private-'), false)
})

test('same-site document navigation, reload and history navigation inherit the entry', async t => {
  const ui = await setup(t, { path: '/zh?utm_source=newsletter', referrer: 'https://www.google.com/' })
  await ui.render()
  const entryHistory = structuredClone(ui.window.history.state)
  await ui.newDocument('/zh/courses', ORIGIN + '/zh')
  await ui.newDocument('/zh/course/example', 'https://cs61bbeyond.com/zh/courses')
  const reloadHistory = structuredClone(ui.window.history.state)
  await ui.newDocument('/zh/course/example', ORIGIN + '/zh/courses', 'reload', reloadHistory)
  await ui.newDocument('/zh', '', 'back_forward', entryHistory)
  assert.equal(ui.reports.length, 5)
  for (const row of ui.reports) {
    assert.equal(row.referrer, 'https://www.google.com')
    assert.equal(row.utmSource, 'newsletter')
  }
})

test('component remounts within one document keep the original entry campaign', async t => {
  const ui = await setup(t, { path: '/zh?utm_source=newsletter', referrer: 'https://www.google.com/' })
  await ui.render()
  await ui.render('/zh/courses')
  await ui.remount('/courses')
  assert.equal(ui.reports.length, 3)
  assert.ok(ui.reports.every(row => row.utmSource === 'newsletter' && row.referrer === 'https://www.google.com'))
})

for (const type of ['back_forward', 'reload']) {
  test(`${type} after another entry does not borrow that newer entry source`, async t => {
    const ui = await setup(t, { referrer: 'https://www.google.com/' })
    await ui.render()
    await ui.render('/zh/courses')
    const originalHistory = structuredClone(ui.window.history.state)
    await ui.newDocument('/zh?utm_source=newsletter', '')
    assert.equal(ui.reports.at(-1)!.utmSource, 'newsletter')
    // 模拟旧文档已被回收，返回时重新加载 Google 入口下的站内页面。
    await ui.newDocument('/zh/courses', ORIGIN + '/zh', type, originalHistory)
    assert.equal(ui.reports.at(-1)!.referrer, 'https://www.google.com')
    assert.equal(ui.reports.at(-1)!.utmSource, '')
  })
}

test('old history without an attribution snapshot does not use a newer campaign', async t => {
  const ui = await setup(t, { path: '/zh?utm_source=newsletter' })
  await ui.render()
  await ui.newDocument('/zh/courses', ORIGIN + '/zh', 'back_forward')
  assert.equal(ui.reports.at(-1)!.utmSource, '')
  assert.equal(ui.reports.at(-1)!.referrer, '')
})

for (const entry of [
  {
    label: 'external campaign',
    path: '/zh?utm_source=new&utm_medium=social&utm_campaign=winter&token=private-token',
    referrer: 'https://www.bing.com/search?q=private-query',
    expected: { referrer: 'https://www.bing.com', utmSource: 'new', utmMedium: 'social', utmCampaign: 'winter' }
  },
  {
    label: 'direct entry',
    path: '/zh/courses',
    referrer: '',
    expected: { referrer: '', utmSource: '', utmMedium: '', utmCampaign: '' }
  },
  {
    label: 'internal link with no snapshot',
    path: '/zh/courses?utm_source=internal-link',
    referrer: ORIGIN + '/zh',
    expected: { referrer: '', utmSource: '', utmMedium: '', utmCampaign: '' }
  }
]) {
  test(`reload before attribution is saved does not borrow an older source: ${entry.label}`, async t => {
    const ui = await setup(t, {
      path: '/zh?utm_source=old&utm_medium=email&utm_campaign=autumn',
      referrer: 'https://www.google.com/'
    })
    await ui.render()
    // 新入口在 hydration 前刷新，尚未有自己的 history 快照；sessionStorage 仍是上次入口。
    await ui.newDocument(entry.path, entry.referrer, 'reload')
    await ui.render('/zh/course/example')
    for (const row of ui.reports.slice(-2)) {
      const { referrer, utmSource, utmMedium, utmCampaign } = row
      assert.deepEqual({ referrer, utmSource, utmMedium, utmCampaign }, entry.expected)
    }
    const stored = ui.window.sessionStorage.getItem(STORAGE_KEY)!
    assert.deepEqual(JSON.parse(stored), entry.expected)
    assert.equal(stored.includes('private-'), false)
  })
}

test('saving attribution preserves Next.js history state and does not add a history entry', async t => {
  const ui = await setup(t, { referrer: 'https://www.google.com/' })
  const routerState = { __NA: true, __PRIVATE_NEXTJS_INTERNALS_TREE: { tree: ['zh', {}] }, custom: 'retained' }
  ui.window.history.replaceState(routerState, '', '/zh')
  const length = ui.window.history.length
  await ui.render()
  assert.equal(ui.window.history.length, length)
  assert.equal(ui.window.location.pathname, '/zh')
  for (const [key, value] of Object.entries(routerState)) assert.deepEqual(ui.window.history.state[key], value)
})

for (const method of ['pushState', 'replaceState'] as const) {
  test(`${method} synchronously preserves the source without mutating caller state or adding a PV`, async t => {
    const ui = await setup(t, { path: '/zh?utm_source=newsletter', referrer: 'https://www.google.com/' })
    await ui.render()
    const callerState = { __NA: true, __PRIVATE_NEXTJS_INTERNALS_TREE: { tree: ['zh', {}] }, custom: 'retained' }
    const originalState = structuredClone(callerState)
    const historyLength = ui.window.history.length
    // 不派发事件、不触发 React render，必须在 History API 返回前就保存快照。
    ui.window.history[method](callerState, '', ui.window.location.href)
    const historyState = structuredClone(ui.window.history.state)
    assert.deepEqual(callerState, originalState)
    for (const [key, value] of Object.entries(callerState)) assert.deepEqual(historyState[key], value)
    assert.equal(ui.window.history.length, historyLength + (method === 'pushState' ? 1 : 0))
    assert.equal(ui.reports.length, 1)
    await ui.newDocument('/zh?utm_source=later', '')
    await ui.newDocument('/zh', ORIGIN + '/zh', 'back_forward', historyState)
    assert.equal(ui.reports.at(-1)!.utmSource, 'newsletter')
    assert.equal(ui.reports.at(-1)!.referrer, 'https://www.google.com')
  })
}

test('history wrappers preserve structured state types, primitive values and call errors', async t => {
  const ui = await setup(t, { path: '/zh?utm_source=newsletter' })
  await ui.render()
  const states = [new Date('2026-07-01T00:00:00Z'), new Map([['key', 'value']]), new Uint8Array([1, 2]), ['value'], 'value', 42, undefined]
  for (const method of ['pushState', 'replaceState'] as const) {
    for (const state of states) {
      ui.window.history[method](state, '')
      assert.deepEqual(ui.window.history.state, state, `${method} must preserve structured state`)
      const beforeSave = ui.window.history.state
      await act(async () => ui.window.dispatchEvent(new ui.window.Event('pagehide')))
      assert.deepEqual(ui.window.history.state, beforeSave, 'explicit snapshot saves must also leave structured state intact')
    }
    assert.throws(() => ui.window.history[method]({}, '', 'https://another.example/'), { name: 'SecurityError' })
  }
  assert.equal(ui.reports.length, 1)
})

for (const method of ['pushState', 'replaceState'] as const) {
  test(`${method} and snapshot saves preserve circular and shared history references`, async t => {
    const ui = await setup(t, { path: '/zh?utm_source=newsletter', referrer: 'https://www.google.com/' })
    const shared = { label: 'shared' }
    const buffer = new ArrayBuffer(8)
    const state = {
      __NA: true,
      __PRIVATE_NEXTJS_INTERNALS_TREE: { tree: ['zh', {}] },
      left: shared,
      right: shared,
      references: [] as unknown[],
      map: new Map<unknown, unknown>(),
      set: new Set<unknown>(),
      buffer,
      view: new Uint8Array(buffer)
    }
    state.references.push(state, shared)
    state.map.set(state, shared)
    state.map.set(shared, state)
    state.set.add(state)
    Object.assign(state, { self: state })
    Object.freeze(state)
    const expected = structuredClone(state)
    const assertGraph = () => {
      const actual = structuredClone(ui.window.history.state)
      assert.equal(actual.self, actual, 'self must refer to the saved root')
      assert.equal(actual.left, actual.right, 'shared child aliases must be preserved')
      assert.equal(actual.references[0], actual, 'arrays must retain references to the root')
      assert.equal(actual.references[1], actual.left)
      assert.equal(actual.map.get(actual), actual.left, 'map keys must retain root identity')
      assert.equal(actual.map.get(actual.left), actual)
      assert.ok(actual.set.has(actual), 'sets must retain references to the root')
      assert.equal(actual.view.buffer, actual.buffer, 'typed arrays must share the saved buffer')
      assert.equal(actual.__csCoursesPageViewAttributionV1.utmSource, 'newsletter')
      assert.equal(actual.__csCoursesPageViewAttributionV1.referrer, 'https://www.google.com')
      assert.deepEqual(state, expected, 'saving must not mutate the caller graph')
    }

    // 首次采集显式补存已有条目，也必须保留原始根节点的别名。
    ui.window.history.replaceState(state, '')
    await ui.render()
    assertGraph()
    const historyLength = ui.window.history.length
    ui.window.history[method](state, '', '/zh')
    assertGraph()
    await act(async () => ui.window.dispatchEvent(new ui.window.Event('pagehide')))
    assertGraph()
    assert.equal(ui.window.history.length, historyLength + (method === 'pushState' ? 1 : 0))
    assert.equal(ui.reports.length, 1)
    const historyState = structuredClone(ui.window.history.state)
    await ui.newDocument('/zh?utm_source=later', '')
    await ui.newDocument('/zh', ORIGIN + '/zh', 'back_forward', historyState)
    assertGraph()
    assert.equal(ui.reports.at(-1)!.utmSource, 'newsletter')
    assert.equal(ui.reports.at(-1)!.referrer, 'https://www.google.com')
  })
}

test('history serialization failures do not retry getters or write an entry', async t => {
  const ui = await setup(t)
  await ui.render()
  const historyLength = ui.window.history.length
  const historyState = ui.window.history.state
  for (const method of ['pushState', 'replaceState'] as const) {
    let reads = 0
    const state = {
      get value() {
        reads++
        // 二次序列化会得到可克隆值，从而把原本失败的调用变成成功。
        return reads === 1 ? () => {} : 'cloneable'
      }
    }
    assert.throws(() => ui.window.history[method](state, ''), { name: 'DataCloneError' })
    assert.equal(reads, 1, 'a failed serialization must not read a getter again')
    assert.equal(ui.window.history.length, historyLength)
    assert.equal(ui.window.history.state, historyState)
  }
})

test('document history wrappers survive tracker remounts without being installed again', async t => {
  const ui = await setup(t, { path: '/zh?utm_source=newsletter', referrer: 'https://www.google.com/' })
  await ui.render()
  const { pushState, replaceState } = ui.window.history
  await ui.remount('/zh/courses')
  assert.equal(ui.window.history.pushState, pushState)
  assert.equal(ui.window.history.replaceState, replaceState)
  ui.window.history.replaceState({ __NA: true }, '', '/zh/courses')
  const historyState = structuredClone(ui.window.history.state)
  await ui.newDocument('/zh?utm_source=later', '')
  await ui.newDocument('/zh/courses', ORIGIN + '/zh', 'back_forward', historyState)
  assert.equal(ui.reports.at(-1)!.utmSource, 'newsletter')
  assert.equal(ui.reports.at(-1)!.referrer, 'https://www.google.com')
})

test('query-only router navigation saves its history source without adding a PV', async t => {
  const ui = await setup(t, { path: '/zh/search?q=python&utm_source=newsletter', referrer: 'https://www.google.com/' })
  await ui.render()
  // Next.js 创建新的路由状态，当前 pathname 不变，只有 q 改变。
  ui.window.history.pushState({ __NA: true }, '', '/zh/search?q=java')
  await ui.render()
  const queryHistory = structuredClone(ui.window.history.state)
  assert.equal(ui.reports.length, 1)
  await ui.newDocument('/zh?utm_source=later', '')
  await ui.newDocument('/zh/search?q=java', ORIGIN + '/zh/search?q=python', 'back_forward', queryHistory)
  assert.equal(ui.reports.at(-1)!.utmSource, 'newsletter')
  assert.equal(ui.reports.at(-1)!.referrer, 'https://www.google.com')
})

for (const type of ['back_forward', 'reload']) {
  test(`same-URL Next navigation retains its source on ${type} with reused route objects`, async t => {
    const ui = await setup(t, {
      path: '/zh?utm_source=newsletter&utm_medium=email&utm_campaign=autumn',
      referrer: 'https://www.google.com/search?q=private-query'
    })
    await ui.render()
    // 站内整页入口的 document.referrer 没有 Google 信息，恢复只能信任历史快照。
    const path = '/zh/tutorial?view=full#learning-path'
    await ui.newDocument(path, ORIGIN + '/zh')
    const searchParams = ui.searchParams
    const historyLength = ui.window.history.length
    const reportsBeforeNavigation = ui.reports.length
    await ui.render(path, true)
    assert.equal(ui.searchParams, searchParams, 'same canonical URL must reuse Next route context')
    assert.equal(ui.window.history.length, historyLength)
    assert.equal(ui.reports.length, reportsBeforeNavigation, 'same URL must not add a PV')
    const originalHistory = structuredClone(ui.window.history.state)
    assert.equal(originalHistory.__NA, true)
    assert.equal(originalHistory.__PRIVATE_NEXTJS_INTERNALS_TREE.renderedSearch, '?view=full')

    // SPA 离开不触发 pagehide，必须在原条目被覆盖时就保存来源。
    await ui.render('/zh/courses', true)
    await ui.newDocument('/zh?utm_source=later', '')
    await ui.newDocument(path, ORIGIN + '/zh', type, originalHistory)
    const { referrer, utmSource, utmMedium, utmCampaign } = ui.reports.at(-1)!
    assert.deepEqual({ referrer, utmSource, utmMedium, utmCampaign }, {
      referrer: 'https://www.google.com', utmSource: 'newsletter', utmMedium: 'email', utmCampaign: 'autumn'
    })
  })

  test(`hash-only router navigation preserves the middle history source on ${type} without adding PVs`, async t => {
    const ui = await setup(t, {
      path: '/zh?utm_source=newsletter&utm_medium=email&utm_campaign=autumn',
      referrer: 'https://www.google.com/search?q=private-query'
    })
    await ui.render()
    // 教程文档自身只有站内 referrer，恢复来源必须依赖该历史条目的快照。
    await ui.newDocument('/zh/tutorial', ORIGIN + '/zh')
    const reportsBeforeHashes = ui.reports.length
    const historyLength = ui.window.history.length
    let hashEvents = 0
    ui.window.addEventListener('hashchange', () => { hashEvents++ })

    // Next Link 每次纯 hash 导航都会发布新的路由上下文，并重建 history state。
    // pushState 本身不发 hashchange；不能手动派发该事件来掩盖漏存的中间条目。
    const middlePath = '/zh/tutorial#learning-path'
    const middleRouterState = { __NA: true, __PRIVATE_NEXTJS_INTERNALS_TREE: { tree: ['zh', 'tutorial'] } }
    ui.window.history.pushState(middleRouterState, '', middlePath)
    await ui.render(middlePath)
    const middleHistory = structuredClone(ui.window.history.state)
    for (const [key, value] of Object.entries(middleRouterState)) assert.deepEqual(middleHistory[key], value)

    const lastPath = '/zh/tutorial#stage-1'
    ui.window.history.pushState({ __NA: true }, '', lastPath)
    await ui.render(lastPath)
    await act(async () => ui.window.dispatchEvent(new ui.window.Event('pagehide')))
    assert.equal(hashEvents, 0)
    assert.equal(ui.window.history.length, historyLength + 2, 'saving sources must not add history entries')
    assert.equal(ui.reports.length, reportsBeforeHashes, 'hash-only navigation must not add PVs')

    // pagehide 只能补存最后一个锚点。回收原文档、覆盖标签页最近来源后直接恢复中间条目。
    await ui.newDocument('/zh?utm_source=later', '')
    await ui.newDocument(middlePath, ORIGIN + '/zh', type, middleHistory)
    const { referrer, utmSource, utmMedium, utmCampaign } = ui.reports.at(-1)!
    assert.deepEqual({ referrer, utmSource, utmMedium, utmCampaign }, {
      referrer: 'https://www.google.com', utmSource: 'newsletter', utmMedium: 'email', utmCampaign: 'autumn'
    })
    assert.equal(ui.window.location.hash, '#learning-path')
    assert.equal(ui.reports.at(-1)!.pathname, '/zh/tutorial')
    assert.equal(ui.reports.length, reportsBeforeHashes + 2, 'only new documents add PVs')
  })
}

for (const eventName of ['hashchange', 'pagehide']) {
  test(`${eventName} preserves source if another component replaced the history state`, async t => {
    const ui = await setup(t, { path: '/zh?utm_source=newsletter' })
    await ui.render()
    ui.window.history.replaceState({ __NA: true }, '', '/zh#section')
    await act(async () => ui.window.dispatchEvent(new ui.window.Event(eventName)))
    const historyState = structuredClone(ui.window.history.state)
    assert.equal(ui.reports.length, 1)
    await ui.newDocument('/zh?utm_source=later', '')
    await ui.newDocument('/zh#section', '', 'back_forward', historyState)
    assert.equal(ui.reports.at(-1)!.utmSource, 'newsletter')
  })
}

test('internal full-page links keep entry attribution even if the link has UTM', async t => {
  const ui = await setup(t, { path: '/zh?utm_source=newsletter', referrer: 'https://www.google.com/' })
  await ui.render()
  await ui.newDocument('/zh/courses?utm_source=internal-link', ORIGIN + '/zh')
  assert.equal(ui.reports.at(-1)!.utmSource, 'newsletter')
  assert.equal(ui.reports.at(-1)!.referrer, 'https://www.google.com')
})

test('new external, campaign and direct entries replace attribution left in the tab', async t => {
  const ui = await setup(t, { path: '/zh?utm_source=newsletter', referrer: 'https://www.google.com/' })
  await ui.render()
  await ui.newDocument('/zh/courses', 'https://www.bing.com/search?q=cs')
  assert.equal(ui.reports.at(-1)!.referrer, 'https://www.bing.com')
  assert.equal(ui.reports.at(-1)!.utmSource, '')
  await ui.newDocument('/zh?utm_source=community&utm_medium=social', '')
  assert.equal(ui.reports.at(-1)!.utmSource, 'community')
  assert.equal(ui.reports.at(-1)!.referrer, '')
  await ui.newDocument('/zh/courses', '')
  await ui.render('/zh/course/example')
  for (const row of ui.reports.slice(-2)) {
    assert.equal(row.referrer, '')
    assert.equal(row.utmSource, '')
    assert.equal(row.utmMedium, '')
  }
})

test('BFCache restoration keeps entry attribution and records one new visible view', async t => {
  const ui = await setup(t, { path: '/zh?utm_source=newsletter', referrer: 'https://www.google.com/' })
  await ui.render()
  await ui.render('/zh/courses')
  await ui.restore(false)
  assert.equal(ui.reports.length, 2)
  await ui.visibility('hidden')
  await ui.restore()
  assert.equal(ui.reports.length, 2)
  await ui.visibility('visible')
  await ui.visibility('visible')
  assert.equal(ui.reports.length, 3)
  assert.equal(ui.reports[2].referrer, 'https://www.google.com')
  assert.equal(ui.reports[2].utmSource, 'newsletter')
  assert.notEqual(ui.reports[2].eventId, ui.reports[1].eventId)
})

for (const hidden of [false, true]) {
  test(`BFCache restoration to an earlier SPA entry does not report the frozen route (hidden: ${hidden})`, async t => {
    const ui = await setup(t, { path: '/zh?utm_source=newsletter', referrer: 'https://www.google.com/' })
    await ui.render()
    const entryHistory = structuredClone(ui.window.history.state)
    await ui.render('/zh/courses')
    if (hidden) await ui.visibility('hidden')
    // 浏览器先恢复旧 URL，再发 pageshow；Next 的上下文随后才从冻结时的课程页恢复。
    ui.window.history.replaceState(entryHistory, '', '/zh')
    await ui.restore()
    await ui.visibility('visible')
    await ui.online()
    await ui.render('/zh')
    assert.deepEqual(ui.reports.map(row => row.pathname), ['/zh', '/zh/courses', '/zh'])
    assert.equal(new Set(ui.reports.map(row => row.eventId)).size, 3)
    assert.ok(ui.reports.every(row => row.utmSource === 'newsletter' && row.referrer === 'https://www.google.com'))
  })
}

test('visibility before pageshow cannot report a hidden route from an earlier SPA history entry', async t => {
  const ui = await setup(t, { path: '/zh?utm_source=newsletter', referrer: 'https://www.google.com/' })
  await ui.render()
  const entryHistory = structuredClone(ui.window.history.state)
  await ui.visibility('hidden')
  await ui.render('/zh/courses')
  assert.equal(ui.reports.length, 1, 'the background route has never been shown')

  ui.window.history.replaceState(entryHistory, '', '/zh')
  // 浏览器先恢复可见性，再派发 pageshow；Next pathname 上下文此时仍可能冻结在旧路由。
  await ui.visibility('visible')
  await ui.online()
  assert.equal(ui.reports.length, 1, 'early recovery events must wait for the current route')
  await ui.restore()
  await ui.render('/zh')
  assert.deepEqual(ui.reports.map(row => row.pathname), ['/zh', '/zh'])
  assert.equal(new Set(ui.reports.map(row => row.eventId)).size, 2)
  assert.ok(ui.reports.every(row => row.utmSource === 'newsletter' && row.referrer === 'https://www.google.com'))
})

test('an initially hidden page reports its entry only when visible', async t => {
  const ui = await setup(t, { referrer: 'https://www.google.com/' })
  await ui.visibility('hidden')
  await ui.render()
  assert.equal(ui.reports.length, 0)
  await ui.visibility('visible')
  await ui.visibility('visible')
  assert.equal(ui.reports.length, 1)
  assert.equal(ui.reports[0].referrer, 'https://www.google.com')
})

test('navigation while hidden reports only the page actually shown, with the original entry', async t => {
  const ui = await setup(t, { path: '/zh?utm_source=newsletter', referrer: 'https://www.google.com/' })
  await ui.visibility('hidden')
  await ui.render()
  await ui.render('/zh/courses')
  await ui.render('/zh/course/example')
  assert.equal(ui.reports.length, 0)
  await ui.visibility('visible')
  await ui.visibility('visible')
  assert.equal(ui.reports.length, 1)
  assert.equal(ui.reports[0].pathname, '/zh/course/example')
  assert.equal(ui.reports[0].utmSource, 'newsletter')
  assert.equal(ui.reports[0].referrer, 'https://www.google.com')
  await ui.render('/zh/courses')
  assert.equal(ui.reports.length, 2)
  assert.notEqual(ui.reports[0].eventId, ui.reports[1].eventId)
})

test('BFCache restoration can send a new view while the previous request is still pending', async t => {
  const ui = await setup(t, { path: '/zh?utm_source=newsletter' })
  let finishFirst!: (response: Response) => void
  let calls = 0
  ui.transport.send = () => ++calls === 1
    ? new Promise(resolve => { finishFirst = resolve })
    : Promise.resolve(new Response(null, { status: 204 }))
  const initial = ui.render()
  await new Promise(resolve => setImmediate(resolve))
  const restored = ui.restore()
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(ui.reports.length, 2)
  assert.notEqual(ui.reports[0].eventId, ui.reports[1].eventId)
  assert.equal(ui.reports[1].utmSource, 'newsletter')
  finishFirst(new Response(null, { status: 503 }))
  await Promise.all([initial, restored])
  await ui.online()
  assert.equal(ui.reports.length, 2)
})

test('blocked history writes and session storage still preserve the entry within one document', async t => {
  const ui = await setup(t, { path: '/zh?utm_source=newsletter', referrer: 'https://www.google.com/' })
  const replaceState = ui.window.history.replaceState.bind(ui.window.history)
  t.mock.method(ui.window.history, 'replaceState', function (data: unknown, unused: string, url?: string | URL | null) {
    // 采集器只写状态（两参数），测试路由器仍可正常切换 URL（三参数）。
    if (arguments.length === 2) throw new ui.window.DOMException('State too large', 'QuotaExceededError')
    replaceState(data, unused, url)
  })
  Object.defineProperty(ui.window, 'sessionStorage', { get() { throw new ui.window.DOMException('Denied', 'SecurityError') } })
  await ui.render()
  await ui.render('/zh/courses')
  await ui.remount('/courses')
  assert.equal(ui.reports.length, 3)
  assert.ok(ui.reports.every(row => row.utmSource === 'newsletter' && row.referrer === 'https://www.google.com'))
})

for (const status of [503, 429]) {
  test(`a failed page-view response (${status}) can recover with the same event and source`, async t => {
    const ui = await setup(t, { path: '/zh?utm_source=newsletter', referrer: 'https://www.google.com/' })
    ui.transport.send = async () => new Response(null, { status })
    await ui.render()
    assert.equal(ui.reports.length, 1)
    ui.transport.send = async () => new Response(null, { status: 204 })
    await ui.online()
    assert.equal(ui.reports.length, 2)
    assert.deepEqual(ui.reports[1], ui.reports[0])
    await ui.visibility('visible')
    await ui.online()
    assert.equal(ui.reports.length, 2)
  })
}

test('a network failure retries once after reconnecting, without changing the source', async t => {
  const ui = await setup(t, { referrer: 'https://www.google.com/' })
  const requests: Payload[] = []
  t.mock.method(globalThis, 'fetch', async (_url: string, options: RequestInit) => {
    requests.push(JSON.parse(String(options.body)))
    if (requests.length === 1) throw new Error('Offline')
    return new Response(null, { status: 204 })
  })
  await ui.render()
  await ui.online()
  assert.equal(requests.length, 2)
  assert.deepEqual(requests[1], requests[0])
  await ui.online()
  assert.equal(requests.length, 2)
})

test('online and visibility events do not duplicate an in-flight request', async t => {
  const ui = await setup(t, { referrer: 'https://www.google.com/' })
  let complete!: (response: Response) => void
  ui.transport.send = () => new Promise(resolve => { complete = resolve })
  const rendering = ui.render()
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(ui.reports.length, 1)
  await act(async () => {
    ui.window.dispatchEvent(new ui.window.Event('online'))
    ui.window.document.dispatchEvent(new ui.window.Event('visibilitychange'))
  })
  assert.equal(ui.reports.length, 1)
  complete(new Response(null, { status: 204 }))
  await rendering
})

test('online during a pending failed request schedules one retry after it settles', async t => {
  const ui = await setup(t, { referrer: 'https://www.google.com/' })
  let failFirst!: (error: Error) => void
  const requests: Payload[] = []
  t.mock.method(globalThis, 'fetch', (_url: string, options: RequestInit) => {
    requests.push(JSON.parse(String(options.body)))
    if (requests.length === 1) {
      return new Promise<Response>((_resolve, reject) => { failFirst = reject })
    }
    return Promise.resolve(new Response(null, { status: 204 }))
  })

  await ui.render()
  assert.equal(requests.length, 1)
  await act(async () => ui.window.dispatchEvent(new ui.window.Event('online')))
  assert.equal(requests.length, 1, 'in-flight requests are not duplicated immediately')

  failFirst(new Error('Offline'))
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(requests.length, 2, 'the missed online signal is retried after the failure settles')
  assert.deepEqual(requests[1], requests[0], 'retry preserves the event id and attribution')
  await ui.online()
  assert.equal(requests.length, 2, 'successful retry does not schedule another request')
})

test('completion of an earlier page request cannot mark the new page as sent', async t => {
  const ui = await setup(t, { referrer: 'https://www.google.com/' })
  let finishFirst!: (response: Response) => void
  let calls = 0
  ui.transport.send = () => {
    calls++
    if (calls === 1) return new Promise(resolve => { finishFirst = resolve })
    return Promise.resolve(new Response(null, { status: calls === 2 ? 503 : 204 }))
  }
  const initialRender = ui.render()
  await new Promise(resolve => setImmediate(resolve))
  const navigation = ui.render('/zh/courses')
  await new Promise(resolve => setImmediate(resolve))
  finishFirst(new Response(null, { status: 204 }))
  await Promise.all([initialRender, navigation])
  await ui.online()
  assert.equal(ui.reports.length, 3)
  assert.deepEqual(ui.reports[2], ui.reports[1])
  assert.notEqual(ui.reports[2].eventId, ui.reports[0].eventId)
})

for (const failure of ['access', 'read', 'write'] as const) {
  test(`sessionStorage ${failure} failure does not break tracking or SPA attribution`, async t => {
    const ui = await setup(t, { referrer: 'https://www.google.com/' })
    if (failure === 'access') {
      Object.defineProperty(ui.window, 'sessionStorage', { get() { throw new Error('Denied') } })
    } else {
      t.mock.method(ui.window.Storage.prototype, failure === 'read' ? 'getItem' : 'setItem', () => { throw new Error('Denied') })
    }
    // Reload 会尝试读存储；失败后仍可使用文档中的外站来源。
    Object.defineProperty(ui.window.performance, 'getEntriesByType', { value: () => [{ type: 'reload' }] })
    await ui.render()
    await ui.render('/zh/courses')
    assert.equal(ui.reports.length, 2)
    assert.ok(ui.reports.every(row => row.referrer === 'https://www.google.com'))
  })
}

for (const stored of ['invalid json', '{"referrer":123}', '[]']) {
  test(`invalid stored attribution is ignored: ${stored}`, async t => {
    const ui = await setup(t)
    ui.window.sessionStorage.setItem(STORAGE_KEY, stored)
    await ui.newDocument('/zh?utm_source=internal-link', ORIGIN + '/zh/courses')
    await ui.render('/zh/courses')
    assert.equal(ui.reports.length, 2)
    assert.ok(ui.reports.every(row => row.referrer === '' && row.utmSource === ''))
  })
}

test('untracked paths do not record or consume the entry attribution', async t => {
  const ui = await setup(t, { path: '/admin', referrer: 'https://www.google.com/' })
  await ui.render()
  assert.equal(ui.reports.length, 0)
  assert.equal(ui.window.sessionStorage.getItem(STORAGE_KEY), null)
  await ui.render('/zh')
  assert.equal(ui.reports[0].referrer, 'https://www.google.com')
})

test('client reports and retry after a committed insert produce correct D1 source totals', async t => {
  const ui = await setup(t, { referrer: 'https://www.google.com/search?q=cs61b' })
  const database = await createTestDatabase()
  const symbol = Symbol.for('__cloudflare-context__')
  const original = Object.getOwnPropertyDescriptor(globalThis, symbol)
  Object.defineProperty(globalThis, symbol, { configurable: true, value: { env: { DB: database.db, ANALYTICS_SALT: 'test-salt' } } })
  t.after(async () => {
    if (original) Object.defineProperty(globalThis, symbol, original)
    else Reflect.deleteProperty(globalThis, symbol)
    await database.dispose()
  })
  let loseFirstResponse = true
  ui.transport.send = async body => {
    const response = await POST(new Request(ORIGIN + '/api/analytics/page-view', {
      method: 'POST', body,
      headers: { origin: ORIGIN, 'content-type': 'application/json', 'user-agent': 'Mozilla/5.0 Chrome/145.0', 'cf-connecting-ip': '203.0.113.7' }
    }))
    assert.equal(response.status, 204)
    if (loseFirstResponse) {
      loseFirstResponse = false
      return new Response(null, { status: 503 })
    }
    return response
  }
  await ui.render()
  await ui.online()
  assert.deepEqual(ui.reports[1], ui.reports[0])
  await ui.render('/zh/courses')
  await ui.restore()
  await ui.newDocument('/zh?utm_source=newsletter', '')
  await ui.render('/zh/courses')
  await ui.newDocument('/zh', '')
  const summary = await loadTrafficSummary(database.db)
  assert.equal(summary.totals.pv, 6)
  assert.deepEqual(summary.sources.map(({ label, pv }) => ({ label, pv })), [
    { label: 'google.com', pv: 3 },
    { label: 'utm:newsletter', pv: 2 },
    { label: '直接访问 / 来源未知', pv: 1 }
  ])
})
