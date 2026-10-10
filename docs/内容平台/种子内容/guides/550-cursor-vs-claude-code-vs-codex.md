---
title: Cursor、Claude Code、Codex、GitHub Copilot 有什么区别：按形态、账号、计费和规则文件对比
slug: cursor-vs-claude-code-vs-codex
products: [cursor, claude]
models: []
accountTier: PLUS
excerpt: Cursor 和 Claude Code 的区别是什么、和 Codex、GitHub Copilot 怎么选？只用各家官方文档的事实对比：产品形态、用什么账号、怎么计费、能选哪些模型、规则文件与 MCP、权限模式、代码审查；不做「谁更强」的排名，给出按场景选择的思路。
checkedOn: 2026-10-11
sources:
  - https://cursor.com/docs/models-and-pricing
  - https://cursor.com/docs/agent/overview
  - https://cursor.com/docs/rules
  - https://code.claude.com/docs/en/overview
  - https://code.claude.com/docs/en/security
  - https://learn.chatgpt.com/docs/pricing
  - https://docs.github.com/en/copilot/get-started/plans
  - https://docs.github.com/en/copilot/concepts/billing-and-usage/individuals/billing
  - https://docs.cline.bot/getting-started/installing-cline
verify:
  - 四款产品的套餐、额度与可用模型变化很快，表格内容取自各官方文档 2026-10-07 至 2026-10-11 的版本（Claude Code 与 Codex 部分沿用本站单篇教程核对过的事实）
  - 本文不含任何性能、速度、代码质量的比较——官方没有可比的统一数据
  - Trae、Kiro、Devin Desktop、Cline 只在文末简述，详见各自的单篇教程
---

> 本文只对比各家官方文档里**写明的事实**，资料核对于 2026-10-11。「哪个写代码更强」没有官方的统一评测，本文不下这种结论。Claude Code 和 Codex 的细节以本站单篇教程（核对于 2026-10-07）为准。

## 适用于谁

- 搜「claude code cursor 区别」「cursor claude code codex 区别」「ai编程工具对比」的人；
- 已经订阅了 ChatGPT 或 Claude，想知道自带的编程工具够不够用的人；
- 想在团队里统一工具的人。

## 结论先说

1. **它们不是同一类东西**：Cursor 是一个**独立的编辑器**；Claude Code 和 Codex 的核心是**终端里的智能体**（各自也有 IDE 插件、桌面和云端形态）；GitHub Copilot 主要是**装进你现有 IDE 的插件**，另有 CLI 和云端智能体。
2. **账号和计费逻辑不同**：Claude Code 跟着 Claude 订阅走，Codex 跟着 ChatGPT 订阅走，Cursor 和 Copilot 各自单独订阅并按用量计。**已经有 ChatGPT Plus 或 Claude Pro 的人，手里其实已经有一个编程智能体了。**
3. **模型选择范围不同**：Cursor 和 Copilot 可以在多家模型之间切换；Claude Code 用 Claude 系列；Codex 用 OpenAI 的模型。
4. **可以同时用**。它们都能读 `AGENTS.md`（或有自己的规则文件）、都支持 MCP，共用一套项目约定并不难。常见组合是「编辑器里一个 + 终端里一个」。
5. 选择的依据应该是：**你习惯在哪干活、已经付了谁的钱、团队在用什么**——而不是榜单。

## 一、产品形态

| | Cursor | Claude Code | Codex | GitHub Copilot |
| --- | --- | --- | --- | --- |
| 出品方 | Anysphere（现为 SpaceX 子公司） | Anthropic | OpenAI | GitHub |
| 主要形态 | 独立编辑器（基于 VS Code） | 终端命令 `claude` | 终端 CLI、云端任务 | IDE 插件 |
| 其他入口 | CLI、云端智能体、iOS App | VS Code / JetBrains 插件、桌面 App、网页版 | IDE 插件、ChatGPT 桌面 App | Copilot CLI、云端 cloud agent、GitHub 网页与手机端 |
| 补全（打字时的灰色建议） | 有（Tab） | 无，这不是它的定位 | 无，这不是它的定位 | 有 |
| 换编辑器的成本 | 要换到 Cursor（可一键导入 VS Code 设置） | 不用换 | 不用换 | 不用换，支持 VS Code、JetBrains、Visual Studio、Xcode、Eclipse 等 |

一个直观的区分：**想在打字时就有 AI 补全**，看 Cursor 和 Copilot；**想交代一句话让它自己把任务做完**，四者都行，Claude Code 和 Codex 是为这种用法设计的。

## 二、账号与计费

