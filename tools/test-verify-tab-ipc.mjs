import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { EventEmitter, once } from 'node:events'
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { finished } from 'node:stream/promises'
import { setTimeout as delay } from 'node:timers/promises'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createContext, SourceTextModule, SyntheticModule } from 'node:vm'

// node --experimental-vm-modules --test tools/test-verify-tab-ipc.mjs
// 原样执行完整 fixture，通过模块边界注入 stub browser；IPC 与 discovery HTTP 均为真实 Node 资源。
const fixtureUrl = new URL('./test-verify-tab.mjs', import.meta.url)
const fixtureSource = await readFile(fixtureUrl, 'utf8')
const testPath = fileURLToPath(import.meta.url)

async function loadFixture(processFixture, browser, { servers = [], listenFails = false } = {}) {
  processFixture.env = {
    ...processFixture.env,
    SMOKE_TEST_REAL_HELPER: testPath
  }
  const context = createContext({
    process: processFixture,
    console,
    URL,
    setTimeout,
    clearTimeout,
    fetch: async () => new Response('[]', { headers: { 'Content-Type': 'application/json' } })
  })
  const helper = new SyntheticModule(['launchChrome'], function () {
    this.setExport('launchChrome', async () => browser)
  }, { context, identifier: import.meta.url })
  await helper.link(() => { throw new Error('stub browser must have no imports') })
  await helper.evaluate()
  const fixture = new SourceTextModule(fixtureSource, {
    context,
    identifier: fixtureUrl.href,
    initializeImportMeta: meta => { meta.url = fixtureUrl.href },
    importModuleDynamically: async specifier => {
      assert.equal(specifier, import.meta.url, 'fixture 应加载指定的 stub browser helper')
      return helper
    }
  })
  await fixture.link(async specifier => {
    const exports = { ...await import(specifier) }
    if (specifier === 'node:http') {
      exports.createServer = handler => {
        const server = createServer(handler)
        const close = server.close.bind(server)
        const closeAllConnections = server.closeAllConnections.bind(server)
        const tracked = { server, closeCalls: 0, closeAllCalls: 0 }
        server.close = callback => {
          tracked.closeCalls += 1
          return close(callback)
        }
        server.closeAllConnections = () => {
          tracked.closeAllCalls += 1
          closeAllConnections()
        }
        if (listenFails) {
          server.listen = () => {
            queueMicrotask(() => server.emit('error', new Error('fixture listen failure')))
            return server
          }
        }
        servers.push(tracked)
        return server
      }
    }
    return new SyntheticModule(Object.keys(exports), function () {
      for (const [name, value] of Object.entries(exports)) this.setExport(name, value)
    }, { context, identifier: specifier })
  })
  await fixture.evaluate({ timeout: 1000 })
  return fixture.namespace
}

function fakeProcess(send) {
  const processFixture = new EventEmitter()
  processFixture.env = {}
  processFixture.argv = []
  processFixture.connected = true
  processFixture.send = send
  processFixture.disconnect = () => {
    processFixture.connected = false
    processFixture.emit('disconnect')
  }
  return processFixture
}

async function childProbe(scenario) {
  const originalSend = process.send.bind(process)
  const initialListeners = {
    message: process.listenerCount('message'),
    disconnect: process.listenerCount('disconnect')
  }
  if (scenario.disconnectBeforeLaunch) {
    const disconnected = once(process, 'disconnect')
    originalSend({ stage: 'ready' }, error => { if (error) throw error })
    await disconnected
  }
  let raced = false
  process.send = (message, ...args) => {
    // 在 fixture 的 connected 检查后、真实 send 前断开，确定性覆盖异步错误竞态。
    if (!raced && message.stage === scenario.raceAt) {
      raced = true
      process.disconnect()
    }
    return originalSend(message, ...args)
  }
  process.env.SMOKE_TEST_INTERRUPT_STAGE = scenario.stage || ''
  const servers = []
  let browserCloseCalls = 0
  const browser = {
    pid: process.pid,
    profileDir: 'stub-browser-no-profile',
    port: 0,
    wsUrl: 'ws://127.0.0.1:0',
    async close() {
      browserCloseCalls += 1
      await delay(10)
      if (scenario.browserFails) throw new Error('stub browser close failure')
    }
  }
  const fixture = await loadFixture(process, browser, { servers })
  let wrapped
  let launchError
  let closeError
  try { wrapped = await fixture.launchChrome({}) } catch (error) { launchError = error.message }
  if (wrapped) {
    let discoveryRequest
    if (scenario.stage === 'connecting') {
      discoveryRequest = fetch(new URL('/json/list', wrapped.wsUrl.replace('ws:', 'http:')))
        .then(response => response.text(), () => 'connection closed during cleanup')
      // 确认 discovery 请求进入了 fixture 的阶段等待，再与 close 共享 disconnect。
      await once(servers[0].server, 'request')
    }
    const close = wrapped.close()
    assert.equal(wrapped.close(), close, '重复 close 必须返回同一个 Promise')
    try { await close } catch (error) { closeError = error.message }
    assert.equal(wrapped.close(), close, '完成或失败后的 close 也必须复用原 Promise')
    await discoveryRequest
  }
  await delay(0)
  const result = {
    browserCloseCalls,
    launchError,
    closeError,
    raced,
    servers: servers.map(({ server, closeCalls, closeAllCalls }) => ({
      listening: server.listening,
      closeCalls,
      closeAllCalls
    })),
    listeners: {
      message: process.listenerCount('message') - initialListeners.message,
      disconnect: process.listenerCount('disconnect') - initialListeners.disconnect
    }
  }
  console.log(`IPC_RESULT ${JSON.stringify(result)}`)
}

