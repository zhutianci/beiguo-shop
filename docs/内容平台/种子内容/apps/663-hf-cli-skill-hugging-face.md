---
title: "hf-cli skill 是什么、怎么安装使用：Hugging Face 官方命令行 Skill（下载模型、管理数据集、跑 Jobs）"
slug: hf-cli-skill-hugging-face
name: hf-cli（huggingface/skills）
url: https://github.com/huggingface/skills/tree/main/skills/hf-cli
pricing: "开源免费（Apache-2.0）；云端任务按 Hugging Face 计费"
platforms: "Claude Code / Codex / Gemini CLI / Cursor"
trialNote: "`/plugin marketplace add huggingface/skills` 然后 `/plugin install hf-cli@huggingface/skills`"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding, ai-agent]
excerpt: "hf-cli 是 Hugging Face 官方的基础 Skill：教智能体使用 hf 命令行下载、上传和管理 Hub 上的模型、数据集、Spaces、存储桶、论文与 Jobs，并提醒旧的 huggingface-cli 命令已被 hf 取代。"
checkedOn: 2026-10-11
sources:
  - https://github.com/huggingface/skills/tree/main/skills/hf-cli
  - https://github.com/huggingface/skills
  - https://huggingface.co/docs/hub/agents-cli
---

> 本文根据 huggingface/skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。所在仓库 huggingface/skills 在 GitHub 约 1.1 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

Hugging Face 的命令行工具这两年变化很大：命令从 `huggingface-cli` 改成了 `hf`，认证相关的子命令也挪了位置，又新增了 Jobs、存储桶、推理端点等一批功能。模型凭旧记忆敲出来的命令经常已经不存在。hf-cli 技能就是一份与当前版本同步的命令参考。

`description` 的范围：用 Hugging Face Hub CLI（`hf`）下载、上传和管理 Hub 上的模型、数据集、Spaces、存储桶、仓库、论文、Jobs 等。具体场景包括处理认证、管理本地缓存、在 Hugging Face 的基础设施上运行或定时运行任务、管理仓库及其讨论与合并请求、浏览模型和数据集、阅读与搜索论文、管理合集、查询数据集、配置 Spaces、设置 Webhook、部署和管理推理端点。用户提到 hf、huggingface 或想做任何与 Hugging Face 生态相关的事时都应使用。

SKILL.md 开头有两句要紧的话：`hf` 命令取代了已弃用的 `huggingface-cli`；认证命令现在都在 `hf auth` 下（例如 `hf auth whoami`）。正文按子命令分组列出用法——`hf auth`、`hf cache`、`hf datasets`、`hf jobs`、`hf models`、`hf spaces`、`hf endpoints` 等。文件注明是由 `huggingface_hub` 库自动生成的，可以用 `hf skills add --force` 重新生成以匹配你安装的版本。

## 怎么安装

按仓库 README，Claude Code 先登记市场并安装基础的 CLI 技能，其余技能再用 `hf` 命令行添加：

```text
/plugin marketplace add huggingface/skills
/plugin install hf-cli@huggingface/skills
```

```bash
hf skills add hf-cli
```

Codex 的做法是把仓库 `skills/` 下需要的文件夹复制或软链接到 `.agents/skills`；Gemini CLI 用 `gemini extensions install https://github.com/huggingface/skills.git --consent`。

仓库整体介绍和其他安装方式，详见本站《huggingface/skills 是什么、怎么安装：Hugging Face 官方 Agent Skills（hf-cli、模型训练、数据集、Spaces、Gradio）》。

`hf-cli` 就是上面第一步安装的那个基础技能，装好后再用它添加其他 Hugging Face 技能。

## 怎么用

- 「下载这个模型的 GGUF 量化文件到本地 models 目录」。
- 「把 `./data` 上传成一个私有数据集仓库」。
- 「看看我的本地缓存占了多少空间，清掉三个月没用过的模型」。

这个技能只有一份 SKILL.md（篇幅较长，是完整的命令清单）。

## 适合谁 / 局限

适合经常和 Hugging Face Hub 打交道的算法工程师、研究者和本地模型玩家。它只是命令参考，训练、评测、搭建演示等流程在该库的其他技能里；国内网络访问 Hub 可能不稳定，这不是技能能解决的。

## 注意事项

- **许可**：Apache-2.0。
- **令牌**：上传、访问私有或受限仓库需要你的 Hugging Face 访问令牌，用 `hf auth login` 在终端里登录，不要把令牌贴进对话；令牌权限按需选择只读或读写。
- **费用**：Jobs、推理端点等云端功能按 Hugging Face 的价格计费，让智能体启动前先确认规格。
- SKILL.md 开头给的 CLI 安装方式是「下载脚本并执行」，介意的话改用 Hugging Face 官方文档列出的其他安装方式。
