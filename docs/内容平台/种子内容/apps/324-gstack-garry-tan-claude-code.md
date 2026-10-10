---
title: "gstack 是什么、怎么安装和使用：YC 总裁 Garry Tan 的 Claude Code Skills 工作流"
slug: gstack-garry-tan-claude-code
name: gstack（garrytan/gstack）
url: https://github.com/garrytan/gstack
pricing: 开源免费（MIT）
platforms: Claude Code（默认）；Codex、Cursor、OpenClaw 等通过 --host 安装
trialNote: "git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack && cd ~/.claude/skills/gstack && ./setup"
products: [claude, codex]
models: [claude-llm]
topics: [agent-skills, coding, ai-agent]
excerpt: "gstack 是 Y Combinator 总裁 Garry Tan 开源的 Claude Code 技能栈：把 CEO、工程经理、设计师、评审、QA、安全官、发布工程师做成一组斜杠命令，按「思考、计划、构建、评审、测试、发布、复盘」的冲刺顺序衔接。"
checkedOn: 2026-10-10
sources:
  - https://github.com/garrytan/gstack
  - https://code.claude.com/docs/en/skills
---

> 本文根据 garrytan/gstack 仓库 README 和 Claude Code 官方文档整理，资料核对于 2026-10-10。gstack 更新非常频繁，技能清单和安装要求以仓库 README 为准。

## 是什么

gstack 的作者是 Garry Tan，Y Combinator 的总裁兼 CEO。他在 README 里说，这是他自己每天在用的「开源软件工厂」：把 Claude Code 变成一支虚拟工程团队——重新思考产品的 CEO、锁定架构的工程经理、挑出「AI 味」设计的设计师、找线上隐患的评审、打开真实浏览器测试的 QA、做安全审计的安全官、负责发 PR 的发布工程师。全部是斜杠命令，全部是 Markdown。

README 强调 **gstack 是一套流程而不是工具合集**：技能按一次冲刺的顺序运行，前一步的产出是后一步的输入，例如 `/office-hours` 写出的设计文档会被 `/plan-ceo-review` 读取，`/plan-eng-review` 写的测试计划由 `/qa` 接手。

截至 2026-10-10，GitHub 显示该仓库约 13.6 万 Star、2.0 万 Fork，最近一次推送在 2026-10-09。README 里作者关于个人产出效率的数字属于自述，这里不作引用。

## 包含哪些 Skill

README 的说法是 23 个「专家」加 8 个辅助工具，按冲刺阶段排列（节选）：

- **思考**：`/office-hours`——从这里开始。用六个追问重新审视你要做的产品，产出设计文档；
- **计划**：`/plan-ceo-review`（从创始人角度重新想问题，可扩展或收缩范围）、`/plan-eng-review`（锁定架构、数据流、边界情况和测试）、`/plan-design-review`（给每个设计维度打分并改进计划）、`/plan-devex-review`、`/autoplan`；
- **设计**：`/design-consultation`（从零建立设计系统，写出 `DESIGN.md`）、`/design-shotgun`（一次出多个方案对比）、`/design-html`、`/design-review`；
- **评审与调试**：`/review`（找「能过 CI 但上线会出事」的问题）、`/investigate`（系统化找根因，三次修复失败就停）、`/test-audit`、`/codex`（让 Codex CLI 给出独立的第二意见）；
- **测试**：`/qa`（在浏览器、API、命令行里实际操作，复现问题、写回归测试、修复后再验证）、`/qa-only`（只报告不改代码）、`/browse`；
- **安全**：`/cso`（带应用模型的安全审计）；
- **发布**：`/ship`（同步主干、跑测试、开 PR）、`/land-and-deploy`（合并、等 CI 和部署、验证线上健康）、`/canary`（上线后监控）、`/document-release`；
- **复盘**：`/retro`、`/learn`；
- **安全护栏**：`/careful`（执行 `rm -rf`、强推等危险命令前警告）、`/freeze`（把可编辑范围锁在一个目录）、`/guard`（两者合一）。

## 怎么安装

环境要求（README）：Claude Code、Git、Bun v1.4.2 以上，Windows 还需要 Node.js。

**Claude Code**：README 的做法是打开 Claude Code，把下面这段话贴给它，由它完成克隆和设置：

```bash
git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack && cd ~/.claude/skills/gstack && ./setup
```

README 还让 Claude 在 `CLAUDE.md` 里加一段 gstack 说明并列出可用技能。`./setup` 会编译工具并下载一个 Chromium 浏览器，网络慢时耗时更长。

**其他智能体**（Codex、Cursor、OpenClaw 等）：

```bash
git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/gstack
cd ~/gstack && ./setup --host auto      # or: ./setup --host codex
./setup --status                         # one row per install: host, tier, scope, version, path
```

`--host auto` 给本机检测到的每个智能体都安装。README 把各工具的支持分成 full（经完整流程验证）、experimental（实验性）、instruction-only（只给出要复制的内容）三档。README 没有提供 claude.ai 网页版的安装方式。升级用 `/gstack-upgrade`，卸载按 README 的 Uninstall 一节。

## 怎么用

README 的快速上手建议是只做这几步，就能判断它适不适合你：

- **`/office-hours`**：描述你要做的东西。它会像创业辅导那样追问，挑战你的前提，最后写出一份设计文档。
- **`/plan-ceo-review`**：对任何一个功能想法运行，它会判断该扩大、保持还是缩减范围。
- **`/review`**：在有改动的分支上运行，它会找出隐患，明显的问题自动修掉。
- **`/qa`**：给它预发环境的地址（或本地的 API、命令行工具），它会打开浏览器实际点一遍，把发现的问题写成会失败的回归测试再修复。

做线上相关操作前，可以先说「be careful」或输入 `/guard` 打开护栏。

## 适合谁 / 不适合谁

**适合（README 自己列的三类）：**
- 创始人和 CEO，尤其是还想亲手发布产品的技术型创始人；
- 第一次用 Claude Code 的人——有现成的角色和流程，不用面对空白输入框；
- 技术负责人——想在每个 PR 上都有严格的评审、QA 和发布自动化。

**不适合：**
- 想要轻量、少依赖的人：它需要 Bun、会编译二进制、下载浏览器，体量明显大于纯 Markdown 的技能库；
- 不做 Web 产品的项目，很多技能围绕浏览器和线上部署；
- 已经装了 Superpowers、ECC 等流程框架的仓库。

## 注意事项

- **许可证**：MIT。
- **维护状态**：非常活跃（最近推送 2026-10-09），版本号迭代极快，旧教程里的命令可能已变。
- **它不只是 Markdown**：安装会执行 `./setup` 脚本、编译工具、启动浏览器守护进程。运行前先看一遍脚本，并从作者本人的仓库克隆。
- **浏览器与登录态**：部分技能可以导入你浏览器里的 Cookie，或在 macOS 上直接驱动带有你真实登录会话的浏览器；`/pair-agent` 还会开隧道把浏览器共享给远程智能体。涉及公司后台、支付等账号时要格外小心，自动化访问第三方网站也要遵守对方的服务条款。
- **遥测**：README 写明使用统计默认关闭、需要你明确同意才发送，内容是技能名、耗时、成功与否、版本和操作系统，不含代码和提示词；可用 `gstack-config set telemetry off` 关闭。
- **会改你的 CLAUDE.md 和仓库**：团队模式会往仓库提交引导文件，先和同事确认。
