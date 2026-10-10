---
title: ChatGPT Work 和 Codex 有什么区别：ChatGPT Work 是什么、该用哪个、额度是否共用
slug: chatgpt-work-vs-codex
products: [chatgpt, codex]
models: []
accountTier: PLUS
excerpt: ChatGPT Work 是什么，和 Codex 有什么区别？按官方文档讲清两者定位、能力重叠、桌面 App 界面差异、各套餐能否使用、额度是否共用，以及不同任务该选 Chat、Work 还是 Codex。
checkedOn: 2026-10-07
sources:
  - https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex
  - https://learn.chatgpt.com/docs/use-chatgpt
  - https://learn.chatgpt.com/docs/get-started-with-work
  - https://learn.chatgpt.com/docs/pricing
  - https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan
  - https://help.openai.com/en/articles/12642688-using-credits-for-flexible-usage-in-chatgpt-personal-plans
  - https://chatgpt.com/pricing
  - https://help.openai.com/en/articles/6825453-chatgpt-release-notes
verify:
  - 桌面 App 左上角菜单与顶部 Chat / Work 切换的中文界面名称未核实
  - Free / Go 在桌面 App 里使用 Work 和 Codex 为「有限」，具体额度官方未公开
---

> 本文根据 OpenAI 帮助中心《ChatGPT Work and Codex》、官方文档（learn.chatgpt.com）的《Use ChatGPT》《Get started with ChatGPT Work》和 Codex 定价页整理，资料核对于 2026-10-07。

## 适用于谁

- 在 ChatGPT 里看到 Chat、Work、Codex 三个入口，不知道该点哪个的人；
- 搜「ChatGPT Work 是什么」「Work 和 Codex 的区别」，想知道两者是不是一回事、额度会不会互相抢的人；
- 已经在用 Codex，想知道写报告、做 PPT 要不要换到 Work 的人。

Work 的具体用法（怎么下指令、怎么审批、怎么拿交付物）见 [ChatGPT Work 使用教程](/guides/chatgpt-agent-mode)；Codex 的安装见 [Codex 入门教程](/guides/codex-getting-started)。

## 结论先说

1. **ChatGPT Work 是 ChatGPT 里的智能体模式**，2026 年 7 月 9 日推出，接替了原来的 Agent 模式：你交代一个结果，它自己规划、查资料、用工具，最后交给你文档、表格、演示稿、报告或网站（Sites）。
2. **Codex 是专门做软件开发的智能体**：读写代码仓库、跑终端命令和测试、看 diff、审 PR。
3. **能力大面积重叠**：官方明说喜欢 Codex 的人可以继续用 Codex 做调研、写文档、做演示；Work 是同样的核心能力，换成了面向日常工作的界面，隐藏 Git、命令行这些技术细节。
4. **额度共用**：Work 和 Codex 用同一套定价、credits 和使用限制；在 Plus / Pro 上，Office 插件（Excel、PowerPoint、Word）也从这份额度里扣。
5. **怎么选**：只想问问题、改一段话 → Chat；要一份做好的成品 → Work；和代码打交道 → Codex。

## 一张表看懂区别

| 对比项 | ChatGPT Work | Codex |
|---|---|---|
| 定位 | 长时间、多步骤任务，交付成品 | 软件开发与技术工作 |
| 典型任务 | 竞品对比表、八页汇报 PPT、调研报告、每周例会议程、网站 | 修 bug、写功能、跑测试、审 PR、看仓库 |
| 网页 / 手机 | 可用，任务在云端运行 | 可通过 **Codex Cloud** 在网页和手机上发起、继续云端编程任务；手机 App 的 **Remote** 标签可访问桌面上的 Codex 对话 |
| 桌面 App | 选 **ChatGPT**，再切到顶部的 **Work**；经授权可用本地文件和桌面应用 | 左上角菜单选 **Codex**，单独一个视图 |
| 其他入口 | — | CLI（终端）、IDE 插件 |
| 对话历史 | 和 Chat 的对话一起显示在 Recents，可筛选 | 和 ChatGPT 历史分开 |
| 技术细节 | 默认隐藏 Git、命令行等细节，用非技术语言汇报 | 显示 diff、审查视图和实现细节 |
| PR 面板 | 不提供 | 开启后可用 |
| 模型 | GPT-6.1 Sol、GPT-6 Sol、GPT-6 Luna 等，只在 Work 和 Codex 里提供，普通 Chat 里没有 | 同左 |
| 额度 | 与 Codex 共用 | 与 Work 共用 |

（桌面端对比内容来自官方文档《Use ChatGPT》的「Compare ChatGPT Work and Codex on desktop」一节。）

## 各套餐能不能用

按 2026-10-07 的官方定价页和帮助中心：

- **Free / Go**：Work 和 Codex 都是「有限」使用，主要在桌面 App 里，逐步开放；**Codex Cloud 不包含**。
- **Plus / Pro**：Work 在桌面、网页、手机都能用；Codex 的网页、CLI、IDE、云端、GitHub 自动审查等完整入口都有，Pro 额度更多（Pro 目前没有 5 小时限制）。
- **Business / Enterprise / Edu**：管理员可以分开控制 **Work Cloud**、**Work Local**、**Codex Local** 和 **Codex Cloud**，改了其中一个不影响另一个；Chat 在任何配置下都可用。

