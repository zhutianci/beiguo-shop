---
title: "Agent Skills 是什么：agentskills.io 开放标准与 SKILL.md 规范（哪些工具支持、怎么校验）"
slug: agent-skills-open-standard-spec
name: Agent Skills 开放标准（agentskills.io）
url: https://agentskills.io/
pricing: 开源免费（代码 Apache-2.0，文档 CC-BY-4.0）
platforms: Claude / Claude Code / ChatGPT 与 Codex / Cursor / GitHub Copilot / Gemini CLI 等
trialNote: "标准本身不用安装；校验自己写的技能用 `skills-ref validate ./my-skill`"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, ai-agent, coding]
excerpt: "Agent Skills 是由 Anthropic 提出并开放的技能格式标准：一个文件夹加一份 SKILL.md。agentskills.io 提供规范、教程和支持该标准的工具清单，Claude、Codex、Cursor、Copilot、Gemini CLI 等都已支持。"
checkedOn: 2026-10-10
sources:
  - https://agentskills.io/home
  - https://agentskills.io/specification
  - https://github.com/agentskills/agentskills
  - https://code.claude.com/docs/en/skills
  - https://learn.chatgpt.com/docs/build-skills
---

> 本文根据 agentskills.io 官方站点、规范文档和 agentskills/agentskills 仓库整理，资料核对于 2026-10-10。规范仍在演进，以官方规范页为准。

## 是什么

逛 Skill 库之前，先弄清「一个 Skill 到底长什么样」会省很多事。Agent Skills 是一套**开放格式**：一个技能就是一个文件夹，里面必须有一份 `SKILL.md`，开头用 YAML 写元数据（至少有 `name` 和 `description`），正文用 Markdown 写给智能体看的操作说明；文件夹里还可以带 `scripts/`（可执行脚本）、`references/`（参考文档）、`assets/`（模板和资源）。

官网说明，这个格式最初由 Anthropic 开发，随后作为开放标准发布，现在由社区在 agentskills/agentskills 仓库里共同维护，接受生态各方贡献。正因为有这份标准，同一个技能文件夹才能在不同厂商的智能体里通用——本目录里绝大多数 Skill 库都是按它写的。

截至 2026-10-10，GitHub 显示规范仓库约 2.6 万 Star、2,000 Fork，最近一次推送在 2026-08-09。

## 包含哪些 Skill

这个仓库不提供成品技能，提供的是**规范和工具**：

- **规范（Specification）**：规定目录结构和 `SKILL.md` 的字段。`name` 必填，最长 64 个字符，只能用小写字母、数字和连字符，且要和文件夹同名；`description` 必填，最长 1024 个字符，要写清「做什么」和「什么时候用」；可选字段有 `license`、`compatibility`（运行环境要求）、`metadata` 和实验性的 `allowed-tools`。
- **渐进式加载的约定**：启动时只读每个技能的名称和描述（约 100 个 token）；任务匹配时才加载 `SKILL.md` 全文（建议不超过 5000 个 token、500 行）；脚本和参考文件按需再读。所以装很多技能也不会把上下文塞满。
- **skills-ref**：参考实现库，可以校验一个技能是否符合规范。
- **文档站**：快速上手、技能写作指南，以及支持该标准的客户端清单。
- 成品示例指向 anthropics/skills 仓库。

官网列出的支持方（部分）：Claude Code、Claude、ChatGPT 与 Codex、Cursor、GitHub Copilot、VS Code、Gemini CLI、OpenCode、Goose、Amp、Kiro、TRAE、Roo Code、Junie、Factory、OpenHands、Hermes Agent、OpenClaw、Mistral Vibe 等数十个。

## 怎么安装

标准本身不用安装，照着写就行。校验自己写的技能用规范页给出的命令：

```bash
skills-ref validate ./my-skill
```

它会检查 `SKILL.md` 的元数据是否合法、命名是否符合约定。`skills-ref` 的获取方式见仓库里的 skills-ref 目录。

技能写好后放到哪里，取决于你用的智能体，各家文档给出的位置不同：

- Claude Code：`~/.claude/skills/<技能名>/`（个人）或项目里的 `.claude/skills/<技能名>/`；
- Codex：仓库内 `.agents/skills`，或用户级 `$HOME/.agents/skills`；
- 其他工具见 agentskills.io 的客户端清单，每个条目都链接到对应产品的技能文档。

## 怎么用

- **写一个最小技能**：新建文件夹 `weekly-report/`，在里面的 `SKILL.md` 开头写上 `name: weekly-report` 和一句描述，正文写步骤；放进上面的目录后，对智能体说「帮我写本周周报」，描述匹配时它就会加载。
- **判断一个第三方技能写得好不好**：看 `description` 是否具体、`SKILL.md` 是否短而清楚、长资料是否拆到 `references/`、脚本是否说明了依赖——这些都是规范里的建议。
- **检查兼容性**：技能如果写了 `compatibility` 字段，会说明它面向哪个产品、需要哪些系统依赖或联网权限，装之前先看一眼。

## 适合谁 / 不适合谁

**适合：**
- 准备自己写技能、或要在团队里统一技能写法的人；
- 想知道「这个技能能不能在我的工具里用」的用户；
- 做智能体产品、要接入技能支持的开发者。

**不适合：**
- 只想找现成技能直接用的人——去看官方技能仓库和各类技能目录更快；
- 期待标准解决一切兼容问题的人——各家在标准之上有自己的扩展字段和目录位置。

## 注意事项

- **许可证**：仓库代码 Apache-2.0，文档 CC-BY-4.0。
- **各家有扩展**：例如 Claude Code 文档说明它在标准之上加了调用控制、子智能体执行等字段；而在 claude.ai 上传或走 Skills API 时只接受标准里的那几个字段，多写会报错。跨工具分发的技能尽量只用标准字段。
- **标准不管安全**：规范只定义格式，不审核内容。技能可以带脚本，`allowed-tools` 还能预先授权工具，第三方技能安装前仍要自己通读。
- **维护状态**：仓库最近一次推送在 2026-08-09，更新节奏比技能仓库慢，属于正常的规范维护节奏。
