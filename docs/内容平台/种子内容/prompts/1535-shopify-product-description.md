---
title: Shopify 独立站产品描述提示词（英文产品页：扫读结构、卖点与规格表、SEO 标题与描述、FAQ）
slug: shopify-product-description
model: any-llm
topics: [ecommerce-ops, copywriting]
needsRefImage: false
useCase: 用 Shopify、WooCommerce 等建站工具做独立站时，写英文产品详情页用：写出适合扫读的产品描述（开头一句价值、卖点小标题、规格表、使用与保养、FAQ），同时给出页面 SEO 标题、Meta 描述和图片 alt 文字。
prompt: |
  You are a DTC e-commerce copywriter. 请用中文和我沟通，产品页内容用英文写，并附中文对照。

  品牌与产品：[品牌与产品]
  目标市场与顾客：[目标市场]
  品牌语气：[品牌语气]
  卖点（附依据）：[卖点依据]
  规格参数（尺寸、材质、重量、容量、兼容性）：[规格参数]
  包装内容、配送与退换政策要点（以店铺政策为准）：[配送退换]
  顾客常问的问题：[常见问题]
  目标关键词：[目标关键词]

  请输出：
  1. 产品名称（Product title）：清楚说明是什么，可含一个关键属性。
  2. 开头一段（2–3 句）：这个产品为谁解决什么问题，用顾客的语言。
  3. 卖点区：3–5 个小标题 + 每个 1–2 句说明（功能 → 对顾客的意义），适合手机扫读。
  4. 规格表：用表格列出参数，单位按目标市场习惯（如英寸 / 厘米并列）。
  5. 使用与保养（如适用）。
  6. FAQ：4–6 个问题，优先回答下单前的顾虑（尺寸、材质安全、配送时间、退换）。
  7. SEO：页面标题（SEO title）、Meta description、URL handle 建议、主要图片的 alt 文字，自然包含目标关键词但不堆砌。
  8. 中文对照。
  约束：不夸大功效和认证；环保、无毒、有机等宣称必须有依据，否则不写；配送与退换信息与店铺政策页一致；不复制其他品牌的产品描述。
negativePrompt: null
source: null
verify:
  - 目标市场对环保、健康类宣称的广告规定以当地法规为准（如美国 FTC 的相关指南）
  - 示例中的品牌为虚构
---
**怎么填变量**：[卖点依据] 每条后面写上依据，比如「防滑底（橡胶材质，内部倾斜测试 30° 不滑动）」。[配送退换] 必须和你的店铺政策页一致，不一致时以政策页为准修改。

**常见坑**：
- 照搬供应商给的中式英文描述或 1688 页面的翻译，读起来不专业，也和其他卖家重复；
- 堆砌形容词（premium, perfect, amazing），没有具体信息；
- 写「eco-friendly」「non-toxic」却没有依据，在一些市场可能违反广告规定。

**迭代追问**：「为这个产品写 3 条 Instagram 帖子文案」「把产品页翻译成德语，注意本地化」「根据这个产品页，写一封新品上架的邮件」。

### 示例输出

> 示例，仅供参考（虚构品牌：Kilnly 手工陶瓷杯）

**Opening**: Your morning coffee deserves a mug that feels good in your hands. Each Kilnly mug is wheel-thrown in small batches, so yours will be one of a kind.

**Why you'll love it**
- **Comfortable handle** – Fits three fingers, so it doesn't tip when it's full.
- **Everyday tough** – Microwave and dishwasher safe.

| Spec | Detail |
|---|---|
| Capacity | 12 oz (355 ml) |
| Height | 3.7 in (9.5 cm) |

**中文对照（开头）**：你的早晨咖啡，值得一只握着舒服的杯子……
