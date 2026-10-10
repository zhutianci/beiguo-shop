---
title: "CrewAI 是什么、怎么用：开源多智能体框架的 Crews 与 Flows 入门教程"
slug: crewai-multi-agent-framework
name: CrewAI
url: https://www.crewai.com/
pricing: 开源免费（MIT）/ 企业平台另计
platforms: Python 库 / 命令行 / 云平台（CrewAI AMP）
products: [ai-tools]
models: []
topics: [ai-agent, coding]
excerpt: "CrewAI 是 MIT 许可的开源 Python 多智能体框架：用「角色、目标、任务」定义一组协作的智能体（Crew），再用事件驱动的 Flows 编排流程，适合想用代码搭 Agent 应用的开发者。"
checkedOn: 2026-10-11
sources:
  - https://github.com/crewAIInc/crewAI
  - https://docs.crewai.com/
---

> 本文根据 CrewAI 官方 GitHub 仓库 README 与官方文档整理，资料核对于 2026-10-11。开源项目变化快，以官方仓库为准。

## 是什么

CrewAI 是一个开源的 Python 框架，用来搭建多智能体工作流，仓库 crewAIInc/crewAI 在 GitHub 上约有 5.95 万星标，采用 MIT 许可。README 对它的描述是：同时提供高层抽象和底层 API、面向生产环境的多智能体框架。

它最容易理解的地方在于「拟人化」的建模方式——你像组建一个小团队那样写代码：谁是研究员、谁是撰稿人、各自的目标是什么、要完成哪些任务、产出交给谁。

## 核心概念

- **Agent（智能体）**：由角色（role）、目标（goal）、背景设定（backstory）、所用模型和工具定义。
- **Task（任务）**：包含任务描述、期望输出，以及指派给哪个智能体。
- **Crew（团队）**：一组按角色分工、自主协作的智能体。
- **Flow（流程）**：事件驱动的工作流，带状态管理和条件分支，可以在其中调用 Crew——适合需要精确控制步骤的生产场景。

简单记：想让智能体**自己商量着干**用 Crew，想**按固定流程走**用 Flow，两者可以嵌套。

## 怎么上手

README 要求 Python 版本不低于 3.10、低于 3.14。先安装命令行工具：

```bash
uv tool install crewai
crewai create crew my_project
```

脚手架会生成项目结构，其中 `agents.yaml` 写智能体的角色与目标，`tasks.yaml` 写任务，`crew.py` 把它们组装起来。填好模型的 API Key 后在项目目录运行 `crewai run`。建议第一个项目只放两个智能体（如「资料搜集」和「报告撰写」），跑通后再加角色。

## 免费与付费

- **开源框架**：MIT 许可，免费使用和商用。
- **CrewAI AMP Suite**：官方的商业平台，提供托管部署、可观测性、治理、安全和企业支持；README 提到其中的 Crew Control Plane 可以免费试用，价格以官网为准。
- **模型费用**：框架本身不含模型，调用哪家的模型就按哪家计费。

## 适合谁 / 不适合谁

**适合：**
- 会 Python、想用代码而不是拖拽画布搭 Agent 应用的开发者；
- 任务可以清晰拆成几个角色分工的场景：调研写作、数据整理、内容审核流水线等；
- 想了解多智能体协作模式的学习者。

**不适合：**
- 不写代码的用户，扣子、Dify 这类可视化平台更合适；
- 只需要单个智能体加几个工具的简单场景，直接用模型厂商的 SDK 更轻；
- 需要对每一步状态做极细粒度控制的复杂系统，可以对比 LangGraph。

## 注意事项

- **成本容易失控**：多个智能体来回对话会成倍消耗 Token，开发阶段先用便宜的模型并限制最大迭代次数。
- **结果不稳定是常态**：同样的输入可能走出不同的协作路径，关键环节要加校验或改用 Flow 固定流程。
- **版本变化快**：API 在迭代中，网上的老教程可能跑不通，以官方文档的当前版本为准。
- **工具权限**：给智能体挂载能执行代码、访问文件或发请求的工具时，要在隔离环境里运行。
