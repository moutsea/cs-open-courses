import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { marked } from 'marked'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const COURSE_ROOT = path.join(ROOT, 'course-content')
const args = new Set(process.argv.slice(2))
const strict = args.has('--strict')
const localeArg = process.argv.find(argument => argument.startsWith('--locale='))?.split('=')[1]
const locales = localeArg && localeArg !== 'all' ? [localeArg] : ['en', 'zh']
const concurrencyArg = process.argv.find(argument => argument.startsWith('--concurrency='))?.split('=')[1]
const concurrency = Math.max(1, Number.parseInt(concurrencyArg || '16', 10))

async function walkMarkdown(directory) {
  const files = []
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await walkMarkdown(entryPath))
    else if (entry.isFile() && entry.name.endsWith('.md')) files.push(entryPath)
  }
  return files
}

function extractLinks(content) {
  const urls = new Set()

  function visit(value) {
    if (Array.isArray(value)) {
      for (const item of value) visit(item)
      return
    }
    if (!value || typeof value !== 'object') return

    if (typeof value.href === 'string' && /^https?:\/\//.test(value.href)) {
      urls.add(value.href.replace(/&amp;/g, '&'))
    }
    if (value.type === 'html' && typeof value.raw === 'string') {
      for (const match of value.raw.matchAll(/(?:href|src)=["'](https?:\/\/[^"']+)["']/gi)) {
        urls.add(match[1].replace(/&amp;/g, '&'))
      }
    }

    for (const nestedValue of Object.values(value)) visit(nestedValue)
  }

  visit(marked.lexer(content))
  return urls
}

async function collectLinks() {
  const links = new Map()

  for (const locale of locales) {
    const localeRoot = path.join(COURSE_ROOT, locale)
    const files = await walkMarkdown(localeRoot)
    for (const filePath of files) {
      const content = await fs.readFile(filePath, 'utf8')
      for (const url of extractLinks(content)) {
        try {
          const parsed = new URL(url)
          if (!['http:', 'https:'].includes(parsed.protocol)) continue
        } catch {
          continue
        }

        const relativePath = path.relative(ROOT, filePath).replace(/\\/g, '/')
        const filesForUrl = links.get(url) || new Set()
        filesForUrl.add(relativePath)
        links.set(url, filesForUrl)
      }
    }
  }

  return links
}

async function checkUrl(url) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15_000)

  try {
    const response = await fetch(url, {
      headers: {
        accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
        range: 'bytes=0-0',
        'user-agent': 'cs-courses-link-audit/1.0'
      },
      redirect: 'follow',
      signal: controller.signal
    })
    await response.body?.cancel()
    return {
      url,
      status: response.status,
      finalUrl: response.url,
      ok: response.ok
    }
  } catch (error) {
    return {
      url,
      status: 0,
      finalUrl: url,
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    }
  } finally {
    clearTimeout(timeout)
  }
}

async function mapConcurrent(items, worker, limit) {
  const results = new Array(items.length)
  let nextIndex = 0

  async function runWorker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex
      nextIndex += 1
      results[currentIndex] = await worker(items[currentIndex])
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => runWorker()))
  return results
}

function meaningfulRedirect(result) {
  if (!result.finalUrl || result.finalUrl === result.url) return false

  try {
    const original = new URL(result.url)
    const final = new URL(result.finalUrl)
    const originalPath = `${original.hostname}${original.pathname}`.replace(/\/$/, '')
    const finalPath = `${final.hostname}${final.pathname}`.replace(/\/$/, '')
    return originalPath.toLowerCase() !== finalPath.toLowerCase()
  } catch {
    return false
  }
}

async function main() {
  const links = await collectLinks()
  const urls = Array.from(links.keys()).sort()
  console.log(`[link-audit] Checking ${urls.length} unique URLs across ${locales.join(', ')} with concurrency ${concurrency}`)

  const results = await mapConcurrent(urls, checkUrl, concurrency)
  const broken = results.filter(result => [404, 410].includes(result.status))
  const blocked = results.filter(result => result.status === 0 || result.status === 401 || result.status === 403 || result.status === 429 || result.status >= 500)
  const redirects = results.filter(result => result.ok && meaningfulRedirect(result))

  for (const result of broken) {
    console.log(`\n[BROKEN ${result.status}] ${result.url}`)
    for (const filePath of links.get(result.url) || []) console.log(`  ${filePath}`)
  }

  for (const result of redirects) {
    console.log(`\n[REDIRECT ${result.status}] ${result.url}`)
    console.log(`  -> ${result.finalUrl}`)
    for (const filePath of links.get(result.url) || []) console.log(`  ${filePath}`)
  }

  for (const result of blocked) {
    console.log(`\n[UNVERIFIED ${result.status || 'ERR'}] ${result.url}`)
    if (result.error) console.log(`  ${result.error}`)
    for (const filePath of links.get(result.url) || []) console.log(`  ${filePath}`)
  }

  console.log(`\n[link-audit] Complete: ${urls.length - broken.length - blocked.length} reachable, ${broken.length} broken, ${redirects.length} meaningful redirects, ${blocked.length} unverified`)
  if (strict && broken.length > 0) process.exitCode = 1
}

main().catch(error => {
  console.error(`[link-audit] ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
})
