---
title: GitHub Copilot VS Code 使用教程：开启、登录、补全、Chat 提问与换账号
slug: github-copilot-vscode-setup
products: [github-copilot]
models: []
accountTier: FREE
excerpt: GitHub Copilot 在 VS Code 里怎么用？按 GitHub 与 VS Code 官方文档讲清怎么开启和登录（不用手动装扩展）、没订阅会进入 Copilot Free、第一个补全与 Chat 提问、Agent 模式入口、切换账号、查看用量和关闭 AI 功能。
checkedOn: 2026-10-11
sources:
  - https://code.visualstudio.com/docs/copilot/setup
  - https://docs.github.com/en/copilot/get-started/quickstart-for-using-github-copilot-in-your-ide
  - https://docs.github.com/en/copilot/how-tos/copilot-in-your-ide/set-up-copilot/install-copilot-extension
  - https://docs.github.com/en/copilot/get-started/plans
  - https://docs.github.com/en/copilot/concepts/billing-and-usage/individuals/billing
verify:
  - 「Use AI Features」「Sign in to use Copilot」等界面文字来自 VS Code 英文文档，装了中文语言包后的译名未核对
  - 官方建议 VS Code 版本不低于 1.120，否则用量与计费信息可能显示不准
---

> 本文根据 VS Code 官方文档《Set up GitHub Copilot in VS Code》和 GitHub 官方文档的 IDE 快速上手整理，资料核对于 2026-10-11。

## 适用于谁

- 用 VS Code 写代码，想把 GitHub Copilot 开起来的人；
- 搜「github copilot vscode 教学」「github copilot vscode 使用」的人；
- 公司账号和个人账号都有，不知道 VS Code 里怎么切的人。

## 结论先说

1. **现在不用手动装扩展**。GitHub 官方文档写明：第一次在 VS Code 里设置 Copilot 时，所需扩展会自动安装。
2. 入口在右下角状态栏的 **Copilot 图标**：鼠标移上去，选 **Use AI Features**，再选登录方式。
3. **没有订阅也能用**：符合条件的账号登录后会自动进入 **Copilot Free**，每月有一定的补全次数和 AI credits。
4. 三种用法：打字时的**灰色补全**（Tab 接受）、**Chat** 里提问（`Ctrl+Alt+I`）、选 **Agent** 让它自己改一个任务。
5. 聊天、Agent 都消耗 **AI credits**；付费档的代码补全不计 credits、不限量。

## 步骤一：开启并登录

1. 把 VS Code 更新到最新版（官方建议不低于 1.120，旧版本能用，但模型价格和用量信息可能显示不准）；
2. 鼠标移到状态栏的 Copilot 图标，选 **Use AI Features**；
3. 选择登录方式，按提示在浏览器里完成授权；
4. 账号已有 Copilot 订阅的话会直接用上；没有的话，符合条件的账号会进入 Copilot Free。

公司通过 GitHub Enterprise（GHE.com）托管账号的，在登录框里选 **Continue with GHE.com**，填实例地址后登录。雇主提供了 Copilot 的，官方建议用组织账号登录。

## 步骤二：第一个补全

新建一个 `.js` 文件，输入：

```javascript
function calculateDaysBetweenDates(begin, end) {
```

Copilot 会用灰色文字给出整个函数体的建议，按 **Tab** 接受（每次的建议内容可能不同）。其他语言同理。

## 步骤三：在 Chat 里提问

1. 打开一个已有的代码文件；
2. 按 `Ctrl+Alt+I`（macOS 为 `Control+Command+I`）打开 Chat；
3. 输入 `这个文件是做什么的`，回车；
4. 在编辑器里选中一行，再问 `解释这一行`。

Copilot 能看到你当前打开的文件，所以不必先把代码贴一遍。

## 步骤四：让 Agent 完成一个任务

在 Chat 视图底部的下拉里选 **Agent**，描述任务，例如：

```text
做一个任务管理网页：可以新增、删除任务，并把任务标记为已完成。
```

Copilot 会自己决定改哪些文件、生成代码、在你批准后运行命令。完成后逐个查看改动再接受。更详细的用法见[《GitHub Copilot Agent 模式怎么用》](/guides/github-copilot-agent-mode-cloud-agent)。

登录后还可以在聊天里输入 `/init`，让它为当前项目生成一份起步用的自定义指令，写法见[《copilot-instructions.md 怎么写》](/guides/copilot-instructions-md-examples)。

## 切换账号、按项目用不同账号

**换一个账号**：点活动栏的 **Accounts**（账户）菜单，对当前账号选 **Sign out**；然后从 Copilot 状态栏菜单选 **Sign in to use Copilot**，或在命令面板运行 `GitHub Copilot: Sign in`。

**不同工作区用不同账号**：Accounts 菜单 → **Manage Extension Account Preferences** → 选 **GitHub Copilot Chat** → 为当前工作区和配置文件挑账号。个人项目用个人账号、公司项目用公司账号时很有用。

## 看用量、关功能

- **用量**：从状态栏打开 Copilot 状态面板，可以看到本月额度用了多少。额度规则见[《GitHub Copilot 免费版与 Pro 区别》](/guides/github-copilot-free-pro-ai-credits)。
- **彻底隐藏 AI 功能**：把设置 `chat.disableAIFeatures` 打开（用户级或工作区级）。它会隐藏聊天和行内补全并停用 Copilot 扩展；只想在某个项目里关，就写进该工作区的 `settings.json`。
- **遥测**：官方说明 Free 档默认开启遥测，可以把 `telemetry.telemetryLevel` 设为 `off`，或到 GitHub 的 Copilot 设置里调整。

## 常见问题

**Q：模式下拉里没有 Agent？**
官方说明：如果看不到 Agent 选项，可能是企业或组织管理员在你的 IDE 上禁用了它。

**Q：不订阅 Copilot，只用自己的模型 Key 行不行？**
VS Code 支持自带模型 Key，这部分由对应的模型提供方计费；但官方注明行内补全、语义搜索等仍然需要 GitHub Copilot 服务。

**Q：登录了但一直没有建议？**
先看状态栏图标有没有报错、是否已登录正确的账号；公司账号要确认管理员给你分配了席位。认证问题官方有专门的《Troubleshooting common issues》页面。

**Q：数据会被拿去训练吗？**
VS Code 文档的说法是：请查看 GitHub Copilot Trust Center 和你所在组织的政策；VS Code 自己的遥测设置与 AI 提供方的数据处理是两回事。

**Q：JetBrains、终端里怎么用？**
见[《GitHub Copilot 在 IDEA / PyCharm 里怎么用》](/guides/github-copilot-jetbrains-idea-plugin)和[《GitHub Copilot CLI 安装与使用》](/guides/github-copilot-cli-install-usage)。

## 参考资料

- Set up GitHub Copilot in VS Code（VS Code 官方）：https://code.visualstudio.com/docs/copilot/setup
- Quickstart for using GitHub Copilot in your IDE（GitHub 官方）：https://docs.github.com/en/copilot/get-started/quickstart-for-using-github-copilot-in-your-ide
- Installing the GitHub Copilot extension in your environment（GitHub 官方）：https://docs.github.com/en/copilot/how-tos/copilot-in-your-ide/set-up-copilot/install-copilot-extension
- Plans for GitHub Copilot（GitHub 官方）：https://docs.github.com/en/copilot/get-started/plans
