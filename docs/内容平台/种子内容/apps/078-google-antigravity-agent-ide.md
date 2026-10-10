---
title: "Google Antigravity 是什么、怎么用：2.0 桌面版、IDE 与 CLI 使用教程"
slug: google-antigravity-agent-ide
name: Google Antigravity
url: https://antigravity.google/
pricing: 个人免费+Google AI 订阅提额+企业付费
platforms: Windows / macOS / Linux / 命令行 / IDE 扩展
trialNote: 个人免费档含多种智能体模型、不限量 Tab 补全，按周有基础速率限制
products: [gemini]
models: []
topics: [coding]
excerpt: "Google Antigravity 是 Google 的智能体开发平台，包含 Antigravity 2.0 桌面应用、IDE 和 CLI，可并行管理多个 AI 智能体写代码、跑任务。"
checkedOn: 2026-10-07
sources:
  - https://antigravity.google/
  - https://antigravity.google/pricing
  - https://antigravity.google/docs/faq/
  - https://antigravity.google/blog/introducing-google-antigravity-2/
  - https://antigravity.google/blog/introducing-google-antigravity-cli/
---

> 本文根据 Google Antigravity 官网、官方定价页、官方 FAQ 与官方博客整理，资料核对于 2026-10-07。功能和价格变化快，以官网为准。

## 是什么

Google Antigravity 是 **Google** 推出的「智能体优先」开发平台。它在 2025 年 11 月以 AI IDE 的形式首次发布；2026 年 5 月 19 日的 I/O 大会上，Google 发布了 **Antigravity 2.0**——一款从零设计、不再以编辑器为中心的独立桌面应用，同时推出 **Antigravity CLI** 和 Antigravity SDK（预览）。同一天 Google 宣布个人用户的 Gemini CLI 迁移到 Antigravity CLI。

现在 Antigravity 是一个产品家族：

- **Antigravity 2.0**：管理多个本地智能体的「指挥中心」，面向开发者也面向知识工作者；
- **Antigravity IDE**：保留完整编辑器的智能体开发环境；
- **Antigravity CLI**：终端里最轻量的智能体入口，用 Go 编写；
- **SDK**：用 Python 搭建自定义智能体（预览）。

底层由最新的 Gemini 模型驱动。

## 能做什么

- **并行管理多个智能体**：在 Agent Manager 里同时派发多个任务，同步或异步查看进度和产出（Artifacts），并直接在产出上给反馈。
- **动态子智能体**：主智能体可按需拆出专注某一子任务的子智能体，避免上下文混乱。
- **Projects 项目**：取代以单个仓库为单位的工作区，可授权访问多个文件夹并分别设定权限。
- **定时任务**：用 `/schedule` 命令按 cron 规则定时唤起智能体，适合日报、巡检类重复工作。
- **浏览器操作**：用 `/browser` 让智能体打开网页、测试前端页面，过程可控。
- **终端工作流**：Antigravity CLI 支持技能（Skills）、Hooks、子智能体和扩展，Gemini CLI 用户可按官方指南迁移原有配置。
- **语音输入**：支持实时语音转文字下达指令。

## 怎么上手

1. 打开 antigravity.google，下载对应系统的 Antigravity 2.0（官网提供 macOS、Windows、Linux 版本）；偏好终端的可从下载页安装 Antigravity CLI。
2. 用**个人 Google 账号**登录（官方 FAQ 建议 Workspace 账号遇到问题时改用 @gmail.com 账号）。
3. 新建一个 Project，授权它访问你的代码文件夹。
4. 先派一个小任务，观察它的计划和产出，例如让它修一个已知 bug 并补测试。
5. 熟悉后再尝试并行任务或 `/schedule` 定时任务。

可以这样开始：「检查这个仓库里所有过时的依赖，列出升级风险，然后在新分支上升级其中风险最低的三个并跑通测试。」

## 免费与付费

官网定价页列出（官网定价页，2026-10 查询）：

- **Individual（个人免费档）**：0 美元/月，可用多种智能体模型，不限量 Tab 补全和 Command 请求，有每周基础速率限制。
- **Google AI Pro / Google AI Ultra**：在免费档基础上提高速率限制，并可使用灵活的 AI 额度池；Ultra 额度更高。订阅价格以 Google One 官网为准。
- **Business（通过 Google Cloud）**：Standard / Plus 每席位每月 30 美元起，另有 0 席位费、按用量计费的方案，带支出上限和集中管理。

## 适合谁 / 不适合谁

适合：
- 想同时让多个 AI 智能体并行干活、自己只做审阅和决策的开发者。
- 原来用 Gemini CLI 免费档、需要迁移的个人用户。
- 想把定时巡检、批量改造这类重复工程任务交给智能体的团队。

不适合：
- 只需要编辑器补全、不想管理智能体流程的人。
- 不熟悉英文界面的新手：官网、文档和界面以英文为主。
- 未满 18 岁的用户，官方不提供服务。

## 注意事项

- **地区与账号**：官方 FAQ 写明服务面向「获批地区」的个人 Google 账号，列出的可用国家和地区中不包括中国大陆和香港。
- **数据收集**：FAQ 说明可以在设置面板里随时关闭数据收集。
- **权限控制**：智能体可以读写文件、执行命令、操作浏览器，给 Project 授权时只开放需要的文件夹，重要操作保留人工确认。
- **核对产出**：并行任务多时更要逐个审阅改动和测试结果，再合并到主分支。
