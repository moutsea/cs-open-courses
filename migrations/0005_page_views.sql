-- 页面访问统计（PV / UV）。与 0004 的行为事件表分开存，因为这两件事的生命周期
-- 和隐私约定不同：行为事件回答「用户想找什么」，访问记录回答「来了多少人」。
--
-- 只保存派生数据：不存原始 IP、不存 User-Agent、不存 Cookie。
-- 访客标识是 sha256(IP + UA + 日期 + 盐) 的一次性哈希，跨天即失效，无法反查个人，
-- 也不存在跨天访客 ID —— 所以「UV」是每天去重后再累加的「日 UV 合计」，
-- 不等于区间内的独立访客数。
--
-- collection_method：
--   browser —— 浏览器上报（页面真正展示后），计入 PV / UV；
--   bot     —— edge middleware 记录的爬虫文档请求，单独计数，不计入 PV。
--   legacy  —— 旧版本按请求记录的访问，保留但默认不进报表（避免预加载污染）。
--
-- event_id：客户端每次浏览生成的随机 UUID，唯一索引用于吞掉重传/StrictMode 重跑。
-- 保留期：worker 的每日 cron 调用 purgePageViews()，删除 180 天前的行。
CREATE TABLE IF NOT EXISTS page_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  day TEXT NOT NULL,
  path TEXT NOT NULL,
  referrer_host TEXT NOT NULL DEFAULT '',
  utm_source TEXT NOT NULL DEFAULT '',
  utm_medium TEXT NOT NULL DEFAULT '',
  utm_campaign TEXT NOT NULL DEFAULT '',
  visitor_hash TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT '',
  device TEXT NOT NULL DEFAULT 'desktop',
  is_bot INTEGER NOT NULL DEFAULT 0,
  collection_method TEXT NOT NULL DEFAULT 'browser',
  event_id TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS page_views_method_day_idx ON page_views(collection_method, day, is_bot);
CREATE INDEX IF NOT EXISTS page_views_day_path_idx ON page_views(day, path);
CREATE INDEX IF NOT EXISTS page_views_day_visitor_idx ON page_views(day, visitor_hash);
CREATE INDEX IF NOT EXISTS page_views_created_at_idx ON page_views(created_at);
-- SQLite 的唯一索引允许任意多个 NULL，所以爬虫记录（event_id 为 NULL）不会互相冲突。
CREATE UNIQUE INDEX IF NOT EXISTS page_views_event_id_idx ON page_views(event_id);
