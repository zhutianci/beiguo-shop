---
title: ChatGPT 是不是崩了：怎么看官方状态页 status.openai.com，打不开或报 500、503 先查什么
slug: chatgpt-down-check-status-page
products: [chatgpt]
models: []
accountTier: FREE
excerpt: ChatGPT 用不了，是服务出问题还是你自己的问题？官方状态页 status.openai.com 不用登录就能看。本文讲清状态页怎么读：ChatGPT 下的 16 个组件、事件的四种状态、怎么订阅故障通知，以及状态页显示正常但你仍然报错时官方建议的排查。
checkedOn: 2026-10-14
sources:
  - https://status.openai.com/
  - https://status.openai.com/history
  - https://help.openai.com/en/articles/7996703-troubleshooting-chatgpt-error-messages
verify:
  - 状态页的组件名、数量和事件状态词是 2026-10-14 当天读到的版本，官方随时可能调整
  - 官方帮助中心没有逐个解释 HTTP 500、503 这类数字，本文没有对数字本身下结论，只写了官方给的排查步骤
  - 状态页顶部的横幅文字（We’re fully operational）以实际页面为准
---

> 本文根据 OpenAI 状态页（status.openai.com）和帮助中心《Troubleshooting ChatGPT Error Messages》整理，资料核对于 2026-10-14。状态页内容实时变化，下面的例子只用来说明怎么读。配图为本站整理的示意图，不是网页截图。

## 适用于谁

- ChatGPT 突然打不开、发不出消息、一直转圈，想知道是不是官方出了故障的人；
- 看到「500」「503」之类的数字，不知道意思的人；
- 想在 ChatGPT 出故障时第一时间收到通知的人。

## 结论先说

