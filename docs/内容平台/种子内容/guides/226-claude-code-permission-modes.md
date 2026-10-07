---
title: Claude Code 权限模式详解：auto、手动、plan、bypass 与权限规则配置
slug: claude-code-permission-modes
products: [claude]
models: []
accountTier: PLUS
excerpt: Claude Code 六种权限模式各自放行什么、怎么用 Shift+Tab 切换、auto 模式为什么提示不可用、allow / ask / deny 规则怎么写，以及 bypass 模式的风险。
checkedOn: 2026-10-07
sources:
  - https://code.claude.com/docs/en/permission-modes
  - https://code.claude.com/docs/en/permissions
  - https://code.claude.com/docs/en/auto-mode-config
  - https://code.claude.com/docs/en/sandboxing
  - https://code.claude.com/docs/en/settings
verify:
  - 官方文档写明 v2.1.283 起交互式终端与 VS Code 默认进入 auto 模式；不同版本、组织设置下起始模式不同，以状态栏显示为准
---

> 本文根据 Claude Code 官方文档整理，核对日期 2026-10-07；截图引用自官方文档并注明出处。Claude Code 版本更新很快，模式名称和默认值以你本机的 `claude --help` 与状态栏为准。

## 适用于谁

- 用 Claude Code 时被「Do you want to proceed?」问得太频繁，想少点确认又怕它乱来的人；
- 搜「claude code 权限配置推荐」「dangerously-skip-permissions」，想知道全开权限到底安不安全的人；
- 看到「auto mode unavailable」提示，不知道为什么自己用不了 auto 模式的人。

安装和第一次运行详见本站《Claude Code 中文入门教程（2026）：安装、登录、第一个任务、常用命令》。

## 结论先说

1. **权限模式决定「默认问不问」**，权限规则（allow / ask / deny）在模式之上做精细调整。规则的判定顺序是 deny → ask → allow，**deny 在任何模式下都生效**，连 bypass 也挡得住。
2. 日常开发推荐 **auto 模式**：由一个独立的分类器模型替你审核操作，拦下下载执行脚本、强推、生产部署、批量删除这类高风险动作；想每一步都自己看就用 **Manual（手动）**。
3. **plan 模式**只读不改，适合先让它出方案；**acceptEdits** 自动接受改文件，适合边改边用 `git diff` 复查。
4. **bypassPermissions（`--dangerously-skip-permissions`）**几乎不做任何检查，官方明确要求只在容器、虚拟机等隔离环境里用，而且以 root / sudo 运行时会被拒绝。
5. `Shift+Tab` 随时切换；想改默认模式，在 `settings.json` 里设 `permissions.defaultMode`。

## 六种模式一览

| 模式（配置值） | 不经询问就能做的事 | 适合 |
| --- | --- | --- |
| Manual（`default`） | 只有读取 | 敏感项目、陌生代码，每一步自己把关 |
| `acceptEdits` | 读取、改文件，以及 `mkdir`、`touch`、`mv`、`cp` 等常见文件命令 | 一边让它改，一边在编辑器里复查 |
| `plan` | 读取；auto 可用时还包括分类器放行的探索命令 | 动手前先研究代码、出方案 |
| `auto` | 所有操作，但有后台安全检查 | 长任务、减少确认疲劳 |
| `dontAsk` | 读取和事先允许的工具，其余一律拒绝 | 锁死权限的 CI、脚本 |
| `bypassPermissions` | 全部 | 仅限隔离的容器 / 虚拟机 |

Manual 模式在命令行、VS Code、JetBrains 和桌面版里都叫 **Manual**，写进配置时用 `default`，命令行也接受 `manual` 作为别名，例如 `claude --permission-mode manual`。

Manual 模式下，执行命令前会弹出这样的确认框：

