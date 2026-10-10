---
title: "Qoder 是哪个公司的、怎么用：阿里智能体编程平台官网与价格"
slug: qoder-agentic-coding-ide
name: Qoder
url: https://qoder.com/
pricing: 免费+付费（Pro 起）
platforms: Windows / macOS / JetBrains 插件 / 命令行 / 网页 / 移动端
trialNote: 免费版含 2 周 Pro 试用（300 Credits），之后可用基础模型和有限次数补全，支持自带 API Key
products: [ai-tools]
models: []
topics: [coding]
excerpt: "Qoder 是阿里巴巴 2025 年 8 月推出的智能体编程平台（国际版），有桌面 IDE、JetBrains 插件、CLI 和云端智能体，主打 Quest 模式和 Repo Wiki。"
checkedOn: 2026-10-07
sources:
  - https://qoder.com/
  - https://docs.qoder.com/
  - https://docs.qoder.com/account/pricing
  - https://docs.qoder.com/events/pricing-adjustment-notice
---

> 本文根据 Qoder 官网、官方文档（产品介绍、定价、价格调整公告）整理，资料核对于 2026-10-07。功能和价格变化快，以官网为准。

## 是什么

Qoder 是 **阿里巴巴** 推出的智能体编程平台，2025 年 8 月 21 日对外发布，主打「上下文工程」：先深度理解整个代码库，再让 AI 智能体完成真实的开发任务。qoder.com 是面向全球的**国际版**，以美元计费；阿里另有面向国内的 **Qoder CN**（qoder.cn，由原通义灵码更名而来），两者账号和计费分开。

官方文档里 Qoder 已经是一个产品家族：

- **Qoder IDE**：桌面开发环境，主产品；
- **JetBrains 插件**：在 IntelliJ 系 IDE 里使用；
- **Qoder CLI**：终端智能体；
- **Cloud Agents**：通过 API 管理的云端智能体；
- **QoderWork / QoderWake**：分别面向文档、表格、调研等办公任务和长期运行的「数字员工」；
- **手机端与网页端**：远程查看智能体进度、审批操作。

## 能做什么

- **Quest 模式**：把较大的需求交给 AI 自主完成——先生成规格和执行计划，再写代码、测试，交付可验证的结果。
- **Agent 模式**：边聊边改，适合中小任务，关键步骤由你确认。
- **Repo Wiki**：自动为代码库生成结构化文档，帮你和 AI 都快速理解项目架构。
- **Knowledge Card 与记忆**：沉淀项目知识，让后续会话少走弯路。
- **智能补全（NES）**：基于自研的下一步编辑预测，给出多行修改建议。
- **自带 Key（BYOK）**：免费版也能接入自己的模型 API Key。

## 怎么上手

1. 打开 qoder.com 下载 Qoder IDE；JetBrains 用户可在插件市场安装 Qoder 插件。国内用户如果想用人民币付费，可去 qoder.cn 下载 Qoder CN。
2. 按提示注册登录，新用户会自动获得 2 周 Pro 试用。
3. 打开项目后先生成 Repo Wiki，让它把项目结构梳理一遍。
4. 小任务用 Agent 模式对话完成；明确的大功能切到 Quest 模式，审阅它给出的规格和计划后再执行。
5. 习惯后可再装 Qoder CLI，在终端里跑同样的智能体。

可以这样开始（Quest 模式）：「为这个 Django 项目增加基于角色的权限控制：管理员、编辑、访客三种角色，接口层和后台页面都要生效，附带测试。」

## 免费与付费

官方定价文档列出的个人方案（官网定价页，2026-10 查询）：

| 方案 | 价格 | 每月 Credits |
|---|---|---|
| Free | 免费 | 2 周 Pro 试用（含 300 Credits），之后为基础模型和有限补全 |
| Pro | 20 美元/月 | 2,000 |
| Pro+ | 60 美元/月 | 6,000 |
| Ultra | 200 美元/月 | 20,000 |

付费方案含更多补全、Quest、Repo Wiki、Knowledge Card 等功能；Credits 用完后会自动切回基础模型（有每日限制），也可加购额度包（有效期 1 个月）。团队方案按席位收费。官方公告显示，2026 年 4 月 30 日起早期的五折优惠结束，价格恢复为上述标准价，已订阅用户在续费时生效。

## 适合谁 / 不适合谁

适合：
- 接手陌生大项目、需要先快速读懂代码库的开发者，Repo Wiki 很对口。
- 想把整块需求交给 AI 自主完成、自己负责验收的人。
- 习惯 JetBrains IDE 又想用智能体的后端开发者。

不适合：
- 希望人民币付款、使用国产模型的国内用户，Qoder CN 更合适。
- 只要基础补全的轻度用户，免费版试用结束后功能有限。

## 注意事项

- **国际版和国内版别混淆**：qoder.com 与 qoder.cn 是两套独立的账号和计费体系，订阅前确认入口。
- **Credits 消耗**：Quest 等长任务消耗较多，额度包过期作废且不退款。
- **代码与权限**：智能体会读写文件、执行命令，重要项目在 Git 分支上操作，并保留人工确认。
- **核对结果**：AI 声称「测试通过」后也要自己跑一遍测试、审阅关键改动。
