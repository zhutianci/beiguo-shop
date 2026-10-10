---
title: "OpenCode 是什么、怎么安装：开源的终端 AI 编程智能体与桌面版入门"
slug: opencode-open-source-coding-agent
name: OpenCode
url: https://opencode.ai/
pricing: 开源免费（MIT），模型费用自理
platforms: 命令行（macOS / Linux / Windows）/ 桌面应用（测试版）
products: [ai-tools]
models: []
topics: [coding, ai-agent]
excerpt: "OpenCode 是 MIT 许可的开源 AI 编程智能体，在终端里以交互界面运行，内置 build 和 plan 两种智能体，另有测试版桌面应用，GitHub 星标超过 21 万，可通过 npm、Homebrew 等多种方式安装。"
checkedOn: 2026-10-11
sources:
  - https://github.com/anomalyco/opencode
  - https://opencode.ai/
---

> 本文根据 OpenCode 官方 GitHub 仓库 README 与官网整理，资料核对于 2026-10-11。开源项目变化快，以官方仓库为准。

## 是什么

OpenCode 是一个开源的 AI 编程智能体，仓库现在位于 anomalyco/opencode（约 21.25 万星标、2.84 万次复刻），采用 MIT 许可。它和 Claude Code、Codex CLI 属于同一类工具——在终端里启动，用自然语言让它读代码、改文件、运行命令——区别在于它是社区驱动的开源项目，不属于某一家模型厂商。

## 核心设计

README 介绍了它的智能体分工：

- **build**：默认智能体，拥有完整权限，可以修改文件、执行命令，用于实际开发；
- **plan**：只读的规划智能体，只分析代码、给出方案，不动任何文件——适合先看清楚再动手，或在不熟悉的代码库里探索；
- **general**：一个通用的子智能体，在对话里用 `@general` 调用，处理需要多步搜索的复杂问题。

界面是终端里的交互式界面（TUI）；此外还有一个处于测试阶段的桌面应用，支持 macOS、Windows 和 Linux。

## 怎么上手

README 提供了很多安装方式，常用的几种：

```bash
# 安装脚本
curl -fsSL https://opencode.ai/install | bash

# npm
npm i -g opencode-ai@latest

# macOS / Linux 的 Homebrew
brew install opencode
```

Windows 用户还可以用 Scoop 或 Chocolatey。安装后：

1. 进入项目目录，运行 `opencode`；
2. 按提示配置模型服务（登录或填入 API Key，支持的服务商以官方文档为准）；
3. 先切到 plan 智能体，让它说明项目结构和改动方案；
4. 确认方案后切回 build 执行，逐步检查它的修改。

## 免费与付费

OpenCode 本身免费开源。使用成本取决于你接入的模型：按 API 用量付费，或使用你已有的订阅。搜索下拉里常见的「OpenCode Zen」「OpenCode Go」是官方围绕模型用量提供的付费服务，具体内容和价格以官网为准，本文未逐项核对。

## 适合谁 / 不适合谁

**适合：**
- 习惯终端、希望工具本身开源可审计的开发者；
- 想自由选择模型、不被单一厂商绑定的人；
- 喜欢「先规划、后执行」工作方式的工程师。

**不适合：**
- 不熟悉命令行的初学者；
- 想要编辑器内联补全和图形化 diff 的人，Cursor 等 IDE 类产品更合适；
- 需要厂商级服务支持和合规承诺的企业采购。

## 注意事项

- **build 智能体权限很大**：在 Git 仓库里使用，改动前提交干净，危险命令执行前仔细看确认提示。
- **认准仓库**：项目经历过组织和仓库地址的调整，网上还有名称相同的其他项目，以官网 opencode.ai 指向的仓库为准。
- **模型费用**：长对话和大仓库会消耗大量 Token，留意账单。
- **桌面版仍是测试版**，稳定性不如命令行版本。
