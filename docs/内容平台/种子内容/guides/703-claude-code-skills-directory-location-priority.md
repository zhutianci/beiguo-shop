---
title: Claude Code Skills 安装在哪里：个人、项目、嵌套、插件目录与同名优先级
slug: claude-code-skills-directory-location-priority
products: [claude]
models: []
topics: [ai-agent]
accountTier: PLUS
excerpt: Claude Code 的 Skills 安装目录在哪、放个人还是放项目？按官方文档讲清七种存放位置、同名时谁生效、monorepo 里嵌套 Skill 何时加载、改了要不要重启，以及控制谁能调用的 frontmatter 字段和 skillOverrides 设置。
checkedOn: 2026-10-11
sources:
  - https://code.claude.com/docs/en/skills
  - https://code.claude.com/docs/en/features-overview
verify:
  - 文中多处功能带最低版本要求（如 /add-dir 加载嵌套 Skill、/skill-doctor），版本号以官方文档为准
  - 企业托管目录的实际路径取决于操作系统和组织的部署方式
---

> 本文根据 Claude Code 官方文档《Extend Claude with skills》整理，资料核对于 2026-10-11。Skill 的基本概念和安装官方技能包的命令见[《Claude Skills 是什么、怎么装》](/guides/claude-skills)，本文只讲「放在哪、谁优先、谁能调用」。

## 适用于谁

- 搜「claude code skills 安装目录」「claude code skills 安装在哪里」「claude code skills 目录结构」的人；
- 个人目录和项目目录里有同名 Skill，不确定哪个在生效的人；
- 在 monorepo 的子目录里放了 Skill 却在菜单里找不到的人。

## 结论先说

1. **自己用，放 `~/.claude/skills/技能名/SKILL.md`**；**团队共用，放仓库里的 `.claude/skills/技能名/SKILL.md`** 并提交。
2. **同名时：企业 > 个人 > 项目**。个人目录和项目目录里都有 `deploy`，`/deploy` 运行的是个人那一份。
3. **插件里的 Skill 带命名空间**（`/插件名:技能名`），不会和别的冲突。
4. **改了不用重启**。Claude Code 会监视 Skill 目录，新增、修改、删除在当前会话内生效；唯一要手动处理的是会话中途新建了顶层 skills 目录，这时运行 `/reload-skills`。
5. **子目录里的嵌套 Skill 是懒加载的**：Claude 第一次读或改那个子目录里的文件时才出现。

## 一、七种存放位置

| 位置 | 路径 | 在哪里生效 |
| --- | --- | --- |
| 企业 | 托管设置目录下的 `.claude/skills/<skill-name>/SKILL.md` | 组织部署到的所有机器、所有用户 |
| 个人 | `~/.claude/skills/<skill-name>/SKILL.md` | 这台电脑上你的所有项目（不含 Cowork 和云端会话） |
| 项目 | `.claude/skills/<skill-name>/SKILL.md` | 在这个仓库里启动的会话 |
| 嵌套 | `<subdir>/.claude/skills/<skill-name>/SKILL.md` | 在该子目录或其下启动的会话 |
| 附加目录 | 用 `--add-dir` 传入的目录里的 `.claude/skills/` | 当次会话 |
| 插件 | `<plugin>/skills/<skill-name>/SKILL.md` | 启用了该插件的地方，以 `/plugin-name:skill-name` 调用 |
| claude.ai 账号 | 你在 claude.ai 上启用的技能 | Cowork、云端会话，以及用该账号登录的终端会话 |

Windows 上的 `~` 指用户主目录。

两个保留名称：不要把 Skill 文件夹命名为 `synced`（那是 claude.ai 同步下来的技能所在的子目录）；`anthropic-skills` 以及以 `anthropic-skills:` 开头的名字在插件之外不会加载。

用符号链接指向别处的 Skill 文件夹也可以，Claude Code 会跟随链接；多个位置指向同一个目标时只加载一次。

## 二、同名时谁生效

