-- =====================================================================================
-- 短信接码 · S1：sms_config 出厂值（docs/短信接码-设计.md §5.3；站长 09-29 确认，Q1）。可以重复执行（已存在就不动）。
--
--   mysql -uroot -p"$MYSQL_ROOT_PASSWORD" --default-character-set=utf8mb4 beiguo_shop < scripts/ops/jiema-s1-seed.sql
--
-- 出厂：总开关关、受众仅管理员；x=8.00（saleCoef4=80000）、成本汇率 7.20（costFx4=72000）、y=¥1.50、最低售价 ¥1.00、
-- 向上取整到分、容差 25%、最低毛利 ¥0.50；上游余额只告警（$2），不设停售线与日上限（Q4）；P2 预留开关全关。
-- 读不到这一行（或校验不过）= 接码新单、导航、sitemap、目录接口一律关闭（fail-closed，不回落出厂值），并推 sms.alert。
-- 与代码里的 FACTORY_SMS_CONFIG（src/lib/jiema-config-schema.ts）逐字相同；以后改配置只在后台「短信接码 → 定价 / 设置」里改
-- （zod 保存校验 + 乐观并发 + 审计），不要再手改这一行。
-- 服务 / 国家目录、价格缓存不在种子里：由 /api/cron/jiema-catalog 第一次运行时从上游拉取（中文名、别名、ISO2、区号来自仓库里的种子 JSON）。
-- 不预置任何屏蔽 / 下架 / 停售 / 覆盖规则（D25、Q2）：sms_holds、sms_price_rules 出厂为空。
-- 运维脚本不 import src/（纯 SQL）。
-- =====================================================================================

INSERT INTO settings (`key`, value, created_at, updated_at)
SELECT 'sms_config',
       '{"version":1,"enabled":false,"audience":"ADMIN_ONLY","saleCoef4":80000,"costFx4":72000,"markupCents":150,"minPriceCents":100,"rounding":"CENT","tolerancePct":25,"minMarginCents":50,"quoteTtlSec":600,"maxReplace":5,"acquireTries":3,"limits":{"activePerUser":3,"perHour":10,"perDay":30,"maxActiveNumbers":20},"upstream":{"balanceAlertUsd":2,"legacyReserveThreads":1},"autoHold":{"zero":{"minAttempts":8,"windowH":24},"ratio":{"minAttempts":20,"minRatePct":12,"windowH":24},"upstreamCombo":{"minCount":70,"minRatePct":8},"upstreamAccount":{"minCount":350,"minRatePct":5},"holdH":6},"breaker":{"windowSec":120,"minFails":5,"minRatio":0.5,"closeAfterSec":180},"longDurationVerified":false,"hotServices":["dr","acz","tg","wa","go","ig","fb","tw","ds","am","wx","mm"],"complaintWindowH":24,"legacyOnNewEngine":false,"resellerMode":false,"webhookEnabled":false}',
       UTC_TIMESTAMP(3),
       UTC_TIMESTAMP(3)
  FROM DUAL
 WHERE NOT EXISTS (SELECT 1 FROM settings WHERE `key` = 'sms_config');

-- 核对：恰好 1 行
SELECT `key`, value FROM settings WHERE `key` = 'sms_config';
-- 核对：手动停售三处出厂都为空（S1 验收，附录 B 第 26 条）—— 三个数都应为 0
SELECT (SELECT COUNT(*) FROM sms_holds) AS holds,
       (SELECT COUNT(*) FROM sms_price_rules WHERE disabled = 1) AS disabled_rules,
       (SELECT COUNT(*) FROM sms_services WHERE status = 'OFF') + (SELECT COUNT(*) FROM sms_countries WHERE status = 'OFF') AS manual_off;
