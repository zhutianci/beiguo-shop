---
title: CLAUDE.md 怎么写：最佳实践、模板与 AGENTS.md 的区别
slug: claude-md-agents-md
products: [claude, codex]
models: []
accountTier: PLUS
excerpt: CLAUDE.md 是什么、放在哪、写什么不写什么？附可复制模板，并讲清 AGENTS.md 是什么、Claude Code 和 Codex 分别怎么读这两个文件，以及一个仓库里怎么让两者共存。
checkedOn: 2026-10-07
sources:
  - https://code.claude.com/docs/en/memory
  - https://code.claude.com/docs/en/best-practices
  - https://code.claude.com/docs/en/features-overview
  - https://support.claude.com/en/articles/14552983-models-usage-and-limits-in-claude-code
  - https://claude.com/blog/using-claude-md-files
  - https://agents.md/
  - https://learn.chatgpt.com/docs/agent-configuration/agents-md
verify:
  - Claude Code 直接读取 AGENTS.md 需要 v2.1.277 及以上（官方文档写法），站长可在自己的版本上确认启动时是否出现「AGENTS.md loaded」提示
  - /doctor prompt-audit 需要 v2.1.283 及以上，旧版本没有该命令
  - Codex 默认的 project_doc_max_bytes 为 32 KiB（官方文档），后续版本可能调整
---

> 本文根据 Claude Code 官方文档（记忆 / 最佳实践）、Anthropic 官方博客、AGENTS.md 官网和 OpenAI Codex 官方文档整理，核对日期 2026-10-07。图片为 Claude Code 官方文档配图和 AGENTS.md 官网首页截图，图下注明出处。

## 适用于谁

- 已经在用 Claude Code（入门可先看本站《Claude Code 中文入门教程》），跑过 `/init`，但不知道生成的 CLAUDE.md 该怎么改的人；
- 发现 Claude「总是记不住项目规矩」、同一个错误反复犯的人；
- 团队里有人用 Claude Code、有人用 Codex 或 Cursor，想只维护一份说明文件的人。

## 结论先说

1. **CLAUDE.md 是写给 Claude 的项目说明书**，每次会话开始时自动读入。它是「上下文」，不是强制配置：要绝对禁止某个操作，用权限规则或 hooks。
2. **短、具体、可验证**：官方建议每个文件控制在 200 行以内；每写一行都问自己「删掉这行，Claude 会不会犯错？」不会就删。
3. **只写 Claude 自己看代码推不出来的东西**：构建 / 测试命令、和默认习惯不同的代码规范、分支和提交约定、环境上的坑。
4. **AGENTS.md 是跨工具的开放格式**，Codex、Cursor、Gemini CLI 等都支持。2026 年的 Claude Code（v2.1.277 起）在仓库里没有 CLAUDE.md 时会直接读 AGENTS.md；两个都有时默认只读 CLAUDE.md。
5. **两个都要用时**：公共内容写进 AGENTS.md，CLAUDE.md 第一行写 `@AGENTS.md` 导入，下面只补 Claude 专属的内容。

## 一、CLAUDE.md 放在哪：四个位置

| 范围 | 位置 | 适合写什么 | 谁能看到 |
| --- | --- | --- | --- |
| 组织策略 | macOS `/Library/Application Support/ClaudeCode/CLAUDE.md`；Linux / WSL `/etc/claude-code/CLAUDE.md`；Windows `C:\Program Files\ClaudeCode\CLAUDE.md` | 公司统一的规范、安全与合规要求 | 这台机器上所有用户 |
| 个人全局 | `~/.claude/CLAUDE.md` | 你自己在所有项目里的偏好 | 只有你 |
| 项目 | `./CLAUDE.md` 或 `./.claude/CLAUDE.md` | 架构、规范、常用命令，提交到 Git 与团队共享 | 团队 |
| 项目内个人 | `./CLAUDE.local.md`（记得加进 `.gitignore`） | 你本地的测试地址、个人测试数据 | 只有你 |

加载规则要点（官方文档）：

