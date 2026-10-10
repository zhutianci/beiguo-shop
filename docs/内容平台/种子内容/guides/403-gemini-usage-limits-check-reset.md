---
title: Gemini 怎么看额度：用量限制在哪查、多久重置、额度变少怎么办
slug: gemini-usage-limits-check-reset
products: [gemini]
models: [gemini-llm]
accountTier: FREE
excerpt: Gemini 的额度不是按条数算的，而是按计算量：每 5 小时刷新、另有每周上限。本文讲在哪里查看用量、各档会员的额度倍数、哪些操作最费额度、额度用完后会怎样，以及官方认可的省额度方法。
checkedOn: 2026-10-10
sources:
  - https://support.google.com/gemini/answer/16275805
  - https://support.google.com/gemini/answer/18648722
  - https://support.google.com/gemini/answer/15719111
  - https://support.google.com/gemini/answer/16345172
  - https://gemini.google/subscriptions/
  - https://support.google.com/googleone/answer/14534406
verify:
  - 「标准额度」具体相当于多少条消息：官方未公开，只给了各档的倍数
  - 每周上限在星期几、几点重置：帮助中心未写明，只说到达上限时通知里会告诉你何时刷新
  - 用 AI credits 延长 Gemini App 额度：订阅页脚注写「可以购买 AI credits 延长额度」，Google One 帮助页写 credits 用于 Flow、Antigravity 等支持的产品，是否适用于你的账号以界面为准
---

> 本文根据 Google 官方 Gemini 帮助中心和订阅页整理，核对日期 2026-10-10。官方注明额度「可能不经通知调整」，本文不写具体条数——因为官方也没有公布。

## 适用于谁

- 搜「gemini 怎么看额度」「gemini 额度重置」「gemini 额度变少」「gemini 限制次数」的人；
- 用着用着被提示到达上限，想知道要等多久的人；
- 想弄清楚升级会员到底能多用多少的人。

## 结论先说

1. **查看位置**：网页版左下角「设置（Settings）」→「用量限制（Usage Limits）」。
2. **怎么算**：按「计算量」而不是固定条数。和提问的复杂度、用的模型和功能、对话长度都有关。
3. **什么时候恢复**：**每 5 小时刷新一次，直到用完每周上限**；到达上限时，提示里会写明何时刷新。
4. **各档倍数**：AI Plus 是无订阅的 2 倍，AI Pro 是 4 倍，AI Ultra 是 AI Pro 的 5 倍或 20 倍。
5. **用完之后**：有订阅的可以继续用 Flash-Lite 聊天；没有订阅的只能等刷新或升级。

## 一、在哪里看自己的额度

1. 打开 gemini.google.com 并登录；
2. 点左下角「设置（Settings）」；
3. 选「用量限制（Usage Limits）」。

这个页面底部还有「自动选择模型」的开关（见第四节）。另外，快到上限时 Gemini 会主动提醒；到达上限时会再提示一次，并告诉你额度何时刷新。

## 二、额度是怎么算的

帮助中心的原话是：Gemini 采用「基于计算量的用量限制」，会综合考虑三件事——

- **提问有多复杂**；
- **用了哪些模型和功能**；
- **对话有多长**。

所以「一天能问多少条」没有固定答案：一句简单的问答消耗很少，一次 Deep Research、一段视频、一个带着大文件的长对话则消耗很多。

**两层时间限制**：额度每 5 小时刷新一次；同时还有一个每周上限，周上限用完后要等到下一个周期。

**各档的额度**：

| 方案 | 额度 |
| --- | --- |
| 无订阅 | 标准额度 |
| Google AI Plus | 标准额度的 2 倍 |
| Google AI Pro | 标准额度的 4 倍 |
| Google AI Ultra | AI Pro 的 5 倍或 20 倍（取决于订阅的是哪一种 Ultra） |

「标准额度」具体是多少，官方没有公开数字。

## 三、哪些操作最费额度

官方明确点名的有这些：

