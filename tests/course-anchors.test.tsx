import assert from 'node:assert/strict'
import { test, type TestContext } from 'node:test'
import { JSDOM } from 'jsdom'
import { act, createRef, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { PathnameContext, SearchParamsContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime'
import CourseAnchorNavigation from '../src/components/CourseAnchorNavigation'
import { markdownToHTML } from '../src/lib/markdownProcessor'

const origin = 'https://www.cs61bbeyond.com'
const coursePath = '/course/essential-tools/Scoop'
const source = '<h1 id="course-title">Title</h1><h2 id="resources">Resources</h2><h2 id="课程资源">Chinese resources</h2>'

async function mountCourse(t: TestContext, url = `${origin}${coursePath}#resources`, markdown = source) {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', { url })
  const { window } = dom
  const globals = {
    window, document: window.document, Element: window.Element, HTMLElement: window.HTMLElement,
    HTMLAnchorElement: window.HTMLAnchorElement, IS_REACT_ACT_ENVIRONMENT: true
  }
  const descriptors = Object.keys(globals).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const)
  for (const [key, value] of Object.entries(globals)) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value })

  const frames = new Map<number, FrameRequestCallback>()
  let nextFrame = 0
  window.requestAnimationFrame = (callback: FrameRequestCallback) => { frames.set(++nextFrame, callback); return nextFrame }
  window.cancelAnimationFrame = (id: number) => { frames.delete(id) }
  const scrolled: HTMLElement[] = []
  window.HTMLElement.prototype.scrollIntoView = function () { scrolled.push(this) }
  const articleRef = createRef<HTMLElement>()
  const root = createRoot(window.document.getElementById('root')!)
  let mounted = true
  let content = await markdownToHTML(markdown, undefined, { removeFirstHeading: true })
  async function render(nextUrl = window.location.href, nextContent = content) {
    window.history.replaceState(null, '', nextUrl)
    content = nextContent
    await act(async () => root.render(
      <StrictMode>
        <PathnameContext.Provider value={window.location.pathname}>
          <SearchParamsContext.Provider value={new URLSearchParams(window.location.search)}>
            <Suspense fallback={null}>
              <CourseAnchorNavigation articleRef={articleRef} content={content} />
            </Suspense>
            <article ref={articleRef} dangerouslySetInnerHTML={{ __html: content }} />
          </SearchParamsContext.Provider>
        </PathnameContext.Provider>
      </StrictMode>
    ))
  }
  async function flushFrames() {
    await act(async () => {
      for (const [id, callback] of [...frames]) {
        frames.delete(id)
        callback(0)
      }
    })
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
  await render()
  return { window, articleRef, frames, scrolled, render, flushFrames, unmount }
}

test('direct course URLs with queries scroll to original anchors without rewriting HTML, URL or history', async t => {
  const url = `${origin}${coursePath}?edition=2026#resources`
  const page = await mountCourse(t, url)
  const html = page.articleRef.current!.innerHTML
  const historyLength = page.window.history.length
  await page.flushFrames()
  assert.deepEqual(page.scrolled.map(node => node.id), ['user-content-resources'])
  assert.equal(page.window.location.href, url)
  assert.equal(page.window.history.length, historyLength)
  assert.equal(page.articleRef.current!.innerHTML, html)
  assert.equal(page.window.document.getElementById('resources'), null)
})

test('encoded Chinese IDs, literal percents and original prefixed IDs resolve safely', async t => {
  const page = await mountCourse(t)
  for (const id of ['课程资源', 'section one', '100%', 'user-content-resources']) {
    const html = await markdownToHTML(`<h2 id="${id}">Section</h2>`)
    for (const fragment of [id, encodeURIComponent(id)]) {
      await page.render(`${origin}${coursePath}?case=${encodeURIComponent(fragment)}#${fragment}`, html)
      await page.flushFrames()
      assert.equal(page.scrolled.at(-1)?.id, `user-content-${id}`)
    }
  }
})

test('cross-course client navigation resolves the destination body even when the hash is unchanged', async t => {
  const page = await mountCourse(t)
  await page.flushFrames()
  const previousTarget = page.scrolled.at(-1)
  const linkHTML = await markdownToHTML('[Next](./Vim.md?edition=2026#resources)', { locale: 'en', coursePath: 'essential-tools/Scoop' })
  const href = JSDOM.fragment(linkHTML).querySelector('a')!.getAttribute('href')!
  const nextBody = await markdownToHTML('<h1>Vim</h1><h2 id="resources">Vim resources</h2>', undefined, { removeFirstHeading: true })
  await page.render(new URL(href, origin).href, nextBody)
  await page.flushFrames()
  assert.equal(page.scrolled.at(-1)?.textContent, 'Vim resources')
  assert.notEqual(page.scrolled.at(-1), previousTarget)
  assert.equal(previousTarget?.isConnected, false)
})

