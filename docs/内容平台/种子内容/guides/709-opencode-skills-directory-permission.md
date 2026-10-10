---
title: OpenCode Skills 使用指南：技能目录、命名规则、权限配置与不加载排查
slug: opencode-skills-directory-permission
products: [ai-tools]
models: []
topics: [ai-agent]
accountTier: FREE
excerpt: OpenCode 的 Skills 放在哪个目录、怎么控制哪些技能能用？按 OpenCode 官方文档讲清六个扫描位置、name 的正则规则、skill 工具的工作方式、在 opencode.json 里用 allow / deny / ask 配置权限、按智能体覆盖，以及技能不出现时的五项检查。
checkedOn: 2026-10-11
sources:
  - https://opencode.ai/docs/skills/
  - https://agentskills.io/specification
verify:
  - metadata 里的 opencode/slash、opencode/autoinvoke 两个键出自官方文档当前版本，旧版本是否支持以官方说明为准
  - 本文没有涉及 OpenCode 的安装与模型配置，见其官方文档
---

> 本文根据 OpenCode 官方文档《Agent Skills》整理，资料核对于 2026-10-11。OpenCode 是一款开源的终端编程智能体，安装与模型配置以其官方文档为准，本文只讲技能。

## 适用于谁

- 搜「opencode skills 使用」「opencode skills 目录」「opencode skills 安装」的人；
- 想让 OpenCode 直接用上已有的 Claude Code 技能的人；
- 团队里想限制某些技能只能被特定智能体使用的人。

## 结论先说

1. **OpenCode 自己的目录是 `.opencode/skills/`（项目）和 `~/.config/opencode/skills/`（全局）**，同时也读 `.claude/skills/` 和 `.agents/skills/` 以及它们在主目录下的对应位置。
2. **`name` 规则严格**：1–64 个字符，小写字母和数字，单个连字符分隔，且必须和所在目录同名。
3. **技能通过一个叫 `skill` 的工具加载**：智能体在工具描述里看到可用技能的名称和描述，需要时按名称加载。
4. **权限在 `opencode.json` 里配**：对技能名（支持通配符）设 `allow`、`deny` 或 `ask`。
5. **OpenCode 专有的行为写在 `metadata` 里**，而不是加自定义的顶层字段，这样同一份 `SKILL.md` 在别的工具里也不会出错。

## 一、技能放在哪

每个技能一个文件夹，里面放 `SKILL.md`：

| 范围 | 路径 |
| --- | --- |
| 项目 | `.opencode/skills/<name>/SKILL.md` |
| 项目（兼容） | `.claude/skills/<name>/SKILL.md`、`.agents/skills/<name>/SKILL.md` |
| 全局 | `~/.config/opencode/skills/<name>/SKILL.md` |
| 全局（兼容） | `~/.claude/skills/<name>/SKILL.md`、`~/.agents/skills/<name>/SKILL.md` |

**发现规则**：对项目路径，OpenCode 从当前工作目录向上走，直到 git worktree 的根，沿途每一层的 `.opencode/skills/*/SKILL.md`、`.claude/skills/*/SKILL.md`、`.agents/skills/*/SKILL.md` 都会加载；全局技能从上面三个主目录路径加载。

这意味着已经在用 Claude Code 的项目，不需要做任何迁移，OpenCode 打开就能看到 `.claude/skills/` 里的技能。

## 二、frontmatter 与命名规则

- 必填：`name`、`description`；
- 可选：`license`、`compatibility`、`metadata`（字符串到字符串的键值表）。

**name 的规则**

- 1–64 个字符；
- 小写字母和数字，用单个连字符分隔；
- 不能以 `-` 开头或结尾，不能有连续的 `--`；
- 必须和包含 `SKILL.md` 的目录名一致；
- 对应的正则：`^[a-z0-9]+(-[a-z0-9]+)*$`

**description 的规则**：1–1024 个字符，要具体到足以让智能体做出正确选择。

**OpenCode 专有的两个开关**放在 `metadata` 下：

| 键 | 作用 |
| --- | --- |
| `opencode/slash` | 设为 `"true"` 时，技能在终端界面里作为 `/name` 命令出现 |
| `opencode/autoinvoke` | 设为 `"false"` 时，技能不进入给模型看的可用技能列表，不会被自动选用 |

