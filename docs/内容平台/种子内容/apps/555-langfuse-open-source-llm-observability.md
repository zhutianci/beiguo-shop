---
title: "Langfuse 是什么、怎么用：开源 LLM 应用追踪、提示词管理与评测平台，和 LangSmith 的区别"
slug: langfuse-open-source-llm-observability
name: Langfuse
url: https://langfuse.com/
pricing: 开源自部署免费 / 云端有免费档
platforms: 网页 / SDK / Docker、Kubernetes 自部署
trialNote: Langfuse Cloud 有免费档，无需信用卡
products: [ai-tools]
models: []
topics: [coding, ai-agent, prompt-engineering]
excerpt: "Langfuse 是开源的 LLM 工程平台，用于开发、监控、评测和调试 AI 应用：调用追踪、提示词管理、评测、数据集和 Playground 一应俱全，可自托管，也有带免费档的云端版。2026 年 1 月起属于 ClickHouse。"
checkedOn: 2026-10-11
sources:
  - https://github.com/langfuse/langfuse
  - https://langfuse.com/
---

> 本文根据 Langfuse 官方 GitHub 仓库 README 与官网整理，资料核对于 2026-10-11。功能和价格变化快，以官网为准。

## 是什么

Langfuse 是一个开源的 LLM 工程平台，仓库 langfuse/langfuse 约有 3.56 万星标。README 的定位是帮助团队开发、监控、评测和调试 AI 应用。README 同时写明：**Langfuse 自 2026 年 1 月起成为 ClickHouse 的一部分**。

很多人是在对比「LangSmith 和 Langfuse」时认识它的。两者做的事情相近——都是记录 LLM 应用每一步发生了什么、管理提示词、跑评测。最大的区别是 Langfuse **开源且可以完整自托管**，不绑定特定的开发框架。

## 能做什么

README 列出的功能：

- **应用追踪（Tracing）**：记录每次请求里的模型调用、检索、工具调用，看到输入输出、耗时和成本；
- **提示词管理**：集中存放提示词，做版本管理和协作，改提示词不必改代码发版；
- **评测**：支持 LLM 充当评审（LLM-as-a-judge）、代码评测器和用户反馈；
- **数据集**：把典型用例存为测试集，用于回归测试；
- **Playground**：在线调试提示词和模型参数。

## 怎么上手

**云端版**：在官网注册 Langfuse Cloud（有免费档，不需要信用卡），创建项目后拿到公钥和私钥，在应用里安装 SDK 并配置密钥，运行一次应用就能在后台看到追踪。

**自托管**（README 列出的方式）：

- 本机或单台虚拟机：Docker Compose；
- Kubernetes：Helm；
- 云平台：AWS、Azure、GCP 的 Terraform 模板。

```bash
git clone https://github.com/langfuse/langfuse.git
cd langfuse
docker compose up
```

接入后建议先做两件事：给追踪打上用户和会话标识，方便按用户排查；把线上表现差的几条请求存入数据集，作为之后改动的回归用例。

## 免费与付费

- **自托管**：核心功能以 MIT 许可开源（仓库中的 `ee` 目录除外，属于企业功能）；
- **Langfuse Cloud**：有免费档，付费档按用量和功能分级，价格以官网定价页为准。

## 适合谁 / 不适合谁

**适合：**
- 已经有 LLM 应用上线、需要排查问题和控制成本的开发团队；
- 要求数据留在自己基础设施里的公司；
- 不想被某个开发框架绑定、希望观测层保持中立的团队。

**不适合：**
- 没有自己开发 AI 应用的普通用户；
- 只做一次性演示的项目；
- 不愿意运维数据库等组件、又不能使用云端版的团队——自托管需要一定的运维投入。

## 注意事项

- **追踪里含真实用户数据**：配置脱敏规则和保留期限，自托管也要做好访问控制。
- **`ee` 目录不是 MIT**：需要企业功能时确认许可条款。
- **自托管的资源需求**：生产规模部署依赖多个存储组件，容量规划见官方文档。
- **归属变化**：并入 ClickHouse 后的产品路线和定价以官方公告为准。
