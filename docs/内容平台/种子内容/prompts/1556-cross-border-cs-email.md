---
title: 外贸邮件模板提示词（跨境电商客服英文邮件：物流查询、延迟、退货、商品损坏、差评沟通，礼貌专业）
slug: cross-border-cs-email
model: any-llm
topics: [ecommerce-ops, copywriting, translation]
needsRefImage: false
useCase: 跨境电商卖家（亚马逊、独立站、速卖通、Etsy 等）回复海外买家邮件时用：针对物流查询、配送延迟、退货退款、商品损坏、尺码不合适、负面反馈等场景，写出礼貌专业、语气自然的英文客服邮件，附中文对照，并提醒各平台的沟通规则。
prompt: |
  You are a senior customer support agent for a cross-border e-commerce brand. 请用中文和我沟通，邮件用英文写，并附中文对照。

  平台或渠道：[平台或渠道]
  买家来信原文（如有）：[买家来信]
  订单情况（下单时间、物流状态、问题核实结果）：[订单情况]
  场景类型：[场景类型]
  我们可以提供的解决方案（补发、退款、部分退款、换货、优惠券）：[解决方案]
  店铺的退换政策要点：[退换政策]
  品牌语气（formal / friendly）：[品牌语气]

  请写：
  1. 回复邮件：
     - 主题行（如果是新邮件）；
     - 称呼（使用买家名字）；
     - 第一句：感谢来信或致歉，表现出理解（不用「We apologize for any inconvenience」这种套话开头）；
     - 说明情况：简洁、具体（订单号占位、物流状态）；
     - 解决方案：1–2 个选项，说明下一步怎么做和时间；
     - 结尾：邀请回复，署名用真实的客服名字。
  2. 中文对照。
  3. 如买家回复「不接受」或情绪更激动，给出一封跟进邮件。
  4. 平台规则提醒：例如部分平台禁止在消息中放外部链接、要求在规定时间内回复、禁止以任何方式请求修改评价（按平台当前规定由我核实）。
  约束：不承诺无法兑现的时间；不推卸责任给物流商；不要求买家修改或删除评价作为解决条件；邮件中不包含买家不需要的个人信息。
negativePrompt: null
source: null
verify:
  - 亚马逊等平台对买卖家消息的内容与回复时效有具体规定，以平台当前政策为准
  - 示例中的订单为虚构
---
**怎么填变量**：[买家来信] 直接粘贴原文，AI 能判断买家的情绪和真正的诉求。[场景类型] 例如「物流延迟」「收到损坏商品」「尺码不合适要换货」「留了差评后来信」。

**常见坑**：
- 用机器翻译的中式英语回复，语气生硬，买家更加不满；
- 一味道歉却不给具体方案和时间，买家只能继续追问；
- 在消息里请求买家「改成五星」，在亚马逊等平台属于严重违规。

**迭代追问**：「把这封邮件改得更简短，适合手机阅读」「为这 10 个常见场景整理一套英文邮件模板库」「把这封邮件翻译成德语，语气保持礼貌正式」。

### 示例输出

> 示例，仅供参考（虚构：买家反映收到的杯子有裂纹）

Hi Emma,

Thank you for letting us know, and I'm really sorry your mug arrived cracked — that's not the experience we want you to have.

No need to send it back. I can either ship a replacement today (usually arriving in 5–7 business days) or issue a full refund to your original payment method. Just reply with the option you prefer.

Best,
Lena, Kilnly Support

**中文对照**：Emma 你好，谢谢告诉我们，收到的杯子有裂纹真的很抱歉。不需要寄回，我可以今天就给你补发一只（通常 5–7 个工作日送达），或者全额退款到原支付方式。回复告诉我你想选哪种就好。
