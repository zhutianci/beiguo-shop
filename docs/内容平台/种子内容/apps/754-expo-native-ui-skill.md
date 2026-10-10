---
title: "expo-native-ui skill 是什么、怎么安装使用：让智能体写出有原生质感的 Expo 界面"
slug: expo-native-ui-skill
name: expo-native-ui（expo/skills）
url: https://github.com/expo/skills/tree/main/plugins/expo/skills/expo-native-ui
pricing: "开源免费（MIT）；部分技能对应付费的 EAS 云服务"
platforms: "Claude Code / Codex（插件）；Cursor / OpenCode / Copilot / Gemini 等用 skills CLI"
trialNote: "claude plugin install expo@claude-plugins-official"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding, product-design]
excerpt: "expo-native-ui 是 Expo 官方技能：指导智能体按苹果人机界面规范做 Expo 界面，涵盖语义化颜色、原生控件、SF Symbols 图标、媒体、视觉效果、渐变、存储和响应式布局，并规定优先用哪些库、先在 Expo Go 里跑。"
checkedOn: 2026-10-11
sources:
  - https://github.com/expo/skills/tree/main/plugins/expo/skills/expo-native-ui
  - https://github.com/expo/skills
  - https://skills.sh/
---

> 本文根据 expo/skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。所在仓库 expo/skills 在 GitHub 约 2686 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

让大模型写 React Native 界面，常见结果是「能跑，但一看就不是原生应用」：自己画的开关、网页味的阴影、已经被移除的旧组件。expo-native-ui 用一组明确的取舍来纠正。`description`：构建美观、有原生感的 Expo 界面；涵盖苹果人机界面规范风格、语义化颜色、原生控件、SF Symbols、媒体、视觉效果、渐变、存储和响应式布局；路由与导航用 `expo-router` 技能，动效用 `expo-animation` 技能。

几块主要内容：

- **先查 `expo-ui`**：选任何界面组件前，先看 `@expo/ui` 有没有对应的原生组件（底部弹层、按钮、选择器、滑块、菜单、开关、分段控件等），它们在 iOS 上是真正的 SwiftUI、在安卓上是 Jetpack Compose。
- **运行方式**：始终先试 Expo Go（`npx expo start` 扫码），确实需要时才做自定义构建，并列出了哪些情况必须自定义构建、哪些情况 Expo Go 就够。
- **库的取舍**：不用已从 React Native 移除的模块（如旧的 Picker、WebView、SafeAreaView、AsyncStorage）；音视频用 `expo-audio`、`expo-video`，不用 `expo-av`；iOS 图标用 `expo-symbols`；图片用 `expo-image`；安全区域用 `react-native-safe-area-context`；颜色用路由库导出的语义化颜色，自动适配深浅色。
- **样式规则**：通用样式、颜色、文字、阴影各有一节，另有响应式和交互行为的要求。

目录里有七份参考：控件、渐变、图标、媒体、存储、视觉效果，以及 WebGPU 与 Three.js。

## 怎么安装

`expo-native-ui` 随 Expo 官方插件安装。README 的建议是 Claude Code 和 Codex 用插件，这样能跟着插件市场自动更新：

```bash
claude plugin install expo@claude-plugins-official
```

Codex 用 `codex plugin add expo@openai-curated`。Cursor、OpenCode、Copilot 等用 skills CLI：`npx skills@latest add expo/skills --skill '*'` 是全部安装，把 `'*'` 换成 `expo-native-ui` 就只装这一个。

仓库整体介绍和其他安装方式，详见本站《expo/skills 是什么、怎么安装：Expo 官方 Agent Skills（React Native 应用开发、EAS 构建与发布）》。

## 怎么用

- 「做一个设置页，分组列表加开关和选择器，要像系统设置那样」。
- 「把这个页面里手写的底部弹窗换成原生的」。
- 「检查这个项目用了哪些已经不推荐的库，给出替换方案」。

## 适合谁 / 局限

适合用 Expo 做 iOS 和安卓应用、希望界面贴近系统风格的开发者。局限：规范以苹果的设计语言为主，SKILL.md 自己也说明 SF Symbols 只在苹果平台可用，安卓上要另行处理图标；部分建议依赖较新的 Expo SDK 版本，老项目要先升级；做强品牌化、非系统风格的界面时，这些约束未必合适。

## 注意事项

- **许可**：MIT（frontmatter 标注）。
- **不带脚本**：说明文字加参考文件；它会建议安装若干 Expo 官方库，按项目的 SDK 版本确认兼容性。
- 技能版本随 Expo SDK 更新较快，以仓库为准。
