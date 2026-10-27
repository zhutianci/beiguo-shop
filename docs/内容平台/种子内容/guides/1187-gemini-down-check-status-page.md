---
title: Gemini 是不是崩了：官方状态页怎么看，Workspace 状态页、AI Studio 状态页分别查什么
slug: gemini-down-check-status-page
products: [gemini]
models: []
accountTier: FREE
excerpt: Gemini 打不开先看 Google 官方状态页：Workspace 状态页列有 Gemini、Gemini Notebook 和 Google Sign In，开发者看 AI Studio 状态页。本文讲各页面怎么读、正常时怎么办。
checkedOn: 2026-10-27
sources:
  - https://www.google.com/appsstatus/dashboard/
  - https://aistudio.google.com/status
  - https://status.cloud.google.com/
verify:
  - Google Workspace Status Dashboard 官方写明它提供的是 Google Workspace 服务的状态，个人账号使用的 Gemini 是否在这里体现，页面没有说明，本文不下结论，以页面显示为准
  - 页面上的服务列表、图例和事件是 2026-10-27 当天读到的内容，官方随时可能调整
  - aistudio.google.com/status 页面当天只显示「Past Incidents」历史事件，文中的事件只用于说明怎么读
  - Google Cloud 状态页面向云服务，本文只确认它存在、面向谁，没有逐项核对其中 Gemini 或 Vertex AI 的组件名称
---

> 本文根据 Google Workspace Status Dashboard、Google AI Studio 状态页和 Google Cloud 状态页整理，资料核对于 2026-10-27。状态页内容实时变化，下面的描述只用来说明怎么读。**官方没有单独为「Gemini App 个人用户」做一个状态页**，所以本文写的是 Google 现有的几个页面分别看什么。配图为本站整理的示意图，不是网页截图。

## 适用于谁

- Gemini 网页或 App 打不开、发不出消息、一直报错，想知道是不是 Google 的问题的人；
- 用 Google AI Studio 或 Gemini API 的开发者；
- 想知道 Gemini、Gemini Notebook、Google 登录是不是同时出问题的人。

## 结论先说

1. **聊天类的 Gemini 先看 [Google Workspace Status Dashboard](https://www.google.com/appsstatus/dashboard/)**。页面服务列表里有 **Gemini**、**Gemini Notebook** 和 **Google Sign In**。没有事件时顶部显示 **No incidents** 并写明最近更新时间。
2. **官方写明这个页面提供的是 Google Workspace 服务的状态。** 你用的是个人谷歌账号的话，页面是否反映你那边的情况，官方没有说明，所以页面正常不代表你一定正常。
3. **AI Studio 和 Gemini API 的事件**，看 [aistudio.google.com/status](https://aistudio.google.com/status)，页面列出过去的事件，比如 AI Studio Build 出错、批处理请求超时、计费页出错。
4. **在 Google Cloud 上用 Gemini 的企业**，另有 [Google Cloud 状态页](https://status.cloud.google.com/)。
5. **页面显示正常你仍然不行**，按 [/guides/gemini-something-went-wrong-error](/guides/gemini-something-went-wrong-error) 逐项处理；不能登录见 [/guides/gemini-cant-open-or-sign-in](/guides/gemini-cant-open-or-sign-in)。

![Gemini 有哪几个官方状态页](seed:g1187-pages-compare.png)
*图：本站根据 Google 官方状态页整理的示意图*

## 一、Google Workspace Status Dashboard 怎么读

页面写明，它提供 Google Workspace 服务的状态信息，让你回来查看下面列出的服务状态；如果你遇到的问题没有列在这里，可以联系支持。

- **顶部**：没有事件时写 **No incidents**，下面有 **Last updated time**（最近更新时间，UTC）；
- **图例**：**Available**（可用）、**Service information**（服务信息）、**Service disruption**（服务中断）、**Service outage**（服务停止）。表格里每个服务一行，最近 8 天（页面当天显示 10 月 20 日到 27 日）每天一格，有问题的日子会用对应的标记显示；
- **服务列表**：Admin Console、Gmail、Google Docs、Google Drive、Google Meet 等，其中和本文有关的是 **Gemini**、**Gemini Notebook**、**Google Sign In**；
- **View history / View incident history**：查看事件历史；
- 页面底部还有 **RSS Feed**、**JSON History** 等订阅和数据入口，方便在出事件时接收通知。

所有时间是 UTC，换成北京时间要加 8 小时。

## 二、AI Studio 状态页怎么读

[aistudio.google.com/status](https://aistudio.google.com/status) 是给用 Google AI Studio 和 Gemini API 的人看的。页面按日期列出 **Past Incidents**，每个事件有标题和几条更新，状态依次是 **Detected（发现）、Identified（已找到原因）、Resolved（已解决）** 等，每条带时间。页面当天能看到的事件例如：

- AI Studio Build 里的应用出现错误或超时（影响创建、打开、运行或部署应用）；
- 通过 Gemini API 和 AI Studio 创建复刻声音时请求失败，返回 404 的 「Requested entity was not found.」；
- AI Studio 的计费和付款设置页出错；
- Gemini API 批处理请求没能在 24 小时内完成。

这些都只是用来说明怎么读，不代表当前状态。接口报 429 等错误，看 [/guides/gemini-api-429-resource-exhausted](/guides/gemini-api-429-resource-exhausted)，那是额度和速率问题，和这个状态页不是一回事。

## 三、对照表：看到什么，怎么办

![Gemini 用不了：状态页之后怎么办](seed:g1187-down-decide.png)
*图：本站根据 Google 官方状态页整理的示意图*

## 四、状态页正常，但你仍然用不了

按这个顺序排查：

1. **刷新页面或重启 App**，换浏览器、无痕窗口，关掉可能干扰的扩展；
2. **确认你登录的是哪个谷歌账号**，以及账号是不是个人、工作或学校类型，不同类型可用的功能不同，见 [/guides/gemini-cant-open-or-sign-in](/guides/gemini-cant-open-or-sign-in)；
3. **提示「不支持所在地区」**不是故障，是官方的支持范围，见 [/guides/gemini-supported-countries-regions](/guides/gemini-supported-countries-regions)；
4. **回答一半停住或提示用量**，可能是额度问题，见 [/guides/gemini-usage-limits-check-reset](/guides/gemini-usage-limits-check-reset)；
5. **生图失败**，见 [/guides/gemini-cant-generate-images](/guides/gemini-cant-generate-images)；
6. 想用更多额度或更高的模型，套餐区别见 [/guides/gemini-plans-free-plus-pro-ultra](/guides/gemini-plans-free-plus-pro-ultra)；需要谷歌账号可以看 [/chongzhi/google-zhanghao](/chongzhi/google-zhanghao)。

## 常见问题

**Q：为什么没有一个专门的 Gemini 状态页？**
官方有几个按产品分的页面：Workspace 状态页包含 Gemini 和 Gemini Notebook，AI Studio 有自己的状态页，Google Cloud 有云服务状态页。个人用户没有单独的页面，官方也没有解释原因。

**Q：Workspace 状态页写 No incidents，Gemini 却打不开？**
页面是官方公布的事件，不一定覆盖每个用户的个别情况。先按第四节排查。

**Q：想对比几家 AI 的状态页？**
见 [/guides/ai-tools-down-which-status-page](/guides/ai-tools-down-which-status-page)。

## 参考资料

- Google Workspace Status Dashboard — https://www.google.com/appsstatus/dashboard/
- Google AI Studio 状态页 — https://aistudio.google.com/status
- Google Cloud 状态页 — https://status.cloud.google.com/
