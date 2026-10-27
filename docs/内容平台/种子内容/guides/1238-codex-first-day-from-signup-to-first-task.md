---
title: Codex 新手第一天：从开通到第一个任务，安装、登录、权限、额度和准备清单
slug: codex-first-day-from-signup-to-first-task
products: [codex, chatgpt]
models: []
accountTier: PLUS
excerpt: 第一次用 Codex 怎么上手？官方的流程是：有 ChatGPT 账号，安装桌面 App、CLI 或 IDE 扩展，登录，选一个项目文件夹，发一个小任务，任务前后用 Git 做检查点。本文按官方文档整理第一天的步骤和准备清单。
checkedOn: 2026-10-28
sources:
  - https://learn.chatgpt.com/docs/quickstart
  - https://learn.chatgpt.com/docs/pricing
  - https://learn.chatgpt.com/docs/codex/ide
  - https://learn.chatgpt.com/docs/windows/windows-app
verify:
  - 官方 Pricing 页写明 Work 和 Codex 包含在 Free、Go、Plus、Pro、Business、Edu、Enterprise 套餐里，各套餐用量不同，本文不写额度数字，以官方页面为准
  - 站内已有《Codex 入门教程》，本文是第一天的操作清单，不重复其中网页版、CLI、IDE 的完整介绍
  - 准备清单里的「先用 Ask for approval」来自官方 Windows 文档对沙箱保护的说明，其余是本站的建议
---

> 本文根据 Codex 官方文档《Quickstart》《Pricing》《Codex IDE extension》《ChatGPT desktop app for Windows》整理，资料核对于 2026-10-28。额度数字不写，以官方页面为准。配图为本站整理的示意图，不是软件截图。

## 适用于谁

- 第一次用 Codex，不知道从哪开始的人；
- 想知道要装什么、开通什么、先做什么任务的人。

## 结论先说

1. **账号**：Codex 用 ChatGPT 账号登录。官方 Pricing 页写明 Work 和 Codex 包含在 Free、Go、Plus、Pro、Business、Edu 或 Enterprise 套餐里，用量因套餐而异。想要更充足的额度可以看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。
2. **入口选一个就行**：ChatGPT 桌面 App（macOS、Windows、Linux）、命令行 CLI、VS Code 等编辑器的扩展。
3. **登录后选项目**：打开 App、登录，开始一个对话、创建项目或打开一个文件夹，ChatGPT 可以读取并修改你选的文件夹里的文件。
4. **第一个任务要小**：让它解释代码库、做一个聚焦的改动或帮你调试；任务前后用 Git 创建检查点，方便撤销。
5. **用 Ask for approval**：官方建议在发消息前选输入框下方的 **Ask for approval**，保持沙箱保护。

![Codex 新手第一天](seed:g1238-day1-steps.png)
*图：本站根据 [Codex 官方文档：Quickstart](https://learn.chatgpt.com/docs/quickstart) 整理的示意图*

## 一、官方的桌面端步骤

官方 Quickstart 的桌面端流程：

1. **安装 ChatGPT 桌面 App**，选对应操作系统的版本；
2. **打开 App 并用 ChatGPT 账号登录**，也可以用 API 密钥，但有些功能可能不可用；
3. **选择 ChatGPT 的工作位置**：开始对话、创建项目，或打开一个文件夹；
4. **开始对话**：做软件开发、需要代码库上下文和开发者工具的，在 ChatGPT 下拉菜单里选 **Codex**；做研究、文档的选 **Work**；快速提问选 **Chat**；
5. **发第一条消息**，描述目标，补充需要的文件或上下文。

官方的开发示例提示：「检查这个应用，找出一个影响较大的可用性改进，实现它，更新相关测试，并在手机和桌面上验证结果。」你可以先用更小的任务练手。

Windows 的安装见 [/guides/codex-windows-app-download-install](/guides/codex-windows-app-download-install)，命令行见 [/guides/codex-cli-install-update](/guides/codex-cli-install-update)，在编辑器里用见 [/guides/codex-vscode-extension-install-not-loading](/guides/codex-vscode-extension-install-not-loading)；三者关系见 [/guides/chatgpt-and-codex-merged-relationship](/guides/chatgpt-and-codex-merged-relationship)。

## 二、第一天的准备清单

![第一天开始前的准备清单](seed:g1238-prep-check.png)
*图：本站根据 [Codex 官方文档](https://learn.chatgpt.com/docs/windows/windows-app) 整理的示意图*

- **Git**：官方说 Git 驱动审查面板，让你查看或撤销改动；没装的话有些功能不可用。Node.js、Python 是代理常用的工具，建议先装；
- **检查点**：官方在 IDE 说明里建议任务前后创建 Git 检查点；
- **权限**：官方警告完全访问模式下 Codex 不限于项目目录，可能做出破坏性操作，建议保留沙箱边界，详见 [/guides/codex-permissions-sandbox](/guides/codex-permissions-sandbox)；
- **额度**：用量页面是 chatgpt.com/codex/settings/usage，命令行里用 `/status` 看当前会话，见 [/guides/codex-usage-limits](/guides/codex-usage-limits)；
- **AGENTS.md**：在项目根放一个，写清测试和提交约定，见 [/guides/codex-agents-md-how-it-reads](/guides/codex-agents-md-how-it-reads)。

## 三、第一个任务怎么选

官方的 Codex 说明里常见的开头方式：让它**解释代码库**、做**一个聚焦的改动**、或**帮你调试一个问题**。好的第一个任务具备：范围小、有办法验证（比如能跑一个已有的测试）、改动容易撤销。看完改动和测试结果，再决定保留哪些，不满意就在同一个对话里追问。

## 四、遇到问题

- 登录不了：见 [/guides/codex-cannot-sign-in-send-message-connect](/guides/codex-cannot-sign-in-send-message-connect)；
- 报错对照：见 [/guides/codex-common-errors-summary](/guides/codex-common-errors-summary)；
- 命令太多：见 [/guides/codex-cli-commands-cheatsheet](/guides/codex-cli-commands-cheatsheet)；
- 入门的另一篇完整教程：[/guides/codex-getting-started](/guides/codex-getting-started)。

## 常见问题

**Q：必须付费吗？**
官方说 Free 和 Go 套餐也包含 Codex，但用量有限，Plus、Pro 的用量更多。具体数字以官方页面为准。

**Q：用 API 密钥登录行吗？**
官方说可以，但按 API 价格计费，部分依赖 ChatGPT 工作区的功能不可用。

**Q：先用桌面 App 还是命令行？**
看你习惯：想要图形界面和并行对话用桌面 App；习惯终端用 CLI；一直在编辑器里用扩展。

## 参考资料

- Codex 官方文档：Quickstart — https://learn.chatgpt.com/docs/quickstart
- Codex 官方文档：Pricing — https://learn.chatgpt.com/docs/pricing
- Codex 官方文档：Codex IDE extension — https://learn.chatgpt.com/docs/codex/ide
- Codex 官方文档：ChatGPT desktop app for Windows — https://learn.chatgpt.com/docs/windows/windows-app
