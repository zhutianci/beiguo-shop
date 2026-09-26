#!/bin/sh
# =====================================================================================
# 渠道分站 · DDL 预览闸门（WP8，设计 5.9、W8-7；发布流程 A 段第 5 步）
#
#   sh scripts/ops/ddl-gate.sh /tmp/preview.sql            # 闸门 + 打印清单
#   sh scripts/ops/ddl-gate.sh /tmp/preview.sql --expect-p0 # 另外与本期（渠道分站 P0）的预期清单逐条比对
#   sh scripts/ops/ddl-gate.sh /tmp/preview.sql --expect-p2 # 渠道分站二期（docs/多渠道分销-二期改动.md）：只允许那 8 列
#
# 只用 POSIX sh + grep + awk + sort（不 import src/，服务器宿主机或任意容器里都能跑）。
#
# 【三道判定，任何一道不过就退出码 1，停手，别 db push】
#   ① 预览文件必须存在且字节数 > 0（0 字节 = migrate diff 命令本身失败了，不是「没有变更」；
#      真没有变更时 Prisma 输出的是一行 `-- This is an empty migration.`）；
#   ② 危险语句闸门：只匹配**语句开头**的 DROP / MODIFY / CHANGE / RENAME（含 ALTER TABLE x DROP|RENAME|MODIFY|CHANGE）。
#      不能对全文 grep CHANGE：新表列名 payee_changed_at 就含 CHANGE，每次误报会让运维习惯性忽略（设计 5.9）。
#      Prisma 的多子句 ALTER 会把 DROP COLUMN / MODIFY 写在续行开头，第一个分支正好覆盖；
#      CREATE TABLE 里的列定义以反引号开头，不会误中；
#   ③ --expect-p0：比对的是「出现了哪些表、哪些列、哪些索引、哪些外键」，不是只数 DROP。
#      多一条、少一条都算失败（多一条 = 有人往 schema 里塞了设计外的东西；少一条 = 库里已经有了，说明
#      这不是第一次发布——那就先确认 SHOW COLUMNS 阳性对照在，再用不带 --expect-p0 的模式只过闸门）。
#      外键 2 条（tenant_customers.user_id → users、tenant_ledger_entries.order_id → orders，ON DELETE RESTRICT）
#      是主会话 D1 已接受的偏差，写在预期清单里。
# =====================================================================================
set -u

PREVIEW="${1:-}"
MODE="${2:-}"

if [ -z "$PREVIEW" ]; then
  echo "用法：sh scripts/ops/ddl-gate.sh <preview.sql> [--expect-p0 | --expect-p2]" >&2
  exit 2
fi
if [ ! -s "$PREVIEW" ]; then
  echo "❌ 预览文件不存在或为 0 字节：$PREVIEW（migrate diff 失败了，不是没有变更）"
  exit 1
fi

# ② 危险语句闸门（设计 5.9 原样）
DANGER=$(grep -Eic '^\s*(DROP|MODIFY|CHANGE|RENAME)\b|^\s*ALTER\s+TABLE\s+\S+\s+(DROP|RENAME|MODIFY|CHANGE)\b' "$PREVIEW")
if [ "$DANGER" != "0" ]; then
  echo "❌ 危险语句 $DANGER 条（DROP / MODIFY / CHANGE / RENAME），停手："
  grep -Ein '^\s*(DROP|MODIFY|CHANGE|RENAME)\b|^\s*ALTER\s+TABLE\s+\S+\s+(DROP|RENAME|MODIFY|CHANGE)\b' "$PREVIEW"
  exit 1
fi
echo "✓ 危险语句 0 条"

