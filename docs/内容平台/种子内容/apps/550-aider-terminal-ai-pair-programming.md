---
title: "Aider 是什么、怎么用：终端里的开源 AI 结对编程工具安装与入门教程"
slug: aider-terminal-ai-pair-programming
name: Aider
url: https://aider.chat/
pricing: 开源免费（Apache-2.0），模型费用自理
platforms: 命令行（Windows / macOS / Linux）
products: [ai-tools]
models: []
topics: [coding, ai-agent]
excerpt: "Aider 是 Apache-2.0 许可的开源命令行 AI 结对编程工具：在终端里对话改代码，自动生成 Git 提交，能为整个代码库建立地图，支持 100 多种语言，可接云端或本地模型。"
checkedOn: 2026-10-11
sources:
  - https://github.com/Aider-AI/aider
  - https://aider.chat/
---

> 本文根据 Aider 官方 GitHub 仓库 README 与官网整理，资料核对于 2026-10-11。开源项目变化快，以官方仓库为准。

## 是什么

Aider 是一个在终端里运行的开源 AI 结对编程工具，仓库 Aider-AI/aider 约有 4.95 万星标，采用 Apache-2.0 许可。你在项目目录里启动它，用自然语言说要改什么，它直接修改本地文件，并把每次改动提交成一条 Git 记录。新项目和已有代码库都能用。

在 Claude Code、Codex CLI 这些厂商自家的命令行工具出现之前，Aider 就已经是「终端 AI 编程」的代表作。它的不同之处在于**不绑定任何一家模型**：填哪家的 API Key 就用哪家，也可以接本地模型。

## 能做什么

- **Git 集成**：每次修改自动提交，并写好提交信息；不满意可以用 Git 撤销或对比。
- **代码库地图（repo map）**：为整个仓库建立结构索引，让模型在大项目里也知道该改哪里。
- **多语言**：支持 Python、JavaScript、Rust、Go、C++ 等 100 多种语言。
- **语音写代码**：用说话的方式提出功能、测试或修复需求。
- **Lint 与测试**：每次修改后自动跑检查和测试，发现问题让模型接着修。
- **多种模型**：README 列举了 Claude、DeepSeek、OpenAI 等系列，也可以连接本地模型。

## 怎么上手

```bash
python -m pip install aider-install
aider-install
```

然后进入你的 Git 项目目录，带上模型和密钥启动（具体参数以官方文档为准）：

```bash
cd 你的项目
aider --model 模型名 --api-key 服务商=你的密钥
```

进入对话后：

1. 用 `/add 文件路径` 把要修改的文件加入会话；
2. 直接描述需求，例如「给 parse_date 函数补上对空字符串的处理，并加一条单元测试」；
3. 看它给出的修改和提交记录，有问题用 `/undo` 撤回上一次提交。

## 免费与付费

Aider 本身免费开源，没有订阅。花费来自你所用模型的 API 账单；用本地模型则没有调用费。

## 适合谁 / 不适合谁

**适合：**
- 习惯终端和 Git 工作流的开发者；
- 想自由切换模型、或只想用按量付费 API 而不买订阅的人；
- 需要在服务器、远程终端等没有图形界面的环境里用 AI 改代码的场景。

**不适合：**
- 不熟悉命令行和 Git 的新手；
- 想要图形化 diff、内联补全等编辑器体验的人，Cursor、Copilot 更合适；
- 需要云端并行跑多个长任务的团队。

## 注意事项

- **一定在 Git 仓库里用**：自动提交是它的安全网，改动前先把自己的工作区提交干净。
- **控制上下文**：只把相关文件加进会话，文件越多 Token 花得越快。
- **留意账单**：大仓库加上高价模型，一次长对话可能花掉不少钱。
- **README 里推荐的模型名单可能滞后**于各家的最新版本，选型时结合官方文档和自己的测试。
- **代码仍需人工审查**：自动跑通测试不代表逻辑正确。
