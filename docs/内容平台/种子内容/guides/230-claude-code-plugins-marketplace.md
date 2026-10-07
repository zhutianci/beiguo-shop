---
title: Claude Code 插件（Plugins）怎么装：添加 marketplace、推荐插件与和 Skill 的区别
slug: claude-code-plugins-marketplace
products: [claude]
models: []
accountTier: PLUS
excerpt: Claude Code 插件是把技能、子代理、Hooks、MCP 打包在一起的扩展。本文讲 /plugin 安装步骤、三种安装范围、怎么添加 marketplace、更新卸载，以及装第三方插件前要检查什么。
checkedOn: 2026-10-07
sources:
  - https://code.claude.com/docs/en/plugins/overview
  - https://code.claude.com/docs/en/plugins/install
  - https://code.claude.com/docs/en/plugins/anthropic-marketplaces
  - https://code.claude.com/docs/en/plugins/security
  - https://code.claude.com/docs/en/plugins/create
---

> 本文根据 Claude Code 官方插件文档整理，核对日期 2026-10-07。插件市场里的插件变化很快，官方文档也不列具体清单，以 `/plugin` 里的 Discover 标签和 claude.com/marketplace 为准。

## 适用于谁

- 看到别人分享「装这个 Claude Code 插件就有 /commit 命令」，想知道怎么装的人；
- 搜「claude code plugin 安装」「marketplace add」「plugin 和 skill 的区别」的人；
- 想把自己团队的一套技能、Hooks、MCP 配置打包分发给同事的人。

## 结论先说

1. **插件 = 一个打包好的目录**，里面可以有技能（Skills）、子代理（Agents）、Hooks、MCP 服务器等，作为一个整体安装、启用、更新。
2. **Skill 是单个能力，插件是一组能力的「安装包」**。技能、子代理、Hooks、MCP 不装插件也能单独用；想一次装好别人做好的一整套、并能随市场更新，才用插件。
3. 插件来自 **marketplace（插件市场）**——一个带 `.claude-plugin/marketplace.json` 的仓库或目录，相当于目录清单，不是商店。Anthropic 官方市场 `claude-plugins-official` 在你第一次启动交互式会话时会自动添加。
4. 安装：会话里输入 `/plugin` 浏览，或 `/plugin install 插件名@市场名`，再选安装范围。
5. **插件以你的身份运行代码**，无论来自哪个市场，装之前都要看它带了哪些 Hooks 和 MCP 服务器。

## 步骤一：安装一个官方插件

以官方文档的例子 `commit-commands`（提供提交、推送、开 PR 的命令）为例：

1. 在项目里运行 `claude`，然后输入：

   ```text
   /plugin install commit-commands@claude-plugins-official
   ```

   在会话里这条命令**不会立即安装**，而是打开插件详情面板让你先检查。不知道装什么的话，直接输入 `/plugin`，在 **Discover** 标签里搜索浏览。

2. **看详情面板**：「Will install」列出它会加入的命令、子代理、技能、Hooks、MCP / LSP 服务器；官方市场的插件还会显示「Context cost」——**Every turn** 是每条消息都要占用的 token，**When invoked** 是技能被调用时额外占用的 token。

3. **选安装范围**（见下一节）。

4. **看安装结果的最后一句**：`Plugin is now active.` 表示立刻能用；提示 `Run /reload-plugins to apply.` 时运行 `/reload-plugins`；提示加载失败就去 `/plugin` 的 **Errors** 标签看原因。

5. **确认可用**：输入 `/`，插件的技能会以 `/插件名:技能名` 的形式出现，比如 `/commit-commands:commit`。

也可以不进会话，直接在终端里装（适合写进初始化脚本）：

```bash
claude plugin install commit-commands@claude-plugins-official
```

注意：在从没打开过交互式会话的机器上，官方市场还没注册，脚本里要先执行 `claude plugin marketplace add anthropics/claude-plugins-official`。