# 把预览归一成一行一项的清单（与 Prisma 输出格式对齐；认不出的语句记成 UNKNOWN，比对时必然不一致）
inventory() {
  awk '
    function strip(s) { gsub(/`/, "", s); return s }
    /^[ \t]*--/ || /^[ \t]*$/ { next }
    /^ALTER TABLE/ {
      t = strip($3)
      if ($0 ~ /ADD CONSTRAINT/) {
        match($0, /ADD CONSTRAINT `[^`]+`/); fk = strip(substr($0, RSTART + 15, RLENGTH - 15))
        match($0, /FOREIGN KEY \(`[^`]+`\)/); col = strip(substr($0, RSTART + 13, RLENGTH - 14))
        match($0, /REFERENCES `[^`]+`/); ref = strip(substr($0, RSTART + 11, RLENGTH - 11))
        del = ($0 ~ /ON DELETE RESTRICT/) ? "RESTRICT" : "OTHER"
        print "FK " t "." col " -> " ref " " del " (" fk ")"
        next
      }
      alt = t
    }
    /ADD COLUMN/ {
      match($0, /ADD COLUMN `[^`]+`/); c = strip(substr($0, RSTART + 11, RLENGTH - 11))
      print "COLUMN " alt "." c
      next
    }
    /^CREATE TABLE/ { print "TABLE " strip($3); intable = 1; next }
    intable && /^\)/ { intable = 0; next }
    intable { next }
    /^CREATE (UNIQUE )?INDEX/ {
      u = ($2 == "UNIQUE") ? "UNIQUE " : ""
      n = (u == "") ? $3 : $4; tb = (u == "") ? $5 : $6
      sub(/\(.*/, "", tb)
      print "INDEX " u strip(tb) "." strip(n)
      next
    }
    /^ALTER TABLE|^[ \t]+ADD/ { next }
    { print "UNKNOWN " $0 }
  ' "$PREVIEW" | sort
}

INV=$(inventory)
echo "—— 预览清单（$(printf '%s\n' "$INV" | grep -c . ) 项）——"
printf '%s\n' "$INV" | awk 'NF { k = $1; n[k]++ } END { for (k in n) printf "  %s × %d\n", k, n[k] }' | sort

if [ "$MODE" != "--expect-p0" ] && [ "$MODE" != "--expect-p2" ]; then
  echo "✅ 闸门通过（未做清单比对；首次发布渠道分站请加 --expect-p0，二期发布加 --expect-p2）"
  exit 0
fi

# ③' 二期预期清单（docs/多渠道分销-二期改动.md 3.2、4.1：tenants 7 列、tenant_notices 1 列，共 8 列，只新增、可空或带默认值；
#     契约第 5 节写的「Tenant 8 列、共 9 列」是计数笔误——3.2 列了 3 列、4.1 列了 4 列，schema 与本清单一致；
#     不建表、不加索引与外键）。多一条 = 有人往 schema 里塞了契约外的东西；少一条 = 库里已经有了（不是第一次发二期）
EXPECT_P2=$(cat <<'EOF' | sort
COLUMN tenant_notices.emailed_at
COLUMN tenants.notice_email
COLUMN tenants.notice_email_on
COLUMN tenants.notice_wecom_on
COLUMN tenants.support_email
COLUMN tenants.support_hours
COLUMN tenants.support_qr_url
COLUMN tenants.support_wechat
EOF
)

# ③ 本期预期清单（从基线 24f5b0f 的 schema 到渠道分站 P0 的 schema，设计 5.9 + 主会话 D1 的 2 条外键）
EXPECT=$(cat <<'EOF' | sort
TABLE tenants
TABLE tenant_domains
TABLE tenant_members
TABLE tenant_invites
TABLE tenant_listings
TABLE tenant_customers
TABLE tenant_ledger_entries
TABLE tenant_statements
TABLE tenant_statement_lines
TABLE tenant_payouts
TABLE tenant_after_sales
TABLE tenant_notices
TABLE audit_events
COLUMN orders.buyer_remark
COLUMN orders.escalated_at
COLUMN orders.fee_rate_bp
COLUMN orders.inv_share_state
COLUMN orders.invoice_share_rate_bp
COLUMN orders.listing_id
COLUMN orders.main_price_at_order
COLUMN orders.refunded_goods_cents
COLUMN orders.refunded_qty
COLUMN orders.refunded_tax_cents
COLUMN orders.settle_bearer
COLUMN orders.settle_exclude_reason
COLUMN orders.settle_hold_days
COLUMN orders.settle_loss_cents
COLUMN orders.settle_refunded_cents
COLUMN orders.settle_state
COLUMN orders.settle_version
COLUMN orders.short_cents
COLUMN orders.short_charged_cents
COLUMN orders.supply_cents
COLUMN orders.supply_unit_price
COLUMN orders.tenant_id
COLUMN order_messages.read_by_tenant
COLUMN order_messages.sender_role
COLUMN order_messages.sender_user_id
COLUMN users.registered_tenant_id
COLUMN invoices.shop_order_id
COLUMN invoices.tenant_id
COLUMN receipts.shop_order_id
COLUMN receipts.tenant_id
COLUMN external_orders.tenant_id
INDEX external_orders.external_orders_tenant_id_claude_account_idx
INDEX invoices.invoices_tenant_id_status_idx
INDEX invoices.invoices_shop_order_id_idx
INDEX orders.orders_tenant_id_created_at_idx
INDEX orders.orders_tenant_id_pay_status_created_at_idx
INDEX orders.orders_tenant_id_user_id_idx
INDEX orders.orders_settle_state_idx
INDEX receipts.receipts_tenant_id_created_at_idx
INDEX receipts.receipts_shop_order_id_idx
FK tenant_customers.user_id -> users RESTRICT (tenant_customers_user_id_fkey)
FK tenant_ledger_entries.order_id -> orders RESTRICT (tenant_ledger_entries_order_id_fkey)
EOF
)

if [ "$MODE" = "--expect-p2" ]; then
  EXPECT="$EXPECT_P2"
  SUMMARY="二期 8 列：tenants 7 列、tenant_notices 1 列"
else
  SUMMARY="13 张表、31 列、9 个索引、2 条外键"
fi

TMPD="${TMPDIR:-/tmp}/ddl-gate.$$"
mkdir -p "$TMPD"
printf '%s\n' "$EXPECT" > "$TMPD/expect"
printf '%s\n' "$INV" > "$TMPD/actual"
EXTRA=$(comm -13 "$TMPD/expect" "$TMPD/actual")
MISSING=$(comm -23 "$TMPD/expect" "$TMPD/actual")
rm -rf "$TMPD"
if [ -n "$EXTRA" ] || [ -n "$MISSING" ]; then
  [ -n "$EXTRA" ] && { echo "❌ 预览里有、预期清单里没有（设计 5.9 外的变更）："; printf '%s\n' "$EXTRA" | sed 's/^/    + /'; }
  [ -n "$MISSING" ] && { echo "❌ 预期清单里有、预览里没有（库里已存在？不是首次发布就别用 $MODE）："; printf '%s\n' "$MISSING" | sed 's/^/    - /'; }
  exit 1
fi
echo "✅ 闸门通过，且与本期预期清单逐条一致（$SUMMARY）"
