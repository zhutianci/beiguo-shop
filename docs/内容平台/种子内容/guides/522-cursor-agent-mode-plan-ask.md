---
title: Cursor Agent 模式怎么用：Agent、Plan、Ask 三种模式，检查点回滚与消息排队
slug: cursor-agent-mode-plan-ask
products: [cursor]
models: []
accountTier: PLUS
excerpt: Cursor Agent 模式是什么、和 Plan / Ask 模式怎么选？按官方文档讲清 Agent 能调用哪些工具、Shift+Tab 切换模式、Plan 模式先出方案再动手、用检查点撤销改动、任务进行中排队或插话，以及 /goal 长目标。
checkedOn: 2026-10-11
sources:
  - https://cursor.com/docs/agent/overview
  - https://cursor.com/docs/agent/plan-mode
  - https://cursor.com/help/ai-features/ask-mode
  - https://cursor.com/help/ai-features/inline-edit
  - https://cursor.com/help/troubleshooting/agent-issues
  - https://cursor.com/docs/agent/security/run-modes
verify:
  - /goal 与「Send now」插话功能官方标注为逐步放量，你的版本里可能还没有
  - Debug Mode、Design Mode、Projects 等模式本文未展开，以官方文档为准
---

> 本文根据 Cursor 官方文档《Cursor Agent》《Plan Mode》和帮助中心相关页面整理，资料核对于 2026-10-11。

## 适用于谁

- 会用 Tab 补全，想进一步让 Cursor「自己改一整个功能」的人；
- 搜「cursor agent 模式」「cursor plan mode」「cursor ask 模式」分不清几种模式的人；
- 被 Agent 改乱过代码，想知道怎么安全撤销的人。

## 结论先说

1. **Agent 是 Cursor 里能独立完成任务的助手**：会搜索代码库、读写文件、跑终端命令、查网页、操作浏览器。`Ctrl+I`（macOS `Cmd+I`）打开侧边面板。
2. 在输入框里按 **Shift+Tab** 轮换模式：**Agent**（直接动手）、**Plan**（先出方案、等你批准）、**Ask**（只读，只回答不改代码）。
3. 任务跨多个文件、需求还不清楚时先用 Plan；只想弄懂代码用 Ask；改动小而明确时直接 Agent。
4. Agent 改文件前会自动建**检查点（Checkpoint）**，改错了可以一键恢复；但检查点只存在本地、和 Git 无关，**长期版本管理仍然要靠 Git**。
5. Agent 干活时你可以继续发消息：回车是排队，`Ctrl+Enter`（macOS `Cmd+Enter`）是立刻插话。

## 三种模式怎么选

| 模式 | 会改代码吗 | 适合 |
| --- | --- | --- |
| Agent | 会 | 需求明确的修改、做过很多次的任务 |
| Plan | 批准方案后才改 | 多文件改动、有多种做法、要先确认架构 |
| Ask | 不会（只读） | 读陌生代码、问「登录流程怎么走」「这个函数干什么」 |

切换方式两种：输入框里按 Shift+Tab，或者点模式下拉菜单（`Ctrl+.` / `Cmd+.` 也能打开模式菜单）。

另外还有不进侧边栏的**行内编辑**：选中代码按 `Ctrl+K`（`Cmd+K`），写一句指令，回车后就地修改。只想问问题不想改，按 `Alt+Enter`（macOS `Opt+Return`）切到提问。发现事情比想的大，选中代码按 `Ctrl+L`（`Cmd+L`）带着这段代码转到 Agent。

## Agent 能用哪些工具

官方把 Agent 拆成三部分：指令（系统提示词 + 你的 Rules）、工具、模型。工具包括：

- **搜索**：按文件名找文件、读目录结构、在文件里搜关键词；
- **读文件**：包括图片（png、jpg、gif、webp、svg），交给支持视觉的模型分析；
- **改文件**：给出修改并自动应用；
- **运行 shell 命令**：执行并监控输出；
- **Web**：生成搜索词并联网搜索；
- **浏览器**：打开页面、点击、截图，用来验证界面改动；
- **图像生成**：按文字或参考图生成图片，默认存到项目的 `assets/` 目录；
- **提问**：任务中途向你确认需求，等你回答时它会继续做别的。

