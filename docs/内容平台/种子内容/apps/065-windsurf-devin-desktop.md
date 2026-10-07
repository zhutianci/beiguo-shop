---
title: "Windsurf 是什么：现已更名 Devin Desktop，官网、价格与上手"
slug: windsurf-devin-desktop
name: Devin Desktop（原 Windsurf）
url: https://devin.ai/desktop
pricing: 免费+付费
platforms: Windows / macOS / Linux / 命令行
trialNote: 免费版含少量 Agent 额度、部分模型、不限次数的 Tab 补全和行内编辑
products: [ai-tools]
models: []
topics: [coding, ai-agent]
excerpt: "Windsurf 归入 Cognition 旗下后，于 2026 年 6 月 2 日更名为 Devin Desktop：一个兼容 VS Code 的完整 IDE，加上统一管理本地和云端多个编程智能体的“指挥中心”，原 Windsurf 设置和计划自动沿用。"
checkedOn: 2026-10-07
sources:
  - https://devin.ai/blog/windsurf-is-now-devin-desktop
  - https://docs.devin.ai/desktop/devin-desktop-faq
  - https://devin.ai/pricing
  - https://devin.ai/desktop
---

> 本文根据 Devin（Cognition）官网、官方博客、Devin Desktop 文档和定价页整理，资料核对于 2026-10-07。功能和价格变化快，以官网为准。

## 是什么

如果你在找 Windsurf：它已经改名了。Windsurf 原本是 Codeium 团队推出的 AI 代码编辑器（官方文档里的配置路径仍沿用 codeium 命名），后来归入开发 AI 软件工程师 Devin 的 Cognition 公司旗下。2026 年 6 月 2 日，Cognition 通过一次自动更新把 Windsurf 正式更名为 **Devin Desktop**，现在访问 windsurf.com 会跳转到 devin.ai/desktop。

官方 FAQ 说明，Devin Desktop 还是原来那个编辑器，功能不变：扩展、快捷键、LSP 和工作流都与 Windsurf 和 VS Code 向后兼容，原有设置、规则会自动迁移，个人计划和价格不变。变化在于默认界面换成了“Agent 指挥中心（Agent Command Center）”——用看板视图统一管理本地和云端的多个智能体。原 Windsurf 的本地智能体 Cascade 被新的 **Devin Local** 取代（官方称 token 效率最多提升约 30%，并支持子智能体和沙箱），旧版 Cascade 只保留到 2026 年 7 月。

**和同类的区别**：Devin Desktop 的卖点是“一个窗口管所有智能体”：除了自家的 Devin Local、Devin Cloud，还能通过 Agent Client Protocol（ACP）接入 Codex、Claude Agent、OpenCode 等第三方智能体。Cursor 主要围绕自家 Agent，Copilot 则是嵌入现有 IDE 的插件。

## 能做什么

- **完整的 IDE**：语法高亮、自动补全、调试工具齐全，Tab 补全和行内编辑在所有档位都不限次数。
- **Agent 指挥中心**：用看板查看每个智能体的状态（进行中、待审查、已完成），统一规划、分派、审查和合并。
- **Devin Local 与 Devin Cloud**：小任务在本地跑，长任务交给云端自主智能体；付费档可使用云端智能体。
- **Spaces 共享上下文**：把相关的会话、PR、文件和上下文归到一个空间，让多个智能体共享信息。
- **接入第三方智能体**：通过 ACP 在同一界面里使用 Codex、Claude Agent、OpenCode 等。
- **多家模型可选**：付费档可用 OpenAI、Claude、Gemini、SpaceXAI 的前沿模型和主流开源模型，以及 Cognition 自研的 SWE-2。

## 怎么上手

1. 已经装了 Windsurf 的用户无需操作，正常接收更新即会变成 Devin Desktop，登录状态和计划保留。
2. 新用户打开 devin.ai/desktop，下载对应系统的安装包（官方文档提到 macOS、Windows、Linux），注册账号登录。
3. 首次打开会进入 Agent 指挥中心，新建会话（New session），选择一个本地代码仓库。
4. 选择智能体（如 Devin Local）和模型，描述任务；需要直接看代码时切到编辑器视图。
5. 习惯命令行的话，原来的 `surf` 命令已改为 `devin-desktop`（旧命令仍保留兼容）。

可以这样开始：

```text
阅读这个仓库，列出主要模块和它们之间的依赖关系。然后新建一个会话，给登录接口补上错误处理和对应测试。
```

## 免费与付费

官网定价页（月付价格，2026-10 查询）：

| 档位 | 价格 | 主要区别 |
| --- | --- | --- |
| Free | 0 | 少量 Agent 额度，部分模型，Tab 补全和行内编辑不限 |
| Pro | 20 美元/月 | 更高额度，全部模型，可用云端智能体 Devin Cloud，可按 API 价加购用量 |
| Max | 200 美元/月 | 在 Pro 基础上额度显著提高 |
| Teams | 80 美元/月（团队）+ 每个完整开发席位 40 美元/月 | 最多 200 人，集中计费、管理后台 |

Enterprise 需联系销售（可选 VPC 部署、SAML/OIDC SSO 等）。付费档额度按天和按周自动刷新。定价页注明 SWE-2 在 Devin Desktop 和 CLI 中免费使用至 2026 年 10 月 16 日，之后以官网为准。

## 适合谁 / 不适合谁

**适合：**
- 原 Windsurf 用户——升级后工作流基本不变；
- 同时在用多个编程智能体（如 Codex、Claude）、想在一个界面里统一调度的人；
- 需要把任务拆给多个本地/云端智能体并行处理的团队。

**不适合：**
- 使用 JetBrains 的用户：官方 FAQ 说 Windsurf 的 JetBrains 插件已进入维护模式，改为推荐通过 ACP 使用 Devin；
- 只想要简单补全、不需要智能体管理的人；
- 对品牌和产品频繁调整比较在意、需要长期稳定工具链的团队，建议先评估。

## 注意事项

- **改名带来的混淆**：网上很多“Windsurf 教程”写的是 Cascade 等旧界面，已不适用；以 Devin Desktop 官方文档为准。
- **Devin Cloud 计费**：云端智能体的使用方式和计费，个人档以定价页为准，企业团队需与 Cognition 客户团队确认。
- **数据与隐私**：本文整理的官方 FAQ 中没有专门说明训练政策，使用前请阅读官网页脚的 Privacy Policy 和 Data Use 页面。
- **审查 AI 改动**：智能体会修改文件、执行命令，务必在版本控制下使用，合并前人工审查。
