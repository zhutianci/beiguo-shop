---
title: SQL 业务分析模板提示词：留存率、转化漏斗、复购率查询
slug: sql-retention-funnel
model: any-llm
topics: [data-analysis, coding]
needsRefImage: false
useCase: 需要用 SQL 算留存、漏斗、复购这类常规业务指标时用：先明确口径，再生成分步 CTE 查询，并附结果自检 SQL，输出格式可以直接做图。
prompt: |
  【角色】你是一名增长分析师，熟练使用 [SQL 方言] 计算留存、漏斗、复购等用户行为指标，重视口径的准确性。

  【背景】
  - 数据库方言：[SQL 方言，如 Hive、MySQL]
  - 表结构（表名、字段、含义）：
    [表结构]
  - 分析类型：[留存/漏斗/复购]
  - 指标口径要求：[口径说明]
  - 时间范围与时区：[时间范围与时区]
  - 分组维度（可选）：[分组维度]

  【任务】
  1. 先用文字写清指标口径：用户如何定义（设备 ID 还是账号）、同期群（cohort）如何划分、分子分母分别是什么、时间窗口边界。口径有歧义的地方先问我。
  2. 用 CTE 分步写 SQL，每一步加注释；留存用首次日期划分同期群，漏斗要求步骤按时间先后发生（如需要），复购明确「复购」的定义。
  3. 处理去重、测试账号剔除、时区转换、跨天边界。
  4. 输出格式便于作图：留存输出同期群 × 第 N 天的矩阵，漏斗输出每一步人数和转化率。
  5. 附自检 SQL：检查总用户数、各步人数是否单调递减、比例是否在 0–1 之间。

  【约束】
  - 语法严格符合指定方言（日期函数差异较大，务必注意）。
  - 大表查询先按分区或日期过滤，避免全表扫描。

  【输出格式】
  口径说明 → SQL（代码块）→ 结果表结构示例 → 自检 SQL → 作图建议。
negativePrompt: null
source: null
verify:
  - 在 MySQL 8 上运行示例次日留存 SQL，用一小份手造数据核对结果
---
**怎么填变量**：[表结构] 至少包含用户 ID、事件名或订单、时间三类字段；[口径说明] 例如「次日留存 = 首日注册用户中，第 2 个自然日有任意启动行为的用户占比」，口径不同结果可能差很多。

**追问技巧**：结果出来后追问「把 7 日留存按渠道拆开，并标出显著低于平均的渠道」；漏斗转化率异常时追问「检查是否有用户跳步导致漏斗不单调」。

**适合模型**：通用大模型均可。

> 上线看板前请用小样本手工核对一次结果。

### 示例输出

> 示例，仅供参考（MySQL 8，次日留存）

```sql
WITH first_day AS (            -- 每个用户的首次活跃日期
  SELECT user_id, MIN(DATE(event_time)) AS d0
  FROM events GROUP BY user_id
),
retained AS (                  -- 首日后的第 1 天是否活跃
  SELECT DISTINCT f.user_id, f.d0
  FROM first_day f
  JOIN events e ON e.user_id = f.user_id
   AND DATE(e.event_time) = DATE_ADD(f.d0, INTERVAL 1 DAY)
)
SELECT f.d0, COUNT(*) AS new_users,
       COUNT(r.user_id) / COUNT(*) AS d1_retention
FROM first_day f LEFT JOIN retained r ON r.user_id = f.user_id
GROUP BY f.d0;
```
