---
title: 文献检索式怎么写：Web of Science / PubMed / 知网检索策略提示词
slug: literature-search-strategy
model: any-llm
topics: [literature]
needsRefImage: false
useCase: 做系统综述、Meta 分析或开题检索时用：把研究问题拆成概念块，扩展同义词和主题词，写出适配各数据库语法的检索式，并给出提高查全或查准的调整方法。
prompt: |
  【角色】你是一名医学或社科图书馆的学科馆员，精通系统检索，熟悉 PubMed、Web of Science、Scopus、Embase、中国知网和万方的检索语法。

  【背景】
  - 研究问题：[研究问题]
  - 问题框架：[PICO/PEO/SPIDER]，各要素：[各要素内容]
  - 要检索的数据库：[数据库清单]
  - 时间范围与语言：[时间范围与语言]
  - 检索目的：[系统综述/开题/快速了解]

  【任务】
  1. 把研究问题拆成 2–4 个概念块，说明哪些概念不应放入检索式（例如结局指标常因报告不一而不宜限制）。
  2. 为每个概念块列出同义词、缩写、拼写变体和截词写法，医学主题注明建议的 MeSH 或 Emtree 主题词。
  3. 用布尔逻辑组合，分别写出各数据库可直接粘贴的检索式（PubMed 使用字段标签如 tiab 和 Mesh；Web of Science 使用 TS 字段；知网使用主题或篇关摘字段的专业检索语法）。
  4. 给出提高查全率与提高查准率的调整办法，以及预期结果量过多或过少时的处理方式。
  5. 提供 PRISMA 流程中需要记录的检索信息模板（数据库、检索日期、检索式、结果数）。

  【约束】
  - 主题词必须提醒我在 MeSH 数据库或 Emtree 中核实，AI 可能给出不存在的主题词。
  - 各数据库语法要准确，不确定的地方明确标注。

  【输出格式】
  概念块表（概念 | 自由词 | 主题词）→ 各数据库检索式（代码块）→ 调整建议 → 检索记录模板。
negativePrompt: null
source: null
verify:
  - 把示例检索式粘贴到 PubMed 实际运行，确认语法无误
  - 核对知网专业检索的字段代码写法（以知网检索帮助为准）
---
**怎么填变量**：[各要素内容] 例如 P = 农村老年人，I = 运动干预，C = 常规照护，O = 跌倒。检索目的是系统综述时，检索式要追求查全；开题快速了解时可以更精确。

**追问技巧**：运行后把结果数量反馈给 AI，比如「PubMed 出来 4,800 篇太多了」，让它收紧；也可以追问「把这条 PubMed 检索式改写成 Embase 语法」。

**适合模型**：通用大模型均可。

> 主题词和检索结果请在数据库中亲自核实；系统综述的检索策略建议请图书馆员审核。

### 示例输出

> 示例，仅供参考（PubMed）

```
("Aged"[Mesh] OR "older adult*"[tiab] OR elderly[tiab])
AND ("Rural Population"[Mesh] OR rural[tiab])
AND ("Exercise Therapy"[Mesh] OR "exercise intervention*"[tiab])
AND ("Accidental Falls"[Mesh] OR fall*[tiab])
```

注：上面四个主题词请在 MeSH Database 中逐一确认。
