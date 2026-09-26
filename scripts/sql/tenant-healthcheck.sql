-- =====================================================================================
-- 渠道分站 · 只读巡检 SQL（WP8，设计 10.12 的 L2、L3、L10、L12、L13、A5、A6、A11）
--
-- 用途：运维独立复核，**不依赖应用**。应用内的每日对账（POST /api/cron/tenant-reconcile，src/lib/tenant/reconcile.ts）
-- 是权威实现；这份 SQL 用来在应用挂了、或怀疑对账代码本身有 bug 时，从库里直接看同一组不变式。
-- 两边口径以 reconcile.ts 为准；这里只挑「纯 SQL 就能完整表达」的几条（L5 / L6 / L8 这类要逐单复算的不在这里）。
--
-- 怎么跑（只读；整份在一个 READ ONLY 事务里，误写任何语句都会报错而不是生效）：
--   docker exec -i beiguo-db sh -c 'mysql --default-character-set=utf8mb4 -uroot -p"$MYSQL_ROOT_PASSWORD" beiguo_shop' \
--     < scripts/sql/tenant-healthcheck.sql
-- 读法：每条检查一行，fail_count = 0 为通过；不为 0 时 samples 给出最多 20 个订单号（或租户 / 结算单号）。
--   钱类（MONEY）失败：当天处理，并确认应用对账已把该渠道置 payoutHold；告警类（ALERT）：排查原因。
-- 时间：库里 DATETIME 存的是 UTC（Prisma 约定），所以一律和 UTC_TIMESTAMP() 比，不用 NOW()。
-- =====================================================================================

SET NAMES utf8mb4;
SET SESSION group_concat_max_len = 4096;
START TRANSACTION READ ONLY;

-- L2（钱）已付渠道单必须已计提：settle_state 非空；ACCRUED / RELEASED 的必须有 sale:{id} 这组分录
SELECT 'L2' AS id, 'MONEY' AS level, '已付渠道单必计提' AS title, COUNT(*) AS fail_count,
       SUBSTRING_INDEX(GROUP_CONCAT(o.order_no ORDER BY o.id SEPARATOR ','), ',', 20) AS samples
  FROM orders o
 WHERE o.tenant_id >= 2 AND o.paid_at IS NOT NULL
   AND (o.settle_state IS NULL
        OR (o.settle_state IN ('ACCRUED', 'RELEASED')
            AND NOT EXISTS (SELECT 1 FROM tenant_ledger_entries e WHERE e.order_id = o.id AND e.event_key = CONCAT('sale:', o.id))));

-- L3（钱）主站单快照列全空、无分录；分录的 tenant_id 必须等于订单的 tenant_id
SELECT 'L3a' AS id, 'MONEY' AS level, '主站单快照列全空' AS title, COUNT(*) AS fail_count,
       SUBSTRING_INDEX(GROUP_CONCAT(o.order_no ORDER BY o.id SEPARATOR ','), ',', 20) AS samples
  FROM orders o
 WHERE o.tenant_id = 1
   AND (o.listing_id IS NOT NULL OR o.supply_unit_price IS NOT NULL OR o.supply_cents IS NOT NULL
        OR o.fee_rate_bp IS NOT NULL OR o.invoice_share_rate_bp IS NOT NULL OR o.settle_hold_days IS NOT NULL
        OR o.main_price_at_order IS NOT NULL OR o.settle_state IS NOT NULL OR o.inv_share_state IS NOT NULL);
SELECT 'L3b' AS id, 'MONEY' AS level, '分录与订单同站（主站单无分录）' AS title, COUNT(DISTINCT o.id) AS fail_count,
       SUBSTRING_INDEX(GROUP_CONCAT(DISTINCT o.order_no ORDER BY o.id SEPARATOR ','), ',', 20) AS samples
  FROM tenant_ledger_entries e JOIN orders o ON o.id = e.order_id
 WHERE e.tenant_id <> o.tenant_id OR o.tenant_id = 1;

-- L10（钱）每渠道未完结结算单（open_key 非空）≤ 1；Σ IN_PAYOUT = Σ 未完结单 net；AVAILABLE 全部 = 未纳入结算单的部分
SELECT 'L10a' AS id, 'MONEY' AS level, '每渠道未完结结算单 ≤ 1' AS title, COUNT(*) AS fail_count,
       SUBSTRING_INDEX(GROUP_CONCAT(CONCAT('tenant#', t.tenant_id) SEPARATOR ','), ',', 20) AS samples
  FROM (SELECT tenant_id FROM tenant_statements WHERE open_key IS NOT NULL GROUP BY tenant_id HAVING COUNT(*) > 1) t;
SELECT 'L10b' AS id, 'MONEY' AS level, 'open_key 与状态一致（未完结 ⇔ open_key 非空）' AS title, COUNT(*) AS fail_count,
       SUBSTRING_INDEX(GROUP_CONCAT(s.statement_no ORDER BY s.id SEPARATOR ','), ',', 20) AS samples
  FROM tenant_statements s
 WHERE (s.state IN ('GENERATED', 'CONFIRMED', 'DISPUTED', 'PAYING')) <> (s.open_key IS NOT NULL);
