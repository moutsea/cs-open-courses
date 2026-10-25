import assert from 'node:assert/strict'
import { test, type TestContext } from 'node:test'
import { JSDOM } from 'jsdom'
import { createRequire } from 'node:module'
import { act, StrictMode, type ReactNode } from 'react'
import { AppRouterContext, type AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { PathnameContext, SearchParamsContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime'
import type { Category } from '../src/lib/courseParser'

const storageKey = 'cs61b-courses-sort'
const categories: Category[] = [{
  name: 'Programming', slug: 'programming-introduction', subcategories: [],
  courses: [
    { id: 'a', slug: 'a', path: 'programming-introduction/a', title: 'Alpha advanced', difficulty: 'Advanced' },
    { id: 'z', slug: 'z', path: 'programming-introduction/z', title: 'Zulu beginner', difficulty: 'Beginner' }
  ].map(course => ({ ...course, content: '', description: '', hasEnglishVersion: true }))
}]

async function setup(t: TestContext, mobile = false) {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', {
    url: 'https://www.cs61bbeyond.com/search?q=python', pretendToBeVisual: true
  })
  const { window } = dom
  // Analytics batching has separate coverage; keep its delayed fetches out of search request assertions.
  Object.defineProperty(window.navigator, 'doNotTrack', { value: '1', configurable: true })
  window.matchMedia = (query: string) => ({
    matches: query.includes('min-width') ? !mobile : false, media: query, onchange: null,
    addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => true
  })
  if (!('inert' in window.HTMLElement.prototype)) {
    Object.defineProperty(window.HTMLElement.prototype, 'inert', {
      get() { return this.hasAttribute('inert') },
      set(value: boolean) { this.toggleAttribute('inert', value) }
    })
  }
  const globals = {
    window, self: window, document: window.document, navigator: window.navigator,
    Node: window.Node, Element: window.Element, HTMLElement: window.HTMLElement,
    HTMLInputElement: window.HTMLInputElement, HTMLButtonElement: window.HTMLButtonElement,
    HTMLAnchorElement: window.HTMLAnchorElement, HTMLFieldSetElement: window.HTMLFieldSetElement,
    HTMLLegendElement: window.HTMLLegendElement, MutationObserver: window.MutationObserver,
    getComputedStyle: window.getComputedStyle.bind(window),
    requestAnimationFrame: window.requestAnimationFrame.bind(window),
    cancelAnimationFrame: window.cancelAnimationFrame.bind(window), IS_REACT_ACT_ENVIRONMENT: true
  }
  const descriptors = Object.keys(globals).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const)
  for (const [key, value] of Object.entries(globals)) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value })
  // Import the DOM renderer after installing a browser environment, including its input event support.
  const { createRoot } = await import('react-dom/client')
  const { NextIntlClientProvider } = createRequire(`${process.cwd()}/package.json`)('next-intl') as typeof import('next-intl')
  const { default: CoursesContent } = await import('../src/components/CoursesContent')
  const { default: Header } = await import('../src/components/Header')
  const { default: SearchResults } = await import('../src/components/SearchResults')
  const { default: SearchRetryProvider } = await import('../src/components/SearchRetryProvider')
  const errors: unknown[] = []
  const root = createRoot(window.document.getElementById('root')!, { onUncaughtError: error => errors.push(error) })
  const pushes: string[] = []
  const router: AppRouterInstance = {
    push: href => { pushes.push(href) }, replace() {}, refresh() {}, back() {}, forward() {}, prefetch() {}
  }
  let mounted = true
  async function render(node: ReactNode, url = window.location.href) {
    window.history.replaceState(null, '', url)
    await Promise.resolve(act(async () => root.render(
      <StrictMode>
        <AppRouterContext.Provider value={router}>
          <PathnameContext.Provider value={window.location.pathname}>
            <SearchParamsContext.Provider value={new URLSearchParams(window.location.search)}>
              <NextIntlClientProvider locale="en" messages={{}} timeZone="UTC">{node}</NextIntlClientProvider>
            </SearchParamsContext.Provider>
          </PathnameContext.Provider>
        </AppRouterContext.Provider>
      </StrictMode>
    ))).catch(error => { throw error instanceof AggregateError ? error.errors[0] : error })
  }
  async function unmount() {
    if (mounted) { await act(async () => root.unmount()); mounted = false }
  }
  t.after(async () => {
    await unmount()
    window.close()
    for (const [key, descriptor] of descriptors) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor)
      else Reflect.deleteProperty(globalThis, key)
    }
  })
  const document = window.document as Document
  async function click(element: Element | null) {
    assert.ok(element, 'Expected clickable element')
    await act(async () => element.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true })))
  }
  const button = (label: string) => [...document.querySelectorAll('button')].find(element => element.textContent === label)!
  const courseTitles = () => [...document.querySelectorAll('li a[href^="/course/"]')].map(a => a.textContent)
  async function submitSearch(panelId: string, query?: string) {
    const input = document.querySelector<HTMLInputElement>(`#${panelId} input`)!
    assert.ok(input)
    if (query !== undefined) {
      await act(async () => {
        Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!.call(input, query)
        input.dispatchEvent(new window.Event('input', { bubbles: true }))
      })
    }
    await act(async () => input.form!.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })))
  }
  return { window, document, errors, pushes, render, unmount, click, button, courseTitles, submitSearch, CoursesContent, Header, SearchResults, SearchRetryProvider }
}

