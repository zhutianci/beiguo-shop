---
title: Claude 是不是崩了：官方状态页 status.claude.com 怎么看，网页、API、Claude Code 分别看哪一项
slug: claude-down-check-status-page
products: [claude]
models: []
accountTier: FREE
excerpt: Claude 打不开或一直报错，是官方故障还是自己的问题？官方状态页 status.claude.com 不用登录就能看。本文讲清页面上的 6 个组件各管什么、事件的四种状态怎么读、怎么订阅通知，以及状态页显示正常你仍然报错时该怎么办。
checkedOn: 2026-10-27
sources:
  - https://status.claude.com/
  - https://status.anthropic.com/
  - https://support.claude.com/
verify:
  - 组件名称、事件状态词和 90 天可用率说明是 2026-10-27 当天读到的页面，官方随时可能调整
  - 文中举的 10 月 24 日至 27 日的事件只是用来说明怎么读，不代表当前状态，以你打开页面时看到的为准
  - 官方状态页没有说明 Claude 手机 App 对应哪个组件，本文只写页面上能看到的组件名称，手机 App 和网页同属聊天服务，归到 claude.ai 一项是本站的理解
  - 状态页的订阅方式（邮件、短信）按页面当天显示的写法，是否需要验证码、是否收费以页面为准
---

> 本文根据 Claude 官方状态页（status.claude.com，旧地址 status.anthropic.com 会跳转到这里）整理，资料核对于 2026-10-27。状态页的内容实时变化，下面的例子只用来说明怎么读。配图为本站整理的示意图，不是网页截图。

## 适用于谁

- Claude 突然打不开、发不出消息、回答到一半出错，想知道是官方故障还是自己问题的人；
- 用 Claude Code、API 的人，想知道该看状态页的哪一项；
- 想在 Claude 出故障、恢复时收到通知的人。

## 结论先说

