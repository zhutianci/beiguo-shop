---
title: ChatGPT Canvas 不见了？2026 年 Canvas 怎么用、改成了什么（写作块 / 代码块）
slug: chatgpt-canvas
products: [chatgpt]
models: []
accountTier: FREE
excerpt: ChatGPT 的 Canvas（画布）去哪了？2026 年 5 月 28 日起，OpenAI 把 Canvas 从当前模型中移除，改为在回答里直接出现的「写作块」和「代码块」。本文讲清变化经过，以及新功能怎么编辑、预览、运行和保存。
checkedOn: 2026-10-07
sources:
  - https://help.openai.com/en/articles/6825453-chatgpt-release-notes
  - https://help.openai.com/en/articles/20001246-working-with-writing-blocks-and-code-blocks-in-chatgpt
  - https://openai.com/index/introducing-canvas/
  - https://help.openai.com/en/articles/20001052-file-storage-and-library-in-chatgpt
  - https://chatgpt.com/pricing
  - https://www.digitaltrends.com/computing/you-can-now-send-emails-directly-from-chatgpt-on-the-web-without-leaving-your-conversation/
  - https://community.openai.com/t/feature-request-bring-canvas-back-to-current-chatgpt-models/1386235
verify:
  - 官方未列出「哪些旧模型仍可打开 canvas」；按退役时间表（GPT-4.5 于 6-26、o3 于 8-26、GPT-5.3 Instant 约 8 月初）推断新对话已无法打开 canvas，需站长在 Plus 账号上确认
  - 2026-05-28 之前在 canvas 里写的旧文档，在历史对话中是否还能打开 / 导出，官方未说明
  - 写作块各按钮（编辑、全屏、保存到文件库等）的中文界面名称以实际为准
---

> 本文根据 OpenAI 帮助中心（发布说明、Working with writing blocks and code blocks 等文章）和官方公告整理，核对日期 2026-10-07；截图引用自 OpenAI 官方公告和 Digital Trends 并注明出处。

## 适用于谁

- 以前用 ChatGPT 的 **Canvas（画布）** 写长文、改代码，现在找不到入口的人；
- 搜「ChatGPT canvas 怎么用」「canvas 不见了」「canvas 免费吗」，看到的教程和自己界面对不上的人；
- 想知道现在在 ChatGPT 里改稿、改代码最顺手的方式是什么的人。

## 结论先说

1. **Canvas 不是你账号出了问题，是官方调整。** 2026 年 5 月 28 日，OpenAI 在发布说明里宣布：GPT-5.5 Instant 和 GPT-5.5 Thinking 不再提供 canvas，写作和编程功能改为直接出现在回答里的**写作块（writing blocks）**和**代码块（code blocks）**。
2. **旧模型的过渡期已基本结束。** 官方当时说付费用户可以通过旧模型（legacy models）继续用一段时间，直到这些模型退役；而按官方公布的时间表，相关旧模型已在 2026 年 6–8 月陆续退役。
3. **没有开关能把 canvas 找回来。** 现在想要「边看边改」，用写作块（长文可全屏编辑）和代码块（可预览、可运行 Python）。

## Canvas 是什么、怎么没的

- **2024 年 10 月 3 日**：OpenAI 推出 canvas 测试版，在对话旁边打开一个独立窗口，用户和 ChatGPT 可以一起改文档或代码；在提示词里写「use canvas」也能手动打开。
- **2024 年 12 月 10 日**：canvas 对所有用户开放（含 Free），并加入在 canvas 中运行 Python、在 GPTs 中使用等功能。
- **2026 年 2 月**：ChatGPT 的代码块变成可交互的：能直接编辑、在聊天里预览图表和小应用、分屏查看代码，图表还能导出为图片。
- **2026 年 5 月 28 日**：canvas 从 GPT-5.5 Instant / Thinking 中移除，由写作块和代码块接替。
- **2026 年 6 月 8 日**：写作块扩展到论文、报告、博客等长文场景，可以打开全屏编辑器、保存到文件库、下载。