async function runChild(t, scenario) {
  const child = spawn(process.execPath, ['--experimental-vm-modules', testPath, '--ipc-child', JSON.stringify(scenario)], {
    cwd: fileURLToPath(new URL('..', import.meta.url)),
    stdio: ['ignore', 'pipe', 'pipe', 'ipc']
  })
  t.after(() => {
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL')
  })
  let output = ''
  const stages = []
  child.stdout.on('data', chunk => { output += chunk })
  child.stderr.on('data', chunk => { output += chunk })
  child.on('message', message => {
    stages.push(message.stage)
    const target = scenario.disconnectBeforeLaunch ? 'ready' : scenario.disconnectAt
    if (message.stage === target && child.connected) child.disconnect()
  })
  // 父侧主动 disconnect 后部分 Node 版本不会再发 ChildProcess close；等 exit 与两个输出流结束。
  const [[status, signal]] = await Promise.all([once(child, 'exit'), finished(child.stdout), finished(child.stderr)])
  assert.equal(signal, null, `子进程不应被信号终止：\n${output}`)
  assert.equal(status, 0, `子进程应干净退出：\n${output}`)
  assert.ok(!output.includes('ERR_IPC_CHANNEL_CLOSED'), `不应泄漏 IPC 错误：\n${output}`)
  const line = output.split('\n').find(entry => entry.startsWith('IPC_RESULT '))
  assert.ok(line, `子进程必须报告完整清理结果：\n${output}`)
  const result = JSON.parse(line.slice('IPC_RESULT '.length))
  assert.equal(result.browserCloseCalls, 1, '真实 IPC 断开后也应只清理一次 stub browser')
  const launchInterrupted = scenario.disconnectBeforeLaunch || scenario.disconnectAt === 'browser' ||
    scenario.disconnectAt === 'opening' || scenario.raceAt === 'browser' || scenario.raceAt === 'opening'
  if (launchInterrupted) {
    assert.match(result.launchError, /IPC 已断开/, '资源返回前断开必须自行清理并中止 launch')
    assert.equal(result.closeError, undefined)
  } else {
    assert.equal(result.launchError, undefined)
    if (scenario.browserFails) assert.equal(result.closeError, 'stub browser close failure')
    else if (scenario.stage) assert.match(result.closeError, /IPC 已断开/, '关闭阶段失去控制面应报告中止并完成清理')
    else assert.equal(result.closeError, undefined)
  }
  assert.deepEqual(result.listeners, { message: 0, disconnect: 0 }, '完成后不能残留阶段控制 listener')
  assert.deepEqual(result.servers, scenario.stage === 'connecting'
    ? [{ listening: false, closeCalls: 1, closeAllCalls: 1 }]
    : [], 'discovery 必须完成一次连接与监听清理')
  if (scenario.raceAt) assert.equal(result.raced, true, '应确实在 send 入口制造真实 IPC 断开竞态')
  for (const stage of ['close', 'closed']) {
    assert.ok(stages.filter(value => value === stage).length <= 1, `${stage} 通知也必须幂等`)
  }
}