| | Cursor | Claude Code | Codex | GitHub Copilot |
| --- | --- | --- | --- | --- |
| 用什么账号 | Cursor 账号 | Claude 订阅账号或 Console（API）账号 | ChatGPT 账号 | GitHub 账号 |
| 免费能用吗 | Hobby 免费档，用量有限 | 包含在 Claude 付费订阅里 | 官方定价页写 Free 和 Go 为「有限」使用；完整入口从 Plus 起 | Copilot Free，每月 2000 次补全和一定的 AI credits |
| 计费方式 | 每月包含用量，分 Cursor Models 与 Other Models 两个池，按模型 API 价扣 | 跟随 Claude 订阅的 5 小时会话额度和每周额度 | 与 ChatGPT Work 共用一份额度；Plus 有 5 小时窗口 | AI credits（1 credit = 0.01 美元），每月 1 日重置；补全不计 |
| 用完了 | 开启按量付费或升级 | 等重置或升级到 Max | 等重置、买 credits 或升级 | 升级、设预算买额外用量或等重置 |
| 单篇教程 | [额度与套餐](/guides/cursor-usage-limits-plans) | [使用限制与额度](/guides/claude-usage-limits) | [额度与使用限制](/guides/codex-usage-limits) | [免费版与 Pro 区别](/guides/github-copilot-free-pro-ai-credits) |

具体价格和额度数字见各单篇教程，这里不重复。想开通 ChatGPT Plus 或 Claude Pro，可以看本站的 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus) 与 [/chongzhi/claude-pro](/chongzhi/claude-pro)。

## 三、模型

- **Cursor**：自家的 Composer 和与 SpaceXAI 共同训练的 Grok 系列属于 Cursor Models 池；也可选 Anthropic、OpenAI、Google 等第三方模型；有 Auto 自动路由；个人档可以自带 API Key。
- **Claude Code**：Claude 系列（Opus、Sonnet、Haiku 等），用 `/model` 切换，见[《Claude Code 切换模型》](/guides/claude-code-switch-model)。
- **Codex**：OpenAI 的模型，按套餐和任务选择。
- **GitHub Copilot**：Free 与 Student 档只能自动选模型；Pro 起可选一批模型，Pro+ 与 Max 可用高级模型。

## 四、规则文件、MCP 与扩展

| | Cursor | Claude Code | Codex | GitHub Copilot |
| --- | --- | --- | --- | --- |
| 项目规则 | `.cursor/rules/*.mdc`、`AGENTS.md` | `CLAUDE.md`（可用 `@AGENTS.md` 导入） | `AGENTS.md` | `.github/copilot-instructions.md`、`*.instructions.md`、`AGENTS.md` |
| MCP 配置 | `.cursor/mcp.json`、`~/.cursor/mcp.json` | `claude mcp add`，`.mcp.json`、`~/.claude.json` | `codex mcp add`，`config.toml` | 各 IDE 的 MCP 设置 |
| 其他扩展 | Skills、Hooks、Subagents、Plugins | Skills、Hooks、Subagents、Plugins | 见单篇教程 | Skills、Custom agents、Hooks |
| 单篇教程 | [Rules](/guides/cursor-rules-project-rules-mdc)、[MCP](/guides/cursor-mcp-config-json) | [CLAUDE.md](/guides/claude-md-agents-md)、[MCP](/guides/claude-code-mcp-setup) | [MCP](/guides/codex-mcp-config) | [instructions](/guides/copilot-instructions-md-examples) |

四者都认 `AGENTS.md`（Claude Code 的读取条件见单篇教程），所以通用约定写一份就够，见[《AGENTS.md 怎么写》](/guides/agents-md-cross-tool-guide)。现成的技能与规则仓库可以到本站 [Skill 库](/skills) 里找。

## 五、权限与安全

四者的思路一致：默认情况下危险操作要你批准；可以用白名单减少弹窗；都有某种沙箱或分类器的「中间档」；都有一个「全部放开」的开关，官方都不建议日常使用。

| | 中间档 | 单篇教程 |
| --- | --- | --- |
| Cursor | Auto-review（白名单 + 沙箱 + 分类器） | [隐私模式与 Agent 权限](/guides/cursor-privacy-mode-run-modes) |
| Claude Code | Auto 模式（分类器审查）与沙箱 | [权限模式详解](/guides/claude-code-permission-modes) |
| Codex | 审批模式 + 沙箱 | [权限与沙箱设置](/guides/codex-permissions-sandbox) |
| Copilot CLI | `--allow-tool` / `--deny-tool` 精确授权 | [CLI 安装与使用](/guides/github-copilot-cli-install-usage) |

