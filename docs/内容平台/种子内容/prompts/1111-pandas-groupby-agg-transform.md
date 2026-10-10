---
title: pandas 分组聚合提示词（groupby + agg 多指标、transform 组内占比与排名、pivot_table 透视、结果整理成报表）
slug: pandas-groupby-agg-transform
model: any-llm
topics: [data-analysis, coding]
needsRefImage: false
useCase: 用 pandas 做分组统计（按区域按月汇总多个指标、组内占比、每组取前几名、透视表）时写不出或结果格式很乱（多级列名、索引错位）时用：描述数据和想要的结果表，AI 写出清晰的分组代码，讲清 agg、transform、apply 各自适合什么，并把结果整理成可以直接导出的报表。
prompt: |
  你是一名熟练使用 pandas 的数据分析师，代码追求清晰、可读、向量化。请帮我完成分组统计。

  - pandas 版本：[pandas 版本]（例：2.2）
  - 数据结构（df.head() 与 df.dtypes 的输出，原样粘贴）：
    [数据结构]
  - 想要的结果：[想要的结果]（例：每个区域每月的订单数、销售额、客单价、销售额占该区域全年比例）
  - 结果用途：[结果用途]（例：导出 Excel 给业务看）

  要求：
  1. 先说明思路：按哪些列分组、每个指标用什么聚合；哪些指标需要先聚合再计算（例如客单价 = 销售额合计 ÷ 订单数，而不是对每行的单价求平均）。
  2. 写法选择并说明理由：
     - 多个指标用命名聚合，结果列名直接可读，避免多级列名；
     - 需要把组内统计结果放回原表每一行时（组内占比、组内排名、与组平均的差），用 transform；
     - 每组取前 N 名，用排序加分组取头部，或用分组排名后筛选；
     - 只有在上面都做不到时才用 apply，并说明它通常更慢。
  3. 透视：需要行列交叉的报表时用 pivot_table，说明 index、columns、values、aggfunc、fill_value、margins 的作用。
  4. 细节：分组列中的空值默认会被丢弃，需要保留时的参数；分类类型分组时未出现的类别是否显示；按月分组时先把日期转换为月份；分组后重置索引。
  5. 结果整理：列的顺序、重命名为中文、数字格式（百分比、保留小数）、排序，导出为 Excel。
  6. 用几行手工计算核对结果。

  代码中每一步加中文注释。
  数据量超过几百万行时，提醒我考虑 DuckDB 或 Polars 做同样的分组聚合（可配合 1113 号提示词）。
negativePrompt: null
source: null
verify:
  - 用一份含空区域值的样例数据运行生成代码，检查客单价是否为「先汇总再相除」，空值分组是否按说明处理
---
**怎么填变量**：[数据结构] 贴 `df.head()` 和 `df.dtypes` 的输出最有用：AI 能看到列名、样例和类型，比如日期列是不是真正的日期类型，金额列是不是被读成了文本。

**常见坑**：
- 客单价、转化率这类比率指标，直接对每行的比率求平均，结果是错的。要先分别汇总分子和分母，再相除。
- 一次传入多个聚合函数，得到两层列名，后面处理和导出都很麻烦。用命名聚合，一步得到清晰的列名。
- 分组列中有空值时，默认会被直接丢掉，汇总总数和原始数据对不上，却很难察觉。

**追问技巧**：追问「把结果再按区域做小计和总计，导出成带格式的 Excel」（可配合 1133 号 openpyxl 报表提示词），或「同样的统计改用 SQL 怎么写」。

### 示例输出

> 示例，仅供参考（节选）

```python
import pandas as pd

df["月份"] = df["下单时间"].dt.to_period("M").astype(str)

# 1. 命名聚合：列名直接可读
monthly = (
    df.groupby(["区域", "月份"], dropna=False)          # 保留区域为空的记录
      .agg(订单数=("订单号", "nunique"), 销售额=("金额", "sum"))
      .reset_index()
)
# 2. 客单价：先汇总再相除
monthly["客单价"] = monthly["销售额"] / monthly["订单数"]
# 3. 占该区域全年的比例：transform 把区域合计放回每一行
monthly["区域内占比"] = monthly["销售额"] / monthly.groupby("区域", dropna=False)["销售额"].transform("sum")

# 透视：行是区域，列是月份，值是销售额
report = monthly.pivot_table(index="区域", columns="月份", values="销售额",
                             aggfunc="sum", fill_value=0, margins=True, margins_name="合计")
```
