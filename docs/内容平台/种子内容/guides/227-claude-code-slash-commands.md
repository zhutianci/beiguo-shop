---
title: Claude Code 命令大全：斜杠命令速查与自定义命令
slug: claude-code-slash-commands
products: [claude]
models: []
accountTier: PLUS
excerpt: 按用途整理 Claude Code 常用斜杠命令（上下文、模型、会话、审查、并行、配置），并讲清自定义命令怎么写：.claude/commands 与 skills 的关系、$ARGUMENTS 传参。
checkedOn: 2026-10-07
sources:
  - https://code.claude.com/docs/en/commands
  - https://code.claude.com/docs/en/skills
  - https://code.claude.com/docs/en/interactive-mode
  - https://code.claude.com/docs/en/cli-reference
verify:
  - 命令表来自 2026-10 官方 Commands 页；部分命令只在特定套餐、平台或版本出现（官方注明），以本机输入 / 后弹出的菜单为准
---

> 本文根据 Claude Code 官方文档整理，核对日期 2026-10-07。Claude Code 几乎每周都有新命令或改名，本文只收录官方命令页上列出的命令，并按用途分组；完整清单以官方 Commands 页和你本机的 `/help` 为准。

## 适用于谁

- 已经会用 Claude Code，但只记得 `/clear`、`/compact` 几个命令，想系统了解还有哪些好用命令的人；
- 想把团队常用的提示词做成 `/部署`、`/修复issue` 这类**自定义命令**的人；
- 搜「claude code slash commands list」「slash commands vs skills」的人。

还没装好 Claude Code 的，先看本站《Claude Code 中文入门教程（2026）：安装、登录、第一个任务、常用命令》。

## 结论先说

1. 在输入框里输入 `/` 就会弹出命令菜单，继续输入字母可以过滤；**命令只在消息开头才会被识别**，命令后面的文字是参数。
2. 官方命令表里有两类特殊条目：标着 **Skill** 的是内置技能（本质是一段交给 Claude 的提示词，如 `/code-review`、`/batch`），标着 **Workflow** 的是在后台调度多个子代理的内置工作流（如 `/deep-research`）。
3. **自定义命令已经并入 Skills**：`.claude/commands/deploy.md` 和 `.claude/skills/deploy/SKILL.md` 都会生成 `/deploy`，旧的 commands 文件继续有效，新写的推荐用 skill 格式。
4. Claude 正在回复时输入的命令会排队，等这一轮结束再执行；`/status`、`/usage` 等少数命令会立即执行，不打断回复。

## 常用命令速查（按用途分组）

### 开新项目时

| 命令 | 作用 |
| --- | --- |
| `/init` | 分析项目，生成一份起步用的 `CLAUDE.md` |
| `/memory` | 编辑 `CLAUDE.md`，开关和查看自动记忆 |
| `/mcp` | 管理 MCP 服务器连接与授权；`/mcp reconnect all` 重连所有失败的服务器 |
| `/permissions` | 管理 allow / ask / deny 权限规则（别名 `/allowed-tools`） |
| `/import` | 把本机 Codex、Gemini CLI、Cursor 的配置（说明文件、MCP、命令、技能等）导入 Claude Code |
| `/add-dir <路径>` | 本次会话额外允许访问一个目录 |

### 干活过程中

| 命令 | 作用 |
| --- | --- |
| `/plan [描述]` | 直接进入 plan 模式，例如 `/plan 修复登录的 bug` |
| `/model [模型]` | 切换模型并设为新会话默认；在选择器里按 `s` 只对本次会话生效 |
| `/effort [级别]` | 设置推理强度：`low` 到 `xhigh`、`max` 或 `auto` |
| `/fast [on\|off]` | 开关 fast 模式 |
| `/context` | 用彩色格子显示上下文被什么占满，并给出优化建议 |
| `/compact [要求]` | 把之前的对话压缩成摘要，可附「重点保留哪些内容」 |
| `/btw [问题]` | 问一个旁支问题，不写进对话历史 |
| `/goal [条件]` | 设定目标，Claude 会跨轮次持续工作直到条件满足 |
| `/loop [间隔] [提示词]` | 会话开着时定时重复执行，例如 `/loop 5m 检查部署是否完成` |

### 并行与后台

