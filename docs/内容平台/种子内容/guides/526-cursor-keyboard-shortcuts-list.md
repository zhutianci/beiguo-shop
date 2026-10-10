---
title: Cursor 快捷键大全：Agent、行内编辑、Tab 补全常用快捷键与快捷键设置、冲突处理
slug: cursor-keyboard-shortcuts-list
products: [cursor]
models: []
accountTier: FREE
excerpt: Cursor 快捷键速查表（Windows / Linux 与 macOS 对照）：打开 Agent、切换模式和模型、行内编辑、把选中代码加入对话、Tab 补全、终端生成命令；以及怎么改快捷键、和 VS Code 快捷键冲突时怎么办。
checkedOn: 2026-10-11
sources:
  - https://cursor.com/docs/reference/keyboard-shortcuts
  - https://cursor.com/help/customization/keyboard-shortcuts
  - https://cursor.com/help/ai-features/inline-edit
  - https://cursor.com/help/ai-features/tab
  - https://cursor.com/docs/agent/overview
verify:
  - 官方参考页只列 macOS 键位；Windows / Linux 一栏按官方帮助页「Cmd 对应 Ctrl、Opt 对应 Alt」的对照换算，个别组合键在 Windows 上可能与系统或输入法快捷键冲突，以 Keyboard Shortcuts 设置页里显示的为准
---

> 本文根据 Cursor 官方文档《Keyboard Shortcuts》和帮助中心快捷键页整理，资料核对于 2026-10-11。官方参考页以 macOS 键位书写，Windows / Linux 一般把 Cmd 换成 Ctrl、Opt 换成 Alt。

## 适用于谁

- 刚从 VS Code 转到 Cursor，想知道多了哪些 AI 快捷键的人；
- 搜「cursor 快捷键」「cursor 快捷键设置」「cursor 快捷键冲突」的人。

## 结论先说

1. Cursor **默认快捷键和 VS Code 一样**，另外加了一批 AI 功能的快捷键；全部都能改。
2. 最常用的六个：`Ctrl+I` / `Ctrl+L`（开关侧边面板）、`Ctrl+K`（行内编辑）、`Shift+Tab`（切换 Agent 模式）、`Ctrl+/`（切换模型）、`Tab`（接受补全）、`Ctrl+.`（模式菜单）。
3. 改快捷键：依次按 `Ctrl+R`、`Ctrl+S`（macOS 为 `Cmd+R`、`Cmd+S`）打开快捷键设置，搜索命令后点铅笔图标重新绑定。

## 最常用的 AI 快捷键

| 操作 | Windows / Linux | macOS |
| --- | --- | --- |
| 开关侧边面板（Agent / 对话） | Ctrl + I 或 Ctrl + L | Cmd + I 或 Cmd + L |
| 行内编辑 | Ctrl + K | Cmd + K |
| 模式菜单 | Ctrl + . | Cmd + . |
| 在 Agent 模式之间轮换 | Shift + Tab | Shift + Tab |
| 在模型之间轮换 | Ctrl + / | Cmd + / |
| 接受 Tab 建议 | Tab | Tab |

## 通用

| 操作 | Windows / Linux | macOS |
| --- | --- | --- |
| 切换 Agent 布局 | Ctrl + E | Cmd + E |
| 打开 Cursor 设置 | Ctrl + Shift + J | Cmd + Shift + J |
| 打开通用（编辑器）设置 | Ctrl + , | Cmd + , |
| 命令面板 | Ctrl + Shift + P | Cmd + Shift + P |
| 开关语音模式 | Ctrl + Shift + Space | Cmd + Shift + Space |

## 对话输入框

| 操作 | Windows / Linux | macOS |
| --- | --- | --- |
| 发送（Agent 忙时为排队） | Enter | Return |
| 强制立即发送 | Ctrl + Enter | Cmd + Return |
| 取消生成 | Ctrl + Shift + Backspace | Cmd + Shift + Backspace |
| 接受全部修改（有待确认的修改时） | Ctrl + Enter | Cmd + Return |
| 拒绝全部修改（有待确认的修改时） | Ctrl + Shift + Backspace | Cmd + Shift + Backspace |
| 新对话 | Ctrl + N 或 Ctrl + R | Cmd + N 或 Cmd + R |
| 新对话标签页 | Ctrl + T | Cmd + T |
| 上一个 / 下一个对话 | Ctrl + [ / Ctrl + ] | Cmd + [ / Cmd + ] |
| 关闭对话 | Ctrl + W | Cmd + W |
| 让输入框失去焦点 | Esc | Esc |

## 选中代码与上下文

