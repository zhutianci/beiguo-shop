---
title: "Langflow 是什么、怎么用：拖拽搭建 AI 智能体与工作流的开源可视化工具安装教程"
slug: langflow-visual-agent-builder
name: Langflow
url: https://www.langflow.org/
pricing: 开源免费（MIT）
platforms: Python（pip / uv）/ Docker / Windows 与 macOS 桌面版
products: [ai-tools]
models: []
topics: [ai-agent, coding]
excerpt: "Langflow 是 MIT 许可的开源可视化工具，用拖拽节点的方式搭建并部署 AI 智能体和工作流，内置交互式测试台，可一键发布成 API 或 MCP 服务器，支持主流大模型和向量数据库，并有桌面版。"
checkedOn: 2026-10-11
sources:
  - https://github.com/langflow-ai/langflow
  - https://www.langflow.org/
---

> 本文根据 Langflow 官方 GitHub 仓库 README 与官网整理，资料核对于 2026-10-11。开源项目变化快，以官方仓库为准。

## 是什么

Langflow 是一个用来搭建和部署 AI 智能体与工作流的开源工具，仓库 langflow-ai/langflow 在 GitHub 上约有 15.5 万星标，采用 MIT 许可。它的界面是一张画布：把「提示词」「模型」「知识库检索」「工具」这些组件拖上去，用线连起来，就得到一个可以运行的流程。

和 Dify 相比，Langflow 更偏**开发者的原型工具**：每个组件背后都是可以打开修改的 Python 代码，搭好的流程可以直接变成接口被别的程序调用。

## 能做什么

README 列出的主要功能：

- **可视化搭建**：拖拽组件，快速试验不同的流程结构；
- **Python 定制**：任何组件都可以用 Python 改写或新建；
- **交互式 Playground**：在界面里一步步测试，查看每个节点的输入输出；
- **多智能体编排**：管理多个智能体之间的对话与检索；
- **多种部署形态**：把流程发布为 API、作为 MCP 服务器供其他 AI 客户端调用，或导出为 JSON；
- **可观测性集成**：对接常见的追踪与监控工具；
- **广泛兼容**：支持主流大模型、向量数据库和各类 AI 工具。

## 怎么上手

**桌面版**：Langflow Desktop 提供 Windows 和 macOS 版本，下载安装即可，不需要自己配 Python 环境，适合第一次尝试。

**命令行安装**（需要 Python 3.10 到 3.14，官方推荐用 uv）：

```bash
uv pip install langflow -U
uv run langflow run
```

**Docker**：

```bash
docker run -p 7860:7860 langflowai/langflow:latest
```

启动后在浏览器打开 `http://localhost:7860`。建议从内置模板开始，例如「基础提示词」「文档问答」「简单智能体」，填入模型的 API Key 后先跑通，再替换成自己的数据和工具。

## 免费与付费

Langflow 本身免费开源。运行时的花费来自你接入的模型 API、向量数据库和服务器。官方是否提供托管的云服务及其价格，以官网为准。

## 适合谁 / 不适合谁

**适合：**
- 想快速验证一个 RAG 或智能体想法的开发者；
- 希望既能拖拽又能随时改代码的技术团队；
- 需要把流程以 API 或 MCP 的形式嵌入现有系统的人。

**不适合：**
- 完全不想接触 Python 和 API Key 的非技术用户；
- 需要成熟的多租户、权限、运营后台的企业级应用（要自己补很多东西）；
- 只需要一个聊天界面的人。

## 注意事项

- **对外提供服务前要加鉴权**：不要把没有保护的 Langflow 实例直接暴露在公网，并及时升级到最新版本以获得安全修复。
- **自定义组件会执行代码**：只导入可信来源的流程文件和组件。
- **版本升级可能带来组件不兼容**：升级前导出流程备份。
- **模型与数据库的费用自理**，长时间运行的智能体注意设置调用上限。
