import assert from 'node:assert/strict'
import { execFile, spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { access } from 'node:fs/promises'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { promisify } from 'node:util'

// Node 22+，从项目声明的 Wrangler 定位 esbuild，另需 browser-safe helper：
// SMOKE_CHROME_HELPER=/path/to/browser-safe/chrome.mjs node tools/test-verify-tab.mjs
// 无需真实 ADMIN_PASSWORD 或正在运行的 Next 服务；fixture 只验证 smoke 流程及真实图表交互。
// 本脚本也可作为 IPC 回归用的 helper，不写 bundle/临时脚本；profile 始终由 browser-safe 管理。
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const smokePath = resolve(root, 'tools/verify-tab.mjs')
const helperPath = process.env.SMOKE_CHROME_HELPER
  ? resolve(process.env.SMOKE_CHROME_HELPER)
  : resolve(root, 'tools/browser-safe/chrome.mjs')
const fixturePassword = 'smoke-fixture-password'
const sessionCookie = 'cs61b_admin=smoke-fixture-session'

const execute = promisify(execFile)
// connected 检查与 send 之间仍可能断开；callback 必须接住异步 ERR_IPC_CHANNEL_CLOSED。
const notify = (message, target = process) => new Promise(resolveSend => {
  if (!target.connected || typeof target.send !== 'function') return resolveSend(false)
  try {
    target.send(message, error => resolveSend(!error))
  } catch {
    resolveSend(false)
  }
})
const disconnect = () => {
  if (process.connected) {
    try { process.disconnect() } catch { /* 父进程可能刚断开，无须再通知。 */ }
  }
}
const helperStage = stage => new Promise((resolveStage, rejectStage) => {
  let timer
  let settled = false
  const finish = error => {
    if (settled) return
    settled = true
    clearTimeout(timer)
    process.off('message', receive)
    process.off('disconnect', disconnected)
    if (error) rejectStage(error)
    else resolveStage()
  }
  const receive = message => {
    if (message?.continue === stage) finish()
  }
  // IPC 是测试控制面；父进程退出后中止阶段，交给 launch catch / close finally 收尾。
  const disconnected = () => finish(new Error(`fixture helper 等待 ${stage} 时 IPC 已断开`))
  process.on('message', receive)
  process.once('disconnect', disconnected)
  timer = setTimeout(() => finish(new Error(`fixture helper 等待 ${stage} 超时`)), 15000)
  void notify({ stage }).then(sent => { if (!sent) disconnected() })
})

// 信号回归使用真实 browser-safe 启动和关闭；IPC 只控制资源返回前/关闭中的时机。
export async function launchChrome(options) {
  assert.ok(process.send && process.env.SMOKE_TEST_REAL_HELPER, 'fixture helper 仅用于本脚本 IPC 回归')
  const actual = await import(pathToFileURL(process.env.SMOKE_TEST_REAL_HELPER).href)
  const browser = await actual.launchChrome(options)
  let closePromise
  let cleanupPromise
  let discovery
  const cleanup = () => cleanupPromise ??= (async () => {
    try {
      await browser.close()
    } finally {
      try {
        if (discovery) {
          discovery.closeAllConnections()
          await new Promise((resolveClose, rejectClose) => discovery.close(error => {
            if (error && error.code !== 'ERR_SERVER_NOT_RUNNING') rejectClose(error)
            else resolveClose()
          }))
        }
      } finally {
        await notify({ stage: 'closed' })
        disconnect()
      }
    }
  })()
  try {
    if (!await notify({ stage: 'browser', pid: browser.pid, profileDir: browser.profileDir })) {
      throw new Error('fixture helper 创建 browser 后 IPC 已断开')
    }
    if (process.env.SMOKE_TEST_INTERRUPT_STAGE === 'opening') await helperStage('opening')
    let wsUrl = browser.wsUrl
    if (process.env.SMOKE_TEST_INTERRUPT_STAGE === 'connecting') {
      // 延迟真实 CDP target discovery，覆盖 connectPage 尚未返回时的中断。
      discovery = createServer(async (request, response) => {
        try {
          await helperStage('connecting')
          if (response.destroyed) return
          const targets = await fetch(`http://127.0.0.1:${browser.port}/json/list`)
          response.writeHead(targets.status, { 'Content-Type': 'application/json' }).end(await targets.text())
        } catch (error) {
          if (!response.destroyed) response.writeHead(500).end(error.message)
        }
      })
      await new Promise((resolveListen, rejectListen) => {
        discovery.once('error', rejectListen)
        discovery.listen(0, '127.0.0.1', () => {
          discovery.off('error', rejectListen)
          resolveListen()
        })
      })
      wsUrl = `ws://127.0.0.1:${discovery.address().port}`
    }
    return {
      ...browser,
      wsUrl,
      close: () => closePromise ??= (async () => {
        try {
          await notify({ stage: 'close' })
          if (process.env.SMOKE_TEST_INTERRUPT_STAGE === 'closing') await helperStage('closing')
          if (process.env.SMOKE_TEST_INTERRUPT_STAGE) await helperStage('cleanup')
        } finally {
          await cleanup()
        }
      })()
    }
  } catch (error) {
    await cleanup()
    throw error
  }
}

async function ownedBrowserCommand(browser) {
  try {
    const { stdout } = await execute('ps', ['-o', 'command=', '-p', String(browser.pid)])
    return stdout.includes(`--user-data-dir=${browser.profileDir}`)
  } catch (error) {
    if (error.code === 1) return false
    throw error
  }
}

async function assertBrowserClosed(browser, name) {
  assert.ok(browser?.pid && browser.profileDir, `${name} 应报告真实浏览器 pid/profile`)
  assert.equal(await ownedBrowserCommand(browser), false, `${name} 不应留下本次 browser 进程`)
  try {
    await access(browser.profileDir)
    assert.fail(`${name} 不应留下本次 profile：${browser.profileDir}`)
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
}

function runSmoke(overrides, { signal: interruptSignal, stage: interruptStage = 'running', onStart } = {}) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(process.execPath, [smokePath], {
      cwd: root,
      env: {
        ...process.env,
        ADMIN_PASSWORD: fixturePassword,
        SMOKE_CHROME_HELPER: fileURLToPath(import.meta.url),
        SMOKE_TEST_REAL_HELPER: helperPath,
        SMOKE_TEST_INTERRUPT_STAGE: interruptSignal ? interruptStage : '',
        SMOKE_BASE_URL: 'http://localhost:3101',
        ...overrides
      },
      stdio: ['ignore', 'pipe', 'pipe', 'ipc']
    })
    let output = ''
    let browser
    let closeCalls = 0
    let closedCalls = 0
    let controlError
    const stop = (continueStage = interruptStage === 'running' ? null : interruptStage) => {
      // child.pid 来自本次 spawn；发信号前检查 Node 命令行确实在执行本次 smoke。
      void execute('ps', ['-o', 'command=', '-p', String(child.pid)]).then(async ({ stdout }) => {
        assert.ok(stdout.includes(smokePath), '只能中断本次启动的 smoke 子进程')
        assert.ok(child.kill(interruptSignal), `应成功向 smoke 发送 ${interruptSignal}`)
        assert.ok(child.kill(interruptSignal), '重复信号应幂等')
        if (continueStage) await notify({ continue: continueStage }, child)
      }).catch(error => { controlError ??= error })
    }
    onStart?.({ stop })
    child.on('message', message => {
      if (message.stage === 'browser') browser = message
      if (message.stage === 'close') closeCalls += 1
      if (message.stage === 'closed') closedCalls += 1
      if (interruptSignal && message.stage === interruptStage) stop()
      if (interruptSignal && message.stage === 'cleanup') stop('cleanup')
    })
    child.stdout.on('data', chunk => { output += chunk })
    child.stderr.on('data', chunk => { output += chunk })
    child.once('error', rejectRun)
    child.once('close', (status, signal) => {
      if (controlError) rejectRun(controlError)
      else resolveRun({ status, signal, output, browser, closeCalls, closedCalls })
    })
  })
}

