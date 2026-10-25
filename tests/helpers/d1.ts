import { readFileSync } from 'node:fs'
import { Miniflare } from 'miniflare'

/**
 * 测试用的真实 D1。
 *
 * 用 miniflare（已是 devDependency，也是 wrangler 自己的本地运行时）而不是
 * 手写一个假 db：`loadTrafficSummary` 里全是 `COUNT(DISTINCT ...)`、`CASE WHEN`、
 * 按天分组的 SQL，只有真跑 SQLite 才能发现写错；用假对象只能断言 SQL 字符串，
 * 那种测试改一个空格就废，也永远不会告诉你聚合结果对不对。
 *
 * 每次调用建一个独立的实例（约 100ms），互不干扰。
 */
export interface TestDatabase {
  db: CloudflareEnv['DB']
  /** 直接把一条 SQL 灌进去看结果，用于断言「库里真的有什么」。 */
  all<T = Record<string, unknown>>(sql: string, ...args: unknown[]): Promise<T[]>
  dispose(): Promise<void>
}

const MIGRATIONS = ['0005_page_views.sql'] as const

export async function createTestDatabase(): Promise<TestDatabase> {
  const miniflare = new Miniflare({
    modules: true,
    script: '',
    compatibilityDate: '2025-01-01',
    d1Databases: { DB: 'test-db' }
  })

  try {
    const db = (await miniflare.getD1Database('DB')) as unknown as CloudflareEnv['DB']

    for (const file of MIGRATIONS) {
      // 不用 db.exec：D1 的 exec 是逐行处理的，多行的 CREATE TABLE 会被判成
      // 「incomplete input」。这里自己按分号切开逐条执行；迁移文件里没有
      // 触发器/存储过程，也没有含分号的字符串字面量，所以简单切分是安全的。
      const sql = readFileSync(new URL(`../../migrations/${file}`, import.meta.url), 'utf8')
        .split('\n')
        .filter(line => !line.trimStart().startsWith('--'))
        .join('\n')
      for (const statement of sql.split(';')) {
        if (statement.trim().length === 0) continue
        await db.prepare(statement).run()
      }
    }

    return {
      db,
      async all<T = Record<string, unknown>>(sql: string, ...args: unknown[]) {
        const result = await db.prepare(sql).bind(...args).all()
        return (result.results ?? []) as unknown as T[]
      },
      async dispose() {
        await miniflare.dispose()
      }
    }
  } catch (error) {
    // 起不来时也要把实例关掉，否则 miniflare 的监听端口会让测试进程一直不退出。
    await miniflare.dispose()
    throw error
  }
}
