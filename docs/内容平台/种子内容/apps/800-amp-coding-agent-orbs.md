---
title: "Amp（ampcode）是什么、怎么用：能在云端「orb」里持续干活的编程智能体"
slug: amp-coding-agent-orbs
name: Amp
url: https://ampcode.com/
pricing: 免费+付费
platforms: 网页 / macOS / iOS / iPadOS / 命令行
trialNote: Hobby 档免费，可自带订阅或 API Key
products: [ai-tools]
models: []
topics: [coding, ai-agent]
excerpt: "Amp 是一款编程智能体兼开发环境：每个对话线程可以分到一台云端机器（orb），发出指令后合上电脑它仍会继续工作，也能用命令行在自己机器上运行。"
checkedOn: 2026-10-11
sources:
  - https://ampcode.com/
  - https://ampcode.com/docs
  - https://ampcode.com/pricing
  - https://ampcode.com/about
verify:
  - "定价页个人档显示「$20/mo」并有 Megawatt / Gigawatt 两个切换项，Gigawatt 的价格未能读到"
  - "Amp 早期由 Sourcegraph 推出，现官网「About」自称独立的 agent research lab；页面未写与 Sourcegraph 的关系，正文未展开"
---

> 本文根据 Amp 官网、官方文档首页与定价页整理，资料核对于 2026-10-11。Amp 更新很快，且官方明确表示「不保留向后兼容」，以官网当前页面为准。

## 是什么

Amp 是一款编程智能体（coding agent）兼开发环境，官网的说法是「为前沿而建」。很多人是通过「Sourcegraph Amp」这个叫法知道它的；现在官网的「关于」页把团队描述为一家独立的智能体研究实验室，产品域名是 ampcode.com。

和只在本地编辑器里补全代码的工具不同，Amp 的重点是让智能体**长时间、无人值守**地干活。

## 能做什么

官方文档首页列出的几个核心概念：

- **Orbs**：Amp 为每个对话线程创建的一台云端机器，里面已经准备好你的代码、工具和插件。发出指令后可以合上电脑，智能体会继续运行。
- **多模型**：文档称 Amp 会同时使用多家的前沿模型和快速模型，各取所长，不需要用户逐个挑选。
- **多端同步**：同一个线程可以在 iPhone 上发起、在 Mac 上查看、在终端里继续；App 会在线程等待你回复时发通知。
- **Threads**：对话线程可以保存并分享给队友。
- **Puck**：文档中介绍的一个角色，用来替你发起并协调多个智能体。
- 文档目录里还有 Portals、Automations、Skills、MCP、AGENTS.md、SDK 等章节，具体用法以文档为准。

## 怎么上手

文档给出的快速开始流程：

1. 在 ampcode.com 注册并登录。
2. （可选）用 ChatGPT 账号登录，把已有的 ChatGPT 订阅用于 Amp 里的 OpenAI 模型。
3. 从 Git 仓库创建项目，也可以不关联仓库直接开始。
4. 在一个新的 orb 里给 Amp 布置任务。
5. 按需安装 macOS / iOS 应用，或安装命令行工具在本机终端使用（安装命令见官方文档的 CLI 章节）。

## 免费与付费

定价页（美元，2026-10 查询）：

- **Hobby**：免费。orb 按量付费，也可以用自己的机器当 runner（免费）；可以使用自己的 ChatGPT、Claude 等订阅或自带 API Key（BYOK），官方称不额外收取 Amp 的 token 费用。
- **个人付费档**：页面显示 20 美元/月起（Megawatt），含 45,000 分钟 orb 运行时长；更高一档 Gigawatt 的价格以官网为准。
- **Teams**：创建团队工作区不另收费，成员可以各自处于不同档位，支持共享账单与额度池、SSO。
- **Enterprise**：定制报价。

## 适合谁 / 不适合谁

**适合：** 习惯把任务整块交给智能体、希望它在云端跑完再回来验收的开发者；需要在手机上盯进度的人；已有 ChatGPT / Claude 订阅或 API Key、想复用的用户。

**不适合：** 只想要编辑器内联补全的人；要求工具长期稳定不变的团队（官方直言会砍掉自己不爱用的功能）；代码不能上传到第三方云环境的项目（可考虑只用本机 runner，并先读官方的数据保留说明）。

## 注意事项

- orb 是云端机器，授予它生产环境或密钥的访问权限前要想清楚，文档有专门的「Handling Secrets」章节。
- 老教程里的 Amp 用法（例如早期的编辑器插件形态）可能已不适用，以当前文档为准。
- 智能体改出的代码仍需要人工评审和测试。
