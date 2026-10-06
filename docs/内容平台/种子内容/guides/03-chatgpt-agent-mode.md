---
title: ChatGPT Agent 模式是什么、怎么用（2026 年已改为 ChatGPT Work）
slug: chatgpt-agent-mode
products: [chatgpt]
models: []
accountTier: PLUS
excerpt: ChatGPT 的 Agent 模式能替你上网操作、处理文件；如今它已下线，能力由 2026 年 7 月推出的 ChatGPT Work 和云端浏览器接替。本文讲清它原来是什么、现在去哪用、怎么用。
checkedOn: 2026-10-07
sources:
  - https://help.openai.com/en/articles/11752874-chatgpt-agent
  - https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex
  - https://help.openai.com/en/articles/20001280-using-cloud-browser-in-chatgpt
  - https://learn.chatgpt.com/docs/get-started-with-work
  - https://help.openai.com/en/articles/6825453-chatgpt-release-notes
  - https://help.openai.com/en/articles/10169521-projects-in-chatgpt
  - https://www.datacamp.com/tutorial/chatgpt-work-for-business
  - https://www.macstories.net/stories/hands-on-with-chatgpt-works-new-cloud-browser-feature/
---

## 适用于谁

- 搜「ChatGPT agent 模式怎么用」，却在界面里找不到 Agent 入口的人；
- 想让 ChatGPT **替你动手**：打开网页查资料、填表、整理表格、做成 PPT 或报告；
- 本文根据 OpenAI 帮助中心、官方文档和公开评测整理，按 Plus 账号写。

## 结论先说

1. **Agent 模式（ChatGPT agent）已经下线**。它在 2025 年 7 月推出，让 ChatGPT 在一台虚拟电脑里用浏览器、终端和文件替你完成多步骤任务。OpenAI 帮助中心现在写的是该功能**不再提供**，并指引用户改用 ChatGPT Work 和云端浏览器。官方没有在更新日志里公布确切的下线日期，第三方报道称入口是在 2026 年 7 月到 8 月初之间陆续消失的。
2. **现在去哪用：ChatGPT Work + 云端浏览器**。OpenAI 在 2026 年 7 月 9 日推出 ChatGPT Work，定位是处理更长的多步骤任务、直接交付文档 / 表格 / 演示稿 / 报告等成品；需要在网站上点按、填表时，由 Work 里的**云端浏览器**来完成。
3. 旧 Agent 的按月次数限制已经不适用。官方说明 Work 与 Codex 采用**同一套用量结构**，任务越长、越复杂消耗越多，具体额度以官方说明和产品内显示为准。

## Agent 原来能做什么（帮你判断 Work 能不能替代）

旧 Agent 模式主要做三类事：
- **上网办事**：打开网站、比价、查信息、填写表单；
- **处理文件**：读你上传的文件，编辑表格，生成幻灯片；
- **连接应用**：读取已连接的网盘、邮箱等数据。

这些在 ChatGPT Work 里基本都有对应能力：Work 负责拆解任务、读文件和应用、产出成品；云端浏览器负责「在网页上点按」，ChatGPT 会自己判断什么时候用它，不需要单独选择。

## 步骤：用 ChatGPT Work 完成原来 Agent 的任务

### 1. 切换到 Work

- **网页版 / 桌面 App**：在页面顶部的 **Chat / Work** 切换里选 **Work**；
- **手机 App**：在屏幕顶部的下拉菜单里选 Work。

中文界面里是否翻译成「工作」，以你看到的界面为准。可以新开对话，也可以打开一个已有的**项目**，在项目里选 Work，让它使用项目里的文件和说明。注意：设置为「仅项目记忆」的项目里不能使用 Work。

