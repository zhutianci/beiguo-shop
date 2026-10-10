---
title: Copilot Skills 是什么、怎么用：VS Code 里的 Agent Skills 目录、字段与调用
slug: github-copilot-agent-skills-vscode
products: [github-copilot]
models: []
topics: [ai-agent]
accountTier: FREE
excerpt: GitHub Copilot 的 Skills 放在哪个文件夹、怎么创建和调用？按 VS Code 官方文档讲清 .github/skills 等六个技能目录、SKILL.md 的字段、/ 斜杠调用与自动加载的四种组合、和自定义指令的区别，以及使用别人分享的技能前要做的检查。
checkedOn: 2026-10-11
sources:
  - https://code.visualstudio.com/docs/copilot/customization/agent-skills
  - https://agentskills.io/specification
verify:
  - 技能市场（chat.customizations.marketplace.enabled）和 context: fork 官方标注为实验性功能
  - 菜单与命令名称取自官方英文文档，中文语言包下的叫法以实际界面为准
  - chat.agentSkillsLocations 设置官方已标注弃用
---

> 本文根据 VS Code 官方文档《Use Agent Skills in VS Code》整理，资料核对于 2026-10-11。没有登录 GitHub 账号操作，界面入口名称取自官方文档原文。Copilot 在 VS Code 里的基础设置见[《GitHub Copilot 在 VS Code 里怎么用》](/guides/github-copilot-vscode-setup)。

## 适用于谁

- 搜「copilot skills 使用」「copilot skill 是什么」「copilot skills folder」「copilot skills vscode」的人；
- 已经写了 `copilot-instructions.md`，想知道技能和它有什么不同的人；
- 想把 Claude Code 或 Codex 的技能拿到 Copilot 里用的人。

## 结论先说

1. **技能是「说明、脚本和资源组成的文件夹」**，智能体在相关时才加载。官方列出的适用范围包括 VS Code 里的 Copilot、Copilot CLI、Copilot 云端智能体等。
2. **项目技能放 `.github/skills/`**，VS Code 同时也读 `.claude/skills/` 和 `.agents/skills/`；个人技能放 `~/.copilot/skills/`，同样兼容 `~/.claude/skills/` 和 `~/.agents/skills/`。
3. **调用有两种**：输入 `/` 选择技能，或者由 Copilot 根据描述自动加载。两个 frontmatter 字段可以分别关掉其中一种。
4. **和自定义指令的分工**：指令是始终生效的编码规范；技能是按任务加载的专门能力，可以带脚本和资源。
5. **`name` 必须和文件夹同名**，否则技能不会加载。

## 一、技能放在哪

| 类型 | 目录 |
| --- | --- |
| 项目技能（在仓库里） | `.github/skills/`、`.claude/skills/`、`.agents/skills/` |
| 个人技能（用户主目录） | `~/.copilot/skills/`、`~/.claude/skills/`、`~/.agents/skills/` |

每个技能一个文件夹，里面有 `SKILL.md`。

两条和工作区有关的说明：

- 多根工作区里出现同名技能时，主根目录的那一份优先；
- monorepo 里想让子目录打开时也能发现仓库根目录的技能，打开设置项 `chat.useCustomizationsInParentRepositories`。

旧设置 `chat.agentSkillsLocations` 官方已标注为弃用，把技能挪到上面这些受支持的目录即可。

## 二、创建一个技能

官方给了几个入口：

- 在聊天里输入 `/skills`，打开 **Configure Skills** 菜单；
- 点击聊天视图里的 **Configure Chat**（齿轮图标），在自定义编辑器的 **Skills** 标签页里选 **New Skill (Workspace)** 或 **New Skill (User)**；
- 命令面板里运行 **Chat: Open Customizations**；
- 让 AI 生成：在聊天里输入 `/create-skill`，或者在编辑器里选 **Generate Skill**。

也可以直接手动建文件：

```
.github/skills/
└── webapp-testing/
    ├── SKILL.md
    └── test-template.js
```

技能目录里可以放脚本、模板、示例等文件，在 `SKILL.md` 里用相对路径引用，官方示例写法是 `[test template](./test-template.js)`。

## 三、SKILL.md 的字段

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `name` | 是 | 小写字母、数字、连字符；必须和上级目录同名；最多 64 字符 |
| `description` | 是 | 做什么、什么时候用；最多 1024 字符 |
| `argument-hint` | 否 | 作为斜杠命令调用时显示的参数提示，如 `[test file] [options]` |
| `user-invocable` | 否 | 默认 `true`；设为 `false` 时不出现在 `/` 菜单里 |
| `disable-model-invocation` | 否 | 默认 `false`；设为 `true` 时只能手动用斜杠调用 |
| `context` | 否 | 实验性；设为 `fork` 时在子代理里运行 |

