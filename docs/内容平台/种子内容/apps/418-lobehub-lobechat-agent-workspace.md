---
title: "LobeHub（原 LobeChat）是什么：开源 AI 智能体工作台的网页版、Docker 部署与使用"
slug: lobehub-lobechat-agent-workspace
name: LobeHub（原 LobeChat）
url: https://lobehub.com/
pricing: 开源自部署 / 官方云服务以官网为准
platforms: 网页 / Docker 自部署 / Vercel 等一键部署
products: [ai-tools]
models: []
topics: [ai-agent, office, coding]
excerpt: "LobeHub 就是很多人熟悉的 LobeChat，现在定位为管理一组 AI 智能体的开源工作台：创建智能体、组成智能体群组、定时运行、接入上万个 MCP 工具，可用官方云端版或 Docker 自部署。"
checkedOn: 2026-10-11
sources:
  - https://github.com/lobehub/lobehub
  - https://lobehub.com/
---

> 本文根据 LobeHub 官方 GitHub 仓库 README 与官网整理，资料核对于 2026-10-11。开源项目变化快，以官方仓库为准。

## 是什么

如果你搜的是 LobeChat，找到这里没有错：这个项目的 GitHub 仓库现在是 lobehub/lobehub（约 8.31 万星标），仓库里的包名仍保留着 `lobe-chat` 字样。它早期以「界面好看的开源 ChatGPT 替代界面」出名，现在 README 的定位已经升级——把自己描述为一个「Chief Agent Operator」：帮你**招募、调度并汇报一整支 AI 智能体团队**。

## 能做什么

README 把功能分成四块：

- **Operator（统一运营）**：在一个地方管理所有智能体，并通过 IM 网关在聊天软件里和它们对话。
- **Create（创建）**：Agent Builder 可以根据一句描述生成智能体；可接入多家模型，以及一万多个兼容 MCP 的工具和插件。
- **Collaborate（协作）**：智能体群组、共享页面、定时运行、项目和工作区。
- **Evolve（成长）**：结构化、用户可编辑的个人记忆，让智能体越用越了解你。

## 怎么上手

**直接用云端版**：打开 app.lobehub.com 注册登录即可，适合先体验。

**自部署**：

- Docker 镜像部署；
- 一键部署到 Vercel、Zeabur、Sealos、RepoCloud、阿里云等平台。

README 的环境变量表里把 `OPENAI_API_KEY` 列为必填项；接其他模型服务商时按文档添加对应变量。部署完成后，在设置里配置模型服务、创建第一个智能体，再试着把两三个智能体放进一个群组里协作。

## 免费与付费

- **自部署**：按 LobeHub Community License 使用，模型费用自理。
- **官方云服务**：有免费与付费方案，具体价格和额度以官网为准。

## 适合谁 / 不适合谁

**适合：**
- 想要一个颜值高、功能全的自托管 AI 界面的个人和小团队；
- 需要同时维护很多「专用智能体」（写作、翻译、代码审查、客服话术等）的重度用户；
- 想体验多智能体群组协作、MCP 工具生态的尝鲜者。

**不适合：**
- 只想要一个最简单聊天窗口的人，功能较多会显得复杂；
- 完全不想部署、也不想注册新平台的用户；
- 对许可证有严格开源要求的企业——需要先读清楚社区许可的条款。

## 注意事项

- **许可证要看原文**：README 写的是 LobeHub Community License，而仓库页面的徽章显示 Apache 2.0，二者表述不一致，商用或二次开发前请阅读仓库中的 LICENSE 文件。
- **改名带来的教程差异**：以 LobeChat 为名的老教程在界面、环境变量上可能与当前版本不同。
- **自部署的访问保护**：公开部署时要设置访问密码或登录鉴权，否则别人可以消耗你的 API 额度。
- **MCP 工具的权限**：第三方工具可能读取你传入的数据，只启用可信来源。