for (const failure of ['access', 'read', 'write'] as const) {
  test(`course sorting survives localStorage ${failure} failures`, async t => {
    const ui = await setup(t)
    if (failure === 'access') {
      Object.defineProperty(ui.window, 'localStorage', { get() { throw new ui.window.DOMException('Denied', 'SecurityError') } })
    } else {
      t.mock.method(ui.window.Storage.prototype, failure === 'read' ? 'getItem' : 'setItem', () => {
        throw new ui.window.DOMException('Unavailable', failure === 'write' ? 'QuotaExceededError' : 'SecurityError')
      })
    }
    await ui.render(<ui.CoursesContent categories={categories} locale="en" />)
    assert.deepEqual(ui.errors, [])
    assert.match(ui.courseTitles()[0], /Zulu beginner/)
    await ui.click(ui.button('By name'))
    assert.match(ui.courseTitles()[0], /Alpha advanced/)
    await ui.click(ui.button('By difficulty'))
    assert.match(ui.courseTitles()[0], /Zulu beginner/)
    assert.deepEqual(ui.errors, [])
  })
}

test('stored sorting survives StrictMode mounting and subsequent choices are persisted', async t => {
  const ui = await setup(t)
  ui.window.localStorage.setItem(storageKey, 'title')
  await ui.render(<ui.CoursesContent categories={categories} locale="en" />)
  assert.match(ui.courseTitles()[0], /Alpha advanced/)
  assert.equal(ui.window.localStorage.getItem(storageKey), 'title')
  await ui.click(ui.button('By difficulty'))
  assert.equal(ui.window.localStorage.getItem(storageKey), 'difficulty')
  assert.match(ui.courseTitles()[0], /Zulu beginner/)
})

test('invalid stored sorting falls back to difficulty', async t => {
  const ui = await setup(t)
  ui.window.localStorage.setItem(storageKey, 'invalid')
  await ui.render(<ui.CoursesContent categories={categories} locale="en" />)
  assert.match(ui.courseTitles()[0], /Zulu beginner/)
  assert.deepEqual(ui.errors, [])
})

const filterCategories: Category[] = [
  {
    name: 'Systems', slug: 'operating-systems', subcategories: [
      {
        name: 'Kernel', slug: 'kernel',
        courses: [{ id: 'k', slug: 'k', path: 'operating-systems/kernel/k', title: 'Kernel internals', difficulty: 'Advanced', content: '', description: '', hasEnglishVersion: true }]
      }
    ],
    courses: [{ id: 'o', slug: 'o', path: 'operating-systems/o', title: 'Operating systems', difficulty: 'Intermediate', content: '', description: '', hasEnglishVersion: true }]
  },
  {
    name: 'Languages', slug: 'programming-introduction', subcategories: [],
    courses: [{ id: 'p', slug: 'p', path: 'programming-introduction/p', title: 'Python basics', difficulty: 'Beginner', content: '', description: '', hasEnglishVersion: true }]
  }
]

