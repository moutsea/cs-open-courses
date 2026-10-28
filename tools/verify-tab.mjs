import assert from 'node:assert/strict'
import { access } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'
import { connectPage } from './cdp.mjs'

// Node 22+。默认使用项目内 tools/browser-safe/chrome.mjs；可指定安全的独立 profile helper：
// SMOKE_CHROME_HELPER=/path/to/browser-safe/chrome.mjs ADMIN_PASSWORD=... node tools/verify-tab.mjs
// SMOKE_BASE_URL=http://localhost:3101 可切换本地服务端口；服务端须配置相同的 ADMIN_PASSWORD。
const TIMEOUT_MS = 15000
const TARGET_PATH = '/admin/chart-preview'

async function configuration() {
  const password = process.env.ADMIN_PASSWORD
  if (!password?.trim()) throw new Error('缺少 ADMIN_PASSWORD：请在运行环境设置与本地服务端一致的管理员密码。')
  const base = new URL(process.env.SMOKE_BASE_URL || 'http://localhost:3101')
  assert.ok(['http:', 'https:'].includes(base.protocol), 'SMOKE_BASE_URL 必须使用 http 或 https')
  assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(base.hostname), 'SMOKE_BASE_URL 仅允许本地 loopback 地址')
  assert.ok(!base.username && !base.password && base.pathname === '/' && !base.search && !base.hash,
    'SMOKE_BASE_URL 应为本地 origin，例如 http://localhost:3101')
  const helperPath = process.env.SMOKE_CHROME_HELPER
    ? resolve(process.env.SMOKE_CHROME_HELPER)
    : fileURLToPath(new URL('./browser-safe/chrome.mjs', import.meta.url))
  try {
    await access(helperPath)
  } catch {
    throw new Error(`找不到浏览器 helper：${helperPath}。请提供项目内 tools/browser-safe/chrome.mjs，或设置 SMOKE_CHROME_HELPER 指向导出 launchChrome() 的 browser-safe helper。`)
  }
  let helper
  try {
    helper = await import(pathToFileURL(helperPath).href)
  } catch (error) {
    throw new Error(`无法加载浏览器 helper ${helperPath}：${error.message}`)
  }
  assert.equal(typeof helper.launchChrome, 'function', `浏览器 helper ${helperPath} 必须导出 launchChrome()`)
  return { password, base, launchChrome: helper.launchChrome }
}

function point(index) {
  return {
    day: new Date(Date.UTC(2026, 6, 1) + index * 86400000).toISOString().slice(0, 10),
    value: 100 + ((index * 37) % 900),
    uv: 10 + (index % 40)
  }
}

