---
title: 外贸开发信怎么写：个性化开发信与 2～3 封跟进邮件提示词（高回复率结构，不群发骚扰）
slug: cold-email-b2b-outreach
model: any-llm
topics: [copywriting, marketing]
needsRefImage: false
useCase: 外贸业务员、B2B 销售联系潜在客户时用：根据对方公司的公开信息写一封个性化的英文开发信，再配 2～3 封间隔合理的跟进邮件，用低门槛的问题换取回复。
prompt: |
  You are an experienced B2B export sales manager. 请用中文和我沟通、用英文写邮件。

  ★ 我方信息
  公司与产品：[我方产品]
  核心优势（可证实，如认证、产能、交期、定制能力）：[我方优势]
  已有的同类客户或市场（可公开的）：[参考客户]

  ★ 目标客户信息（来自对方官网、展会、公开资料）
  公司名与业务：[客户业务]
  联系人及职位：[联系人职位]
  我观察到的一个具体细节（新品线、扩张、招聘、展会动态）：[观察细节]
  我推测对方可能面临的问题：[推测问题]

  ★ 请完成
  1. 开发信第一封（正文不超过 [首封词数] 个英文单词）：
     - 主题行 3 个备选：具体、像同行之间的邮件，不用「Best Price」「Dear Purchasing Manager」；
     - 第一句提到我观察到的细节，证明这不是群发；
     - 一句话说清我们能为对方解决什么（与推测问题对应）；
     - 一个可证实的理由让对方相信；
     - 结尾只问一个容易回答的问题（例如是否需要样品目录、现在由谁负责这个品类），不直接要求下单或通话。
  2. 跟进第 2 封（第一封后 [间隔天数] 天）：补充一个新信息（案例、产品图、行业观察），不要写「Just following up」。
  3. 跟进第 3 封（最后一封）：礼貌收尾，给对方一个「不需要」的出口，并说明不会再打扰。
  4. 每封附中文翻译，并说明这封邮件的意图。
  5. 列出发送前自查清单：称呼、公司名拼写、附件大小、签名信息、退订或拒收说明。

  ★ 底线
  不夸大产能和资质，不编造合作客户；不使用虚假的「Re:」「Fwd:」主题伪装成往来邮件；对方明确拒绝后不再发送。
negativePrompt: null
source: null
verify:
  - 向海外客户发送商业邮件需遵守目的地的反垃圾邮件法规（如 CAN-SPAM、GDPR 对 B2B 邮件的要求）
  - 示例中的公司为虚构
---
**怎么填变量**：[观察细节] 决定了这封信能不能被打开后读下去，花 5 分钟看对方官网的 News 页面或领英动态就能找到，例如「你们今年在官网上新增了户外家具系列」。[首封词数] 一般 80～120 个单词，[间隔天数] 常见 3～5 天。

**常见坑**：
- 开头大段介绍自己公司历史和工厂面积，采购每天收几十封这样的信，看两行就删；
- 第一封就要求视频会议或下单，门槛太高；问一个能用一句话回复的问题，回复率会高很多；
- 用「Re:」伪装成回复邮件，短期可能提高打开率，但会被视为欺骗，也伤害发件域名信誉。

**迭代追问**：「对方回复说『目前有固定供应商』，帮我写一封不纠缠、但能保持联系的回复」「为同一个客户的另一位联系人（质量经理）改写一版」「检查这封邮件有没有中式英语」。

### 示例输出

> 示例，仅供参考（虚构：我方为竹制收纳品工厂，客户为欧洲家居零售商）

**Subject**: Bamboo storage for your new kitchen line

Hi Anna,

I saw on your website that you added a kitchen organisation range this spring. We make FSC-certified bamboo storage boxes and drawer dividers for European retailers, with custom sizes from 500 units.

Would it be helpful if I sent over a short catalogue of the sizes that fit standard EU drawers?

Best,
Leo

**中文意图**：用对方的新品线开头，只提供一个可证实的优势，最后用「要不要目录」这种好回答的问题换取第一次回复。
