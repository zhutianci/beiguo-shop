---
title: Claude Code settings.json 配置详解：文件位置、优先级与常用示例
slug: claude-code-settings-json
products: [claude]
models: []
accountTier: PLUS
excerpt: Claude Code 的 settings.json 有几个、放在哪、谁覆盖谁？本文讲清四级配置文件与优先级、列表合并规则、怎么确认生效，并给出个人与团队两份可复制的配置示例和常用字段。
checkedOn: 2026-10-07
sources:
  - https://code.claude.com/docs/en/settings
  - https://code.claude.com/docs/en/settings-reference
  - https://code.claude.com/docs/en/settings-example
  - https://code.claude.com/docs/en/env-vars
verify:
  - 示例里的模型 ID（claude-sonnet-5）取自官方 Example settings files 页，可用模型以 /model 菜单为准
---

> 本文根据 Claude Code 官方文档《Settings files and precedence》《All settings》《Example settings files》整理，核对日期 2026-10-07。设置项很多（官方参考页列了上百个），本文只讲最常用的部分。

## 适用于谁

- 想让 Claude Code 默认用某个模型、默认用中文回复、少弹几次确认框的人；
- 团队里想统一权限、Hooks、插件配置的人；
- 改了 `settings.json` 却不生效，搞不清是哪个文件覆盖了它的人。

## 结论先说

1. Claude Code 读 **4 个设置文件**：用户级 `~/.claude/settings.json`、项目共享 `.claude/settings.json`、项目本地 `.claude/settings.local.json`，以及组织下发的托管设置（managed）。
2. 同一个字段出现在多处时，**优先级从高到低**：托管设置 → 命令行参数 → 项目本地 → 项目共享 → 用户级。
3. **列表类字段会合并**，比如 `permissions.allow` 在几个文件里的规则会合在一起，而不是互相覆盖。
4. 设置文件是**严格 JSON**：不能写 `//` 注释，不能有多余的逗号，否则启动时报 Settings Error。
5. 改完在会话里运行 `/status`，看「Setting sources」一行确认读到了哪些文件；`claude doctor` 会列出被拒绝的条目。

## 一、四个设置文件分别管什么

| 范围 | 文件 | 影响谁 | 适合放 |
| --- | --- | --- | --- |
| 用户 | `~/.claude/settings.json` | 你在本机的所有项目 | 个人偏好：主题、编辑模式、默认模型、自己的权限规则 |
| 项目共享 | `.claude/settings.json` | 这个项目的所有人（提交到 git 后） | 团队的权限、Hooks、插件、项目需要的环境变量 |
| 项目本地 | `.claude/settings.local.json` | 只有你、只在这个项目 | 对团队配置的个人覆盖、分享前的试验 |
| 托管 | `managed-settings.json` 等 | 组织部署到的所有人 | 安全策略、合规要求，个人无法覆盖 |

几点补充：

- `~/.claude` 指你用户目录下的 `.claude` 文件夹；Windows 上是 `%USERPROFILE%\.claude`。不带 `~` 的 `.claude` 指项目里的文件夹。
- **安装后不会自动生成任何设置文件**。你在 `/config` 里改主题等选项时，Claude Code 会创建 `~/.claude/settings.json`；你在权限确认框里选「Yes, and don't ask again」时，会创建 `.claude/settings.local.json`，并自动把它加入 git 的全局忽略。如果你手动创建 local 文件，要自己加进 `.gitignore`。
- 还有一个 `~/.claude.json`，是 Claude Code 自己写的：登录状态、MCP 服务器配置、各项目的信任记录等，一般不需要手动改。

## 二、优先级：到底听谁的

从高到低：

1. **托管设置**：组织下发，个人的任何设置都覆盖不了（少数安全相关字段允许更严格的个人值）；
2. **命令行参数**：本次启动时传的，比如 `--model`、`--settings`；
3. **项目本地** `.claude/settings.local.json`；
4. **项目共享** `.claude/settings.json`；
5. **用户级** `~/.claude/settings.json`。

