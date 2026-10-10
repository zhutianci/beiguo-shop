---
title: "Replit 是什么：Replit Agent 4 怎么用、免费版与付费档"
slug: replit-agent-app-builder
name: Replit
url: https://replit.com/
pricing: 免费+付费
platforms: 网页 / Windows / macOS / Linux / iOS / 安卓
trialNote: 免费 Starter 版每天有 Agent 积分（有月度上限）、Lite 构建，可发布 1 个应用（30 天后过期）
products: [ai-tools]
models: []
topics: [coding, ai-agent, product-design]
excerpt: "Replit 是云端开发与 AI 应用搭建平台，核心是 Replit Agent（现为 Agent 4）：用自然语言描述需求，它在云端写代码、建数据库、做登录并直接发布网站、手机应用、幻灯片等，自带托管和 100 多种集成。"
checkedOn: 2026-10-07
sources:
  - https://replit.com/pricing
  - https://docs.replit.com/billing/plans
  - https://replit.com/blog/introducing-agent-4-built-for-creativity
  - https://replit.com/blog/replit-introduces-free-mode
  - https://docs.replit.com/features/platforms/desktop-app
  - https://blog.replit.com/mobile-app
---

> 本文根据 Replit 官网、定价页、官方文档和官方博客整理，资料核对于 2026-10-07。功能和价格变化快，以官网为准。

## 是什么

Replit 是 Replit, Inc. 的产品，早年以“浏览器里的在线编程环境”被很多学生和开发者熟知，现在定位为“帮你把想法变成真实成果的 AI 平台”：用自然语言描述需求，就能在一个地方创建、上线并运营应用、网站、工具乃至小生意。

核心是 **Replit Agent**，当前版本是 Agent 4，官方概括为四个方向：自由设计、协作构建、什么都能交付、更快推进。Agent 会先把一句话需求扩展成需求清单再动手；支持并行任务和看板式多人协作；并通过“智能模型路由”为每个任务自动选模型。平台内置认证、数据库、托管和监控，可连接 OpenAI、Stripe、Google Workspace 等 100 多种服务。

**和同类的区别**：Replit 是这一批“AI 应用生成器”里最像完整云端开发环境的一个——每个项目都有真实的工作区、数据库和发布能力，还能做手机应用（借助 Expo 并引导提交 App Store）、幻灯片、数据可视化等多种类型。v0、Bolt.new、Lovable 更聚焦 Web 应用。

## 能做什么

- **一句话生成应用**：网站、Web 应用、手机应用、幻灯片、动画、数据可视化、3D 游戏、文档和表格等，首页可直接选择类型。
- **Design Canvas 设计画布**：无限画布上探索和调整界面，对任意元素“生成变体”，选中后直接应用到应用里（Core 和 Pro 可用）。
- **并行与协作**：Pro 最多 10 个智能体并行；多人通过看板同时提交任务，合并前可完整查看。
- **全栈基础设施**：内置用户认证、数据库（Pro 支持最长 28 天回滚）、托管和监控，零配置上线。
- **集成与 AI 能力**：一键接入 OpenAI、Stripe、Google Workspace 等，付费版可直接用 Replit AI Integrations，不用自己管理 API Key。
- **多端使用**：网页版之外，有 Windows / Mac / Linux 桌面 App，以及 iOS / 安卓手机 App。

## 怎么上手

1. 打开 replit.com，点击 Create account 注册账号（也可以下载桌面或手机 App）。
2. 在首页“What will you build?”输入框描述想法，或选择 Website、Mobile、Slides 等类型；官网写明第一条提示免费、不消耗积分。
3. Agent 会先整理需求和计划，确认后开始构建，过程中可在预览里查看效果。
4. 继续用对话修改；需要调整界面时打开 Design Canvas。
5. 满意后点 Publish 发布（免费版只能发布 1 个应用，30 天后过期）。

可以这样开始：

```text
做一个团队周报收集工具：成员每周五填写本周完成、下周计划和风险，负责人可以按周查看汇总并导出。需要登录，界面简洁。
```

## 免费与付费

官网定价页（2026-10 查询）：

| 档位 | 价格 | 主要内容 |
| --- | --- | --- |
| Starter | 免费 | 每日 Agent 积分（有月度上限），Lite 构建，1 个已发布应用（30 天过期），2GB 存储 |
| Core | 20 美元/月（按年付 18 美元/月） | Free Mode 最多约 30 小时对话，含 20 美元高级模型额度，Plan 模式，不限工作区和发布数量 |
| Pro | 100 美元/月（按年付 90 美元/月） | 10 个并行智能体，更多 Free Mode 用量，含 100 美元高级模型额度，最多 15 名协作者，数据库回滚 28 天，优先支持 |
| Enterprise | 定制 | SSO/SAML、高级隐私控制、单租户环境、固定出站 IP 等 |

2026 年 8 月 18 日推出的 **Free Mode** 让 Core 和 Pro 用户在额度内做日常对话和常规任务时不消耗订阅积分，额度每 5 小时重置；用完可切换到 Power、Max 等更强模式，按积分计费。

## 适合谁 / 不适合谁

**适合：**
- 想用一句话做出可上线应用的创业者、产品经理和运营；
- 需要多人同时协作、并行推进多个任务的小团队；
- 想同时做 Web、手机应用和演示材料的人。

**不适合：**
- 免费用户想长期运营应用——Starter 版发布的应用 30 天后过期，很多功能需升级；
- 预算敏感又需要大量调用高级模型的人，超出额度后按用量计费；
- 坚持在本地环境和自有服务器开发部署的工程团队。

## 注意事项

- **AI 会出错**：Replit 在定价页明确提示，Agent 由大语言模型驱动、行为具有概率性，可能会犯错，重要改动请检查。
- **控制开销**：Free Mode 之外的模式按积分计费，建议在账户设置里设置消费上限，并定期查看用量。
- **数据与隐私**：企业版提供高级隐私控制；个人版的数据使用以官网隐私政策为准，处理敏感数据前先阅读条款。
- **上线责任**：发布到公网的应用如涉及用户数据、支付，需自行做好安全检查并遵守当地法规。
