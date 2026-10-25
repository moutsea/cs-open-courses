-- 第一方、无 Cookie 的轻量行为统计。
-- 不存 IP、User-Agent、Cookie，也不做跨站追踪。
-- 注意：props_json 里**会有用户输入**（搜索词 q、筛选分类、外链 href 的 origin+pathname），
-- 不是纯聚合维度。写查询/导出时要按「可能含个人输入」对待，别拿它当匿名统计数据。
-- 保留期：worker 的每日 cron 调用 purgeAnalyticsEvents()，删除 180 天前的行。
CREATE TABLE IF NOT EXISTS analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  occurred_at INTEGER NOT NULL,
  day TEXT NOT NULL,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  locale TEXT NOT NULL DEFAULT '',
  target_host TEXT NOT NULL DEFAULT '',
  props_json TEXT NOT NULL DEFAULT '{}',
  country TEXT NOT NULL DEFAULT '',
  device TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS analytics_events_day_name_idx ON analytics_events(day, name);
-- 出站点击（联盟转化）按目标域名聚合时走这条部分索引
CREATE INDEX IF NOT EXISTS analytics_events_target_day_idx ON analytics_events(target_host, day) WHERE target_host <> '';
