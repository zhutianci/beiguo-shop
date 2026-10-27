---
title: ChatGPT 和 Codex 合并了吗、是什么关系：新桌面 App 里的 Chat、Work、Codex 三个入口怎么分
slug: chatgpt-and-codex-merged-relationship
products: [chatgpt, codex]
models: []
accountTier: PLUS
excerpt: ChatGPT 和 Codex 合并了吗？官方的说法是：新的 ChatGPT 桌面 App 把 Chat、Work 和 Codex 放在同一个 App 里，但 Codex 仍是独立视图，历史分开，网页和手机上不能选 Codex。本文按官方帮助中心整理它们的关系和各自的用法。
checkedOn: 2026-10-28
sources:
  - https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex
  - https://help.openai.com/en/articles/20001276-moving-to-the-new-chatgpt-desktop-app
  - https://learn.chatgpt.com/docs/use-chatgpt
verify:
  - 官方没有用「合并」这个词，本文按官方原话整理成「同一个桌面 App、三个入口」，Codex 仍是独立视图
  - 官方说明 Codex 在网页和手机上不可选，手机 App 可通过 Remote 标签访问桌面端的 Codex 对话，界面名称以当前版本为准
  - 帮助中心文章当天显示刚更新过，之后可能调整，以官方最新版为准
---

> 本文根据 OpenAI 帮助中心《ChatGPT Work and Codex》《Moving to the new ChatGPT desktop app》和 Codex 官方文档《Use ChatGPT》整理，资料核对于 2026-10-28。**官方没有说「合并成一个产品」**，说的是新桌面 App 同时包含三个入口。配图为本站整理的示意图，不是软件截图。

## 适用于谁

- 听说 Codex 和 ChatGPT 合并了，想弄清楚到底是什么关系的人；
- 更新后发现 Codex App 变成了 ChatGPT，不知道有什么变化的人；
- 在网页或手机上找不到 Codex 的人。

## 结论先说

1. **更准确的说法是：新的 ChatGPT 桌面 App 把 Chat、Work 和 Codex 放在了一起**，支持 macOS 和 Windows。在桌面端从菜单选 **ChatGPT** 或 **Codex**；在 ChatGPT 里用开关选 **Chat** 或 **Work**。
2. **Codex 仍是独立的视图。** 官方原话的意思是：Codex 的工作流没变，它的历史记录与 ChatGPT 的历史分开。Chat 和 Work 的对话则一起放在 Recents 里。
3. **三者分工**：Chat 用于提问、搜索、头脑风暴；Work 用于交付文档、表格、演示稿、报告或网站这类成品；Codex 用于软件开发，用本地文件、仓库、终端和开发者工具。
4. **Codex 在网页和手机上不能选。** 手机 App 里可以通过 **Remote** 标签访问桌面端的 Codex 对话。
5. **额度**：官方说 Work 沿用和 Codex 相同的使用结构，登录 Codex 用 ChatGPT 账号就用你的 ChatGPT 套餐额度，用自己的 API 密钥就按 API 价格。详见 [/guides/codex-usage-limits](/guides/codex-usage-limits)。

![新 ChatGPT 桌面 App 里的三个入口](seed:g1223-entry-compare.png)
*图：本站根据 [OpenAI 帮助中心：ChatGPT Work and Codex](https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex) 整理的示意图*

## 一、你现在用的是哪个 App

官方《Moving to the new ChatGPT desktop app》分三种情况：

