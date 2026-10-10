---
title: "Google AI Studio 官网入口与使用教程：免费试 Gemini、获取 API Key"
slug: google-ai-studio-gemini-api
name: Google AI Studio
url: https://aistudio.google.com/
pricing: 网页使用免费，API 有免费档+按量付费
platforms: 网页 / iOS / 安卓 / API
trialNote: 官方说明在可用地区使用 AI Studio 网页本身免费；API 免费档可有限调用部分模型
products: [gemini]
models: [gemini-llm]
topics: []
excerpt: "Google AI Studio 是 Google 面向开发者的 Gemini 试验场：调提示词、测模型、拿 API Key，还能用 Build 模式一句话生成并部署应用。"
checkedOn: 2026-10-07
sources:
  - https://ai.google.dev/gemini-api/docs/ai-studio-quickstart
  - https://ai.google.dev/gemini-api/docs/pricing
  - https://ai.google.dev/gemini-api/docs/available-regions
  - https://blog.google/innovation-and-ai/technology/developers-tools/google-ai-studio-io-2026/
  - https://blog.google/innovation-and-ai/technology/developers-tools/google-one-ai-studio/
---

> 本文根据 Google AI for Developers 官方文档（快速入门、定价、可用地区）与 Google 官方博客整理，资料核对于 2026-10-07。功能和价格变化快，以官网为准。

## 是什么

Google AI Studio 是 **Google** 为开发者提供的网页工具，地址是 aistudio.google.com。它有两个核心用途：一是在网页上直接试用最新的 Gemini 模型、调提示词和参数；二是作为 **Gemini API 的入口**，在这里创建 API Key、一键导出调用代码，把试验好的效果搬进自己的程序。

近一年它的变化很大：2026 年 3 月上线全栈「Vibe Coding」体验，Build 模式可以根据一句描述生成完整应用；2026 年 5 月 I/O 大会上又加入原生安卓应用生成、Google Workspace 集成，并推出了 AI Studio 手机 App。它和面向普通用户的 Gemini App 不同：AI Studio 偏开发和调试，能看到更多模型参数和底层设置。

## 能做什么

- **模型试验场**：选择 Gemini 文本、多模态等模型对话，设置系统指令、温度等参数，开启结构化输出、函数调用、联网搜索等工具。
- **获取 API Key 与代码**：一键创建 Gemini API Key；调好的提示词点「Get code」即可得到 Python、JavaScript 等调用代码。
- **Build 模式生成应用**：用自然语言描述想要的网页应用，AI 生成代码和预览；需要数据库或登录时，会在你同意后配置 Firestore 和 Firebase Authentication。
- **生成安卓应用**：在 Build 里选择「Build an Android app」，生成 Kotlin / Jetpack Compose 代码，并在浏览器中的安卓模拟器预览。
- **媒体生成**：在界面里试用图像（如 Nano Banana 系列）、视频、语音等生成模型。
- **部署与导出**：应用可部署到 Google Cloud Run，也可导出到 Google Antigravity 继续本地开发；I/O 2026 宣布新开发者可免费部署前两个应用、无需绑卡。

## 怎么上手

1. 打开 aistudio.google.com，用 Google 账号登录，首次进入按提示同意服务条款。
2. 在聊天界面选择一个模型，先在右侧设置里写一段系统指令，比如「你是一个简洁的技术文档助手」。
3. 输入测试问题，调整参数直到效果满意，点「Get code」复制调用代码。
4. 需要在程序里调用时，点「Get API key」创建密钥，妥善保存，不要提交到公开仓库。
5. 想快速做原型，切到 Build 模式，描述应用需求并迭代修改。

可以这样开始（Build 模式）：「做一个记账小应用，可以按月份查看支出饼图，数据保存在浏览器本地。」

## 免费与付费

- **AI Studio 网页**：官方定价页写明，在所有可用地区使用 Google AI Studio 本身免费。
- **Gemini API 免费档**：可有限使用部分模型，额度和可用模型以官方速率限制页为准。
- **Gemini API 付费档**：按输入输出 token 计费，各模型单价以官方定价页为准。
- **Google AI 订阅**：官方博客介绍，Google AI Pro / Ultra 订阅用户在 AI Studio 中有更高使用额度，免费额度用完后也可用订阅继续试验。

## 适合谁 / 不适合谁

适合：
- 想把 Gemini 接入自己产品、需要 API Key 和示例代码的开发者。
- 产品经理、独立开发者，想用 Build 模式几分钟做出可演示的原型。
- 需要对比不同模型和参数效果的提示词工程师。

不适合：
- 只想日常聊天问答的普通用户，用 Gemini App 更直接。
- 处理敏感数据又只用免费档的场景：见下方隐私说明。

## 注意事项

- **免费档数据会用于改进产品**：官方定价页写明，免费档的内容会被用于改进 Google 产品，付费档不会。涉及隐私或公司机密的内容不要用免费档处理。
- **地区限制**：官方「可用地区」页面列出的国家和地区中不包括中国大陆、香港和澳门。
- **年龄与账号**：需要 Google 账号，并遵守 Google 的服务条款和生成式 AI 使用政策。
- **核对输出**：生成的代码、应用和文本都需要自己测试和审阅，部署到公网前检查权限与密钥配置。
