---
title: pandas 太慢、内存不够怎么办提示词（向量化改写、dtype 优化、分块读取、何时换 Polars 或 DuckDB）
slug: pandas-speed-memory
model: any-llm
topics: [data-analysis, coding]
needsRefImage: false
useCase: 用 pandas 处理几百万行数据时脚本跑半小时、或者直接内存溢出时用：把代码和数据规模给 AI，它先找出最慢的环节，再把逐行循环和 apply 改写成向量化操作，优化数据类型与读取方式，必要时给出用 Polars 或 DuckDB 改写的版本。
prompt: |
  你是一名擅长数据处理性能优化的工程师。请帮我优化下面的 pandas 代码。

  - 数据规模：[数据规模]（例：CSV 文件 3GB，约 2000 万行，30 列）
  - 机器配置：[机器配置]（例：笔记本，16G 内存）
  - 当前耗时或报错：[当前情况]（例：跑 40 分钟，或读取时内存溢出）
  - 代码：
    [粘贴代码]
  - 最终需要的结果：[最终结果]（例：按用户汇总的一张小表）

  请按以下顺序分析：
  1. 定位瓶颈：给出测量每一步耗时与内存占用的方法，先找到最慢的那一步，而不是凭感觉优化。
  2. 读取阶段：
     - 只读取需要的列；
     - 指定合适的数据类型（低基数的文本列用分类类型、整数用更小的位宽、日期在读取时解析）；
     - 数据大于内存时分块读取并逐块聚合；
     - 文件反复读取时，转换为列式存储格式（如 Parquet）。
  3. 计算阶段：
     - 把逐行循环、对行使用的 apply 改写为向量化运算；
     - 条件赋值用向量化的条件选择函数，而不是逐行判断；
     - 字符串处理使用字符串访问器的方法；
     - 避免在循环中不断拼接数据框，先收集再一次性合并；
     - 尽早过滤和聚合，减少后续处理的数据量。
  4. 对每一处改写，说明预计的提升来源，并保证结果与原代码一致（给出核对代码）。
  5. 换工具的判断：如果优化后仍然不够，给出用 Polars（惰性模式）或 DuckDB（直接对文件执行 SQL）实现同样逻辑的代码，并说明两者各自适合的情况。

  不要为了性能牺牲正确性；对结果有影响的改动（例如类型降级可能导致的溢出或精度损失）要明确提示。
negativePrompt: null
source: null
verify:
  - 用一段含 iterrows 循环与 apply 的代码在百万行模拟数据上对比优化前后耗时，并运行核对代码确认结果一致
---
**怎么填变量**：[数据规模] 和 [机器配置] 决定方案：数据能放进内存时，向量化和类型优化往往就够了；数据明显超过内存时，要么分块，要么直接换成 DuckDB 这类不需要把全部数据载入内存的工具。[最终需要的结果] 很重要，如果最后只要一张汇总表，很多中间步骤可以直接在读取时完成。

**常见坑**：
- 用 iterrows 逐行处理几百万行，是 pandas 最常见的性能问题。绝大多数逐行逻辑都可以改写成整列运算。
- 文本列默认是对象类型，非常占内存。像「省份」「状态」这类取值很少的列，转换为分类类型可以大幅减少内存。
- 把整数降为更小的位宽来省内存时，没检查最大值，导致数值溢出。降级前先看取值范围。

**追问技巧**：优化后追问「把这个流程改成每天自动跑的脚本，只处理新增的数据」。

### 示例输出

> 示例，仅供参考（节选）

**瓶颈**：第 12 行用 `apply` 逐行计算会员等级，占总耗时的约 80%（需你用计时代码确认）。

```python
import numpy as np
import pandas as pd

# 读取：只取需要的列，并指定类型
df = pd.read_csv("orders.csv", usecols=["user_id", "amount", "province", "created_at"],
                 dtype={"user_id": "int64", "province": "category"}, parse_dates=["created_at"])

# 改写前：df["level"] = df.apply(lambda r: "高" if r.amount > 1000 else ("中" if r.amount > 200 else "低"), axis=1)
# 改写后：向量化的条件选择
df["level"] = np.select([df["amount"] > 1000, df["amount"] > 200], ["高", "中"], default="低")
```

数据超过内存时，用 DuckDB 直接对文件执行 SQL：

```python
import duckdb
result = duckdb.sql("""
    SELECT user_id, SUM(amount) AS total
    FROM read_csv_auto('orders.csv')
    GROUP BY user_id
""").df()
```
