---
title: "Activepieces 是什么、怎么用：可自部署的开源自动化平台（Zapier 替代），AI 智能体与 MCP"
slug: activepieces-open-source-automation
name: Activepieces
url: https://www.activepieces.com/
pricing: 社区版开源免费（MIT）/ 云端与企业版以官网为准
platforms: 网页 / Docker 自部署
products: [ai-tools]
models: []
topics: [ai-agent, office, coding]
excerpt: "Activepieces 是开源的 AI 自动化平台，定位为 Zapier 的开源替代：可视化搭建工作流和 AI 智能体，集成（称为 pieces）用 TypeScript 编写，其中 280 多个可作为 MCP 服务器使用，社区版以 MIT 许可发布。"
checkedOn: 2026-10-11
sources:
  - https://github.com/activepieces/activepieces
  - https://www.activepieces.com/
---

> 本文根据 Activepieces 官方 GitHub 仓库 README 与官网整理，资料核对于 2026-10-11。开源项目变化快，以官方仓库为准。

## 是什么

Activepieces 是一个开源的自动化平台，仓库 activepieces/activepieces 约有 2.5 万星标，README 直接把自己称为「开源的 Zapier 替代品」。和 Zapier 一样，它用「触发器 + 一连串动作」的方式把不同应用连起来；不同的是，你可以把它**部署在自己的服务器上**，流程和数据都留在自己手里。

如果已经了解 n8n，可以这样比较：两者都能自托管，n8n 的画布更自由、更偏技术用户；Activepieces 的流程是自上而下的步骤式，界面更接近 Zapier，对非技术人员更友好，社区版采用的是标准的 MIT 开源许可。

## 能做什么

- **工作流搭建**：循环、分支、自动重试、HTTP 请求步骤、可引入 NPM 包的代码步骤，流程有版本管理；
- **AI 智能体**：在流程里加入能自主调用工具的智能体步骤；
- **Pieces（集成）**：每个集成是一个用 TypeScript 写的 npm 包，README 称已有 200 多个，可以自己开发并贡献；
- **MCP**：README 的功能列表写明 280 多个 pieces 可以作为 MCP 服务器使用（仓库简介处的说法是约 400 个 MCP 服务器，两处数字不一致，以当前仓库为准）——也就是说，你可以让 Claude、Cursor 等支持 MCP 的客户端通过它操作这些应用。

## 怎么上手

**云端试用**：在官网注册，直接在浏览器里搭第一个流程。

**自部署**：仓库提供了 Dockerfile 和 docker-compose 文件，克隆后按官方文档配置环境变量并启动：

```bash
git clone https://github.com/activepieces/activepieces.git
cd activepieces
docker compose up -d
```

第一个流程建议做简单的：选一个定时或 Webhook 触发器 → 加一步 AI 处理（总结或分类）→ 把结果发到邮箱或表格。跑通后再逐步加分支和重试。

## 免费与付费

- **Community Edition**：MIT 许可，免费自托管；
- **企业功能**：采用商业许可，需要付费；
- **官方云服务**：有免费与付费方案，价格和额度以官网定价页为准。

## 适合谁 / 不适合谁

**适合：**
- 想要 Zapier 式的易用界面，又希望能自托管的团队；
- 有前端 / TypeScript 能力、想为内部系统自己写集成的开发者；
- 想把一批常用应用以 MCP 的形式提供给 AI 助手使用的人。

**不适合：**
- 需要对接大量冷门海外应用的用户——现成集成的数量少于 Zapier；
- 主要使用国内办公软件的团队，多数集成需要自己开发；
- 没有人维护服务器、又不想用云端版的团队。

## 注意事项

- **社区版与企业版的边界**：权限、审计、单点登录等功能通常在企业版，选型前对照官方的功能对比。
- **凭据安全**：流程里保存着各个应用的授权，自托管要做好加密密钥的保管和备份。
- **通过 MCP 开放能力时控制范围**：只暴露需要的 pieces 和动作，避免 AI 助手获得过大的操作权限。
- **AI 步骤的模型费用自理**。
