---
title: Cursor Skills 使用教程：技能目录、SKILL.md 字段、/ 调用与规则迁移
slug: cursor-skills-how-to-use-config
products: [cursor]
models: []
topics: [ai-agent]
accountTier: FREE
excerpt: Cursor 的 Skills 怎么配置、放在哪、怎么安装？按 Cursor 官方文档讲清项目级与用户级技能目录（含兼容 .claude 和 .codex 的目录）、SKILL.md 的字段、自动与手动调用、用 paths 限定范围、从 GitHub 安装的方式，以及用 /migrate-to-skills 把旧规则和命令转成技能。
checkedOn: 2026-10-11
sources:
  - https://cursor.com/docs/skills
  - https://agentskills.io/specification
verify:
  - Customize 侧边栏、Sync Skills for Cloud Agents 等入口名称来自官方英文文档，中文界面的叫法以实际为准
  - /migrate-to-skills 官方注明自 2.4 版本起内置
  - 从 GitHub 安装技能需要仓库带 .cursor-plugin/marketplace.json，插件的制作方法见官方 Plugins 文档
---

> 本文根据 Cursor 官方文档《Agent Skills》整理，资料核对于 2026-10-11。没有登录 Cursor 账号操作，界面入口名称取自官方文档原文，以实际界面为准。Cursor 的规则文件怎么写见[《Cursor Rules 怎么写》](/guides/cursor-rules-project-rules-mdc)。

## 适用于谁

- 搜「cursor skills 使用教程」「cursor skills 配置」「cursor skills 安装」的人；
- 已经在 Claude Code 或 Codex 里攒了一批技能，想让 Cursor 也用上的人；
- 分不清 Cursor 里规则（Rules）、命令和技能各管什么的人。

## 结论先说

1. **技能放在 `.agents/skills/` 或 `.cursor/skills/`**（项目级），个人级是 `~/.agents/skills/` 或 `~/.cursor/skills/`。
2. **Cursor 会直接读 Claude Code 和 Codex 的技能目录**：`.claude/skills/`、`.codex/skills/` 以及它们在主目录下的对应位置，都在兼容列表里，不用复制。
3. **两种调用**：智能体判断相关时自动使用；或者在 Agent 对话框里输入 `/` 选择技能，只对这一条消息生效。
4. **`disable-model-invocation: true`** 让技能只能手动调用；**`paths`** 让技能只在处理匹配的文件时出现。
5. **旧的规则和斜杠命令可以用 `/migrate-to-skills` 一键转成技能**。

## 一、技能目录

| 级别 | 目录 |
| --- | --- |
| 项目级 | `.agents/skills/`、`.cursor/skills/` |
| 用户级（本机全局） | `~/.agents/skills/`、`~/.cursor/skills/` |
| 兼容目录 | `.claude/skills/` 和 `~/.claude/skills/`；`.codex/skills/` 和 `~/.codex/skills/` |

每个技能是一个包含 `SKILL.md` 的文件夹，例如 `.agents/skills/my-skill/SKILL.md`。可选的子目录和开放规范一致：`scripts/`（智能体可以运行的代码）、`references/`（按需加载的补充文档）、`assets/`（模板、图片、数据文件）。

**嵌套和 monorepo**：

- Cursor 会递归遍历技能根目录，找到其中任何位置的 `SKILL.md`。中间用来分类的文件夹只起整理作用，技能的名称取自它自己所在的文件夹；
- 子项目文件夹里自己的 `.cursor/skills/` 或 `.agents/skills/` 也会被识别，并且那些技能只对该文件夹内的文件生效，不需要再写 `paths`。

## 二、SKILL.md 的字段

| 字段 | 必填 | 含义 |
| --- | --- | --- |
| `name` | 是 | 标识符，小写字母、数字、连字符；必须和上级文件夹同名 |
| `description` | 是 | 做什么、什么时候用；智能体靠它判断是否相关 |
| `paths` | 否 | glob 模式，限定技能只对匹配的文件生效；可以写逗号分隔的字符串或列表 |
| `globs` | 否 | 旧技能的兼容写法，新技能用 `paths` |
| `disable-model-invocation` | 否 | 为 `true` 时只有输入 `/技能名` 才运行 |
| `icon`、`color` | 否 | 技能作为自定义模式使用时的徽标图标和颜色 |
| `metadata` | 否 | 任意键值对，放附加信息 |

一个最小示例（按官方字段说明编写）：

```markdown
---
name: api-conventions
description: Apply this project's REST API conventions. Use when adding or changing API routes, request validation, or error responses.
paths: "src/api/**/*.ts"
---

# 接口约定

- 路由文件放在 src/api/ 下，一个资源一个文件。
- 错误响应统一使用 { code, message } 结构。
```