![Claude Code 在 Manual 模式下执行 npm test 前弹出的确认框，选项依次是：是；是，且以后对 npm test * 不再询问；是，并切换到 auto 模式；否](seed:g226-bash-permission-prompt.png)
*图片来源：[Claude Code 官方文档《Configure permissions》](https://code.claude.com/docs/en/permissions)*

选「Yes, and don't ask again」时，命令类的规则会**永久**保存到仓库根目录的 `.claude/settings.local.json`；改文件的批准只在本次会话内有效。在选项上按 `Tab` 还可以附一句说明给 Claude（比如「可以跑，但别加 --watch」）。

## 怎么切换模式

**命令行里：**按 `Shift+Tab` 循环切换。从 auto 出发，依次是 manual → accept edits → plan，再回到 auto。输入框下方的状态栏会显示当前模式，例如 `⏸ manual mode on`、`⏵⏵ accept edits on`、`⏸ plan mode on`、`⏵⏵ auto mode on`。

**启动时指定：**

```bash
claude --permission-mode plan
```

**设为默认：**写进 `~/.claude/settings.json`（对本机所有项目生效）：

```json
{
  "permissions": {
    "defaultMode": "default"
  }
}
```

注意两个坑（官方文档原文写明）：

- 在项目的 `.claude/settings.json` 或 `.claude/settings.local.json` 里写 `"auto"` **不生效**；想默认 auto，要写在用户级 `~/.claude/settings.json`。
- 在这两个项目级文件里写 `"bypassPermissions"` 也不生效，会退回 Manual。这是为了防止别人提交到仓库的配置替你打开危险模式。

**VS Code：**点输入框底部的模式标识，标签分别是 Manual、Edit automatically、Plan、Auto、Bypass permissions。想固定起始模式，用 VS Code 用户设置里的 `claudeCode.initialPermissionMode`（它不接受 `auto`）。**桌面版：**在 Code 标签页发送按钮旁的模式选择器里切换。

## auto 模式：会拦什么、为什么提示不可用

auto 模式里，每个操作执行前由分类器检查是否超出你的要求。官方列出的默认拦截项包括：`curl | bash` 这类下载即执行、把敏感数据发到外部、生产部署和数据库迁移、云存储批量删除、强制推送（force push）、`git reset --hard` 等会丢弃未提交改动的命令、修改 DNS / 证书 / 密钥管理、合并没人审过的 PR、把凭据打印进对话等。

分类器默认只信任**当前工作目录和仓库已配置的远程地址**。如果公司内部的代码托管、存储桶也要放行，用 `autoMode.environment` 配置可信基础设施，或者运行 `/auto-mode-setup` 让它帮你生成；`claude auto-mode defaults` 可以打印内置规则。

提示 auto 模式不可用，按官方要求逐项检查：

- **模型**：在 Anthropic API 上需要 Claude Opus 4.6 及以后、Sonnet 4.6 及以后或 Fable 系列；Haiku、Sonnet 4.5、Opus 4.5 等旧模型在任何平台都不支持。
- **组织设置**：Team / Enterprise 默认可用，但管理员可以用 `permissions.disableAutoMode: "disable"` 关掉；你自己的任一设置文件里有这个值也会关掉。
- **服务端**：Anthropic 可能临时在服务端关闭 auto 模式，收到这类答复的会话到结束前都不会再开，稍后新开会话再试。

官方同时提醒：auto 模式**能减少确认，但不保证安全**，敏感操作仍然需要人工审查。

## 权限规则怎么写

规则格式是 `工具` 或 `工具(限定内容)`，在会话里用 `/permissions` 可以查看、增删，并显示每条规则来自哪个设置文件。

| 写法 | 含义 |
| --- | --- |
| `Bash` | 所有 shell 命令 |
| `Bash(npm run *)` | 以 `npm run` 开头的命令 |
| `Bash(git push *)` | 以 `git push` 开头的命令 |
| `Read(./.env)` | 读取当前目录的 `.env` |
| `Read(./secrets/**)` | 读取 secrets 目录下的所有文件 |
| `Edit(/src/**/*.ts)` | 修改项目 src 下的 ts 文件 |
| `WebFetch(domain:example.com)` | 抓取 example.com 的网页 |
| `mcp__github` | 名为 github 的 MCP 服务器提供的所有工具 |
| `Agent(Explore)` | 名为 Explore 的子代理 |

写通配符的要点：`*` 要放在**子命令之后**。`Bash(git log *)` 只放行 `git log`，而 `Bash(git *)` 会放行所有 git 命令；`Bash(ls *)` 不匹配 `lsof`，`Bash(ls*)` 会匹配。

一份适合个人项目的起步配置（放在项目 `.claude/settings.json`，可以提交给团队共用）：

```json
{
  "permissions": {
    "allow": [
      "Bash(npm run *)",
      "Bash(git status)",
      "Bash(git diff *)",
      "Bash(git commit *)"
    ],
    "ask": [
      "Bash(git push *)",
      "Bash(gh pr create *)"
    ],
    "deny": [
      "Read(./.env)",
      "Read(./.env.*)",
      "Read(./secrets/**)"
    ]
  }
}
```

这样跑脚本、看改动、提交不再询问；推送和建 PR 每次都要你点头（ask 规则在 auto 模式下也会强制询问）；密钥文件不让读。要注意 Bash 规则是按命令文本前缀匹配的，`git -C . push` 这种换了写法的推送不会被 `Bash(git push *)` 匹配到；需要更严格的检查时，官方建议用 PreToolUse Hook 或开启沙箱。另外，Read / Edit 的 deny 规则管不住「脚本自己去读文件」，要做到系统级隔离需要 `/sandbox` 开启 Bash 沙箱（macOS、Linux、WSL2 可用）。

## bypass 模式：能不能「权限全开」

`--dangerously-skip-permissions` 和 `--permission-mode bypassPermissions` 等价：跳过权限提示和安全检查，连 `.git`、`.claude` 这类受保护路径也直接写入。官方的要求很明确：

- 只在**没有外网、不会伤到宿主机**的容器、虚拟机、开发容器里用；
- 它**不防提示词注入**——Claude 读到的网页、文件里如果藏着恶意指令，没有任何一道关卡；
- 在 Linux / macOS 上以 root 或 sudo 运行会直接报错拒绝；
- 第一次启用会弹窗要你确认承担风险；管理员可以用 `permissions.disableBypassPermissionsMode` 禁用它。

想少点确认，官方推荐的替代方案是 auto 模式，或者 Manual + 沙箱的「auto-allow」模式。CI 里需要无人值守时，优先用 `dontAsk` 加精确的 `--allowedTools` 白名单：

```bash
claude -p "运行测试并总结失败原因" --permission-mode dontAsk --allowedTools "Bash(npm test)" "Read"
```

## 常见问题

**Q：我在项目配置里写了 `"defaultMode": "auto"`，为什么启动还是 Manual？**
项目级的 `.claude/settings.json` 和 `.claude/settings.local.json` 不认 `auto`，挪到 `~/.claude/settings.json`。VS Code 里的会话还要看扩展自己的 `claudeCode.initialPermissionMode`。

**Q：allow 了一个命令，为什么还是被拦？**
判定顺序是 deny → ask → allow，只要有一条更宽的 deny 或 ask 规则匹配，具体的 allow 也救不回来。用 `/permissions` 查看规则分别来自哪个文件。管理员下发的托管设置优先级最高，命令行参数也无法覆盖。

**Q：在 CLAUDE.md 里写「不许删文件」管用吗？**
只能影响 Claude「想不想做」，不能限制它「能不能做」。官方说明权限由 Claude Code 程序强制执行，要真正禁止请写 deny 规则。

**Q：plan 模式和 Manual 有什么区别？**
plan 模式下 Claude 只研究、写方案，批准方案前不会改源码；Manual 模式可以改，只是每次都问你。plan 模式的用法详见本站《Claude Code Plan 模式怎么用：先出方案再改代码》。

**Q：网页版 / 手机上能用 bypass 吗？**
不能。云端会话只提供 Accept edits、Plan、Auto，并且会忽略仓库设置文件里的 `bypassPermissions` 和 `dontAsk`。

## 参考资料

- Choose a permission mode（官方）：https://code.claude.com/docs/en/permission-modes
- Configure permissions（官方）：https://code.claude.com/docs/en/permissions
- Configure auto mode（官方）：https://code.claude.com/docs/en/auto-mode-config
- Configure the sandboxed Bash tool（官方）：https://code.claude.com/docs/en/sandboxing
- Settings files and precedence（官方）：https://code.claude.com/docs/en/settings