价格请看 https://chatgpt.com/pricing 。如果打算开通 Plus，可以看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

## 额度共用到底意味着什么

- 官方定价页原话的意思是：**Work 在 ChatGPT 里的用量，和 Codex 用同样的价格、credits 和使用限制**。帮助中心也写明 Work「沿用 Codex 的用量结构」，只是定价页的例子都是编程任务，Work 的实际消耗视任务而定。
- 所以你上午在 Work 里做了一份大报告，下午 Codex 的 5 小时窗口或每周额度也会相应变少，反过来也一样。
- 在 Plus / Pro 上，ChatGPT for Excel、PowerPoint、Word 也走这份智能体额度；买的 credits 也能在这些功能之间通用。
- 普通 Chat 对话、Chat 里的生图和语音有各自独立的限制，不占这份额度。
- 具体数字、查看方法和用完后的办法，见 [Codex 额度与使用限制](/guides/codex-usage-limits)。

## 什么任务该用哪个

### 用 Chat

快速提问、头脑风暴、改写一段文字、比较几个选项、总结一个文件。官方建议「只需要建议」的场景就用 Chat，省额度。

### 用 Work

- 任务要用到多个来源、插件或步骤；
- 手动做要花不少时间；
- 产出是你要审阅、修改或复用的文件；
- 需要定期重复、监控或更新（Work 支持定时任务和由 Gmail、Slack、GitHub 事件触发的任务）。

示例：

```
根据附件里的访谈记录和问卷结果，做一份 8 页的产品评审 PPT：聚焦客户反映最多的三个问题，每个问题附证据，把「发现」和「建议」分开写，证据不足的结论单独标出来。先给我草稿，确认后再定稿。
```

### 用 Codex

写代码、调试、跑测试和命令、审查改动、在仓库里实现功能。需要看到 diff、分支、终端输出的，就用 Codex。

```
这个仓库的登录接口偶尔返回 500。先复现问题，找到原因后修复，并补一个能覆盖这个情况的测试，跑通全部测试后给我看 diff。
```

### 两边都能做的事

做网页、做数据分析、整理文档，两边都能完成。官方的建议可以概括成：**看你想要什么样的过程**——想要成品、少看技术细节，选 Work；想控制每一处代码改动，选 Codex。比如 ChatGPT Sites 既可以在 Work 里做，也可以在桌面 App 的 Codex 里做（见 [ChatGPT Sites 怎么用](/guides/chatgpt-sites)）。

## 怎么在三者之间切换

- **桌面 App**：左上角菜单选 **ChatGPT** 或 **Codex**；选了 ChatGPT 之后，在页面顶部的切换器里选 **Chat** 或 **Work**。在 Codex 里点 **New chat** 可以打开 **Quick chat**，快速问个普通问题。
- **网页**：选 **Work** 即可进入 Work；Codex 云端任务也可以在网页上发起和继续。
- **手机**：顶部下拉菜单选 **Chat** 或 **Work**；桌面上的 Codex 对话在 **Remote** 标签里。

桌面 App 的下载和系统要求见 [ChatGPT 桌面版教程](/guides/chatgpt-desktop-app)。

## 常见问题

**Q：Work 能用我电脑上的文件吗？**
桌面 App 里可以：打开本地文件夹或项目，只授权任务需要的文件。网页和手机上的 Work 不能直接访问你电脑上的文件。注意即使任务在本地运行，消息和任务上下文也可能存储在云端。

**Q：原来的 Agent 模式去哪了？**
Agent 模式已下线，能力由 ChatGPT Work 和它的云端浏览器接替，详见 [/guides/chatgpt-agent-mode](/guides/chatgpt-agent-mode)。

**Q：Work 和 Codex 的对话能互相看到吗？**
桌面 App 里 Codex 的历史和 ChatGPT 的历史是分开的；Chat 和 Work 的对话则一起出现在 Recents 里。

**Q：我只买了 Plus，能用 GPT-6 Astra 吗？**
Plus 在 Work 和 Codex 里包含**有限**的 Astra 用量，用完可以用 credits 继续；Chat 里的 GPT-6 Pro（由 Astra 驱动）则只对 Pro、Business、Enterprise 开放。

**Q：用 API Key 登录 Codex，也能用 Work 吗？**
官方定价页的功能表里，API Key 不包含网页版 Work 和 Codex Cloud；API Key 登录的 Codex 按 API 价格计费，不走 ChatGPT 套餐额度。

## 参考资料

- OpenAI 帮助中心：ChatGPT Work and Codex — https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex
- 官方文档：Use ChatGPT（含 Work 与 Codex 桌面端对比）— https://learn.chatgpt.com/docs/use-chatgpt
- 官方文档：Get started with ChatGPT Work — https://learn.chatgpt.com/docs/get-started-with-work
- Codex 官方定价页 — https://learn.chatgpt.com/docs/pricing
- OpenAI 帮助中心：Using Codex with your ChatGPT plan — https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan
- OpenAI 帮助中心：Using Credits for Flexible Usage in ChatGPT — https://help.openai.com/en/articles/12642688-using-credits-for-flexible-usage-in-chatgpt-personal-plans
- ChatGPT 套餐对比 — https://chatgpt.com/pricing
- ChatGPT Release Notes（2026-07-09 推出 ChatGPT Work）— https://help.openai.com/en/articles/6825453-chatgpt-release-notes