![对话页顶部的 Chat / Work 切换](seed:g03-chat-work-toggle.webp)
*图片来源：[OpenAI 文档：Get started with ChatGPT Work](https://learn.chatgpt.com/docs/get-started-with-work)*

### 2. 交代清楚「要交付什么」

Work 适合「有明确结果」的任务。官方建议写清楚：

- **结果**：一份 10 页的 PPT / 一张对比表 / 一份调研报告；
- **素材**：上传的文件、指定网站、已连接的应用或插件（可以输入 `@` 加插件名点名使用）；
- **约束**：语言、篇幅、格式、只用哪些来源；
- **什么时候停下来问你**：比如「提交表单前先让我确认」。

示例：「根据我上传的三份报价单，做一张对比表，再整理成 5 页的中文汇报 PPT；涉及付款或提交的步骤一律先停下来问我。」

### 3. 跟进进度、随时插话

Work 运行时会显示步骤进度。你可以回答它的提问、改变方向，或在关键动作前批准 / 拒绝。下图是第三方评测里的例子：Work 按要求先列出修改后的五步计划，明确表示等用户批准后才开始分析和生成文件。

![Work 列出计划并等待用户批准](seed:g03-work-plan-approval.png)
*图片来源：[DataCamp](https://www.datacamp.com/tutorial/chatgpt-work-for-business)*

### 4. 需要登录或确认时，自己来

云端浏览器访问新网站前，默认会先征得你同意（可在 设置 → 云端浏览器（Settings › Cloud browser）里改成「总是询问 / 自动批准 / 总是允许」，官方不推荐最后一种）。遇到需要登录的网站，任务会暂停，弹出**安全登录表单**让你自己输入账号密码和两步验证码；官方说明这些凭据直接进入远程浏览器，模型看不到，ChatGPT 也不保存。预订、付款等难以撤销的操作前，它会在对话里请你确认。

**密码、验证码、支付信息不要写进对话里。** 官方说明云端浏览器只在付费套餐提供，不含 Free 和 Go；其中「在云端浏览器里登录网站」这项能力，2026 年 8 月上线时写明面向 Plus 和 Pro。

![手机端 Work：说明将走安全登录流程，并显示云端浏览器画面（敏感信息已由原作者打码）](seed:g03-work-signin.jpg)
*图片来源：[MacStories](https://www.macstories.net/stories/hands-on-with-chatgpt-works-new-cloud-browser-feature/)*

### 5. 检查交付物

Work 完成后会给出文档、表格、演示稿等文件。数字、引用、日期请逐项核对后再用。

![Work 完成后交付的文档、表格和演示稿链接](seed:g03-work-deliverables.png)
*图片来源：[DataCamp](https://www.datacamp.com/tutorial/chatgpt-work-for-business)*

## 常见问题

**Q：我以前设置的 Agent 定时任务还在吗？**
官方没有说明旧 Agent 定时任务的去向。Work 支持「定时任务」（Scheduled Tasks），可以只跑一次、按计划重复、由事件触发或监控变化；需要的话请在 Work 里重新建立。

**Q：Work 和深度研究有什么区别？**
深度研究专注于「查资料、写带引用的报告」；Work 更像一个能动手的助手，结果可以是文件、表格、演示稿、网站。Work 本身也能调研分析，但官方没有说明它与深度研究次数之间如何换算。

**Q：Work 有次数限制吗？**
有。官方说明 Work 与 Codex 用的是同一套用量结构，长任务消耗更多，超出后可按官方规则购买额外额度。具体剩余量以产品内显示为准。

**Q：Free 能用吗？**
不能。官方 7 月 9 日的发布说明写明网页和手机端的 Work 面向「除 Free 和 Go 以外的付费套餐」，帮助中心现在的表述是「符合条件的付费套餐」。如需开通 Plus，可前往 /chongzhi/chatgpt-plus。

**Q：为什么有的网站打不开或被拦？**
部分网站会拦截自动化浏览器访问，这是网站方的设置，不是 ChatGPT 决定的。可以换一个网站，或自己在浏览器里打开；网站方如果愿意放行，可以按 OpenAI 的云端浏览器放行说明操作。

## 参考资料

- OpenAI 帮助中心：ChatGPT agent（现为下线说明） — https://help.openai.com/en/articles/11752874-chatgpt-agent
- OpenAI 帮助中心：ChatGPT Work and Codex — https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex
- OpenAI 帮助中心：Using cloud browser in ChatGPT — https://help.openai.com/en/articles/20001280-using-cloud-browser-in-chatgpt
- OpenAI 文档：Get started with ChatGPT Work — https://learn.chatgpt.com/docs/get-started-with-work
- ChatGPT Release Notes（2026-07-09 推出 Work、2026-08-25 云端浏览器支持登录） — https://help.openai.com/en/articles/6825453-chatgpt-release-notes
