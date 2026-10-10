---
title: npx skills add 怎么用：从 GitHub 安装 Skill、skills.sh 是什么与常用命令
slug: npx-skills-add-cli-install-skills
products: [ai-tools, claude]
models: []
topics: [ai-agent]
accountTier: FREE
excerpt: 网上的 Skill 安装命令大多是 npx skills add 开头，它是什么、装到哪去了？按官方 README 讲清 skills 命令行工具支持的来源写法、项目与全局两种范围、-a 指定工具、list / find / update / remove 等命令、软链接与复制的区别，以及怎么关掉遥测。
checkedOn: 2026-10-11
sources:
  - https://github.com/vercel-labs/skills
  - https://agentskills.io/specification
verify:
  - 支持的工具数量和各工具的安装路径会随版本变化，以官方 README 的表格为准
  - 本文命令均取自官方 README；运行 npx 会从 npm 下载并执行该工具，需要本机有 Node.js
  - skills.sh 上的技能由各自的作者发布，收录不等于经过安全审查
---

> 本文根据开源项目 vercel-labs/skills 的官方 README 整理，资料核对于 2026-10-11。`skills` 是 Vercel 实验室发布的一个命令行工具，不属于任何一家模型厂商；各工具自带的安装方式（如 Claude Code 的插件市场、Gemini CLI 的 `gemini skills install`）仍然可用。

## 适用于谁

- 搜「npx skills add」「skills.sh 如何使用」「skills.sh 是什么」「find skills 安装」的人；
- 在某个 Skill 仓库的 README 里看到一行 `npx skills add 某某/某某`，想知道它会做什么的人；
- 同时用 Claude Code、Codex、Cursor 等多个工具，想一次把技能装到所有工具里的人。

## 结论先说

1. **`skills` 是一个跨工具的技能管理命令行**：安装、列出、更新、删除 `SKILL.md` 技能，自动识别你机器上装了哪些编程智能体。
2. **最常用的一条**：`npx skills add owner/repo`，从 GitHub 仓库安装技能。
3. **默认装到当前项目**；加 `-g` 装到用户主目录，对所有项目生效。
4. **默认用软链接**，各工具的技能目录都指向同一份；不支持软链接时加 `--copy`。
5. **先看再装**：`--list` 可以只列出仓库里有哪些技能而不安装。

## 一、安装技能

```bash
npx skills add vercel-labs/agent-skills
```

`add` 接受的来源写法（官方 README 示例）：

```bash
# GitHub 简写（owner/repo）
npx skills add vercel-labs/agent-skills

# 完整的 GitHub 地址
npx skills add https://github.com/vercel-labs/agent-skills

# 指向仓库里某一个技能的路径
npx skills add https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines

# GitLab 地址
npx skills add https://gitlab.com/org/repo

# 任意 git 地址
npx skills add git@github.com:vercel-labs/agent-skills.git

# 本地路径
npx skills add ./my-local-skills
```

私有仓库用同样的命令，工具使用你已经配置好的仓库认证方式（Git 凭据助手、GitHub CLI 或 SSH）。

## 二、add 的常用参数

| 参数 | 含义 |
| --- | --- |
| `-g, --global` | 安装到用户目录，而不是当前项目 |
| `-a, --agent <agents...>` | 只装给指定的工具，如 `claude-code`、`codex` |
| `-s, --skill <skills...>` | 只装指定名称的技能；`'*'` 表示全部 |
| `-l, --list` | 只列出可用的技能，不安装 |
| `--copy` | 复制文件，而不是软链接到各工具目录 |
| `-y, --yes` | 跳过确认提示 |
| `--all` | 把所有技能装给所有工具，不做任何提示 |

官方示例：

```bash
# 先看仓库里有哪些技能
npx skills add vercel-labs/agent-skills --list

# 只装其中两个
npx skills add vercel-labs/agent-skills --skill frontend-design --skill skill-creator

# 只装给指定的工具
npx skills add vercel-labs/agent-skills -a claude-code -a opencode

# 非交互安装（CI 里用）
npx skills add vercel-labs/agent-skills --skill frontend-design -g -a claude-code -y
```

建议的顺序是先 `--list`，再用 `--skill` 点名安装需要的那几个。`--all` 和 `-y` 会跳过所有确认，装第三方仓库时不要用。

## 三、装到哪去了

| 范围 | 参数 | 位置 | 用途 |
| --- | --- | --- | --- |
| 项目 | （默认） | `./<agent>/skills/` | 随项目提交，和团队共享 |
| 全局 | `-g` | `~/<agent>/skills/` | 所有项目都可用 |

`<agent>` 因工具而异。官方表格里的部分行（核对于 2026-10-11）：

| 工具 | `--agent` 取值 | 项目路径 | 全局路径 |
| --- | --- | --- | --- |
| Claude Code | `claude-code` | `.claude/skills/` | `~/.claude/skills/` |
| Codex | `codex` | `.agents/skills/` | `~/.agents/skills/` |
| Cursor | `cursor` | `.agents/skills/` | `~/.cursor/skills/` |
| Gemini CLI | `gemini-cli` | `.agents/skills/` | `~/.gemini/skills/` |
| GitHub Copilot | `github-copilot` | `.agents/skills/` | `~/.copilot/skills/` |
| OpenCode | `opencode` | `.agents/skills/` | `~/.config/opencode/skills/` |
| Trae | `trae` | `.trae/skills/` | `~/.trae/skills/` |
| Qoder | `qoder` | `.qoder/skills/` | `~/.qoder/skills/` |

