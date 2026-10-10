---
title: "claude-api skill 是什么、怎么用：Anthropic 官方的 Claude API / SDK 参考 Skill（模型 ID、工具调用、缓存、迁移）"
slug: anthropic-claude-api-skill
name: claude-api（anthropics/skills）
url: https://github.com/anthropics/skills/tree/main/skills/claude-api
pricing: "免费（Apache-2.0，见技能目录内 LICENSE.txt）"
platforms: "Claude Code / claude.ai / Claude API"
trialNote: "`/plugin marketplace add anthropics/skills` 然后 `/plugin install claude-api@anthropic-agent-skills`"
products: [claude]
models: [claude-llm]
topics: [agent-skills, coding, ai-agent]
excerpt: "claude-api 是 Anthropic 官方的 Claude API 开发参考 Skill：按项目语言加载对应的 SDK 资料，覆盖模型 ID、流式输出、工具调用、MCP、智能体、提示词缓存与模型迁移，避免模型凭过时记忆写代码。"
checkedOn: 2026-10-11
sources:
  - https://github.com/anthropics/skills/tree/main/skills/claude-api
  - https://github.com/anthropics/skills
  - https://github.com/anthropics/skills/blob/main/.claude-plugin/marketplace.json
  - https://code.claude.com/docs/en/skills
---

> 本文根据 anthropics/skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 7.0 万次；所在仓库 anthropics/skills 在 GitHub 约 18.0 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

大模型写「调用大模型」的代码时有个老毛病：凭训练时的旧记忆写，模型 ID 过期、参数名不对、新功能不知道。claude-api 技能就是给 Claude 自己准备的一份最新 API 参考。`description` 概括的内容包括模型 ID、定价、参数、流式输出、工具调用、MCP、智能体、缓存、token 计数和模型迁移。

它的触发条件写得相当激进：提示里以任何形式出现 Claude / Anthropic（包括各模型名、SDK 包名）；用户问到大模型的价格、选型、限制、缓存；或者任务明显是「大模型形态」的而没有指定供应商（做智能体、定义工具、RAG、让模型做摘要分类等），都应在打开目标文件之前先读它。唯一的跳过条件是当前在处理别家供应商：查询里点名了 OpenAI、Gemini 等，或项目里已经在用它们的 SDK。技能开头还有一道检查——发现目标文件用的是非 Anthropic 的 SDK，就停下来问你，而不是擅自改写。

内容组织上，SKILL.md 给出总览（该用哪种接入方式、要不要做成智能体、当前模型列表、鉴权、思考与缓存等速查），再按检测到的项目语言去读对应目录下的资料。

## 怎么安装

`claude-api` 在 anthropics/skills 仓库里单独打成一个同名插件。在 Claude Code 会话中输入：

```text
/plugin marketplace add anthropics/skills
/plugin install claude-api@anthropic-agent-skills
```

Claude Code 官方文档列出的内置技能（Bundled skills）里已经有 `/claude-api`，在 Claude Code 里输入 `/skills` 能看到它就不必再装；仓库里的这份主要方便查看内容，或给其他环境使用。

仓库整体介绍和其他安装方式，详见本站《anthropics/skills 是什么、怎么安装：Anthropic 官方 Skills 仓库（docx / pptx / xlsx / pdf、skill-creator）》。

## 怎么用

- 「用 Python 写一个调用 Claude 的客服问答接口，开流式输出和提示词缓存」。
- 「把这个项目从旧的模型 ID 迁移到当前最新的模型」——对应文档里列出的迁移类子命令。
- 「我该直接调 Messages API，还是用 Agent SDK / Managed Agents？」——它会按文档里的选型说明回答。

目录里文件很多（近百个），按语言分成 Python、TypeScript、Go、Java、C#、PHP、Ruby、curl 等子目录，各含流式、工具调用、文件 API、批处理等专题。

## 适合谁 / 局限

适合基于 Claude API 做应用的开发者，以及想让编程智能体写 Anthropic SDK 代码时少出错的人。它只管 Anthropic 一家的接口；SKILL.md 很长，加载一次会占用不少上下文；里面的模型列表标了缓存日期，最终仍以官方 API 文档为准。

## 注意事项

- **许可**：技能目录内的 LICENSE.txt 为 Apache-2.0。
- **API Key**：写出的代码需要你自己的 Anthropic API Key，按用量付费，与 Claude 订阅是两套计费；密钥放环境变量，不要写进仓库。
- **价格与模型以官方为准**：技能里的定价和模型信息会滞后，本文不转述具体数字。
- **不执行脚本**：全部是参考资料。