官方说明这两个键也接受 YAML 布尔值。按官方示例的思路写出来是这样：

```markdown
---
name: git-release
description: Create consistent releases and changelogs. Use when preparing a tagged release.
metadata:
  opencode/slash: "true"
  opencode/autoinvoke: "false"
---

## 步骤
（发布流程的具体说明）
```

上面这个组合的含义是：只能通过 `/git-release` 手动调用，模型不会自己用它。适合发布这类有副作用的流程。

## 三、技能是怎么被加载的

OpenCode 提供一个名为 `skill` 的工具：

- 工具的描述里有一段 `<available_skills>`，列出每个可用技能的名称和描述；
- 智能体判断需要某个技能时，调用 `skill({ name: "git-release" })` 加载它的全文；
- `opencode/autoinvoke` 设为 `"false"` 的技能不会出现在 `<available_skills>` 里，但仍然可以按确切名称加载。

所以和其他工具一样，智能体平时只看得到名称和描述，`description` 决定它会不会被用上。

## 四、配置权限

在 `opencode.json` 里按技能名设置，支持通配符：

```json
{
  "permission": {
    "skill": {
      "*": "allow",
      "pr-review": "allow",
      "internal-*": "deny",
      "experimental-*": "ask"
    }
  }
}
```

| 取值 | 行为 |
| --- | --- |
| `allow` | 技能直接加载 |
| `deny` | 技能对智能体隐藏，访问被拒绝 |
| `ask` | 加载前先询问用户 |

通配符的例子：`internal-*` 会匹配 `internal-docs`。

对来源还不够放心的技能，先设为 `ask`，每次加载都能看到一次提示。

## 五、按智能体覆盖

**自定义智能体**：在智能体定义文件的 frontmatter 里写

```yaml
---
permission:
  skill:
    "documents-*": "allow"
---
```

**内置智能体**：在 `opencode.json` 的 `agent` 下写

```json
{
  "agent": {
    "plan": {
      "permission": {
        "skill": {
          "internal-*": "allow"
        }
      }
    }
  }
}
```

**完全关掉技能工具**：自定义智能体在 frontmatter 的 `tools:` 下写 `skill: false`；内置智能体在 `opencode.json` 里把 `agent.plan.tools.skill` 设为 `false`。关掉之后，`<available_skills>` 整段都不会出现。

## 六、技能不出现时的五项检查

官方的排查清单：

1. 确认文件名是全大写的 `SKILL.md`；
2. 确认 frontmatter 里有 `name` 和 `description`；
3. 确认技能名称在所有位置中是唯一的；
4. 检查权限，设为 `deny` 的技能对智能体是隐藏的；
5. 检查 `opencode/autoinvoke`，设为 `"false"` 的技能不会出现在给模型看的列表里。

第 3 条值得多看一眼：OpenCode 同时扫描三套目录，同一个技能如果在 `.opencode/skills/` 和 `.claude/skills/` 里各放了一份，就违反了唯一性。保留一份即可。

## 常见问题

**Q：怎么安装别人的技能？**
把技能文件夹放进上面任一目录即可。也可以用通用的命令行工具一次装到多个工具，见[《npx skills add 怎么用》](/guides/npx-skills-add-cli-install-skills)。装之前先看内容，见[《Skill 安全吗：安装前检查什么》](/guides/agent-skills-security-audit-before-install)。

**Q：技能在列表里但不被使用？**
改 `description`，把使用场景写具体，见[《Skill 不触发怎么办》](/guides/skill-not-triggering-description-optimize)。

**Q：Claude Code 专有的 frontmatter 字段在这里有用吗？**
官方文档列出的可识别字段只有 `name`、`description`、`license`、`compatibility`、`metadata`。其他工具的专有字段在 OpenCode 里不要指望生效。

**Q：SKILL.md 怎么写？**
见[《SKILL.md 怎么写》](/guides/skill-md-format-spec-how-to-write)。

## 参考资料

- Agent Skills（OpenCode 官方文档）：https://opencode.ai/docs/skills/
- Specification（Agent Skills 官方规范）：https://agentskills.io/specification