function assertResult(result, status, expected, name) {
  assert.equal(result.signal, null, `${name} 不应被信号终止：\n${result.output}`)
  assert.equal(result.status, status, `${name} 应退出 ${status}，实际 ${result.status}：\n${result.output}`)
  assert.match(result.output, expected, `${name} 应输出预期结果：\n${result.output}`)
  assert.ok(!result.output.includes(fixturePassword), `${name} 不应输出提交的密码`)
}

async function test() {
  const missingHelper = await runSmoke({ SMOKE_CHROME_HELPER: resolve(root, `tools/.missing-smoke-helper-${randomUUID()}.mjs`) })
  assertResult(missingHelper, 1, /找不到浏览器 helper/, 'missing helper')
  console.log('PASS missing helper: exit 1')
  try {
    await access(helperPath)
    assert.notEqual(helperPath, fileURLToPath(import.meta.url), 'SMOKE_CHROME_HELPER 必须指向真实 browser-safe helper')
  } catch {
    throw new Error(`浏览器回归需要可用 helper：${helperPath}。请设置 SMOKE_CHROME_HELPER；missing helper 用例已通过。`)
  }

  // 直接打包项目组件，fixture 不复制其 focus/hover/click 逻辑。
  // write:false 保证生成物只存在内存中。
  const { build } = createRequire(createRequire(import.meta.url).resolve('wrangler/package.json'))('esbuild')
  const bundle = await build({
    stdin: {
      contents: `
        import React from 'react'
        import { createRoot } from 'react-dom/client'
        import { DailyBarChart } from './src/components/admin/DailyBarChart.tsx'
        const points = count => Array.from({ length: count }, (_, index) => ({
          day: new Date(Date.UTC(2026, 6, 1) + index * 86400000).toISOString().slice(0, 10),
          value: 100 + ((index * 37) % 900),
          extras: [{ label: '日 UV', value: 10 + (index % 40) }]
        }))
        createRoot(document.getElementById('root')).render(
          <main>
            <a href="/admin">返回后台</a>
            <h1>90 天</h1><div id="chart-90"><DailyBarChart points={points(90)} unit="PV" /></div>
            <h1>7 天</h1><div id="chart-7"><DailyBarChart points={points(7)} unit="PV" /></div>
            <a id="after-link" href="/admin/gaps">后面的链接</a>
          </main>
        )
      `,
      loader: 'tsx',
      resolveDir: root
    },
    bundle: true,
    write: false,
    platform: 'browser',
    define: { 'process.env.NODE_ENV': '"production"' }
  })
  const javascript = bundle.outputFiles[0].text
  // 为组件使用的布局 utility 提供最小 CSS；视觉样式由真实服务 smoke 验证。
  const css = `
    body { margin: 24px }
    #chart-90, #chart-7 { max-width: 900px }
    .flex { display: flex } .flex-1 { flex: 1 } .relative { position: relative }
    .absolute { position: absolute } .h-full { height: 100% } .items-end { align-items: flex-end }
    .min-w-px { min-width: 1px } .gap-3 { gap: 12px } .w-9 { width: 36px }
    .shrink-0 { flex-shrink: 0 } .gap-px { gap: 1px } .inline-flex { display: inline-flex }
    [role=tooltip] { width: 232px; background: #ddd; pointer-events: none }
    button { padding: 0; border: 0 }
  `
  let mode = 'success'
  let requests
  let stopSmoke
  const serverErrors = []
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url, 'http://localhost')
      if (url.pathname === '/favicon.ico') {
        response.writeHead(204).end()
        return
      }
      if (url.pathname === '/app.js') {
        response.writeHead(200, { 'Content-Type': 'text/javascript' }).end(javascript)
        return
      }
      if (url.pathname === '/admin/login' && request.method === 'POST') {
        requests.loginPosts += 1
        let body = ''
        for await (const chunk of request) body += chunk
        const submitted = new URLSearchParams(body)
        assert.equal(submitted.get('next'), '/admin/chart-preview', 'fixture 应接到真实表单的 next 字段')
        if (submitted.get('password') !== fixturePassword) {
          response.writeHead(303, { Location: '/admin/login?error=invalid&next=%2Fadmin%2Fchart-preview' }).end()
        } else {
          response.writeHead(303, {
            'Set-Cookie': `${sessionCookie}; HttpOnly; Path=/; SameSite=Lax`,
            Location: '/admin/chart-preview'
          }).end()
        }
        return
      }
      if (url.pathname === '/admin/login') {
        requests.loginGets += 1
        assert.ok(!request.headers.cookie, '每个 smoke 子进程必须使用未登录的新 profile')
        if (mode === 'interrupted') {
          assert.ok(stopSmoke, '中断用例应先注册 smoke 子进程')
          stopSmoke()
          return // 保持导航 pending，直到信号触发 page/browser 清理。
        }
        response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(`
          <!doctype html><form method="POST" action="/admin/login">
            <input type="hidden" name="next" value="/admin/chart-preview">
            <input name="password" type="password" required>
            <button type="submit">进入后台</button>
          </form>
        `)
        return
      }
      if (url.pathname === '/admin/chart-preview') {
        if (!request.headers.cookie?.split(';').some(cookie => cookie.trim() === sessionCookie)) {
          response.writeHead(303, { Location: '/admin/login?next=%2Fadmin%2Fchart-preview' }).end()
          return
        }
        requests.authenticatedTargets += 1
        const diagnostic = mode === 'console.error'
          ? '<script>console.error("fixture console error")</script>'
          : mode === 'console.warn'
            ? '<script>console.warn("fixture console warning")</script>'
            : ''
        const invisible = mode === 'transparent tooltip'
          ? '[role=tooltip] { opacity: 0 !important }'
          : mode === 'transparent ancestor'
            ? '#chart-90 { opacity: 0 !important }'
            : ''
        response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(`
          <!doctype html><style>${css}${invisible}</style><div id="root"></div>
          ${diagnostic}<script src="/app.js"></script>
        `)
        return
      }
      response.writeHead(404).end('fixture route not found')
    } catch (error) {
      serverErrors.push(error)
      if (!response.headersSent) response.writeHead(500)
      response.end('fixture request failed')
    }
  })
  try {
    await new Promise((resolveListen, rejectListen) => {
      server.once('error', rejectListen)
      server.listen(0, '127.0.0.1', resolveListen)
    })
    const base = `http://127.0.0.1:${server.address().port}`
    for (const current of ['success', 'console.error', 'console.warn', 'failed login', 'transparent tooltip', 'transparent ancestor']) {
      mode = current
      requests = { loginGets: 0, loginPosts: 0, authenticatedTargets: 0 }
      const result = await runSmoke({
        SMOKE_BASE_URL: base,
        ADMIN_PASSWORD: current === 'failed login' ? 'incorrect-fixture-password' : fixturePassword
      })
      const expected = {
        success: /PASS smoke：/,
        'console.error': /console\.error: fixture console error/,
        'console.warn': /console\.warning: fixture console warning/,
        'failed login': /管理员登录失败：密码不正确/,
        'transparent tooltip': /等待chart-90 第 1 列的可见 tooltip超时/,
        'transparent ancestor': /等待chart-90 第 1 列的可见 tooltip超时/
      }
      assertResult(result, current === 'success' ? 0 : 1, expected[current], current)
      assert.equal(result.closeCalls, 1, `${current} 应仅关闭一次 browser`)
      assert.equal(result.closedCalls, 1, `${current} 应等待 browser.close 完成`)
      await assertBrowserClosed(result.browser, current)
      assert.equal(serverErrors.length, 0, `fixture 请求失败：${serverErrors.map(error => error.message).join('; ')}`)
      assert.ok(requests.loginGets >= 1, `${current} 应访问真实表单`)
      assert.equal(requests.loginPosts, 1, `${current} 应只提交一次表单`)
      if (current === 'failed login') {
        assert.equal(requests.authenticatedTargets, 0, '登录失败不应访问已认证目标页')
      } else {
        assert.ok(requests.authenticatedTargets >= 2, `${current} 应登录后再次访问受保护页`)
        if (current.startsWith('transparent')) {
          assert.ok(!result.output.includes('PASS hydration'), `${current} 必须在首次 tooltip 可见性检查失败`)
        } else {
          for (const marker of ['PASS hydration', 'PASS Tab/Shift+Tab', 'PASS 悬停第 50 列', 'PASS 左右键/Home/End']) {
            assert.ok(result.output.includes(marker), `${current} 应执行全部关键交互断言：\n${result.output}`)
          }
        }
      }
      console.log(`PASS ${current}: exit ${result.status}`)
    }
    for (const signal of ['SIGINT', 'SIGTERM']) {
      for (const stage of ['opening', 'connecting', 'running', 'closing']) {
        const name = `${signal} during ${stage}`
        mode = stage === 'running' ? 'interrupted' : 'success'
        requests = { loginGets: 0, loginPosts: 0, authenticatedTargets: 0 }
        const result = await runSmoke({ SMOKE_BASE_URL: base }, {
          signal,
          stage,
          onStart: ({ stop }) => { stopSmoke = stop }
        })
        assertResult(result, signal === 'SIGINT' ? 130 : 143, new RegExp(`收到 ${signal}`), name)
        assert.equal(result.closeCalls, 1, `${name} 重复信号和 finally 应共享一次 browser.close`)
        assert.equal(result.closedCalls, 1, `${name} 退出前应完成 browser.close`)
        assert.ok(!result.output.includes('PASS smoke：'), `${name} 不应报告成功`)
        await assertBrowserClosed(result.browser, name)
        assert.equal(serverErrors.length, 0, `${name} fixture 应无请求异常`)
        if (stage === 'opening' || stage === 'connecting') assert.equal(requests.loginGets, 0, `${name} 不应继续导航`)
        if (stage === 'running') assert.equal(requests.loginGets, 1, `${name} 应在真实页面 pending 时中断`)
        console.log(`PASS ${name}: exit ${result.status}, browser/profile removed, close once`)
      }
    }
  } finally {
    server.closeAllConnections()
    await new Promise(resolveClose => server.close(resolveClose))
  }
  console.log('PASS smoke regression: 15 cases')
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    await test()
  } catch (error) {
    console.error(`FAIL smoke regression：${error.message}`)
    process.exitCode = 1
  }
}