| 操作 | Windows / Linux | macOS |
| --- | --- | --- |
| 把选中代码加入当前对话 | Ctrl + Shift + L | Cmd + Shift + L |
| 带着选中代码开新对话 | Ctrl + L | Cmd + L |
| 把选中代码加入行内编辑 | Ctrl + Shift + K | Cmd + Shift + K |
| 引用文件、文件夹、规则 | 输入 @ | 输入 @ |
| 快捷命令 | 输入 / | 输入 / |
| 复制的代码作为「引用」贴入 | 复制后 Ctrl + V | 复制后 Cmd + V |
| 复制的代码作为纯文本贴入 | 复制后 Ctrl + Shift + V | 复制后 Cmd + Shift + V |

## 行内编辑（Ctrl+K）

| 操作 | Windows / Linux | macOS |
| --- | --- | --- |
| 打开 | Ctrl + K | Cmd + K |
| 切换输入焦点 | Ctrl + Shift + K | Cmd + Shift + K |
| 提交 | Enter | Return |
| 取消 | Ctrl + Shift + Backspace | Cmd + Shift + Backspace |
| 只问问题不修改 | Alt + Enter | Opt + Return |

## Tab 补全与终端

| 操作 | Windows / Linux | macOS |
| --- | --- | --- |
| 接受补全 | Tab | Tab |
| 逐词接受 | Ctrl + → | Cmd + → |
| 终端里打开提示栏（用一句话生成命令） | Ctrl + K | Cmd + K |
| 运行生成的命令 | Ctrl + Enter | Cmd + Return |
| 只接受命令、不运行 | Esc | Esc |

## 怎么改快捷键

1. 打开快捷键设置：依次按 `Ctrl+R` 再 `Ctrl+S`（macOS 为 `Cmd+R` 再 `Cmd+S`）；或者命令面板里搜 `Keyboard Shortcuts`；
2. 搜索要改的命令；
3. 点它旁边的铅笔图标；
4. 按下你想要的组合键；
5. 回车保存。

例如想换掉接受补全的 Tab 键，搜索 `Accept Cursor Tab Suggestions`。

## 快捷键冲突怎么办

**和 VS Code 的习惯冲突**。最典型的是 `Ctrl+K`：在 VS Code 里它是很多组合键的「前缀键」（如 `Ctrl+K Ctrl+S`），Cursor 把它给了行内编辑，打开快捷键设置的组合在 Cursor 里是 `Ctrl+R Ctrl+S`。`Ctrl+L`、`Ctrl+I`、`Ctrl+E` 同理。如果你更依赖原来的功能，在快捷键设置里把 Cursor 的 AI 命令挪到别的键上即可——官方说明所有 Cursor 快捷键都可以重新映射。

**和扩展冲突**。装了其他补全类扩展时，Tab 键可能被抢。可以在快捷键设置里搜 `Tab`，看有哪些命令绑定在上面，把不需要的解绑；或者暂时停用那个扩展。

**和系统 / 输入法冲突**。`Ctrl+Shift+Space`、`Ctrl+.`、`Ctrl+/` 这类组合在 Windows 上常被输入法占用。这种情况下按键根本到不了 Cursor，要么改输入法的热键，要么在 Cursor 里换一个组合。

**导入的 VS Code 快捷键**。从 VS Code 一键导入设置时，你自定义的键位会一起带过来（见[《Cursor 安装教程》](/guides/cursor-install-chinese-setup)），冲突时以快捷键设置页里显示的最终绑定为准。

## 常见问题

**Q：Agent 正在干活时按回车会怎样？**
消息进入队列，等当前任务做完再处理；想立刻打断并纠正，用 `Ctrl+Enter`（`Cmd+Return`）。详见[《Cursor Agent 模式怎么用》](/guides/cursor-agent-mode-plan-ask)。

**Q：Shift+Tab 在哪儿都能切模式吗？**
要在 Agent 的输入框里按。它在 Agent、Plan、Ask 等模式之间轮换。

**Q：有没有命令行版的快捷键？**
Cursor CLI 有自己的一套键位和斜杠命令，见官方 CLI 文档。

## 参考资料

- Keyboard Shortcuts（官方参考）：https://cursor.com/docs/reference/keyboard-shortcuts
- Keyboard shortcuts（官方帮助中心）：https://cursor.com/help/customization/keyboard-shortcuts
- Inline edit（官方帮助中心）：https://cursor.com/help/ai-features/inline-edit
- Tab completion（官方帮助中心）：https://cursor.com/help/ai-features/tab
- Cursor Agent（官方）：https://cursor.com/docs/agent/overview