举个官方的例子：你在用户级关掉了转圈时的小提示（`"spinnerTipsEnabled": false`），但团队的 `.claude/settings.json` 写了 `true`，那么在这个项目里提示会重新出现，其他项目不会——因为项目共享高于用户级。想在这个项目里也关掉，就在 `.claude/settings.local.json` 里再写一次 `false`。

**环境变量不在这个层级里**，每个变量和设置字段的关系单独规定：例如在 shell 里导出的 `ANTHROPIC_MODEL` 会盖过任何文件里的 `model`。而写在设置文件 `env` 块里的变量，按文件优先级处理，并且会覆盖 shell 里同名的变量。

**列表合并**：`permissions.allow`、`permissions.deny` 这类列表在多个文件里会合并。所以项目里 allow 了、你个人 deny 了，结果是被拒绝——deny 永远先判定。

## 三、三种修改方式

**1. `/config` 菜单**：会话里运行 `/config`，在 Config 标签里改主题、编辑模式、详细输出等个人选项；也可以一句话直接改：`/config theme=dark`。注意它只列了一小部分常用项，不是 `settings.json` 的完整视图；VS Code 聊天面板和桌面版不提供 `/config`。

**2. 直接编辑文件**：开头加一行 `$schema`，VS Code、Cursor 等编辑器就能自动补全和校验：

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "permissions": {
    "allow": [
      "Bash(npm run lint)",
      "Bash(npm run test *)"
    ],
    "deny": [
      "Read(./.env)",
      "Read(./.env.*)"
    ]
  }
}
```

官方提醒 schema 可能落后于最新版本，新字段出现校验警告不一定代表写错。

**3. 只对本次会话生效**：

```bash
claude --settings '{"model": "claude-opus-5-5"}'
```

`--settings` 也可以传一个 JSON 文件路径。某些字段有专门的参数，如 `--model`、`--effort`。

**什么时候生效**：Claude Code 会监视设置文件，`permissions`、`hooks` 等大多数改动保存后立即生效，不用重启。例外是 `model`、`effortLevel` 这类只在启动时读一次的字段，会话中途请用 `/model`、`/effort` 切换。

## 四、可复制的配置示例

### 个人配置（`~/.claude/settings.json`）

改写自官方示例，并加了两个国内用户常用的字段：

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "model": "claude-sonnet-5",
  "language": "chinese",
  "theme": "light-daltonized",
  "spinnerTipsEnabled": false,
  "preferredNotifChannel": "terminal_bell",
  "permissions": {
    "allow": [
      "Bash(git diff *)",
      "Bash(git status)"
    ]
  },
  "autoUpdatesChannel": "stable",
  "cleanupPeriodDays": 30
}
```

| 字段 | 作用 |
| --- | --- |
| `model` | 新会话默认使用的模型 |
| `language` | 让 Claude 默认用这种语言回复；官方说明这个值会原样作为指令交给 Claude，不做校验，也会影响语音输入语言和自动生成的会话标题 |
| `theme` | 配色，`light-daltonized` 是色弱友好的浅色主题 |
| `spinnerTipsEnabled` | 是否显示转圈时的小提示 |
| `preferredNotifChannel` | 通知方式，`terminal_bell` 为终端响铃 |
| `permissions` | 权限规则，写法详见本站《Claude Code 权限模式详解：auto、手动、plan、bypass 与权限规则配置》 |
| `autoUpdatesChannel` | 更新通道：`latest`（默认，最新版）或 `stable`（一般晚一周左右，跳过有严重问题的版本） |
| `cleanupPeriodDays` | 本地会话记录保留天数，默认 30 天，过期的会话在 `/resume` 里就找不到了 |

### 团队共享配置（`.claude/settings.json`，提交到仓库）

