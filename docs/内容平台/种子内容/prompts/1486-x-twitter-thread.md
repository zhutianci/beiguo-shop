---
title: X（Twitter）推文串 Thread 提示词（英文：首推钩子、编号结构、每条一个观点、收尾 CTA，附中文对照）
slug: x-twitter-thread
model: any-llm
topics: [social-media, copywriting]
needsRefImage: false
useCase: 出海品牌、独立开发者、创作者在 X（原 Twitter）分享经验、教程、产品更新时用：把一篇文章或一段经验拆成结构清楚的推文串（Thread），每条在字数限制内、能单独被转发，开头抓人、结尾有行动引导。
prompt: |
  请担任一名在 X 上有经验的英文内容创作者，帮我写一个 Thread。请用中文和我沟通，推文用英文。

  主题：[Thread主题]
  素材（经验、步骤、数据、案例）：[Thread素材]
  我的身份与可信度：[我的身份]
  目标读者：[目标读者]
  Thread 长度：[推文条数]
  结尾希望读者做什么：[期望行动]

  请输出：
  1. 首推（Tweet 1）3 个版本：说清楚这个 Thread 会给读者什么（例如「I spent 2 years doing X. Here are 7 lessons:」），用具体数字或结果，但不夸张。
  2. 正文推文：每条一个观点或一个步骤，编号（如 2/、3/），每条控制在 [单条字符上限] 字符以内，并标出字符数；每条能脱离上下文被单独理解。
  3. 节奏：每 3–4 条插入一条例子、数据或「误区」，避免全是抽象建议；标注适合配图或截图的推文。
  4. 收尾推文：总结 + 一个行动引导（关注、回复、查看链接）；如果要放链接，建议放在最后一条或回复里。
  5. 中文对照，方便我检查。
  6. 首推的 2 个 A/B 备选，以及发布后可以在回复里补充的内容。
  约束：不编造数据和经历；不使用「This will blow your mind」等夸张表达；不抄袭他人的 Thread；涉及他人作品时注明出处。
negativePrompt: null
source: null
verify:
  - X 单条推文的字符上限因账户类型而异，以平台当前规定为准
  - 示例中的内容为虚构
---
**怎么填变量**：[Thread素材] 可以是一篇写好的博客、一份笔记或项目复盘，AI 会负责拆分。[推文条数] 一般 6～12 条，太长读者会中途离开。[单条字符上限] 按你的账户类型和平台当前规定填写。

**常见坑**：
- 首推太含糊（「Some thoughts on marketing」），没有人有理由继续往下看；
- 每条推文都依赖上一条才能看懂，被单独转发时就失去意义；
- 链接放在首推，可能影响曝光，建议放在最后或回复里。

**迭代追问**：「把这个 Thread 改写成 LinkedIn 帖子」「把 Thread 整理成一篇博客文章的大纲」「为这个 Thread 准备 3 条回复评论的模板」。

### 示例输出

> 示例，仅供参考（虚构：独立开发者分享做出第一个付费工具的经验）

**1/** I launched a tiny Chrome extension last year. It now pays my rent.
Here are 8 things I wish I'd known before writing a single line of code: 🧵

**2/** Talk to 10 users before building.
I skipped this. My first version solved a problem nobody had. (98)

**3/** Charge from day one.
Free users gave me feedback. Paying users gave me *useful* feedback. (95)

**中文对照**：1/ 去年我上线了一个小小的 Chrome 插件，现在它能付我的房租。下面是我写第一行代码之前就希望知道的 8 件事……
