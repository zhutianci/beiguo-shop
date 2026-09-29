-- =====================================================================================
-- 短信接码 · 回滚前的「排空」清单（docs/短信接码-设计.md §11 第 10 步；S2 交付，S4 补 ⑤–⑦）。**只 SELECT，不改任何数据**，不 import src/。
--
--   mysql -uroot -p"$MYSQL_ROOT_PASSWORD" --default-character-set=utf8mb4 --table beiguo_shop < scripts/ops/jiema-drain.sql \
--     > /opt/beiguo/backups/jiema-drain-$(date +%Y%m%d%H%M).txt
--
-- 回滚到 S2 之前的镜像前必须排空：关接码总开关、关充值、打开余额支付急停，等到下面 ①② 都为空（最长约 1 小时），
-- 回滚前后各跑一次 W、I 系列对账并存档。来不及排空时先跑本脚本存档：回滚期间这些单不会被推进，但钱不会丢（预扣行、流水、条目都在库里），
-- 修好后尽快重新部署新镜像，由 jiema-tick 与后台把它们跑完。**不要写批量改库的 SQL**：批量释放或退款绕开了 postInTx 与 bizKey，比等新镜像更危险。
-- =====================================================================================

-- ① 未完结的接码单（按状态计数）
SELECT state, COUNT(*) AS n, MIN(created_at) AS oldest
  FROM sms_orders
 WHERE state IN ('PENDING_PAY', 'READY', 'ACQUIRING', 'WAITING', 'REPLACING', 'CANCELLING', 'REFUNDING', 'RECEIVED', 'MANUAL')
 GROUP BY state;

-- ①' 明细（订单号、状态、付款方式、应付、预扣、当前号码尾号，不含号码全文）
SELECT so.id, o.order_no, so.state, so.pay_mode, so.price_cents, so.balance_cents, so.alipay_paid_cents,
       o.pay_status, o.delivery_status, so.created_at, so.updated_at
  FROM sms_orders so JOIN orders o ON o.id = so.order_id
 WHERE so.state IN ('PENDING_PAY', 'READY', 'ACQUIRING', 'WAITING', 'REPLACING', 'CANCELLING', 'REFUNDING', 'RECEIVED', 'MANUAL')
 ORDER BY so.id;

-- ② 还在 HELD 的余额预扣（负债看板里仍计入；回滚后旧镜像的 closeExpired 不会释放它们）
SELECT h.order_id, h.user_id, h.topup_cents, h.cash_cents, h.held_at, o.order_no, o.pay_status, o.delivery_status
  FROM balance_holds h JOIN orders o ON o.id = h.order_id
 WHERE h.state = 'HELD'
 ORDER BY h.held_at;

-- ③ 非终态的取号尝试（上游那边可能还挂着号；activation_id 供站长到上游后台核对）
SELECT a.id, a.sms_order_id, a.state, a.activation_id, a.service, a.country, a.requested_at, a.ends_at
  FROM sms_attempts a
 WHERE a.state IN ('REQUESTING', 'UNKNOWN', 'ACTIVE', 'RECEIVED', 'RELEASING')
 ORDER BY a.id;

-- ④ 未处理的待核实到账条目（迟到付款；回滚后仍可由新镜像的「退入买家余额」处理）
SELECT `key`, LEFT(value, 300) AS entry
  FROM settings
 WHERE `key` LIKE 'vmq_unmatched:%' AND value LIKE '%"handledAt":null%'
 ORDER BY `key`;

-- ⑤ 最近一次两份对账报告（S4：回滚前后各存档一次；旧镜像跑不了对账时，至少留下回滚那一刻库里的最近结论）
SELECT `key`, updated_at, LEFT(value, 4000) AS report
  FROM settings
 WHERE `key` IN ('wallet_reconcile_last', 'sms_reconcile_last', 'sms_unlinked_last')
 ORDER BY `key`;

-- ⑥ 已结束却还没定稿成本利润的接码单（新镜像的 tick / 对账 I8 会补算；回滚期间不会）
SELECT so.id, o.order_no, so.state, so.cost_cents, so.profit_cents, so.updated_at
  FROM sms_orders so JOIN orders o ON o.id = so.order_id
 WHERE so.state IN ('FINISHED', 'REFUNDED') AND so.cost_final = 0
 ORDER BY so.id;

-- ⑦ 已取消单的亏损（没码却被上游扣费：FREE_CANCELLATION_EXPIRED / 对账翻案；只记亏损，订单仍是已取消）
SELECT so.id, o.order_no, so.loss_cents, so.refunded_at
  FROM sms_orders so JOIN orders o ON o.id = so.order_id
 WHERE so.state = 'CANCELLED' AND so.loss_cents IS NOT NULL
 ORDER BY so.refunded_at DESC
 LIMIT 200;
