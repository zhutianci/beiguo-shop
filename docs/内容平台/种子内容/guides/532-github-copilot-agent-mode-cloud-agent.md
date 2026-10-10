---
title: GitHub Copilot Agent 模式怎么用：IDE 里的 Agent mode 与云端 cloud agent 的区别
slug: github-copilot-agent-mode-cloud-agent
products: [github-copilot]
models: []
accountTier: PLUS
excerpt: GitHub Copilot Agent mode 教学：在 VS Code / JetBrains 里怎么开启、适合什么任务、怎么中途纠正和审批命令、接 MCP 扩展工具；以及它和在 GitHub 上跑任务并提交 PR 的 Copilot cloud agent 有什么不同、各自怎么计费。
checkedOn: 2026-10-11
sources:
  - https://docs.github.com/en/copilot/how-tos/copilot-in-your-ide/use-copilot-agents/use-agent-mode
  - https://docs.github.com/en/copilot/get-started/quickstart-for-using-github-copilot-in-your-ide
  - https://docs.github.com/en/copilot/concepts/agents/cloud-agent/agent-management
  - https://docs.github.com/en/copilot/concepts/agents/code-review
  - https://docs.github.com/en/copilot/concepts/billing-and-usage/individuals/billing
  - https://docs.github.com/en/copilot/get-started/plans
verify:
  - cloud agent 的运行环境细节（官方代码审查文档提到其代理能力会使用 GitHub Actions）本文未展开核对
  - 各 IDE 是否支持 Agent 模式以官方《Copilot feature matrix》为准
  - 「cloud agent」是官方当前的叫法，网上的旧文章多称 coding agent
---

> 本文根据 GitHub 官方文档《Using agent mode in your IDE》及 cloud agent 相关页面整理，资料核对于 2026-10-11。

## 适用于谁

- 只用过 Copilot 补全和问答，想让它「自己把任务做完」的人；
- 搜「github copilot agent mode 教学」「github copilot coding agent vs agent mode」的人；
- 分不清 IDE 里的 Agent 和 GitHub 网站上的 Agent 的人。

## 结论先说

1. **Agent 模式（IDE 里）**：你给一个高层任务，Copilot 自己决定改哪些文件、动手修改、按需运行命令，反复迭代直到完成。**改动在你本机的工作区里**，你实时看着、随时打断。
2. **Cloud agent（GitHub 上）**：把任务交给云端独立运行，做完后给你一个 **pull request**；你事后审查、要求修改或合并。
3. 两者都消耗 **AI credits**，一次复杂的跨文件任务比聊天里问一句贵得多。
4. 默认情况下 Agent 模式**每条终端命令都要你批准**；管理员或你自己的编辑器设置可以让部分命令自动运行。
5. Agent 模式在 VS Code、Visual Studio、JetBrains、Xcode、Eclipse 都有，但步骤各不相同。

## 两种 Agent 对照

| | IDE 里的 Agent 模式 | Copilot cloud agent |
| --- | --- | --- |
| 在哪跑 | 你的编辑器、你的本机工作区 | GitHub 云端 |
| 怎么启动 | Chat 面板里选 Agent 后发任务 | 仓库的 Agents 标签页 / github.com/copilot/agents；也可按计划或事件用 automations 自动触发 |
| 产出 | 直接改在工作区，你逐个接受 | 一个 pull request |
| 你的参与方式 | 同步：边看边纠正、逐条批准命令 | 异步：事后看 PR，评论、要求改进、批准合并 |
| 适合 | 需要你盯着、反复沟通的任务 | 边界清楚、可以放手、能靠测试验证的任务 |

官方对 cloud agent 的描述是：会话结束后，你可以跳到对应的 pull request 查看改动、要求进一步改进，或批准并合并；在 Agents 页面可以集中查看各个会话的进度，也可以把会话接到 VS Code 或 Copilot CLI 里继续。

## Agent 模式适合什么任务

官方列了三种：

- 任务复杂，涉及多步骤、反复迭代和错误处理；
- 你希望由 Copilot 决定该走哪些步骤；
- 任务需要接入外部系统，比如 MCP 服务器。

反过来，只问一个概念、解释一段代码，用普通聊天更快也更省 credits。

## 在 VS Code 里用