test('filter and sort live in the URL so refresh, share and back all restore them', async t => {
  const ui = await setup(t)
  await ui.render(<ui.CoursesContent categories={filterCategories} locale="en" />, '/courses?filter=operating-systems/kernel&sort=title')
  // 直接打开带参数的地址：筛选还原成子分类，排序也一起还原。
  assert.match(ui.window.location.search, /filter=operating-systems%2Fkernel/)
  assert.match(ui.window.location.search, /sort=title/)
  assert.equal(ui.courseTitles().length, 1)
  assert.match(ui.courseTitles()[0], /Kernel internals/)
  // 点「全部课程」后参数被清掉，回到全量列表。
  await ui.click(ui.document.querySelector('a[href="/courses"]'))
  assert.equal(ui.window.location.search.includes('filter='), false)
  assert.equal(ui.courseTitles().length, 2)
  // 换成另一个分类：URL 跟着走（replaceState，不新增历史条目）。
  const languages = [...ui.document.querySelectorAll('a[href="/courses/programming-introduction"]')][0]
  await ui.click(languages)
  assert.match(ui.window.location.search, /filter=programming-introduction/)
  assert.equal(ui.courseTitles().length, 1)
  assert.match(ui.courseTitles()[0], /Python basics/)
  // 排序切回默认值时不再占参数位。
  await ui.click(ui.button('By difficulty'))
  assert.equal(ui.window.location.search.includes('sort='), false)
  assert.deepEqual(ui.errors, [])
})

test('a filter that no longer exists is dropped instead of showing an empty list', async t => {
  const ui = await setup(t)
  await ui.render(<ui.CoursesContent categories={filterCategories} locale="en" />, '/courses?filter=deleted-category')
  assert.equal(ui.window.location.search.includes('filter='), false)
  assert.equal(ui.courseTitles().length, 2)
  assert.deepEqual(ui.errors, [])
})

for (const mobile of [false, true]) {
  for (const query of ['java', 'python', '   ']) {
    test(`${mobile ? 'mobile' : 'desktop'} search ${query.trim() ? `submission (${query}) unlocks results` : 'rejects blank input without closing'}`, async t => {
      const ui = await setup(t, mobile)
      ui.document.body.style.overflow = 'auto'
      await ui.render(<><ui.Header locale="en" /><main>Results</main><footer>Footer</footer></>)
      const main = ui.document.querySelector('main')!
      const footer = ui.document.querySelector('footer')!
      const panelId = mobile ? 'mobile-menu' : 'header-search'
      const toggle = ui.document.querySelector(`button[aria-controls="${panelId}"]`)!
      await ui.click(toggle)
      assert.equal(main.inert, true)
      assert.equal(footer.getAttribute('aria-hidden'), 'true')
      if (mobile) assert.equal(ui.document.body.style.overflow, 'hidden')
      const input = ui.document.querySelector<HTMLInputElement>(`#${panelId} input`)!
      assert.ok(input)
      await act(async () => {
        Object.getOwnPropertyDescriptor(ui.window.HTMLInputElement.prototype, 'value')!.set!.call(input, query)
        input.dispatchEvent(new ui.window.Event('input', { bubbles: true }))
      })
      await act(async () => input.form!.dispatchEvent(new ui.window.Event('submit', { bubbles: true, cancelable: true })))
      if (query.trim()) {
        assert.deepEqual(ui.pushes, [`/search?q=${query}`])
        assert.equal(toggle.getAttribute('aria-expanded'), 'false')
        assert.equal(main.inert, false)
        assert.equal(main.getAttribute('aria-hidden'), null)
        assert.equal(footer.inert, false)
        assert.equal(footer.getAttribute('aria-hidden'), null)
        assert.equal(ui.document.body.style.overflow, 'auto')
      } else {
        assert.deepEqual(ui.pushes, [])
        assert.equal(toggle.getAttribute('aria-expanded'), 'true')
        assert.equal(main.inert, true)
      }
      assert.deepEqual(ui.errors, [])
    })
  }
}

function mockSearch(t: TestContext) {
  const requests: Array<{
    url: URL; signal?: AbortSignal | null;
    resolve: (response: Response) => void; reject: (error: Error) => void
  }> = []
  t.mock.method(globalThis, 'fetch', (input: string | URL | Request, init?: RequestInit) => new Promise<Response>((resolve, reject) => {
    // Deliberately ignore cancellation: a transport or JSON parse can finish after an abort.
    requests.push({ url: new URL(String(input), 'https://www.cs61bbeyond.com'), signal: init?.signal, resolve, reject })
  }))
  const response = (title: string, total = 1) => new Response(JSON.stringify({
    results: [{ relevanceScore: 10, course: {
      id: title, title, titleEn: title, path: `programming-introduction/${title}`,
      description: '', descriptionEn: '', university: '', difficulty: '', programmingLanguage: ''
    } }], total, page: 1, totalPages: total
  }))
  return { requests, response }
}

