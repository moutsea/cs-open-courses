import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { test } from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createContext, SourceTextModule, SyntheticModule } from 'node:vm'

// node --experimental-vm-modules --test tools/test-verify-tab-errors.mjs
// 执行未经替换的完整 smoke 源码，仅通过模块边界注入资源和 process；不启动浏览器或服务。
const sourceUrl = new URL('./verify-tab.mjs', import.meta.url)
const source = await readFile(sourceUrl, 'utf8')
const password = 'fixture-cleanup-secret'

async function interruptedSmoke(signal, { pageFails, browserFails }) {
  const output = []
  const closed = []
  const processFixture = new EventEmitter()
  processFixture.env = {
    ADMIN_PASSWORD: password,
    SMOKE_BASE_URL: 'http://localhost:3101',
    SMOKE_CHROME_HELPER: fileURLToPath(import.meta.url)
  }
  let rejectNavigation
  const page = {
    on() {},
    async send(method) {
      if (method !== 'Page.navigate') return {}
      return new Promise((_, reject) => {
        rejectNavigation = reject
        queueMicrotask(() => processFixture.emit(signal))
      })
    },
    async close() {
      closed.push('page.close')
      // 清理尚未结束时再次发送相同信号，覆盖 handler/finally 共用清理的幂等性。
      await Promise.resolve()
      processFixture.emit(signal)
      rejectNavigation(new Error(`navigation closed ${password}`))
      if (pageFails) throw new Error(`fixture page close failure ${password}`)
    }
  }
  const browser = {
    wsUrl: 'ws://127.0.0.1:0',
    async close() {
      closed.push('browser.close')
      if (browserFails) throw new Error(`fixture browser close failure ${password}`)
    }
  }
  const context = createContext({
    AbortController,
    URL,
    process: processFixture,
    console: {
      log: (...args) => output.push(args.join(' ')),
      error: (...args) => output.push(args.join(' '))
    }
  })
  const modules = new Map()
  const dependency = (specifier, exports) => {
    const dependencyModule = new SyntheticModule(Object.keys(exports), function () {
      for (const [name, value] of Object.entries(exports)) this.setExport(name, value)
    }, { context, identifier: specifier })
    modules.set(specifier, dependencyModule)
    return dependencyModule
  }
  dependency('node:assert/strict', { default: assert })
  dependency('node:fs/promises', { access: async () => {} })
  dependency('node:path', { resolve })
  dependency('node:url', { fileURLToPath, pathToFileURL })
  dependency('node:timers/promises', { setTimeout: delay })
  dependency('./cdp.mjs', { connectPage: async () => page })
  const helper = dependency(import.meta.url, { launchChrome: async () => browser })
  await helper.link(() => { throw new Error('fixture helper must have no imports') })
  await helper.evaluate()
  const smokeModule = new SourceTextModule(source, {
    context,
    identifier: sourceUrl.href,
    importModuleDynamically: async specifier => {
      assert.equal(specifier, import.meta.url, 'smoke 应加载配置的 fixture helper')
      return helper
    }
  })
  await smokeModule.link(specifier => {
    assert.ok(modules.has(specifier), `unexpected smoke dependency: ${specifier}`)
    return modules.get(specifier)
  })
  await smokeModule.evaluate({ timeout: 1000 })
  return { output: output.join('\n'), status: processFixture.exitCode, closed, processFixture }
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  for (const [name, pageFails, browserFails] of [
    ['cleanup succeeds', false, false],
    ['page close fails', true, false],
    ['browser close fails', false, true],
    ['both close fail', true, true]
  ]) {
    test(`${signal}: ${name}`, { timeout: 3000 }, async () => {
      const result = await interruptedSmoke(signal, { pageFails, browserFails })
      assert.equal(result.status, signal === 'SIGINT' ? 130 : 143, '应保留原信号退出码')
      assert.deepEqual(result.closed, ['page.close', 'browser.close'], '两个资源都应按序清理且只关闭一次')
      assert.match(result.output, new RegExp(`收到 ${signal}`), '应保留原中断信号')
      assert.match(result.output, /navigation closed \[REDACTED\]/, '应同时保留原执行错误并脱敏')
      assert.ok(!result.output.includes(password), '所有错误消息都必须脱敏')
      assert.ok(!result.output.includes('PASS smoke：'), '中断不能报告 smoke 成功')
      if (pageFails) assert.match(result.output, /page\.close[^\n]*fixture page close failure \[REDACTED\]/, '应报告 page.close 的失败')
      if (browserFails) assert.match(result.output, /browser\.close[^\n]*fixture browser close failure \[REDACTED\]/, '应报告 browser.close 的失败')
      if (pageFails || browserFails) {
        assert.ok(!result.output.includes('已清理浏览器'), '清理失败时不能宣称已清理浏览器')
      } else {
        assert.ok(!result.output.includes('清理失败'), '关闭成功不应报清理失败')
      }
      assert.equal(result.processFixture.listenerCount('SIGINT'), 0, '完成后应移除 SIGINT handler')
      assert.equal(result.processFixture.listenerCount('SIGTERM'), 0, '完成后应移除 SIGTERM handler')
    })
  }
}
