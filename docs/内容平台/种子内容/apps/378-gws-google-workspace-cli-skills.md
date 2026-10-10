---
title: "gws 是什么、怎么安装使用：Google Workspace 命令行工具与 Agent Skills（让智能体操作 Gmail、Drive、日历、表格）"
slug: gws-google-workspace-cli-skills
name: gws（googleworkspace/cli）
url: https://github.com/googleworkspace/cli
pricing: "开源免费（Apache-2.0）；非 Google 官方支持产品"
platforms: "命令行（Node.js 18+ 或预编译二进制）；技能供 Claude Code、Gemini CLI 等使用"
trialNote: "`npm install -g @googleworkspace/cli` 然后 `npx skills add https://github.com/googleworkspace/cli`"
products: [gemini, claude]
models: [any-llm]
topics: [agent-skills, office, ai-agent]
excerpt: "gws 是 googleworkspace 组织下的开源命令行工具：一个 CLI 覆盖 Drive、Gmail、日历、表格、文档等 Workspace API，输出结构化 JSON，并附带 100 多个 Agent Skills；README 注明它不是 Google 官方支持的产品。"
checkedOn: 2026-10-11
sources:
  - https://github.com/googleworkspace/cli
  - https://skills.sh/
  - https://github.com/vercel-labs/skills
---

> 本文根据 googleworkspace/cli 仓库 README 与 skills.sh 榜单整理，资料核对于 2026-10-11。项目仍在快速迭代，以仓库 README 为准。

## 是什么

gws 的口号是「一个命令行工具管整个 Google Workspace——为人和 AI 智能体而建」：Drive、Gmail、日历以及每一个 Workspace API，输出结构化 JSON，并附带面向智能体的技能。它和本站介绍过的飞书 CLI 是同一类东西：把办公套件的能力变成智能体可以调用的命令。

它有一个巧妙的设计：**不内置固定的命令清单**。gws 在运行时读取 Google 自己的 Discovery Service，动态生成全部命令，所以 Workspace 新增接口后它会自动支持。

README 顶部有两条重要提示：第一，这**不是 Google 官方支持的产品**（尽管仓库在 googleworkspace 组织下）；第二，项目处于活跃开发中，走向 1.0 的过程里会有破坏性变更。

截至 2026-10-11，GitHub 显示该仓库约 3.1 万 Star、1861 Fork，最近一次推送在 2026-10-06。

## 包含哪些 Skill

README 的说法是仓库附带 100 多个 Agent Skills：每个受支持的 API 一个，加上常见工作流的高层辅助技能，以及 50 个针对 Gmail、Drive、Docs、日历和表格的精选「配方」。skills.sh 当日榜单上能看到 `gws-gmail`、`gws-gmail-send`、`gws-drive`、`gws-calendar`、`gws-sheets`、`gws-docs` 和共享基础技能 `gws-shared`。完整清单见仓库的 `docs/skills.md`。

## 怎么安装

先装命令行工具：

```bash
npm install -g @googleworkspace/cli
```

macOS 也可以用 `brew install googleworkspace-cli`，或从 GitHub Releases 下载预编译的二进制文件。

再装技能——全部安装，或只装某一个产品的：

```bash
npx skills add https://github.com/googleworkspace/cli
npx skills add https://github.com/googleworkspace/cli/tree/main/skills/gws-gmail
```

Gemini CLI 用 `gemini extensions install https://github.com/googleworkspace/cli`。

**认证是门槛**：README 写明需要一个 Google Cloud 项目来提供 OAuth 凭据，并给了几种认证流程（本机交互式、手动配置、浏览器辅助、无界面环境）。

## 怎么用

- 「列出我 Drive 里最近修改的 10 个文件」；
- 「把这份销售数据建成一个新的表格，并共享给团队」；
- 「看看我明天的日程，把冲突的会议列出来」；
- 「起草一封回复这封邮件的信，先别发」。

## 适合谁 / 不适合谁

**适合：** 工作流程在 Google Workspace 里的个人和团队；想给智能体接入邮件、日历、文档能力的开发者。

**不适合：** 无法稳定访问 Google 服务的网络环境；不愿意自己配置 Google Cloud 项目和 OAuth 的普通用户；要求稳定接口的生产系统（项目尚未到 1.0）。

## 注意事项

- **许可证**：Apache-2.0。
- **权限范围要收紧**：OAuth 授权时只勾选必需的范围。给了发邮件和删文件的权限，智能体就真的能发邮件和删文件——发送、删除、对外共享这类操作应要求它先给你确认。
- **提示词注入**：邮件和文档的内容会进入智能体上下文，别人发来的邮件里可能藏着诱导它执行操作的文字。不要让它在无人确认的情况下自动处理收件箱并执行邮件里的「指示」。
- **企业账号**：公司的 Workspace 可能限制第三方 OAuth 应用，使用前确认管理员政策。
- 「非官方支持」意味着出了问题没有 Google 的支持渠道可以求助。
