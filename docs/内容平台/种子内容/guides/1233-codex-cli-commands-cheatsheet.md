---
title: Codex 命令行常用命令一页看：codex、exec、resume、review、cloud 和会话里的斜杠命令（官方文档列出的）
slug: codex-cli-commands-cheatsheet
products: [codex, chatgpt]
models: []
accountTier: PLUS
excerpt: Codex CLI 有哪些常用命令？本文只写官方命令参考里列出的：codex、exec、resume、review、cloud 等，以及会话里的 /model、/status、/compact、/diff 等斜杠命令和快捷键。
checkedOn: 2026-10-28
sources:
  - https://learn.chatgpt.com/docs/developer-commands
  - https://learn.chatgpt.com/docs/codex/cli
  - https://learn.chatgpt.com/docs/non-interactive-mode
verify:
  - 本文只收录官方命令参考里出现的命令和快捷键，没有逐个展开每个命令的所有选项，选项以 codex --help 和官方命令参考为准
  - 官方命令随版本变化，部分命令带有「实验性」「测试版」成熟度标记，以官方页面为准
  - 本文不写官方文档没有给出的命令组合
---

> 本文根据 Codex 官方文档《Command line options》《Slash commands in Codex CLI》《Non-interactive mode》整理，资料核对于 2026-10-28。只写官方命令参考里列出的命令；选项很多，不在这里逐个展开。配图为本站整理的示意图，不是软件截图。

## 适用于谁

- 刚装好 Codex CLI，想知道有哪些命令的人；
- 想在脚本和 CI 里用 Codex 的人；
- 想知道会话里斜杠命令和快捷键的人。

## 结论先说

1. **日常只用到三类**：`codex`（交互界面）、`codex exec`（脚本里无人值守地跑）、`codex resume` 或 `codex fork`（接着上次或分叉一个会话）。
2. **会话里的斜杠命令**最常用的是 `/model`、`/status`、`/compact`、`/diff`、`/review`、`/init`、`/permissions`、`/mcp`。
3. **想看某个命令的全部选项**，用官方命令参考或命令行里的帮助。
4. **安装和更新**见 [/guides/codex-cli-install-update](/guides/codex-cli-install-update)，`codex update` 在当前版本支持自更新时检查并应用更新。

