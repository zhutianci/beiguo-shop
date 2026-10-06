---
title: ChatGPT Agent 模式是什么、怎么用（2026 年已改为 ChatGPT Work）
slug: chatgpt-agent-mode
products: [chatgpt]
models: []
accountTier: PLUS
excerpt: ChatGPT 的 Agent 模式能替你上网操作、处理文件；2026 年 7 月起它已下线，能力并入 ChatGPT Work 和云端浏览器。本文讲清它原来是什么、现在去哪用、怎么用。
sources:
  - https://help.openai.com/en/articles/11752874-chatgpt-agent
  - https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex
  - https://help.openai.com/en/articles/20001280-using-cloud-browser-in-chatgpt
  - https://learn.chatgpt.com/docs/get-started-with-work
  - https://help.openai.com/en/articles/6825453-chatgpt-release-notes
screenshots:
  - 对话页顶部 / 输入框附近的「Chat ↔ Work」切换入口
  - Work 任务进行中的进度面板（步骤列表、可插话）
  - Work 暂停等待批准 / 登录时的提示卡片
  - 云端浏览器运行画面（打码账号信息）
  - Work 交付的文档 / 表格 / 幻灯片结果
verify:
  - Agent 模式下线的确切日期：第三方称 2026-07-08 前后入口消失、8 月初帮助页改为「不再提供」，需在官方 release notes 里核对
  - ChatGPT Work 在 Free / Go 是否可用：官方帮助称 Work 与 Codex 包含在 Free、Go、Plus、Pro 等套餐中，但云端浏览器不含 Free 和 Go，需实测
  - Work 的额度与 Codex 共用、按 5 小时窗口计算——来自官方帮助摘要，具体次数需实测
  - 中文界面里 Work 的叫法（「工作」还是保留英文 Work）
---

## 适用于谁

- 搜「ChatGPT agent 模式怎么用」，却在界面里找不到 Agent 入口的人；
- 想让 ChatGPT **替你动手**：打开网页查资料、填表、整理表格、做成 PPT 或报告；
- 本文按 Plus 账号写。

## 结论先说

1. **Agent 模式（ChatGPT agent）已经下线**。它在 2025 年 7 月推出，让 ChatGPT 在一台虚拟电脑里用浏览器、终端和文件替你完成多步骤任务。2026 年 7 月起，入口陆续消失，OpenAI 帮助中心现在写的是该功能不再提供。
2. **现在去哪用：ChatGPT Work + 云端浏览器**。OpenAI 在 2026 年 7 月 9 日推出 ChatGPT Work，定位是处理更长的多步骤任务、直接交付文档 / 表格 / 演示稿等成品；需要在网站上点按、填表时，由 Work 里的**云端浏览器**来完成。
3. 旧 Agent 的「每月 40 次（Plus）/ 400 次（Pro）」限制已经不适用；Work 的额度和 Codex 共用，按官方说明是按滚动时间窗计算（具体以产品内显示为准）。

## Agent 原来能做什么（帮你判断 Work 能不能替代）

旧 Agent 模式主要做三类事：
- **上网办事**：打开网站、比价、查信息、填写表单；
- **处理文件**：读你上传的文件，编辑表格，生成幻灯片；
- **连接应用**：读取已连接的网盘、邮箱等数据。

这些在 ChatGPT Work 里基本都有对应能力：Work 负责拆解任务、读文件和应用、产出成品；云端浏览器负责「在网页上点按」。

## 步骤：用 ChatGPT Work 完成原来 Agent 的任务

### 1. 切换到 Work

在网页版或手机 App 上，把对话从 **Chat** 切换为 **Work**（入口在对话页顶部或输入框附近）。可以新开对话，也可以打开一个已有的**项目**，让 Work 使用项目里的文件和说明。

【截图：「Chat ↔ Work」切换入口】

### 2. 交代清楚「要交付什么」

Work 适合「有明确结果」的任务。写需求时说明：

- **结果**：一份 10 页的 PPT / 一张对比表 / 一份调研报告；
- **素材**：上传的文件、指定网站、已连接的应用；
- **约束**：语言、篇幅、格式、不能做的事；
- **什么时候停下来问你**：比如「提交表单前先让我确认」。

示例：「根据我上传的三份报价单，做一张对比表，再整理成 5 页的中文汇报 PPT；涉及付款或提交的步骤一律先停下来问我。」

### 3. 跟进进度、随时插话

Work 运行时会显示步骤进度。你可以回答它的提问、改变方向，或在关键动作前批准 / 拒绝。

【截图：Work 进度面板】

### 4. 需要登录或确认时，自己来

用云端浏览器访问需要登录的网站时，任务会暂停，等你自己登录或确认。**密码、支付信息请自己输入，不要写进对话里。** 云端浏览器目前只在付费套餐提供，不含 Free 和 Go（待实测）。

【截图：等待登录 / 批准的提示卡片】

### 5. 检查交付物

Work 完成后会给出文档、表格、演示稿等文件。数字、引用、日期请逐项核对后再用。

【截图：Work 交付结果】

## 常见问题

**Q：我以前设置的 Agent 定时任务还在吗？**
有用户反馈下线后定时任务不再运行。请在 Work 里重新建立需要的定时 / 重复任务（待实测）。

**Q：Work 和深度研究有什么区别？**
深度研究专注于「查资料、写带引用的报告」；Work 更像一个能动手的助手，结果可以是文件、表格、网页。Work 里也能调用深度研究。

**Q：Work 有次数限制吗？**
有。官方说明 Work 在 ChatGPT 里的用量和 Codex 共用同一套额度，长任务消耗更多。具体剩余量以产品内显示为准。

**Q：Free 能用吗？**
官方称 Work 覆盖包括 Free 在内的多个套餐，但能力和额度不同，云端浏览器不含 Free（待实测）。如需开通 Plus，可前往 /chongzhi/chatgpt-plus。

**Q：为什么有的网站打不开或被拦？**
部分网站会拦截自动化访问。OpenAI 为云端浏览器提供了站点放行说明，但能否访问由网站方决定。

## 参考资料

- OpenAI 帮助中心：ChatGPT agent（现为下线说明） — https://help.openai.com/en/articles/11752874-chatgpt-agent
- OpenAI 帮助中心：ChatGPT Work and Codex — https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex
- OpenAI 帮助中心：Using cloud browser in ChatGPT — https://help.openai.com/en/articles/20001280-using-cloud-browser-in-chatgpt
- OpenAI 文档：Get started with Work — https://learn.chatgpt.com/docs/get-started-with-work
- ChatGPT Release Notes — https://help.openai.com/en/articles/6825453-chatgpt-release-notes