1. 没有打开聊天视图的话，从 Copilot Chat 菜单选 **Open Chat**；
2. 在聊天视图底部的下拉里确认选的是 **Agent**；
3. 发出任务。Copilot 会把修改流式写进编辑器、更新工作集，必要时运行终端命令；
4. 查看修改并继续迭代，或者让它做一次代码审查。

如果模式选择器里没有 Agent，官方说明可能是企业或组织管理员禁用了它。

## 在 JetBrains 里用

1. 点 Copilot 图标打开聊天面板；
2. 点面板顶部的 **Agent** 标签；
3. 发出任务；
4. 查看修改；它建议终端命令时，逐条决定是否允许运行。

安装与登录见[《GitHub Copilot 在 IDEA / PyCharm 里怎么用》](/guides/github-copilot-jetbrains-idea-plugin)。

## 过程中怎么掌控

Agent 模式是交互式的。它工作时你可以：

- **发后续消息**，在它做完之前改变方向；
- **确认或拒绝**它提出的每一条终端命令（除非已被设置为自动运行）；
- **边看边撤销**流式出现的修改里你不想要的部分。

任务大或者需求模糊时，官方建议先用 **Plan 模式**起草一份实施方案，再交给 Agent。

## 扩展能力：模型、自定义 Agent、MCP

- **换模型**：提交任务前可以切换 Agent 用的模型。付费档自动选模型时，模型费用有 10% 折扣；Free 和 Student 档只能用自动选模型。
- **Custom agent**：为某类工作定制的 Agent，可以在下拉里选。
- **MCP**：官方说 Agent 模式的大部分能力来自它能调用的工具。通过 MCP 服务器可以增加操作外部系统的工具；GitHub 自己提供了 GitHub MCP Server，可以在编辑器里处理 issue、PR。
- **Subagent**：把一个独立的子任务交给另一个有自己上下文的 Agent。
- **项目指令**：`.github/copilot-instructions.md` 和 `AGENTS.md` 会被 Agent 读取，见[《copilot-instructions.md 怎么写》](/guides/copilot-instructions-md-examples)。

## 费用：为什么 Agent 特别耗额度

官方的计费说明里写得很直接：

- 聊天、CLI、cloud agent 等使用模型的功能都按 token 折算成 **AI credits**（1 credit = 0.01 美元）；
- Agent 模式和 cloud agent 在**一个任务里会多次调用模型**，在大代码库里跑一次复杂会话，消耗远大于聊天里的一个问题；
- 代码补全和「下一处编辑建议」不计 credits，付费档不限量。

省额度的做法：任务拆小、描述具体；能用轻量模型的不用旗舰模型；官方还提到可以给 Agent 任务设置**会话上限**来封顶花费。套餐额度见[《GitHub Copilot 免费版与 Pro 区别》](/guides/github-copilot-free-pro-ai-credits)。

## 常见问题

**Q：Free 档能用 Agent 吗？**
官方套餐表里 Copilot Free 的 Agents 一栏写的是「Limited」（有限）；Copilot Student 包含 Agent 但不含第三方 Agent；Pro 及以上完整包含。

**Q：cloud agent 的改动会直接进主分支吗？**
不会。它的产出是 pull request，需要你审查后合并。代码审查里的 **Fix with Copilot** 也是把修复交给 cloud agent：可以选择新开一个 PR，或直接提交到当前 PR。

**Q：Agent 改错了怎么回退？**
IDE 里可以撤销它的修改；更稳妥的是开工前先提交一次 Git，改完按 diff 逐个文件看。安全方面的通用做法见[《AI 编程安全注意事项》](/guides/ai-coding-security-secrets-permissions)。

## 参考资料

- Using agent mode in your IDE（GitHub 官方）：https://docs.github.com/en/copilot/how-tos/copilot-in-your-ide/use-copilot-agents/use-agent-mode
- About agent management（GitHub 官方）：https://docs.github.com/en/copilot/concepts/agents/cloud-agent/agent-management
- Usage-based billing for individuals（GitHub 官方）：https://docs.github.com/en/copilot/concepts/billing-and-usage/individuals/billing
- Plans for GitHub Copilot（GitHub 官方）：https://docs.github.com/en/copilot/get-started/plans