官方列出的规则：

- **企业 > 个人 > 项目**；
- **项目根目录的 Skill 和嵌套 Skill 都会加载**。同名时 `/deploy` 运行根目录那一份，嵌套的那一份用带路径的名字调用，如 `/apps/web:deploy`；
- **插件 Skill 和非插件 Skill 都会加载**，因为插件 Skill 带命名空间；
- **Skill 和 `.claude/commands/` 里的同名文件**：Skill 生效；
- **自己的 Skill 和内置命令同名**：在本地终端会话里，Skill 会替换同名的内置命令，但不替换它的别名。官方举的例子：项目里一个叫 `usage` 的 Skill 会替换 `/usage`，而 `/cost` 仍然运行内置命令。

第一条容易和直觉相反：很多人以为项目级配置会覆盖个人配置，Skill 这里是个人优先。团队 Skill 不生效时，先查自己的 `~/.claude/skills/` 里有没有同名的。

## 三、monorepo 和子目录

- 启动时，Claude Code 从**启动目录一路向上到仓库根目录**，加载每一层的 `.claude/skills/`；
- 启动目录**之下**的子目录里的 Skill 属于嵌套 Skill，要等 Claude 第一次读取或编辑该子目录里的文件才加载，在那之前 `/` 菜单里看不到；
- 想提前加载，运行 `/add-dir <subdir>`；
- 在链接的 git worktree 里，向上查找到 worktree 根目录为止。

`--add-dir` 传入的目录会加载其中的 `.claude/skills/`、`.claude/commands/` 和 `.claude/agents/`。其中只有 skills 目录会被持续监视，另外两个改了需要重启。官方还特别区分了一点：设置里的 `permissions.additionalDirectories` 只是授予文件访问权限，**不会**加载任何 Skill。

## 四、改了之后要不要重启

| 情况 | 需要做什么 |
| --- | --- |
| 在已有的 skills 目录里新增、修改、删除 Skill | 不用做，会话内自动生效（bare 模式除外） |
| 会话中途新建了一个启动时不存在的顶层 skills 目录 | 运行 `/reload-skills`；之后该目录再有变化也要再运行一次 |
| 改的是插件里的 hooks、`.mcp.json`、agents 等 | 运行 `/reload-plugins` |

注意一个细节：Skill 的内容在调用时加载进对话，之后**不会重读文件**。所以你在会话中途改了某个已经调用过的 Skill，要重新调用一次才会用上新内容。

## 五、控制谁能调用

默认情况下，你可以用 `/技能名` 调用，Claude 也可以自动调用。两个 frontmatter 字段可以改变这一点：

| frontmatter | 你能调用 | Claude 能调用 | 进入上下文的内容 |
| --- | --- | --- | --- |
| （默认） | 能 | 能 | 描述始终在；调用时加载全文 |
| `disable-model-invocation: true` | 能 | 不能 | 描述不进上下文 |
| `user-invocable: false` | 不能 | 能 | 描述始终在 |

- **有副作用的流程**（部署、发布、发消息）用 `disable-model-invocation: true`：只在你点名时运行，平时也不占上下文；
- **纯背景知识**用 `user-invocable: false`：不出现在 `/` 菜单里，只由 Claude 在需要时读取。

手动调用的写法也有讲究：`/deploy staging` 放在消息**开头**才会直接运行；写成「go ahead and /deploy to staging」只是授权，不会直接运行。

## 六、不改文件也能调整：skillOverrides

别人写的 Skill、插件之外同步来的 Skill，不方便改它的文件，可以在设置里覆盖可见性。输入 `/skills` 打开列表，按空格在几种状态之间切换，按 Esc 保存到 `.claude/settings.local.json` 的 `skillOverrides`。四个取值：

| 取值 | 含义 |
| --- | --- |
| `"on"` | 正常 |
| `"name-only"` | 只列名称，不列描述，用来节省上下文 |
| `"user-invocable-only"` | 只能你手动调用 |
| `"off"` | 关闭 |