SELECT 'L10c' AS id, 'MONEY' AS level, 'Σ IN_PAYOUT = Σ 未完结单 net' AS title, COUNT(*) AS fail_count,
       SUBSTRING_INDEX(GROUP_CONCAT(CONCAT('tenant#', x.t, ':', x.inp, '≠', x.net) SEPARATOR ','), ',', 20) AS samples
  FROM (SELECT t, SUM(inp) AS inp, SUM(net) AS net
          FROM (SELECT tenant_id AS t, SUM(amount_cents) AS inp, 0 AS net FROM tenant_ledger_entries WHERE bucket = 'IN_PAYOUT' GROUP BY tenant_id
                UNION ALL
                SELECT tenant_id AS t, 0 AS inp, SUM(net_cents) AS net FROM tenant_statements
                 WHERE state IN ('GENERATED', 'CONFIRMED', 'DISPUTED', 'PAYING') GROUP BY tenant_id) u
         GROUP BY t) x
 WHERE x.inp <> x.net;
SELECT 'L10d' AS id, 'MONEY' AS level, 'AVAILABLE 全部 = 未纳入结算单的 AVAILABLE（非 NET）' AS title, COUNT(*) AS fail_count,
       SUBSTRING_INDEX(GROUP_CONCAT(CONCAT('tenant#', y.t) SEPARATOR ','), ',', 20) AS samples
  FROM (SELECT e.tenant_id AS t,
               SUM(e.amount_cents) AS s,
               SUM(CASE WHEN l.id IS NULL AND e.component <> 'NET' THEN e.amount_cents ELSE 0 END) AS u
          FROM tenant_ledger_entries e LEFT JOIN tenant_statement_lines l ON l.entry_id = e.id
         WHERE e.bucket = 'AVAILABLE'
         GROUP BY e.tenant_id) y
 WHERE y.s <> y.u;

-- L12（钱）未付渠道单没有任何计提 / 解冻 / 冲销 / 少付分录（已付单被改回未付的兜底）
SELECT 'L12' AS id, 'MONEY' AS level, '未付渠道单无计提 / 冲销分录' AS title, COUNT(*) AS fail_count,
       SUBSTRING_INDEX(GROUP_CONCAT(o.order_no ORDER BY o.id SEPARATOR ','), ',', 20) AS samples
  FROM orders o
 WHERE o.tenant_id >= 2 AND o.pay_status = 'UNPAID'
   AND EXISTS (SELECT 1 FROM tenant_ledger_entries e
                WHERE e.order_id = o.id AND e.event_key REGEXP '^(sale|inv|short|rev|rel|relinv):');

-- L13（钱）状态与累计值一致。T（本单税费）取「订单结账时的税费」与「已付关联发票的税费」中较大者（与 reconcile.ts 的 basis 同向放宽，
-- 只会少报不会误报；精确口径以应用对账为准）
SELECT 'L13' AS id, 'MONEY' AS level, '退款累计值与状态一致' AS title, COUNT(*) AS fail_count,
       SUBSTRING_INDEX(GROUP_CONCAT(z.order_no ORDER BY z.id SEPARATOR ','), ',', 20) AS samples
  FROM (SELECT o.id, o.order_no, o.pay_status, o.delivery_status, o.quantity,
               ROUND(o.amount * 100) AS a,
               COALESCE(o.refunded_goods_cents, 0) AS rg,
               COALESCE(o.settle_refunded_cents, 0) AS rgs,
               COALESCE(o.refunded_tax_cents, 0) AS rt,
               COALESCE(o.refunded_qty, 0) AS rq,
               COALESCE(o.short_charged_cents, 0) AS shc,
               COALESCE(o.short_cents, 0) AS sh,
               GREATEST(ROUND(COALESCE(o.invoice_tax_fee, 0) * 100),
                        COALESCE((SELECT MAX(ROUND(i.tax_fee * 100)) FROM invoices i
                                   WHERE i.shop_order_id = o.id AND i.pay_status = 'PAID'), 0)) AS t
          FROM orders o
         WHERE o.tenant_id >= 2) z
 WHERE ((z.pay_status = 'REFUNDED' OR (z.pay_status = 'PAID' AND z.delivery_status = 'CANCELLED')) AND z.rg <> z.a)
    OR z.rgs > z.rg OR z.rg > z.a OR z.rt > z.t OR z.rq > z.quantity OR z.shc > z.sh;

-- A5（告警）已交付超过冻结期 + 1 天仍 ACCRUED：解冻 cron 可能停了
SELECT 'A5' AS id, 'ALERT' AS level, '过冻结期仍未解冻' AS title, COUNT(*) AS fail_count,
       SUBSTRING_INDEX(GROUP_CONCAT(o.order_no ORDER BY o.id SEPARATOR ','), ',', 20) AS samples
  FROM orders o
 WHERE o.tenant_id >= 2 AND o.settle_state = 'ACCRUED' AND o.delivery_status = 'DELIVERED'
   AND o.delivered_at IS NOT NULL AND o.settle_hold_days IS NOT NULL
   AND o.delivered_at + INTERVAL (o.settle_hold_days + 1) DAY < UTC_TIMESTAMP();

-- A6（告警）计提异常待补记
SELECT 'A6' AS id, 'ALERT' AS level, 'settle_state = MISSING' AS title, COUNT(*) AS fail_count,
       SUBSTRING_INDEX(GROUP_CONCAT(o.order_no ORDER BY o.id SEPARATOR ','), ',', 20) AS samples
  FROM orders o
 WHERE o.settle_state = 'MISSING';

-- A11（告警）渠道单的买家都有本站客户关系行
SELECT 'A11' AS id, 'ALERT' AS level, '渠道单都有客户关系' AS title, COUNT(*) AS fail_count,
       SUBSTRING_INDEX(GROUP_CONCAT(o.order_no ORDER BY o.id SEPARATOR ','), ',', 20) AS samples
  FROM orders o
 WHERE o.tenant_id >= 2
   AND NOT EXISTS (SELECT 1 FROM tenant_customers c WHERE c.tenant_id = o.tenant_id AND c.user_id = o.user_id);

COMMIT;
