---
title: AI 工具都打不开时怎么判断是谁的问题：ChatGPT、Gemini、Claude、DeepSeek、Grok、Kimi 官方状态页地址汇总
slug: ai-tools-down-which-status-page
products: [ai-tools]
models: []
accountTier: FREE
excerpt: 好几个 AI 同时打不开，是你的网络，还是某一家出了故障？本文汇总 ChatGPT、Claude、Gemini、DeepSeek、Grok、Cursor、Kimi、GitHub Copilot 的官方状态页地址，说明各家页面上该看哪一项，以及先判断自己网络、再逐家看状态页的顺序。
checkedOn: 2026-10-27
sources:
  - https://status.openai.com/
  - https://status.claude.com/
  - https://www.google.com/appsstatus/dashboard/
  - https://aistudio.google.com/status
  - https://status.deepseek.com/
  - https://status.x.ai/
  - https://status.moonshot.cn/
  - https://www.githubstatus.com/
  - https://help.openai.com/en/articles/9247338-network-recommendations-for-chatgpt-errors-on-web-and-apps
verify:
  - 各状态页的地址、分组和项目名称是 2026-10-27 当天读到的页面，官方随时可能调整，以打开时看到的为准
  - Google 没有给个人用户的 Gemini App 单独做状态页，Workspace 状态页是否反映个人账号的情况，页面没有写明
  - 2026-10-27 核对时，Cursor 的状态页地址 status.cursor.com 被跳转到 status.x.ai，官方没有说明原因
  - 官方帮助中心的网络对比方法写给 ChatGPT，本文把同样的思路用到其他工具，这是本站的整理，不是各家官方的统一说法
---

> 本文根据各家官方状态页和 OpenAI 帮助中心《Network recommendations for ChatGPT errors on web and apps》整理，资料核对于 2026-10-27。状态页内容实时变化，本文只写地址和怎么读。配图为本站整理的示意图，不是网页截图。

## 适用于谁

- ChatGPT、Gemini、Claude、DeepSeek 等几个工具同时打不开，不知道是自己的网络还是官方的问题的人；
- 想把各家官方状态页收藏起来，以后出问题 10 秒内判断的人。

## 结论先说

1. **几个 AI 同时打不开，先怀疑自己的网络**，不是几家同时出故障。先试同一台电脑上的其他普通网站，再把电脑切到手机热点对比。OpenAI 帮助中心就是这样教人判断网络问题的：先看是只有你这一台还是整个网络，再看从公司 WiFi 换成手机热点后问题是否消失。
2. **然后逐家打开官方状态页**，哪家有进行中的事件，就是哪家的问题。下面有汇总表。
3. **只有一家出事**，等它恢复，其余照常用；需要时先换另一个工具做眼前的事。
4. **各家状态页都正常**，换网络、换设备，再查账号、所在地区和客户端版本。

![各家 AI 的官方状态页地址](seed:g1196-status-pages-compare.png)
*图：本站根据各官方状态页整理的示意图*

## 一、各家官方状态页