官方说明一个任务里工具调用**次数不设上限**。命令和 MCP 工具要不要先问你，由运行模式（Run Mode）决定，见[《Cursor 隐私模式与 Agent 权限》](/guides/cursor-privacy-mode-run-modes)。

## Plan 模式：先出方案再动手

切到 Plan 模式后，Cursor 会：

1. 问你几个澄清问题；
2. 研究代码库，找出相关文件；
3. 写出一份详细的实施方案；
4. 你在聊天里或直接编辑方案的 Markdown 文件来修改它；
5. 满意后点击开始构建。

方案默认存在你的用户目录下，点 **Save to workspace** 可以存进项目，方便团队共享和留档。

官方有一条很实用的建议：如果 Agent 做出来的东西不对，**不要一轮轮追着修**——撤销改动，回到方案把要求写得更具体，再跑一次，通常更快，结果也更干净。

## 检查点：撤销 Agent 的改动

- Agent 在做较大改动前会自动创建检查点，记录所有被修改文件的状态；
- 在聊天时间线上点任意检查点可以预览当时的文件，再点恢复；也可以把鼠标移到之前的消息上，点右下角的 **Restore Checkpoint**；
- 恢复**只回滚文件**，不会删除对话里的消息；
- 检查点存在本地、独立于 Git，只用于撤销 Agent 的改动。

稳妥的习惯是：让 Agent 开工前先 `git commit` 一次，干净的工作区加上检查点，等于两层保险。

## 任务进行中：排队、插话、开旁支

| 你想做的事 | 操作 |
| --- | --- |
| 把下一条指令排在后面 | 输入后按 Enter，进入队列，可拖动调整顺序 |
| 立刻打断或纠正方向 | `Ctrl+Enter` / `Cmd+Enter` 立即发送 |
| 不打断主任务，问个题外话 | 输入 `/side` 或 `/btw` 开一个旁支对话 |
| 给一个长期目标 | `/goal 修好所有不稳定的测试并让 CI 变绿` |

`/goal` 让 Agent 朝一个目标持续工作直到完成，而不是把每条消息当成新任务。官方标注它在逐步放量，没看到就开个新对话试试。

## 常见问题

**Q：Agent 找不到我的文件？**
官方排查顺序：看 `.cursorignore` 是否把它排除了；看 `.gitignore`（里面的规则也会影响发现文件）；命令面板里搜 Reindex 重建索引；最后直接在输入框里用 `@文件名` 把文件挂上去。

**Q：怎么让 Agent 更准？**
官方的建议是：提示词写清预期行为和限制；涉及多文件先用 Plan；做完一个功能或切换任务就**开新对话**；反复强调的要求写进 `.cursor/rules/`，写法见[《Cursor Rules 怎么写》](/guides/cursor-rules-project-rules-mdc)。

**Q：项目在 Agent 的终端里行为不一样？**
Cursor 通过 Agent 跑命令时会设置环境变量 `CI=1`，让输出更干净。如果你的项目在 CI 环境下会跳过交互或走不同路径，在命令前加 `unset CI &&`，或者把这条写进规则。

**Q：提示「Agent Execution Timed Out」？**
见[《Cursor 常见报错与解决》](/guides/cursor-common-errors-connection-failed)。

## 参考资料

- Cursor Agent（官方）：https://cursor.com/docs/agent/overview
- Plan Mode（官方）：https://cursor.com/docs/agent/plan-mode
- Ask mode（官方帮助中心）：https://cursor.com/help/ai-features/ask-mode
- Inline edit（官方帮助中心）：https://cursor.com/help/ai-features/inline-edit
- Agent troubleshooting（官方帮助中心）：https://cursor.com/help/troubleshooting/agent-issues
- Run Modes（官方）：https://cursor.com/docs/agent/security/run-modes
