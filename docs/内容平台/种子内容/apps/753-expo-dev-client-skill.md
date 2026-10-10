---
title: "expo-dev-client skill 是什么、怎么安装使用：让智能体帮你构建和分发 Expo 开发版客户端"
slug: expo-dev-client-skill
name: expo-dev-client（expo/skills）
url: https://github.com/expo/skills/tree/main/plugins/expo/skills/expo-dev-client
pricing: "开源免费（MIT）；部分技能对应付费的 EAS 云服务"
platforms: "Claude Code / Codex（插件）；Cursor / OpenCode / Copilot / Gemini 等用 skills CLI"
trialNote: "claude plugin install expo@claude-plugins-official"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding]
excerpt: "expo-dev-client 是 Expo 官方技能：说明什么时候需要开发版客户端、怎么配置 eas.json，以及如何在本地或通过 EAS Build 与 TestFlight 构建分发；本地构建免费，云端构建占用 EAS 套餐的构建时长。"
checkedOn: 2026-10-11
sources:
  - https://github.com/expo/skills/tree/main/plugins/expo/skills/expo-dev-client
  - https://github.com/expo/skills
  - https://skills.sh/
---

> 本文根据 expo/skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 6.6 万次；所在仓库 expo/skills 在 GitHub 约 2686 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

用 Expo 开发应用，起步时在手机上装官方的 Expo Go 扫码就能跑；一旦项目里有了 Expo Go 没内置的原生代码，就得自己构建一个「开发版客户端」。这个技能教智能体处理这一步。`description`：在本地或通过 TestFlight 构建并分发 Expo 开发版客户端，用于内部测试；正式的 TestFlight 发布和商店提交请用 `eas-app-stores` 技能。

SKILL.md 一开头就把费用说清楚：`expo-dev-client` 本身开源，本地构建免费；通过 EAS Build 或 TestFlight 构建分发会消耗 EAS 套餐里的构建时长，往真机和 TestFlight 分发还需要付费的苹果开发者账号。

内容按顺序是：

- **什么时候需要**：技能认为任何正式的应用都应该用开发版客户端，Expo Go 只是学习和快速试验的场地。具体来说，用到本地 Expo 模块（自定义原生代码）、苹果的小组件与应用扩展、Expo Go 没带的第三方原生模块、配置插件，或者要测试远程推送和通用链接时，才必须构建。
- **EAS 配置**：`eas.json` 里要有一个开发用的构建配置，开启 `developmentClient`。
- **为 TestFlight 构建**、**本地构建**、**安装本地构建产物**、**只构建某个平台**、**查看构建状态**。
- **使用开发版客户端**：装好后如何连接本机的开发服务器。
- **常见问题排查**。

## 怎么安装

`expo-dev-client` 随 Expo 官方插件安装。README 的建议是 Claude Code 和 Codex 用插件，这样能跟着插件市场自动更新：

```bash
claude plugin install expo@claude-plugins-official
```

Codex 用 `codex plugin add expo@openai-curated`。Cursor、OpenCode、Copilot 等用 skills CLI：`npx skills@latest add expo/skills --skill '*'` 是全部安装，把 `'*'` 换成 `expo-dev-client` 就只装这一个。

仓库整体介绍和其他安装方式，详见本站《expo/skills 是什么、怎么安装：Expo 官方 Agent Skills（React Native 应用开发、EAS 构建与发布）》。

## 怎么用

在 Expo 项目里：

- 「我加了一个原生模块，Expo Go 跑不起来了，帮我配好开发版客户端并在本地构建 iOS 版」。
- 「给测试同事发一个可以装在真机上的开发版，走 TestFlight」。
- 「检查一下 `eas.json` 的开发配置有没有问题」。

## 适合谁 / 局限

适合从 Expo Go 过渡到自定义原生代码的 React Native 开发者。局限：iOS 本地构建需要 macOS 和 Xcode，没有 Mac 只能用云端构建；证书、描述文件这些苹果侧的问题常常需要你本人在开发者后台操作；它只管开发版，上架流程在别的技能里。

## 注意事项

- **许可**：MIT（frontmatter 标注）。
- **云端构建会消耗 EAS 额度**，费用以 expo.dev 的定价页为准；智能体执行 `eas build` 前确认一下目标平台和配置，避免重复构建。
- **会用到你的 Expo 账号和苹果开发者凭据**，登录操作自己完成，不要把密码交给智能体。
