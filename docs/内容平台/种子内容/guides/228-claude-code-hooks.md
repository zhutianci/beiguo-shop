---
title: Claude Code Hooks 怎么用：配置示例（完成通知、自动格式化、拦截危险命令）
slug: claude-code-hooks
products: [claude]
models: []
accountTier: PLUS
excerpt: Claude Code Hooks 是在固定时机自动执行的命令。本文讲清配置写在哪、事件和 matcher 怎么选、退出码 0 / 2 的含义，附通知（含 Windows）、自动格式化、保护文件等可复制示例。
checkedOn: 2026-10-07
sources:
  - https://code.claude.com/docs/en/hooks-guide
  - https://code.claude.com/docs/en/hooks
  - https://code.claude.com/docs/en/settings
  - https://code.claude.com/docs/en/permissions
---

> 本文根据 Claude Code 官方文档《Automate actions with hooks》和 Hooks 参考整理，核对日期 2026-10-07。示例配置改写自官方示例；事件名和字段以官方 Hooks reference 为准。

## 适用于谁

- 想让 Claude Code **每次改完文件自动格式化**、**等我确认时弹通知**的人；
- 想在团队项目里**强制**禁止改 `.env`、禁止跑 `drop table` 之类命令的人——写在 CLAUDE.md 里只是「建议」，Hook 是「必须」；
- 搜「claude code hooks 怎么用」「hooks 通知 windows」的人。

## 结论先说

1. **Hook = 用户自己定义的命令**，在 Claude Code 生命周期的固定时机自动运行（改文件前后、需要你输入时、会话开始时……），结果是确定的，不依赖模型「记得去做」。
2. 配置写在 `settings.json` 的 `hooks` 字段里：`~/.claude/settings.json` 对你所有项目生效，项目里的 `.claude/settings.json` 可以提交给团队共用。写完在会话里输入 `/hooks` 确认已加载。
3. 最常用的 4 个事件：`PreToolUse`（工具执行前，可以拦截）、`PostToolUse`（执行成功后）、`Notification`（需要你输入或确认时）、`Stop`（Claude 回复完毕时）。
4. 脚本的**退出码**决定结果：`0` 表示不反对（照常走权限流程），`2` 表示拦截，并把 stderr 里的原因反馈给 Claude。
5. Hook 以你的账户权限执行任意命令，**来自别人的 Hook 配置要先读懂再用**。

## 第一个 Hook：Claude 等你时弹桌面通知

打开（没有就新建）`~/.claude/settings.json`，按你的系统选一段加进去。

**macOS：**

```json
{
  "hooks": {
    "Notification": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "osascript -e 'display notification \"Claude Code 需要你处理\" with title \"Claude Code\"'"
          }
        ]
      }
    ]
  }
}
```

如果没有弹窗：官方说明 `osascript` 借用的是系统自带的「脚本编辑器」发通知，先在终端执行一次 `osascript -e 'display notification "test"'`，再到「系统设置 → 通知」里给「脚本编辑器」打开允许通知。

**Linux：**把 `command` 换成：

```text
notify-send 'Claude Code' 'Claude Code 需要你处理'
```

没有这个命令就装 `libnotify-bin`（Debian / Ubuntu）。注意服务器、SSH、容器里通常没有桌面通知服务。

**Windows（PowerShell）：**官方给的是弹一个对话框的写法：

```json
{
  "hooks": {
    "Notification": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "powershell.exe -Command \"[System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms'); [System.Windows.Forms.MessageBox]::Show('Claude Code needs your attention', 'Claude Code')\""
          }
        ]
      }
    ]
  }
}
```

它弹的是对话框而不是右下角通知，可能被终端窗口挡住；在 WSL 里使用需要 `powershell.exe` 在 PATH 里。

**验证：**会话里输入 `/hooks`，能在 `Notification` 下看到它。然后按 `Shift+Tab` 切到 `manual mode on`，让 Claude 做一件需要确认的事，切到别的窗口等通知。

