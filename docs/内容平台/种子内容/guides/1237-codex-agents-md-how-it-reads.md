---
title: Codex 怎么读 AGENTS.md：全局和项目的读取顺序、override 文件、32 KiB 上限，以及没生效怎么排查
slug: codex-agents-md-how-it-reads
products: [codex, chatgpt]
models: []
accountTier: PLUS
excerpt: Codex 在开始工作前会读 AGENTS.md。官方写明读取顺序：先全局（~/.codex），再从项目根逐级走到当前目录，每个目录最多一个文件，后面的覆盖前面的，合并大小默认上限 32 KiB。本文只讲 Codex 的读取规则和排查。
checkedOn: 2026-10-28
sources:
  - https://learn.chatgpt.com/docs/agent-configuration/agents-md
  - https://learn.chatgpt.com/docs/config-file/config-advanced
  - https://learn.chatgpt.com/docs/developer-commands
verify:
  - 本文只写 Codex 对 AGENTS.md 的读取规则，其他工具（Claude Code 的 CLAUDE.md、Cursor 的规则文件）怎么读，以各自官方文档为准，跨工具用法见站内文章
  - project_doc_max_bytes 默认 32 KiB 和 project_doc_fallback_filenames 是官方当天的写法，之后可能调整
  - 官方没有说明指令链改动后能否热更新，只说每次运行建一次，命令行里通常是每次启动会话一次
---

> 本文根据 Codex 官方文档《Custom instructions with AGENTS.md》和高级配置整理，资料核对于 2026-10-28。只讲 Codex 的读取规则；其他工具怎么读规则文件，见站内跨工具文章。配图为本站整理的示意图，不是软件截图。

## 适用于谁

- 写了 AGENTS.md，但不确定 Codex 有没有读、读的是哪个的人；
- 一个仓库里有多个子项目，想给不同目录设不同规则的人；
- 规则很长，担心被截断的人。

## 结论先说

1. **Codex 在开始工作前会读 AGENTS.md。** 它在启动时建一条指令链，每次运行建一次（命令行里通常是每次启动会话建一次）。
2. **读取顺序**：先是**全局**，在 Codex 主目录（默认 `~/.codex`，设了 `CODEX_HOME` 就用那个）里，有 `AGENTS.override.md` 就读它，没有才读 `AGENTS.md`，只用第一个非空的；再是**项目**，从项目根（通常是 Git 根）逐级走到当前目录，每个目录依次找 `AGENTS.override.md`、`AGENTS.md`、`project_doc_fallback_filenames` 里的备用文件名，**每个目录最多包含一个**。
3. **合并方式**：从根往下拼接，用空行隔开；**离当前目录越近的越靠后，所以优先级越高**。
4. **大小上限**：Codex 跳过空文件，合并大小到 `project_doc_max_bytes`（默认 32 KiB）就停止添加，需要时调大，或把指令拆到嵌套目录。
5. **确认读了什么**：官方给的办法是用命令让 Codex 列出它加载的指令来源。

![Codex 读取 AGENTS.md 的顺序](seed:g1237-order-compare.png)
*图：本站根据 [Codex 官方文档：AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md) 整理的示意图*

## 一、官方的写法示例

**全局**（`~/.codex/AGENTS.md`），官方示例：

```md
# ~/.codex/AGENTS.md
## Working agreements
- Always run `npm test` after modifying JavaScript files.
- Prefer `pnpm` when installing dependencies.
- Ask for confirmation before adding new production dependencies.
```

**项目根**的 `AGENTS.md` 写仓库的基本规范，比如提交 PR 前运行 `npm run lint`；**子目录**需要不同规则时，放一个 `AGENTS.override.md`，例如 `services/payments/AGENTS.override.md` 里写 `make test-payments` 代替 `npm test`。

**验证**，官方给的命令：

```shell
codex --cd services/payments --ask-for-approval never "List the instruction sources you loaded."
```

官方说预期结果是 Codex 先报告全局文件，再是仓库根的 `AGENTS.md`，最后是 payments 的 override。**Codex 走到你当前目录就停止搜索**，所以特殊规则要放在离相关工作最近的位置。

## 二、没生效，逐项排查

![AGENTS.md 没生效：对照排查](seed:g1237-notwork-decide.png)
*图：本站根据 [Codex 官方文档：AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md) 整理的示意图*

- **改了文件没变化**：指令链每次运行只建一次，重启会话再试；
- **规则被别的覆盖了**：离当前目录近的在后面，优先级更高，检查更深层目录里有没有同名或 override 文件；
- **后面的内容好像没读到**：合并大小默认 32 KiB，到上限就停，把规则精简、调大 `project_doc_max_bytes` 或拆到嵌套目录；
- **全局文件没生效**：同目录下有 `AGENTS.override.md` 时只读它，要恢复就删掉 override；
- **文件是空的**：Codex 会跳过空文件；
- **工作目录不对**：从项目根逐级走到你**启动 Codex 的目录**，在别的目录启动会读到不同的链。

## 三、生成和维护

在命令行里用 `/init` 可以在当前目录生成 AGENTS.md 骨架，见 [/guides/codex-cli-commands-cheatsheet](/guides/codex-cli-commands-cheatsheet)。官方也建议：项目较大时，用嵌套的 AGENTS.md 控制注入的上下文量，每个文件越大越耗额度，见 [/guides/codex-usage-limits](/guides/codex-usage-limits)。

## 四、和其他工具的规则文件

AGENTS.md 是多个编码工具共用的约定，Claude Code 读的是 CLAUDE.md，各工具的写法和读取规则不同，见 [/guides/agents-md-cross-tool-guide](/guides/agents-md-cross-tool-guide) 和 [/guides/claude-md-agents-md](/guides/claude-md-agents-md)。

## 常见问题

**Q：AGENTS.md 里的规则一定会被遵守吗？**
官方说它是让 Codex 在每个任务开始前有一致的预期，没有写「一定遵守」。重要的约束可以同时写进测试或检查里。

**Q：我可以用别的文件名吗？**
官方提供 `project_doc_fallback_filenames` 配置备用文件名，详见官方高级配置。

**Q：Codex 新手怎么开始？**
见 [/guides/codex-first-day-from-signup-to-first-task](/guides/codex-first-day-from-signup-to-first-task)。

## 参考资料

- Codex 官方文档：Custom instructions with AGENTS.md — https://learn.chatgpt.com/docs/agent-configuration/agents-md
- Codex 官方文档：Advanced Configuration — https://learn.chatgpt.com/docs/config-file/config-advanced
- Codex 官方文档：Command line options — https://learn.chatgpt.com/docs/developer-commands
