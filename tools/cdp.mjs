/** 本地 smoke 使用的 CDP page 连接；所有请求有超时，断线会拒绝未完成请求。 */
export async function connectPage(wsUrl, { timeoutMs = 15000 } = {}) {
  if (typeof WebSocket === 'undefined') throw new Error('CDP 需要支持全局 WebSocket 的 Node.js（建议 Node 22+）')
  const endpoint = new URL(wsUrl)
  endpoint.protocol = endpoint.protocol === 'wss:' ? 'https:' : 'http:'
  const res = await fetch(new URL('/json/list', endpoint), { signal: AbortSignal.timeout(timeoutMs) })
  if (!res.ok) throw new Error(`读取 CDP targets 失败：HTTP ${res.status}`)
  const targets = await res.json()
  const target = targets.find(t => t.type === 'page' && t.webSocketDebuggerUrl)
  if (!target) throw new Error('没有找到 CDP page target')

  const socket = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => finish(new Error(`连接 CDP page 超时（${timeoutMs}ms）`)), timeoutMs)
    const opened = () => finish()
    const failed = () => finish(new Error('连接 CDP page 失败'))
    const finish = error => {
      clearTimeout(timer)
      socket.removeEventListener('open', opened)
      socket.removeEventListener('error', failed)
      socket.removeEventListener('close', failed)
      if (error) {
        socket.close()
        reject(error)
      } else resolve()
    }
    socket.addEventListener('open', opened, { once: true })
    socket.addEventListener('error', failed, { once: true })
    socket.addEventListener('close', failed, { once: true })
  })

  let nextId = 1
  const pending = new Map()
  const listeners = new Map()
  const rejectPending = error => {
    for (const request of pending.values()) {
      clearTimeout(request.timer)
      request.reject(error)
    }
    pending.clear()
  }
  socket.addEventListener('close', () => rejectPending(new Error('CDP page 连接已关闭')))
  socket.addEventListener('error', () => rejectPending(new Error('CDP page 连接异常')))
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data)
    if (message.id && pending.has(message.id)) {
      const { method, resolve, reject, timer } = pending.get(message.id)
      clearTimeout(timer)
      pending.delete(message.id)
      if (message.error) reject(new Error(`CDP ${method}：${message.error.message}`))
      else resolve(message.result)
      return
    }
    for (const handler of listeners.get(message.method) ?? []) handler(message.params)
  })

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      if (socket.readyState !== WebSocket.OPEN) {
        reject(new Error(`CDP ${method}：page 连接未打开`))
        return
      }
      const id = nextId++
      const timer = setTimeout(() => {
        pending.delete(id)
        reject(new Error(`CDP ${method} 超时（${timeoutMs}ms）`))
      }, timeoutMs)
      pending.set(id, { method, resolve, reject, timer })
      try {
        socket.send(JSON.stringify({ id, method, params }))
      } catch (error) {
        clearTimeout(timer)
        pending.delete(id)
        reject(error)
      }
    })

  const on = (method, handler) => {
    listeners.set(method, [...(listeners.get(method) ?? []), handler])
  }

  const close = async () => {
    rejectPending(new Error('CDP page 连接已关闭'))
    if (socket.readyState === WebSocket.CLOSED) return
    await new Promise(resolve => {
      const done = () => {
        clearTimeout(timer)
        socket.removeEventListener('close', done)
        resolve()
      }
      const timer = setTimeout(done, 1000)
      socket.addEventListener('close', done, { once: true })
      socket.close()
    })
  }
  return { send, on, close }
}
