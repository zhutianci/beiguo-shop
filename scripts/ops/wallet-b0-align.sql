-- =====================================================================================
-- 短信接码 · B0：「历史对齐」流水（docs/短信接码-设计.md §5.6，站长 Q10 已同意补）。
--
-- 对旧账核对 ① 查出的、**站长逐个过目同意补**的用户，各补一条流水：
--   type=ADJUST、delta = balance − Σdelta、topup_delta_cents = 0、biz_key = migrate:u<userId>、note「历史余额对齐（B0 上线）」。
-- **只写流水、不改 users.balance**（余额本身是对的，缺的是流水）。补过之后每日对账 W1 才能对这些用户生效。
-- 可以重复执行：biz_key 唯一 + NOT EXISTS，同一个用户只补一次；已经对齐（差额为 0）的用户自动跳过。
--
-- 用法（顺序不能改）：
--   1. 先跑 scripts/ops/wallet-b0-legacy-check.sql 存档，把名单与差额给站长过目；
--   2. 把站长同意补的用户 id 填进下面的 @ids（逗号分隔、不留空格，例如 '12,34,56'）。**留空 = 什么都不写**；
--   3. mysql -uroot -p"$MYSQL_ROOT_PASSWORD" --default-character-set=utf8mb4 --table beiguo_shop < scripts/ops/wallet-b0-align.sql
--   4. 站长剔除（不补）的用户写进对账豁免名单（本文件末尾第 ④ 段，默认注释掉）。
--
-- 运维脚本不 import src/（纯 SQL）。created_at 用 UTC_TIMESTAMP(3)：Prisma 写入的时间都是 UTC，不能用会话时区的 NOW()。
-- =====================================================================================

SET @ids = '';

-- ① 预览：将要补的用户与差额（没有输出 = 没有要补的）
SELECT u.id, u.email, u.balance, COALESCE(s.sum_delta, 0) AS log_sum, u.balance - COALESCE(s.sum_delta, 0) AS diff
  FROM users u
  LEFT JOIN (SELECT user_id, SUM(delta) AS sum_delta FROM balance_logs GROUP BY user_id) s ON s.user_id = u.id
 WHERE @ids <> '' AND FIND_IN_SET(u.id, @ids) > 0
   AND u.balance <> COALESCE(s.sum_delta, 0)
   AND NOT EXISTS (SELECT 1 FROM balance_logs b WHERE b.biz_key = CONCAT('migrate:u', u.id));

START TRANSACTION;

-- ② 写入（每人一条；balance_after = 当前返现格；topup_after_cents = 当前充值格；不改 users）
INSERT INTO balance_logs (user_id, delta, balance_after, type, note, order_id, created_at, topup_delta_cents, topup_after_cents, biz_key)
SELECT u.id,
       u.balance - COALESCE(s.sum_delta, 0),
       u.balance,
       'ADJUST',
       '历史余额对齐（B0 上线）',
       NULL,
       UTC_TIMESTAMP(3),
       0,
       u.topup_cents,
       CONCAT('migrate:u', u.id)
  FROM users u
  LEFT JOIN (SELECT user_id, SUM(delta) AS sum_delta FROM balance_logs GROUP BY user_id) s ON s.user_id = u.id
 WHERE @ids <> '' AND FIND_IN_SET(u.id, @ids) > 0
   AND u.balance <> COALESCE(s.sum_delta, 0)
   AND NOT EXISTS (SELECT 1 FROM balance_logs b WHERE b.biz_key = CONCAT('migrate:u', u.id));

COMMIT;

-- ③ 复核：这些用户的 返现格 = Σdelta（应当没有输出）
SELECT u.id, u.balance, COALESCE(SUM(l.delta), 0) AS log_sum
  FROM users u LEFT JOIN balance_logs l ON l.user_id = u.id
 WHERE @ids <> '' AND FIND_IN_SET(u.id, @ids) > 0
 GROUP BY u.id, u.balance
HAVING u.balance <> COALESCE(SUM(l.delta), 0);

-- ③' 本次写入的对齐流水
SELECT id, user_id, delta, balance_after, biz_key, created_at FROM balance_logs WHERE biz_key LIKE 'migrate:u%' ORDER BY id;

-- ④ （可选）站长剔除、不补流水的用户写进对账豁免名单：W1 / W8 跳过它们，报告里列出。取消注释并填 id 后执行
-- INSERT INTO settings (`key`, value, created_at, updated_at)
-- VALUES ('wallet_reconcile_exempt', '{"userIds":[],"note":"B0 旧账核对时站长剔除，不补历史对齐流水"}', UTC_TIMESTAMP(3), UTC_TIMESTAMP(3))
-- ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = UTC_TIMESTAMP(3);