官方特别提醒：通过插件分发的技能会自动加上命令前缀，**不要自己在 `name` 里加命名空间前缀**，否则技能会悄无声息地加载失败。

通用写法见[《SKILL.md 怎么写》](/guides/skill-md-format-spec-how-to-write)。

## 四、怎么调用

- **斜杠命令**：输入 `/`，选择技能，后面可以跟补充说明，例如 `/webapp-testing for the login page`；
- **自动**：技能的描述和任务对得上时，Copilot 自动加载。

两个字段的四种组合：

| `user-invocable` | `disable-model-invocation` | 结果 |
| --- | --- | --- |
| 默认 | 默认 | 斜杠可调用，也会自动加载 |
| `false` | 默认 | 只会自动加载 |
| 默认 | `true` | 只能斜杠调用 |
| `false` | `true` | 等于停用 |

加载分三级，和开放规范一致：先读名称和描述做匹配，再把 `SKILL.md` 正文读进上下文，引用到的文件只有在智能体去读时才加载。

**在子代理里运行（实验性）**：frontmatter 里写 `context: fork`，技能会在专门的子代理里执行，只把最终结果返回给主智能体。官方说明需要在设置里打开 `github.copilot.chat.skillTool.enabled`。

## 五、技能和自定义指令的区别

| | Agent Skills | 自定义指令 |
| --- | --- | --- |
| 用途 | 专门的能力和工作流程 | 编码规范和准则 |
| 内容 | 说明，加上脚本和资源 | 只有说明 |
| 加载 | 按任务按需加载 | 始终应用，或按 glob 模式应用 |
| 可移植性 | 可以在多个智能体工具之间通用 | 取决于所用的指令格式 |

简单的判断：「所有代码都要遵守」的写进指令文件，写法见[《copilot-instructions.md 怎么写》](/guides/copilot-instructions-md-examples)；「做某类任务时才需要的一整套步骤」做成技能。

## 六、使用别人分享的技能

官方提到两个社区来源：`github/awesome-copilot` 和 `anthropics/skills`。用法是把对应的技能目录复制到 `.github/skills/`，再按需要修改 `SKILL.md`。

官方的安全提醒有两条：

- **使用共享的技能之前一定要先审阅**；
- 检查终端命令自动批准的相关设置，因为技能可能带有要执行的脚本。

具体看什么，见[《Skill 安全吗：安装前检查什么》](/guides/agent-skills-security-audit-before-install)。

另外有一个实验性的技能市场：打开设置项 `chat.customizations.marketplace.enabled` 后，在自定义编辑器里选 **Discover**，从 **GitHub Feed** 里挑选并点 **Install**。官方说明目标位置已有同名技能时不会覆盖。

## 七、扩展里带技能

VS Code 扩展可以通过 `package.json` 里的 `chatSkills` 贡献点附带技能，`path` 指向技能的 `SKILL.md`，例如 `./skills/my-skill/SKILL.md`。目录结构是 `skills/<name>/SKILL.md`，目录名同样要和 `name` 字段一致。

## 常见问题

**Q：技能建好了，`/` 菜单里没有？**
按官方文档能确定的检查点：`name` 是否和文件夹完全同名、有没有设 `user-invocable: false`、文件是否在受支持的目录里、`name` 里有没有自己加前缀。

**Q：Copilot CLI 也用同一套吗？**
官方把 Copilot CLI 列在技能的适用范围里。CLI 的安装和基本用法见[《GitHub Copilot CLI 怎么用》](/guides/github-copilot-cli-install-usage)，CLI 里的具体命令以其官方文档为准。

**Q：`.github/skills/` 和 `.claude/skills/` 选哪个？**
只用 Copilot 的团队放 `.github/skills/`。团队里同时有人用 Claude Code、Codex、Cursor 的，放 `.agents/skills/` 或 `.claude/skills/` 可以让多个工具共用一份。

**Q：技能没有自动加载怎么办？**
先用 `/` 手动调用确认技能可用，再改描述，见[《Skill 不触发怎么办》](/guides/skill-not-triggering-description-optimize)。

## 参考资料

- Use Agent Skills in VS Code（VS Code 官方文档）：https://code.visualstudio.com/docs/copilot/customization/agent-skills
- Specification（Agent Skills 官方规范）：https://agentskills.io/specification
