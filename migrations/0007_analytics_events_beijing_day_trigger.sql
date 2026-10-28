-- 0006 installs the INSERT trigger before the historical repair command runs.
-- Keep this migration as an idempotent safety net for databases that already have
-- the earlier 0006 migration recorded but not the trigger (for example a staged
-- deployment). Historical rows are repaired by the resumable batch command rather
-- than by a migration-sized UPDATE.
CREATE TRIGGER IF NOT EXISTS analytics_events_beijing_day_insert
AFTER INSERT ON analytics_events
WHEN NEW.occurred_at > 0
  AND NEW.day <> strftime('%Y-%m-%d', NEW.occurred_at / 1000 + 28800, 'unixepoch')
BEGIN
  UPDATE analytics_events
  SET day = strftime('%Y-%m-%d', NEW.occurred_at / 1000 + 28800, 'unixepoch')
  WHERE id = NEW.id;
END;
