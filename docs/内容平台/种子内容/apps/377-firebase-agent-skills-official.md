---
title: "Firebase Agent Skills 是什么、怎么安装：Firebase 官方技能库（Auth、Firestore、Hosting、安全规则审计）"
slug: firebase-agent-skills-official
name: firebase/agent-skills（Firebase 官方技能）
url: https://github.com/firebase/agent-skills
pricing: "开源免费（Apache-2.0）；Firebase 服务按其套餐计费"
platforms: "Claude Code / Codex / Gemini CLI / Kimi Code（插件）；其他智能体用 npx skills"
trialNote: "npx skills add firebase/skills"
products: [gemini, claude]
models: [any-llm]
topics: [agent-skills, coding]
excerpt: "firebase/agent-skills 是 Firebase 官方的 Agent Skills：帮助编程智能体正确使用 Firebase 的认证、Firestore、Hosting、Data Connect、Crashlytics 与 Genkit，并带一个安全规则审计技能。"
checkedOn: 2026-10-11
sources:
  - https://github.com/firebase/agent-skills
  - https://skills.sh/
  - https://github.com/vercel-labs/skills
---

> 本文根据 firebase/agent-skills 仓库 README 与 skills.sh 榜单整理，资料核对于 2026-10-11。README 中的安装命令使用 firebase/skills 这一仓库名。

## 是什么

firebase/agent-skills 是 Firebase 团队维护的技能库，README 的说明很简短：一组给 AI 编程智能体用的技能，帮助它们更好地理解和使用 Firebase；技能是打包好的说明和脚本，遵循 Agent Skills 格式。

Firebase 的产品线较杂（认证、数据库、托管、崩溃分析、远程配置、AI 相关功能），各自有 SDK 版本和控制台配置上的讲究，模型容易写出过时的初始化代码或有漏洞的安全规则，这组技能就是用来纠正这些的。

截至 2026-10-11，GitHub 显示该仓库约 464 Star、102 Fork，最近一次推送在 2026-10-10。Star 数不高，但它在 skills.sh 当日榜单上有十多个技能，安装量多在十几万次。需要注意：GitHub 上的仓库名是 `firebase/agent-skills`，而 README 里的安装命令写的都是 `firebase/skills`，两者指向同一个项目。

## 包含哪些 Skill

README 没有列清单，以下名称来自 skills.sh 当日榜单：

- `firebase-basics`：基础与项目设置；
- `firebase-auth-basics`：认证；
- `firebase-firestore`：Firestore 数据库；
- `firebase-hosting-basics`、`firebase-app-hosting-basics`：静态托管与应用托管；
- `firebase-data-connect`：Data Connect；
- `firebase-security-rules-auditor`：安全规则审计；
- `firebase-ai-logic-basics`：AI Logic；
- `firebase-crashlytics`、`firebase-remote-config-basics`；
- `developing-genkit-js`、`developing-genkit-dart`：用 Genkit 开发 AI 功能；
- `xcode-project-setup`：iOS 工程配置。

## 怎么安装

README 给了八种方式，常用的几种：

```bash
npx skills add firebase/skills
```

**Claude Code**：`claude plugin marketplace add firebase/skills`，再 `claude plugin install firebase@firebase`。**Codex**：`codex plugin marketplace add firebase/skills`，再 `codex plugin add firebase@firebase`。**Gemini CLI**：`gemini extensions install https://github.com/firebase/skills`。**Kimi Code**：`/plugins install https://github.com/firebase/skills`。

README 提醒：用 `npx skills add` 或手动复制的方式需要自己手动更新，插件方式则由各工具负责更新。

## 怎么用

- 「给这个 React 应用加上邮箱和 Google 登录，用 Firebase Auth」；
- 「审计一下我的 Firestore 安全规则，有没有任何人都能读写的集合」；
- 「把这个 Next.js 项目部署到 Firebase App Hosting」。

## 适合谁 / 不适合谁

**适合：** 用 Firebase 做移动端或网页应用后端的开发者，尤其是独立开发者和小团队；用 Genkit 做 AI 功能的人。

**不适合：** 国内网络环境下的项目——Firebase 的多数服务依赖 Google 的基础设施，面向国内用户的应用要先确认可用性；不使用 Firebase 的项目。

## 注意事项

- **许可证**：Apache-2.0（README 写明）。
- **安全规则是重点**：Firebase 数据泄露事故大多源于过于宽松的安全规则，装了技能也要自己确认规则没有对未登录用户开放读写。
- **费用**：技能免费，Firebase 各服务的免费额度与计费以其官网为准。
- **凭据**：部署和管理需要登录 Firebase 命令行工具，按官方方式在终端里登录；服务账号密钥不要提交进仓库。
- **维护状态**：官方维护，最近推送 2026-10-10。