## 步骤二：选对安装范围

| 选项 | 范围 | 写在哪里 |
| --- | --- | --- |
| Install for you（user） | 你在这台电脑上的所有项目 | 用户设置 |
| Install for all collaborators（project） | 这个仓库的所有协作者 | 提交到仓库的 `.claude/settings.json` |
| Install for you, in this repo only（local） | 只有你、只在这个仓库 | 本地设置 |

选 project 范围时要知道：提交配置只是「为大家启用」，并不会替同事下载，每位同事还要自己运行一次 `claude plugin install 名字@市场 --scope project`。

终端、桌面版的本地会话、VS Code 扩展读的是同一套设置文件，所以在一个地方装了 user 范围的插件，另外两个地方也能用。**云端会话（含 claude.ai/code 网页版）不会加载你本地设置里的插件。**

## 步骤三：添加其他插件市场

很多插件不在 Anthropic 的市场里，而在作者自己的仓库里。先添加市场，再安装：

```text
/plugin marketplace add 作者/仓库名
/plugin install 插件名@市场名
```

市场名是对方 `marketplace.json` 里的 `name` 字段，添加成功后 Claude Code 会打印出来。`/plugin marketplace add` 支持几种来源：

| 来源 | 写法示例 |
| --- | --- |
| GitHub 仓库 | `your-org/plugins`，加 `#v1.2.0` 可固定到某个 tag |
| 任意 git 仓库 | 完整的 clone 地址 |
| 本地目录 | `./my-marketplace`（相对路径要以 `./` 或 `../` 开头） |
| 在线 JSON | `https://example.com/marketplace.json` |

新版本还支持一步完成：`/plugin install deploy-helper --marketplace your-org/plugins`（v2.1.275 及以后）。私有仓库会用你本机已有的 git 凭据去拉取。

### Anthropic 的三个市场

| | 官方 | 社区 | 示例 |
| --- | --- | --- | --- |
| 仓库 | `anthropics/claude-plugins-official` | `anthropics/claude-plugins-community` | `anthropics/claude-code` |
| 市场名（@ 后面写的） | `claude-plugins-official` | `claude-community` | `claude-code-plugins` |
| 内容 | Anthropic 维护的插件，以及合作伙伴和其他作者的插件 | 作者提交给 Anthropic 的第三方插件 | 少量演示插件 |
| 怎么获得 | 首次启动交互式会话时自动添加 | 手动 `/plugin marketplace add anthropics/claude-plugins-community` | 手动添加 |

一个容易踩的坑：网上不少旧教程让你 `/plugin marketplace add anthropics/claude-code`，那加的是**示例市场**，不是官方市场。`code-review`、`feature-dev`、`commit-commands`、`security-guidance` 等在两边都有，官方建议从 `claude-plugins-official` 装，避免装两份。

Anthropic 还发布了一些主题市场，比如 `anthropics/skills`（官方技能合集）、`anthropics/knowledge-work-plugins`，同样用 `/plugin marketplace add` 添加。

## 推荐先看哪些

官方文档明确说「目录变化快，不在文档里列清单」，所以这里只列官方文档点名提到的 Anthropic 自维护插件，具体以 Discover 标签为准：

- **commit-commands**：提交、推送、开 PR 的命令；
- **code-review**、**feature-dev**：代码审查与功能开发流程；
- **security-guidance**：写代码时提示安全问题；
- **语言服务器插件（code intelligence）**：让 Claude 获得跳转定义、查引用等代码智能。

想在网页上先看看，可以浏览 claude.com/marketplace/plugins，那里显示安装量，部分插件标有「Anthropic verified」。

## 管理：启用、停用、更新、卸载

