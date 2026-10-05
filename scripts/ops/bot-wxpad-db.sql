-- =====================================================================================
-- 微信机器人 · 协议服务（WeChatPadPro）的专用库与专用账号（docs/微信机器人-设计.md §11.4）。可以重复执行。
--
-- 协议服务是闭源程序，按不可信处理：它只拿到 wxpad 这一个库的权限，碰不到 beiguo_shop。
-- 不另起 MySQL 容器（省 200MB 以上内存），也不改 db 服务的任何配置（一改 compose 就会重建数据库容器）。
--
-- 密码不写进本文件：__WXPAD_DB_PASSWORD__ 是占位符，执行时用 wxpad.env 里的 BOT_WXPAD_DB_PASSWORD 替换。
-- 密码请用 openssl rand -hex 24 生成（只含 0-9a-f，sed 替换不会出错）：
--
--   set -a; . ./wxpad.env; set +a
--   sed "s/__WXPAD_DB_PASSWORD__/$BOT_WXPAD_DB_PASSWORD/g" scripts/ops/bot-wxpad-db.sql \
--     | docker exec -i beiguo-db sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" --default-character-set=utf8mb4'
--
-- db 服务的启动参数是 --default-authentication-plugin=mysql_native_password，新账号自动用它，Go 驱动直接能连。
-- 数据库没有映射端口，'%' 实际只覆盖 Docker 内网。
-- =====================================================================================

CREATE DATABASE IF NOT EXISTS wxpad CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'wxpad'@'%' IDENTIFIED BY '__WXPAD_DB_PASSWORD__';
-- 已存在时同步密码与连接上限（重复执行 = 改密码）
ALTER USER 'wxpad'@'%' IDENTIFIED BY '__WXPAD_DB_PASSWORD__' WITH MAX_USER_CONNECTIONS 10;

-- 只授权 wxpad.*；协议服务启动时自动建表（GORM AutoMigrate），所以要建表 / 改表 / 建索引的权限。
-- 不给 GRANT OPTION、FILE、PROCESS、SUPER 等任何全局权限
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, DROP, REFERENCES, CREATE TEMPORARY TABLES, LOCK TABLES
   ON wxpad.* TO 'wxpad'@'%';

-- 核对：应当只有 USAGE ON *.* 与 wxpad.* 两行
SHOW GRANTS FOR 'wxpad'@'%';
SELECT user, host, plugin, max_user_connections FROM mysql.user WHERE user = 'wxpad';
