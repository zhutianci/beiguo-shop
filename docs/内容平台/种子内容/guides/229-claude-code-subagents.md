---
title: Claude Code Subagents（子代理）怎么用：创建、调用与最佳实践
slug: claude-code-subagents
products: [claude]
models: []
accountTier: PLUS
excerpt: Claude Code 子代理是在独立上下文里干活、只交回摘要的专用助手。本文讲内置子代理、怎么创建（.claude/agents）、frontmatter 字段、三种调用方式、指定模型和常见用法。
checkedOn: 2026-10-07
sources:
  - https://code.claude.com/docs/en/sub-agents
  - https://code.claude.com/docs/en/agents
  - https://code.claude.com/docs/en/agent-teams
  - https://code.claude.com/docs/en/permissions
---

> 本文根据 Claude Code 官方文档《Create custom subagents》整理，核对日期 2026-10-07。示例改写自官方示例。

## 适用于谁

- 用 Claude Code 跑测试、翻日志、搜代码时，主对话很快被大段输出塞满的人；
- 想要一个「只读的代码审查员」「专门修测试的助手」并反复使用的人；
- 搜「claude code subagents 如何使用」「subagent 最佳实践」「subagent model config」的人。

## 结论先说

1. **子代理（subagent）= 一个有独立上下文的专用助手**：有自己的系统提示词、可用工具和权限。它在自己的上下文里干完脏活，只把结论交回主对话，所以主对话不会被搜索结果、日志撑爆。
2. 子代理的请求和主对话**算在同一份用量里**，并行开很多个会更快消耗额度。
3. 创建方法：在 `.claude/agents/`（当前项目）或 `~/.claude/agents/`（所有项目）放一个带 YAML 头的 Markdown 文件；也可以直接让 Claude 帮你写。
4. 调用有三种：自然语言点名、`@` 提及（保证一定用它）、`claude --agent 名字` 让整个会话以它的身份运行。
5. `description` 决定 Claude 什么时候自动委派给它，要写清楚、写简短。

## 内置的子代理

不用配置就有，Claude 会在合适的时候自动使用：

| 名称 | 用途 | 工具 |
| --- | --- | --- |
| Explore | 快速搜索、理解代码库，Claude 会指定 quick / medium / very thorough 三档细致程度 | 只读，禁止写和改 |
| Plan | plan 模式下替主对话做调研 | 只读 |
| general-purpose | 既要探索又要动手的多步骤复杂任务 | 子代理可用的全部工具 |
| claude-code-guide | 你问 Claude Code 功能相关问题时 | — |
| statusline-setup | 运行 `/statusline` 配置状态栏时 | — |

官方说明：Explore 和 Plan 为了快和省，不读取你的 CLAUDE.md；其他内置和自定义子代理会读取。想禁用某个内置子代理，在权限里加 deny 规则，例如 `"deny": ["Agent(Explore)"]`。

## 第一步：创建一个子代理

### 方法一：让 Claude 帮你写

在会话里直接说：

```text
在 ~/.claude/agents/ 里帮我建一个个人用的 code-improver 子代理：扫描文件，
从可读性、性能、最佳实践三方面提改进建议，每条都说明问题、贴出原代码、给出改进版。
它只能读不能改，使用 sonnet 模型。
```

Claude 会生成一个包含 `name`、`description`、`tools`、`model` 和系统提示词的文件。注意：现在的 `/agents` 命令只会提醒你「让 Claude 创建或直接编辑目录」，旧版本（v2.1.197 及以前）才有交互式向导。

### 方法二：自己写文件

`.claude/agents/code-reviewer.md`：

```markdown
---
name: code-reviewer
description: 代码审查专家。在写完或修改代码后主动使用，检查质量、安全与可维护性。
tools: Read, Grep, Glob, Bash
model: inherit
---

你是一名资深代码审查员。被调用时：
1. 运行 git diff 查看最近的改动
2. 只关注被修改的文件
3. 立即开始审查

检查清单：命名清晰、无重复代码、错误处理完善、没有暴露密钥、做了输入校验、测试覆盖充分。

按优先级输出：
- 严重问题（必须修）
- 警告（应该修）
- 建议（可以改进）
每条附上具体修改示例。
```

这个审查员只给了读文件和执行命令的工具，没有 Edit / Write，所以它只能提意见、改不了代码。文件保存后几秒内就会被识别，不用重启；唯一例外是 `agents` 目录本来不存在、本次会话里才新建的，需要重启一次。

### 放在哪里

| 位置 | 作用范围 | 优先级 |
| --- | --- | --- |
| 组织托管设置 | 整个组织 | 最高 |
| 启动参数 `--agents '{...}'` | 仅本次会话 | 2 |
| `.claude/agents/` | 当前项目（建议提交到仓库给团队用） | 3 |
| `~/.claude/agents/` | 你的所有项目 | 4 |
| 插件的 `agents/` 目录 | 启用该插件时 | 最低 |

同名时用优先级高的那个。

## 第二步：常用 frontmatter 字段

只有 `name` 和 `description` 是必填的；字段名要和官方表格**完全一致**（驼峰写法），拼错会被静默忽略。

