---
title: Gemini CLI Skills 使用教程：技能目录、/skills 命令、从 GitHub 安装与自己创建
slug: gemini-cli-skills-install-create
products: [gemini]
models: []
topics: [ai-agent]
accountTier: FREE
excerpt: Gemini CLI 的 Skills 怎么安装和使用？按官方文档讲清四层技能来源与优先级、.gemini/skills 与 .agents/skills 两套目录、/skills 命令和 gemini skills install、激活时的确认步骤，以及怎么创建技能。
checkedOn: 2026-10-30
sources:
  - https://geminicli.com/docs/cli/skills
  - https://geminicli.com/docs/cli/creating-skills
  - https://agentskills.io/specification
verify:
  - 官方页面没有写明技能功能的最低版本要求，用不了时先升级 Gemini CLI
  - --path 参数官方只说明用于指定 Git 仓库内技能所在的子目录，没有给出示例
  - 官方文档页顶写明：「Unpaid tier and Google One users: Gemini CLI was replaced by Antigravity CLI on June 18th, 2026」；页面没有说明哪些账号类型还能继续用 Gemini CLI，也提示 Gemini CLI 没有针对 Gemini 4 Argon 优化、建议用 Antigravity。本文的技能目录、命令仍按官方 Gemini CLI 技能页当天的写法，是否适用于你的账号，以官方说明为准
  - 打包命令 node scripts/package_skill.cjs 出自官方「创建技能」页面，脚本所在位置以官方说明为准
---

> 本文根据 Gemini CLI 官方文档《Agent Skills》《Creating Agent Skills》整理，资料核对于 2026-10-30。**重要变化：** 官方文档页顶写明，免费（unpaid tier）和 Google One 用户的 Gemini CLI 已于 2026 年 6 月 18 日被 Antigravity CLI 取代；官方推荐改用 Antigravity，账号怎么分、怎么迁移见 [/guides/gemini-cli-how-to-use-antigravity-cli](/guides/gemini-cli-how-to-use-antigravity-cli)。下面讲的技能目录和命令，是官方 Gemini CLI 技能页现在仍然写着的内容，适用于仍在使用 Gemini CLI 的账号；哪些账号类型还能继续用，官方技能页没有写明，以官方公告为准。这里讲的是命令行工具 Gemini CLI 里的技能；Gemini App 里的 Skills（由 Gems 转来）是另一套东西，见[《Gemini Skills 怎么写》](/guides/gemini-skills-how-to-write)。

## 适用于谁

- 搜「gemini cli skills 使用」「gemini cli skills 安装」「gemini cli skills location」的人；
- 已经有一批 `SKILL.md` 技能，想在 Gemini CLI 里复用的人；
- 分不清 `GEMINI.md` 和技能该各放什么的人。

## 结论先说

1. **技能是按需加载的**。官方的区分：`GEMINI.md` 提供常驻的工作区背景，技能只在任务需要时加载，用来让上下文保持精简。
2. **用户级目录是 `~/.gemini/skills/`，工作区级是 `.gemini/skills/`**；两级都另有一个别名目录 `.agents/skills/`，并且**同一级里 `.agents/skills/` 优先于 `.gemini/skills/`**。
3. **优先级从低到高**：内置技能 → 扩展带来的技能 → 用户技能 → 工作区技能。同名时高的覆盖低的。
4. **激活前会问你**。模型要用某个技能时会弹出确认，显示技能名称、用途和它将访问的目录，你同意后才加载。
5. **从 Git 仓库安装一条命令**：`gemini skills install <仓库地址>`。

## 一、技能的生命周期

官方描述的四步：

1. **发现**：会话开始时，Gemini CLI 扫描各层目录，加载每个已启用技能的名称和描述；
2. **激活**：任务和某个技能匹配时，模型调用 `activate_skill` 工具；
3. **确认**：你会看到一个确认提示，包含技能的名称、用途和它要访问的目录；
4. **注入**：同意后，技能的 `SKILL.md` 正文和文件夹结构加入对话，技能目录成为允许访问的路径。

第四步有个要留意的地方：官方写明，技能被激活后，模型获得对**整个技能目录**的访问权，之后可以在你批准的前提下运行其中的脚本。所以确认提示不要习惯性地直接同意，来源不明的技能先看内容。

## 二、技能目录与优先级

| 层级（低 → 高） | 位置 |
| --- | --- |
| 内置技能 | 随 Gemini CLI 提供 |
| 扩展技能 | 由已安装的扩展带来 |
| 用户技能 | `~/.gemini/skills/` 或 `~/.agents/skills/` |
| 工作区技能 | `.gemini/skills/` 或 `.agents/skills/`，随版本控制共享 |

- 同名技能，高层级覆盖低层级；
- 在用户级或工作区级内部，`.agents/skills/` 优先于 `.gemini/skills/`。

