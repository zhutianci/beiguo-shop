---
title: MyBatis 动态 SQL 生成提示词（Mapper XML 的 if、where、foreach、批量插入，#{} 与 ${} 防注入）
slug: mybatis-dynamic-sql-mapper
model: any-llm
topics: [coding]
needsRefImage: false
useCase: 用 MyBatis 写多条件查询、批量插入或更新、动态排序时用：描述查询条件和表结构，得到正确的 Mapper 接口与 XML，条件拼接不出现多余的 AND 或逗号，排序字段等不能参数化的地方用白名单防注入，并提示分页与批量操作的性能问题。
prompt: |
  你是一名熟悉 MyBatis 的 Java 后端工程师。请根据需求编写 Mapper 接口和 XML。

  - MyBatis 版本与是否使用增强框架：[版本与框架]（例：MyBatis 3.5，无 Plus）
  - 数据库：[数据库]（例：MySQL 8）
  - 表结构：
    [粘贴建表语句]
  - 需求：[查询需求]（例：订单列表按多条件筛选并排序）
  - 查询条件（哪些可选、如何匹配）：[查询条件]
  - 排序与分页要求：[排序与分页]

  编写要求：
  1. 条件拼接使用 where、if、choose、trim、set 等标签，保证任何条件组合下都不会出现多余的 AND、OR 或逗号；所有条件都为空时的行为要明确（返回全部还是拒绝查询，大表应避免无条件全表查询）。
  2. 防注入：值一律用 #{} 参数占位；${} 只能用于无法参数化的部分（如排序字段、排序方向、表名），且必须在 Java 层用白名单校验后再传入，并在代码中写明。
  3. 集合参数：IN 查询用 foreach，集合为空时的处理（避免生成语法错误的空括号）；集合很大时分批。
  4. 模糊查询：用数据库的字符串拼接函数配合 #{}，不要用 ${} 拼接百分号。
  5. 批量插入与更新：给出 foreach 批量插入写法，说明单条 SQL 长度与数据库包大小限制，建议每批数量；对比执行器批处理方式的取舍。
  6. 结果映射：字段与属性的映射方式（驼峰自动映射或结果映射），一对多关联查询时避免 N+1 查询。
  7. 分页：使用 limit 分页或分页插件时，说明深分页的性能问题与替代方案。

  输出：Mapper 接口（带参数注解）、XML、Java 层的白名单校验代码、一条典型条件组合下最终生成的 SQL（用于核对）。
negativePrompt: null
source: null
verify:
  - 用「全部条件为空」「只传排序字段」「IN 列表为空」三种参数组合跑一遍生成的 XML，检查最终 SQL 语法是否正确
---
**怎么填变量**：[查询条件] 写清每个条件是精确匹配、模糊匹配还是范围，以及是否可选，例如「状态可多选；下单时间为范围，两端都可选；商品名模糊匹配」。[排序与分页] 中如果允许前端指定排序字段，AI 会生成白名单校验。

**常见坑**：
- 用 `${}` 接收前端传来的排序字段或模糊查询关键字，是 MyBatis 项目中最常见的 SQL 注入来源。
- 手写 `WHERE 1=1` 再拼接 AND 虽然能用，但 where 标签更干净；更要注意的是所有条件都为空时会变成全表查询。
- foreach 的集合为空时会生成 `IN ()`，直接报语法错误。在 Java 层先判断，或在 XML 中处理。

**追问技巧**：追问「把这个列表查询改为游标分页（基于上一页最后一条的 ID）」，或「这个一对多的结果映射会产生几次查询，怎么改成一次」。

### 示例输出

> 示例，仅供参考（节选）

```xml
<select id="search" resultType="com.example.order.OrderVO">
  SELECT id, order_no, status, amount, created_at
  FROM orders
  <where>
    <if test="userId != null"> AND user_id = #{userId} </if>
    <if test="statuses != null and statuses.size() > 0">
      AND status IN
      <foreach collection="statuses" item="s" open="(" separator="," close=")">#{s}</foreach>
    </if>
    <if test="keyword != null and keyword != ''">
      AND product_name LIKE CONCAT('%', #{keyword}, '%')
    </if>
    <if test="from != null"> AND created_at &gt;= #{from} </if>
  </where>
  ORDER BY ${sortColumn} ${sortDir}
  LIMIT #{limit}
</select>
```

```java
private static final Map<String, String> SORT_COLUMNS = Map.of("time", "created_at", "amount", "amount");

String col = SORT_COLUMNS.getOrDefault(req.getSort(), "created_at");   // 白名单：只允许预设字段
String dir = "asc".equalsIgnoreCase(req.getDir()) ? "ASC" : "DESC";
```
