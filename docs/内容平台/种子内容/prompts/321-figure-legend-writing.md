---
title: 论文图注怎么写：Figure Legend 规范撰写提示词（中英文）
slug: figure-legend-writing
model: any-llm
topics: [research-figure, paper-writing]
needsRefImage: false
useCase: 图画好了不知道图注该写什么时用：按「标题句 + 各面板说明 + 统计信息」结构写出规范图注，并检查样本量、误差线含义、统计方法是否遗漏。
prompt: |
  【角色】你是一名经验丰富的科研论文编辑，熟悉生命科学和医学期刊对图注（figure legend）的要求。

  【背景】
  - 图的整体结论：[整体结论]
  - 各面板内容：[各面板内容]
  - 样本量及其含义：[n 及含义，如生物学重复]
  - 误差线含义：[SD/SEM/95% CI]
  - 统计检验与校正方法：[统计检验方法]
  - 显著性标注规则：[星号规则或精确 p 值]
  - 语言与字数限制：[中文/英文，字数上限]

  【任务】
  1. 写标题句：一句话概括本图的主要发现（不是简单描述图类型）。
  2. 按面板顺序（A、B、C……）逐一说明每个面板展示的内容。
  3. 在结尾集中写统计信息：数据表示方式、n 的含义、检验方法、显著性符号定义。
  4. 定义图中出现的所有缩写。
  5. 检查并列出我遗漏的必要信息。

  【约束】
  - 只使用我提供的信息，不补造样本量、p 值或实验条件；缺失的写「【待补】」。
  - 图注中不重复讨论或解释结果的意义（那是正文的任务）。
  - 时态和术语与正文一致。

  【输出格式】
  图注全文 → 缺失信息清单 → 若超字数，给出精简版。
negativePrompt: null
source: null
verify:
  - 检查示例图注是否同时写明 n 的含义、误差线含义和统计方法
---
**怎么填变量**：[n 及含义] 最常被审稿人追问——「n = 3」到底是 3 只动物、3 次独立实验还是 3 个技术重复，一定要写清楚。[各面板内容] 按「A：……；B：……」逐条写。

**追问技巧**：可以追问「按 [目标期刊] 的图注格式调整」，或把正文对应段落一起贴进去，让它检查图注与正文的数字是否一致。

**适合模型**：通用大模型均可。

> 图注中的所有数字须与原始数据和统计输出一致。

### 示例输出

> 示例，仅供参考

**Figure 2. Metabolite X attenuates liver fibrosis in CCl₄-treated mice.**
(A) Representative Sirius Red staining of liver sections. Scale bar, 100 μm. (B) Quantification of collagen area. (C) Hepatic hydroxyproline content. Data are presented as mean ± SD; each dot represents one mouse (n = 8 per group). Statistical significance was determined by one-way ANOVA with Tukey's post hoc test. **p < 0.01, ***p < 0.001.

**缺失信息**：染色图片的放大倍数【待补】。
