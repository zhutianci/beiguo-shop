-- =====================================================================================
-- 微信机器人 · 出厂种子（docs/微信机器人-设计.md §8.2、§8.7、§13）。可以重复执行（已存在就不动）。
--
--   mysql -uroot -p"$MYSQL_ROOT_PASSWORD" --default-character-set=utf8mb4 beiguo_shop < scripts/ops/bot-seed.sql
--
-- 做三件事：
--   ① 提卡专用账号（§8.7）：昵称「机器人提卡」，邮箱 / 手机为空，password_hash 是一个不可能通过 bcrypt 校验的标记值
--      （'!bot-issue-disabled'，bcrypt.compare 恒为 false = 无法登录），status 0（禁用）。全仓唯一的建号入口是注册接口，
--      代码里不新增 user.create，所以用种子建。
--   ② bot_config：没有这一行时写一行最小配置，只带 issueUserId；已有就只把 issueUserId 补上（其余字段由应用按出厂值补齐）。
--   ③ 给自动发货商品预填货号 P<商品id>（§8.2，站长可在后台改成好记的）。UPDATE IGNORE：万一某个 P<id> 已被手工占用就跳过那一行。
-- 运维脚本不 import src/（纯 SQL）。
-- =====================================================================================

-- ① 提卡专用账号
INSERT INTO users (password_hash, nickname, role, status, registered_tenant_id, created_at, updated_at)
SELECT '!bot-issue-disabled', '机器人提卡', 'USER', 0, 1, UTC_TIMESTAMP(3), UTC_TIMESTAMP(3)
  FROM DUAL
 WHERE NOT EXISTS (SELECT 1 FROM users WHERE password_hash = '!bot-issue-disabled');

SET @bot_issue_user := (SELECT id FROM users WHERE password_hash = '!bot-issue-disabled' ORDER BY id LIMIT 1);

-- ② bot_config：没有就建，有就补 issueUserId（不覆盖其它字段）
INSERT INTO settings (`key`, value, created_at, updated_at)
SELECT 'bot_config', JSON_OBJECT('version', 1, 'issueUserId', @bot_issue_user), UTC_TIMESTAMP(3), UTC_TIMESTAMP(3)
  FROM DUAL
 WHERE NOT EXISTS (SELECT 1 FROM settings WHERE `key` = 'bot_config');

-- 没有这个键（JSON_TYPE 得 SQL NULL）或值是 JSON null（'NULL'）才补；不是合法 JSON 的行不碰（CASE 保证不对坏 JSON 调 JSON_EXTRACT）
UPDATE settings
   SET value = JSON_SET(value, '$.issueUserId', @bot_issue_user), updated_at = UTC_TIMESTAMP(3)
 WHERE `key` = 'bot_config'
   AND @bot_issue_user IS NOT NULL
   AND COALESCE(CASE WHEN JSON_VALID(value) THEN JSON_TYPE(JSON_EXTRACT(value, '$.issueUserId')) ELSE 'INVALID' END, 'NULL') = 'NULL';

-- ③ 自动发货商品预填货号
UPDATE IGNORE products
   SET bot_code = CONCAT('P', id)
 WHERE delivery_type = 'AUTO'
   AND bot_code IS NULL;

-- 核对
SELECT id, nickname, status, registered_tenant_id FROM users WHERE password_hash = '!bot-issue-disabled';
SELECT `key`, value FROM settings WHERE `key` = 'bot_config';
SELECT id, name, bot_code FROM products WHERE delivery_type = 'AUTO' ORDER BY id;
