---
title: GitHub Copilot CLI 安装与使用：npm / winget / brew 安装、登录、常用指令与工具权限
slug: github-copilot-cli-install-usage
products: [github-copilot]
models: []
accountTier: PLUS
excerpt: GitHub Copilot CLI 怎么安装、怎么用？按官方文档讲清三种安装方式（npm 需 Node.js 22+）、/login 登录与令牌登录、交互模式常用快捷键、copilot -p 非交互调用，以及 --allow-tool / --deny-tool 工具权限的写法。
checkedOn: 2026-10-11
sources:
  - https://docs.github.com/en/copilot/get-started/cli-quickstart
  - https://docs.github.com/en/copilot/how-tos/copilot-cli/set-up-copilot-cli/install-copilot-cli
  - https://docs.github.com/en/copilot/how-tos/copilot-cli/use-copilot-cli/allowing-tools
  - https://docs.github.com/en/copilot/concepts/billing-and-usage/individuals/billing
  - https://docs.github.com/en/copilot/get-started/plans
verify:
  - 完整的斜杠命令与命令行参数以 CLI 内 /help 和 copilot help 的输出为准，本文只列官方快速上手页出现的部分
  - 官方安装页写「需要有效的 Copilot 订阅」，而套餐页写「所有套餐都包含 Copilot CLI」，Free 档的实际可用范围以你账号为准
---

> 本文根据 GitHub 官方文档《Getting started with GitHub Copilot CLI》《Installing GitHub Copilot CLI》《Allowing and denying tool use》整理，资料核对于 2026-10-11。注意：这里说的是新的独立命令 `copilot`，不是早年的 `gh copilot` 扩展。

## 适用于谁

- 习惯在终端里干活，想要一个命令行里的编程智能体的人；
- 搜「github copilot cli 安装」「github copilot cli 使用」「github copilot cli 指令」的人；
- 想在脚本里调用 Copilot 的人。

## 结论先说

1. 安装三选一：`npm install -g @github/copilot`（需要 **Node.js 22 及以上**）、Windows 用 `winget install GitHub.Copilot`、macOS / Linux 用 `brew install --cask copilot-cli`。
2. 进入项目目录运行 `copilot`，第一次输入 `/login` 按提示登录 GitHub，并确认信任当前目录。
3. **只读操作自动放行，会改东西的操作要你批准**：改文件、有破坏性的命令、访问网址都会先问。
4. `copilot -p "问题"` 可以不进交互界面直接拿回答，适合写进脚本。
5. CLI 的每次交互消耗 AI credits，官方建议 CLI 版本不低于 1.0.48。

## 步骤一：安装

| 方式 | 命令 | 备注 |
| --- | --- | --- |
| npm（全平台） | `npm install -g @github/copilot` | 需 Node.js 22+ |
| WinGet（Windows） | `winget install GitHub.Copilot` | Windows 还需要 PowerShell 6 及以上 |
| Homebrew（macOS / Linux） | `brew install --cask copilot-cli` | — |
| 安装脚本（macOS / Linux） | `curl -fsSL https://gh.io/copilot-install \| bash` | 默认装到 `$HOME/.local`，root 下为 `/usr/local` |

也可以到 `github/copilot-cli` 仓库的 Releases 页下载对应平台的可执行文件。

一个容易踩的坑：如果你的 `~/.npmrc` 里设置了 `ignore-scripts=true`，官方要求改用：

```bash
npm_config_ignore_scripts=false npm install -g @github/copilot
```

公司账号要注意：组织或企业管理员在策略里禁用了 Copilot CLI 时，你装了也用不了。

## 步骤二：第一次启动

1. 在终端里进入项目目录；
2. 运行 `copilot` 进入交互会话；
3. 输入 `/login`，按屏幕提示用 GitHub 账号授权（只需要做一次）；
4. 按提示确认「信任当前目录里的文件可以交给 AI 工具使用」；
5. 试着问一句：

```text
给我讲讲这个项目的整体结构。
```

官方的说明是：没有你的明确批准，Copilot 不会修改你的文件。

**用令牌登录**（适合 CI 或没有浏览器的环境）：创建一个**细粒度个人访问令牌**，资源所有者选你的**个人账号**（不要选组织），在 Account 权限里加上 **Copilot Requests**，然后放进环境变量。CLI 按 `COPILOT_GITHUB_TOKEN`、`GH_TOKEN`、`GITHUB_TOKEN` 的顺序读取。令牌是密钥，只放环境变量或密钥管理工具里，不要写进脚本和仓库。

## 步骤三：交互模式的基本操作