async function run() {
  let browser
  let page
  let openingBrowser
  let openingPage
  let cleanupPromise
  let failure
  const cleanupFailures = []
  const interrupted = new AbortController()
  const diagnostics = new Set()
  const password = process.env.ADMIN_PASSWORD
  const redact = value => password ? String(value).split(password).join('[REDACTED]') : String(value)
  // 信号与 finally 共享一次清理；获取资源期间中断，也要等创建完成后再关闭。
  const cleanup = () => cleanupPromise ??= (async () => {
    try {
      try { page ??= await openingPage } catch { /* 创建失败，无 page 可关闭。 */ }
      await page?.close()
    } catch (error) {
      cleanupFailures.push(`page.close 清理失败：${error?.message ?? String(error)}`)
    } finally {
      try {
        try { browser ??= await openingBrowser } catch { /* 创建失败，无 browser 可关闭。 */ }
        await browser?.close()
      } catch (error) {
        cleanupFailures.push(`browser.close 清理失败：${error?.message ?? String(error)}`)
      }
    }
  })()
  const interrupt = signal => {
    if (!interrupted.signal.aborted) {
      process.exitCode = signal === 'SIGINT' ? 130 : 143
      interrupted.abort(new Error(`收到 ${signal}，烟测已中断`))
    }
    void cleanup()
  }
  const onInterrupt = () => interrupt('SIGINT')
  const onTerminate = () => interrupt('SIGTERM')
  process.on('SIGINT', onInterrupt)
  process.on('SIGTERM', onTerminate)
  try {
    const { base, launchChrome } = await configuration()
    interrupted.signal.throwIfAborted()
    const targetUrl = new URL(TARGET_PATH, base)
    const loginUrl = new URL('/admin/login', base)
    loginUrl.searchParams.set('next', TARGET_PATH)
    // browser-safe helper 每次以 mkdtemp profile 启动，不复用人工登录会话。
    browser = await (openingBrowser = launchChrome({ width: 1180, height: 900 }))
    interrupted.signal.throwIfAborted()
    page = await (openingPage = connectPage(browser.wsUrl, { timeoutMs: TIMEOUT_MS }))
    interrupted.signal.throwIfAborted()
    page.on('Runtime.consoleAPICalled', event => {
      if (['error', 'warning', 'warn'].includes(event.type)) {
        diagnostics.add(redact(`console.${event.type}: ${(event.args ?? []).map(arg => arg.value ?? arg.description ?? arg.type).join(' ')}`))
      }
    })
    page.on('Runtime.exceptionThrown', event => {
      diagnostics.add(redact(`exception: ${event.exceptionDetails?.exception?.description ?? event.exceptionDetails?.text}`))
    })
    page.on('Log.entryAdded', event => {
      if (['error', 'warning'].includes(event.entry?.level)) {
        diagnostics.add(redact(`${event.entry.level}: ${event.entry.text}`))
      }
    })
    let loadCount = 0
    page.on('Page.loadEventFired', () => { loadCount += 1 })
    await page.send('Runtime.enable')
    await page.send('Log.enable')
    await page.send('Page.enable')
    await page.send('Network.enable')

    const evaluate = async expression => {
      const response = await page.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
      if (response.exceptionDetails) {
        throw new Error(`页面求值失败：${response.exceptionDetails.exception?.description ?? response.exceptionDetails.text}`)
      }
      return response.result.value
    }
    const waitFor = async (description, check) => {
      const deadline = Date.now() + TIMEOUT_MS
      while (Date.now() < deadline) {
        interrupted.signal.throwIfAborted()
        try {
          const result = await check()
          if (result) return result
        } catch (error) {
          // 页面跳转时旧 execution context 会短暂失效；其他错误立即失败。
          if (!/Cannot find context|Execution context was destroyed|Inspected target navigated/.test(error.message)) throw error
        }
        await delay(100, undefined, { signal: interrupted.signal })
      }
      throw new Error(`等待${description}超时（${TIMEOUT_MS}ms）`)
    }
    const navigate = async url => {
      const previousLoads = loadCount
      const result = await page.send('Page.navigate', { url: url.href })
      assert.ok(!result.errorText, `页面导航失败：${result.errorText}`)
      await waitFor(`页面加载 ${url.pathname}`, async () => loadCount > previousLoads)
    }
    const key = async (name, modifiers = 0) => {
      const codes = { Tab: 9, ArrowLeft: 37, ArrowRight: 39, Home: 36, End: 35 }
      const params = { key: name, code: name, windowsVirtualKeyCode: codes[name], modifiers }
      await page.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...params })
      await page.send('Input.dispatchKeyEvent', { type: 'keyUp', ...params })
    }
    const clickAt = async ({ x, y }) => {
      await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y })
      await page.send('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', buttons: 1, clickCount: 1, x, y })
      await page.send('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', buttons: 0, clickCount: 1, x, y })
    }

    await navigate(loginUrl)
    await waitFor('真实管理员登录页', () => evaluate(`location.pathname === '/admin/login' && document.readyState === 'complete' && !!document.querySelector('form input[name="password"][type="password"]')`))
    assert.equal(await evaluate(`document.querySelector('form input[name="next"]')?.value`), TARGET_PATH, '登录表单应返回目标页')
    await evaluate(`document.querySelector('input[name="password"]').focus()`)
    await page.send('Input.insertText', { text: password })
    const submit = await evaluate(`(() => {
      const button = document.querySelector('form button[type="submit"]')
      if (!button) throw new Error('登录页缺少提交按钮')
      const rect = button.getBoundingClientRect()
      return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }
    })()`)
    await clickAt(submit)
    await waitFor('管理员登录成功并返回目标页（请确认 ADMIN_PASSWORD 与服务端一致）', async () => {
      const state = await evaluate(`({ href: location.href, path: location.pathname, error: new URL(location.href).searchParams.get('error'), ready: document.readyState, chart: !!document.querySelector('#chart-90') })`)
      if (state.path === '/admin/login' && state.error) {
        const reasons = { invalid: '密码不正确', throttled: '登录失败过多，被服务端限流', unconfigured: '服务端未配置 ADMIN_PASSWORD' }
        throw new Error(`管理员登录失败：${reasons[state.error] ?? state.error}`)
      }
      return state.href === targetUrl.href && state.ready === 'complete' && state.chart
    })
    const { cookies } = await page.send('Network.getCookies', { urls: [targetUrl.href] })
    assert.ok(cookies.some(cookie => cookie.name === 'cs61b_admin' && cookie.value && cookie.httpOnly), '真实登录必须建立管理员 session cookie')
    // 再访问受保护页，证明新 profile 的会话能通过服务端认证。
    await navigate(targetUrl)
    await waitFor('已认证的图表目标页', () => evaluate(`location.href === ${JSON.stringify(targetUrl.href)} && document.readyState === 'complete' && document.querySelectorAll('#chart-90 button').length === 90 && document.querySelectorAll('#chart-7 button').length === 7`))
    assert.equal(await evaluate('location.href'), targetUrl.href, '必须停留在目标页，不能是登录页或错误页')
    assert.equal(await evaluate(`document.querySelectorAll('main a[href="/admin"]').length`), 1, '目标页应有唯一的后台返回链接')
    assert.equal(await evaluate(`document.querySelector('#after-link')?.getAttribute('href')`), '/admin/gaps', '目标页应有图表后的链接')

    const focusState = () => evaluate(`(() => {
      const element = document.activeElement
      const chart = element?.closest('[id^="chart-"]')
      if (chart) return { chart: chart.id, index: [...chart.querySelectorAll('button')].indexOf(element), label: element.getAttribute('aria-label') }
      return { id: element?.id || null, href: element?.getAttribute('href') || null, tag: element?.tagName }
    })()`)
    const assertFocus = async (chart, index) => {
      await waitFor(`${chart} 第 ${index + 1} 列获得焦点`, async () => {
        const state = await focusState()
        return state.chart === chart && state.index === index
      })
      const expected = point(index)
      assert.equal((await focusState()).label, `${expected.day}：PV ${expected.value}，日 UV ${expected.uv}`, '焦点列的可访问名称必须包含对应数据')
    }
    const assertTabStop = async (chart, expectedIndex) => {
      const stops = await evaluate(`([...document.querySelectorAll(${JSON.stringify(`#${chart} button`)})].flatMap((button, index) => button.tabIndex === 0 ? [index] : []))`)
      assert.deepEqual(stops, [expectedIndex], `${chart} 必须恰有一个正确的 Tab 停靠点`)
    }
    const assertTooltip = async (chart, index) => {
      const expected = point(index)
      const tooltip = await waitFor(`${chart} 第 ${index + 1} 列的可见 tooltip`, () => evaluate(`(() => {
        const tip = document.querySelector(${JSON.stringify(`#${chart} [role="tooltip"]`)})
        if (!tip || !tip.textContent.includes(${JSON.stringify(expected.day)})) return false
        const rect = tip.getBoundingClientRect()
        if (rect.width <= 0 || rect.height <= 0) return false
        for (let element = tip; element; element = element.parentElement) {
          const style = getComputedStyle(element)
          if (style.display === 'none' || style.visibility !== 'visible' || style.contentVisibility === 'hidden' || Number(style.opacity) <= 0) return false
        }
        return { text: tip.textContent.replace(/\\s+/g, ' '), rows: [...tip.querySelectorAll('div > span.inline-flex')].map(row => [...row.children].map(child => child.textContent.trim()).filter(Boolean).join(' ')) }
      })()`))
      assert.ok(tooltip.text.includes(expected.day), 'tooltip 应显示正确日期')
      assert.deepEqual(tooltip.rows, [`PV ${expected.value}`, `日 UV ${expected.uv}`], 'tooltip 应显示对应列的完整指标')
    }
    const focusBackLink = async () => {
      await evaluate(`document.querySelector('main a[href="/admin"]').focus()`)
      assert.equal((await focusState()).href, '/admin', '应先聚焦后台返回链接')
    }

    await assertTabStop('chart-90', 0)
    await assertTabStop('chart-7', 0)
    await focusBackLink()
    await key('Tab')
    await assertFocus('chart-90', 0)
    // SSR 按钮本身不是 hydration 证据；真实 focus 产生 tooltip、方向键改变焦点才是。
    await assertTooltip('chart-90', 0)
    await key('ArrowRight')
    await assertFocus('chart-90', 1)
    await assertTooltip('chart-90', 1)
    await key('Home')
    await assertFocus('chart-90', 0)
    await assertTabStop('chart-90', 0)
    console.log('PASS hydration：真实 focus/ArrowRight/Home 事件已生效')

    // 精确检查页面前进与回退序列，避免把浏览器工具栏的焦点循环作为成功。
    const trace = ['chart-90:0']
    await key('Tab')
    await assertFocus('chart-7', 0)
    await assertTooltip('chart-7', 0)
    trace.push('chart-7:0')
    await key('Tab')
    assert.equal((await focusState()).id, 'after-link', 'Tab 必须从第二张图离开到后面的链接')
    trace.push('after-link')
    await key('Tab', 8)
    await assertFocus('chart-7', 0)
    trace.push('chart-7:0')
    await key('Tab', 8)
    await assertFocus('chart-90', 0)
    trace.push('chart-90:0')
    await key('Tab', 8)
    assert.equal((await focusState()).href, '/admin', 'Shift+Tab 应从第一张图返回后台链接')
    trace.push('/admin')
    console.log('PASS Tab/Shift+Tab 序列:', trace.join(' → '))

    await key('Tab')
    await assertFocus('chart-90', 0)
    const hover = await evaluate(`(() => {
      const plot = document.querySelector('#chart-90 button').parentElement.parentElement
      const rect = plot.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) throw new Error('90 天绘图区没有布局')
      return { x: rect.left + rect.width * (49.5 / 90), y: rect.top + rect.height * 0.6 }
    })()`)
    await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...hover })
    await assertTooltip('chart-90', 49)
    await assertFocus('chart-90', 0)
    await assertTabStop('chart-90', 0)
    await key('Tab')
    await assertFocus('chart-7', 0)
    await key('Tab', 8)
    await assertFocus('chart-90', 0)
    await assertTooltip('chart-90', 0)
    console.log('PASS 悬停第 50 列后 Tab 离图、Shift+Tab 返回及焦点 tooltip')

    for (const [name, index] of [['ArrowLeft', 0], ['End', 89], ['ArrowRight', 89], ['ArrowLeft', 88], ['Home', 0]]) {
      await key(name)
      await assertFocus('chart-90', index)
      await assertTabStop('chart-90', index)
      await assertTooltip('chart-90', index)
    }
    // 触屏 click 路径：移动鼠标不应激活触摸目标，tap 后 tooltip 必须对应第 5 列。
    const tap = await evaluate(`(() => {
      const rect = document.querySelectorAll('#chart-7 button')[4].getBoundingClientRect()
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    })()`)
    await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 5, y: 5 })
    await page.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...tap, id: 1 }] })
    await page.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await assertTooltip('chart-7', 4)
    assert.equal(await evaluate('location.href'), targetUrl.href, '交互后仍应停留在目标页')
    console.log('PASS 左右键/Home/End 边界与触屏点按')
    // 等待两帧，收集最后一次交互触发的控制台消息；CDP 请求同时作为消息屏障。
    await evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))')
    await page.send('Runtime.evaluate', { expression: 'void 0' })
  } catch (error) {
    failure = error
  } finally {
    await cleanup()
    process.off('SIGINT', onInterrupt)
    process.off('SIGTERM', onTerminate)
  }
  const failures = []
  if (interrupted.signal.aborted) failures.push(interrupted.signal.reason.message)
  if (failure) failures.push(failure.message ?? String(failure))
  failures.push(...cleanupFailures)
  if (diagnostics.size) {
    failures.push(`检测到 console error/warning 或未捕获异常：\n${[...diagnostics].join('\n')}`)
  }
  if (failures.length) throw new Error(redact([...new Set(failures)].join('\n')))
  console.log('PASS smoke：管理员登录、目标页、hydration、Tab、tooltip、关键交互及控制台检查全部通过')
}

try {
  await run()
} catch (error) {
  const password = process.env.ADMIN_PASSWORD
  const message = password ? String(error.message).split(password).join('[REDACTED]') : error.message
  console.error(`FAIL smoke：${message}`)
  process.exitCode ||= 1
}
