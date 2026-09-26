-- =====================================================================================
-- 渠道分站 · 种子数据（WP8，设计 5.10）。只用 SQL 的运维脚本：不 import src/，可重复执行。
--
-- 什么时候跑：发布流程 A 段第 7 步——DDL（db push）成功、阳性对照通过之后，换镜像之前。
-- 怎么跑（服务器上，库在 beiguo-db 容器里）：
--   docker exec -i beiguo-db sh -c 'mysql --default-character-set=utf8mb4 -uroot -p"$MYSQL_ROOT_PASSWORD" beiguo_shop' \
--     < scripts/sql/tenant-seed.sql | tee /tmp/tenant-seed.out
--   grep -c FAIL /tmp/tenant-seed.out     # 必须是 0；不是 0 就停手，别往下发
--
-- 为什么可重复：两条 INSERT 都是 ON DUPLICATE KEY UPDATE 空操作（id = id / host = host），
-- 第二次执行行数不变、已有值不被覆盖（站长事后在后台改过 lulu 的费率 / 冻结期，重跑种子不会把它改回去）。
--
-- 为什么 id=1 必须显式写：主站就是租户 1，历史订单靠列默认值 tenant_id=1 自动归主站（设计 5.0 第 4 条）。
-- 主站的结算参数写 0：平台分支从不读它们（店面解析对主站 Host 走静态白名单、不查这张表）。
-- lulu 首月 hold_days=15；首月过后由超管在后台改成 7（只影响之后的新订单，下单时快照）。
-- lulu 以 DRAFT 状态落库：G1 打开应用开关之后前台仍 404（预览账号除外），G4 验收通过才改 ACTIVE。
--
-- 时间一律 UTC_TIMESTAMP(3)：Prisma 按 UTC 读写 DATETIME，用 NOW(3) 时库的会话时区一旦不是 UTC，
-- 建档时间就会偏 8 小时（后台显示错；下面「渠道订单晚于建档」的阳性对照也会误报）。
--
-- 【每次发布都跑、G 之后也要全 OK】（终审第 2 轮）阳性对照里不能有「只在首次发布成立」的判据：
-- 原来的「tenant_id <> 1 的订单为 0」在 lulu 开业接单之后必然 FAIL，A5 会让操作者在每次发布时停手。
-- 改成对任何时点都成立的不变式：tenant_id <> 1 的订单必须挂在已登记的 CHANNEL 租户上、且下单时间不早于该租户建档——
-- 首次发布时渠道租户刚建档，任何一条存量订单被误标成渠道单都会早于建档时间而 FAIL，防误标的作用不变。
-- =====================================================================================

SET NAMES utf8mb4;

INSERT INTO tenants (id, code, kind, name, status, origin, fee_rate_bp, invoice_share_rate_bp, hold_days,
                     min_payout_cents, request_interval_days, payout_hold, pending_order_cap, max_order_qty,
                     require_partner_invoice, created_at, updated_at)
VALUES
 (1, 'main', 'PLATFORM', '主站', 'ACTIVE', 'https://bigolab.com', 0, 0, 0, 0, 0, 0, 1000000, 999, 0, UTC_TIMESTAMP(3), UTC_TIMESTAMP(3)),
 (2, 'lulu', 'CHANNEL',  'lulu', 'DRAFT',  'https://lulu.bigolab.com', 150, 200, 15, 10000, 7, 0, 30, 10, 1, UTC_TIMESTAMP(3), UTC_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE id = id;

INSERT INTO tenant_domains (tenant_id, host, is_primary, status, created_at)
VALUES (2, 'lulu.bigolab.com', 1, 1, UTC_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE host = host;

-- -------------------------------------------------------------------------------------
-- 阳性对照：每一行输出 OK / FAIL。任何一行 FAIL 就停手（grep -c FAIL 必须为 0）。
-- -------------------------------------------------------------------------------------
SELECT 'tenants 恰好含 main(1, PLATFORM) 与 lulu(2, CHANNEL)' AS `check`,
       IF(SUM(id = 1 AND code = 'main' AND kind = 'PLATFORM') = 1 AND SUM(id = 2 AND code = 'lulu' AND kind = 'CHANNEL') = 1, 'OK', 'FAIL') AS result
  FROM tenants;
SELECT 'main 的 origin 是 https://bigolab.com' AS `check`, IF(COUNT(*) = 1, 'OK', 'FAIL') AS result
  FROM tenants WHERE id = 1 AND origin = 'https://bigolab.com' AND status = 'ACTIVE';
SELECT 'lulu.bigolab.com 指向租户 2 且启用' AS `check`, IF(COUNT(*) = 1, 'OK', 'FAIL') AS result
  FROM tenant_domains WHERE host = 'lulu.bigolab.com' AND tenant_id = 2 AND status = 1;
SELECT '主站域名没有写进 tenant_domains（主站走静态白名单）' AS `check`, IF(COUNT(*) = 0, 'OK', 'FAIL') AS result
  FROM tenant_domains WHERE host IN ('bigolab.com', 'www.bigolab.com', 'localhost', '127.0.0.1', 'app');
SELECT '渠道订单都挂在已登记渠道且晚于其建档（存量订单全部归主站）' AS `check`, IF(COUNT(*) = 0, 'OK', 'FAIL') AS result
  FROM orders o LEFT JOIN tenants t ON t.id = o.tenant_id
 WHERE o.tenant_id <> 1 AND (t.id IS NULL OR t.kind <> 'CHANNEL' OR o.created_at < t.created_at);
SELECT '对照：orders 表确实有数据（防连错库）' AS `check`, IF(COUNT(*) > 0, 'OK', 'FAIL') AS result, COUNT(*) AS orders_total
  FROM orders;

-- 供人工核对的原始行（不参与判定）。首次发布时 channel_orders 为 0；G 之后渠道接了单就不是 0，属正常
SELECT COUNT(*) AS orders_total, SUM(tenant_id = 1) AS main_orders, SUM(tenant_id <> 1) AS channel_orders FROM orders;
SELECT id, code, kind, status, origin, fee_rate_bp, invoice_share_rate_bp, hold_days, min_payout_cents FROM tenants ORDER BY id;
SELECT host, tenant_id, is_primary, status FROM tenant_domains ORDER BY id;