test('late search success cannot replace a newer query or its pagination', async t => {
  const ui = await setup(t)
  const api = mockSearch(t)
  await ui.render(<ui.SearchResults locale="en" query="python" page={1} />)
  const oldRequests = [...api.requests]
  await ui.render(<ui.SearchResults locale="en" query="java" page={1} />)
  await act(async () => api.requests.at(-1)!.resolve(api.response('Java result')))
  for (const request of oldRequests) await act(async () => request.resolve(api.response('Python result', 8)))
  assert.match(ui.document.body.textContent!, /Java result/)
  assert.doesNotMatch(ui.document.body.textContent!, /Python result|8 courses/)
  assert.equal(ui.document.querySelector('nav'), null)
  assert.ok(oldRequests.every(request => request.signal?.aborted))
})

test('late search errors do not replace results or clear the next loading state', async t => {
  const ui = await setup(t)
  const api = mockSearch(t)
  const logged = t.mock.method(console, 'error', () => {})
  await ui.render(<ui.SearchResults locale="en" query="python" page={1} />)
  const oldRequests = [...api.requests]
  await ui.render(<ui.SearchResults locale="en" query="java" page={1} />)
  for (const request of oldRequests) await act(async () => request.reject(new Error('Old network failure')))
  assert.ok(ui.document.querySelector('.animate-pulse'), 'Current search must keep loading')
  assert.equal(logged.mock.callCount(), 0)
  await act(async () => api.requests.at(-1)!.resolve(api.response('Java result')))
  assert.match(ui.document.body.textContent!, /Java result/)
  assert.doesNotMatch(ui.document.body.textContent!, /temporarily unavailable/)
})

test('pagination and locale changes discard earlier responses', async t => {
  const ui = await setup(t)
  const api = mockSearch(t)
  await ui.render(<ui.SearchResults locale="en" query="java" page={1} />)
  await ui.render(<ui.SearchResults locale="en" query="java" page={2} />)
  await ui.render(<ui.SearchResults locale="zh" query="java" page={2} />)
  const current = api.requests.at(-1)!
  assert.equal(current.url.searchParams.get('page'), '2')
  assert.equal(current.url.searchParams.get('locale'), 'zh')
  await act(async () => current.resolve(api.response('中文结果')))
  for (const request of api.requests.slice(0, -1)) {
    await act(async () => request.resolve(api.response('Stale page')))
    assert.equal(request.signal?.aborted, true)
  }
  assert.match(ui.document.body.textContent!, /中文结果/)
  assert.doesNotMatch(ui.document.body.textContent!, /Stale page/)
})

test('clearing a query and unmounting abort outstanding searches', async t => {
  const ui = await setup(t)
  const api = mockSearch(t)
  await ui.render(<ui.SearchResults locale="en" query="python" page={1} />)
  await ui.render(<ui.SearchResults locale="en" query="" page={1} />)
  for (const request of api.requests) {
    assert.equal(request.signal?.aborted, true)
    await act(async () => request.resolve(api.response('Old result')))
  }
  assert.match(ui.document.body.textContent!, /Start searching/)
  await ui.render(<ui.SearchResults locale="en" query="java" page={1} />)
  const pending = api.requests.at(-1)!
  await ui.unmount()
  assert.equal(pending.signal?.aborted, true)
  await act(async () => pending.resolve(api.response('Unmounted result')))
  assert.deepEqual(ui.errors, [])
})

test('current search failures remain visible and a new search can recover', async t => {
  const ui = await setup(t)
  const api = mockSearch(t)
  t.mock.method(console, 'error', () => {})
  await ui.render(<ui.SearchResults locale="en" query="python" page={1} />)
  await act(async () => api.requests.at(-1)!.resolve(new Response('', { status: 503 })))
  assert.match(ui.document.body.textContent!, /Search is temporarily unavailable/)
  await ui.render(<ui.SearchResults locale="en" query="java" page={1} />)
  await act(async () => api.requests.at(-1)!.resolve(api.response('Java result')))
  assert.match(ui.document.body.textContent!, /Java result/)
  assert.doesNotMatch(ui.document.body.textContent!, /temporarily unavailable/)
})

