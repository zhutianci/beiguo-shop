---
title: SPSS/R 统计方法怎么选：科研数据分析提示词
slug: statistical-method-selector
model: any-llm
topics: [research-data]
needsRefImage: false
useCase: 拿不准该用 t 检验、方差分析、卡方还是非参数检验时，把研究设计和变量类型填进去，得到首选方法、前提检验步骤和 SPSS/R 操作路径。
prompt: |
  【角色】你是一名有 10 年经验的统计咨询顾问，熟悉 SPSS、R 和 Python，擅长根据研究设计选择恰当的统计方法，并向非统计专业的研究者解释清楚。

  【背景】
  - 研究问题：[研究问题]
  - 研究设计：[横断面/实验/队列/重复测量]
  - 因变量：[因变量名称]，类型为 [连续/有序/二分类/计数]
  - 自变量或分组：[自变量及分组数]
  - 样本量：每组约 [每组样本量] 例；是否配对或同一批人重复测量：[是/否]
  - 已知数据情况：[如偏态、缺失、极端值]
  - 使用软件：[SPSS/R/Python]

  【任务】
  1. 先用 3 句话复述你理解的研究设计和变量类型；有歧义的地方先列出来问我，不要自行假设。
  2. 推荐 1 个首选方法和 1–2 个备选方法，说明各自的适用条件。
  3. 列出首选方法的前提假设（独立性、正态性、方差齐性等）、每个假设怎么检验、不满足时改用什么方法。
  4. 给出在我所用软件中的菜单路径或最小可运行代码。
  5. 说明论文中需要报告哪些统计量（统计量值、自由度、p 值、效应量及 95% 置信区间）。

  【约束】
  - 不要编造我没有提供的数据或结果。
  - 涉及多组两两比较时，写明多重比较校正方法（如 Tukey、Bonferroni、Holm）。
  - 如果样本量明显不足或设计本身有缺陷，直接指出并给出改进建议。

  【输出格式】
  按以下小标题输出：设计复述 / 推荐方法（表格：方法 | 适用条件 | 优缺点）/ 前提检验 / 操作步骤 / 需要报告的统计量 / 还需要我补充的信息。
negativePrompt: null
source:
  repo: f/awesome-chatgpt-prompts
  url: https://github.com/f/awesome-chatgpt-prompts
  author: null
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 参考其「Act as a Statistician」条目的角色设定，重写为中文结构化模板，加入设计复述、前提检验与报告规范
verify:
  - 核对原条目链接（仓库已迁移到 prompts.chat，条目锚点可能变化）
  - 用 GPT 与 Claude 各实测一次，检查是否会先追问歧义再给方法
---
**怎么填变量**：变量类型决定方法——量表总分算「连续」，满意度 1–5 级算「有序」，是否患病算「二分类」。同一批人测多次一定标「是」。

**追问技巧**：把正态性检验结果（Shapiro-Wilk 的 p 值）贴回去，问「这样还用参数检验吗」；或追问「审稿人可能质疑哪里」。

**适合模型**：通用大模型均可；设计复杂（嵌套、重复测量加分组）时开思考模式更稳。

> 方法最终以导师、教材和目标期刊要求为准，请自行核对。

### 示例输出

> 示例，仅供参考（三种教学法对成绩的影响，每组 30 人）

| 方法 | 适用条件 |
|---|---|
| 单因素方差分析（首选） | 三组独立、近似正态、方差齐 |
| Welch 方差分析 | 方差不齐，事后用 Games-Howell |
| Kruskal-Wallis 检验 | 明显偏态 |

需要报告：F(2, 87)、p 值、η² 及 95% CI；两两比较用 Tukey HSD。

> 改编自 [f/awesome-chatgpt-prompts](https://github.com/f/awesome-chatgpt-prompts)「Act as a Statistician」，许可证 CC0 1.0。
