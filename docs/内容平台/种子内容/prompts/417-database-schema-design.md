---
title: 数据库表设计提示词（业务需求 → ER 图、字段类型、索引设计与 MySQL 建表语句）
slug: database-schema-design
model: any-llm
topics: [coding, product-design]
needsRefImage: false
useCase: 新功能要建表、或者老表越改越乱时用：从业务描述和核心查询出发，得到实体关系图、每个字段的类型与约束、每个索引对应服务哪条查询，以及可直接执行的建表语句和需要你拍板的设计取舍。
prompt: |
  【角色】你是一名经历过多次数据量从十万涨到上亿的后端架构师，设计表结构时先问「数据怎么查、怎么改」，再决定怎么存。

  【业务信息】
  - 业务描述：[业务描述]
  - 核心实体（知道的话）：[核心实体]
  - 最常用的查询和写入（按频率排序，越具体越好）：
    [核心查询场景]
  - 数据量预估：[如一年 500 万订单]
  - 数据库：[MySQL 8/PostgreSQL 16]
  - 特殊要求（软删除、多租户、审计、历史版本等）：[特殊要求]

  【请依次完成】
  1. 实体与关系：列出实体、关系类型（一对一、一对多、多对多及中间表），并用 Mermaid erDiagram 画出来。
  2. 字段设计：每张表列出 字段 | 类型 | 可空 | 默认值 | 约束 | 说明。逐项检查：
     - 主键策略（自增、雪花 ID、UUID 的取舍，对外暴露的编号与内部主键分开）；
     - 金额用 DECIMAL 或整数分，禁止 FLOAT/DOUBLE；时间字段的类型与时区约定（MySQL 的 TIMESTAMP 有 2038 年上限）；
     - 字符集用 utf8mb4；状态字段的取值写进注释或枚举表；
     - 订单这类记录要冗余「下单时的快照」（商品名、单价），不能只存外键；
     - 软删除与唯一约束的冲突怎么处理。
  3. 索引设计：每个索引写明服务于哪条查询；联合索引说明列顺序的理由（等值条件在前、范围条件在后，最左前缀）；指出哪些查询即使加索引也会慢，并给出替代方案。
  4. 输出完整的建表 DDL。
  5. 前瞻风险：数据量增长到 10 倍时最先出问题的表和查询，以及届时的方案（归档、分区、读写分离、分库分表）。

  【约束】
  - 不确定的业务规则（如一个用户能否有多个收货地址）列为「待确认」，并说明不同答案对表结构的影响。
  - 范式与冗余的每处取舍都要写理由。
  - 不要为了「以后可能用到」预留大量无用字段。

  【输出格式】
  ER 图（Mermaid）→ 字段表（每张表一个）→ 索引与查询对照表 → DDL（SQL 代码块）→ 风险与扩展 → 待确认问题。
negativePrompt: null
source: null
verify:
  - 把生成的 DDL 在 MySQL 8 上实际执行一次，检查语法
  - 检查生成的 Mermaid erDiagram 能否正常渲染
---
**怎么填变量**：[核心查询场景] 是整个设计的依据，写成「用户查看自己最近 30 天的订单，按时间倒序分页」「后台按订单号精确查询」这样具体的句子，AI 才能给出有针对性的索引。[数据量预估] 决定是否需要提前考虑分区或归档。

**常见坑**：
- 只给业务描述不给查询，得到的往往是「每个外键都加一个单列索引」的平庸设计。
- 自增主键直接当订单号对外暴露，会泄露业务量，也方便别人遍历；对外编号应单独生成。
- AI 生成的 DDL 一定要在测试库实际执行，不同版本对默认值、排序规则的支持有差异。

**追问技巧**：把你最慢的那条 SQL 和 EXPLAIN 结果贴回去，问「按现在的索引会走哪个、为什么」；需求变化时说「新增一个优惠券功能，给出最小改动的表结构变更和迁移步骤」。

### 示例输出

> 示例，仅供参考（节选）

```mermaid
erDiagram
  users ||--o{ orders : places
  orders ||--|{ order_items : contains
```

```sql
CREATE TABLE orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_no VARCHAR(32) NOT NULL COMMENT '对外订单号，不暴露自增 id',
  user_id BIGINT UNSIGNED NOT NULL,
  status TINYINT NOT NULL DEFAULT 0 COMMENT '0待支付 1已支付 2已取消 3已退款',
  amount_cents BIGINT NOT NULL COMMENT '实付金额，单位分',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_order_no (order_no),
  KEY idx_user_created (user_id, created_at) COMMENT '我的订单：按用户查、按时间倒序'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```
