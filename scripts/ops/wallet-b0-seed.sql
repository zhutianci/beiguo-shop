-- =====================================================================================
-- 短信接码 · B0：wallet_config 出厂值（docs/短信接码-设计.md §5.3；站长 09-29 确认，Q5）。可以重复执行（已存在就不动）。
--
--   mysql -uroot -p"$MYSQL_ROOT_PASSWORD" --default-character-set=utf8mb4 beiguo_shop < scripts/ops/wallet-b0-seed.sql
--
-- 读不到这一行时，充值、「新单选余额」、迟到付款自动退入一律按关闭处理（fail-closed，不回落出厂值）；
-- 释放、确认、退款、提现、返现入账不读它。B0 阶段它只影响后台「余额与充值 → 设置」的显示（充值要到 B1 才有）。
-- 以后改配置只在后台「设置」里改（zod 保存校验 + 审计），不要再手改这一行。
-- 运维脚本不 import src/（纯 SQL）。
-- =====================================================================================

INSERT INTO settings (`key`, value, created_at, updated_at)
SELECT 'wallet_config',
       '{"version":1,"balancePayEnabled":true,"topupEnabled":false,"topupAudience":"ADMIN_ONLY","tiersCents":[500,1000,1500,2000,5000],"minCents":100,"maxCents":100000,"pendingTopupPerUser":2,"latepayAuto":true}',
       UTC_TIMESTAMP(3),
       UTC_TIMESTAMP(3)
  FROM DUAL
 WHERE NOT EXISTS (SELECT 1 FROM settings WHERE `key` = 'wallet_config');

-- 核对：恰好 1 行
SELECT `key`, value FROM settings WHERE `key` = 'wallet_config';
