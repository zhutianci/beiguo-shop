---
title: ChatGPT 聊天（Chat）和工作（Work）有什么区别：怎么切换、什么任务该用哪个
slug: chatgpt-chat-vs-work-difference
products: [chatgpt]
models: []
accountTier: PLUS
excerpt: ChatGPT 页面顶部多了 Chat 和 Work 两个选项，有什么区别？按 OpenAI 帮助中心讲清：Chat 适合快速问答，Work 适合长任务和成品文件；桌面、网页、手机分别在哪切换，看不到 Work 开关怎么办，额度和 Codex 的关系。
checkedOn: 2026-10-14
sources:
  - https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex
  - https://help.openai.com/en/articles/20001276-moving-to-the-new-chatgpt-desktop-app
  - https://help.openai.com/en/articles/20001278-creating-and-editing-documents-spreadsheets-and-presentations-with-chatgpt-work
  - https://help.openai.com/en/articles/6825453-chatgpt-release-notes
verify:
  - Work 在各套餐的开放进度会变：发布说明（2026-07-09）写的是面向付费套餐、Free 和 Go 不在首批；帮助文章写「符合条件的付费套餐」，另有 Free 和 Go 能否在桌面使用，以账号界面为准
  - 额度只能写到「Work 和 Codex 用同一套用量结构、与 Chat 分开」，具体数字官方文章没有给统一数字
  - 官方没有把「Chat 不能读电脑上的文件」写成一句话，图里写的是「手动上传文件到对话里」
---

> 本文根据 OpenAI 帮助中心《ChatGPT Work and Codex》《Moving to the new ChatGPT desktop app》《Creating and editing documents, spreadsheets, and presentations with ChatGPT Work》和 ChatGPT 发布说明整理，资料核对于 2026-10-14。这些官方文章没有配界面截图，文中配图为本站整理的示意图。

## 适用于谁

- 打开 ChatGPT，发现页面顶部多了 Chat 和 Work 两个选项，不知道选哪个的人；
- 搜「ChatGPT 聊天和工作有什么区别」「ChatGPT Work 模式」的人；
- 想让 ChatGPT 帮忙做一份文件或完成一个多步任务，不确定要不要切到 Work 的人。

Work 和 Codex 的区别见 [/guides/chatgpt-work-vs-codex](/guides/chatgpt-work-vs-codex)；Work 怎么生成文件见 [/guides/chatgpt-create-word-excel-ppt](/guides/chatgpt-create-word-excel-ppt)。这篇回答的是最前面那个问题：**Chat 和 Work 到底差在哪。**

## 结论先说

1. **Chat 是快问快答**。官方说它用于快速的对话式帮助和日常问题：提问、搜索、头脑风暴。普通聊天仍然保留，官方原话是「快速、熟悉的 Chat 体验仍然可用」。
2. **Work 是做事的**。官方定位是一个为**更长、多步骤的工作和成品**设计的智能体（agent）：研究一个话题、分析信息、创建文档、表格、演示文稿、报告或 Site。你可以看它的进度、回答它的问题、中途改方向、批准重要操作。
3. **Work 还能定期做**。官方说明 Work 可以通过定时任务（Scheduled Tasks）运行一次、按计划或触发条件重复运行，或监控变化。
4. **桌面版里 Work 能碰电脑上的东西**：在你的套餐和工作区允许时，桌面 App 里的 Work 可以在你许可下使用本地文件和桌面应用；网页和手机上的 Work 在云端运行，**不能直接访问你电脑上的文件**。
5. **额度是分开的**：官方说明 Work 与 Codex 采用同一套用量结构，与 Chat 的额度和规则分开。
6. **Work 不是所有人都有**：它面向符合条件的付费套餐，并受工作区设置影响；看不到 Work 开关时不是你操作错了。

## 一、一张图看懂 Chat、Work、Codex

![Chat、Work、Codex 的用途与区别一图看懂](seed:g820-chat-work-codex.png)
*图：本站根据 [OpenAI 帮助中心：ChatGPT Work and Codex](https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex) 整理的示意图*

官方对三个入口的原话归纳：

- **Chat**：提问、搜索、头脑风暴，或获得快速的对话式帮助；
- **Work**：研究一个主题、分析信息，或创建文档、表格、演示文稿、报告或 Site；
- **Codex**：写或调试代码、运行测试和命令、审查改动、处理代码仓库。

另外，官方还介绍了 **Voice**：可以用语音和 Work 交谈，让它去做任务（网页和手机上的 Work，以及桌面 App 里的 Work 和 Codex）。

## 二、什么任务该用哪个

| 你要做的事 | 建议 | 依据 |
|---|---|---|
| 问一个问题、查个概念、改一句话 | Chat | 官方：快速对话式帮助 |
| 做一份 PPT、周报、Excel、研究报告 | Work | 官方：Work 创建文档、表格、演示文稿、报告 |
| 让它连续查多个来源、整理成结论 | Work | 官方：更长、多步骤的任务 |
| 每周一自动整理一份周报 | Work 的定时任务 | 官方：Scheduled Tasks |
| 写代码、改仓库、跑测试 | Codex | 官方：Codex 专用于软件开发 |