for (const mobile of [false, true]) {
  for (const destination of ['/search?q=java', '/search?q=python&page=2']) {
    test(`${mobile ? 'mobile' : 'desktop'} history back and forward (${destination}) close panels and restore the page`, async t => {
      const ui = await setup(t, mobile)
      ui.document.body.style.overflow = 'auto'
      const content = <><ui.Header locale="en" /><main>Results</main><footer>Footer</footer></>
      await ui.render(content)
      ui.window.history.pushState(null, '', destination)
      await ui.render(content)
      const panelId = mobile ? 'mobile-menu' : 'header-search'
      const toggle = ui.document.querySelector(`button[aria-controls="${panelId}"]`)!
      const main = ui.document.querySelector('main')!
      const footer = ui.document.querySelector('footer')!

      for (const direction of ['back', 'forward'] as const) {
        await ui.click(toggle)
        // Recreating the router context at the same URL must not close an open panel.
        await ui.render(content)
        assert.equal(toggle.getAttribute('aria-expanded'), 'true')
        assert.equal(main.inert, true)
        if (mobile) assert.equal(ui.document.body.style.overflow, 'hidden')
        await act(async () => new Promise<void>(resolve => {
          ui.window.addEventListener('popstate', () => resolve(), { once: true })
          ui.window.history[direction]()
        }))
        // Next updates these contexts after popstate; preserve the mounted Header instance.
        await ui.render(content)
        assert.equal(ui.window.location.pathname + ui.window.location.search, direction === 'back' ? '/search?q=python' : destination)
        assert.equal(toggle.getAttribute('aria-expanded'), 'false')
        assert.equal(main.inert, false)
        assert.equal(main.getAttribute('aria-hidden'), null)
        assert.equal(footer.inert, false)
        assert.equal(footer.getAttribute('aria-hidden'), null)
        assert.equal(ui.document.body.style.overflow, 'auto')
      }
      assert.deepEqual(ui.errors, [])
    })
  }

  test(`${mobile ? 'mobile Chinese' : 'desktop English'} same-query submission retries a failed search without remounting`, async t => {
    const ui = await setup(t, mobile)
    const api = mockSearch(t)
    t.mock.method(console, 'error', () => {})
    const locale = mobile ? 'zh' : 'en'
    const path = mobile ? '/zh/search?q=python' : '/search?q=python'
    const content = (
      <ui.SearchRetryProvider query="python" locale={locale} page={1}>
        <ui.Header locale={locale} />
        <main><ui.SearchResults query="python" locale={locale} page={1} /></main>
        <footer>Footer</footer>
      </ui.SearchRetryProvider>
    )
    await ui.render(content, path)
    const failed = api.requests.at(-1)!
    await act(async () => failed.resolve(new Response('', { status: 503 })))
    assert.match(ui.document.body.textContent!, /temporarily unavailable|搜索暂时不可用/)
    const count = api.requests.length
    const panelId = mobile ? 'mobile-menu' : 'header-search'
    const toggle = ui.document.querySelector(`button[aria-controls="${panelId}"]`)!
    await ui.click(toggle)
    await ui.submitSearch(panelId, ' python ')
    assert.equal(api.requests.length, count + 1, 'Submitting the same query must start a new request')
    assert.equal(failed.signal?.aborted, true)
    assert.deepEqual(ui.pushes, [path])
    assert.equal(toggle.getAttribute('aria-expanded'), 'false')
    assert.equal(ui.document.querySelector('main')!.inert, false)
    assert.ok(ui.document.querySelector('.animate-pulse'))
    const retried = api.requests.at(-1)!
    assert.equal(retried.url.searchParams.get('q'), 'python')
    assert.equal(retried.url.searchParams.get('locale'), locale)
    assert.equal(retried.url.searchParams.get('page'), '1')
    // A same-URL server rerender must neither reset nor duplicate the retry.
    await ui.render(content)
    assert.equal(api.requests.length, count + 1)
    assert.equal(retried.signal?.aborted, false)
    await act(async () => retried.resolve(api.response('Recovered Python result')))
    for (const stale of api.requests.slice(0, -1)) {
      await act(async () => stale.resolve(api.response('Stale result')))
    }
    assert.match(ui.document.body.textContent!, /Recovered Python result/)
    assert.doesNotMatch(ui.document.body.textContent!, /temporarily unavailable|搜索暂时不可用|Stale result/)
    assert.deepEqual(ui.errors, [])
  })
}