![Codex CLI 常用命令](seed:g1233-cli-compare.png)
*图：本站根据 [Codex 官方文档：Command line options](https://learn.chatgpt.com/docs/developer-commands) 整理的示意图*

## 一、命令行命令

官方命令参考里列出的主要命令（说明是本站转述）：

- **`codex`**：不带子命令时打开交互式终端界面（TUI）。网页搜索默认是缓存模式，用 `--search` 可切到实时浏览；也能附加图片；
- **`codex exec`**（或简写 `codex e`）：用于脚本或 CI 式的、不需要人工参与就能结束的运行。加 `--json` 得到逐行的 JSON 事件；可以用 `resume` 子命令继续非交互任务。详见 [/guides/codex-getting-started](/guides/codex-getting-started)；
- **`codex resume`**：按 ID 继续某个交互会话，或继续最近一次；`--last` 默认只在当前工作目录范围内找，加 `--all` 才搜全部；
- **`codex fork`**：把以前的会话分叉成新对话，默认打开会话选择器，加 `--last` 分叉最近的一个；
- **`codex review`**：非交互地审查代码，要从 `--uncommitted`、`--base`、`--commit` 或自定义提示中选一个目标，它们互相冲突，见 [/guides/codex-code-review](/guides/codex-code-review)；
- **`codex login` / `codex logout`**：登录和登出，`codex login status` 看当前认证方式，`codex login --with-api-key` 用 API 密钥，见 [/guides/codex-401-unauthorized-error](/guides/codex-401-unauthorized-error)；
- **`codex mcp`**：管理 MCP 服务器，OAuth 服务器用 `codex mcp login <名称>`，见 [/guides/codex-mcp-config](/guides/codex-mcp-config)；
- **`codex plugin`**：管理插件，见 [/guides/codex-plugins-where-to-install](/guides/codex-plugins-where-to-install)；
- **`codex cloud`**：和云端对话交互。默认打开选择器，`codex cloud exec` 直接提交任务，`codex cloud list` 列最近的对话，加 `--json` 方便脚本，见 [/guides/codex-cloud-how-to-use](/guides/codex-cloud-how-to-use)；
- **`codex archive` / `unarchive` / `delete`**：归档、恢复和删除保存的会话，见 [/guides/codex-delete-archive-chats](/guides/codex-delete-archive-chats)；
- **`codex doctor`**：生成本地诊断报告，检查安装、配置、认证、运行时、Git、终端等，提交问题前可以先运行；
- **`codex features`**：管理保存在 `config.toml` 里的功能开关；
- **`codex sandbox`**、**`codex execpolicy`**、**`codex app`**、**`codex apply`**、**`codex completion`**：分别用于沙箱、执行策略、桌面 App、应用补丁和 shell 补全，详见官方命令参考。

## 二、会话里的斜杠命令

在交互界面输入 `/` 能看到完整列表。官方列出的常用项：

| 命令 | 官方说明 |
| --- | --- |
| `/model` | 选择当前模型（和思考强度），见 [/guides/codex-switch-model-reasoning-effort](/guides/codex-switch-model-reasoning-effort) |
| `/status` | 显示会话配置和 token 用量 |
| `/usage` | 查看账号 token 用量，或使用可兑换的额度重置 |
| `/compact` | 总结可见的对话，释放 token |
| `/diff` | 显示 Git 差异，含 Git 还没跟踪的文件 |
| `/review` | 让 Codex 审查你的工作区 |
| `/init` | 在当前目录生成 AGENTS.md 骨架，见 [/guides/codex-agents-md-how-it-reads](/guides/codex-agents-md-how-it-reads) |
| `/permissions` | 设置 Codex 不用先问就能做的事 |
| `/mcp` | 列出已配置的 MCP 工具 |
| `/plugins`、`/skills` | 浏览插件、浏览并使用技能 |
| `/new`、`/clear`、`/resume` | 开新对话、清屏并开新对话、从列表继续旧对话 |
| `/debug-config` | 打印配置层和要求的诊断 |

## 三、快捷操作

![会话里的常用快捷操作](seed:g1233-shortcuts-check.png)
*图：本站根据 [Codex 官方文档：Command line options](https://learn.chatgpt.com/docs/developer-commands) 整理的示意图*

另外，官方还列了 `Ctrl+R` 搜索提示历史、`Ctrl+O` 或 `/copy` 复制最近完成的输出、`Ctrl+C` 或 `/exit` 关闭会话。

## 常见问题

**Q：命令太多，新手先学哪些？**
先用 `codex`、`/status`、`/diff`、`/permissions`，其余按需要查。新手第一天的流程见 [/guides/codex-first-day-from-signup-to-first-task](/guides/codex-first-day-from-signup-to-first-task)。

**Q：脚本里怎么提供密钥？**
官方环境变量文档说明 `CODEX_API_KEY` 用于 `codex exec` 这类非交互进程，建议只在需要的那一行设置，见 [/guides/codex-missing-environment-variable](/guides/codex-missing-environment-variable)。

**Q：额度和报错？**
见 [/guides/codex-usage-limits](/guides/codex-usage-limits) 和 [/guides/codex-common-errors-summary](/guides/codex-common-errors-summary)。

## 参考资料

- Codex 官方文档：Command line options / Slash commands — https://learn.chatgpt.com/docs/developer-commands
- Codex 官方文档：Codex CLI — https://learn.chatgpt.com/docs/codex/cli
- Codex 官方文档：Non-interactive mode — https://learn.chatgpt.com/docs/non-interactive-mode
