#!/bin/sh
# =====================================================================================
# 渠道分站 · DDL 预览闸门（WP8，设计 5.9、W8-7；发布流程 A 段第 5 步）
#
#   sh scripts/ops/ddl-gate.sh /tmp/preview.sql            # 闸门 + 打印清单
#   sh scripts/ops/ddl-gate.sh /tmp/preview.sql --expect-p0 # 另外与本期（渠道分站 P0）的预期清单逐条比对
#   sh scripts/ops/ddl-gate.sh /tmp/preview.sql --expect-p2 # 渠道分站二期（docs/多渠道分销-二期改动.md）：只允许那 8 列
#   sh scripts/ops/ddl-gate.sh /tmp/preview.sql --expect-wallet-b0 # 短信接码 · B0 余额底座（docs/短信接码-设计.md §5.5、§5.6）
#   sh scripts/ops/ddl-gate.sh /tmp/preview.sql --expect-jiema-s1  # 短信接码 · S1 目录与定价：5 张新表（§5.2、§5.5）
#   sh scripts/ops/ddl-gate.sh /tmp/preview.sql --expect-jiema-s2  # 短信接码 · S2 下单与状态机：4 张新表 sms_orders / sms_attempts / sms_messages / sms_events
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
  echo "用法：sh scripts/ops/ddl-gate.sh <preview.sql> [--expect-p0 | --expect-p2 | --expect-wallet-b0 | --expect-jiema-s1 | --expect-jiema-s2]" >&2
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

if [ "$MODE" != "--expect-p0" ] && [ "$MODE" != "--expect-p2" ] && [ "$MODE" != "--expect-wallet-b0" ] && [ "$MODE" != "--expect-jiema-s1" ] && [ "$MODE" != "--expect-jiema-s2" ]; then
  echo "✅ 闸门通过（未做清单比对；首次发布渠道分站请加 --expect-p0，二期发布加 --expect-p2，钱包 B0 加 --expect-wallet-b0，接码 S1 加 --expect-jiema-s1，接码 S2 加 --expect-jiema-s2）"
  exit 0
fi

# ③'''' 短信接码 · S2 下单、状态机、成本核算（docs/短信接码-设计.md §5.2、§5.5）：只建 4 张新表，不碰任何旧表（balance_logs 的改动已在 B0）。
#        索引与默认值写在 CREATE TABLE 里，下面 jiema_s2_details 逐字核对
EXPECT_JIEMA_S2=$(cat <<'EOF' | sort
TABLE sms_attempts
TABLE sms_events
TABLE sms_messages
TABLE sms_orders
EOF
)

