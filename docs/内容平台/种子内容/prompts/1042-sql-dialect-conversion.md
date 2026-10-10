---
title: SQL 方言转换提示词（MySQL、PostgreSQL、Oracle、SQL Server、Hive / Spark SQL 互转，标出语义差异）
slug: sql-dialect-conversion
model: any-llm
topics: [coding, data-analysis]
needsRefImage: false
useCase: 迁移数据库、把业务库的查询搬到数仓、或者照着别人的 SQL 改到自己的数据库时用：让 AI 转换语法的同时，逐项标出函数、日期处理、空值与字符串比较、分页、自增等语义差异，避免「语法能跑、结果不对」。
prompt: |
  请把下面的 SQL 从源数据库转换为目标数据库。你是一名同时熟悉这两种数据库的数据工程师，最关心的是转换后结果是否和原来完全一致。

  - 源数据库及版本：[如 MySQL 5.7]
  - 目标数据库及版本：[如 PostgreSQL 16]
  - 待转换的 SQL（可以是查询、建表语句、存储过程）：
    [粘贴 SQL]
  - 涉及的表结构（如果转换依赖字段类型）：
    [表结构]

  输出：
  1. 转换后的 SQL，放在代码块中，保留原有注释。
  2. 改动对照表：位置 | 原写法 | 新写法 | 原因。
  3. 语义差异检查（只列出这段 SQL 实际涉及的项，逐一说明是否会导致结果不同）：
     - 日期与时间：日期函数、格式化字符串、时区处理、日期相减的结果单位；
     - 字符串：拼接方式、空字符串与空值是否被视为相同、大小写和尾部空格的比较规则、字符集与排序规则；
     - 空值：聚合、排序时空值的位置、COALESCE 等函数的差异；
     - 数值：整数除法是否截断、四舍五入函数的行为、精度；
     - 分组：源数据库是否允许 SELECT 中出现未分组的列，目标数据库是否允许；
     - 分页、取前 N 行、自增主键、序列、布尔类型、引号与标识符大小写；
     - 隐式类型转换在两边是否一致。
  4. 需要人工确认的地方：两种数据库行为不同、无法确定原 SQL 意图时，列出选项而不是自行决定。
  5. 验证建议：给出用来比对新旧结果的查询（例如对比行数、关键字段汇总值、抽样记录）。

  不要编造目标数据库不存在的函数；拿不准某个函数在目标版本中是否可用时，标注「需在目标版本验证」。
negativePrompt: null
source: null
verify:
  - 用一段包含 GROUP_CONCAT、DATE_FORMAT、IFNULL 和非标准 GROUP BY 的 MySQL 查询转 PostgreSQL，检查是否指出分组规则差异
---
**怎么填变量**：[源数据库] 和 [目标数据库] 一定要写版本号，同一个数据库不同版本支持的语法差别很大（比如窗口函数、JSON 函数）。涉及字段类型的转换（尤其是日期和字符串），把表结构也贴上。

**常见坑**：
- MySQL 在宽松模式下允许 SELECT 中出现没有参与分组的列，迁到 PostgreSQL 会直接报错；更麻烦的是原 SQL 返回的其实是「任意一行」的值，需要和业务确认原本想要哪一行。
- Oracle 把空字符串当作空值处理，迁到其他数据库后，原本 `IS NULL` 能查到的数据可能查不到了。
- 整数相除：有的数据库得到小数，有的直接截断为整数，比例、占比类的计算最容易因此出错。

**追问技巧**：转换完成后，在两边各跑一次验证查询，把结果差异贴回去，问「这些差异由哪一处语义不同造成」。

### 示例输出

> 示例，仅供参考（MySQL 5.7 转 PostgreSQL 16，节选）

```sql
SELECT u.city,
       STRING_AGG(DISTINCT u.name, ',') AS names,       -- 原为 GROUP_CONCAT
       TO_CHAR(MAX(o.created_at), 'YYYY-MM') AS last_ym, -- 原为 DATE_FORMAT(..., '%Y-%m')
       COALESCE(SUM(o.amount), 0) AS total              -- 原为 IFNULL
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
GROUP BY u.city;
```

| 原写法 | 新写法 | 原因 |
|---|---|---|
| `GROUP_CONCAT(DISTINCT name)` | `STRING_AGG(DISTINCT name, ',')` | 函数名不同；注意 MySQL 有默认长度上限，会截断结果，PostgreSQL 不截断 |
| `SELECT u.city, u.level ... GROUP BY u.city` | 删除 `u.level` | PostgreSQL 不允许未分组的列，**需确认** 原本想取哪个 level |
