---
title: "alirezarezvani/claude-skills 是什么、怎么安装：近 400 个技能、按岗位分包的 Claude Code 技能库"
slug: alirezarezvani-claude-skills-library
name: alirezarezvani/claude-skills
url: https://github.com/alirezarezvani/claude-skills
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Gemini CLI / Cursor / OpenClaw / Windsurf / OpenCode 等 13 种"
trialNote: "`/plugin marketplace add alirezarezvani/claude-skills` 然后 `/plugin install engineering-skills@claude-code-skills`"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding, marketing]
excerpt: "alirezarezvani/claude-skills 是一个按领域分包的大型技能库：工程、产品、营销、合规、高管顾问、财务等十多个插件包，README 称共 388 个技能并附 700 多个纯标准库 Python 脚本，支持 13 种编程智能体。"
checkedOn: 2026-10-11
sources:
  - https://github.com/alirezarezvani/claude-skills
  - https://code.claude.com/docs/en/discover-plugins
  - https://agentskills.io/home
---

> 本文根据 alirezarezvani/claude-skills 仓库 README 与 Claude Code 官方文档整理，资料核对于 2026-10-11。技能数量随版本变化，以仓库 README 为准。

## 是什么

alirezarezvani/claude-skills 是个人开发者 Alireza Rezvani 维护的一个大型技能库，特点是「按岗位打包」：不是把几百个技能一股脑塞给你，而是分成工程、产品、营销、合规质量、项目管理、高管顾问、业务增长、财务等十多个插件包，按需安装。README 的自述是 388 个可用于生产的技能，覆盖 13 种编程工具。

每个技能除了 `SKILL.md`，很多还带 Python 命令行脚本。README 称脚本共 706 个，并强调全部只用标准库、不需要 pip 安装任何依赖——这一点降低了运行第三方脚本时最常见的供应链风险，但脚本本身做什么仍然要自己看。

截至 2026-10-11，GitHub 显示该仓库约 2.8 万 Star、3924 Fork，最近一次推送在 2026-08-30。

## 包含哪些 Skill

以 README 的安装清单为准，主要插件包和它标注的规模：

- `engineering-skills`：24 个核心工程技能；`engineering-advanced-skills`：25 个进阶技能；
- `product-skills`：12 个产品技能；`pm-skills`：6 个项目管理技能；
- `marketing-skills`：43 个营销技能（含面向大模型引用的 AEO 优化）；
- `ra-qm-skills`：12 个法规与质量管理技能；
- `c-level-skills`：28 个高管顾问技能（CFO、CMO、CISO 等角色视角）；
- `business-growth-skills`、`finance-skills`：业务增长与财务；
- 单独的工具型插件：`skill-security-auditor`（技能安全扫描）、`playwright-pro`（Playwright 测试）、`self-improving-agent`（记忆整理）、`content-creator` 等。

README 还介绍了效率类（收件、邮件、周回顾、深度工作、会议）和一套学术研究技能。

## 怎么安装

**Claude Code**（命令来自 README）：

```text
/plugin marketplace add alirezarezvani/claude-skills
/plugin install engineering-skills@claude-code-skills
/plugin install marketing-skills@claude-code-skills
```

市场名是 `claude-code-skills`，把 `@` 前面换成上面任意一个插件包名即可。

**Codex**：

```bash
npx agent-skills-cli add alirezarezvani/claude-skills --agent codex
```

也可以克隆仓库后运行 `./scripts/codex-install.sh`。**手动**：把任意技能文件夹复制到 `~/.claude/skills/`。Gemini CLI、OpenClaw、Hermes Agent、Mistral Vibe 等各有安装脚本，见 README。

## 怎么用

装好对应的包之后直接描述任务，技能按内容触发。README 给的例子有三类：

- 架构评审：让它用工程包里的技能评审一个服务的设计；
- 内容创作：用营销包做品牌语气分析、写内容；
- 合规审计：用法规质量包对照标准做检查。

带脚本的技能会运行各自的 Python 工具，例如 SaaS 指标体检、品牌语气分析。

## 适合谁 / 不适合谁

**适合：**
- 想一次补齐某个岗位方向一整组技能的人，比如独立开发者同时要管营销和财务；
- 想参考「技能 + 脚本」这种写法的技能作者；
- 同时用多种编程智能体的团队。

**不适合：**
- 只想要少数几个久经考验的技能的人——这里数量大，质量参差在所难免，逐个筛选要花时间；
- 把「高管顾问」「合规」类技能当专业意见用的场景，它们只是结构化的思考框架。

## 注意事项

- **许可证**：MIT，仓库根目录有 LICENSE。
- **维护状态**：最近推送 2026-08-30，相对上面那些每天更新的库节奏慢一些；README 里写的 Star 数已明显滞后于 GitHub 实际数字。
- **按包安装**：一次全装会让技能列表很长，占用上下文并可能互相抢触发，建议只装用得上的包。
- **安全**：技能会执行 Python 脚本。README 自带 `skill-security-auditor` 可用来扫描技能，装之前也可以用本站介绍过的 SkillSpector 再查一遍；Claude Code 以外工具的安装方式里有「下载脚本并执行」的写法，先看脚本内容再运行。
- 合规、财务、法律相关技能的输出不能替代专业人士的判断。
