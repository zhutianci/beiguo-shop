---
title: Codex VS Code 提示「This is open in another app」怎么办：App 和 IDE 扩展同步对话的官方规则
slug: codex-vscode-open-in-another-app
products: [codex, chatgpt]
models: []
accountTier: PLUS
excerpt: Codex VS Code 扩展提示 This is open in another app？官方没有逐字解释这句话，但文档写明桌面 App 和 IDE 扩展在同一项目里会共享活动对话和编辑器上下文，并支持互相打开对话。本文按官方同步规则整理合理的处理办法。
checkedOn: 2026-10-28
sources:
  - https://learn.chatgpt.com/docs/developer-settings
  - https://learn.chatgpt.com/docs/codex/ide
  - https://learn.chatgpt.com/docs/reference/troubleshooting
verify:
  - 官方文档没有出现「This is open in another app」这句提示，也没有解释它出现的条件，本文没有断言原因，只说明官方写明的同步规则，以及在这个规则下的合理做法
  - 提示的中文意思是这个对话在另一个应用里打开着，本文的处理办法是本站的使用建议，不是官方的专门说明
  - 具体按钮名称以你使用的版本为准
---

> 本文根据 Codex 官方文档《IDE extension settings》《Codex IDE extension》《Troubleshooting》整理，资料核对于 2026-10-28。**官方没有解释「This is open in another app」这句提示**，本文说明官方写明的 App 与 IDE 同步规则，处理办法是在这些规则下的合理做法。配图为本站整理的示意图，不是软件截图。

## 适用于谁

- 用 Codex VS Code 扩展，同时开着 ChatGPT 桌面 App，遇到 `This is open in another app` 的人；
- 想知道桌面 App 和 IDE 扩展怎么共享对话的人。

## 结论先说

1. **字面意思**：`This is open in another app` 是「这个对话已在另一个应用里打开」。官方文档没有这句话，也没有说明触发条件。
2. **官方写明的同步规则**：当 ChatGPT 桌面 App 和 IDE 扩展在**同一个项目**里打开时，它们共享活动对话和编辑器上下文。两边都用项目来决定要共享哪些对话和上下文。
3. **可以互相接力**：可以在 IDE 扩展里打开 App 里的对话，也可以在 App 里继续 IDE 里的对话。
4. **不想互相影响**：在 App 输入框里关闭 **IDE context**，App 的提示就不会带上编辑器里打开的文件。
5. **合理做法**：同一个对话只在一边继续，另一边先关掉或切到别的对话，避免两边同时操作；确认两边打开的是同一个项目文件夹。

![App 和 IDE 扩展怎么同步](seed:g1231-sync-compare.png)
*图：本站根据 [Codex 官方文档：IDE extension settings](https://learn.chatgpt.com/docs/developer-settings) 整理的示意图*

## 一、官方的同步说明

官方《IDE extension sync》一节的要点（本站转述）：

- 桌面 App 和 IDE 扩展在同一个项目里时，**共享活动对话和编辑器上下文**；
- 在 App 输入框打开 **IDE context**，可以让 Codex 使用你当前在编辑器里打开的文件；想让 App 的提示排除这些编辑器内容，就关掉它；
- 可以从 IDE 扩展里打开 App 的对话，也可以在 App 里继续 IDE 的对话；
- 两边用同一个项目来决定共享哪些对话和上下文。

另外，官方说明 App 里的 Codex 智能体和 IDE 扩展、CLI 继承同一套配置；MCP 配置放在 `config.toml` 里，所以三个入口共用。

## 二、遇到提示时怎么办

![This is open in another app](seed:g1231-open-decide.png)
*图：本站根据 Codex 官方文档整理的示意图*

1. **先看是不是同一个对话在两边都开着。** 如果是，先在你想继续的一边接着聊，另一边关掉这个对话或换成别的对话；
2. **想换到另一边继续**：用官方说的方式，在 IDE 里打开 App 的对话，或在 App 里继续 IDE 的对话，不要两边同时发消息；
3. **不确定是不是同一个项目**：核对 App 里的项目和 VS Code 打开的文件夹是不是同一个，官方说共享按项目判断；项目在 WSL 里时，Windows 桌面 App 和 WSL 里的 CLI 默认不共享配置、登录缓存和会话历史，见 [/guides/codex-401-unauthorized-error](/guides/codex-401-unauthorized-error)；
4. **只想各用各的**：关闭 App 输入框里的 IDE context；
5. **重启 App 和编辑器**，再不行，按官方方式反馈：在输入框输入 `/` 提交反馈，会得到一个会话 ID，也可以到 GitHub 的 openai/codex 先搜相同的问题。

官方《Troubleshooting》里和「卡住」有关的建议也适用：看 Codex 是不是在等你批准某个操作；打开终端运行 `git status` 这样的基本命令；用更小的提示开新对话。

## 三、App 和 IDE，分别什么时候用

- **IDE 扩展**：官方的定位是在代码旁边使用 Codex，把打开的文件和选区带进提示，在编辑器旁审查改动，需要时把长任务交给 Codex 云端；
- **桌面 App**：管理项目、并行对话、审查结果，见 [/guides/chatgpt-and-codex-merged-relationship](/guides/chatgpt-and-codex-merged-relationship)；
- 扩展的安装和不加载排查见 [/guides/codex-vscode-extension-install-not-loading](/guides/codex-vscode-extension-install-not-loading)。

## 常见问题

**Q：关掉 IDE context 会影响 IDE 里的对话吗？**
官方说关掉的是 App 输入框里使用编辑器文件的开关，用来让 App 的提示排除编辑器内容；对 IDE 里自己的对话，官方没有进一步说明。

**Q：对话会丢吗？**
官方的说法是两边按项目共享活动对话，没有写这个提示意味着对话会丢失。

**Q：其他报错？**
见 [/guides/codex-common-errors-summary](/guides/codex-common-errors-summary)；额度见 [/guides/codex-usage-limits](/guides/codex-usage-limits)。

## 参考资料

- Codex 官方文档：IDE extension settings — https://learn.chatgpt.com/docs/developer-settings
- Codex 官方文档：Codex IDE extension — https://learn.chatgpt.com/docs/codex/ide
- Codex 官方文档：Troubleshooting — https://learn.chatgpt.com/docs/reference/troubleshooting
