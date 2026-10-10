---
title: "gws-gmail skill 是什么、怎么安装使用：让 Claude Code、Gemini CLI 用命令行收发和整理 Gmail"
slug: gws-gmail-skill-google-workspace-cli
name: gws-gmail（googleworkspace/cli）
url: https://github.com/googleworkspace/cli/tree/main/skills/gws-gmail
pricing: "开源免费（Apache-2.0）；非 Google 官方支持产品"
platforms: "命令行 gws（Node.js 18+ 或预编译二进制）；技能供 Claude Code、Gemini CLI 等使用"
trialNote: "`npm install -g @googleworkspace/cli` 然后 `npx skills add https://github.com/googleworkspace/cli/tree/main/skills/gws-gmail`"
products: [gemini, claude]
models: [any-llm]
topics: [agent-skills, office, ai-agent]
excerpt: "gws-gmail 是 Google Workspace CLI（gws）配套的 Gmail 技能：教智能体用 gws gmail 命令查看未读摘要、读信、回复、转发、发信和管理标签，调用任何接口前先查参数结构，写操作前先向你确认。"
checkedOn: 2026-10-11
sources:
  - https://github.com/googleworkspace/cli/tree/main/skills/gws-gmail
  - https://github.com/googleworkspace/cli
  - https://skills.sh/
---

> 本文根据 googleworkspace/cli 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 7.9 万次；所在仓库 googleworkspace/cli 在 GitHub 约 3.1 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

gws 是一个把 Google Workspace 各项服务接口包成命令行的工具，它的技能大多很薄：告诉智能体有哪些命令、怎么查参数，具体细节让智能体运行时自己用 `--help` 去查。gws-gmail 就是这样一份 Gmail 的索引。`description` 只有一句：Gmail——发送、阅读和管理邮件。

SKILL.md 分三块：

- **辅助命令**（`+` 开头，是对常见动作的封装，各自还有一个同名的小技能）：`+triage` 显示未读收件箱摘要（发件人、主题、日期）；`+read` 读取一封邮件并提取正文或邮件头；`+send` 发信；`+reply`、`+reply-all` 回复并自动处理会话归属；`+forward` 转发；`+watch` 监听新邮件并以逐行 JSON 的形式流式输出。
- **接口资源**：`users` 下的草稿、历史记录、标签、邮件、设置、会话等，对应 Gmail 接口的原生方法。
- **发现命令**：调用任何接口方法之前，先用 `gws gmail --help` 浏览资源和方法，再用 `gws schema gmail.<资源>.<方法>` 查看必填参数、类型和默认值。

开头的前置要求是先读公共技能 `gws-shared`，那里有认证方式、全局参数和三条安全规则：不直接输出密钥和令牌；执行写入或删除命令前必须向用户确认；破坏性操作优先用 `--dry-run` 先在本地校验。

## 怎么安装

技能只是说明书，真正干活的是命令行工具 `gws`，所以要装两样（命令来自仓库 README）：

```bash
npm install -g @googleworkspace/cli
npx skills add https://github.com/googleworkspace/cli/tree/main/skills/gws-gmail
```

第二条是 README 给出的「只装某一个技能」的写法；SKILL.md 开头要求同时读取 `gws-shared`（认证、全局参数和安全规则），缺了它可以运行 `gws generate-skills` 生成。之后执行 `gws auth setup` 和 `gws auth login` 完成 Google 账号授权。Gemini CLI 用户可以直接 `gemini extensions install https://github.com/googleworkspace/cli`。

仓库整体介绍和其他安装方式，详见本站《gws 是什么、怎么安装使用：Google Workspace 命令行工具与 Agent Skills（让智能体操作 Gmail、Drive、日历、表格）》。

## 怎么用

- 「看一下我的未读邮件，按重要程度排个序」——对应 `+triage`。
- 「读一下张三昨天那封关于报价的邮件，起草一份回复，先别发」。
- 「把带『发票』标签的邮件列出来，整理成表格」。

发信、回复、转发这些动作，建议始终让它先把收件人和正文给你过目。

## 适合谁 / 局限

适合用 Google Workspace 办公、想把邮件处理接进智能体工作流的人。局限：需要自己有一个 Google Cloud 项目来配置 OAuth 凭据，首次设置有门槛；技能本身信息量小，复杂操作依赖智能体现场查参数，偶尔要多试几次；国内网络访问 Google 服务受限。

## 注意事项

- **许可**：Apache-2.0。仓库 README 声明这不是 Google 官方支持的产品。
- **邮件内容会进入模型上下文**：邮箱里的验证码、合同、个人信息都在其中，授权范围越小越好，登录时只勾选需要的权限。
- **邮件正文是不可信输入**：别人发来的邮件里可能夹带诱导智能体执行操作的文字，不要让它在无人确认的情况下自动回复或转发。
- **会以你的身份真实发信**，发出后无法撤回。
