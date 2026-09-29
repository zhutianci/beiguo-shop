-- =====================================================================================
-- 短信接码 · B0 余额底座：上线前核一次旧账（docs/短信接码-设计.md §5.6）。**只读**，不改任何数据。
--
--   mysql -uroot -p"$MYSQL_ROOT_PASSWORD" --default-character-set=utf8mb4 --table beiguo_shop \
--     < scripts/ops/wallet-b0-legacy-check.sql > /opt/beiguo/backups/wallet-b0-legacy-check-$(date +%Y%m%d%H%M).txt
--
-- 运维脚本不 import src/（纯 SQL）。输出存档，把 ① 的名单与差额逐个列给站长过目，
-- 站长同意补的用户再跑 scripts/ops/wallet-b0-align.sql（「历史对齐」流水，Q10 已同意），剔除的写进豁免名单。
-- =====================================================================================

-- ① 返现格与流水之和不一致的用户（历史上直接改库、或早期没写流水的调整）
SELECT u.id,
       u.email,
       u.balance,
       COALESCE(SUM(l.delta), 0)             AS log_sum,
       u.balance - COALESCE(SUM(l.delta), 0) AS diff,
       COUNT(l.id)                           AS log_count
  FROM users u
  LEFT JOIN balance_logs l ON l.user_id = u.id
 GROUP BY u.id, u.email, u.balance
HAVING u.balance <> COALESCE(SUM(l.delta), 0)
 ORDER BY ABS(u.balance - COALESCE(SUM(l.delta), 0)) DESC, u.id;

-- ①' 汇总：不一致的人数与差额合计
SELECT COUNT(*) AS mismatched_users, COALESCE(SUM(t.diff), 0) AS diff_sum
  FROM (SELECT u.id, u.balance - COALESCE(SUM(l.delta), 0) AS diff
          FROM users u LEFT JOIN balance_logs l ON l.user_id = u.id
         GROUP BY u.id, u.balance
        HAVING u.balance <> COALESCE(SUM(l.delta), 0)) t;

-- ② 新列确实为 0 / 空（DDL 之后、换镜像之前跑；阳性对照之后）
SELECT COUNT(*) AS users_topup_nonzero FROM users WHERE topup_cents <> 0;
SELECT COUNT(*) AS logs_new_cols_nonzero FROM balance_logs WHERE topup_delta_cents <> 0 OR biz_key IS NOT NULL;
SELECT COUNT(*) AS holds FROM balance_holds;

-- ③ 负债基线（上线后「余额与充值」看板的第一个数，应与改造前的余额合计一致）
SELECT COALESCE(SUM(balance), 0) AS cash_total, COALESCE(SUM(topup_cents), 0) AS topup_cents_total FROM users;

-- ④ 流水类型分布（B0 之前只应有 REFERRAL / ADJUST / WITHDRAW）
SELECT type, COUNT(*) AS n, COALESCE(SUM(delta), 0) AS delta_sum FROM balance_logs GROUP BY type ORDER BY type;