- 启动时会读取当前目录**以及所有上级目录**里的 CLAUDE.md / CLAUDE.local.md，内容是**拼接**而不是互相覆盖，离你启动目录越近的越晚读到；同一层里 CLAUDE.local.md 排在 CLAUDE.md 后面。
- 子目录里的 CLAUDE.md 不在启动时加载，Claude 读写那个子目录里的文件时才会带上。
- 块级 HTML 注释 `<!-- ... -->` 会在注入前被去掉，适合给人类维护者留备注而不占上下文。
- 想确认读到了哪些文件：会话里运行 `/context`，看「Memory files」一栏。

![官方示意图：CLAUDE.md 在会话开始时完整加载、每次请求都在上下文里；技能（Skills）平时只加载描述、用到时才加载全文；子代理在独立上下文中运行](seed:g19-context-loading.png)
*图片来源：[Claude Code 官方文档《Extend Claude Code》](https://code.claude.com/docs/en/features-overview)*

这张图也说明了为什么 CLAUDE.md 要短：它**每一轮请求都会带上**。只在部分场景才需要的长流程，应该写成技能（Skill），或者放进按路径生效的规则里。

## 二、该写什么、不该写什么

官方最佳实践给出的对照（整理翻译）：

| 应该写 | 不该写 |
| --- | --- |
| Claude 猜不到的命令（构建、测试、启动） | 读代码就能看出来的东西 |
| 和语言默认习惯不同的代码规范 | 语言通用规范（Claude 本来就知道） |
| 测试方法、首选的测试命令 | 详细的 API 文档（放链接即可） |
| 仓库约定（分支命名、PR 规范） | 经常变化的信息 |
| 项目特有的架构决定 | 长篇解释和教程 |
| 开发环境的坑（必需的环境变量等） | 逐个文件的说明 |
| 不明显的陷阱和特殊行为 | 「写干净的代码」这类空话 |

写法上的四条建议：

- **写成能检查的句子**：写「用 2 个空格缩进」而不是「代码格式要规范」；写「提交前运行 `npm test`」而不是「记得测试」；写「接口处理函数放在 `src/api/handlers/`」而不是「文件要组织好」。
- **用标题和列表分组**，比大段文字更容易被遵守。
- **避免互相矛盾**：两条规则冲突时，Claude 可能随便选一条。定期检查根目录、子目录 CLAUDE.md 和 `.claude/rules/` 有没有打架。
- **强调要克制**：某一条总被忽略，可以只在那一行加「IMPORTANT」；到处都强调，等于都没强调。

什么时候往里加内容？官方给的信号是：Claude 第二次犯同一个错误；代码审查发现了它本该知道的项目约定；你在新会话里又打了一遍上次打过的纠正；新同事也需要知道同样的背景。帮助中心还建议「两次原则」：同一件事纠正到第二次再写进去，第一次往往只是偶然。

**不要把密钥、密码、数据库连接串写进 CLAUDE.md**。Anthropic 官方博客提醒，它会进入系统提示词，提交到仓库时应当当作可能公开的文档来对待。

## 三、可复制的 CLAUDE.md 模板

下面是按官方建议整理的骨架，方括号里换成你项目的实际内容，用不上的小节直接删掉：

```markdown
# 项目说明
[一句话：这是什么项目、给谁用]。技术栈：[框架 / 语言 / 数据库]。

## 常用命令
- 安装依赖：`[pnpm install]`
- 本地启动：`[pnpm dev]`
- 运行单个测试：`[pnpm test -- path/to/file]`（优先跑单个测试，不要每次跑全量）
- 类型检查：`[pnpm typecheck]`，一组改动完成后必须通过

## 目录约定
- `[src/api/]`：接口；`[src/lib/]`：工具函数；`[src/components/]`：界面组件
- 新增数据库字段先改 `[prisma/schema.prisma]`，再生成迁移

## 代码规范（只写和默认习惯不同的）
- [使用 ES Module（import/export），不用 require]
- [金额统一用「分」为单位的整数存储]

## 工作流程
- 改动超过 3 个文件时，先列出要改哪些文件、每个文件改什么，确认后再动手
- 提交信息格式：[feat: / fix: 开头，中文描述]
- 不要直接推送到 [main] 分支

## 已知的坑
- [本地需要环境变量 XXX_URL，示例见 .env.example]
- IMPORTANT: [不要修改 legacy/ 目录下的任何文件]

## 参考
- 接口约定见 @docs/api-conventions.md
```

用法提示：

- 先在项目里运行 `/init` 让 Claude 生成初稿（已有 CLAUDE.md 时它会提改进建议而不是覆盖），再对照模板删减补充。设置环境变量 `CLAUDE_CODE_NEW_INIT=1` 后，`/init` 会改为多轮问答式，可以一并设置技能和 hooks。
- 改完后开新会话，用 `/context` 确认已加载，再观察 Claude 的行为有没有真的改变——官方建议把 CLAUDE.md 当代码对待：出问题时回头看、定期删减。
- v2.1.283 及以后的版本可以运行 `/doctor prompt-audit`，让 Claude 检查指令文件里过时、矛盾或引用了不存在文件的内容，只出报告，不会擅自改文件。

## 四、文件变长了怎么办

- **`@` 导入**：在 CLAUDE.md 里写 `@docs/git-instructions.md` 就会把那个文件一起加载。相对路径以「写导入的那个文件」为基准，最多嵌套 4 层；放在反引号里的 `` `@README` `` 不会被导入。注意导入只是方便组织，**被导入的文件同样在启动时加载，不会省上下文**。
- **`.claude/rules/` 按主题拆分**：每个主题一个 `.md` 文件（如 `testing.md`、`security.md`）。在文件开头写 `paths` 字段，就只在 Claude 读写匹配的文件时才加载，例如：

```markdown
---
paths:
  - "src/api/**/*.ts"
---
# 接口开发规则
- 所有接口必须做参数校验
```

- **多步骤流程改成技能**：比如「发布流程」「写周报的格式」，做成 Skill 只在用到时加载。
- **别和自动记忆混淆**：Claude Code 还会自己记笔记（自动记忆，存在 `~/.claude/projects/<项目>/memory/`，索引文件 MEMORY.md 每次只加载前 200 行或 25KB）。CLAUDE.md 是你写的规则，自动记忆是 Claude 从你的纠正里学到的东西，两者都在会话开始时加载，用 `/memory` 可以查看和编辑。

## 五、AGENTS.md 是什么

AGENTS.md 是一个面向 AI 编程代理的开放格式，官网的说法是「给代理看的 README」：README 写给人看，AGENTS.md 放代理需要的构建步骤、测试命令和代码约定。它由 OpenAI Codex、Amp、Google Jules、Cursor、Factory 等共同推动，官网称已被 6 万多个开源项目采用，现由 Linux 基金会旗下的 Agentic AI Foundation 托管。

![AGENTS.md 官网首页：一个简单、开放的编码代理指引格式，右侧是示例文件](seed:g19-agentsmd-home.png)
*图片来源：[AGENTS.md 官网](https://agents.md/)（首页截图）*

它没有必填字段，就是普通 Markdown。常见小节：项目概览、构建和测试命令、代码风格、测试说明、安全注意事项、提交和 PR 规范。大型 monorepo 可以在每个子包里再放一个 AGENTS.md，代理会读离被修改文件最近的那个。

**Codex 怎么读 AGENTS.md**（OpenAI 官方文档）：

1. 全局：`~/.codex/AGENTS.md`（有 `AGENTS.override.md` 时优先用它）；
2. 项目：从 Git 根目录往下走到当前目录，每一层依次找 `AGENTS.override.md`、`AGENTS.md`，以及你在配置里设置的备用文件名，每层最多取一个；
3. 从上到下拼接，越靠近当前目录的越靠后、优先级越高；合计超过 `project_doc_max_bytes`（默认 32 KiB）就不再追加。

Codex CLI 里运行 `/init` 会生成 AGENTS.md（见本站《Codex 入门教程》）。

## 六、CLAUDE.md 和 AGENTS.md 的区别

| | CLAUDE.md | AGENTS.md |
| --- | --- | --- |
| 定位 | Claude Code 专用的说明文件 | 跨工具的开放格式 |
| 谁会读 | Claude Code | Codex、Cursor、Gemini CLI、GitHub Copilot 编码代理等；Claude Code v2.1.277 起也会读（见下） |
| 全局个人文件 | `~/.claude/CLAUDE.md` | Codex 为 `~/.codex/AGENTS.md` |
| 本地私有文件 | `CLAUDE.local.md` | Codex 用 `AGENTS.override.md` 做覆盖；Claude Code 不读 `AGENTS.local.md`、`AGENTS.override.md` |
| 按路径生效的规则 | `.claude/rules/` + `paths` | 靠在子目录放多个 AGENTS.md |
| 导入其他文件 | 支持 `@路径` | Claude Code 读取时会展开其中的 `@路径`；其他工具以各自文档为准 |

**Claude Code 读取 AGENTS.md 的默认规则**（官方文档）：

- 仓库里只有 AGENTS.md、当前目录及以上都没有 CLAUDE.md / CLAUDE.local.md → 读 AGENTS.md，启动时会提示「no CLAUDE.md found; AGENTS.md loaded」；
- AGENTS.md 和 CLAUDE.md 都有 → **默认只读 CLAUDE.md**；
- 注意：`~/.claude/CLAUDE.md` 和 `.claude/rules/` 不影响这个判断，但只要项目里加了一个 `CLAUDE.local.md`，Claude 就不再读 AGENTS.md 了。

想改默认行为，在会话里运行 `/config`，把「Project instructions」设为：`claude-md-and-agents-md`（两个都读）、`claude-md`（只读 CLAUDE.md）或 `managed-only`。

## 七、一个仓库里怎么让两者共存

官方推荐的做法：把团队共用的内容放进 AGENTS.md，然后在旁边的 CLAUDE.md 里这样写：

```markdown
@AGENTS.md

## Claude Code 专属
- 修改 `src/billing/` 下的代码前先进入 plan 模式出方案
```

这样 Claude 先读 AGENTS.md，再读下面的补充，而且保留这个导入**不会导致重复读取**。如果不需要任何 Claude 专属内容，也可以用符号链接 `ln -s AGENTS.md CLAUDE.md`，但官方提醒：只要有人在 Windows 上克隆仓库，就改用 `@AGENTS.md` 导入——Windows 创建符号链接需要管理员权限或开发者模式，Git 默认还会把它检出成一个只有一行字的普通文件。

已经在 CLAUDE.md 里用文字写「请去读 AGENTS.md」的，建议改成 `@AGENTS.md` 导入：文字提示只有在 Claude 自己决定打开文件时才生效。从其他工具迁移时，`/init` 会参考 Cursor 规则（`.cursor/rules/`、`.cursorrules`）和 `.github/copilot-instructions.md`；`/import`（v2.1.213 起）可以把 Codex 等工具的配置一次性导入。

## 常见问题

**Q：CLAUDE.md 写了，Claude 还是不照做？**
官方给的排查方向：文件太长导致规则被淹没；措辞含糊（Claude 会就文件里已有答案的问题反问你）；多个文件互相矛盾。先精简，再把关键规则写成可检查的句子。必须强制执行的（比如禁止删某个目录），改用权限规则或 PreToolUse hook。

**Q：CLAUDE.md 有长度上限吗？**
官方建议每个文件 200 行以内；Claude Code 能完整加载最大 4 MiB 的 CLAUDE.md，再大就跳过，但越短遵守得越好。

**Q：中文写可以吗？**
官方没有语言要求，CLAUDE.md 就是普通 Markdown。命令、路径、文件名保持原样即可。

**Q：Codex 能读 CLAUDE.md 吗？**
Codex 默认找的是 AGENTS.md。官方文档提供了 `project_doc_fallback_filenames` 配置，可以把其他文件名加进备用列表；更省事的做法还是以 AGENTS.md 为主、CLAUDE.md 导入它。

## 参考资料

- Claude Code：CLAUDE.md、AGENTS.md 与自动记忆（官方）：https://code.claude.com/docs/en/memory
- Claude Code 最佳实践（官方）：https://code.claude.com/docs/en/best-practices
- Claude Code 扩展功能概览（官方，含上下文加载示意图）：https://code.claude.com/docs/en/features-overview
- Claude Code 模型、用量与 CLAUDE.md 精简建议（官方帮助中心）：https://support.claude.com/en/articles/14552983-models-usage-and-limits-in-claude-code
- Anthropic 博客《Using CLAUDE.md files》：https://claude.com/blog/using-claude-md-files
- AGENTS.md 官网：https://agents.md/
- OpenAI Codex：Custom instructions with AGENTS.md（官方）：https://learn.chatgpt.com/docs/agent-configuration/agents-md
