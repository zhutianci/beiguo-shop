---
title: pandas merge 后行数变多或对不上怎么办提示词（关联键重复、类型不一致、空格大小写、validate 与 indicator 排查）
slug: pandas-merge-row-explosion
model: any-llm
topics: [data-analysis, coding]
needsRefImage: false
useCase: 用 pandas 合并两张表后行数莫名变多、金额汇总被放大，或者大量行匹配不上变成空值时用：描述两张表和合并代码，AI 给出一套诊断代码找出键重复、类型不一致、格式差异等原因，并改写成带校验的合并写法。
prompt: |
  你是一名严谨的数据分析师，合并数据时总是先验证再相信结果。我的 pandas 合并结果有问题，请帮我排查。

  - 合并代码（原样粘贴）：
    [合并代码]
  - 左表与右表的结构（各自的 head、dtypes、行数）：
    [两表结构]
  - 现象：[现象]（例：合并前 1 万行，合并后 1.3 万行；或右表字段大量为空）
  - 业务上两表的关系：[业务关系]（例：一个订单对应一个客户，应该是多对一）

  请先给出一段诊断代码，逐项检查：
  1. 关联键在两表中是否唯一：统计重复的键及其出现次数，列出重复最多的几个键。行数变多几乎总是因为右表（或两表）的键有重复。
  2. 关联键的类型是否一致：一边是整数、一边是字符串；或者一边是浮点（例如因为有空值，整数列被读成了浮点，出现「123.0」）。
  3. 格式差异：前后空格、大小写、前导零、全角半角。
  4. 空值：关联键为空的行有多少，它们在合并中会怎样。
  5. 用 indicator 参数统计「只在左表、只在右表、两表都有」的行数，找出匹配不上的样例。

  然后：
  - 根据诊断结果判断原因；
  - 给出修正后的合并代码：先清洗键（统一类型与格式），右表重复时根据业务决定是去重、聚合后再合并，还是这本来就是一对多关系、后续汇总时需要注意；
  - 在合并中使用 validate 参数声明期望的关系（一对一、多对一等），关系不符时直接报错，而不是悄悄产生错误结果；
  - 合并后增加断言：行数、关键金额的合计与合并前一致。
  - 说明 how 参数（left、inner、outer）的选择对结果的影响。
negativePrompt: null
source: null
verify:
  - 构造一个右表客户编号有重复、且一边编号为字符串带前导零的样例运行诊断代码，检查能否同时定位两个原因
---
**怎么填变量**：[两表结构] 至少包括两张表的行数、关联键列的类型和几行样例。[业务关系] 非常重要，AI 要据此判断「行数变多」是错误，还是一对多关系下的正常现象。

**常见坑**：
- 右表本该一个客户一行，实际因为历史数据有重复，合并后订单被复制成两行，销售额凭空多出一截。合并时用 validate 声明期望的关系，能第一时间发现。
- 整数列中有空值，被 pandas 读成浮点数，编号变成「1001.0」，和另一张表的「1001」匹配不上。
- 合并后只看前几行觉得没问题，没有核对总行数和金额合计，问题直到报表上线才被发现。

**追问技巧**：追问「把这套检查封装成一个函数，以后每次合并都调用它并打印检查报告」。

### 示例输出

> 示例，仅供参考（诊断代码节选）

```python
# 1. 键是否唯一
dup = customers["客户编号"].value_counts()
print("右表重复的键：\n", dup[dup > 1].head(10))

# 2. 类型是否一致
print(orders["客户编号"].dtype, customers["客户编号"].dtype)

# 5. 匹配情况统计
check = orders.merge(customers, on="客户编号", how="outer", indicator=True)
print(check["_merge"].value_counts())
print(check.loc[check["_merge"] == "left_only", "客户编号"].head())
```

修正后的合并：

```python
def norm_key(s: pd.Series) -> pd.Series:
    return s.astype("string").str.strip().str.lstrip("0")   # 统一为字符串，去空格与前导零

orders["客户编号"] = norm_key(orders["客户编号"])
customers["客户编号"] = norm_key(customers["客户编号"])
customers = customers.drop_duplicates("客户编号", keep="last")   # 业务确认：保留最新一条

merged = orders.merge(customers, on="客户编号", how="left", validate="many_to_one")
assert len(merged) == len(orders)
assert abs(merged["金额"].sum() - orders["金额"].sum()) < 1e-6   # 浮点数用近似比较
```