1. **官方状态页是 [status.claude.com](https://status.claude.com/)**，不用登录。旧地址 status.anthropic.com 会自动跳到这里。
2. 页面把服务分成 **6 个组件**：**claude.ai**、**Claude Console (platform.claude.com)**、**Claude API (api.anthropic.com)**、**Claude Code**、**Claude Cowork**、**Claude for Government**。每个组件有自己的状态：Operational（正常）、Degraded Performance（性能下降）、Partial Outage（部分中断）、Major Outage（严重中断）、Maintenance（维护中）。
3. **出了故障，页面下方「Past Incidents」会列出事件**，按时间倒序，每条事件的更新依次是 **Investigating（调查中）、Identified（已找到原因）、Monitoring（已修复、观察中）、Resolved（已解决）**，每条更新都带 UTC 时间。
4. **页面有进行中的事件，就等官方处理**，别反复重装或换账号。
5. **状态页显示正常你仍然报错**，那多半是账号、网络或客户端的问题，按 [/guides/claude-cant-login-or-use](/guides/claude-cant-login-or-use) 逐项排查。

![遇到什么问题，看哪个组件](seed:g1192-components-compare.png)
*图：本站根据 [Claude 状态页](https://status.claude.com/) 整理的示意图*

## 一、页面从上到下是什么

打开 status.claude.com，大致是：

- **顶部**：有进行中的事件时，会在最上面显示最新一条更新，比如「We are investigating elevated errors on requests to Claude Sonnet 5.5」，后面带时间；
- **组件列表**：6 个组件，每个旁边是当前状态，还有一条近 90 天的可用率条（页面上写的是 Uptime over the past 90 days）；
- **Subscribe to Updates**：订阅事件通知，页面写明可以用**邮件**（有验证码）或**短信**（要选国家区号）接收，内容是官方创建、更新或解决事件时通知你；
- **Past Incidents**：往前几天的事件列表，没有事件的日子写 No incidents reported；
- **View historical uptime**：看历史可用率。

### 6 个组件各管什么

| 组件 | 大致对应 |
| --- | --- |
| claude.ai | 网页版聊天（手机 App 对应哪一项，页面没有说明） |
| Claude Console (platform.claude.com) | 开发者控制台，管理 API 密钥、用量和账单的地方 |
| Claude API (api.anthropic.com) | 程序调用 Claude 的接口 |
| Claude Code | 命令行编程工具 |
| Claude Cowork | 协作办公类功能 |
| Claude for Government | 面向政府客户的服务 |

自己用的是哪种服务，就盯哪一项。普通聊天用户看 claude.ai；写代码的人看 Claude Code；调接口的人看 Claude API；登录开发者控制台出问题，就看 Claude Console 一项。

## 二、怎么读一条事件

用 2026-10-27 页面上的真实写法举例（只用于说明怎么读）：一条标题写作「Elevated errors for Claude Sonnet 5.5」（Claude Sonnet 5.5 错误率升高）的事件，按时间有这样几条更新：

1. **Investigating**：「我们正在调查对 Claude Sonnet 5.5 请求的错误升高」；
2. **Monitoring**：「已部署修复，正在观察恢复」；
3. **Resolved**：「影响 Claude 服务的问题已解决」。

读的时候注意三点：

- **标题里写了模型名**（例如某个 Sonnet、Opus 或 Haiku 型号），说明受影响的主要是这个模型的请求。不一定必须用它的话，可以先换别的模型；各模型怎么选见 [/guides/claude-opus-vs-sonnet](/guides/claude-opus-vs-sonnet)；
- **有的事件影响时间很短**。官方在「Resolved」的更新里常会写具体的影响时段，如 10 月 25 日的一条写了从 01:08 PT / 08:08 UTC 到 01:29 PT / 08:29 UTC，只有 20 分钟；
- **注意时间是 UTC**，换成北京时间要加 8 小时。

![Claude 状态页怎么看、怎么办](seed:g1192-status-decide.png)
*图：本站根据 [Claude 状态页](https://status.claude.com/) 整理的示意图*

## 三、订阅通知

页面上的 **Subscribe to Updates** 打开后可以用邮件订阅，也可以用短信。官方页面写明邮件和短信的通知内容都是事件的创建、更新、解决（短信是创建和解决）。订阅要验证邮箱或手机，邮件会有一次性验证码。订阅是否需要付费、会不会收到营销邮件，状态页没有写，订阅前先看页面上的隐私政策链接。

## 四、状态页正常，我还是用不了

官方状态页反映的是**系统整体**，不是你个人的情况。和 ChatGPT 的状态页一样，页面显示正常不代表每个用户都正常。这时：

1. 刷新页面，换一个浏览器或无痕窗口再试，关掉可能干扰的浏览器扩展；
2. 换一个网络（比如手机热点）对比；
3. 登录不了、账号被停用或提示不支持地区，看站内 [/guides/claude-cant-login-or-use](/guides/claude-cant-login-or-use)、[/guides/claude-account-disabled-appeal](/guides/claude-account-disabled-appeal) 和 [/guides/claude-supported-countries-regions](/guides/claude-supported-countries-regions)；
4. 用 Claude Code 的报错见 [/guides/claude-code-common-errors](/guides/claude-code-common-errors)；
5. 额度用完不是故障，见 [/guides/claude-usage-limits](/guides/claude-usage-limits)。想开通 Claude Pro 可以看 [/chongzhi/claude-pro](/chongzhi/claude-pro)。

想一次对比多家 AI 的状态页，看 [/guides/ai-tools-down-which-status-page](/guides/ai-tools-down-which-status-page)。

## 常见问题

**Q：状态页里没有显示手机 App，怎么判断？**
官方页面只列了上面 6 个组件。手机 App 和网页都是聊天服务，网页（claude.ai）显示有事件时，手机 App 往往也受影响，但这是本站的理解，不是官方的明确说法。

**Q：旧地址 status.anthropic.com 还能用吗？**
2026-10-27 核对时，它会自动跳转到 status.claude.com。

**Q：事件写 Resolved 之后我还报错？**
状态页是整体情况。先刷新、换网络，仍然不行就按第四节排查。

## 参考资料

- Claude 状态页 — https://status.claude.com/
- Claude 帮助中心 — https://support.claude.com/
