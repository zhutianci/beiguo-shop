---
title: Claude Code 怎么看历史对话、恢复之前的会话：--continue、--resume 与 /resume
slug: claude-code-resume-history
products: [claude]
models: []
accountTier: PRO
excerpt: Claude Code 怎么看历史对话？按官方文档讲清 claude --continue、--resume、/resume 的区别，会话列表的快捷键，怎么给会话起名、分支、导出，会话存在哪、保留多久，以及找不到会话时怎么办。
checkedOn: 2026-10-24
sources:
  - https://code.claude.com/docs/en/sessions
  - https://code.claude.com/docs/en/common-workflows
  - https://code.claude.com/docs/en/cli-reference
verify:
  - 命令、快捷键、存储路径（~/.claude/projects/<project>/<session-id>.jsonl）、默认 30 天保留期取自 2026-10-24 官方 Manage sessions 页；快捷键和版本号要求随版本变化
  - 「Resume this conversation?」弹窗的说明取自官方文档，估算值是已保存对话本身占用 5 小时额度的比例
  - 桌面版、claude.ai/code、VS Code 扩展各有自己的会话列表，本文只讲命令行版
---

> 本文根据 Claude Code 官方文档《Manage sessions》《Common workflows》整理，资料核对于 2026-10-24。命令和快捷键随版本变化，**以你本机 `claude --help` 和官方文档为准**。图为本站整理的示意图。

## 适用于谁

- 昨天和 Claude Code 聊到一半，今天想接着聊，却不知道怎么回去的人；
- 误按了 `/clear`，想找回刚才的对话的人；
- 同时开着好几个任务，想给会话起名字、快速切换的人；
- 想知道历史对话存在电脑哪里、会保留多久的人。

## 结论先说

1. **每次对话都会自动保存在本机**，不用手动保存。官方说：会话持续写入本地的记录文件，退出或执行 `/clear` 之后都能再回来。
2. **最常用的两个命令**：`claude --continue`（或 `claude -c`）接上**当前目录里最近的一次**会话；`claude --resume`（或 `claude -r`）打开**会话列表**，自己挑。在已经打开的会话里，输入 `/resume` 同样能打开列表并切换。
3. **会话是按项目目录分开存的**：默认只显示当前目录（含它的 git worktree）的会话；列表里按 `Ctrl+A` 能看本机所有项目的。
4. **起名字最省事**：`claude -n auth-refactor` 启动，或会话中输入 `/rename auth-refactor`，之后用 `claude --resume auth-refactor` 直接回去。
5. **默认保留 30 天**：超过保留期的记录会被清理，要改可以设置 `settings.json` 里的 `cleanupPeriodDays`。
6. 想让 Claude Code 跑得更久、用量更大，可以看本站的 [/chongzhi/claude-pro](/chongzhi/claude-pro) 或 [/chongzhi/claude-max](/chongzhi/claude-max)。