test('the retry button preserves the current query, locale and page across repeated failures', async t => {
  const ui = await setup(t)
  const api = mockSearch(t)
  t.mock.method(console, 'error', () => {})
  await ui.render(<ui.SearchResults query="python" locale="zh" page={2} />)
  for (let attempt = 0; attempt < 2; attempt++) {
    const failed = api.requests.at(-1)!
    await act(async () => failed.resolve(new Response('', { status: 503 })))
    const count = api.requests.length
    await ui.click(ui.button('重试'))
    assert.equal(api.requests.length, count + 1)
    assert.equal(failed.signal?.aborted, true)
    assert.ok(ui.document.querySelector('.animate-pulse'))
    assert.equal(api.requests.at(-1)!.url.search, '?q=python&page=2&limit=10&locale=zh')
  }
  await act(async () => api.requests.at(-1)!.resolve(api.response('重试成功')))
  assert.match(ui.document.body.textContent!, /重试成功/)
  assert.doesNotMatch(ui.document.body.textContent!, /搜索暂时不可用/)
  assert.deepEqual(ui.pushes, [])
})

for (const scenario of [{ page: 1, submitted: 'java' }, { page: 2, submitted: 'python' }]) {
  test(`submitting ${scenario.submitted} from python page ${scenario.page} does not retry obsolete results`, async t => {
    const ui = await setup(t)
    const api = mockSearch(t)
    const content = (query: string, page: number) => (
      <ui.SearchRetryProvider query={query} locale="en" page={page}>
        <ui.Header locale="en" />
        <main><ui.SearchResults query={query} locale="en" page={page} /></main>
      </ui.SearchRetryProvider>
    )
    await ui.render(content('python', scenario.page), `/search?q=python&page=${scenario.page}`)
    const count = api.requests.length
    await ui.click(ui.document.querySelector('button[aria-controls="header-search"]'))
    await ui.submitSearch('header-search', scenario.submitted)
    assert.equal(api.requests.length, count, 'Navigation should not retry the old query/page')
    assert.deepEqual(ui.pushes, [`/search?q=${scenario.submitted}`])
    await ui.render(content(scenario.submitted, 1), ui.pushes[0])
    assert.equal(api.requests.length, count + 1)
    await act(async () => api.requests.at(-1)!.resolve(api.response('Current result')))
    for (const request of api.requests.slice(0, -1)) {
      assert.equal(request.signal?.aborted, true)
      await act(async () => request.resolve(api.response('Stale result')))
    }
    assert.match(ui.document.body.textContent!, /Current result/)
    assert.doesNotMatch(ui.document.body.textContent!, /Stale result/)
  })
}

for (const mobile of [false, true]) {
  test(`${mobile ? 'mobile' : 'desktop'} escape returns focus to the button that opened the panel`, async t => {
    const ui = await setup(t, mobile)
    await ui.render(<><ui.Header locale="en" /><main>Results</main></>)
    const trigger = ui.document.querySelector<HTMLButtonElement>(
      mobile ? 'button[aria-controls="mobile-menu"]' : 'button[aria-controls="header-search"]'
    )!
    assert.ok(trigger)
    await ui.click(trigger)
    assert.equal(trigger.getAttribute('aria-expanded'), 'true')
    // 焦点先移到面板里，模拟键盘用户
    const panel = ui.document.getElementById(mobile ? 'mobile-menu' : 'header-search')!
    const focusable = panel.querySelector<HTMLElement>('a[href], button, input')!
    focusable.focus()
    assert.equal(ui.document.activeElement, focusable)
    await act(async () => ui.document.dispatchEvent(new ui.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })))
    assert.equal(trigger.getAttribute('aria-expanded'), 'false')
    assert.equal(ui.document.activeElement, trigger, 'Escape 收起面板后焦点应回到触发按钮')
    assert.deepEqual(ui.errors, [])
  })
}

test('escape in the mobile category picker returns focus to its trigger', async t => {
  const ui = await setup(t, true)
  await ui.render(<ui.CoursesContent categories={categories} locale="en" />)
  const trigger = ui.document.querySelector<HTMLButtonElement>('button[aria-controls="category-picker"]')!
  assert.ok(trigger)
  await ui.click(trigger)
  assert.equal(trigger.getAttribute('aria-expanded'), 'true')
  const option = ui.document.getElementById('category-picker')!.querySelector<HTMLElement>('a[href]')!
  option.focus()
  await act(async () => ui.document.dispatchEvent(new ui.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })))
  assert.equal(trigger.getAttribute('aria-expanded'), 'false')
  assert.equal(ui.document.activeElement, trigger)
  assert.deepEqual(ui.errors, [])
})
