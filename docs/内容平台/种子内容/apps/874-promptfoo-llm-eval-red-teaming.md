---
title: "promptfoo 是什么、怎么用：评测提示词与大模型应用、做红队测试的开源工具"
slug: promptfoo-llm-eval-red-teaming
name: promptfoo
url: https://github.com/promptfoo/promptfoo
pricing: 免费开源（MIT）
platforms: 命令行 / Node.js 库（npm、brew、pip 均可安装）
products: [ai-tools]
models: [any-llm]
topics: [coding, prompt-engineering, ai-agent]
excerpt: "promptfoo 是 MIT 许可的开源命令行工具与库，用于评测和红队测试大模型应用：批量对比提示词与模型、扫描安全漏洞、接入 CI/CD，评测可在本机运行；README 称其现已并入 OpenAI 并保持开源。"
checkedOn: 2026-10-11
sources:
  - https://github.com/promptfoo/promptfoo
---

> 本文根据 promptfoo 官方 GitHub 仓库 README 整理，资料核对于 2026-10-11。开源项目变化快，以官方仓库为准。

## 是什么

promptfoo 的自我介绍是：用于评测和红队测试大模型应用的命令行工具与库。改了一句提示词之后，效果到底是变好还是变差？换一个更便宜的模型，哪些用例会翻车？凭感觉试几条是靠不住的，promptfoo 让你把测试用例写成配置文件，一条命令跑完所有组合并给出对比结果。README 写明 promptfoo 现在是 OpenAI 的一部分，同时保持开源和 MIT 许可。仓库约有 2.59 万星标。

## 能做什么

README 列出的功能：

- **自动化评测**：对提示词和模型做批量评测。
- **并排比较模型**：OpenAI、Anthropic、Azure、Bedrock、Ollama 等。
- **红队测试与漏洞扫描**：自动生成对抗性输入，检查应用在安全方面的薄弱点。
- **CI/CD 集成**：把评测作为自动检查，提示词或代码变动时自动运行。
- **代码扫描**：在 Pull Request 中扫描与大模型相关的安全和合规问题。
- **本地运行**：评测在你自己的机器上执行，README 强调提示词不会离开本机（调用云端模型时，请求仍会发给对应厂商）。

## 怎么上手

README 给出的快速开始：

```bash
npm install -g promptfoo
promptfoo init --example getting-started
export OPENAI_API_KEY=sk-abc123
cd getting-started
promptfoo eval
promptfoo view
```

也可以用 `brew install promptfoo`、`pip install promptfoo`，或者不安装直接 `npx promptfoo@latest`。

`promptfoo eval` 运行配置文件里定义的全部用例，`promptfoo view` 打开网页界面查看每个用例在不同提示词、不同模型下的输出与评分。配置文件的写法见官方文档。

## 免费与付费

开源版本免费（MIT 许可）。运行评测时调用各家模型会产生 API 费用，用例多、模型多时要留意总量。面向企业的托管与协作服务以官网为准。

## 适合谁 / 不适合谁

**适合：** 维护线上大模型应用、需要回归测试的工程团队；想系统比较不同模型性价比的开发者；负责 AI 应用安全评估的人员。

**不适合：** 只在聊天界面里使用 AI 的普通用户；还没有明确测试用例、处于想法阶段的项目；不熟悉命令行和配置文件的人。

## 注意事项

- 评测结论取决于测试用例的质量，用例要覆盖真实用户的输入而不是只测理想情况。
- 红队测试只应针对自己拥有或已获授权的系统。
- 用大模型给输出打分时，评分本身也会出错，关键指标要人工抽查。