# S2 另外逐字核对：
#   · sms_orders：order_id 唯一、(user_id, client_token) 唯一（幂等）、4 个索引；state 默认 PENDING_PAY、refund_state 默认 NONE、
#     acquire_tries 默认 3、long_wait_ok / cost_final 默认 false、fail_count 默认 0；v1.1 新增的 long_wait_ok / fail_count / manual_at / alerted_at 都在；
#   · sms_attempts：activation_id 唯一、(sms_order_id, seq) 唯一、3 个索引；upstream_created_at（v1.1）、dispatched_at / empty_scans（S2a 实施偏差）都在；
#   · sms_messages：(attempt_id, dedupe_key) 唯一；sms_events：(sms_order_id, id)、(type, created_at) 两个索引。
jiema_s2_details() {
  bad=0
  need() {
    if ! grep -Eq "$1" "$PREVIEW"; then
      echo "❌ 预览里缺少：$2"
      bad=1
    fi
  }
  need 'UNIQUE INDEX `sms_orders_order_id_key`\(`order_id`\)' 'sms_orders.order_id 唯一索引'
  need 'UNIQUE INDEX `sms_orders_user_id_client_token_key`\(`user_id`, `client_token`\)' 'sms_orders (user_id, client_token) 唯一索引'
  need 'INDEX `sms_orders_state_updated_at_idx`\(`state`, `updated_at`\)' 'sms_orders (state, updated_at) 索引'
  need 'INDEX `sms_orders_user_id_created_at_idx`\(`user_id`, `created_at`\)' 'sms_orders (user_id, created_at) 索引'
  need 'INDEX `sms_orders_service_country_created_at_idx`\(`service`, `country`, `created_at`\)' 'sms_orders (service, country, created_at) 索引'
  need 'INDEX `sms_orders_cost_at_idx`\(`cost_at`\)' 'sms_orders (cost_at) 索引'
  need "\`state\` VARCHAR\(16\) NOT NULL DEFAULT 'PENDING_PAY'" 'sms_orders.state 默认 PENDING_PAY'
  need "\`refund_state\` VARCHAR\(8\) NOT NULL DEFAULT 'NONE'" 'sms_orders.refund_state 默认 NONE'
  need '`acquire_tries` INTEGER NOT NULL DEFAULT 3' 'sms_orders.acquire_tries 默认 3'
  need '`long_wait_ok` BOOLEAN NOT NULL DEFAULT false' 'sms_orders.long_wait_ok 默认 false'
  need '`cost_final` BOOLEAN NOT NULL DEFAULT false' 'sms_orders.cost_final 默认 false'
  need '`fail_count` INTEGER NOT NULL DEFAULT 0' 'sms_orders.fail_count 默认 0'
  need '`manual_at` DATETIME\(3\) NULL' 'sms_orders.manual_at'
  need '`alerted_at` DATETIME\(3\) NULL' 'sms_orders.alerted_at'
  need 'UNIQUE INDEX `sms_attempts_activation_id_key`\(`activation_id`\)' 'sms_attempts.activation_id 唯一索引'
  need 'UNIQUE INDEX `sms_attempts_sms_order_id_seq_key`\(`sms_order_id`, `seq`\)' 'sms_attempts (sms_order_id, seq) 唯一索引'
  need 'INDEX `sms_attempts_sms_order_id_idx`\(`sms_order_id`\)' 'sms_attempts (sms_order_id) 索引'
  need 'INDEX `sms_attempts_state_next_check_at_idx`\(`state`, `next_check_at`\)' 'sms_attempts (state, next_check_at) 索引'
  need 'INDEX `sms_attempts_service_country_requested_at_idx`\(`service`, `country`, `requested_at`\)' 'sms_attempts (service, country, requested_at) 索引'
  need '`upstream_created_at` DATETIME\(3\) NULL' 'sms_attempts.upstream_created_at'
  need '`dispatched_at` DATETIME\(3\) NULL' 'sms_attempts.dispatched_at'
  need '`empty_scans` INTEGER NOT NULL DEFAULT 0' 'sms_attempts.empty_scans 默认 0'
  need 'UNIQUE INDEX `sms_messages_attempt_id_dedupe_key_key`\(`attempt_id`, `dedupe_key`\)' 'sms_messages (attempt_id, dedupe_key) 唯一索引'
  need 'INDEX `sms_events_sms_order_id_id_idx`\(`sms_order_id`, `id`\)' 'sms_events (sms_order_id, id) 索引'
  need 'INDEX `sms_events_type_created_at_idx`\(`type`, `created_at`\)' 'sms_events (type, created_at) 索引'
  return $bad
}

# ③''' 短信接码 · S1 目录与定价（docs/短信接码-设计.md §5.2、§5.5）：只建 5 张新表，不碰任何旧表。
#       新表里的唯一 / 普通索引写在 CREATE TABLE 里（清单只认出 TABLE 一行），下面 jiema_s1_details 逐字核对
EXPECT_JIEMA_S1=$(cat <<'EOF' | sort
TABLE sms_countries
TABLE sms_holds
TABLE sms_offer_cache
TABLE sms_price_rules
TABLE sms_services
EOF
)

# S1 另外逐字核对（清单只比「有哪些项」，看不到 CREATE TABLE 里的索引与默认值）：
#   · sms_offer_cache (service, kind) 唯一（每个服务每层一行，单飞 CAS 靠它）、data 是 MEDIUMTEXT（全量 offers 一行可达 40KB）；
#   · sms_price_rules.scope_key 唯一；sms_services (status, pop_rank) 索引；
#   · 两张目录表 status 默认 'ON'（出厂一个都不下架，D25）、pop_rank 默认 9999、sort_boost 默认 0、disabled 默认 false；
#   · sms_holds 主键是 key（'global' / 'svc:tg' / 'combo:tg:6' …）。
jiema_s1_details() {
  bad=0
  need() {
    if ! grep -Eq "$1" "$PREVIEW"; then
      echo "❌ 预览里缺少：$2"
      bad=1
    fi
  }
  need 'UNIQUE INDEX `sms_offer_cache_service_kind_key`\(`service`, `kind`\)' 'sms_offer_cache (service, kind) 唯一索引'
  need '`data` MEDIUMTEXT NOT NULL' 'sms_offer_cache.data MEDIUMTEXT NOT NULL'
  need 'UNIQUE INDEX `sms_price_rules_scope_key_key`\(`scope_key`\)' 'sms_price_rules.scope_key 唯一索引'
  need 'INDEX `sms_services_status_pop_rank_idx`\(`status`, `pop_rank`\)' 'sms_services (status, pop_rank) 索引'
  need '`pop_rank` INTEGER NOT NULL DEFAULT 9999' 'sms_services.pop_rank 默认 9999'
  need '`sort_boost` INTEGER NOT NULL DEFAULT 0' 'sms_countries.sort_boost 默认 0'
  need '`disabled` BOOLEAN NOT NULL DEFAULT false' 'sms_price_rules.disabled 默认 false'
  need 'PRIMARY KEY \(`key`\)' 'sms_holds 主键 key'
  on=$(grep -Ec "\`status\` VARCHAR\(8\) NOT NULL DEFAULT 'ON'" "$PREVIEW")
  if [ "$on" != "2" ]; then
    echo "❌ sms_services / sms_countries 的 status 默认 'ON' 应当恰好 2 处，实际 $on 处"
    bad=1
  fi
  return $bad
}