官方注明插件里的 Skill 不受这个设置影响，插件 Skill 在插件管理里启停。

## 七、Claude Code 额外支持的 frontmatter 字段

除了开放规范里的字段，Claude Code 还认下面这些（节选自官方参考表）：

| 字段 | 作用 |
| --- | --- |
| `name` | `/` 菜单里的命令名，不写时默认用目录名 |
| `description` | 做什么、什么时候用；不写时取正文第一个非空行 |
| `when_to_use` | 补充的触发场景，在清单里接在 description 后面 |
| `argument-hint` | 自动补全时显示的参数提示，如 `[issue-number]` |
| `arguments` | 命名的位置参数，正文里用 `$name` 引用 |
| `allowed-tools` | 调用这一轮里免确认可用的工具 |
| `disallowed-tools` | Skill 生效期间移除的工具 |
| `model` / `effort` | 只对当前这一轮生效的模型和思考强度 |
| `context` | 设为 `fork` 时在分叉出的子代理里运行 |
| `agent` | 配合 `context: fork`，指定子代理类型，默认 `general-purpose` |
| `paths` | 用 glob 限定只在处理匹配文件时才自动启用 |
| `hooks` | 调用时注册、保留到会话结束的 Hook |
| `shell` | 正文里内联命令使用的 shell，`bash`（默认）或 `powershell` |

官方说明：不认识的字段会被静默忽略；布尔字段接受 `true` / `false`。这些扩展字段只在 Claude Code 里有效，上传到 claude.ai 或通过 API 使用时，多出来的键会直接报错，详见[《SKILL.md 怎么写》](/guides/skill-md-format-spec-how-to-write)。

正文里可用的变量包括 `$ARGUMENTS`（全部参数）、`$0` `$1`（按位置，从 0 开始）、`${CLAUDE_SKILL_DIR}`（SKILL.md 所在目录）、`${CLAUDE_PROJECT_DIR}`（项目根目录）等。引用 Skill 自带的脚本时用 `${CLAUDE_SKILL_DIR}`，不要写死绝对路径。

## 八、旧的 .claude/commands 还能用吗

能。官方说明：`.claude/commands/deploy.md` 和 `.claude/skills/deploy/SKILL.md` 都会创建 `/deploy`，已有的命令文件继续有效。Skill 多出来的是三样：可以带支持文件、可以控制谁能调用、可以被 Claude 自动加载。自定义命令的写法见[《Claude Code 斜杠命令大全》](/guides/claude-code-slash-commands)。

## 常见问题

**Q：个人 Skill 在 Cowork 或网页版的 Claude Code 里为什么没有？**
官方表格写明个人目录的 Skill 只在这台电脑上生效，不含 Cowork 和云端会话。那些环境用的是你 claude.ai 账号上启用的技能，或仓库里提交的项目 Skill。

**Q：怎么确认某个 Skill 到底加载没有？**
输入 `/skills` 看列表，或者直接问 Claude 现在有哪些 Skill 可用。在列表里却不被自动调用，见[《Skill 不触发怎么办》](/guides/skill-not-triggering-description-optimize)。

**Q：子代理里能用 Skill 吗？**
能，方式不同。子代理定义里的 `skills` 字段会在启动时把列出的 Skill **全文预加载**；没列出的项目、个人、插件 Skill，子代理仍可以通过 Skill 工具发现并调用。子代理的配置见[《Claude Code 子代理》](/guides/claude-code-subagents)。

**Q：权限规则里能限制 Skill 吗？**
可以。官方给的写法：`Skill(commit)` 精确匹配某个 Skill，`Skill(review-pr *)` 匹配带参数的调用，单写 `Skill` 则针对整个工具。

## 参考资料

- Extend Claude with skills（Claude Code 官方）：https://code.claude.com/docs/en/skills
- Extend Claude Code（Claude Code 官方）：https://code.claude.com/docs/en/features-overview
