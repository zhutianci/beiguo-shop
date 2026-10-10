---
title: SQL 窗口函数怎么写提示词（分组排名、取每组前 N、累计求和、同比环比、移动平均）
slug: sql-window-functions
model: any-llm
topics: [coding, data-analysis]
needsRefImage: false
useCase: 遇到「每个类目销量前三」「按月累计销售额」「环比增长率」「连续登录天数」这类需求、用 GROUP BY 写不出来时用：说明表结构和需求，AI 给出窗口函数写法、讲清分区与排序、窗口范围的含义，并提示不同数据库的差异和结果核对方法。
prompt: |
  你是一名精通 SQL 窗口函数的数据工程师。请根据我的需求写查询，并讲清楚窗口函数各部分的作用。

  - 数据库：[数据库]（例：MySQL 8、PostgreSQL、Hive、ClickHouse）
  - 表结构（建表语句或字段说明，注明主键和时间字段的类型）：
    [粘贴表结构]
  - 需求：[需求]（例：每个城市每月销售额排名前 3 的门店，并计算环比）
  - 几行样例数据（可选）：
    [样例数据]

  请输出：
  1. 先复述需求的口径：排名依据什么、并列时怎么处理、时间按自然月还是滚动 30 天、缺失月份（某月没有数据）怎么算。有歧义的先列出来，并说明你采用的默认处理。
  2. SQL：
     - 用 CTE 分步写，每一步加中文注释；
     - 窗口函数部分说明：PARTITION BY 按什么分组、ORDER BY 按什么排序、窗口范围（ROWS 还是 RANGE，从哪到哪）。
  3. 排名函数的选择：ROW_NUMBER、RANK、DENSE_RANK 在并列时的区别，以及本需求该用哪个。
  4. 涉及「上一期」的计算（LAG、LEAD）时，处理好第一期没有上一期、分母为零、中间缺月的情况。
  5. 注意事项：
     - 窗口函数的结果不能直接写在 WHERE 里过滤，要放到外层查询；
     - 我的数据库版本是否支持窗口函数，不支持时的替代写法；
     - 数据量大时的性能提示（分区字段与排序字段的索引、先过滤再开窗）。
  6. 核对方法：给出一两条简单查询，用来手工抽查结果是否正确。

  如果用到了某个数据库特有的函数或语法，明确标注，并给出通用写法。常用函数速查也附上：SUM、AVG、COUNT 加 OVER 子句做累计与移动平均，FIRST_VALUE、NTILE 分桶，PERCENT_RANK 求百分位。
negativePrompt: null
source: null
verify:
  - 用「每个类目销量前 3 且有并列」的样例数据在 MySQL 8 和 PostgreSQL 各跑一次，检查 RANK 与 ROW_NUMBER 的结果说明是否正确
---
**怎么填变量**：[表结构] 一定要写清时间字段的类型（日期、时间戳还是字符串）和数据粒度（一行是一笔订单还是一天的汇总），这决定了是否需要先聚合再开窗。[需求] 尽量写成「对每个……，计算……」的形式。

**常见坑**：
- 想直接写 `WHERE ROW_NUMBER() OVER (...) <= 3`，这在 SQL 中是不允许的，要先在子查询或 CTE 里算出排名，再在外层过滤。
- 用 LAG 算环比时，如果某个月没有数据，上一行其实是两个月前的数据，环比就算错了。需要先用日历表补全月份。
- 累计求和时，ORDER BY 后不写窗口范围，部分数据库默认的范围在排序值相同时会把并列行一起累加，结果和预期不同。需要时明确写 `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`。

**追问技巧**：追问「用连续登录天数（同一用户日期减去行号相等即为同一段连续）的思路，帮我算每个用户最长连续登录天数」，这是窗口函数的经典面试题和分析场景。

### 示例输出

> 示例，仅供参考（MySQL 8：每个城市每月销售额前 3 的门店及环比）

```sql
WITH monthly AS (            -- 第 1 步：按门店、月份汇总
  SELECT city, store_id,
         DATE_FORMAT(order_time, '%Y-%m') AS ym,
         SUM(amount) AS sales
  FROM orders
  GROUP BY city, store_id, DATE_FORMAT(order_time, '%Y-%m')
),
ranked AS (                  -- 第 2 步：城市内按月排名，并取上月销售额
  SELECT *,
         DENSE_RANK() OVER (PARTITION BY city, ym ORDER BY sales DESC) AS rk,
         LAG(sales) OVER (PARTITION BY store_id ORDER BY ym) AS prev_sales
  FROM monthly
)
SELECT city, ym, store_id, sales, rk,
       ROUND((sales - prev_sales) / NULLIF(prev_sales, 0) * 100, 1) AS mom_pct
FROM ranked
WHERE rk <= 3                -- 第 3 步：在外层过滤排名
ORDER BY city, ym, rk;
```

说明：`DENSE_RANK` 允许并列且名次连续，并列第 2 的两家门店都会保留。`NULLIF` 防止上月销售额为 0 时除零。注意：如果某门店中间有月份没有订单，`LAG` 取到的将不是上一个自然月，需先补全月份。
