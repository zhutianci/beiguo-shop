---
title: "Android Studio 里的 Gemini 是什么、怎么用、免费吗：安卓开发的 AI 智能体与 Agent Mode"
slug: gemini-android-studio-ai-agent
name: Gemini in Android Studio
url: https://developer.android.com/gemini-in-android
pricing: 免费+付费
platforms: Android Studio（Windows / macOS / Linux / ChromeOS，以官方系统要求为准）
trialNote: 个人可免费使用，额度和 token 有限
products: [gemini, ai-tools]
models: [gemini-llm]
topics: [coding, ai-agent]
excerpt: "Gemini in Android Studio 是内置在 Android Studio 里的 AI 开发助手：Agent Mode 可跨代码库规划多步任务并在模拟器里验证，另有 Next Edit Prediction、Compose 界面生成、Journeys 测试和崩溃分析。"
checkedOn: 2026-10-11
sources:
  - https://developer.android.com/gemini-in-android
---

> 本文根据 Android 开发者官网的 Gemini in Android Studio 页面整理，资料核对于 2026-10-11。功能与额度以官方页面为准。

## 是什么

Gemini in Android Studio 是谷歌内置在 Android Studio 里的 AI 能力，官网称它是「你的安卓开发 AI 伙伴」，也直接把它叫作「Android Studio 的 AI 智能体」，用来更快地构建、调试和扩展安卓应用。它不需要另装编辑器或插件，登录后在 Android Studio 里即可使用 Gemini 模型。

## 能做什么

官网列出的功能：

- **Agent Mode**：针对多步骤任务先做规划，跨整个代码库提出修改，反复迭代修复问题，并在 Android 模拟器里验证改动。另有 Planning Mode。
- **Next Edit Prediction**：输入时在文件的任意位置给出代码补全建议。
- **Android skills**：给智能体增加专门能力，官网举例有 Perfetto 性能分析、把 XML 布局迁移到 Compose、自适应布局。
- **Compose UI 工具**：用自然语言描述界面修改、生成 Compose 预览、对照设计稿还原界面。
- **Journeys**：AI 辅助编写界面测试。
- **App Quality Insights**：分析崩溃报告并给出修复建议。
- **LeakCanary**：自动检测内存泄漏。
- 其他：用 AI 创建新项目、MCP 支持（含一键安装的市场）、权限管理。

官网还提到可以使用本地模型（Gemma、Ollama、LM Studio），在完全离线的情况下运行。

## 怎么上手

1. 从官网下载当前版本的 Android Studio 并接受 SDK 许可。
2. 登录谷歌账号，Gemini 模型即可使用。
3. 先从小任务开始：让它解释一段代码、修一个编译错误。
4. 熟悉后再用 Agent Mode 处理跨文件的改动，逐条审查它提出的修改后再接受。

## 免费与付费

官网列出的档位：

- **免费（个人）**：可使用 Gemini 和 Gemma 模型，额度和 token 有限。
- **Google AI Pro**：更高的访问权限和更宽松的速率限制。
- **Google AI Ultra**：更高一级的访问权限。
- **Gemini Enterprise**：面向 Google Cloud 客户，按 API 用量计费；部分客户的 Gemini Enterprise 订阅已包含。
- **自带 API Key**：可接入 Anthropic、OpenAI、Google AI Studio 或其他服务商。

各订阅的价格不在这一页，以谷歌官网为准。

## 适合谁 / 不适合谁

**适合：** 原生安卓开发者，尤其是在用 Kotlin 和 Jetpack Compose 的团队；需要处理崩溃、性能和测试的工程师；想用免费额度体验智能体编程的学生。

**不适合：** 不使用 Android Studio 的跨平台开发者；代码不能发送到云端的项目（可考虑本地模型或企业方案）。

## 注意事项

- 官网说明：使用企业级 Google Cloud 凭据登录时，专有源代码和提示词不会用于训练模型；个人档位的隐私条款该页面没有写明，使用前查看对应条款。
- 智能体可以运行命令和修改文件，留意权限管理设置。
- 生成的代码仍需要代码评审和真机测试。