| 字段 | 作用 |
| --- | --- |
| `name` | 唯一标识，不能含冒号 |
| `description` | 什么时候该委派给它；写上「主动使用（use proactively）」能鼓励 Claude 自动委派 |
| `tools` | 允许使用的工具，不写则继承全部可用工具 |
| `disallowedTools` | 从继承的工具里去掉哪些 |
| `model` | `sonnet`、`opus`、`haiku`、`fable`、完整模型 ID，或 `inherit`（跟主对话一致） |
| `permissionMode` | 子代理的权限模式，如 `plan`、`acceptEdits` |
| `maxTurns` | 最多执行多少轮，到了就交回部分结果 |
| `skills` | 启动时预先加载的技能（完整内容会注入） |
| `mcpServers` | 只给这个子代理用的 MCP 服务器 |
| `memory` | 持久记忆范围：`user`、`project`、`local` |
| `isolation` | 设为 `worktree` 时在临时 git worktree 里工作，没改动会自动清理 |
| `effort` | 推理强度 |

**模型怎么决定：**按顺序取第一个有值的——本次调用时 Claude 传的 model 参数 → 子代理文件里的 `model` → 环境变量 `CLAUDE_CODE_SUBAGENT_MODEL` → 主对话的模型。想把所有子代理统一跑在某个便宜模型上，在设置的 `env` 里同时设 `CLAUDE_CODE_SUBAGENT_MODEL` 和 `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1`。运行中用 `/tasks` 可以看到每个子代理实际用的模型。

## 第三步：调用子代理

**1. 自然语言点名**（Claude 决定要不要委派）：

```text
用 test-runner 子代理把失败的测试修好
让 code-reviewer 子代理看看我最近的改动
```

**2. @ 提及**（保证这次一定用它）：输入 `@` 从列表里选，或手动输入 `@agent-code-reviewer 看一下登录模块的改动`。

**3. 整个会话都用它：**

```bash
claude --agent code-reviewer
```

此时主线程直接采用它的工具限制、模型和系统提示词。想在某个项目里默认这样，在 `.claude/settings.json` 写 `"agent": "code-reviewer"`。

**前台与后台：**前台子代理会阻塞主对话直到完成；后台子代理和你并行工作，需要权限时会在主会话里弹出确认并标明是哪个子代理在问。交互式会话里默认后台运行；按 `Ctrl+B` 可以把正在运行的任务放到后台。

## 官方推荐的几种用法

- **隔离大量输出**：「用一个子代理跑完整测试，只汇报失败的用例和报错信息」。测试日志留在子代理里，主对话只拿到结论。
- **并行调研**：「分别用独立的子代理并行研究认证、数据库、API 三个模块」。适合彼此不依赖的调查。
- **串联**：「先用 code-reviewer 找性能问题，再用 optimizer 子代理修掉」。
- **限制权限**：只读的审查员、只能跑 SELECT 的数据库查询员（官方示例用 PreToolUse Hook 拦截写操作）。
- **控制成本**：把简单、量大的工作交给用 Haiku 的子代理。

什么时候**不要**用子代理（官方建议留在主对话）：需要频繁来回沟通、多个阶段共享大量上下文、只是改一个小地方、对响应速度敏感（子代理从零开始，要花时间收集上下文）。对已经在对话里的内容提个小问题，用 `/btw` 更合适。想复用的是一段提示词或流程而不是隔离环境，用 Skills。

## 常见问题

**Q：新建的子代理 Claude 找不到？**
检查文件开头第一行就是 `---`、有 `name` 和 `description`、YAML 能正常解析；`agents` 目录是本次会话中途新建的话要重启。用 `claude --debug` 启动可以在调试日志里看到被跳过的原因。

**Q：一次能同时跑多少个子代理？**
官方默认同一会话最多 20 个子代理同时运行，再开会报 `Concurrent subagent limit reached`，等数量降下来才能继续；可以用环境变量 `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS` 调整。会话总共能开多少个没有上限。

**Q：子代理会不会更费额度？**
会。每个子代理都在消耗 token，并且结果回到主对话也占上下文。并行开很多个、每个都返回长篇结果，消耗会明显变快。额度规则详见本站《Claude 使用限制与额度：用量怎么看、什么时候重置（Free / Pro / Max / Claude Code）》。

**Q：插件带的子代理为什么不能配 hooks / mcpServers？**
官方出于安全考虑，插件子代理会忽略 `hooks`、`mcpServers`、`permissionMode` 三个字段。需要的话把文件复制到 `.claude/agents/` 或 `~/.claude/agents/`。

**Q：子代理、后台会话、Agent Teams 有什么区别？**
子代理在一个会话内部工作、向主对话汇报；后台会话是多个独立会话并行；Agent Teams 是由 Claude 创建并监督的一组会话互相协作。规模越大越往后选，详见官方《Run agents in parallel》。

## 参考资料

- Create custom subagents（官方）：https://code.claude.com/docs/en/sub-agents
- Run agents in parallel（官方）：https://code.claude.com/docs/en/agents
- Orchestrate teams of Claude Code sessions（官方）：https://code.claude.com/docs/en/agent-teams
- Configure permissions（官方）：https://code.claude.com/docs/en/permissions
