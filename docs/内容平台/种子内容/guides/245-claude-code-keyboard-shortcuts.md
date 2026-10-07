---
title: Claude Code 快捷键大全：换行、中断、切换模式与自定义快捷键
slug: claude-code-keyboard-shortcuts
products: [claude]
models: []
accountTier: PLUS
excerpt: Claude Code 命令行里怎么换行不发送？怎么中断、回退、切换权限模式和模型、粘贴图片？本文整理官方快捷键表，并讲清 Shift+Enter 不能换行的解决办法、Mac 上 Option 键设置和 keybindings.json 自定义。
checkedOn: 2026-10-07
sources:
  - https://code.claude.com/docs/en/interactive-mode
  - https://code.claude.com/docs/en/keybindings
  - https://code.claude.com/docs/en/terminal-config
  - https://code.claude.com/docs/en/checkpointing
---

> 本文根据 Claude Code 官方文档《Interactive mode》《Customize keyboard shortcuts》《Configure your terminal for Claude Code》整理，核对日期 2026-10-07。快捷键可能因操作系统和终端不同而有差异，在空输入框里按 `?` 可以查看当前可用的快捷键。

## 适用于谁

- 在 Claude Code 里按回车就把话发出去了、不知道怎么换行的人（「claude code 命令行 换行」）；
- 想用键盘快速中断、回退、切换模式和模型的人；
- 想自定义快捷键的人。

VS Code 扩展里的快捷键不同，详见本站《Claude Code VS Code 插件使用教程：安装、登录与常用操作》。

## 结论先说