if (process.argv[2] === '--ipc-child') {
  await childProbe(JSON.parse(process.argv[3]))
} else {
  for (const [name, scenario] of [
    ['disconnect before launch', { disconnectBeforeLaunch: true, stage: 'opening' }],
    ['parent disconnects after browser', { disconnectAt: 'browser', stage: 'opening' }],
    ['parent disconnects during opening', { disconnectAt: 'opening', stage: 'opening' }],
    ['parent disconnects during connecting', { disconnectAt: 'connecting', stage: 'connecting' }],
    ['parent disconnects during closing', { disconnectAt: 'closing', stage: 'closing' }],
    ['parent disconnects during cleanup', { disconnectAt: 'cleanup', stage: 'running' }],
    ['parent disconnects after close', { disconnectAt: 'close' }],
    ['parent disconnects after closed', { disconnectAt: 'closed' }],
    ['browser failure still closes discovery', { disconnectAt: 'connecting', stage: 'connecting', browserFails: true }],
    ...['browser', 'opening', 'connecting', 'close', 'closing', 'cleanup', 'closed'].map(stage => [
      `real send race at ${stage}`,
      { raceAt: stage, stage: ['opening', 'connecting', 'closing'].includes(stage) ? stage : stage === 'cleanup' ? 'running' : '' }
    ])
  ]) {
    test(name, { timeout: 5000 }, t => runChild(t, scenario))
  }

  for (const mode of ['throw', 'callback error']) {
    for (const failAt of ['browser', 'opening', 'close', 'closing', 'cleanup', 'closed']) {
      test(`${failAt} notification tolerates ${mode}`, { timeout: 3000 }, async () => {
        const sent = []
        let processFixture
        processFixture = fakeProcess((message, callback) => {
          sent.push(message.stage)
          assert.equal(typeof callback, 'function', '每条通知必须有 callback')
          if (message.stage === failAt) {
            const error = Object.assign(new Error('IPC closed'), { code: 'ERR_IPC_CHANNEL_CLOSED' })
            if (mode === 'throw') throw error
            queueMicrotask(() => callback(error))
          } else {
            queueMicrotask(() => {
              callback()
              processFixture.emit('message', { continue: message.stage })
            })
          }
        })
        processFixture.env.SMOKE_TEST_INTERRUPT_STAGE = failAt === 'opening' ? 'opening' : 'closing'
        let closed = 0
        const fixture = await loadFixture(processFixture, {
          wsUrl: 'ws://127.0.0.1:0',
          async close() { closed += 1 }
        })
        if (failAt === 'browser' || failAt === 'opening') {
          await assert.rejects(fixture.launchChrome({}), /IPC 已断开/)
        } else {
          const browser = await fixture.launchChrome({})
          const close = browser.close()
          assert.equal(browser.close(), close)
          if (failAt === 'closing' || failAt === 'cleanup') await assert.rejects(close, /IPC 已断开/)
          else await close
        }
        assert.equal(sent.filter(stage => stage === 'closed').length, 1, '所有失败路径都应尝试最终通知')
        assert.ok(sent.filter(stage => stage === 'close').length <= 1)
        assert.equal(closed, 1)
        assert.equal(processFixture.listenerCount('message'), 0)
        assert.equal(processFixture.listenerCount('disconnect'), 0)
      })
    }
  }

  test('discovery listen failure still awaits browser and server cleanup', { timeout: 3000 }, async () => {
    const processFixture = fakeProcess((message, callback) => queueMicrotask(() => callback()))
    processFixture.env.SMOKE_TEST_INTERRUPT_STAGE = 'connecting'
    const servers = []
    let closed = 0
    const fixture = await loadFixture(processFixture, {
      wsUrl: 'ws://127.0.0.1:0',
      async close() { await delay(10); closed += 1 }
    }, { servers, listenFails: true })
    await assert.rejects(fixture.launchChrome({}), /fixture listen failure/)
    assert.equal(closed, 1)
    assert.equal(servers[0].closeCalls, 1)
    assert.equal(servers[0].closeAllCalls, 1)
    assert.equal(servers[0].server.listening, false)
    assert.equal(processFixture.connected, false)
  })

  test('normal continue removes every stage listener and sends close once', { timeout: 3000 }, async () => {
    const sent = []
    let processFixture
    processFixture = fakeProcess((message, callback) => {
      sent.push(message.stage)
      queueMicrotask(() => {
        callback()
        processFixture.emit('message', { continue: message.stage })
      })
    })
    processFixture.env.SMOKE_TEST_INTERRUPT_STAGE = 'closing'
    let closed = 0
    const fixture = await loadFixture(processFixture, {
      wsUrl: 'ws://127.0.0.1:0',
      async close() { closed += 1 }
    })
    const browser = await fixture.launchChrome({})
    const close = browser.close()
    assert.equal(browser.close(), close)
    await close
    assert.deepEqual(sent, ['browser', 'close', 'closing', 'cleanup', 'closed'])
    assert.equal(closed, 1)
    assert.equal(processFixture.listenerCount('message'), 0)
    assert.equal(processFixture.listenerCount('disconnect'), 0)
  })
}
