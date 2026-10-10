---
title: "mcp-builder skill 是什么、怎么安装使用：Anthropic 官方的 MCP 服务器开发 Skill（Python / TypeScript）"
slug: anthropic-mcp-builder-skill
name: mcp-builder（anthropics/skills）
url: https://github.com/anthropics/skills/tree/main/skills/mcp-builder
pricing: "免费（Apache-2.0，见技能目录内 LICENSE.txt）"
platforms: "Claude Code / claude.ai / Claude API"
trialNote: "`/plugin marketplace add anthropics/skills` 然后 `/plugin install example-skills@anthropic-agent-skills`"
products: [claude]
models: [claude-llm]
topics: [agent-skills, coding, ai-agent]
excerpt: "mcp-builder 是 anthropics/skills 里指导编写 MCP 服务器的 Skill：按「调研规划 → 实现 → 评审测试 → 编写评测」四个阶段推进，附 Python（FastMCP）与 TypeScript SDK 的实现指南和评测脚本。"
checkedOn: 2026-10-11
sources:
  - https://github.com/anthropics/skills/tree/main/skills/mcp-builder
  - https://github.com/anthropics/skills
  - https://github.com/anthropics/skills/blob/main/.claude-plugin/marketplace.json
  - https://code.claude.com/docs/en/skills
---

> 本文根据 anthropics/skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 12.5 万次；所在仓库 anthropics/skills 在 GitHub 约 18.0 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

MCP（Model Context Protocol）服务器的作用是把外部服务包装成大模型可以调用的工具。写一个能跑的 MCP 服务器不难，写一个让模型真的用得顺手的却有讲究：工具怎么命名、返回多少内容、报错信息怎么写才能让模型自己纠正。mcp-builder 把这些经验整理成了开发指南。按 `description`，要构建 MCP 服务器来接入外部 API 或服务时使用，Python（FastMCP）和 Node / TypeScript（MCP SDK）两条路线都覆盖。

流程分四个阶段：**深入调研与规划**（理解现代 MCP 的设计取舍，例如是完整覆盖 API 端点还是提供更高层的工作流工具；读协议文档和 SDK 文档；研究目标 API）、**实现**、**评审与测试**、**编写评测**（准备一组真实而有难度的问题，检验模型能否借助你的服务器答对）。它强调衡量服务器质量的标准是「模型能否用它完成真实任务」。

## 怎么安装

`mcp-builder` 收在 anthropics/skills 仓库的 example-skills 插件包里。在 Claude Code 会话中依次输入（命令来自仓库 README）：

```text
/plugin marketplace add anthropics/skills
/plugin install example-skills@anthropic-agent-skills
```

同一个包里的其他示例技能会一起装上。只想要这一个，可以把仓库里的 `skills/mcp-builder` 文件夹复制到 `~/.claude/skills/`（个人）或项目的 `.claude/skills/`；claude.ai 网页版则在 Customize → Skills 里上传这个文件夹的 ZIP。

仓库整体介绍和其他安装方式，详见本站《anthropics/skills 是什么、怎么安装：Anthropic 官方 Skills 仓库（docx / pptx / xlsx / pdf、skill-creator）》。

## 怎么用

- 「帮我给公司内部的工单系统 REST API 写一个 MCP 服务器，用 TypeScript」——它会先读协议与 SDK 文档、梳理要暴露哪些工具，再开始写。
- 「评审一下我这个 MCP 服务器的工具设计，哪些地方模型会用错」。
- 「给这个服务器写 10 条评测问题并跑一遍」。

`reference/` 下有四份按需加载的资料：MCP 最佳实践、Python 实现指南、Node 实现指南、评测指南；`scripts/` 里是评测脚本及其依赖清单。

## 适合谁 / 局限

适合要把内部系统或第三方 API 接给 Claude、Cursor 等客户端的开发者，尤其是第一次写 MCP 服务器、想少走弯路的人。它是开发方法指南，不是脚手架：不会一键生成项目，鉴权、部署、权限控制仍要你自己决定；协议和 SDK 更新较快，技能会让 Claude 去读最新文档，所以需要能联网。

## 注意事项

- **许可**：技能目录内的 LICENSE.txt 为 Apache-2.0。
- **联网与密钥**：调研阶段会抓取协议和 SDK 文档；测试你的服务器时需要目标服务的 API Key，放在环境变量里，不要写进代码或对话。
- **评测脚本会调用模型**：跑评测按 API 用量计费。
- 把自己写的 MCP 服务器接到智能体之前，先确认它暴露的工具不会越权读写数据。
