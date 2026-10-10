---
title: "expo/skills 是什么、怎么安装：Expo 官方 Agent Skills（React Native 应用开发、EAS 构建与发布）"
slug: expo-skills-react-native-eas
name: expo/skills（Expo 官方技能）
url: https://github.com/expo/skills
pricing: "开源免费（MIT）；部分技能对应付费的 EAS 云服务"
platforms: "Claude Code / Codex（插件）；Cursor / OpenCode / Copilot / Windsurf / Gemini 等用 skills CLI"
trialNote: "claude plugin install expo@claude-plugins-official"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding]
excerpt: "expo/skills 是 Expo 团队官方的 Agent Skills：一组教智能体构建、部署、升级和调试 Expo 应用的技能，分为开源框架类与付费 EAS 服务类，Claude Code、Codex 装插件，其他智能体用 npx skills。"
checkedOn: 2026-10-11
sources:
  - https://github.com/expo/skills
  - https://skills.sh/
  - https://github.com/vercel-labs/skills
  - https://code.claude.com/docs/en/discover-plugins
---

> 本文根据 expo/skills 仓库 README 与 skills.sh 榜单整理，资料核对于 2026-10-11。技能清单更新较快，以仓库 README 为准。

## 是什么

Expo 是做 React Native 应用最主流的框架和工具链。expo/skills 是 Expo 团队自己维护的技能库，用来给编程智能体补上 Expo 的专门知识：什么时候该用哪个 Expo API、常见工作流怎么组织、Expo、EAS、React Native 以及 iOS、Android 各有哪些约束。README 同时强调，Expo 文档、Expo CLI 和 EAS CLI 仍然是事实来源，技能的作用是帮智能体把它们用对。

一个值得称道的做法是把**免费与付费的边界标清楚**：技能分成两组，每个技能的描述里带同样的标签，凡是涉及付费服务的技能，开头都有一段费用与套餐限制的提示。

截至 2026-10-11，GitHub 显示该仓库约 2686 Star、160 Fork，最近一次推送在 2026-10-07。

## 包含哪些 Skill

- **入口**：`expo-overview`，请求含糊或没点名具体工具时先加载它，再分流到下面的技能。
- **框架类（开源免费）**：`expo-project-structure`（目录结构）、`expo-router`（文件路由、原生栈、模态、标签页）、`expo-animation`（Reanimated 与手势）、`expo-native-ui`（原生观感的界面）、`expo-design-system`（设计令牌与组件约定）、`expo-ui`（`@expo/ui` 原生组件）、`expo-data-fetching`（请求、缓存、离线）、`expo-dom`（在原生应用里逐步复用网页代码）、`expo-web-to-native`（把 Next.js / Vite 等网页应用迁到原生）、`expo-module`（原生模块）等。
- **服务与付费分发类（EAS）**：`eas-app-stores`（构建并提交到应用商店、TestFlight）、`eas-hosting`、`eas-workflows`（CI/CD）、`eas-observe`、`eas-update`（OTA 热更新）、`eas-update-insights`、`eas-simulator`（在云端模拟器上运行应用）。
- **实验类**：针对尚未定稿的 Expo API，放在单独的 `expo-experiments` 插件里。

## 怎么安装

README 的建议是 Claude Code 和 Codex 装插件（由官方插件市场负责更新），其他智能体用 skills CLI。

**Claude Code**：

```text
claude plugin install expo@claude-plugins-official
```

或在会话里输入 `/plugin install expo@claude-plugins-official`。

**Codex**：

```text
codex plugin add expo@openai-curated
```

**Cursor、OpenCode、GitHub Copilot、Windsurf、Gemini、Cline 等**，在项目根目录运行：

```text
npx skills@latest add expo/skills --skill '*'
```

这条命令选中全部 Expo 技能，仍会询问装给哪个智能体。更新用 `npx skills@latest update`，只更新某一个则在后面加技能名。

## 怎么用

README 给的示例提问：

- 「用 Expo Router 做一个有原生观感的页面，带标签页、模态和动画」；
- 「创建一个 EAS 工作流，在每个 PR 上构建预览版」；
- 「帮我把这个应用升级到最新的 Expo SDK」。

## 适合谁 / 不适合谁

**适合：**
- 用 Expo 做 iOS / Android 应用的开发者，尤其是从网页端转过来、对原生约束不熟的人；
- 想让智能体代劳构建、提交商店、热更新这类流程的团队。

**不适合：**
- 不用 Expo 的纯原生或 Flutter 项目；
- 不打算使用 EAS 的人可以只装框架类技能。

## 注意事项

- **许可证**：MIT（README 写明）。
- **费用**：EAS 的构建、托管、更新等是 Expo 的付费云服务（有免费额度，具体以 Expo 官网为准）；让智能体执行这类操作前看清它要用的套餐资源。
- **遥测**：README 说明自动使用遥测**默认关闭**；开启后（仅 Claude Code）只发送匿名事件——技能名、平台和一个随机安装标识的哈希，不含代码、提示词、文件路径或个人数据；可用 `EXPO_SKILLS_TELEMETRY=0` 或 `DO_NOT_TRACK=1` 关闭。另外每个技能都带有引导你提交反馈的说明，那是独立于遥测的主动行为。
- **凭据**：提交商店、发布更新需要你的 Expo 账号和应用商店凭据，按官方 CLI 的方式登录，不要把密钥贴进对话。
- README 还提到官方的 Expo MCP Server，可与技能配合使用。
