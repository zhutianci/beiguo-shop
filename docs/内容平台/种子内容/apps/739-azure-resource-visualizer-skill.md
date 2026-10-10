---
title: "azure-resource-visualizer skill 是什么、怎么安装使用：把 Azure 资源组画成 Mermaid 架构图"
slug: azure-resource-visualizer-skill
name: azure-resource-visualizer（microsoft/azure-skills）
url: https://github.com/microsoft/azure-skills/tree/main/skills/azure-resource-visualizer
pricing: "开源免费（MIT）；Azure 资源按微软云计费"
platforms: "GitHub Copilot / Claude Code / Gemini CLI / Cursor / Codex CLI"
trialNote: "`/plugin marketplace add microsoft/azure-skills` 然后 `/plugin install azure@azure-skills`"
products: [github-copilot, claude]
models: [any-llm]
topics: [agent-skills, coding, ai-agent]
excerpt: "azure-resource-visualizer 是微软 Azure Skills 插件里的架构图技能：读取一个 Azure 资源组里的全部资源，分析网络、身份和依赖关系，生成带资源清单和 Mermaid 架构图的 Markdown 文档。"
checkedOn: 2026-10-11
sources:
  - https://github.com/microsoft/azure-skills/tree/main/skills/azure-resource-visualizer
  - https://github.com/microsoft/azure-skills
  - https://skills.sh/
---

> 本文根据 microsoft/azure-skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 54.8 万次；所在仓库 microsoft/azure-skills 在 GitHub 约 1555 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

接手别人留下的 Azure 环境，第一件事是弄清「这些资源之间是什么关系」，门户里一个个点开看很慢。这个技能让智能体替你读一遍再画出来。`description`：分析 Azure 资源组，生成详细的 Mermaid 架构图，展示各个资源之间的关系；触发说法包括创建架构图、可视化 Azure 资源、分析资源组、绘制资源拓扑。

SKILL.md 规定了四步流程：

1. **选资源组**：你没指定时，列出可用的资源组和所在区域，编号让你选，等你回答后再继续。
2. **发现与分析**：查询资源组里的全部资源，逐个记录名称与类型、规格档位、区域、关键配置、网络设置（虚拟网络、子网、私有终结点）、身份与访问（托管身份、角色分配）和依赖关系；跨订阅的批量盘点用 Azure Resource Graph 查询，目录里有一份查询写法参考。
3. **构图**：把网络连接、数据流向、身份关系等画成 Mermaid 图。
4. **写文件**：按模板生成 `[资源组名]-architecture.md`，包含标题信息、两三段架构概述、资源清单表、完整的 Mermaid 图、关键连接与数据流说明，以及观察到的问题和建议。

后面还有质量标准、边界情况处理和 Mermaid 语法规范，目录里附了一份示例图和一份文档模板。它优先使用 Azure MCP 工具，没有相应工具时退回到 `az` 命令行。

## 怎么安装

`azure-resource-visualizer` 随微软的 Azure 插件一起安装，插件同时配置好 Azure MCP Server。Claude Code 里（命令来自仓库 README）：

```text
/plugin marketplace add microsoft/azure-skills
/plugin install azure@azure-skills
```

Gemini CLI 用 `gemini extensions install https://github.com/microsoft/azure-skills`，Codex 用 `codex plugin marketplace add microsoft/azure-skills`；GitHub Copilot 的装法见 README。真正操作云资源前，本机要装好 Azure CLI（`az`）并登录，部署类场景还要 Azure Developer CLI（`azd`）。

仓库整体介绍和其他安装方式，详见本站《azure-skills 是什么、怎么安装：微软官方 Azure Skills 插件（技能 + Azure MCP Server，让智能体真正操作 Azure）》。

## 怎么用

- 「把资源组 `rg-prod-web` 画成架构图」。
- 「我不确定有哪些资源组，先列出来让我选」。
- 「重点标出哪些资源走私有终结点、哪些暴露在公网」。

生成的 Markdown 可以直接放进仓库的文档目录，GitHub 等平台能直接渲染其中的 Mermaid 图。

## 适合谁 / 局限

适合接手存量环境的工程师、写架构文档和做安全评审前想先有一张全景图的人。局限：图是按资源配置推断的关系，应用层面的调用（比如代码里写死的某个接口地址）它看不到；资源很多的资源组画出来会很拥挤，需要你要求按层或按子系统拆开；它反映的是查询那一刻的状态，环境变了要重新生成。

## 注意事项

- **许可**：MIT。
- **只读操作**：流程里是查询和写本地 Markdown 文件，不修改云资源；用只读权限（如读取者角色）的身份登录就够了。
- **输出里有资源名称、网络结构等内部信息**，对外分享前先脱敏。
- 资源配置会进入模型上下文，涉及敏感环境时按公司的规定处理。
