-- =====================================================================================
-- 短信接码 · S2：「短信接码」系统载体商品（docs/短信接码-设计.md §5.4、D14）。可以重复执行（已存在就不动）。
--
--   mysql -uroot -p"$MYSQL_ROOT_PASSWORD" --default-character-set=utf8mb4 beiguo_shop < scripts/ops/jiema-s2-seed.sql
--
-- 接码单挂在这一行商品上：下架（status=0）、价格 0、delivery_type='SMS_POOL'。所有对外列表都按 status=1 过滤，下架商品天然不会外泄（fail-closed）。
-- 程序按 delivery_type='SMS_POOL' 找它，要求**恰好 1 行且下架**，否则接码新单停售并推 sms.alert（在途单照常推进）。
-- 商品后台对这一行：不能上架、不能改价、不能改发货方式、不能删除（§6.6 第 19 条，B1 已做）。
-- 系统分类「系统（勿删）」与 B1 的「余额充值」载体共用（按名字 NOT EXISTS，不会重复建）。
-- 时间列写 UTC（与 Prisma 写入口径一致）。运维脚本不 import src/（纯 SQL）。
-- =====================================================================================

INSERT INTO categories (name, sort_order, status, created_at, updated_at)
SELECT '系统（勿删）', 9999, 0, UTC_TIMESTAMP(3), UTC_TIMESTAMP(3)
  FROM DUAL
 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '系统（勿删）');

INSERT INTO products (category_id, name, description, price, stock, sales, sort_order, status, delivery_type, created_at, updated_at)
SELECT c.id, '短信接码', '系统载体商品：短信接码订单挂在这里。勿上架、勿改价、勿删', 0.00, -1, 0, 9999, 0, 'SMS_POOL', UTC_TIMESTAMP(3), UTC_TIMESTAMP(3)
  FROM categories c
 WHERE c.name = '系统（勿删）'
   AND NOT EXISTS (SELECT 1 FROM products WHERE delivery_type = 'SMS_POOL')
 ORDER BY c.id
 LIMIT 1;

-- 核对：SMS_POOL 载体恰好 1 行，status=0、price=0.00
SELECT id, category_id, name, price, status, delivery_type FROM products WHERE delivery_type = 'SMS_POOL';
SELECT COUNT(*) AS sms_pool_carriers FROM products WHERE delivery_type = 'SMS_POOL';
