---
title: "ECC（Everything Claude Code）是什么、怎么安装和使用：300 个 Skills 加子智能体、Hooks 的全家桶"
slug: ecc-everything-claude-code
name: ECC（Everything Claude Code）
url: https://github.com/affaan-m/ECC
pricing: 开源免费（MIT）
platforms: Claude Code / Codex / Kimi Code；Cursor、OpenCode、Copilot、Gemini CLI 等为功能受限的适配
trialNote: "npx ecc-universal@2.2.3 setup"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding, ai-agent]
excerpt: "ECC（常被称作 Everything Claude Code）是 Affaan Mustafa 开源的智能体工程体系：约 300 个 Skills、71 个子智能体，加上 Hooks、规则、记忆和安全扫描，把「计划、测试、实现、评审、验证」固化下来。以 Claude Code 为主，也支持 Codex。"
checkedOn: 2026-10-10
sources:
  - https://github.com/affaan-m/ECC
  - https://ecc.tools
  - https://code.claude.com/docs/en/discover-plugins
  - https://learn.chatgpt.com/docs/plugins
---

> 本文根据 affaan-m/ECC 仓库 README 和 Claude Code 官方文档整理，资料核对于 2026-10-10。ECC 版本迭代很快，安装命令里的版本号以 README 为准。

## 是什么

ECC 是 Affaan Mustafa 维护的开源项目，中文社区里更常听到的名字是 Everything Claude Code（搜索时两个叫法都在用，仓库现名 affaan-m/ECC）。它的定位不是一组技能，而是一整套「智能体工程系统」：让编程智能体先计划再动手、用测试验证改动、换一个干净的上下文评审自己的成果、记住重要的东西，并把反复成功的做法沉淀成可复用的技能。README 用一行流程概括：

```text
plan -> test -> implement -> review -> verify -> remember -> improve
```

作者在 README 里介绍，这套配置来自他长期使用 Claude Code 的积累，并在 2025 年 9 月的一场 Anthropic 相关黑客松中获奖。截至 2026-10-10，GitHub 显示该仓库约 27.6 万 Star、4.1 万 Fork，最近一次推送在 2026-10-10。

## 包含哪些 Skill

README 给出的规模（不同段落的数字略有出入，约 300 个技能）：

- **Skills（约 300 个）**：覆盖 TDD、调研、安全、文档、前端、数据、机器学习、运维等。最核心的是 `tdd-workflow`，以及计划、代码评审、构建修复、重构清理、会话保存与恢复等流程技能。
- **子智能体（71 个）**：如 planner（规划）、architect（架构）、tdd-guide、code-reviewer、security-reviewer、build-error-resolver、e2e-runner 等，供主会话委派任务。
- **命令（90 多个）**：斜杠命令入口。README 说明项目正在转向「以技能为主」，命令作为便捷入口和兼容层保留。
- **Hooks 与记忆**：会话摘要、持续学习（把会话里积累的经验沉淀成「instincts」）、上下文预算控制、在执行危险 shell 命令前拦截的 GateGuard。
- **Rules**：按语言或项目选择加载的编码规范。
- **AgentShield**：扫描你自己的智能体配置（提示词、Hooks、MCP 配置、权限、密钥）的安全工具。

## 怎么安装

需要 Node.js 18 以上；装 Claude 插件还需要 Git 和 Claude Code 2.1 以上。命令均来自 README。

**推荐：引导式安装**（会检查已有安装并让你选择范围和 Hook 档位）：

```bash
npx ecc-universal@2.2.3 setup
```

**Claude Code 原生插件命令**（在会话里输入，装到这一步就够了）：

```text
/plugin marketplace add https://github.com/affaan-m/ECC
/plugin install ecc@ecc
```

**Codex**（终端里运行）：

```bash
codex plugin marketplace add affaan-m/ECC
codex plugin add ecc@ecc
```

README 反复强调：**每种工具只选一种安装方式，不要叠加**。同一个工具里装两遍会让技能、命令、Hooks 重复；已经装乱了就按 README 的 Reset / Uninstall 一节清理。Claude Code 的插件不能分发 rules，需要的规范包要另外按 README 添加。Cursor、Gemini CLI、Zed 等通过仓库里的 `install.sh --profile minimal --target …` 安装项目级适配，功能不完整。README 没有提供 claude.ai 网页版的安装方式。

## 怎么用

README 的建议是「从你要做的事开始，而不是从整个目录开始」：

- **做新功能**：输入 `/ecc:plan "Add authentication"`（插件安装时命令带 `ecc:` 前缀），它会调用 planner 子智能体出计划；确认后用 `tdd-workflow` 先写失败的测试再实现。
- **评审与修复**：`/code-review` 用全新的上下文评审刚写的代码；构建挂了用 `/build-fix`；清理代码用 `/refactor-clean`。
- **长会话管理**：`/context-budget` 查看上下文压力；结束前 `/save-session`，下次 `/resume-session` 接着做。
- **调整配置**：装好后用 `/ecc:configure-ecc` 重新选择组件和 Hook 档位。

## 适合谁 / 不适合谁

**适合：**
- 重度使用 Claude Code、想要一份拿来就能用的完整工程配置的开发者；
- 想研究「技能 + 子智能体 + Hooks + 记忆」怎么协同的人——它是很好的参考实现；
- 需要跨多个工具共享流程和上下文的团队。

**不适合：**
- 刚上手的新手——组件太多，出问题时很难判断是哪一层造成的；
- 在意上下文占用的场景：README 自己也提醒，插件会把已装的技能目录告诉模型，在意占用时应改用选择性安装；
- 已经装了 Superpowers、gstack 等同类流程框架的项目——Hooks 和流程容易冲突。

## 注意事项

- **许可证**：MIT。
- **维护状态**：非常活跃（最近推送 2026-10-10），版本更新频繁，文档里的技能数量和命令会变。
- **只从官方渠道安装**：README 顶部有醒目警告——只认 GitHub 仓库 affaan-m/ECC、npm 包 `ecc-universal` 与 `ecc-agentshield`、插件标识 `ecc@ecc` 和官网 ecc.tools；第三方转载和非官方镜像可能含恶意代码。
- **它会运行 Hooks 和 MCP**：README 明确说 Hooks 能执行 shell 命令、MCP 服务器可能持有凭据，要把它们当作「可执行的配置」对待。安装前在 `/plugin` 详情里看清它会装什么，敏感项目先选较保守的 Hook 档位。
- **平台差异**：核心功能支持 Windows、macOS、Linux，但 README 列出了原生 Windows 下持续学习等功能的已知缺陷；Codex 之外的其他工具属于 beta 或实验性适配，不要默认功能齐全。
- **上下文成本**：技能多不等于效果好，按需启用，不用的规则和 MCP 及时关掉。