| 产品 | 官方状态页 | 要看的项目 | 本站详细说明 |
| --- | --- | --- | --- |
| ChatGPT、Codex | [status.openai.com](https://status.openai.com/) | 分 APIs、ChatGPT、Codex 等大类，ChatGPT 下有对话、登录、上传、语音、生图等组件 | [/guides/chatgpt-down-check-status-page](/guides/chatgpt-down-check-status-page) |
| Claude | [status.claude.com](https://status.claude.com/) | claude.ai、Claude Console、Claude API、Claude Code、Claude Cowork | [/guides/claude-down-check-status-page](/guides/claude-down-check-status-page) |
| Gemini | [Google Workspace Status Dashboard](https://www.google.com/appsstatus/dashboard/) | Gemini、Gemini Notebook、Google Sign In | [/guides/gemini-down-check-status-page](/guides/gemini-down-check-status-page) |
| Gemini API、AI Studio | [aistudio.google.com/status](https://aistudio.google.com/status) | 过去的事件列表 | 同上 |
| DeepSeek | [status.deepseek.com](https://status.deepseek.com/) | 对话服务、V4 Pro API、V4.1 Flash API、搜索与抓取 API | [/guides/deepseek-down-check-status-page](/guides/deepseek-down-check-status-page) |
| Grok、Cursor | [status.x.ai](https://status.x.ai/) | Grok 分组、Cursor 分组、API、Services | [/guides/grok-down-check-status-page](/guides/grok-down-check-status-page) |
| Kimi | [status.moonshot.cn](https://status.moonshot.cn/) | Kimi、Kimi Code、Open API | [/guides/kimi-down-busy-check-status-page](/guides/kimi-down-busy-check-status-page) |
| GitHub Copilot | [www.githubstatus.com](https://www.githubstatus.com/) | Copilot、Copilot AI Model Providers | 见下文 |

几点说明：

- **ChatGPT 和 Codex 在同一个状态页**，页面上有进行中的事件时，会在顶部显示；
- **Claude 的旧地址 status.anthropic.com** 会自动跳转到 status.claude.com；
- **Gemini 没有给个人用户单独的状态页**，Workspace 页面上列有 Gemini、Gemini Notebook 和 Google Sign In，该页面写明提供的是 Google Workspace 服务的状态，个人账号的情况是否体现，页面没有说明；开发者另看 AI Studio 状态页；
- **Grok 和 Cursor 共用 status.x.ai**，页面上是两个不同的分组；核对当天访问 Cursor 的状态页地址，会被带到同一个页面；
- **GitHub Copilot 看 GitHub 的状态页**，组件里有 **Copilot** 和 **Copilot AI Model Providers** 两项，后者对应 Copilot 背后接入的模型供应方；Copilot 的额度和订阅见 [/guides/github-copilot-free-pro-ai-credits](/guides/github-copilot-free-pro-ai-credits)。

## 二、判断顺序：先自己，再逐家

![几个 AI 都打不开，怎么判断是谁的问题](seed:g1196-who-steps.png)
*图：本站根据各官方状态页和 [OpenAI 帮助中心：Network recommendations](https://help.openai.com/en/articles/9247338-network-recommendations-for-chatgpt-errors-on-web-and-apps) 整理的示意图*

1. **先试普通网站**：同一台电脑上，其他普通网站也打不开，就是网络问题，和 AI 无关；
2. **再切网络**：把电脑从当前 WiFi 切到手机热点；官方帮助中心的这个对比方法，用来判断问题是不是出在公司或家里的网络；
3. **看是只有你，还是大家都这样**：问问同一个网络的同事或家人，是不是也遇到；
4. **再看各家状态页**：不要只看一家。几家状态页同时打开，哪个有进行中的事件一目了然；
5. **都正常**：换设备、换浏览器，更新客户端，再检查账号状态、套餐和所在地区。

## 三、读状态页要注意的三点

- **状态页是整体情况，不是你个人的情况**。官方在 OpenAI 状态页底部就写明，可用率是所有套餐、模型和错误类型汇总的，个别用户的实际体验可能不同；
- **时间多数是 UTC**，只有 Moonshot 的页面写的是 CST（北京时间）；换算时 UTC 加 8 小时就是北京时间；
- **事件标题里常写具体的模型或功能**，例如某个模型的错误升高，不一定影响你用的其他功能，先看你用的那一项有没有被点名。

## 四、都正常了还是不行

各家的详细排查，见站内对应的文章：

- ChatGPT：[/guides/chatgpt-down-check-status-page](/guides/chatgpt-down-check-status-page)、[/guides/chatgpt-something-went-wrong](/guides/chatgpt-something-went-wrong)；
- Claude：[/guides/claude-cant-login-or-use](/guides/claude-cant-login-or-use)；
- Gemini：[/guides/gemini-something-went-wrong-error](/guides/gemini-something-went-wrong-error)、[/guides/gemini-cant-open-or-sign-in](/guides/gemini-cant-open-or-sign-in)；
- DeepSeek：[/guides/deepseek-server-busy](/guides/deepseek-server-busy)；
- Codex：[/guides/codex-stream-disconnected-before-completion](/guides/codex-stream-disconnected-before-completion)。

想开通 ChatGPT Plus 或 Claude Pro 可以看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)、[/chongzhi/claude-pro](/chongzhi/claude-pro)。

## 常见问题

**Q：状态页打不开怎么办？**
如果官方状态页本身也打不开，先看是不是自己网络的问题（普通网站是否正常）。状态页和主服务通常不在同一个系统里，但官方没有就此作说明。

**Q：状态页没事件，但网上很多人都说崩了？**
状态页只显示官方已经发布的事件，发布有延迟，官方也可能没有发布。你可以再等几分钟，或者看你用的那一项的历史事件。

**Q：能订阅所有状态页的通知吗？**
OpenAI、Claude、GitHub 的状态页都有订阅入口（邮件、短信等），Google Workspace 状态页有 RSS 和 JSON 数据入口，具体以各页面为准。

## 参考资料

- OpenAI 状态页 — https://status.openai.com/
- Claude 状态页 — https://status.claude.com/
- Google Workspace Status Dashboard — https://www.google.com/appsstatus/dashboard/
- Google AI Studio 状态页 — https://aistudio.google.com/status
- DeepSeek 状态页 — https://status.deepseek.com/
- xAI 状态页 — https://status.x.ai/
- Moonshot AI 状态页 — https://status.moonshot.cn/
- GitHub 状态页 — https://www.githubstatus.com/
- OpenAI 帮助中心：Network recommendations for ChatGPT errors on web and apps — https://help.openai.com/en/articles/9247338-network-recommendations-for-chatgpt-errors-on-web-and-apps
