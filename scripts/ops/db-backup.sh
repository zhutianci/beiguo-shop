#!/bin/sh
# =====================================================================================
# 贝果科技 · 数据库每日备份（2026-10-25 第三轮加固，docs/安全-第三轮加固-1025.md）
#
# 为什么：到 10-25 为止生产库**没有任何备份**（云盘快照 0 个、库内导出只有几次手工的局部导出）。
# 被拖库后删数据、误操作、勒索、磁盘损坏，任何一种都是全站订单 / 余额 / 卡密一起归零。
#
# 做法：每天一次 mysqldump --single-transaction（InnoDB 一致性快照，不锁表、不停站），gzip 后放
#   /opt/beiguo/backups/db/beiguo_shop-YYYYmmdd-HHMM.sql.gz，权限 600（只有 root 可读：里面有密码哈希、加密后的卡密）。
#   保留 14 天；同时保留每月 1 号那份 6 个月。写完校验 gzip 完整性与文件末尾的「Dump completed」，失败退出码非 0。
#   这只防「数据被改坏 / 删掉」；防「整台机器没了」要靠云盘快照（站长在阿里云控制台开，或让我用 API 开）。
#
# 安装（宿主机 root crontab，每天北京时间 04:40，避开 04:17 的日志清理）：
#   40 4 * * * sh /opt/beiguo/beiguo-shop/scripts/ops/db-backup.sh >> /var/log/beiguo-db-backup.log 2>&1
# 恢复（先在别的库演练，绝不要直接覆盖生产库）：
#   gunzip -c <文件> | docker exec -i beiguo-db sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot <目标库>'
# =====================================================================================
set -eu
DIR="${BACKUP_DIR:-/opt/beiguo/backups/db}"
KEEP_DAYS="${KEEP_DAYS:-14}"
KEEP_MONTHLY_DAYS="${KEEP_MONTHLY_DAYS:-183}"
CONTAINER="${DB_CONTAINER:-beiguo-db}"

umask 077
mkdir -p "$DIR"
chmod 700 "$DIR"
TS=$(date '+%Y%m%d-%H%M')
OUT="$DIR/beiguo_shop-$TS.sql.gz"
TMP="$OUT.part"

echo "[$(date '+%F %T')] backup start -> $OUT"
# 密码只在容器内部展开，不出现在宿主机进程列表与日志里
docker exec "$CONTAINER" sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" exec mysqldump -uroot --single-transaction --quick --routines --triggers --events --hex-blob --default-character-set=utf8mb4 --set-gtid-purged=OFF --databases "$MYSQL_DATABASE"' </dev/null | gzip -6 > "$TMP"

# 校验：gzip 完整、而且是 mysqldump 正常写完的（最后一行是 Dump completed）
gzip -t "$TMP"
if ! gunzip -c "$TMP" | tail -n 1 | grep -q 'Dump completed'; then
  echo "[$(date '+%F %T')] ERROR: dump 不完整，保留 $TMP 供排查"
  exit 1
fi
mv "$TMP" "$OUT"
chmod 600 "$OUT"
echo "[$(date '+%F %T')] backup ok size=$(du -h "$OUT" | cut -f1)"

# 轮转：14 天内的全留；更早的只留每月 1 号的那份（保留约半年）
find "$DIR" -name 'beiguo_shop-*.sql.gz' -mtime +"$KEEP_DAYS" ! -name 'beiguo_shop-??????01-*.sql.gz' -delete
find "$DIR" -name 'beiguo_shop-??????01-*.sql.gz' -mtime +"$KEEP_MONTHLY_DAYS" -delete
find "$DIR" -name '*.part' -mtime +2 -delete
echo "[$(date '+%F %T')] kept: $(ls "$DIR" | wc -l) files, $(du -sh "$DIR" | cut -f1)"