![Claude Code 恢复会话的 5 个入口](seed:g1049-resume-commands.png)
*图：本站根据 [Claude Code 官方文档：Manage sessions](https://code.claude.com/docs/en/sessions) 整理的示意图*

## 一、恢复会话：几种入口怎么选

官方给出的入口（命令行版）：

| 命令 | 作用 |
| --- | --- |
| `claude --continue` | 重新打开**当前目录**里最近的一次会话；如果还没有，会提示 `No conversation found to continue` 并退出 |
| `claude --resume` | 打开会话选择列表 |
| `claude --resume <名字>` | 直接恢复你起过名字的会话 |
| `claude --resume <记录文件路径>` | 恢复保存在那个 `.jsonl` 记录文件里的会话 |
| `claude --from-pr <编号>` | 打开会话列表，只显示和那个 PR 关联的会话 |
| `/resume` | 在正在运行的会话里，切换到另一个会话 |

几条实用的补充：

- **名字重复时**：`claude --resume <名字>` 如果有多个同名会话，会打开列表并把名字填进搜索框；在会话里用 `/resume <名字>` 遇到同名会报错，改成不带参数的 `/resume` 再选；
- **按会话 ID 恢复**：`claude --resume <session-id>` 可以在任意目录执行，Claude Code 会先找当前项目和它的 worktree，再找本机其他项目；找不到会提示 `No conversation found with session ID: ...`；
- **误按 /clear 了**：官方说 `/clear` 会先保存上一个会话，用 `/resume` 就能找回；
- **PR 相关的会话**：Claude 用 `gh pr create` 创建 PR 时，会话会自动关联；之后 `claude --from-pr 1234`（换成你的 PR 编号），或者在列表搜索框里粘贴 PR 链接，就能找到当时的会话。

## 二、会话恢复后，哪些东西还在

官方「What a resumed session restores」说明，恢复会话会带回：

- **对话历史**：消息、工具调用和结果；如果会话被压缩过（`/compact`），会从「Conversation compacted」那一行接着，带上压缩摘要和之后的所有消息，压缩前被概括掉的原文不会重新载入；
- **使用的模型**；用 `--agent` 启动的会话会继续用那个 agent；
- **权限模式**：用 `claude --continue`、`claude --resume <id 或名字>`（不带 `-p`）恢复时，会恢复会话当时的权限模式；也可以用 `--permission-mode` 覆盖。不过上一次是 `bypassPermissions` 的会话，恢复后**不会自动回到绕过权限**，需要重新用启动参数打开；
- **没有完成的工具调用**不会重新运行：Claude 会看到它被标记为「被中断」，并被告知先确认它有没有生效再决定要不要重做。

**需要重新传的东西**：`--mcp-config`、`--settings`、`--plugin-dir`、`--fallback-model`、`--add-dir` 这类启动参数不会自动恢复，恢复时要再传一遍；`settings.json` 里的配置每次启动会重新读取，不用重传。上下文满了怎么办见 [/guides/claude-code-context-compact](/guides/claude-code-context-compact)。

### 「Resume this conversation?」弹窗

恢复很长的会话时，可能看到这个弹窗。官方说明：弹窗里的估算，是**这段已保存对话本身**会占用你 5 小时用量上限的比例，不包含你已经用掉的部分；在 Pro 和 Max 套餐上，隔了很久再恢复长对话、或换了模型时会出现。选择方法：

- **Resume**：你接下来的任务还需要这段对话，就选它；
- **Start a new conversation**：换了个不需要旧对话的任务，就开新的，想回去时再 `/resume`。

额度的算法见 [/guides/claude-usage-limits](/guides/claude-usage-limits)。

## 三、会话列表（session picker）怎么用

![会话列表里常用的快捷键](seed:g1049-session-picker-keys.png)
*图：本站根据 [Claude Code 官方文档：Manage sessions](https://code.claude.com/docs/en/sessions) 整理的示意图*

执行 `claude --resume` 或在会话里输入 `/resume`，会打开列表。官方列出的快捷键：

| 按键 | 作用 |
| --- | --- |
| `↑` / `↓` 或 `k` / `j` | 上下移动 |
| `→` / `←` | 展开或折叠成组的会话 |
| `Enter` | 恢复当前选中的会话 |
| `1` 到 `9` | 直接恢复列表中对应位置的会话 |
| `Space` | 预览会话内容 |
| `Ctrl+R` | 给选中的会话改名 |
| `/` 或直接输入字符 | 进入搜索，可以粘贴 PR 链接查找 |
| `Ctrl+A` | 显示本机所有项目的会话，再按一次返回当前仓库 |
| `Ctrl+W` | 显示当前仓库所有 worktree 的会话（仅多 worktree 仓库显示） |
| `Ctrl+B` | 只看当前 git 分支的会话 |
| `Esc` | 退出列表或搜索 |

每一行显示：会话名（没起名就显示自动生成的标题、摘要或第一条提示词）、距离上次活动的时间、git 分支和文件大小。

**列表里找不到的几种会话**：官方说明，第一条提示词是 `/loop` 的会话，以及用 `claude -p` 或 Agent SDK 创建的会话，不会出现在列表里，也不会被 `--continue` 选中；但你仍然可以用会话 ID 恢复它们。

**从别的项目选会话**：如果会话属于一个不相关的项目，Claude Code 会把 `cd` 加恢复的命令复制到剪贴板，让你到那个目录去执行。

## 四、给会话起名、分支和导出

**起名字**（官方列出的方式）：

- 启动时：`claude -n auth-refactor`；
- 会话中：`/rename auth-refactor`；
- 在列表里：选中后按 `Ctrl+R`；
- 接受 plan 模式的计划时，会按计划自动生成标题（如果你还没起名）。

没起名的会话会有自动生成的标题，由后台的小模型根据第一条提示词概括；这个标题也可以拿来恢复。注意默认的显示名（形如 `my-app-3f`）**不能**用来恢复。

**分支（Branch）**：想换个思路试试、又不想丢掉原来的对话，可以在会话中输入 `/branch 名字`，会复制当前对话并切换过去，原会话原样保留；命令行里用 `claude --continue --fork-session`。更多并行开发的做法见 [/guides/claude-code-worktree](/guides/claude-code-worktree)。

**导出**：在会话中输入 `/export`，可以把当前对话复制到剪贴板，或保存成纯文本文件。如果要用脚本处理，官方建议用 `claude -p --output-format json` 等接口，而不是直接解析记录文件（记录格式是内部的，版本之间会变）。

## 五、会话存在哪、保留多久

- **默认位置**：`~/.claude/projects/<project>/<session-id>.jsonl`，其中 `<project>` 是工作目录路径，把非字母数字字符换成 `-` 后得到的名字；Windows 上 `~` 是你的用户目录；
- **保留期**：默认 30 天，用 `settings.json` 的 `cleanupPeriodDays` 修改；
- **移动存储位置**：环境变量 `CLAUDE_CONFIG_DIR`；
- **不想保存**：对单次非交互运行可以用 `claude -p` 加 `--no-session-persistence`；
- **想主动删除**：`claude purge` 可以删除某个项目的记录和相关状态。

另外，官方还强调：桌面版、claude.ai/code 和 VS Code 扩展**各有各自的会话列表**；桌面版可以恢复命令行里的会话。桌面版见 [/guides/claude-code-desktop](/guides/claude-code-desktop)，VS Code 见 [/guides/claude-code-vscode](/guides/claude-code-vscode)。

## 常见问题

**Q：`--continue` 和 `--resume` 有什么区别？**
`--continue` 不问，直接接上当前目录最近的一次；`--resume` 打开列表让你选。

**Q：我换了个目录，`--continue` 找不到之前的会话？**
会话按项目目录分开存放。回到原目录，或在 `--resume` 列表里按 `Ctrl+A` 看所有项目。

**Q：两个终端同时恢复同一个会话会怎样？**
官方说明：在两个终端里不分支地恢复同一个会话，两边的消息会交错写进同一份记录；想各走各的，可以用 `--fork-session` 恢复一份副本。

**Q：好几天前的会话找不到了？**
可能超过了默认 30 天的保留期，被自动清理。需要保留更久，改 `cleanupPeriodDays`。

**Q：Claude Code 刚入门，从哪开始？**
见 [/guides/claude-code-getting-started](/guides/claude-code-getting-started)，常用命令见 [/guides/claude-code-slash-commands](/guides/claude-code-slash-commands)。

## 参考资料

- Claude Code 官方文档：Manage sessions — https://code.claude.com/docs/en/sessions
- Claude Code 官方文档：Common workflows（Resume previous conversations）— https://code.claude.com/docs/en/common-workflows
- Claude Code 官方文档：CLI reference — https://code.claude.com/docs/en/cli-reference
