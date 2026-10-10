---
title: "huggingface/skills 是什么、怎么安装：Hugging Face 官方 Agent Skills（hf-cli、模型训练、数据集、Spaces、Gradio）"
slug: hugging-face-skills-official
name: huggingface/skills（Hugging Face 官方 Skills）
url: https://github.com/huggingface/skills
pricing: 开源免费（Apache-2.0）；云端训练等任务按 Hugging Face 计费
platforms: Claude Code / Codex / Gemini CLI / Cursor
trialNote: "`/plugin marketplace add huggingface/skills` 然后 `/plugin install hf-cli@huggingface/skills`"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding]
excerpt: "huggingface/skills 是 Hugging Face 官方的 Agent Skills 仓库：hf-cli 教智能体用 hf 命令操作 Hub，另有训练、评测、数据集、Spaces、Gradio 等共 25 个技能，支持 Claude Code、Codex、Gemini CLI、Cursor。"
checkedOn: 2026-10-10
sources:
  - https://github.com/huggingface/skills
  - https://huggingface.co/docs/hub/agents-cli
  - https://code.claude.com/docs/en/discover-plugins
  - https://learn.chatgpt.com/docs/build-skills
  - https://agentskills.io/home
---

> 本文根据 huggingface/skills 仓库 README、Hugging Face 官方文档以及 Claude Code、Codex 官方文档整理，资料核对于 2026-10-10。技能清单由仓库脚本自动生成，以仓库为准。

## 是什么

huggingface/skills 是 Hugging Face 官方的 Agent Skills 仓库，把「在 Hub 上找模型、管理数据集、训练和评测、发布 Space」这些机器学习日常工作写成技能，让编程智能体照着做。每个技能是一个带 `SKILL.md` 的文件夹，附脚本和模板，格式遵循 agentskills.io 的开放标准。

仓库的安排是「一个入口加按需安装」：各家客户端的插件市场里只放 `hf-cli` 这一个技能，它教智能体使用 `hf` 命令行的全部命令；其余工作流技能用 `hf skills add <skill-name>` 按需添加。README 还为不支持技能的智能体准备了一份 `agentsmd/AGENTS.md` 作为替代。

截至 2026-10-10，GitHub 显示该仓库约 1.1 万 Star、764 Fork，最近一次推送 2026-10-08。

## 包含哪些 Skill

README 的技能表核对当日有 25 个，大致分五类：

- **Hub 基础**：`hf-cli`（下载、上传、管理模型、数据集、Space、存储桶、任务等），`hf-mem`（估算加载模型权重需要多少内存），`huggingface-best`（按任务和榜单分数挑模型），`huggingface-local-models`（挑适合用 llama.cpp 本地跑的 GGUF 模型）；
- **训练与评测**：`huggingface-llm-trainer`、`trl-training`、`huggingface-vision-trainer`、`train-sentence-transformers`，`huggingface-community-evals`（本地跑评测），`huggingface-trackio`（记录和查看训练实验）；
- **数据与论文**：`huggingface-datasets`（数据集查看器接口）、`huggingface-papers`、`huggingface-paper-publisher`；
- **应用与演示**：`huggingface-gradio`、`huggingface-spaces`、`huggingface-zerogpu`、`huggingface-lora-space-builder`、`transformers-js`、`huggingface-tool-builder`；
- **云上部署**：`hf-cloud-` 开头的 6 个技能，处理把模型部署到 Amazon SageMaker 时的环境、IAM 角色、镜像选择和默认配置。

## 怎么安装

**Claude Code**（命令来自 README）：

```text
/plugin marketplace add huggingface/skills
/plugin install hf-cli@huggingface/skills
```

装好 `hf-cli` 后，其他技能用 `hf` 命令行添加：

```text
hf skills add <skill-name>
```

**Codex**：README 的做法是把仓库 `skills/` 目录里想用的技能复制或软链接到 Codex 的 `.agents/skills` 位置（例如仓库内的 `.agents/skills` 或用户级的 `$HOME/.agents/skills`），和 Codex 官方文档一致。`hf-cli` 也上架了 Codex 插件目录。

**Gemini CLI**：仓库带有 `gemini-extension.json`，用地址安装：

```text
gemini extensions install https://github.com/huggingface/skills.git --consent
```

**Cursor**：仓库带 Cursor 插件清单和 `.mcp.json`（已配置 Hugging Face MCP 服务器地址），可从 Cursor Marketplace 或仓库地址安装；市场条目同样只含 `hf-cli`。

## 怎么用

装好后在指令里点名技能即可，README 给的例子大意是：

- 「用 HF LLM trainer 技能估算跑一个 70B 模型需要多少显存」；
- 「用 HF paper publisher 技能把我的 arXiv 论文收录进来，并关联到我的模型」。

同样的说法可以套到别的技能上，比如让它用数据集技能查看某个数据集有哪些子集和拆分，再按条件筛几行出来。

智能体会加载对应的 `SKILL.md` 和辅助脚本完成任务。Claude Code 里插件技能以 `/插件名:技能名` 的形式出现，输入 `/skills` 可查看全部。

## 适合谁 / 不适合谁

**适合：**
- 经常在 Hugging Face Hub 上找模型、传数据集、发 Space 的开发者和研究者；
- 想让智能体代劳微调、评测这类步骤繁琐的工作的人；
- 要把开源模型部署到 SageMaker 的团队。

**不适合：**
- 只调用现成大模型 API、不碰开源模型的人；
- 没有 Hugging Face 账号、也不打算用 `hf` 命令行的人——多数技能围绕它展开。

## 注意事项

- **许可证**：Apache-2.0，仓库根目录有 LICENSE 文件。
- **维护状态**：最近一次推送 2026-10-08，持续更新。
- **安全与费用**：这些技能会驱动 `hf` 命令行操作你的 Hugging Face 账号，上传、建 Space、提交云端训练任务都算；训练类技能用的是 Hugging Face Jobs 的云端 GPU，`hf-cloud-` 系列会在 AWS 上创建角色和端点，都可能产生费用，以各自官方定价为准。提交任务前让智能体先把计划和预估配置讲清楚。Cursor 插件会连同 Hugging Face 的 MCP 服务器一起配置。
- **兼容性**：README 写明兼容 Claude Code、Codex、Gemini CLI 和 Cursor；插件市场只装得到 `hf-cli`，想要别的技能必须再走 `hf skills add`，这一点容易漏。
