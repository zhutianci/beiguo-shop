---
title: "Dify 是什么、是哪个公司的：开源 LLM 应用开发平台的云端版与自部署入门"
slug: dify-llm-app-platform
name: Dify
url: https://dify.ai/
pricing: 开源自部署免费 / 云端免费+付费
platforms: 网页（Dify Cloud）/ Docker 自部署 / API
trialNote: Dify Cloud 的 Sandbox 免费档含 200 条消息额度；社区版可免费自部署
products: [ai-tools]
models: []
topics: [ai-agent, coding]
excerpt: "Dify 是开源的 LLM 应用开发平台，用可视化画布搭工作流、RAG 知识库和智能体，并自带 API 与日志监控。可用官方云端版，也可以用 Docker 部署在自己的服务器上。"
checkedOn: 2026-10-11
sources:
  - https://dify.ai/pricing
  - https://github.com/langgenius/dify
  - https://docs.dify.ai/
---

> 本文根据 Dify 官网定价页、官方 GitHub 仓库 README 与官方文档整理，资料核对于 2026-10-11。功能和价格变化快，以官网为准。

## 是什么

Dify 是一个开源的 LLM 应用开发平台，仓库为 langgenius/dify（GitHub 星标约 15.8 万）。它把搭一个 AI 应用需要的几件事——提示词编排、工作流、知识库检索（RAG）、智能体、模型管理、日志与监控——放进同一个网页后台，目标是让应用从原型走到生产环境。

和扣子、腾讯元器这类「平台托管」的产品相比，Dify 的特点是**可以完整自部署**：代码、数据和模型密钥都在自己的服务器上，所以在企业内部知识库、客服机器人这类场景里很常见。

## 能做什么

- **工作流**：在可视化画布上拖节点、连线，搭建并测试多步骤的 AI 流程。
- **模型接入**：对接众多闭源与开源模型、自托管模型以及兼容 OpenAI 接口的服务，可随时切换。
- **Prompt IDE**：编写提示词、对比不同模型的表现，给聊天应用加上语音等能力。
- **RAG 管线**：从文档导入、文本提取到检索的完整流程，支持常见文档格式。
- **Agent**：带沙箱的自主智能体，可挂载技能、工具、MCP 服务器或自定义 API。
- **LLMOps**：查看日志与性能，用线上数据持续改提示词、数据集和模型。
- **后端即服务**：每个应用都自带 API，方便接进自己的业务系统。

## 怎么上手

**云端版**：打开 dify.ai 注册，进入工作区后新建应用，选「聊天助手 / 工作流 / Agent」之一，配置模型密钥即可。

**自部署**（README 给出的最低配置为 2 核 CPU、4 GiB 内存）：

```bash
git clone https://github.com/langgenius/dify.git
cd dify/docker
cp .env.example .env
docker compose up -d
```

启动后在浏览器打开 `http://localhost/install` 完成初始化。需要 Docker 和 Docker Compose v2.24.0 及以上。

## 免费与付费

官网定价页（年付价格，不含税，2026-10 查询）：

| 方案 | 价格 | 主要额度 |
| --- | --- | --- |
| Sandbox | 免费 | 200 条消息额度、1 名成员、5 个应用 |
| Professional | 590 美元/工作区/年 | 每月 5,000 条消息额度、3 名成员、50 个应用 |
| Team | 1,590 美元/工作区/年 | 每月 10,000 条消息额度、50 名成员、200 个应用 |

页面注明年付比月付省 17%，月付金额以结算页为准。自部署方面，Community 社区版免费（单工作区），Enterprise 企业版需联系销售。

## 适合谁 / 不适合谁

**适合：**
- 要给公司搭内部知识库问答、客服机器人、审批或内容流程的开发者与技术团队；
- 需要数据留在自己服务器上的企业；
- 想系统学习 RAG 与 Agent 应用搭建的学习者。

**不适合：**
- 完全不想碰服务器、也不想管模型密钥的普通用户；
- 只需要一个聊天窗口的人，用现成的聊天助手即可；
- 打算把 Dify 改造后对外提供服务的团队——开源许可带有附加条件，动手前要先读 LICENSE 或咨询商业授权。

## 注意事项

- **许可证不是纯 Apache 2.0**：Dify Open Source License 基于 Apache 2.0 并附加了条件，商用前请阅读仓库里的 LICENSE。
- **模型费用另算**：Dify 本身不含模型调用费，消息额度用完或自部署时都要自备模型 API 密钥或本地模型。
- **自部署要自己负责安全**：及时升级版本，不要把管理后台直接暴露在公网。
- **版本迭代快**：升级前先看官方 Release 说明并备份数据库和存储卷。
