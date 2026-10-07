---
title: "DeepSeek 是什么、怎么用：官网入口、是否免费与使用教程"
slug: deepseek-ai-chat
name: DeepSeek
url: https://chat.deepseek.com/
pricing: 免费（API 按量付费）
platforms: 网页 / iOS / 安卓 / Windows / macOS / API
trialNote: 官方介绍网页版和 App 可免费体验；API 按 token 计费
products: [ai-tools]
models: [deepseek]
topics: [coding, learning, research-data]
excerpt: "DeepSeek 是杭州深度求索推出的免费 AI 助手，网页和 App 提供快速模式与专家模式，擅长推理、数学和编程；模型开源，另有 Harness 桌面智能体和低价 API。本文讲清官网入口、怎么用和注意事项。"
checkedOn: 2026-10-07
sources:
  - https://www.deepseek.com/
  - https://www.deepseek.com/download/
  - https://www.deepseek.com/news/deepseek-v4-1-flash/
  - https://api-docs.deepseek.com/zh-cn/updates
  - https://www.deepseek.com/harness/
  - https://apps.apple.com/cn/app/deepseek-ai-%E6%99%BA%E8%83%BD%E5%8A%A9%E6%89%8B/id6737597349
---

> 本文根据 DeepSeek 官网、官方动态、API 文档更新日志和 App Store 页面整理，资料核对于 2026-10-07。功能和价格变化快，以官网为准。

## 是什么

DeepSeek（中文名「深度求索」）是杭州深度求索人工智能基础技术研究有限公司的大模型品牌。它的 AI 助手可以在网页 chat.deepseek.com 和官方 App 里免费使用，App 于 2025 年 1 月上架。DeepSeek 以开源模型著称，官网研究页列出了 V3、R1、V3.1、V3.2 等历代模型；2026-04-24 发布 V4 预览版并开源，支持百万 token 上下文；2026-08 V4-Pro 正式版在 App、网页和 API 同步上线；2026-09-10 又发布了具备原生视觉理解能力的 V4.1 Flash。

网页和 App 里一般分「快速模式」和「专家模式」两档，前者回答快，后者思考更深。每个模式背后具体是哪个模型，以界面说明为准。

## 能做什么

- **深度思考**：遇到数学、逻辑、编程、方案比较类问题，开启思考后它会先推理再回答，适合解题和分析。
- **智能搜索**：联网检索最新信息并给出参考来源。
- **读文件、看图**：上传文档或截图，让它总结、提取要点、解释报错信息。
- **写代码、改代码**：生成脚本、网页、SQL，解释代码含义，DeepSeek 一向在编程类评测中表现突出。
- **DeepSeek Harness 桌面端**（预览版）：开源的智能体应用，能在后台读写本地文件、整理文档、分析表格、改代码仓库、跑测试，支持插件和定时任务；提供 macOS（Apple 芯片）和 Windows 64 位版本。
- **API 开放平台**：兼容 OpenAI 和 Anthropic 接口格式，可接入 Claude Code、Codex、OpenCode 等编程工具；采用峰谷定价，闲时价格是高峰时段的一半。

## 怎么上手

1. 打开 chat.deepseek.com，或在应用商店搜索开发者为「Hangzhou DeepSeek Artificial Intelligence」的 DeepSeek App。
2. 按页面提示注册登录（可选的登录方式以登录页为准）。
3. 简单问题用快速模式；复杂问题切到专家模式，并打开「深度思考」。需要最新资讯时同时打开「智能搜索」。
4. 想让它处理电脑上的文件，可从官网下载 DeepSeek Harness 桌面端，在工作区里给它布置任务。
5. 开发者在 DeepSeek API 开放平台申请 API Key，按官方文档配置 base_url 即可调用。

可以这样开始：「这道题我算出来是 12，但答案是 18，请一步步检查我的解法错在哪里：（附题目和步骤）」

## 免费与付费

- **网页版和 App**：官方介绍为免费体验，目前没有面向个人的付费会员。
- **API**：按输入、输出 token 计费，缓存命中更便宜，并区分高峰和闲时价格；V4.1 Flash 上线时官方同步下调了价格。具体单价以官网「API 价格」页为准。
- **开源权重**：V4 系列模型在 Hugging Face 公开，有算力的企业可以自己部署。

## 适合谁 / 不适合谁

**适合：**
- 学生和备考人群：数理化推导、编程作业讲解，免费且推理能力强。
- 开发者：API 便宜、兼容主流格式，也能接进现有编程工具。
- 想要一个不用付费、国内直接能用的通用助手的人。

**不适合：**
- 需要 AI 生图、生视频的用户：官方介绍里没有这类功能。
- 对服务稳定性要求很高的场景：遇到异常可先看官网的服务状态页。
- 需要深度连接办公软件、邮箱日历的用户，生态集成较少。

## 注意事项

- **认准官方**：官方网页版地址是 chat.deepseek.com，App 开发者为杭州深度求索（Hangzhou DeepSeek Artificial Intelligence），名字相近的网站和 App 注意甄别。
- **隐私**：使用前阅读官方隐私政策，不要在对话里输入身份证号、密码、合同原件等敏感信息。
- **核对输出**：推理过程看起来严谨不代表结论一定正确，关键数据和代码要自己验证。