![合并了吗：按你现在用的 App 看](seed:g1223-merge-decide.png)
*图：本站根据 [OpenAI 帮助中心：Moving to the new ChatGPT desktop app](https://help.openai.com/en/articles/20001276-moving-to-the-new-chatgpt-desktop-app) 整理的示意图*

- **已经在用 Codex App**：照常更新，更新后它就变成新的 ChatGPT 桌面 App，里面有 Chat、Work 和 Codex。原有的 Codex 对话和项目应该保留，更新后的 App 对 Codex 老用户默认打开 Codex，可以在设置里保持 Codex 为默认；
- **已经在用旧的 ChatGPT 桌面 App**：按 App 内提示下载新 App，用同一个 ChatGPT 账号登录。新 App 可能和旧 App 并存，这时会看到 **ChatGPT**（新 App）和 **ChatGPT Classic**（旧 App）。官方说 Classic 可以继续用，不要求迁移，仍会收到模型更新、缺陷修复和安全补丁，但新的智能体功能可能只在新 App 里；
- **第一次安装**：下载桌面 App，打开登录。

新旧 App 的详细区别见 [/guides/chatgpt-classic-vs-new-desktop-app](/guides/chatgpt-classic-vs-new-desktop-app)，Windows 版的安装见 [/guides/codex-windows-app-download-install](/guides/codex-windows-app-download-install)。

## 二、Chat、Work、Codex 怎么选

官方《Use ChatGPT》的建议：Chat 用于一问一答或来回讨论；想让 ChatGPT 把更大的任务做到一个可审阅的结果时，在切换器里打开 Work；需要开发者视图或更多技术细节、尤其是做软件开发时，选 Codex。

| 选择 | 适合 | 例子 |
| --- | --- | --- |
| Chat | 和 ChatGPT 讨论 | 提问、网页搜索、头脑风暴、起草消息、比较方案 |
| Work | 定义结果并得到可审阅的成品 | 做演示稿、分析文件、写报告、做项目计划 |
| Codex | 用开发者工具并看技术细节 | 调试代码、跑测试、审 PR、实现功能 |

Work 和 Codex 的详细区别见 [/guides/chatgpt-work-vs-codex](/guides/chatgpt-work-vs-codex)，Chat 和 Work 的区别见 [/guides/chatgpt-chat-vs-work-difference](/guides/chatgpt-chat-vs-work-difference)，Work 怎么用见 [/guides/chatgpt-work-how-to-use-steps](/guides/chatgpt-work-how-to-use-steps)。

## 三、网页、手机和云端

- **Work** 在网页和手机上在云端运行；在桌面 App 里，Work 还可以在套餐和工作区允许时使用本地文件和桌面应用（需要你授权）。云端的 Work 对话在网页、手机、桌面之间同步；
- **Codex** 在桌面 App 里用本地文件夹、仓库、终端。**Codex Cloud** 在 OpenAI 托管的电脑上跑编码任务，电脑睡眠时任务也能继续，可以在桌面、网页或手机上开始和继续，见 [/guides/codex-cloud-how-to-use](/guides/codex-cloud-how-to-use)；
- **远程访问**桌面端的 Codex 对话（手机 Remote 标签）和「在云端环境里跑任务」是两回事，前者不会把桌面对话加到网页或手机的聊天历史里，见 [/guides/codex-remote-control-ssh-host](/guides/codex-remote-control-ssh-host)。

## 四、需要哪个套餐

官方 Pricing 页写明 Work 和 Codex 包含在 ChatGPT 的各个套餐里，用量不同；GPT-6 Astra 在 Plus 套餐里可用于 Work 和 Codex。想开通 Plus 可以看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)，套餐区别见 [/guides/chatgpt-plans-comparison](/guides/chatgpt-plans-comparison)。

## 常见问题

**Q：我找不到 Codex？**
先确认是在桌面 App 里，网页和手机上没有这个选项。模型和功能的更多排查见 [/guides/chatgpt-cant-find-new-model-gpt-6-codex](/guides/chatgpt-cant-find-new-model-gpt-6-codex)。

**Q：更新后 Codex 的历史对话会丢吗？**
官方说原有的 Codex 对话和项目应该保留。

**Q：公司的权限设置会变吗？**
官方说这次导航更新不会改变工作区现有的访问权限、安全设置、治理控制或费用模式。

## 参考资料

- OpenAI 帮助中心：ChatGPT Work and Codex — https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex
- OpenAI 帮助中心：Moving to the new ChatGPT desktop app — https://help.openai.com/en/articles/20001276-moving-to-the-new-chatgpt-desktop-app
- Codex 官方文档：Use ChatGPT — https://learn.chatgpt.com/docs/use-chatgpt
