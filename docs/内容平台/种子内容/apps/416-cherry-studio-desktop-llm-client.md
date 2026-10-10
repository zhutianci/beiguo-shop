---
title: "Cherry Studio 是什么、官网下载与使用：一个客户端接入多家大模型 API 和本地模型"
slug: cherry-studio-desktop-llm-client
name: Cherry Studio
url: https://www.cherry-ai.com/
pricing: 社区版免费开源（AGPL-3.0）/ 企业版付费
platforms: Windows / macOS / Linux
products: [ai-tools]
models: []
topics: [office, coding, ai-agent]
excerpt: "Cherry Studio 是开源的桌面 AI 客户端，一个界面里接入 OpenAI、Gemini、Anthropic 等云端模型和 Ollama、LM Studio 本地模型，内置 300 多个预设助手，支持多模型同时回答与 MCP。"
checkedOn: 2026-10-11
sources:
  - https://github.com/CherryHQ/cherry-studio
  - https://www.cherry-ai.com/
---

> 本文根据 Cherry Studio 官方 GitHub 仓库 README 与官网整理，资料核对于 2026-10-11。开源项目变化快，以官方仓库为准。

## 是什么

Cherry Studio 是一款开源的桌面 AI 客户端，仓库 CherryHQ/cherry-studio 约有 5.25 万星标，支持 Windows、macOS 和 Linux。它本身**不提供模型**，而是一个「万能遥控器」：你把各家模型服务的 API Key 填进去，就能在同一个窗口里和不同模型对话，对话记录保存在自己的电脑上。

对国内用户来说，它流行的原因主要是中文界面完善、对国产模型服务商的预置支持多、上手不需要命令行。

## 能做什么

- **接入多家模型**：主流云端大模型（OpenAI、Gemini、Anthropic 等）、各类 AI 网页服务，以及通过 Ollama、LM Studio 运行的本地模型。
- **预设助手**：内置 300 多个预配置助手，也可以自己创建。
- **多模型同时对话**：同一个问题发给几个模型，并排比较回答。
- **文件处理**：支持文本、图片、Office 文件和 PDF。
- **数据管理**：WebDAV 文件管理与备份，方便在几台电脑之间同步。
- **其他**：Mermaid 图表渲染、MCP 服务器支持、明暗主题。

## 怎么上手

1. 从官网或 GitHub Releases 下载对应系统的安装包并安装。
2. 打开「设置—模型服务」，选一个服务商，填入 API Key，点检查确认连通。
3. 在模型列表里勾选要用的模型。
4. 回到对话页，在顶部选择模型开始提问；想做对比时在输入框旁添加多个模型。
5. 需要本地模型时，先装好 Ollama 并拉取模型，再在 Cherry Studio 里启用 Ollama 服务商。

第一次用可以这样测试密钥是否正常：

```text
用一句话说明你是哪家公司的哪个模型，然后用表格列出三种适合你处理的任务。
```

## 免费与付费

- **社区版**：免费，采用 AGPL-3.0 许可。
- **企业版**：可私有化部署，提供集中的模型管理、员工管理、共享知识库、权限控制和数据备份，按买断或订阅销售，价格需联系官方。
- **模型费用**：由你所用的模型服务商收取，Cherry Studio 社区版不加价。

## 适合谁 / 不适合谁

**适合：**
- 手里有多家模型 API Key、想统一管理和对比的用户；
- 希望聊天记录留在本地、又不想折腾 Docker 的人；
- 需要给不同工作场景配置不同助手的重度使用者。

**不适合：**
- 没有 API Key、也不想了解 API 是什么的新手——直接用各家官方 App 更简单；
- 需要手机端随时使用的人（核对到的官方 README 只列出桌面三大系统）；
- 需要多人协作、统一权限的团队，应评估企业版或 Open WebUI。

## 注意事项

- **AGPL 的商用边界**：README 说明满足 AGPL 全部条款即可商用；如果需要闭源集成或二次分发，要联系官方获取商业授权。
- **API Key 保存在本机**：换电脑或重装系统前先备份；不要使用来历不明的「共享密钥」。
- **按量计费要留意**：多模型同时回答会让每个问题的花费成倍增加。
- **认准官方渠道下载**：只从官网和官方 GitHub 仓库获取安装包。