**只在某些情况通知：**`matcher` 留空表示所有通知类型都触发；也可以填：

| matcher | 触发时机 |
| --- | --- |
| `permission_prompt` | 需要你批准某个操作，且已经等了约 6 秒 |
| `idle_prompt` | Claude 回复完约 60 秒你还没输入 |
| `auth_success` | 登录认证完成 |
| `agent_completed` | 后台会话完成或失败（agent view 打开时） |

想在「Claude 每次回复完」都提醒，可以把同样的命令挂在 `Stop` 事件上。

## 常用示例

### 1. 改完文件自动格式化（PostToolUse）

放在项目的 `.claude/settings.json`：

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.file_path' | xargs npx prettier --write"
          }
        ]
      }
    ]
  }
}
```

`matcher: "Edit|Write"` 表示只在 Claude 用改文件工具之后运行。命令从 stdin 收到的 JSON 里取出文件路径交给 Prettier。需要先装好 `jq`（macOS `brew install jq`，Ubuntu `apt-get install jq`）。成功时对话里不会有任何提示，打开文件看格式有没有变即可。

### 2. 禁止修改敏感文件（PreToolUse + 退出码 2）

新建 `.claude/hooks/protect-files.sh`：

```bash
#!/bin/bash
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
# 把 Windows 的反斜杠统一成 /，下面的匹配才可靠
FILE_PATH="${FILE_PATH//\\//}"

PROTECTED_PATTERNS=(".env" "package-lock.json" ".git/")

for pattern in "${PROTECTED_PATTERNS[@]}"; do
  if [[ "$FILE_PATH" == *"$pattern"* ]]; then
    echo "已拦截：$FILE_PATH 属于受保护文件（$pattern）" >&2
    exit 2
  fi
done
exit 0
```

macOS / Linux 上要先 `chmod +x .claude/hooks/protect-files.sh`，然后注册：

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/protect-files.sh"
          }
        ]
      }
    ]
  }
}
```

让 Claude 去改 `.env` 试试：操作会在执行前被拦下，拦截原因会作为反馈发给 Claude，它会换别的办法。

### 3. 拦截危险命令

同样的思路挂在 `Bash` 上，检查 `tool_input.command`：

```bash
#!/bin/bash
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command')
if echo "$COMMAND" | grep -q "drop table"; then
  echo "已拦截：不允许删除数据表" >&2
  exit 2
fi
exit 0
```

官方特别说明：`PreToolUse` Hook 在任何权限模式之前执行，返回拒绝时**连 bypass 模式也拦得住**，所以适合做团队强制规范。反过来，Hook 返回「允许」并不能绕过设置里的 deny 规则。

### 4. 上下文压缩后重新提醒（SessionStart + compact）