| 命令 | 作用 |
| --- | --- |
| `/tasks` | 查看本会话的后台任务，包括已完成的子代理 |
| `/background [提示词]` | 把整个会话转到后台继续跑，腾出终端（别名 `/bg`） |
| `/subtask <任务>` | 派一个继承当前对话的子代理在后台做支线任务，结果回到本对话 |
| `/fork [提示词]` | 把当前对话复制成一个新的后台会话 |
| `/batch <指令>` | 大规模改动：先拆成 5～30 个独立单元，批准后每个单元在独立 worktree 里由一个子代理完成 |

### 提交之前

| 命令 | 作用 |
| --- | --- |
| `/diff` | 查看工作区改动，包括 Claude 改过的地方 |
| `/code-review` | 检查当前改动里的正确性问题；`--fix` 直接修，传 PR 号可审 PR（别名 `/review`） |
| `/security-review` | 检查当前分支相对默认分支的安全问题（需要 `origin` 远程） |
| `/simplify` | 从复用、简化、效率等角度清理改动（不找 bug） |
| `/install-github-app` | 为 GitHub 仓库安装 Claude GitHub App，可顺带配置 GitHub Actions |

### 会话管理

| 命令 | 作用 |
| --- | --- |
| `/clear [名字]` | 清空上下文开新对话（别名 `/reset`、`/new`），项目记忆保留 |
| `/resume [会话]` | 按 ID 或名字恢复以前的对话，或打开选择器（别名 `/continue`） |
| `/rename [名字]` | 给当前会话改名，方便以后 `/resume` 找到 |
| `/branch [名字]` | 在当前位置给对话开一个分支，尝试另一个方向 |
| `/rewind` | 把对话和代码回退到之前的检查点（别名 `/undo`） |
| `/export [文件名]` | 把当前对话导出成纯文本 |
| `/copy [N]` | 复制最近第 N 条回复，有代码块时可单独挑选 |
| `/teleport` | 把云端会话拉到本地终端继续（需要 claude.ai 订阅） |
| `/remote-control` | 让本地会话可以在 claude.ai 或手机上继续（别名 `/rc`） |
| `/desktop` | 在桌面版里继续当前会话（macOS / x64 Windows，需订阅） |

### 用量、账号与排错

| 命令 | 作用 |
| --- | --- |
| `/usage` | 查看本次花费、套餐用量和统计（`/cost`、`/stats` 是别名） |
| `/status` | 查看版本、模型、账号和连接状态 |
| `/login` / `/logout` | 登录 / 退出 Anthropic 账号 |
| `/doctor` | 体检：检查安装、PATH、设置文件、闲置的技能和 MCP 等，确认后再修复 |
| `/debug [问题描述]` | 开启调试日志并分析问题 |
| `/bug` | 反馈问题，发送前会让你选择附带多少对话内容 |
| `/release-notes` | 查看更新日志 |

### 界面与个性化

| 命令 | 作用 |
| --- | --- |
| `/config` | 打开设置界面；也可以直接 `/config theme=dark`（别名 `/settings`） |
| `/theme` | 切换配色，含色弱友好主题 |
| `/statusline` | 配置底部状态栏 |
| `/output-style [风格]` | 列出或切换输出风格 |
| `/keybindings` | 打开快捷键配置文件 |
| `/terminal-setup` | 为 VS Code、Cursor 等终端安装 Shift+Enter 换行 |
| `/voice` | 开关语音输入（需要 Claude.ai 账号） |
| `/skills` | 列出可用技能，可按 `t` 按占用 token 排序 |
| `/plugin` | 管理插件；`/reload-plugins` 不重启就应用插件改动 |
| `/hooks` | 查看 Hook 配置 |

官方特别注明：并不是每个人都能看到所有命令，具体取决于平台、套餐和环境，例如 `/desktop` 只在 macOS 和 x64 Windows 上用订阅登录时出现。还有少数命令（如 `/heapdump`）默认藏在菜单外，要输入完整名字才会出现。已经移除的命令（如 `/vim`、`/pr-comments`）输入后会提示 Unknown command。

## 自定义命令：把常用提示词变成 /命令

### 1. 最简单的写法：一个 Markdown 文件

在项目根目录建 `.claude/commands/`，放一个 `fix-issue.md`：

```markdown
---
description: 按团队规范修复一个 GitHub issue
disable-model-invocation: true
---

按照我们的代码规范修复 GitHub issue $ARGUMENTS：

1. 阅读 issue 描述，复述需求
2. 找到相关代码并实现修复
3. 补充或更新测试并运行
4. 用规范的提交信息提交
```