1. **换行不发送**：`Ctrl+J` 或输入 `\` 再按回车，所有终端都能用；多数终端也支持 `Shift+Enter`，VS Code / Cursor 等终端要先运行一次 `/terminal-setup`。
2. **中断**：`Esc` 停止当前回复（已完成的工作保留）；`Ctrl+C` 中断，空输入时连按两次退出。
3. **回退**：输入框为空时连按两次 `Esc`，打开回退菜单恢复代码和对话。
4. **切换权限模式**：`Shift+Tab`；**切换模型**：`Alt+P`（Mac 是 `Option+P`）。
5. **自定义**：运行 `/keybindings` 打开 `~/.claude/keybindings.json`，保存后自动生效。

## 一、最常用的 12 个

| 快捷键 | 作用 |
| --- | --- |
| `Enter` | 发送 |
| `Ctrl+J`、`\` + `Enter` | 换行不发送（任何终端） |
| `Esc` | 停止 Claude 当前的回复或工具调用；有对话框时关闭对话框 |
| `Esc` `Esc` | 输入框有字：清空并存入历史；输入框为空：打开回退菜单 |
| `Ctrl+C` | 中断；没有运行中的任务时，第一次清空输入、第二次退出 |
| `Ctrl+D` | 退出（800 毫秒内按两次）；输入框有字时是删除光标后的字符 |
| `Shift+Tab` | 循环切换权限模式（manual → accept edits → plan → …） |
| `Alt+P` / `Option+P` | 切换模型，不清空当前输入 |
| `Ctrl+O` | 打开 / 关闭详细记录视图，看工具调用细节 |
| `Ctrl+R` | 反向搜索历史输入 |
| `Ctrl+V`（Windows / WSL 用 `Alt+V`） | 粘贴剪贴板里的图片 |
| `Ctrl+G` | 在默认文本编辑器里编辑当前提示词（写长提示很方便） |

## 二、通用控制

| 快捷键 | 作用 |
| --- | --- |
| `Ctrl+B` | 把正在运行的命令或子代理放到后台（tmux 里按两次） |
| `Ctrl+T` | 显示 / 隐藏 Claude 的待办清单 |
| `Ctrl+S` | 暂存当前输入并清空；空输入时再按一次恢复 |
| `Ctrl+L` | 重绘屏幕（显示乱了时用），不清除输入和对话 |
| `Ctrl+Z` | 挂起 Claude Code（仅 Unix），用 `fg` 恢复 |
| `Ctrl+X Ctrl+K` | 停止本会话所有后台子代理（3 秒内按两次确认） |
| `Ctrl+Enter` / `Ctrl+X Ctrl+S` | 立刻发送排队中的消息 |
| `Alt+T` / `Option+T` | 开关扩展思考（Opus 5.5、Sonnet 5.5 和 Fable 始终开启，无效） |
| `Alt+O` / `Option+O` | 开关 fast 模式 |
| `Tab` | 接受自动补全；在权限确认框里给「是 / 否」附一句说明 |
| `↑` / `↓` | 在多行输入里移动光标，到首行 / 末行后翻历史 |
| `?`（空输入时） | 显示快捷键帮助面板 |

Claude 正在工作时你也可以继续输入并回车，消息会**排队**，等当前这一轮结束再发送；想撤回排队的消息，在输入框首行按 `↑`。

## 三、输入框里的快捷符号

| 输入 | 作用 |
| --- | --- |
| 开头输入 `/` | 命令或技能，详见本站《Claude Code 命令大全：斜杠命令速查与自定义命令》 |
| 开头输入 `!` | Shell 模式：直接运行一条命令，输出加入会话并让 Claude 看到 |
| `@` | 文件路径补全，引用文件 |
| `:` | 表情短码（如 `:tada:`） |

## 四、文本编辑

| 快捷键 | 作用 |
| --- | --- |
| `Ctrl+A` / `Ctrl+E` | 移到行首 / 行尾 |
| `Ctrl+K` | 删除到行尾 |
| `Ctrl+U` | 删除到行首（Mac 上 `Cmd+Backspace` 通常映射到它） |
| `Ctrl+W` | 删除到前一个空格（一次删掉整段路径） |
| `Ctrl+Y` | 粘贴刚才删除的文字 |
| `Alt+B` / `Alt+F` | 按词后退 / 前进（Mac 需开启 Option as Meta） |
| `Ctrl+_` | 撤销上一次输入编辑 |

官方提到，中文、日文这类没有空格分词的文字，按词移动 / 删除也会一次处理一个词。

## 五、换行：Shift+Enter 不管用怎么办

| 终端 | Shift+Enter 换行 |
| --- | --- |
| Ghostty、Kitty、iTerm2、WezTerm、Warp、Apple Terminal、Windows Terminal | 直接可用 |
| VS Code、Cursor、Alacritty 0.16 以前、Zed 的终端 | 先运行一次 `/terminal-setup` |
| gnome-terminal、JetBrains IDE（如 PyCharm）的终端 | 不支持，用 `Ctrl+J` 或 `\` + 回车 |

`/terminal-setup` 会把 Shift+Enter 写进终端的快捷键配置；在 VS Code / Cursor 里还会顺带关闭终端 GPU 加速以避免乱码。要在宿主终端里直接运行，不要在 tmux / screen 里面运行；在 tmux 里用 Shift+Enter 还需要额外的 tmux 配置（见官方 terminal-config 页）。

**Mac 上 Option 组合键没反应？**大多数 Mac 终端默认不把 Option 当修饰键发送。设置方法：

- **Apple Terminal**：设置 → 描述文件 → 键盘，勾选「将 Option 键用作 Meta 键」（首次运行时接受了 Claude Code 的终端设置提示的话已经开好）；
- **iTerm2**：Settings → Profiles → Keys → General，把左右 Option 键都设为「Esc+」；
- **VS Code 终端**：设置里加 `"terminal.integrated.macOptionIsMeta": true`。

开启后 `Option+Enter` 也能换行。

## 六、回退与检查点

每条你发出的提示都会创建一个检查点。输入框为空时连按两次 `Esc`（或输入 `/rewind`）打开回退菜单，可以：只恢复对话、只恢复代码、两者都恢复，或者从某条消息开始做摘要。官方提醒：检查点只记录 Claude 用编辑工具做的改动，通过 shell 命令做的修改不在内，不能代替 git。

## 七、自定义快捷键

运行：

```text
/keybindings
```

会创建或打开 `~/.claude/keybindings.json`，改完保存后**自动生效**，不用重启。格式示例（官方示例改写）：

```json
{
  "$schema": "https://www.schemastore.org/claude-code-keybindings.json",
  "bindings": [
    {
      "context": "Chat",
      "bindings": {
        "ctrl+e": "chat:externalEditor",
        "ctrl+s": null
      }
    }
  ]
}
```

- `context` 是生效的场景，比如 `Chat`（主输入框）；
- 键名写法：`ctrl`、`shift`、`alt`（Mac 上即 Option，也可写 `meta`）、`cmd`；组合键用 `+` 连接，如 `ctrl+shift+c`；
- **和弦（连续按键）**用空格分隔，如 `ctrl+k ctrl+s`，两次按键间隔需在 3 秒内；
- 把某个动作设为 `null` 就是取消默认绑定。

几个常用的动作名：`chat:submit`（发送，默认 Enter）、`chat:newline`（换行，默认 Ctrl+J）、`chat:cycleMode`（切换模式）、`chat:modelPicker`（切换模型）、`chat:externalEditor`（外部编辑器）。比如想反过来「回车换行、Shift+Enter 发送」，就重新映射 `chat:newline` 和 `chat:submit`。

**不能改的快捷键**：`Ctrl+C`（中断）、`Ctrl+D`（退出）、`Ctrl+M`（等同回车）、`Ctrl+[`（等同 Esc）、`Ctrl+I`（等同 Tab）等。文本编辑类快捷键（`Ctrl+W`、`Alt+B` 等）也不在配置文件的可改范围内。

**和终端软件冲突**：`Ctrl+B` 是 tmux 的前缀键（要按两次）；`Ctrl+A` 是 GNU screen 的前缀键；`Ctrl+Z` 是 Unix 挂起进程。

## 常见问题

**Q：Vim 模式怎么开？**
`/config` → Editor mode 切换到 Vim。Vim 模式下 `Esc` 是从插入模式切到普通模式，不会取消输入。

**Q：按 Esc 会不会把 Claude 做了一半的工作丢掉？**
不会。`Esc` 只是停下当前回复，已经完成的工作保留，你可以接着给新指示。想撤销已做的改动，用双击 `Esc` 的回退菜单。

**Q：Windows 上 Shift+Tab 不能切换模式？**
官方说明在没有启用 VT 输入模式的旧版运行时上，默认改用 `Alt+M`。

**Q：在 JetBrains 终端里 Esc 打断不了？**
JetBrains 终端默认用 Esc 把焦点切回编辑器，到 Settings → Tools → Terminal 取消勾选「Move focus to the editor with Escape」，详见本站《Claude Code JetBrains 插件怎么用：IDEA / PyCharm 安装与配置》。

## 参考资料

- Interactive mode · Keyboard shortcuts（官方）：https://code.claude.com/docs/en/interactive-mode
- Customize keyboard shortcuts（官方）：https://code.claude.com/docs/en/keybindings
- Configure your terminal for Claude Code（官方）：https://code.claude.com/docs/en/terminal-config
- Checkpointing（官方）：https://code.claude.com/docs/en/checkpointing
