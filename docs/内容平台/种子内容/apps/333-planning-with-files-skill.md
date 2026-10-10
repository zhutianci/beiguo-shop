---
title: "planning-with-files 是什么、怎么安装和使用：把计划写进文件、/clear 后不丢的规划 Skill"
slug: planning-with-files-skill
name: planning-with-files
url: https://github.com/OthmanAdi/planning-with-files
pricing: 开源免费（MIT）
platforms: Claude Code / Codex CLI / Cursor / Copilot / Kiro / OpenCode / Pi / Hermes Agent 等 60 多种
trialNote: "npx skills add OthmanAdi/planning-with-files --skill planning-with-files -g"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding, ai-agent]
excerpt: "planning-with-files 是一个持久化规划 Skill：把任务计划、调研发现和进度分别写进 task_plan.md、findings.md、progress.md 三个文件，并用 Hooks 每轮重新注入，让智能体在 /clear、上下文压缩或崩溃后还能从当前阶段接着做。"
checkedOn: 2026-10-10
sources:
  - https://github.com/OthmanAdi/planning-with-files
  - https://github.com/OthmanAdi/planning-with-files/blob/master/docs/installation.md
  - https://code.claude.com/docs/en/discover-plugins
  - https://agentskills.io/home
---

> 本文根据 OthmanAdi/planning-with-files 仓库 README 和 Claude Code 官方文档整理，资料核对于 2026-10-10。README 里的效果对比来自项目自己的测量，本文不作为结论引用。

## 是什么

编程智能体跑长任务时最常见的事故是「失忆」：上下文窗口被 `/clear`、自动压缩或一次崩溃清空，它就忘了做到哪一步，甚至忘了目标是什么。planning-with-files 的思路很朴素，README 用一句话概括——**上下文窗口是内存（易失、有限），文件系统是硬盘（持久、无限），重要的东西都写到硬盘上**。README 说明这个模式参考了 Manus 公开描述过的做法：用 Markdown 文件当作磁盘上的「工作记忆」。

和多数智能体自带的待办清单不同（那份清单活在上下文里），它把计划放在项目目录的文件里，并通过生命周期 Hooks 在每一轮把计划重新注入，所以它自称「智能体没法无视的规划技能」。

截至 2026-10-10，GitHub 显示该仓库约 2.7 万 Star、2,300 Fork，最近一次推送在 2026-10-06。

## 包含哪些 Skill

核心是一个技能 `planning-with-files`，围绕三个文件工作：

- `task_plan.md`：阶段和勾选框，是 `/clear` 之后的恢复点；
- `findings.md`：调研笔记和决策，边做边追加；
- `progress.md`：会话日志和测试结果。

并行任务会改用独立目录 `.planning/日期-名称/`，里面是同样的三个文件。这些文件是纯 Markdown，默认被 gitignore。

技能给智能体定的几条规矩（README 的 Key Rules）：没有 `task_plan.md` 不开工；每做两次查看或浏览操作就保存一次发现；所有错误都记录；不重复失败过的做法。

仓库还提供：

- **本地化版本**：`planning-with-files-zh`（简体中文）以及阿拉伯语、德语、西班牙语等版本；
- **斜杠命令**（Claude Code 插件方式才有）：`/plan` 或 `/pwf` 创建三个文件并开始，`/status` 一眼看当前阶段，`/plan-doctor` 自检 Hook 是否真的在工作；
- **长任务保护（可选）**：门控模式下，还有阶段未完成时不让智能体提前宣布「做完了」；对计划内容做 SHA-256 校验，被意外改写时拒绝注入并提示。

## 怎么安装

命令均来自 README。

**Claude Code 插件方式**（技能、Hooks、斜杠命令全都带上）：

```text
/plugin marketplace add OthmanAdi/planning-with-files
/plugin install planning-with-files@planning-with-files
```

**其他智能体，一条命令**（通过 Agent Skills 标准装到 60 多种智能体）：

```bash
npx skills add OthmanAdi/planning-with-files --skill planning-with-files -g
```

想用简体中文版，把技能名换成 `planning-with-files-zh`：

```bash
npx skills add OthmanAdi/planning-with-files --skill planning-with-files-zh -g
```

**Pi**：`pi install npm:planning-with-files`。Hermes Agent、OpenCode 等有各自的原生插件，命令见 README。README 没有提供 claude.ai 网页版的安装方式。

README 特别提醒两种方式的差别：`npx skills add` 只带技能、脚本和模板，Hooks 依赖技能元数据里的声明，可能因为没接受项目信任等原因**悄悄不生效**；而 Hooks 正是它区别于普通规划提示词的关键。在意这一点就用插件方式，并用 `/plan-doctor` 验证。

## 怎么用

- **开始一个多步骤任务**：输入 `/plan`（插件方式），或直接说「plan this task」。它会先创建三个文件、写下阶段，再开始干活；遇到多步骤任务时技能也会自己触发。
- **中途清空上下文**：放心输入 `/clear`。下一轮 Hooks 会从项目文件里读回当前计划，智能体从正在进行的阶段继续，而不是从头摸索。
- **配合 Claude Code 的计划模式**：README 说二者是前后两个阶段——先在计划模式里设计并批准方案，然后让智能体把方案按阶段写进 `task_plan.md`，再切回正常模式执行。
- **任务结束后**：三个文件是「工作记忆」，不会自动归档，下个任务会覆盖。值得保留的结论要自己挪进代码、提交信息或文档。

## 适合谁 / 不适合谁

**适合：**
- 让智能体跑几十分钟到几小时长任务的人（重构、迁移、调研型任务）；
- 经常因为上下文压缩或 `/clear` 导致智能体跑偏的开发者；
- 多个智能体或子智能体协作、需要一份共享进度的场景。

**不适合：**
- 几分钟就能完成的小改动——建三个文件纯属负担；
- 不希望项目目录里多出规划文件的仓库（虽然默认 gitignore）；
- 想要需求澄清、测试、评审等完整流程的人，它只管「计划别丢」。

## 注意事项

- **许可证**：MIT。
- **维护状态**：活跃（最近推送 2026-10-06）。
- **Hooks 每轮都会执行**：插件会注册多个生命周期 Hook（README 写 Claude Code 插件是 6 个），每轮对话都会运行脚本、把计划内容注入上下文，带来少量延迟和 token 开销。安装前在插件详情里看清 Hook 列表。
- **读取本地会话记录需要显式开启**：README 说明自动恢复只读项目里的规划文件；读取同一项目的本地会话记录是单独的显式操作，且不含联网上传。输出一旦放进上下文，仍会随对话发给你配置的模型服务。
- **计划文件可能含敏感信息**：调研发现和错误日志会原样写进 Markdown，注意不要把密钥、内部地址写进去，也不要误提交。
- **安全**：仓库含脚本和 Hooks，属于会执行代码的技能；从作者仓库安装，团队使用前通读 `SKILL.md` 与 scripts 目录。
- **不同安装方式功能不同**：见上文，技能方式没有斜杠命令。