保存后在会话里输入 `/fix-issue 123`，Claude 收到的就是「按照我们的代码规范修复 GitHub issue 123……」。

命名规则：`.claude/commands/deploy.md` → `/deploy`；放在子目录里的 `.claude/commands/frontend/component.md` → `/frontend:component`。放在 `~/.claude/commands/` 下则对你所有项目生效。

### 2. 推荐写法：做成 Skill

官方现在推荐新命令都用技能格式：`.claude/skills/fix-issue/SKILL.md`，内容和上面一样。好处是技能目录里还能放脚本、模板、参考资料，并且可以让 Claude 在合适的时候**自动**调用。技能的完整介绍详见本站《Claude Skills 是什么、怎么装、推荐哪些》。

同名时技能优先于 `.claude/commands/` 里的文件。会话中途新建的技能，运行 `/reload-skills` 即可生效，不用重启。

### 3. 传参的几种写法

| 写法 | 含义 |
| --- | --- |
| `$ARGUMENTS` | 命令后面的全部文字 |
| `$0`、`$1`…（或 `$ARGUMENTS[0]`） | 第 1、第 2… 个参数，按空格分隔，多个词用引号括起来 |
| `$issue` 等命名参数 | 在 frontmatter 里写 `arguments: [issue, branch]` 后按位置对应 |

例如 `迁移 $0 组件，从 $1 改成 $2`，运行 `/migrate-component SearchBar JavaScript TypeScript` 就会依次替换。如果正文里没有任何占位符，Claude Code 会把你输入的内容以 `ARGUMENTS: ...` 的形式附在末尾。

### 4. 几个常用的 frontmatter 字段

- `description`：说明这个命令做什么、什么时候用（强烈建议写）；
- `disable-model-invocation: true`：只能你手动触发，Claude 不会自己调用——部署、发消息这类有副作用的命令一定要加；
- `argument-hint: [issue-number]`：输入命令时显示的参数提示；
- `allowed-tools: Bash(gh *)`：执行这个命令的那一轮里，这些工具不再询问权限；
- `model`、`effort`：这一轮临时换模型或推理强度。

### 5. 把实时信息塞进命令

行首写 `` !`命令` ``，Claude Code 会先在本地执行，把输出替换进提示词，再交给 Claude。例如：

```markdown
---
description: 总结未提交的改动并指出风险
---

## 当前改动
!`git diff HEAD`

## 要求
用两三条要点总结上面的改动，再列出可能的风险（缺少错误处理、写死的值、需要更新的测试）。
```

这样 Claude 拿到的是真实的 diff，而不是靠猜。

## 常见问题

**Q：`/review` 和 `/code-review` 有什么区别？**
现在 `/review` 只是 `/code-review` 的别名。想要在云端做多代理的深度审查，用 `/code-review ultra`（官方说明 Pro 和 Max 含 3 次免费，之后需要用量额度）。

**Q：输入了命令却提示 Unknown command？**
可能是拼错了、命令在你的套餐 / 平台不可用，或者命令已被移除。输入 `/` 看菜单里实际有哪些；自定义命令检查文件是否放在 `.claude/commands/` 或 `.claude/skills/<名字>/SKILL.md`。

**Q：MCP 服务器提供的命令在哪里？**
MCP 服务器可以暴露「提示词」，它们会以命令的形式出现在 `/` 菜单里，配置方法详见本站《Claude Code MCP 配置教程：claude mcp add、配置文件位置与常用 MCP》。

**Q：启动参数（比如 `claude -p`、`claude -c`）在哪里查？**
那些是终端里启动时用的 CLI 参数，不是会话内的斜杠命令，见官方 CLI reference；入门常用的几个见本站 Claude Code 入门教程。

**Q：自定义命令能不能分享给团队？**
能。把 `.claude/commands/` 或 `.claude/skills/` 提交到仓库，同事拉取代码后就有同样的命令；要跨仓库分发，可以打包成插件。

## 参考资料

- Commands（官方）：https://code.claude.com/docs/en/commands
- Extend Claude with skills（官方）：https://code.claude.com/docs/en/skills
- Interactive mode（官方）：https://code.claude.com/docs/en/interactive-mode
- CLI reference（官方）：https://code.claude.com/docs/en/cli-reference
