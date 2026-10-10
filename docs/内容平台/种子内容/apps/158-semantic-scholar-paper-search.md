---
title: "Semantic Scholar 是什么：免费 AI 学术搜索引擎怎么用（含 API Key 申请）"
slug: semantic-scholar-paper-search
name: Semantic Scholar
url: https://www.semanticscholar.org/
pricing: 免费
platforms: 网页 / API
trialNote: 检索、TLDR 摘要、文献库、研究推送和 API 都免费；保存文献和订阅推送需要注册
products: [ai-tools]
models: []
topics: [literature, paper-writing, research-data]
excerpt: Semantic Scholar 是艾伦人工智能研究所（Ai2）运营的免费学术搜索引擎，收录 2 亿多篇论文，提供一句话 TLDR 摘要、引用关系、Semantic Reader 阅读器和免费 API。本文讲清怎么用、和谷歌学术有什么不同、API Key 怎么申请。
checkedOn: 2026-10-07
sources:
  - https://www.semanticscholar.org/about
  - https://www.semanticscholar.org/product/api
  - https://www.semanticscholar.org/product/semantic-reader
  - https://www.semanticscholar.org/faq
---

> 本文根据 Semantic Scholar 官网「关于」、API 和产品说明页整理，资料核对于 2026-10-07。

## 是什么

Semantic Scholar 是美国非营利机构**艾伦人工智能研究所（Ai2）**在 2015 年推出的学术搜索引擎。Ai2 由微软联合创始人保罗·艾伦创立。它收录了 2 亿多篇来自出版商合作、数据供应商和网页抓取的学术论文，**全部功能免费**。

和谷歌学术相比，它更强调用 AI 帮你「读懂」论文：每篇论文有一句话的 TLDR 摘要，能看出哪些引用是「高影响力引用」，还有带辅助功能的论文阅读器。它的数据也被很多 AI 科研工具当作底层文献库使用（例如 Elicit 的论文库就包含它的数据）。

## 能做什么

- **检索论文**：按关键词、作者、期刊搜索，按年份、研究领域、是否有 PDF 等条件过滤。
- **TLDR 摘要**：AI 为论文生成一句话概括，浏览结果列表时不用逐篇点开摘要。
- **引用关系**：查看一篇论文被谁引用、引用了谁，并标出有影响力的引用，方便顺藤摸瓜找经典文献。
- **Semantic Reader**：在线阅读器，点击文中的引用标记就能弹出那篇被引论文的信息卡片，不用来回翻参考文献。
- **Library 与 Research Feeds**：把论文存进文献库，系统据此每天推荐新论文；也可以订阅作者或论文的新引用提醒。
- **作者主页**：查看学者的论文列表、引用数、h 指数等。
- **免费 API 与数据集**：开放学术图谱 API（2.14 亿篇论文、24.9 亿条引用、7900 万作者）和 S2ORC 等语料。

## 怎么上手

1. 打开 semanticscholar.org，直接在搜索框输入英文关键词，例如「retrieval augmented generation evaluation」。
2. 在结果页先看每条的 TLDR，再用左侧的年份、领域筛选缩小范围。
3. 打开一篇论文，看「Citations」和「References」，找出高被引、有影响力的相关研究。
4. 有 PDF 的论文可以点「Semantic Reader」在线阅读。
5. 注册账号（邮箱或 Google 等账号）后，把论文存入 Library，开启 Research Feeds 接收推荐。
6. 开发者需要 API：在 API 页面点「Request an API key」提交申请，审核通过后 Key 会发到邮箱。

## 免费与付费

Semantic Scholar 是**完全免费**的公益项目，没有付费会员。API 大部分接口不需要认证就能调用：未认证用户共享每秒 1000 次请求的总额度，高峰期可能被限流；申请 API Key 后，起始额度是每个 Key 每秒 1 次请求（官网 API 页面，2026-10 查询），更高额度需向官方说明用途申请。

## 适合谁 / 不适合谁

**适合：**

- 写论文、做综述，需要顺着引用关系系统找文献的学生和研究者；
- 想快速判断一篇论文值不值得读的人（看 TLDR 和高影响力引用）；
- 计算机、生物医学等英文文献为主的领域；
- 做科研工具、文献分析的开发者（免费 API 和数据集）。

**不适合：**

- 想直接让 AI 回答研究问题、生成综述的人：它主要是检索和阅读辅助，这类需求可以看 Elicit、Consensus；
- 中文文献为主的研究：中文期刊覆盖有限，知网等更合适；
- 需要直接下载付费期刊全文的情况：它只提供有开放获取版本的 PDF 链接。

## 注意事项

- TLDR 是 AI 自动生成的，可能不准确，引用前读原文摘要和正文。
- 引用数据来自自动解析，个别论文的引用数、作者归属可能有误；作者可以认领主页并修正。
- 通过 API 获取的数据使用要遵守官方的 API 许可协议。
