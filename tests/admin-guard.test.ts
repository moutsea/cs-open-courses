import assert from 'node:assert/strict'
import test from 'node:test'
import { NextRequest } from 'next/server'
import middleware from '../src/middleware'

/**
 * wrangler.jsonc 打开了 workers_dev 与 preview_urls，每次部署都会多出一份
 * 公开的 *.workers.dev 副本。后台挂在那里等于多开一个入口，所以中间件要在
 * 非正式域名上把 /admin 直接当不存在。
 */
function run(url: string) {
  const response = middleware(new NextRequest(url))
  return {
    status: response.status,
    passesThrough: response.headers.get('x-middleware-next') === '1',
    rewrite: response.headers.get('x-middleware-rewrite') ?? '',
    location: response.headers.get('location') ?? ''
  }
}

test('/admin is invisible on preview deployments but passes through in production and locally', () => {
  for (const url of [
    'https://demo.example.workers.dev/admin',
    'https://demo.example.workers.dev/admin/',
    'https://demo.example.workers.dev/admin/gaps',
    'https://preview.cs-courses.pages.dev/admin/login'
  ]) {
    const result = run(url)
    assert.equal(result.status, 404, url)
    assert.equal(result.passesThrough, false, url)
    assert.equal(result.rewrite, '', url)
    assert.equal(result.location, '', url)
  }

  for (const url of [
    'https://www.cs61bbeyond.com/admin',
    'https://cs61bbeyond.com/admin/gaps',
    'http://localhost:3000/admin/login'
  ]) {
    const result = run(url)
    assert.equal(result.status, 200, url)
    assert.equal(result.passesThrough, true, `${url} 必须原样放行，不能被 i18n 重写`)
    assert.equal(result.rewrite, '', url)
  }
})

test('the public site still renders normally on a preview host', () => {
  // 只藏后台：首页照常，课程列表照常做语言前缀重写。
  assert.equal(run('https://demo.example.workers.dev/zh').status, 200)
  const courses = run('https://demo.example.workers.dev/courses')
  assert.match(courses.rewrite, /\/en\/courses$/)
})

test('paths that merely start with the letters "admin" are not mistaken for the dashboard', () => {
  // /administration 之类的公开路径必须照常走 i18n 重写，不能被当成后台路由。
  const other = run('https://demo.example.workers.dev/administration')
  assert.equal(other.status, 200)
  assert.match(other.rewrite, /\/en\/administration$/)
})