- **会话里**：`/plugin` 后按 Tab 切到 **Installed** 标签，可以启用、停用、更新、卸载；也可以直接 `/plugin disable 名字`、`/plugin uninstall 名字`。
- **终端里**：`claude plugin list`、`claude plugin enable / disable / uninstall 名字@市场`。
- **更新**：官方市场默认自动更新，其他市场（含社区和第三方）默认关闭，可以在 Marketplaces 标签里逐个开启。手动更新单个插件用 `claude plugin update 名字@市场`；没有「一键更新全部」的命令，可以在 Marketplaces 标签选中某个市场点「Update marketplace」。更新后当前会话仍用旧版本，运行 `/reload-plugins` 或新开会话生效。
- **删除市场**：`/plugin marketplace remove 名字` 会顺带卸载从这个市场装的所有插件。

**插件很占上下文吗？**启用的插件在**每个会话**都生效：每个能被 Claude 自动调用的技能、子代理的名称和描述每一轮都在上下文里，即使这次没用到。用 `claude plugin details 名字` 可以看它「Always-on」每次固定占多少 token；不常用的插件停用即可，不必卸载。

## 安装第三方插件前的安全检查

官方的检查顺序：

1. `claude plugin marketplace list` 看市场是从哪个仓库添加的；
2. 在 `/plugin` 的详情面板看「Will install」；
3. 点「Open homepage / View on GitHub」读源码，重点看 `hooks/hooks.json`（每个 Hook 执行什么命令）、`.mcp.json`（每个服务器的命令或网址）、`bin/` 目录下的所有文件；
4. 装好后可以用 `claude plugin details 名字` 再核对一次组件清单。

还要记住：开启自动更新的市场会在后台更新插件，你审过的文件可能会变。官方市场名（如 `claude-plugins-official`）只认 `github.com/anthropics/` 下的仓库，冒用这些名字的市场会被拒绝加载。

## 想自己做插件

最小结构是一个目录加一份清单文件：

```text
my-plugin/
├── .claude-plugin/plugin.json   # 名称、版本、描述
├── skills/review/SKILL.md       # 生成 /my-plugin:review
├── agents/reviewer.md           # 子代理
├── hooks/hooks.json             # Hooks
└── .mcp.json                    # MCP 服务器
```

开发时不需要市场，用 `claude --plugin-dir ./my-plugin` 直接加载测试；做好后放进自己的 marketplace 仓库分享给团队。完整步骤见官方《Create a Claude Code plugin》。

## 常见问题

**Q：插件和 VS Code 里的「Claude Code 扩展」是一回事吗？**
不是。VS Code / JetBrains 里的是 IDE 扩展，用来在编辑器里使用 Claude Code；这里说的插件是给 Claude Code 本身增加技能、Hooks 等能力的包。

**Q：claude.ai 网页版能用这些插件吗？**
同样的插件格式也能装到 claude.ai 和 Cowork，但能加载的组件不同，见 claude.com 上的插件说明。你在 Claude Code 里装的插件不会同步到 claude.ai 账号；反过来，在 claude.ai 目录里添加的插件会同步到 Claude Code，显示为 `名字@synced`。

**Q：提示 `Plugin "xxx" not found in any marketplace`？**
说明你已添加的市场里没有这个插件：检查拼写，或者先 `/plugin marketplace add` 添加它所在的市场。

**Q：插件里的技能怎么调用？**
插件技能带命名空间：`/插件名:技能名`。没有和其他命令重名时，有些也可以直接用短名。技能本身的写法详见本站《Claude Skills 是什么、怎么装、推荐哪些》。

## 参考资料

- Plugins overview（官方）：https://code.claude.com/docs/en/plugins/overview
- Install and manage plugins（官方）：https://code.claude.com/docs/en/plugins/install
- Anthropic's marketplaces（官方）：https://code.claude.com/docs/en/plugins/anthropic-marketplaces
- Plugin security and trust（官方）：https://code.claude.com/docs/en/plugins/security
- Create a Claude Code plugin（官方）：https://code.claude.com/docs/en/plugins/create