用 Work 做文件的步骤和指令写法，见 [/guides/chatgpt-make-ppt-prompts](/guides/chatgpt-make-ppt-prompts)。

## 三、在哪里切换

![在哪里切换 Chat 和 Work：桌面、网页、手机的路径](seed:g820-switch-steps.png)
*图：本站根据 [OpenAI 帮助中心：ChatGPT Work and Codex](https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex) 与 [Moving to the new ChatGPT desktop app](https://help.openai.com/en/articles/20001276-moving-to-the-new-chatgpt-desktop-app) 整理的示意图*

- **桌面 App（macOS、Windows）**：左上角菜单选 **ChatGPT**，然后在页面顶部的开关里选 **Chat** 或 **Work**。Chat 和 Work 的对话会一起出现在 **Recents** 里，可以排序、筛选、置顶；已有的 Projects 也会出现在 **Projects** 下面。从项目里可以选 Chat 开始新对话，或选 Work 带着项目的上下文开始一个 Work 对话。
- **网页**：打开 ChatGPT，选择 **Work**，新建对话或打开项目。
- **手机**：点屏幕顶部的下拉菜单，选 **Chat** 或 **Work**。
- **Codex**：在桌面 App 里从左上角菜单选 **Codex**，是一个独立的视图，历史记录也和 ChatGPT 分开；手机上看桌面 Codex 的对话要去 **Remote** 标签。

云端的 Work 对话在网页、手机和桌面之间同步：在网页或手机上开始的，会出现在桌面 App；桌面上开始的云端 Work 对话也可以在网页或手机上继续。**本地**的对话只在你的电脑上运行。官方还特别提醒：即使 Work 在本地运行，消息和任务上下文也可能存到云端。

## 四、看不到 Work 开关怎么办

按官方的说明，逐项排查：

1. **套餐**：官方发布说明（2026-07-09）写的是 Work 在网页和手机上面向付费套餐开放，Free 和 Go 不在首批；Pro、Pro Lite、Enterprise、Edu 先开，Plus 和 Business 随后。帮助文章现在的说法是「面向符合条件的付费套餐」。需要开通可以看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。
2. **桌面 App 版本**：Work 在新版桌面 App 里。如果你用的是旧版，它现在叫 **ChatGPT Classic**，继续收到模型更新、修复和安全补丁，但 Work 和 Codex 这类新的智能体功能只在新版里提供。
3. **公司或学校账号**：Work 受工作区设置和角色权限控制，管理员可以分别开关「Work Cloud」「Work Local」。看不到时问管理员。官方还提到：Chat 在任何配置下都保持可用。
4. **云端能用、本地不能用**：官方说 Work 在云端和本地的开放进度可能不同步；先确认管理员给了你 Work 权限，再等本地权限的补发完成，之后仍不行再联系客服。

## 常见问题

**Q：Work 会不会替代 Chat？**
不会。官方明确：Chat 仍然可用；桌面上选 ChatGPT 再选 Chat，手机上在顶部下拉里选 Chat。

**Q：Work 比 Chat 更聪明吗？**
官方没有这样比较。它们的差别是做事方式：Chat 一问一答，Work 能做更长的多步任务并交出成品。模型和思考档位的说明见 [/guides/chatgpt-gpt6-sol-terra-luna-astra](/guides/chatgpt-gpt6-sol-terra-luna-astra)。

**Q：Work 做的文件在哪？**
云端 Work 创建的文件可能保存到文件库（Library）；桌面本地产出可能留在本地项目或文件夹，不会自动出现在网页和手机上；临时聊天里创建的文件不会保存到文件库。详见 [/guides/chatgpt-library-files](/guides/chatgpt-library-files)。

**Q：Work 用的额度和聊天共用吗？**
官方说 Chat 和 Work 的使用规则分开，Work 与 Codex 采用同一套用量结构，具体额度看你套餐的页面，例如 [/guides/chatgpt-plans-comparison](/guides/chatgpt-plans-comparison)。

**Q：Work 里能用语音吗？**
官方说明，网页和手机上的 Work 里有 Voice 控件，可以开始实时对话，让 Work 去做任务；桌面 App 里 Work 和 Codex 都可以用 Voice。注意网页和手机上若需要你批准某个操作，要在屏幕上点批准或拒绝，官方说不支持口头批准。

## 参考资料

- OpenAI 帮助中心：ChatGPT Work and Codex — https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex
- OpenAI 帮助中心：Moving to the new ChatGPT desktop app — https://help.openai.com/en/articles/20001276-moving-to-the-new-chatgpt-desktop-app
- OpenAI 帮助中心：Creating and editing documents, spreadsheets, and presentations with ChatGPT Work — https://help.openai.com/en/articles/20001278-creating-and-editing-documents-spreadsheets-and-presentations-with-chatgpt-work
- OpenAI 帮助中心：ChatGPT release notes（2026-07-09 Introducing ChatGPT Work） — https://help.openai.com/en/articles/6825453-chatgpt-release-notes