对话太长被压缩后，可能丢掉一些细节。用 `SessionStart` 加 `compact` matcher，在每次压缩后把关键信息再塞回去：

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "compact",
        "hooks": [
          {
            "type": "command",
            "command": "echo '提醒：本项目用 pnpm，不用 npm；提交前先跑 pnpm test。'"
          }
        ]
      }
    ]
  }
}
```

`echo` 可以换成任何有输出的命令，比如 `git log --oneline -5`。每次会话都要加载的规矩，写进 CLAUDE.md 更合适。

## Hook 是怎么工作的

**输入：**事件触发时，Claude Code 把一段 JSON 通过 stdin 交给你的命令，里面有 `session_id`、`cwd`、`hook_event_name`，工具类事件还有 `tool_name` 和 `tool_input`（Bash 的命令在 `tool_input.command`，改文件的路径在 `tool_input.file_path`）。

**输出：**

- 退出码 `0`：不反对。对 `PreToolUse` 来说这**不等于批准**，正常的权限确认照样会出现；`UserPromptSubmit`、`SessionStart` 这类事件的 stdout 文字会加进 Claude 的上下文。
- 退出码 `2`：拦截，把 stderr 的内容作为原因。少数事件（如 `SessionStart`）不能被拦截，只会把信息显示给你。
- 其他退出码：通常算「非阻塞错误」，操作继续，对话里显示 `hook error`。
- 想要更细的控制，可以退出码 0 并打印 JSON，例如 `PreToolUse` 返回 `permissionDecision: "deny"` 和原因。注意这些字段要放在 `hookSpecificOutput` 里面，放错层级会被静默忽略。

**常用事件：**

| 事件 | 时机 |
| --- | --- |
| `SessionStart` / `SessionEnd` | 会话开始（含恢复、压缩后）/ 结束 |
| `UserPromptSubmit` | 你提交消息后、Claude 处理前 |
| `PreToolUse` | 工具执行前，可拦截 |
| `PermissionRequest` | 需要权限决定时，可代你批准（要把 matcher 写窄） |
| `PostToolUse` / `PostToolUseFailure` | 工具执行成功 / 失败后 |
| `Notification` | Claude Code 发通知时 |
| `Stop` | Claude 回复完毕 |
| `SubagentStart` / `SubagentStop` | 子代理启动 / 结束 |
| `PreCompact` / `PostCompact` | 上下文压缩前 / 后 |
| `FileChanged` / `CwdChanged` | 被监视的文件变化 / 工作目录变化 |

完整事件列表有三十多个，见官方 Hooks reference。除了执行命令（`type: "command"`），还可以把事件 POST 到一个网址（`http`）、调用 MCP 工具（`mcp_tool`），或者交给模型判断（`prompt` / `agent`）。

**配置位置与作用范围：**

| 位置 | 范围 |
| --- | --- |
| `~/.claude/settings.json` | 你所有的项目，仅本机 |
| `.claude/settings.json` | 当前项目，可提交到仓库 |
| `.claude/settings.local.json` | 当前项目，仅自己 |
| 插件的 `hooks/hooks.json` | 启用该插件时 |
| 技能 / 子代理的 frontmatter | 技能被调用后 / 子代理运行期间 |

想临时全部关掉，在设置里写 `"disableAllHooks": true`。

## 常见问题

**Q：配置了却不触发？**
先 `/hooks` 看有没有出现在正确的事件下；matcher **区分大小写**，要和工具名完全一致（`Edit` 不是 `edit`）；再确认事件选对了，`PreToolUse` 在执行前、`PostToolUse` 在执行后。

**Q：对话里出现「PreToolUse hook error」？**
脚本意外以非 0 退出。手动喂一段样例 JSON 测试：`echo '{"tool_name":"Bash","tool_input":{"command":"ls"}}' | ./my-hook.sh; echo $?`。提示 command not found 就用绝对路径或 `$CLAUDE_PROJECT_DIR`；提示 `jq: command not found` 就装 jq 或改用 Python / Node 解析。

**Q：Hook 打印了 JSON 但没生效？**
常见原因是你的 shell 配置文件（`~/.bashrc`、`~/.zshrc`）里有无条件的 `echo`，输出跑到了 JSON 前面。把这些 echo 包在 `if [[ $- == *i* ]]; then ... fi` 里，只在交互式终端执行。

**Q：Claude 用 shell 命令改文件，`Edit|Write` 的 Hook 能捕获吗？**
不能。官方建议：必须覆盖所有改动时，加一个 `Stop` Hook 每轮扫描一次工作区，或者用 `FileChanged` 监视具体文件。

**Q：怎么看 Hook 的详细执行记录？**
按 `Ctrl+O` 打开记录视图看结果；更详细的用 `claude --debug-file /tmp/claude.log` 启动，或会话中输入 `/debug` 开启调试日志。

## 参考资料

- Automate actions with hooks（官方）：https://code.claude.com/docs/en/hooks-guide
- Hooks reference（官方）：https://code.claude.com/docs/en/hooks
- Settings files and precedence（官方）：https://code.claude.com/docs/en/settings
- Configure permissions（官方）：https://code.claude.com/docs/en/permissions