`.agents/skills/` 这个别名的好处是可以和其他工具共用一份：Codex、Cursor 等也读这个目录，团队里用不同工具的人不必各维护一套。

## 三、会话里的 /skills 命令

| 命令 | 作用 |
| --- | --- |
| `/skills list [all] [nodesc]` | 列出已发现的技能；`all` 连内置技能一起列出，`nodesc` 隐藏描述 |
| `/skills link <path> [--scope user\|workspace]` | 从本地目录链接技能 |
| `/skills enable <name>` | 启用某个技能 |
| `/skills disable <name>` | 停用某个技能 |
| `/skills reload`（或 `/skills refresh`） | 重新扫描各层目录，刷新技能列表 |

`enable` 和 `disable` 默认作用于用户范围；只想对当前项目生效时加 `--scope workspace`。

新建或修改了技能文件之后，运行一次 `/skills reload`，再用 `/skills list` 确认它出现在列表里。

## 四、终端里的 gemini skills 命令

官方页面给出的三条示例：

```bash
gemini skills list --all
gemini skills install https://github.com/user/repo.git --consent
gemini skills uninstall my-skill --scope workspace
```

- `install` 接受 Git 仓库地址或本地目录；
- `--scope`：`user`（全局，默认）或 `workspace`（只在当前项目）；
- `--path`：技能不在仓库根目录时，指定它在仓库里的子目录；
- `--consent`：跳过安装时的安全确认。

`--consent` 是给自动化脚本用的。手动安装别人的技能时不要加，留着那一步确认；更稳妥的做法是先把仓库克隆下来读一遍，再从本地目录安装。检查要点见[《Skill 安全吗：安装前检查什么》](/guides/agent-skills-security-audit-before-install)。

## 五、创建自己的技能

**方式一：用内置的 skill-creator。** 官方称这是最快的办法：直接用自然语言让 Gemini CLI 帮你做一个技能，它会搭好文件夹和文件。

**方式二：手写。**

1. 新建一个目录，工作区技能放在项目的 `.gemini/skills/` 下并提交，个人技能放在 `~/.gemini/skills/` 下；
2. 在目录里创建 `SKILL.md`，frontmatter 必须有 `name` 和 `description`。官方把 `description` 标为关键，因为 Gemini 靠它决定何时激活；
3. 需要的话加上 `scripts/`、`references/`、`assets/`。

官方示例：

```markdown
---
name: code-reviewer
description: Reviews code changes for bugs and style. Use when the user asks to "review" code.
---
Instructions for the agent go here.
```

4. 在会话里运行 `/skills`，确认技能已被正确加载。

技能里带脚本时，模型在技能激活后可以运行它们，官方举的例子是 `node .gemini/skills/code-reviewer/scripts/review.js index.js`，执行前仍需要你批准。

SKILL.md 的详细写法见[《SKILL.md 怎么写》](/guides/skill-md-format-spec-how-to-write)，目录怎么拆见[《Skill 目录结构怎么组织》](/guides/skill-directory-structure-scripts-references)。

## 六、分享技能

官方列了三种途径：

- **放进仓库**：把技能提交到项目的 `.gemini/skills/`，同事拉代码就有了；
- **做成独立的 Git 仓库**：别人用 `gemini skills install <url>` 安装；
- **打包**：官方文档提到用 `node scripts/package_skill.cjs <path/to/skill>` 生成一个 `.skill` 压缩包；也可以把技能放进扩展里一起分发。

## 常见问题

**Q：技能放好了但列表里没有？**
依次检查：文件名是不是 `SKILL.md`、frontmatter 里 `name` 和 `description` 是否齐全、目录层级是否为「技能目录 / 技能名 / SKILL.md」、是否被 `/skills disable` 停用过，然后运行 `/skills reload`。

**Q：技能在列表里，但模型不用它？**
问题通常在 `description`。写清做什么和什么时候用，思路见[《Skill 不触发怎么办》](/guides/skill-not-triggering-description-optimize)。

**Q：`.gemini/skills/` 和 `.agents/skills/` 里有同名技能，用哪个？**
按官方说明，同一层级里 `.agents/skills/` 优先。

**Q：Claude Code 的技能能用吗？**
格式都遵循同一份开放规范，把技能文件夹复制到上述目录即可加载。Claude Code 专有的 frontmatter 字段在这里不起作用。Gemini CLI 的官方文档没有把 `.claude/skills/` 列为扫描目录。

## 参考资料

- Agent Skills（Gemini CLI 官方文档）：https://geminicli.com/docs/cli/skills
- Creating Agent Skills（Gemini CLI 官方文档）：https://geminicli.com/docs/cli/creating-skills
- Specification（Agent Skills 官方规范）：https://agentskills.io/specification