| 按键 / 输入 | 作用 |
| --- | --- |
| Esc | 取消当前操作 |
| Ctrl + C | 思考中则取消；否则清空输入或退出 |
| Ctrl + L | 清屏 |
| `@` | 提到文件，把它加入上下文 |
| `/` | 显示斜杠命令 |
| `?` | 显示分页帮助 |
| ↑ / ↓ | 翻历史输入 |

完整的快捷键和命令列表输入 `/help` 查看。

## 步骤四：非交互调用（写脚本用）

```bash
# 直接提问，回答打印在终端
copilot -p "在 Git 里怎么把另一个分支上的某个提交拿过来"

# 加 -s：只输出回答，不带用量信息
copilot -sp "把上面的问题用一句话回答"
```

其他可用于脚本的参数，运行 `copilot help` 或 `copilot help 主题` 查看。

## 工具权限：让它少问，但别全放开

CLI 能执行 shell 命令、读写文件、搜索代码、抓取网页、把任务派给子智能体。默认规则：

- **自动允许**：搜索、读文件、只读的 shell 命令；
- **需要批准**：有破坏性的 shell 命令、编辑文件、访问 URL。每次询问时可以选「只允许这一次」或「本次会话内都允许」。

有些选项会把你的同意**存下来**：对当前仓库 / 目录的批准写进 `~/.copilot/permissions-config.json`；对网址的永久批准则把域名加进 `~/.copilot/settings.json` 的 `allowedUrls`，对所有会话生效。

启动时也可以用参数预先设定（只对当次会话有效）：

| 参数示例 | 效果 |
| --- | --- |
| `--allow-tool='shell(git commit)'` | 允许 `git commit` |
| `--allow-tool='shell(git:*)' --deny-tool='shell(git push)'` | 允许所有 git 命令，但不许 push |
| `--deny-tool=write` | 禁止一切写文件 |
| `--excluded-tools='web_fetch, web_search'` | 让模型根本看不到联网工具 |
| `--available-tools='bash,edit,view,grep,glob'` | 只保留这几种工具，其余全部禁用 |

两条规则记住：**deny 永远优先于 allow**（即使用了 `--allow-all` 或有已保存的批准）；`--available-tools` 和 `--excluded-tools` 是「模型知不知道有这个工具」，`--allow-tool` / `--deny-tool` 是「用之前要不要问你」。

官方给的一个受限会话组合很适合日常参考：

```bash
copilot --available-tools='bash,edit,view,grep,glob' \
  --allow-tool='shell(git:*)' --deny-tool='shell(git push)'
```

这样 Copilot 可以看代码、改文件、提交，但不能联网、不能随意起子智能体，也不能推送。

## 常见问题

**Q：怎么更新？**
用安装时的那个包管理器更新（官方安装页的标题就是「Installing or updating」，npm 重新执行安装命令即可）；具体的更新命令列在官方的 CLI command reference 里。预发布版分别是 `@github/copilot@prerelease`、`GitHub.Copilot.Prerelease`、`copilot-cli@prerelease`。

**Q：和 IDE 里的 Copilot 是一份额度吗？**
是同一个账号的同一份 AI credits，官方说明基础额度和弹性额度在 IDE、GitHub.com 和 CLI 上按相同费率使用。见[《GitHub Copilot 免费版与 Pro 区别》](/guides/github-copilot-free-pro-ai-credits)。

**Q：能读项目里的指令文件吗？**
可以，仓库的 `.github/copilot-instructions.md` 和 `AGENTS.md` 都是 Copilot 支持的指令来源，见[《copilot-instructions.md 怎么写》](/guides/copilot-instructions-md-examples)。

**Q：和 Claude Code、Codex CLI 是一类东西吗？**
定位相近，都是终端里的编程智能体；区别在账号体系、计费和各自的生态。本站另有[《Claude Code 中文入门教程》](/guides/claude-code-getting-started)和[《Codex 入门教程》](/guides/codex-getting-started)。

## 参考资料

- Getting started with GitHub Copilot CLI（GitHub 官方）：https://docs.github.com/en/copilot/get-started/cli-quickstart
- Installing GitHub Copilot CLI（GitHub 官方）：https://docs.github.com/en/copilot/how-tos/copilot-cli/set-up-copilot-cli/install-copilot-cli
- Allowing and denying tool use（GitHub 官方）：https://docs.github.com/en/copilot/how-tos/copilot-cli/use-copilot-cli/allowing-tools
- Usage-based billing for individuals（GitHub 官方）：https://docs.github.com/en/copilot/concepts/billing-and-usage/individuals/billing