![2024 年发布时的 canvas：左边是对话，右边是独立的文档窗口，选中标题后弹出「make it more creative」修改框（早期界面，现已不再提供）](seed:g16-canvas-2024.jpg)
*图片来源：[OpenAI 官方公告《Introducing canvas》](https://openai.com/index/introducing-canvas/)*

所以网上 2024–2025 年的「Canvas 教程」里说的工具栏、阅读水平滑块、「use canvas」触发词，在 2026 年的新对话里已经对不上了。

## 现在怎么用：写作块

按帮助中心说明，**写作块**是回答里一块可编辑的草稿区域，用于邮件、消息、社交媒体文案和文档。ChatGPT 判断你可能要修改或复用的文字时会自动放进写作块，你也可以直接要求它生成。

### 1. 让 ChatGPT 生成写作块

可以这样说（官方示例的中文版）：

- 「帮我起草一封回复领导的邮件。」
- 「写一段发给团队的简短进展通报。」
- 「把这些笔记整理成一页文档。」

### 2. 直接在块里改

根据你的套餐、设备和功能开放情况，写作块里可以：

- 点进去**直接改文字**，或复制全文；
- 选中一段，让 ChatGPT **只改这一段**，也可以让它改整篇；
- 打开**全屏编辑**（适合长文，带目录）；
- **撤销 / 重做** AI 做的修改；
- 设置常用格式：加粗、斜体、标题、链接、项目符号、编号和待办清单；
- 把文档草稿**保存到文件库（Library）**，之后再找出来继续改；
- 邮件草稿可以打开到邮件 App；连接了 Gmail 或 Outlook 的 Plus、Pro、Business、Enterprise 用户，在网页版还能直接发送（发送前请自己确认收件人和内容）。

![写作块示例：一封邮件草稿放在单独的「Email」块里，选中一段文字后浮出「Ask for changes」、加粗、斜体等工具（英文界面）](seed:g16-writing-block.jpg)
*图片来源：[Digital Trends](https://www.digitaltrends.com/computing/you-can-now-send-emails-directly-from-chatgpt-on-the-web-without-leaving-your-conversation/)（原图注明 OpenAI）*

改完的内容会在短暂延迟后随对话自动保存，之后追问时 ChatGPT 会基于最新版本继续。注意：**临时聊天里的修改，对话结束后可能不会保留。**

## 现在怎么用：代码块

ChatGPT 通常把代码放在代码块里。按帮助中心说明，代码块可以：

- 复制代码、查看语言标签（Python、JavaScript、HTML 等）；
- 直接编辑，或让 ChatGPT 修改；
- 全屏打开；
- 在 **Code（代码）** 和 **Preview（预览）** 之间切换。支持预览的包括 HTML 页面、React 组件、SVG 图片、Mermaid 图表、Vega / Vega-Lite 图表；没有「Preview」按钮就说明这段代码不支持预览；
- 对支持的 Python 代码点 **Run（运行）**，在控制台查看输出或报错，也能中途停止。

代码预览和运行都在沙盒环境里进行；如果预览需要加载外部资源，ChatGPT 可能会先征求你的同意。工作区管理员可以关闭代码执行和联网。

一个替代以前「canvas 写网页」的例子：

> 用一个 HTML 文件写一个番茄钟页面，25 分钟倒计时，有开始 / 暂停 / 重置按钮，界面简洁。写完后我要在预览里直接试用。

## Canvas 免费吗？现在 Free 能用吗

canvas 在 2024 年 12 月起对 Free 开放过，现在已经不再提供，这个问题本身失效了。写作块和代码块的帮助文章写的是「可用操作因套餐、设备、工作区设置、模型和推出进度而不同」，没有把它们限定为付费功能；其中「直接发送邮件」这一项明确只面向 Plus、Pro、Business、Enterprise。

## 常见问题

**Q：能不能在设置里把 canvas 打开？**
不能。官方说明是 canvas 不再提供于 GPT-5.5 Instant / Thinking，只留了「通过旧模型短期继续使用」的过渡安排，而相关旧模型已按计划退役。

**Q：以前在 canvas 里写的东西还在吗？**
官方没有专门说明旧 canvas 文档的处理方式。建议打开历史对话检查，需要保留的内容尽快复制或下载。

**Q：写作块和 canvas 最大的区别是什么？**
canvas 是在对话旁边单独打开的工作区；写作块和代码块嵌在回答里，长文可以切到全屏编辑。OpenAI 社区里有不少用户反馈更喜欢原来的独立工作区，但截至 2026-10-07 官方没有恢复 canvas 的计划公告。

**Q：长篇文档写到一半，怎么接着改？**
让 ChatGPT 把文档放进写作块，用全屏编辑，改好后保存到文件库；下次在新对话里通过「+」→「从文件库添加」把它带进来继续。

**Q：想要更强的写代码体验呢？**
可以用 Codex，它能读整个项目、改文件、跑测试，见本站《Codex 入门教程》。

## 参考资料

- ChatGPT Release Notes（2026-05-28 canvas 移除、2026-06-08 全屏写作块、2026-02-19 交互式代码块）— https://help.openai.com/en/articles/6825453-chatgpt-release-notes
- OpenAI 帮助中心：Working with writing blocks and code blocks in ChatGPT — https://help.openai.com/en/articles/20001246-working-with-writing-blocks-and-code-blocks-in-chatgpt
- OpenAI：Introducing canvas（2024）— https://openai.com/index/introducing-canvas/
- OpenAI 帮助中心：Using Library to manage files in ChatGPT — https://help.openai.com/en/articles/20001052-file-storage-and-library-in-chatgpt
- 截图来源：OpenAI 官方公告、Digital Trends（见各图下方链接）
