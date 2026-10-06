---
title: Python 统计分析代码提示词：pandas + scipy/statsmodels 一键出结果
slug: python-stats-analysis-code
model: any-llm
topics: [research-data, coding]
needsRefImage: false
useCase: 用 Python / Jupyter 做科研统计时，让 AI 按「读数据 → 描述统计 → 前提检验 → 主分析 → 效应量 → 导出」写出分单元格的完整代码。
prompt: |
  【角色】你是一名熟悉 pandas、scipy.stats、statsmodels 和 pingouin 的科研数据分析师，代码面向 Jupyter Notebook，风格清晰可复现。

  【背景】
  - 数据：[文件名与格式]，共约 [行数] 行
  - 变量说明（列名、含义、类型）：
    [列名清单]
  - 研究问题：[研究问题]
  - 计划方法：[统计方法]（不合适就先指出并给替代方案）
  - 环境：Python [版本]，可用包：[可用包]

  【任务】
  按 Notebook 单元格输出代码，每个单元格前用一行 Markdown 说明目的：
  1. 导入包、固定随机种子、设置显示选项；
  2. 读取数据，输出 info()、缺失值统计，完成类型转换；
  3. 分组描述统计表（n、均值、标准差、中位数、四分位距）；
  4. 前提检验（如 Shapiro-Wilk、Levene），根据结果打印建议；
  5. 主分析：优先使用 statsmodels 的公式接口，输出完整摘要；
  6. 效应量及 95% 置信区间（可用 pingouin）；
  7. 把关键结果整理成 DataFrame 并导出为 CSV。

  【约束】
  - 代码可直接运行，不使用已弃用的接口；不假设存在我没提到的列。
  - 小样本时提示正态性检验的局限，不要机械地只看 p 值。
  - 不要编造任何结果数字。

  【输出格式】
  依次给出各单元格代码；最后用表格说明「输出里该看哪几个数、怎么判断」。
negativePrompt: null
source: null
verify:
  - 用 seaborn 自带的 tips 数据集实际运行一遍，确认 pingouin 与 statsmodels 接口无报错
---
**怎么填变量**：[列名清单] 可以直接贴 `df.head()` 和 `df.dtypes` 的输出；[可用包] 写清楚有没有装 pingouin，没有的话让 AI 只用 scipy 和 statsmodels。

**追问技巧**：报错时贴完整 Traceback 和包版本（`pip show 包名`）；结果出来后可以追问「把这些结果写成 APA 格式的结果段」。

**适合模型**：通用大模型都行；带代码执行功能的（如 ChatGPT 的数据分析）可以先上传脱敏样例数据试跑。

> 上传数据前请确认已脱敏且符合伦理与数据协议；结果以本地运行为准。

### 示例输出

> 示例，仅供参考

```python
# 单元格 4：前提检验
from scipy import stats
for g, sub in df.groupby("group"):
    w, p = stats.shapiro(sub["score"])
    print(g, f"Shapiro-Wilk W={w:.3f}, p={p:.3f}")
lev = stats.levene(*[s["score"] for _, s in df.groupby("group")])
print("Levene p =", round(lev.pvalue, 3))
```

| 看哪里 | 怎么判断 |
|---|---|
| Shapiro p | ≥ .05 可视为近似正态 |
| Levene p | < .05 方差不齐，改用 Welch 检验 |