跨工具的通用做法见[《AI 编程安全注意事项》](/guides/ai-coding-security-secrets-permissions)。

## 六、代码审查与云端任务

- **PR 自动审查**：Cursor 有 Bugbot；Copilot 有 code review（PR 的 Reviewers 里请求）；Codex 支持 `@codex review`；Claude Code 通过 GitHub Actions 里 `@claude` 审查。见[《AI 代码审查怎么做》](/guides/ai-code-review-workflow)。
- **云端异步任务**（把任务交出去，做完给你一个 PR）：Cursor Cloud Agents、Copilot cloud agent、Codex 云端任务、Claude Code 网页版，四者都有。

## 按场景怎么选

| 你的情况 | 可以优先看 | 理由（均为形态与计费层面的事实） |
| --- | --- | --- |
| 已订阅 ChatGPT Plus / Pro | Codex | 已包含在订阅里，不用另外付费 |
| 已订阅 Claude Pro / Max | Claude Code | 已包含在订阅里 |
| 想要一个 AI 原生的编辑器，补全、对话、智能体都在一个界面 | Cursor | 独立编辑器，支持多家模型 |
| 必须留在 JetBrains、Visual Studio、Xcode | GitHub Copilot；或 Claude Code / Codex 的插件与 CLI | Copilot 官方支持这些 IDE；终端智能体不依赖编辑器 |
| 公司代码都在 GitHub，想把 AI 接进 PR 流程 | GitHub Copilot | 与 GitHub 的 PR、issue、Actions 原生集成 |
| 在读学生 | GitHub Copilot Student | 通过 GitHub Education 认证后免费，见[学生认证](/guides/github-copilot-student-verification) |
| 想自己选模型、用自己的 API Key | Cline（开源）或 Cursor 个人档自带 Key | 见[《Cline 怎么用》](/guides/cline-setup-api-plan-act) |
| 完全零基础、只想做个网页 | 先别选这四个 | 见[《Vibe Coding 是什么》](/guides/vibe-coding-beginner-workflow) |

很多人最后是组合着用：编辑器里用 Cursor 或 Copilot 做补全和小改动，终端里开 Claude Code 或 Codex 跑大任务。这样两边的额度也分开消耗。

## 其他常见选项

- **Trae**：字节跳动的 AI IDE，有国内版与国际版，中文文档完整，见[《Trae 规则与 MCP 配置教程》](/guides/trae-rules-mcp-config)；
- **Kiro**：AWS 的 AI IDE，主打先写规格再实现，见[《Kiro Spec 模式怎么用》](/guides/kiro-spec-steering-hooks)；
- **Devin Desktop**：原 Windsurf，可在一个界面管理本地与云端智能体，见[《Devin Desktop 使用教程》](/guides/devin-desktop-windsurf-tutorial)；
- **Cline**：开源，装进现有编辑器，模型自选。

更多工具见本站 AI 应用目录的编程分类。

## 常见问题

**Q：到底哪个写代码最好？**
没有官方的统一对比数据，而且底层模型每隔几个月就换一代。更实际的办法是拿自己的真实项目，各试一周同类型的任务，再看用量页面上花了多少。

**Q：Cursor 里也能选 Claude 和 GPT 模型，那还要 Claude Code / Codex 吗？**
两回事。Cursor 里用第三方模型是按 API 价从 Cursor 的额度里扣；Claude Code 和 Codex 用的是你 Claude / ChatGPT 订阅里的额度。智能体本身的工具、权限体系和交互方式也各不相同。

**Q：能在 Cursor 里装 Claude Code 或 Codex 的插件吗？**
Codex 官方文档写明它的 IDE 插件支持 VS Code、Cursor、Windsurf；Claude Code 有 VS Code 插件，也可以直接在 Cursor 的内置终端里运行 `claude`。

**Q：团队里每人用的工具不一样怎么办？**
把通用约定写进 `AGENTS.md`，测试、类型检查、lint 放进 CI。无论谁用什么工具写的代码，都要过同一套检查和同一个审查流程。

## 参考资料

- Models & Pricing（Cursor 官方）：https://cursor.com/docs/models-and-pricing
- Cursor Agent（Cursor 官方）：https://cursor.com/docs/agent/overview
- Claude Code overview（Anthropic 官方）：https://code.claude.com/docs/en/overview
- Codex pricing（OpenAI 官方）：https://learn.chatgpt.com/docs/pricing
- Plans for GitHub Copilot（GitHub 官方）：https://docs.github.com/en/copilot/get-started/plans
- Usage-based billing for individuals（GitHub 官方）：https://docs.github.com/en/copilot/concepts/billing-and-usage/individuals/billing
