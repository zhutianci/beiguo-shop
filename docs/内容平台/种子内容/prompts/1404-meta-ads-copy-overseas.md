---
title: Facebook / Instagram 广告文案提示词（出海英文广告：Primary text、Headline、Description、CTA 全套）
slug: meta-ads-copy-overseas
model: any-llm
topics: [copywriting, marketing]
needsRefImage: false
useCase: 做跨境电商、出海 App 在 Facebook、Instagram 投放广告时用：按受众和漏斗阶段写出地道的英文广告文案全套字段，并附中文对照，方便国内团队审核。
prompt: |
  【角色】你是一名为海外 DTC 品牌写广告的英文母语文案，熟悉 Meta 广告的字段结构和欧美消费者的阅读习惯：口语化、直接、具体，讨厌夸张的营销腔。
  【输入】
  - 产品与卖点：[产品与卖点]
  - 目标市场与受众：[目标市场]
  - 漏斗阶段：[冷启动 / 再营销 / 复购]
  - 品牌语气（如 playful、premium、no-nonsense）：[品牌语气]
  - 真实的优惠、保障（如免运费、退货政策）：[优惠与保障]
  - 可用的社会证明（真实评价数、媒体报道，没有写无）：[社会证明]
  【任务】
  1. 先用中文分析：这个受众在这个漏斗阶段最大的顾虑是什么，广告应该先解决哪个顾虑。
  2. 写 3 套完整广告，每套包含：
     - Primary text：短版（首句就是钩子）和长版（3–5 句，含具体细节）各一条；
     - Headline 2 条；Description 1 条；
     - 推荐的 CTA 按钮（如 Shop Now、Learn More）并说明理由。
  3. 三套分别侧重：痛点解决、产品体验细节、优惠与保障。
  4. 每套附中文直译，方便国内团队审核意思是否准确。
  5. 列出针对该市场的本地化提醒：单位、拼写（美式 / 英式）、节日、文化禁忌。
  【约束】
  - 各字段长度控制在：Primary 短版 [短版字符数] 字符内、Headline [标题字符数] 字符内，并标注实际字符数。
  - 避免 Meta 广告政策不允许的写法：直接点出用户的个人特征（如健康、财务、身材状况）、夸大前后对比、虚假紧迫感。
  - 社会证明只用我提供的真实数据；不编造评价、星级、媒体名称。
  - 避免中式英语和堆砌形容词（amazing、perfect、best ever）。
  【输出格式】顾虑分析（中文）→ 3 套广告（英文 + 中文对照，标注字符数）→ 本地化提醒。
negativePrompt: null
source: null
verify:
  - Meta 广告各字段的建议长度与广告政策以 Meta 官方广告规范当前版本为准
  - 示例中的品牌为虚构
---
**怎么填变量**：[目标市场] 写到国家和人群，比如「美国、25～40 岁、住公寓的养猫人士」；不同国家的语气差别很大，英国用户对夸张表达更反感。[社会证明] 只填真实的，例如「独立站 1,200 条评价，平均 4.6 星」，没有就写无，AI 会改用产品细节建立信任。字符数上限请按 Meta 当前的建议值填写。

**常见坑**：
- 直接把中文文案机翻成英文：语序和卖点表达都不自然，这条提示词要求先分析受众顾虑再从英文思路写；
- 文案里出现「you」+ 个人特征的句式（如身体、财务、健康状况），容易被拒审，生成后要再检查一遍；
- 堆砌 emoji 和全大写单词，在欧美用户眼里像垃圾广告。

**迭代追问**：「把第一套改成英式英语，语气更克制」「为这 3 套广告各写 3 个不同的首句钩子，用于 A/B 测试」「检查这些文案是否有可能违反 Meta 广告政策的表达」。

### 示例输出

> 示例，仅供参考（虚构品牌：Purrch 猫抓板，美国市场，冷启动）

**顾虑分析**：第一次看到的人最担心「猫不用、白买」和「看起来丑，放客厅不搭」。

**Set 1 · 痛点解决**
- Primary (short): Your couch called. It wants a break. (36)
- Primary (long): Most cats scratch furniture because their scratcher wobbles. Ours is weighted at the base, so it stays put — and cats actually use it. Free returns within 30 days if yours ignores it.
- Headline: A scratcher cats won't ignore (29)
- CTA: Shop Now（冷启动但有明确退货保障，可以直接引导购买）
- 中文对照：你的沙发来电话了，它想歇一歇。猫抓沙发，多半是因为抓板会晃……