- **更高级的模型**：Pro 比 Flash、Flash-Lite 消耗多；
- **更高的思考等级**：扩展思考、Deep Think 比标准思考消耗多；
- **媒体生成**：生成图片、视频、音乐；
- **Deep Research**：一次研究要读大量来源。Deep Research 另外还有「每日研究次数」和「同时进行的研究数」两个上限，快用完时会提示当天还剩几次；
- **很长的对话**：对话越长，每次回复要处理的上下文越多。

## 四、省额度的官方做法

1. **保持「自动选择模型」开启**。帮助中心说它会把提问分配给「最高效的模型和思考等级」，目的之一就是节省你的用量。开关在「设置 → 用量限制」页面底部。
2. **日常问题不要手动选 Pro 和高思考等级**。手动选定的模型和思考等级会在整个对话里一直沿用，问完难题记得换回来，或者新开对话。
3. **换话题就开新对话**，不要在一个很长的对话里一直问。
4. **大文件拆开传**。文件超出上下文窗口时，回答还会漏细节（无订阅 32k token，AI Plus 128k，AI Pro / Ultra 100 万 token）。
5. 生成图片、视频的次数规则另见本站《Gemini 生图次数限制：Nano Banana 每天能生成多少张、用完怎么办》和《Gemini 怎么生成视频》。

## 五、额度用完会怎样

- **有 Google AI 订阅**：可以继续用 **Flash-Lite** 把对话聊下去，只是换成了最轻量的模型；
- **没有订阅**：等 5 小时刷新；如果是周上限用完，要等到提示里写的时间；
- **Deep Think**：到达用量上限后暂时不可用，等刷新；
- **想马上继续**：升级到更高一档的方案（「设置与帮助 → 查看订阅」）。订阅页的脚注还提到可以购买 AI credits 来延长额度，是否对你的账号开放以界面为准。

## 六、为什么感觉「额度变少了」

帮助中心给出的官方原因有三类：

1. **你的用法变了**：最近是否更多地用了 Pro、高思考等级、Deep Research 或媒体生成，或者对话越聊越长；
2. **官方调整**：额度「可能不经通知调整，包括因为容量限制」。当使用量激增时，Google 会调整上限来保证服务质量；
3. **无订阅用户优先受限**：官方写明，容量变化时，没有 Google AI 方案的用户会先于付费用户被限制；Deep Research 等耗算力的功能在高峰期对免费用户可能暂时不可用。

## 常见问题

**Q：Gemini 免费版一天能问多少次？**
官方没有给出条数，只说是「标准额度」，按计算量计，每 5 小时刷新、另有每周上限。实际能问多少取决于你问什么、用什么模型。

**Q：额度是每天零点重置吗？**
不是按自然日。是 5 小时一个周期滚动刷新，再加一个每周上限；具体恢复时间看到达上限时的提示，或「用量限制」页面。

**Q：手机 App 和网页版的额度是分开的吗？**
帮助中心说的是「Gemini Apps」整体的用量限制，没有按设备区分的说法；同一个账号在各端的使用应视为共用。

**Q：工作 / 学校账号的额度一样吗？**
不一样。帮助中心这篇说明只针对个人 Google 账号；Workspace 账号的额度由所在组织的版本和管理员决定。

**Q：家庭共享的成员共用一份额度吗？**
帮助中心没有针对 Gemini App 用量给出明确说法。Google One 帮助页只提到 AI Pro 的家庭成员可以共享部分 AI 权益，并举例 Google 相册的生成功能「每位成员各有一套每日上限」。

## 参考资料

- Gemini Apps limits & upgrades for Google AI subscribers（Gemini 帮助中心）：https://support.google.com/gemini/answer/16275805
- About Gemini models（自动选择模型）：https://support.google.com/gemini/answer/18648722
- Use Deep Research in Gemini Apps：https://support.google.com/gemini/answer/15719111
- Use Deep Think in Gemini Apps：https://support.google.com/gemini/answer/16345172
- Google AI 订阅方案：https://gemini.google/subscriptions/
- Use Google AI Pro benefits（Google One 帮助中心）：https://support.google.com/googleone/answer/14534406
