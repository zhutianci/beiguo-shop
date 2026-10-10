---
title: "AutoGen 是什么、现在还能用吗：微软多智能体框架已进入维护模式，继任者是 Microsoft Agent Framework"
slug: autogen-microsoft-agent-framework
name: AutoGen
url: https://github.com/microsoft/autogen
pricing: 开源免费（MIT）
platforms: Python 库 / AutoGen Studio（本地网页界面）
products: [ai-tools]
models: []
topics: [ai-agent, coding]
excerpt: "AutoGen 是微软开源的多智能体应用框架，包含 Core、AgentChat、Extensions 和无代码界面 AutoGen Studio。官方仓库已声明它进入维护模式，新项目建议转向继任者 Microsoft Agent Framework。"
checkedOn: 2026-10-11
sources:
  - https://github.com/microsoft/autogen
  - https://github.com/microsoft/agent-framework
---

> 本文根据微软官方 GitHub 仓库 microsoft/autogen 的 README 整理，资料核对于 2026-10-11。开源项目变化快，以官方仓库为准。

## 先说结论

AutoGen 现在**仍然可以安装和使用，但已经进入维护模式**。官方 README 明确写着它「不会再获得新功能或增强」，并说明 Microsoft Agent Framework（MAF）是 AutoGen 面向企业的继任者，新用户被引导到那边。所以：

- 维护老项目、学习多智能体的经典思路——AutoGen 依然有参考价值；
- 开新项目——优先看 Microsoft Agent Framework，或 LangGraph、CrewAI 等仍在活跃开发的框架。

## 是什么

AutoGen 是微软开源的框架，用来构建可以自主行动、也可以与人协作的多智能体 AI 应用。仓库约有 6.13 万星标；代码采用 MIT 许可，文档采用 CC-BY-4.0。它最广为人知的模式是「让几个智能体互相对话来解决问题」，例如一个负责写代码、一个负责执行和反馈。

## 组成部分

- **Core API**：底层的消息传递、事件驱动智能体，以及本地和分布式运行时。
- **AgentChat API**：在 Core 之上更简单、带有默认设计的一层，用于快速做原型。
- **Extensions API**：官方和第三方扩展，包括各家模型的客户端。
- **AutoGen Studio**：无代码的图形界面，用来拼装和测试多智能体流程。
- **AutoGen Bench**：评测基准套件。

## 怎么上手

需要 Python 3.10 及以上：

```bash
pip install -U "autogen-agentchat" "autogen-ext[openai]"
```

之后按 README 的示例创建一个 `AssistantAgent`，传入模型客户端和任务即可。想先不写代码体验，可以安装并启动 AutoGen Studio，在浏览器里拖拽组合智能体。

注意：网上大量教程基于早期的 0.2 版本（`pyautogen` 包、`UserProxyAgent` 写法），与后来重写的版本接口差异很大，照抄容易报错，先确认教程对应的版本。

## 免费与付费

框架完全免费开源。费用来自你调用的模型 API；如果让智能体执行代码，还要准备隔离的运行环境。

## 适合谁 / 不适合谁

**适合：**
- 已有 AutoGen 项目需要继续维护的团队；
- 想通过可运行的例子理解「多智能体对话」这一经典范式的学习者和研究者；
- 想用 AutoGen Studio 快速搭个演示的人。

**不适合：**
- 准备启动新的生产项目的团队——官方已不再为它增加新功能；
- 不写代码的用户；
- 需要长期官方路线图保障的企业应用。

## 注意事项

- **迁移**：官方为 AutoGen 用户提供了迁移到 Microsoft Agent Framework 的说明，动手前先读 MAF 仓库的文档。
- **代码执行风险**：让智能体自动执行它生成的代码时，务必放在 Docker 等沙箱里，不要直接在主机上跑。
- **对话轮数要设上限**：多智能体互相对话可能陷入循环，持续消耗 Token。
- **认准官方仓库**：社区里有名称相近的分支项目，本文说的是 microsoft/autogen。