# ③'' 短信接码 · B0 余额底座（docs/短信接码-设计.md §5.5、§5.6）：users 加 1 列、balance_logs 加 3 列 + biz_key 唯一索引、新表 balance_holds。
#      只新增、可空或带默认值；旧镜像跑在新库上不受影响（旧代码写流水时新列取默认值）
EXPECT_WALLET_B0=$(cat <<'EOF' | sort
COLUMN balance_logs.biz_key
COLUMN balance_logs.topup_after_cents
COLUMN balance_logs.topup_delta_cents
COLUMN users.topup_cents
INDEX UNIQUE balance_logs.balance_logs_biz_key_key
TABLE balance_holds
EOF
)

# B0 另外逐字核对列定义与新表里的索引（清单只比「有哪些项」，看不到默认值和 CREATE TABLE 里的索引）：
#   · topup_cents / topup_delta_cents 必须 INTEGER NOT NULL DEFAULT 0（历史零回填、恒等式对历史天然成立，靠的就是这个默认值）；
#   · topup_after_cents INTEGER NULL、biz_key VARCHAR(64) NULL（历史行为 NULL，唯一索引允许多个 NULL）；
#   · balance_holds 的 order_id 唯一（一单最多一条预扣）+ (state, held_at)、(user_id, created_at) 两个索引。
wallet_b0_details() {
  bad=0
  need() {
    if ! grep -Eq "$1" "$PREVIEW"; then
      echo "❌ 预览里缺少：$2"
      bad=1
    fi
  }
  need '`topup_cents` INTEGER NOT NULL DEFAULT 0' 'users.topup_cents INTEGER NOT NULL DEFAULT 0'
  need '`topup_delta_cents` INTEGER NOT NULL DEFAULT 0' 'balance_logs.topup_delta_cents INTEGER NOT NULL DEFAULT 0'
  need '`topup_after_cents` INTEGER NULL' 'balance_logs.topup_after_cents INTEGER NULL'
  need '`biz_key` VARCHAR\(64\) NULL' 'balance_logs.biz_key VARCHAR(64) NULL'
  need 'UNIQUE INDEX `balance_holds_order_id_key`\(`order_id`\)' 'balance_holds 的 order_id 唯一索引'
  need 'INDEX `balance_holds_state_held_at_idx`\(`state`, `held_at`\)' 'balance_holds (state, held_at) 索引'
  need 'INDEX `balance_holds_user_id_created_at_idx`\(`user_id`, `created_at`\)' 'balance_holds (user_id, created_at) 索引'
  need "\`state\` VARCHAR\(10\) NOT NULL DEFAULT 'HELD'" "balance_holds.state 默认 'HELD'"
  return $bad
}

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
elif [ "$MODE" = "--expect-wallet-b0" ]; then
  EXPECT="$EXPECT_WALLET_B0"
  SUMMARY="钱包 B0：users 1 列、balance_logs 3 列 + 1 个唯一索引、新表 balance_holds（含 3 个索引、默认值逐字核对）"
  wallet_b0_details || exit 1
elif [ "$MODE" = "--expect-jiema-s2" ]; then
  EXPECT="$EXPECT_JIEMA_S2"
  SUMMARY="接码 S2：4 张新表 sms_orders / sms_attempts / sms_messages / sms_events（唯一索引、默认值逐字核对）"
  jiema_s2_details || exit 1
elif [ "$MODE" = "--expect-jiema-s1" ]; then
  EXPECT="$EXPECT_JIEMA_S1"
  SUMMARY="接码 S1：5 张新表 sms_services / sms_countries / sms_offer_cache / sms_price_rules / sms_holds（唯一索引、默认值逐字核对）"
  jiema_s1_details || exit 1
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