工具会自动检测你装了哪些智能体；一个都没检测到时会让你选。

**两种安装方式**

- **软链接（推荐）**：各工具的目录都链接到同一份规范副本，只有一个数据源，更新方便；
- **复制**：每个工具各有一份独立副本，用在不支持软链接的环境里，命令行加 `--copy`。

所在环境不支持软链接、创建失败时，加 `--copy` 改为复制。

## 四、其他命令

| 命令 | 作用 |
| --- | --- |
| `npx skills list`（别名 `ls`） | 列出已安装的技能；`-g` 看全局的，`-a` 按工具筛选 |
| `npx skills find [query]` | 交互式或按关键词搜索技能 |
| `npx skills update [skills]` | 更新已安装的技能；不带名称时更新全部 |
| `npx skills remove [skills]`（别名 `rm`） | 删除已安装的技能 |
| `npx skills init [name]` | 生成一个新的 `SKILL.md` 模板 |
| `npx skills use <source>` | 不安装，直接使用某一个技能 |

几个示例：

```bash
npx skills find typescript
npx skills ls -g
npx skills update my-skill
npx skills remove web-design-guidelines
npx skills init my-skill
```

`use` 的用法：不带 `--agent` 时把生成的提示词输出到标准输出，可以用管道交给某个工具；带 `--agent` 时直接启动那个工具并带上提示词。

```bash
npx skills use vercel-labs/agent-skills@web-design-guidelines | claude
```

## 五、它怎么在仓库里找技能

工具会在仓库里的这些位置查找：

- 仓库根目录（如果根目录就有 `SKILL.md`）；
- `skills/` 目录及其下的几个约定子目录；
- 各工具专属的目录，如 `.claude/skills/`、`.agents/skills/` 等；
- `.claude-plugin/marketplace.json` 或 `.claude-plugin/plugin.json` 里声明的技能。

标准位置里什么都没找到时，会做一次递归搜索。提示「No skills found」时，官方给的检查方向是：确认仓库里有合法的 `SKILL.md`，并且 frontmatter 里有 `name` 和 `description`。

## 六、跨工具的兼容性

官方 README 的说明：技能遵循共同的 Agent Skills 规范，所以大多数可以跨工具使用，但有些特性是工具专有的：

- `allowed-tools`：多数列出的工具支持，个别不支持；
- `context: fork`：只有 Claude Code 支持；
- Hooks：只有少数几个工具支持。

也就是说，这个命令行能把文件放到正确的位置，但不保证技能里的每个特性在每个工具里都生效。

## 七、遥测与环境变量

官方说明：命令行会收集匿名的使用数据，不收集个人信息；只有当 GitHub 确认仓库是公开的，才会发送仓库和技能的标识。

| 环境变量 | 作用 |
| --- | --- |
| `DISABLE_TELEMETRY` | 关闭匿名使用遥测 |
| `DO_NOT_TRACK` | 关闭遥测的另一种方式 |
| `GITHUB_TOKEN` / `GH_TOKEN` | 可选，用于 GitHub API 请求的令牌 |

在公司内网或处理私有仓库时，设 `DISABLE_TELEMETRY=1` 再使用。

## 八、skills.sh 是什么

skills.sh 是和这个命令行配套的技能目录网站，官方 README 对它的介绍只有一句：在那里发现可以安装的技能。上面的条目来自各个作者自己的仓库。

被收录、排名靠前都不代表安全。技能可以带脚本，也可以在说明里指示智能体执行命令，安装前把 `SKILL.md` 和脚本读一遍，见[《Skill 安全吗：安装前检查什么》](/guides/agent-skills-security-audit-before-install)。本站也整理了一批讨论和使用较多的技能库，见 [Skill 库](/skills)。

## 常见问题

**Q：必须用这个工具才能装技能吗？**
不是。技能就是文件夹，手动复制到对应目录效果一样。这个工具省的是「同一份技能装给多个工具」和「后续更新」的功夫。

**Q：装好了但工具里看不到？**
官方的三个检查方向：安装路径对不对、那个工具自己的技能加载文档怎么说、YAML frontmatter 是否合法。各工具的目录见[《Claude Code Skills 安装在哪里》](/guides/claude-code-skills-directory-location-priority)、[《Codex Skills 怎么用》](/guides/codex-skills-how-to-use-install)、[《Cursor Skills 使用教程》](/guides/cursor-skills-how-to-use-config)。

**Q：提示没有写入权限？**
确认对目标目录有写权限；项目范围装在当前目录下，全局范围装在用户主目录下。

**Q：怎么卸载干净？**
`npx skills remove 技能名` 删除指定技能，加 `-g` 针对全局范围，加 `-a` 针对指定工具。

## 参考资料

- vercel-labs/skills（官方仓库与 README）：https://github.com/vercel-labs/skills
- Specification（Agent Skills 官方规范）：https://agentskills.io/specification
