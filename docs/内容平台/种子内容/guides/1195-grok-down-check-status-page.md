---
title: Grok 是不是崩了、打不开怎么办：官方状态页 status.x.ai 怎么看，网页、手机 App、Imagine、API 分别看哪一项
slug: grok-down-check-status-page
products: [grok]
models: []
accountTier: FREE
excerpt: Grok 打不开、一直转圈或生图失败，先看官方状态页 status.x.ai，不用登录。本文讲清页面上 Grok、API、Services 几个分组各管什么，History 页怎么看以往事件和持续时间，以及状态页显示正常时下一步怎么排查。
checkedOn: 2026-10-27
sources:
  - https://status.x.ai/
  - https://status.x.ai/history
verify:
  - 2026-10-27 核对时，status.x.ai 的页面标题显示为 SpaceXSI Status，页面里同时列了 Grok、Cursor、API、Services 几个分组，名称和分组以官方页面当天显示为准
  - 访问 status.cursor.com 时，核对当天被跳转到了 status.x.ai，官方没有就此作说明，本文只照实写
  - 文中的 History 事件只用于说明怎么读，不代表当前状态，持续时间和影响的项目以页面为准
  - 官方页面没有说明 No active incidents 之外的横幅文字，状态词的完整列表也未在页面上看到
---

> 本文根据 xAI 官方状态页（status.x.ai）及其 History 页整理，资料核对于 2026-10-27。状态页内容实时变化，下面的例子只用来说明怎么读。配图为本站整理的示意图，不是网页截图。

## 适用于谁

- Grok 网页、手机 App 或 X 里的 Grok 打不开、发不出消息的人；
- Grok 生成图片、视频或语音对话出问题的人；
- 调用 xAI 接口出错，想知道是不是官方故障的人。

## 结论先说

1. **官方状态页是 [status.x.ai](https://status.x.ai/)**，不用登录。没有事件时页面写 **No active incidents**，并说明「我们没有发现任何影响服务的已发布事件」，旁边有 **Updated** 更新时间（UTC）。
2. 页面按分组列出项目：**Grok**（grok.com、iOS、Android、Grok in X、Imagine、Voice）、**API**（Global api.x.ai、US us.api.x.ai、EU eu-west-1.api.x.ai），还有 **Services**（Console、Docs、Origin、x.ai、Single Sign-On、Admin APIs、Enterprise Dashboard）。
3. 同一个页面还列了 **Cursor** 分组（iOS、Desktop、Cloud Agents、CLI、Automations、BugBot、Review Agents、Grok Bot、cursor.com）。**用 Cursor 的人看这里的 Cursor 分组**。
4. **页面顶部的 History** 能看以往事件，每条写明持续多久、影响了哪些项目，时间按 **UTC**。
5. **没有事件但你仍然用不了**：刷新、换网络、重新登录，再看站内使用说明。

![status.x.ai 上和 Grok 有关的项目](seed:g1195-status-compare.png)
*图：本站根据 [xAI 状态页](https://status.x.ai/) 整理的示意图*

## 一、页面从上到下是什么

打开 status.x.ai，有两个标签：**Overview**（概览）和 **History**（历史）。概览页：

- **Service Status**（服务状态）：写着当前有没有进行中的事件和更新时间；
- **Grok**、**Cursor**、**API**、**Services** 几个分组，每组有一个 90 天的状态条（页面写 90 Days）和当前状态，例如 **Operational**；
- 每个项目都是一个链接，点进去看它的详情；
- 页面有 **Toggle theme**（切换主题）和 **Subscribe**（订阅）按钮。

### 各项目大致对应

| 你在用的 | 看哪一项 |
| --- | --- |
| 网页版 Grok | Grok 分组下的 grok.com |
| 手机 App | Grok 分组下的 iOS、Android |
| 在 X 里使用 Grok | Grok in X |
| 生成图片、视频 | Imagine |
| 语音对话 | Voice |
| 调用 xAI 接口 | API 分组下的 Global、US、EU 三个入口 |
| 控制台、文档、登录 | Services 分组下的 Console、Docs、Single Sign-On |

Grok 的用法和额度见 [/guides/grok-how-to-use-x-account-weekly-usage](/guides/grok-how-to-use-x-account-weekly-usage) 和 [/guides/grok-usage-limit-weekly-pool-why](/guides/grok-usage-limit-weekly-pool-why)。

## 二、History 页怎么读

![Grok 打不开：先对照这张表](seed:g1195-down-decide.png)
*图：本站根据 [xAI 状态页](https://status.x.ai/) 整理的示意图*

History 页是按日期倒序的事件列表，每条是「标题 持续时间 影响的项目」。2026-10-27 页面上能看到的写法，例如：

- 「Investigating service outage - Grok models unavailable」（正在调查服务中断，Grok 模型不可用），持续 41 分钟，影响列出了 Grok Bot 和 Cursor 的几个项目；
- 「Degraded Model Performance」（模型性能下降），持续 1 分钟，影响 Global（api.x.ai）和 CLI；
- 「Elevated errors for Claude Sonnet 5.5」，影响的是 Cursor 的几个项目。

这些只是用来说明怎么读，不代表当前状态。读的时候注意：

- **事件持续时间可能很短**，几分钟的抖动，状态页上也会留下记录；
- **看影响了哪些项目**，只在你用的那一项被点名时，才可能和你遇到的问题有关；
- **时间是 UTC**，换成北京时间要加 8 小时。

## 三、没有事件，Grok 还是打不开

1. **刷新页面、重启 App**，换浏览器或无痕窗口；
2. **换一个网络**对比，比如手机热点；
3. **确认登录的是哪个账号**，Grok 可以用 X 账号登录，用不同账号的权益不同，见 [/guides/grok-how-to-use-x-account-weekly-usage](/guides/grok-how-to-use-x-account-weekly-usage)；
4. **提示额度用完**不是故障，见 [/guides/grok-usage-limit-weekly-pool-why](/guides/grok-usage-limit-weekly-pool-why)；
5. 想了解订阅和下载入口，见 [/guides/grok-how-to-subscribe-download](/guides/grok-how-to-subscribe-download)，开通 SuperGrok 可以看 [/chongzhi/grok-super](/chongzhi/grok-super)；
6. 在 Cursor 里调用 Grok 出问题，见 [/guides/cursor-common-errors-connection-failed](/guides/cursor-common-errors-connection-failed)。

## 常见问题

**Q：为什么 Grok 的状态页里有 Cursor？**
页面把 Cursor 和 Grok 列在同一个状态页里，官方没有在页面上解释原因。2026-10-27 核对时，访问 status.cursor.com 会被跳转到 status.x.ai。

**Q：状态页能订阅吗？**
页面有 **Subscribe** 按钮，在 Overview 和 History 页都能看到。订阅方式和通知内容以点开后的页面为准。

**Q：想一次对比几家 AI 的状态页？**
见 [/guides/ai-tools-down-which-status-page](/guides/ai-tools-down-which-status-page)。

## 参考资料

- xAI 状态页 — https://status.x.ai/
- xAI 状态页 History — https://status.x.ai/history
