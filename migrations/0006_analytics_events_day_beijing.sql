-- 统一日历日口径：analytics_events.day 原先写的是 UTC 日（track 路由用 toISOString()），
-- 而 page_views.day 是 Asia/Shanghai 自然日。结果在北京时间 00:00–08:00 这段时间，
-- 「访问趋势」和「每日事件量」两张图会把同一批行为算到不同的日子上，报表窗口（sinceDay）
-- 也跟着差一天。
--
-- 迁移阶段只安装保护触发器，不在单条语句中回填整张表。
-- 历史数据由 `npm run db:backfill:analytics-days` 按 id 游标分批修复；
-- 每批独立提交，可中断后重跑，避免大表 UPDATE 阻塞 D1 migration。
CREATE TRIGGER IF NOT EXISTS analytics_events_beijing_day_insert
AFTER INSERT ON analytics_events
WHEN NEW.occurred_at > 0
  AND NEW.day <> strftime('%Y-%m-%d', NEW.occurred_at / 1000 + 28800, 'unixepoch')
BEGIN
  UPDATE analytics_events
  SET day = strftime('%Y-%m-%d', NEW.occurred_at / 1000 + 28800, 'unixepoch')
  WHERE id = NEW.id;
END;
