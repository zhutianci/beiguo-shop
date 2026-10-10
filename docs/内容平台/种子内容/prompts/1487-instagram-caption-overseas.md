---
title: Instagram 文案提示词（出海品牌英文 caption：开头钩子、正文、CTA、分层 hashtag 与图片 alt text）
slug: instagram-caption-overseas
model: any-llm
topics: [social-media, copywriting, marketing]
needsRefImage: false
useCase: 出海品牌、跨境电商、海外个人账号在 Instagram 发帖时用：根据图片或 Reels 内容写出地道的英文 caption，包括折叠前的钩子、正文、行动引导、分层话题标签和无障碍的 alt text，并附中文对照。
prompt: |
  请扮演一名海外品牌的 Instagram 社媒经理，用中文和我沟通，caption 用英文。

  品牌与产品：[品牌与产品]
  这条帖子的内容（图片 / 轮播 / Reels 画面描述）：[帖子内容]
  帖子目的（种草、新品、教程、用户故事、活动）：[帖子目的]
  目标受众与市场：[目标受众]
  品牌语气：[品牌语气]
  需要包含的信息（价格、链接位置、活动规则）：[必含信息]

  请输出：
  1. 3 个开头钩子：caption 第一行是折叠前唯一能看到的内容，要和画面呼应。
  2. 完整 caption（长短各一版）：
     - 短版 1–2 句，适合视觉主导的帖子；
     - 长版 3–6 句，讲一个使用场景或小故事，用换行分段；
     - 结尾一个具体的行动引导（如「Save this for your next trip」「Tell us in the comments…」）。
  3. Hashtag 分层：大流量标签 2–3 个、细分领域标签 4–6 个、品牌或活动专属标签 1–2 个，说明各自作用；总数不过多。
  4. Alt text：为图片写一段描述性的替代文字，帮助视障用户理解图片内容（客观描述画面，不塞关键词）。
  5. 中文对照。
  6. 如果是 Reels：给出画面上的文字（on-screen text）3 条建议。
  约束：避免堆砌 emoji 和全大写；不夸大功效；与达人合作或付费推广按平台规则使用「Paid partnership」等标识；涉及抽奖时写清规则并声明与平台无关。
negativePrompt: null
source: null
verify:
  - Instagram 的品牌内容标识、抽奖推广规则以 Meta 官方政策为准
  - 示例中的品牌为虚构
---
**怎么填变量**：[帖子内容] 要描述清楚画面，比如「轮播第 1 张是放在窗台上的陶瓷杯，阳光从左边照进来；第 2–4 张是不同颜色」。[品牌语气] 可以写参考词，如「warm, calm, a little playful」。

**常见坑**：
- caption 第一行写品牌名或一串 emoji，折叠后用户看不到任何有用信息；
- 一次放二三十个 hashtag，看起来像垃圾账号，效果也不一定更好；
- 不写 alt text：既不利于无障碍访问，也失去了一次准确描述内容的机会。

**迭代追问**：「为这周的 5 条帖子写一组风格统一的 caption」「把这条 caption 改写成英式英语，语气更克制」「根据评论区的这些问题，帮我写英文回复」。

### 示例输出

> 示例，仅供参考（虚构品牌：Kilnly 手工陶瓷杯，轮播图）

**Hook**: Some mornings need a slower cup.

**Long caption**:
Some mornings need a slower cup.
Each Kilnly mug is thrown by hand, so no two glazes come out exactly the same.
Swipe to see this week's batch — which one would you pick? 👇

**Hashtags**: #ceramics #handmadepottery #slowmorning #kilnlybatch

**Alt text**: A pale blue handmade ceramic mug on a wooden windowsill, morning sunlight coming from the left, steam rising from the coffee inside.

**中文对照**：有些早晨，值得一杯慢一点的咖啡……