SKILL.md 的通用写法见[《SKILL.md 怎么写》](/guides/skill-md-format-spec-how-to-write)。

## 三、怎么调用

| 方式 | 做法 | 生效范围 |
| --- | --- | --- |
| 自动 | Cursor 启动时发现技能，智能体判断相关时使用 | 由智能体决定 |
| 手动 | 在 Agent 对话框输入 `/`，选择技能 | 只对这一条消息 |
| 整个会话 | 把技能当作自定义模式使用，Mac 上按 Option+Enter，Windows 上按 Alt+Enter | 整个会话 |

想关掉自动调用，在 frontmatter 里加 `disable-model-invocation: true`。带有副作用的流程（发布、跑迁移）适合这样设。

**用 `paths` 限定范围**：设成例如 `"**/*.py"`，技能只在智能体处理匹配的文件时才出现；对所有文件都适用的技能不要设这个字段。

## 四、查看和创建

- **查看**：打开侧边栏的 **Customize**，进入 **Skills**。插件带来的技能和项目技能与规则一起列在 **Agent Decides** 一组里；
- **创建**：手动新建文件夹和 `SKILL.md`，或者在对话里用内置的 `/create-skill`，它会生成文件夹结构和 `SKILL.md`。

## 五、从 GitHub 安装

官方文档的说法是：技能不能直接导入，要**打包在插件里**。步骤：

1. 打开 **Customize**，选择 **From GitHub Repository**。仓库里必须有 `.cursor-plugin/marketplace.json`；
2. 或者把仓库添加为团队的插件市场；
3. 安装插件，其中的技能会和其他技能一起出现在 Customize 里。

如果对方仓库只是一堆技能文件夹、没有做成 Cursor 插件，可以自己把需要的技能文件夹放进 `.cursor/skills/` 或 `.agents/skills/`。也可以用通用的命令行工具，见[《npx skills add 怎么用》](/guides/npx-skills-add-cli-install-skills)。无论哪种方式，装之前都先看一遍内容，见[《Skill 安全吗：安装前检查什么》](/guides/agent-skills-security-audit-before-install)。

## 六、把旧的规则和命令转成技能

内置的 `/migrate-to-skills` 会把符合条件的规则和斜杠命令转换成技能，输出在 `.cursor/skills/` 里，转换后要检查一遍。

| 会被转换 | 不会被转换 |
| --- | --- |
| 动态规则：`alwaysApply: false` 或未设置、并且没有 `globs` 的「Apply Intelligently」规则 | 设了 `alwaysApply: true` 的规则 |
| 用户级和工作区级的斜杠命令（转成带 `disable-model-invocation: true` 的技能） | 设了 `globs` 的规则 |
| | 用户规则（User Rules） |

从这张表也能看出 Cursor 对两者的分工：**始终生效、或者按文件类型固定生效的约束，留在规则里；由智能体判断何时使用的流程和知识，做成技能。**

## 七、云端智能体和同步

- `~/.cursor/skills/` 里的技能默认只在本机。要让云端智能体也能用，在 **Settings → Agents** 里打开 **Sync Skills for Cloud Agents**；
- `~/.agents/skills/` 和项目技能不参与这个同步；
- 同步的技能只属于你自己。要和同事共享，把技能发布到团队的插件市场，或者直接提交在仓库里。

## 常见问题

**Q：同一个技能，`.cursor/skills/` 和 `.claude/skills/` 各放一份会怎样？**
官方文档没有说明同名时的处理方式。保持一份即可：既然 Cursor 能读 `.claude/skills/` 和 `.agents/skills/`，多个工具共用的技能放一个目录就够了。

**Q：技能没有被自动使用？**
先输入 `/` 手动调用确认技能能被找到；再检查 `name` 是否和文件夹同名、有没有设 `disable-model-invocation`、`paths` 是否把当前文件排除在外；最后改 `description`，思路见[《Skill 不触发怎么办》](/guides/skill-not-triggering-description-optimize)。

**Q：技能和 MCP 有什么关系？**
技能是说明和脚本，MCP 是外部工具的连接。Cursor 里 MCP 的配置见[《Cursor MCP 配置教程》](/guides/cursor-mcp-config-json)。

**Q：子代理和技能是一回事吗？**
不是。Cursor 文档把它们分开介绍，子代理用 `/create-subagent` 创建，是带有专门角色的独立工作者。

## 参考资料

- Agent Skills（Cursor 官方文档）：https://cursor.com/docs/skills
- Specification（Agent Skills 官方规范）：https://agentskills.io/specification