test('path-only and query-only navigation rerun anchor lookup with unchanged content', async t => {
  const page = await mountCourse(t)
  await page.flushFrames()
  await page.render(`${origin}/zh${coursePath}#resources`)
  await page.flushFrames()
  await page.render(`${origin}/zh${coursePath}?edition=2026#resources`)
  await page.flushFrames()
  assert.deepEqual(page.scrolled.map(node => node.id), Array(3).fill('user-content-resources'))
})

test('hash changes and back/forward hash events resolve the current fragment', async t => {
  const page = await mountCourse(t)
  await page.flushFrames()
  for (const hash of ['#course-title', '#%E8%AF%BE%E7%A8%8B%E8%B5%84%E6%BA%90', '#resources']) {
    page.window.history.replaceState(null, '', hash)
    page.window.dispatchEvent(new page.window.HashChangeEvent('hashchange'))
    await page.flushFrames()
  }
  assert.deepEqual(page.scrolled.map(node => node.id), ['user-content-resources', 'user-content-course-title', 'user-content-课程资源', 'user-content-resources'])
})

test('hash-only client-router navigation resolves without a browser hashchange event', async t => {
  const page = await mountCourse(t)
  await page.flushFrames()
  // Next.js publishes new navigation contexts after pushState, which itself
  // does not emit hashchange; the pathname and query text can stay identical.
  await page.render(`${origin}${coursePath}#course-title`)
  await page.flushFrames()
  assert.deepEqual(page.scrolled.map(node => node.id), ['user-content-resources', 'user-content-course-title'])
})

test('repeated clicks on the current full URL still scroll without needing hashchange', async t => {
  const url = `${origin}${coursePath}?edition=2026#resources`
  const page = await mountCourse(t, url, source + `<a href="${url}"><span>Again</span></a>`)
  await page.flushFrames()
  page.window.document.querySelector('article a span')!.dispatchEvent(new page.window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }))
  await page.flushFrames()
  assert.deepEqual(page.scrolled.map(node => node.id), ['user-content-resources', 'user-content-resources'])
})

test('native targets, missing fragments and targets outside the course are not overridden', async t => {
  const page = await mountCourse(t)
  const outside = page.window.document.createElement('div')
  outside.innerHTML = '<h2 id="native">Native</h2><h2 id="user-content-outside">Outside</h2>'
  page.window.document.body.append(outside)
  for (const hash of ['', '#', '#top', '#missing', '#%ZZ', '#native', '#user-content-resources', '#outside']) {
    await page.render(`${origin}${coursePath}${hash}`)
    page.window.dispatchEvent(new page.window.HashChangeEvent('hashchange'))
    await page.flushFrames()
  }
  assert.equal(page.scrolled.length, 0)
})

test('modified, cancelled, external, download and new-tab clicks do not cause extra scrolling', async t => {
  const page = await mountCourse(t, `${origin}${coursePath}#resources`, source + '<a href="#resources">Again</a>')
  await page.flushFrames()
  page.scrolled.length = 0
  const link = page.window.document.querySelector('article a')!
  const cases = [
    { init: { ctrlKey: true } }, { init: { metaKey: true } }, { init: { shiftKey: true } }, { init: { altKey: true } },
    { init: { button: 1 } }, { attribute: ['download', 'course.html'] }, { attribute: ['target', '_blank'] },
    { attribute: ['href', 'https://example.org/#resources'] }, { attribute: ['href', 'http://['] },
    { attribute: ['href', '/other#resources'] }
  ]
  for (const item of cases) {
    if (item.attribute) link.setAttribute(item.attribute[0], item.attribute[1])
    const event = new page.window.MouseEvent('click', { bubbles: true, cancelable: true, ...item.init })
    // Stop jsdom from following the link after the document handler has run.
    page.window.addEventListener('click', (event: Event) => event.preventDefault(), { once: true })
    link.dispatchEvent(event)
    assert.equal(page.frames.size, 0)
    if (item.attribute) link.removeAttribute(item.attribute[0])
    link.setAttribute('href', '#resources')
  }
  const cancel = (event: Event) => event.preventDefault()
  link.addEventListener('click', cancel)
  link.dispatchEvent(new page.window.MouseEvent('click', { bubbles: true, cancelable: true }))
  assert.equal(page.frames.size, 0)
  link.removeEventListener('click', cancel)
  // Cancellation later in bubbling must also be respected by the queued frame.
  page.window.addEventListener('click', (event: Event) => event.preventDefault(), { once: true })
  link.dispatchEvent(new page.window.MouseEvent('click', { bubbles: true, cancelable: true }))
  await page.flushFrames()
  assert.equal(page.scrolled.length, 0)
})

test('unmount cancels queued scrolling and removes navigation listeners', async t => {
  const page = await mountCourse(t)
  assert.equal(page.frames.size, 1)
  await page.unmount()
  assert.equal(page.frames.size, 0)
  page.window.dispatchEvent(new page.window.HashChangeEvent('hashchange'))
  assert.equal(page.frames.size, 0)
  await page.flushFrames()
  assert.equal(page.scrolled.length, 0)
})
