---
title: 购物车挽回邮件提示词（弃购挽回 3 封序列：提醒、解答顾虑、可选优惠，独立站与跨境电商适用，不制造虚假紧迫）
slug: abandoned-cart-email
model: any-llm
topics: [ecommerce-ops, copywriting, marketing]
needsRefImage: false
useCase: 独立站（Shopify 等）或跨境电商店铺设置购物车放弃（Abandoned Cart）自动邮件时用：写出 2～3 封间隔合理的挽回邮件，第一封友好提醒、第二封解答常见顾虑、第三封视情况提供优惠，中英文都可以，带退订与合规说明。
prompt: |
  You are a lifecycle email marketer for DTC brands. 请用中文和我沟通，邮件可以按我指定的语言写。

  店铺与品牌语气：[店铺与语气]
  商品类型与客单价：[商品与客单价]
  买家常见的放弃原因（运费、尺码、信任、比价、支付）：[放弃原因]
  可提供的保障（免运费门槛、退换政策、支付方式、客服响应时间）：[店铺保障]
  是否愿意在最后一封提供优惠：[优惠意愿]
  邮件语言：[邮件语言]

  请设计邮件序列：
  1. 序列总览：第几封 | 发送时间（如放弃后 1 小时、24 小时、72 小时，按你的建议）| 目的 | 停止条件（已下单、已退订）。
  2. 每封邮件：
     - 主题行 2 个 + 预览文本；
     - 正文：
       · 第 1 封：轻松提醒「你的购物车还在」，展示商品图片与名称占位，一个返回购物车的按钮；
       · 第 2 封：针对常见放弃原因，用 2–3 条简短信息解答顾虑（运费、退换、尺码帮助、真实的买家评价摘录——只用已获授权的真实评价）；
       · 第 3 封（可选）：如果我愿意提供优惠，说明优惠与有效期（真实的期限）；如果不提供，就改为「需要帮忙吗」的客服邀请。
     - 按钮文案、退订链接、发件方信息占位。
  3. 个性化建议：可以插入的动态字段（商品名、图片、价格）。
  4. 衡量指标：打开率、点击率、挽回订单率、退订率。
  约束：不使用虚假倒计时、「库存仅剩 1 件」除非属实；不对同一买家频繁发送；遵守目的地的电子邮件营销法规（如 CAN-SPAM、GDPR 对同意与退订的要求）。
negativePrompt: null
source: null
verify:
  - 弃购邮件的发送许可与退订要求因地区而异，以 CAN-SPAM、GDPR 等适用法规为准
  - 示例中的店铺为虚构
---
**怎么填变量**：[放弃原因] 可以从结账页的流失数据、客服咨询中判断，比如很多人在看到运费那一步离开，第 2 封邮件就重点讲免运费门槛。[优惠意愿] 不一定要给折扣，频繁给优惠会让买家养成「先加购等折扣」的习惯。

**常见坑**：
- 第一封就给折扣，买家学会了「放弃购物车就有券」；
- 邮件写「最后 1 件！倒计时 10 分钟」，但实际并不是，属于虚假紧迫；
- 买家已经下单了还在收挽回邮件，显得系统很混乱。

**迭代追问**：「把这组邮件翻译成德语和法语」「为高客单价商品（超过 300 美元）改写一版，更强调售后保障」「根据一个月的数据，帮我优化发送时间」。

### 示例输出

> 示例，仅供参考（虚构：Kilnly 陶瓷杯独立站，英文）

**Email 1（1 小时后）**
- Subject: Still thinking it over?
- Preview: Your mugs are waiting in your cart.
- Body: Hi {first_name}, you left something behind. We've saved your cart, so you can pick up right where you left off. [Return to cart]

**Email 2（24 小时后）**
- Subject: A few things people usually ask
- Body: Free shipping on orders over $50 · 30-day returns · Each mug is packed in recycled paper so it arrives in one piece.
