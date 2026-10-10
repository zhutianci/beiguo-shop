---
title: LinkedIn 帖子怎么写提示词（英文职业帖：开头钩子、个人故事、观点与讨论问题，附中文对照）
slug: linkedin-post-writing
model: any-llm
topics: [social-media, copywriting, career]
needsRefImage: false
useCase: 求职者、职场人、创业者、出海企业在领英（LinkedIn）发帖建立职业影响力时用：把一次经历、一个行业观察或项目成果写成地道的英文职业帖，结构清楚、有个人观点，并附中文对照方便自己检查。
prompt: |
  You are a LinkedIn ghostwriter for professionals. 请用中文和我沟通，帖子正文用英文写。

  我是谁（职位、行业、经历）：[我的身份]
  想写的主题类型（经验分享、行业观察、项目成果、求职动态、招聘）：[主题类型]
  素材（发生了什么、数据、我的思考）：[帖子素材]
  想让读者得到的一个收获：[读者收获]
  目标读者：[目标读者]
  语气：[语气]

  请完成：
  1. 3 个开头钩子（Hook）：第一行要在「…see more」折叠前抓住人，分别用：一个具体的时刻、一个反常识观点、一个数字。避免「I'm thrilled to announce」式开头，除非确实是公告。
  2. 正文（约 [正文词数] 个英文单词）：
     - 短段落，每段 1–3 句，方便手机阅读；
     - 结构：场景或故事 → 发生了什么 / 我学到了什么 → 具体可借鉴的 2–3 点 → 一个开放式问题邀请讨论；
     - 用第一人称，具体细节代替空泛形容词。
  3. 3–5 个相关 hashtag（不堆砌）。
  4. 中文对照译文，方便我检查意思。
  5. 发布建议：是否适合配图或做成文档轮播（carousel），首条评论可以补充什么。
  约束：不编造经历、数据和头衔；提及前雇主、客户、同事时注意保密协议与隐私，未经同意不点名；不贬低他人；不做夸张的「励志鸡汤」。
negativePrompt: null
source: null
verify:
  - 示例中的人物与经历为虚构
---
**怎么填变量**：[帖子素材] 越具体越好，例如「上个月我们把客户 onboarding 的时间从 3 周缩短到 5 天，关键是砍掉了 2 个审批环节」。[正文词数] 一般 120～250 个单词，太长在手机上读起来吃力。

**常见坑**：
- 开头就是一大段背景介绍，读者在折叠前看不到任何有吸引力的内容；
- 中式英语和过度正式的表达（「I would like to share with you that…」），读起来像邮件；
- 在帖子里透露客户名称、内部数据，可能违反保密协议。

**迭代追问**：「把这篇帖子改成更简短、更像随手分享的版本」「为这个主题写一个 5 页的 LinkedIn 文档轮播大纲」「帮我写 3 条回复评论区的英文模板」。

### 示例输出

> 示例，仅供参考（虚构：B2B 软件公司的客户成功经理，主题：经验分享）

**Hook（具体时刻）**: Last March, a client told me: "Your product is great. Your onboarding is not."

**Body (excerpt)**:
It took us 3 weeks to get a new customer live.
We assumed the problem was training.
It wasn't. It was two approval steps nobody needed.

We removed them. Onboarding now takes 5 days.

What I learned:
→ Ask customers where they wait, not where they struggle.
→ ……

What's one step in your process that only exists because "we've always done it"?

**中文对照**：去年三月，一位客户对我说：「你们的产品很好，但上手流程不行。」……