1. **官方状态页是 [status.openai.com](https://status.openai.com/)**，不用登录。顶部写 **We’re fully operational**，并说明「我们没有发现任何影响系统的问题」，就表示官方当下没有已知故障。
2. 状态页把服务分成几大块：**APIs、ChatGPT、Codex、FedRAMP、Ads Platform**。ChatGPT 这一块还有 16 个细分组件，**Conversations（对话）、Login（登录）、File uploads（上传）、Voice mode（语音）、Image Generation（生图）**等，哪个功能出问题就看哪个。
3. **有故障的话，每一起「事件」都有逐条更新**，状态按顺序是 Identified、Investigating、Monitoring、Resolved 等，写明时间和进展。
4. **状态页是整体情况，不是你个人的情况。** 官方在页面底部特别注明：可用率是按所有套餐、模型和错误类型汇总的，个别用户的实际体验可能不同。
5. **状态页显示正常但你仍然报错**，按帮助中心的排查走：刷新、无痕窗口、关浏览器扩展、换网络，见下面第四节和 [/guides/chatgpt-something-went-wrong](/guides/chatgpt-something-went-wrong)。

![用官方状态页判断 ChatGPT 是不是崩了的 4 个步骤示意图](seed:g867-status-page-steps.png)
*图：本站根据 [OpenAI 状态页](https://status.openai.com/) 整理的示意图*

## 一、状态页上能看到什么

打开 status.openai.com，从上到下大致是：

- **顶部横幅**：无故障时是 **We’re fully operational**；有进行中的事件，会改成对应的提示；
- **System status（系统状态）**：APIs、ChatGPT、Codex、FedRAMP、Ads Platform 几个大类，每一类显示组件数量，多数还显示一段时间内的**可用率**（uptime，例如页面上写着 99.5% 这样的数字）；
- **View history（查看历史）**：进入历史页，按月、按日列出过去的所有事件；
- **Subscribe to updates（订阅更新）**：可以用 **Email（邮件）、RSS、Slack** 订阅。邮件订阅里有 **Subscribe to specific components（订阅特定组件）** 的选项，官方说明：订阅后，新事件和已有事件的更新都会发邮件给你。

可用率和横幅是实时的，这篇文章不写具体数值，以你打开时看到的为准。

### ChatGPT 下的组件

点开 **ChatGPT**，2026-10-14 看到的组件有：Conversations、Login、ChatGPT Work、Codex in ChatGPT Desktop、Compliance API、Search、File uploads、Voice mode、GPTs、Image Generation、Deep Research、Agent、dots、Space、Sites、Connectors/Apps，共 16 个。

![按遇到的问题对应状态页组件名的对照表](seed:g867-status-components.png)
*图：本站根据 [OpenAI 状态页](https://status.openai.com/) 整理的示意图*

## 二、怎么读一起事件

点进任意一起事件，会看到：

- **标题**：说明哪些服务受影响，例如「Elevated errors in ChatGPT conversations（ChatGPT 对话错误率升高）」之类；
- **整体状态**：如 Resolved（已解决），以及影响程度，如 **Degraded performance（性能下降）**；
- **Affected components（受影响的组件）**：列出具体组件和受影响的时间段；
- **Updates（更新）**：按时间倒序，常见的几个状态是：
  - **Identified**：已经确认受影响的服务有错误率升高，正在着手实施缓解措施；
  - **Investigating**：正在调查所列服务的问题；
  - **Monitoring**：已经采取了缓解措施，正在观察恢复情况；
  - **Resolved**：所有受影响的服务已完全恢复。

以上状态的含义，来自状态页上一起已解决事件的更新文字；不同事件的措辞会不一样。

状态页历史里，近期的事件标题常见这样的写法：Elevated errors in ChatGPT conversations、Issues with data analysis and file creation in ChatGPT、Some ChatGPT content may be unavailable on Android 等。可以看出，故障常常**只影响某一个功能或某一类用户**，所以对照组件看，比只看「有没有崩」更有用。

## 三、报 500、503 是怎么回事

官方帮助中心的错误排查文章，列出的是**报错文字**：Something went wrong、A network error occurred、We detect suspicious activity、There was a problem preparing your chat、There was an error generating a response 等，**没有逐个解释 500、503 这类数字**。所以本文不替官方解释数字的含义。

遇到这类数字，官方给的路径是一样的：

1. 先打开状态页，看对应组件有没有事件；
2. 有事件：等官方恢复，订阅更新，不要反复刷新、重试；
3. 没有事件：按下面的本地排查。

## 四、状态页显示正常，你还是用不了

官方在《Troubleshooting ChatGPT Error Messages》里说，ChatGPT 的技术问题可能来自**网络配置、浏览器扩展，或服务器端的临时问题**。通用排查是：

1. 刷新页面，或开一个新对话；
2. 清除浏览器缓存和 Cookie；
3. 用**无痕 / 隐私窗口**；
4. 停用浏览器扩展，尤其是隐私和安全类的；
5. 关闭 VPN 和安全 DNS 之类会改写网络流量的工具；
6. 换一个网络，或者换一台设备、换一个浏览器。

ChatGPT 长时间卡在 Thinking / Generating / Working，官方给的顺序是：先等 30–60 秒；点 **Stop generating** 再 **Regenerate**；新开一个对话重新发；强制刷新（Cmd 或 Ctrl + Shift + R）；退出登录再登录；无痕窗口且停用扩展……对话太长或轮次太多时，官方建议直接新开对话。

如果在多个浏览器、设备和网络上问题都存在，官方建议收集 HAR 文件和带时间戳的浏览器控制台错误，记下用的模型和对话网址或 ID，然后联系客服，见 [/guides/chatgpt-contact-support](/guides/chatgpt-contact-support)。

其他相关文章：

- 通用报错「Something went wrong」：[/guides/chatgpt-something-went-wrong](/guides/chatgpt-something-went-wrong)；
- 网络连接类报错：[/guides/chatgpt-network-error](/guides/chatgpt-network-error)；
- 页面打不开、白屏、一直转圈：[/guides/chatgpt-cant-open-loading](/guides/chatgpt-cant-open-loading)；
- 登录相关报错：[/guides/chatgpt-login-problems](/guides/chatgpt-login-problems)。

![状态页显示的情况对应的下一步操作](seed:g867-status-next-steps.png)
*图：本站根据 [OpenAI 状态页](https://status.openai.com/) 与 [帮助中心：Troubleshooting ChatGPT Error Messages](https://help.openai.com/en/articles/7996703-troubleshooting-chatgpt-error-messages) 整理的示意图*

## 常见问题

**Q：状态页说「We’re fully operational」，为什么我还是用不了？**
状态页反映的是整体情况。官方注明，个别用户的体验可能因订阅套餐、模型和具体功能而不同。你的问题可能是本地网络、浏览器扩展，也可能是账号层面的，见上面第四节。

**Q：状态页没有记录，但很多人都说崩了？**
状态页上的事件由官方发布，官方没有说明发布的时效。可以订阅邮件，并先按排查步骤自查。

**Q：能不能让官方有故障时通知我？**
可以。状态页的 **Subscribe to updates** 支持邮件、RSS 和 Slack；邮件可以选择只订阅特定组件，比如只订阅 ChatGPT 下的 Conversations。

**Q：状态页上的「Codex」「APIs」和我用的 ChatGPT 有关系吗？**
状态页是分块的。网页和 App 里的聊天看 ChatGPT 这一块；做开发调用接口的看 APIs；Codex 单独一块。

**Q：故障时我的对话会丢吗？**
官方的状态页和排查文章没有写这一点。如果对话没有显示，可以刷新后再看，对话列表的相关问题见 [/guides/chatgpt-archived-chats-missing](/guides/chatgpt-archived-chats-missing)。

## 参考资料

- OpenAI 状态页 — https://status.openai.com/
- OpenAI 状态页：事件历史 — https://status.openai.com/history
- OpenAI 帮助中心：Troubleshooting ChatGPT Error Messages — https://help.openai.com/en/articles/7996703-troubleshooting-chatgpt-error-messages