```json
{
  "permissions": {
    "allow": ["Bash(npm run *)"],
    "ask": ["Bash(git push *)"],
    "deny": [
      "Read(./.env)",
      "Read(./.env.*)",
      "Read(./secrets/**)"
    ]
  },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          { "type": "command", "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/block-rm.sh" }
        ]
      }
    ]
  },
  "env": {
    "MCP_TIMEOUT": "60000"
  },
  "plansDirectory": "./plans"
}
```

意思是：npm 脚本直接跑，推送前确认，密钥文件不让读；每条 shell 命令执行前先过一遍仓库里的检查脚本（Hook 写法详见本站《Claude Code Hooks 怎么用：配置示例（完成通知、自动格式化、拦截危险命令）》）；把 MCP 启动超时放宽到 60 秒；plan 模式生成的方案保存到 `./plans`。

提交团队配置前，官方提醒的几件事：

- **云端会话也会读它**（云端是从仓库克隆开始的）；
- **allow 规则要等每个人「信任这个文件夹」后才生效**，deny 和 ask 规则则始终生效；
- 遥测相关的环境变量写在项目文件里会被忽略，要放到托管设置或个人设置里；
- 权限规则按命令和路径的字面匹配，`Bash(git push *)` 匹配不到 `git -C . push`，需要更严格就配合沙箱。

## 五、其他常用字段速查

| 字段 | 作用 |
| --- | --- |
| `env` | 给每个会话及其子进程设置环境变量 |
| `hooks` | Hooks 配置 |
| `statusLine` | 自定义底部状态栏 |
| `outputStyle` | 默认输出风格 |
| `alwaysThinkingEnabled` | 是否默认开启扩展思考 |
| `attribution` | 自定义 Claude 提交时加的署名；设为 `false` 可全部隐藏（v2.1.281 起） |
| `enabledPlugins` / `extraKnownMarketplaces` | 启用的插件 / 额外的插件市场 |
| `agent` | 让整个会话以某个子代理身份运行 |
| `disableAllHooks` | 一键停用所有 Hooks |

`attribution` 取代了旧的 `includeCoAuthoredBy`，后者从 v2.0.62 起已弃用。完整字段请查官方《All settings》参考页，每个字段都写明了可放在哪些文件、默认值和对应的命令行参数 / 环境变量。

## 常见问题

**Q：启动时弹出「Settings Error」？**
文件里 JSON 写错了（最常见是加了注释或多了逗号），或者某个值不被接受。对话框里可以让 Claude 帮你修、退出，或忽略这个文件继续。只是个别条目有问题时显示「Settings Warning」，那几条会被跳过，其他照常生效。之后用 `claude doctor` 看具体错误。

**Q：我设置的值被忽略了？**
按优先级排查：是不是项目文件或托管设置里也设了同一个字段；是不是 shell 里导出了对应的环境变量；还有些字段在项目文件里不生效，比如 `defaultMode: "auto"` 只认用户级文件。

**Q：`/model` 切换的模型下次还在吗？**
`/model` 会把选择保存为新会话的默认值；在选择器里按 `s` 则只对当前会话生效，不保存。

**Q：MCP 服务器也写在 settings.json 里吗？**
不是。MCP 服务器保存在 `~/.claude.json`（个人）和项目根目录的 `.mcp.json`（团队），详见本站《Claude Code MCP 配置教程：claude mcp add、配置文件位置与常用 MCP》。

**Q：`~/.claude.json` 坏了怎么办？**
Claude Code 会把坏文件备份到 `~/.claude/backups/` 并询问是手动修还是重置。它每次写入前都会保存备份，可以从 `~/.claude/backups/` 里最近的 `.claude.json.backup.<时间戳>` 恢复。

## 参考资料

- Settings files and precedence（官方）：https://code.claude.com/docs/en/settings
- All settings（官方参考）：https://code.claude.com/docs/en/settings-reference
- Example settings files（官方）：https://code.claude.com/docs/en/settings-example
- Environment variables（官方）：https://code.claude.com/docs/en/env-vars
