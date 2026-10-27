---
title: ChatGPT 工作模式（Work）怎么用：网页、手机、桌面版的开启步骤，文件权限、批准操作和用量怎么算
slug: chatgpt-work-how-to-use-steps
products: [chatgpt]
models: []
accountTier: PLUS
excerpt: ChatGPT 的 Work 怎么开、怎么用？按 OpenAI 帮助中心，网页和手机里选 Work，桌面版从菜单选 ChatGPT 再切换到 Work。本文讲清各平台的开启步骤、能不能读本机文件、怎样批准操作、事件触发任务的限制，以及 Work 的用量和 Chat 有什么不同。
checkedOn: 2026-10-27
sources:
  - https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex
  - https://help.openai.com/en/articles/10291617-scheduled-tasks-in-chatgpt
  - https://chatgpt.com/download/
verify:
  - Work 是分批开放的，官方文章说有些账号可能还看不到；入口位置和菜单以你账号里实际看到的为准
  - 官方文章没有给出完整的任务示例，也没有写怎样停止正在运行的任务，正文不写这两点
  - 官方文章页面没有给出更新日期
  - 官方文章没有提到 Agent 模式；本站把 Agent 并入 Work 的说明见另一篇文章
  - 用量规则写的是「和 Codex 用同一套结构」，具体额度数字官方文章没给，以 Codex 定价页为准
---

> 本文根据 OpenAI 帮助中心《ChatGPT Work and Codex》《Scheduled tasks in ChatGPT》整理，资料核对于 2026-10-27。Work 在分批开放，功能和入口变化较快，请以官方文章和你账号里显示的为准。配图为本站整理的示意图，不是界面截图。Work 和 Chat 的区别见 [/guides/chatgpt-chat-vs-work-difference](/guides/chatgpt-chat-vs-work-difference)，本文重点讲具体怎么操作。

## 适用于谁

- 听说 ChatGPT 有 Work，不知道在哪开的人；
- 想让 ChatGPT 做一份文档、表格或演示文稿的人；
- 担心 Work 会乱动电脑里文件的人；
- 想知道 Work 算不算额度、和 Chat 有什么不同的人。

## 结论先说

1. **Work 是处理「更长的多步骤任务」的入口**：官方说它最后交付的是成品，比如文档、表格、演示文稿、报告或 Site。Chat 负责快速问答，Codex 负责写代码。
2. **网页和手机**：打开 ChatGPT，选 **Work**，新建对话或打开一个项目，加文件和背景信息，然后描述任务。
3. **桌面版**：从菜单里选 **ChatGPT**，用上方的开关切到 **Work**，新建对话或打开项目，描述你想要的成果；也可以打开本机的一个文件夹。
4. **读你电脑里的文件，只有桌面版能做到**，并且要你允许；网页和手机上的 Work **不能访问你电脑上的文件**。
5. **重要操作要你批准**：网页和手机用屏幕上的按钮批准或拒绝，**不支持语音批准**。
6. **Work 的用量和 Codex 是同一套结构**，不是普通聊天额度，每个任务消耗不同。
7. **不是所有人都有**：官方说 Work 在网页和手机上面向符合条件的付费套餐，在桌面版里取决于套餐和工作区。

![在 ChatGPT 里开始一个 Work 任务的步骤：网页与手机、桌面版、加文件、描述成果、批准操作](seed:g1148-work-steps.png)
*图：本站根据 [OpenAI 帮助中心：ChatGPT Work and Codex](https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex) 整理的示意图*

## 一、Chat、Work、Codex 分别做什么

官方文章把 ChatGPT 的三种用法这样分：

- **Chat**：快速的对话式帮助、问答、头脑风暴；
- **Work**：更长、多步骤、最后要交付成品的任务，成品可以是文档、表格、演示文稿、报告或 Site；
- **Codex**：软件开发，写代码和调试、跑测试、审查改动、处理代码仓库；
- **Voice（语音）**：给 Work 增加实时语音，网页和手机上用于 Work，桌面版里 Work 和 Codex 都可以用。

![Chat、Work、Codex、Voice 的分工对照表](seed:g1148-chat-work-codex.png)
*图：本站根据 [OpenAI 帮助中心：ChatGPT Work and Codex](https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex) 整理的示意图*

Work 和 Codex 的更详细比较见 [/guides/chatgpt-work-vs-codex](/guides/chatgpt-work-vs-codex)。

## 二、各平台怎么开始

### 网页或手机

1. 打开 ChatGPT；
2. 选 **Work**；
3. 开始一个新对话，或者打开一个项目（项目的用法见 [/guides/chatgpt-projects](/guides/chatgpt-projects)）；
4. 添加文件和背景信息；
5. 用文字描述任务。

### 桌面版（macOS、Windows）

1. 打开桌面版，从菜单选择 **ChatGPT**；
2. 在页面上方的开关里选 **Work**；
3. 开始新对话或打开项目；
4. 描述你想要的成果；
5. 需要的话，打开本机的一个**本地文件夹**。

桌面版的下载和新旧版本区别见 [/guides/chatgpt-desktop-app](/guides/chatgpt-desktop-app) 和 [/guides/chatgpt-classic-vs-new-desktop-app](/guides/chatgpt-classic-vs-new-desktop-app)。**找不到 Work 的话**，先看你的套餐是否包含，再更新桌面版，见 [/guides/chatgpt-cant-find-new-model-gpt-6-codex](/guides/chatgpt-cant-find-new-model-gpt-6-codex)。

### 语音

在 Work 里选 **Voice** 控件，就可以开始一次 Live 对话。网页和手机上，Work 里的语音使用的是你**每天的语音额度（分钟）**，语音功能本身见 [/guides/chatgpt-voice-mode](/guides/chatgpt-voice-mode)。

## 三、Work 能不能读我电脑里的文件

官方文章的说法：

- **桌面版**的 Work，**经你允许**后可以使用**本地文件和桌面应用**；
- **网页和手机**的 Work 在云端运行，**不能访问你电脑上的文件**；
- 云端的 Work 在云上运行；本地的 Work 在你的电脑上运行，**但消息和任务上下文可能存在云端**。

所以，需要读本机文件做表格或报告，用桌面版；只想让它基于你上传的文件和网络资料做东西，网页和手机就够了。想让它生成 Word、Excel、PPT，见 [/guides/chatgpt-create-word-excel-ppt](/guides/chatgpt-create-word-excel-ppt)。

## 四、批准重要操作

- 在网页和手机上，Work 要做重要操作时，你用**屏幕上的控件**批准或拒绝；
- **不支持用语音说「同意」来批准**；
- 官方在计划任务文章里也写了：任务运行时，你可以查看进度、回答问题、改变方向、批准重要操作。

## 五、计划任务和事件触发任务

Work 里还能设**计划任务**：

- 可以**运行一次**、**按计划重复**、**由触发条件触发**，或者**监控变化**；
- **事件触发的任务**可以响应已连接应用里的事件，官方举例：新的 Gmail 邮件、Slack 频道的新消息、GitHub 拉取请求的动态；
- 这类任务**在网页或支持的手机 App 上创建和编辑，不能在桌面版上创建和编辑**；
- 事件触发任务**不适用于 Free、Go，也不适用于 FedRAMP 工作区**。

计划任务页面在哪、数量上限，见 [/guides/chatgpt-scheduled-tasks-missing](/guides/chatgpt-scheduled-tasks-missing) 和 [/guides/chatgpt-scheduled-tasks](/guides/chatgpt-scheduled-tasks)。

## 六、Work 的用量

官方文章写的是：

- **Work 和 Codex 使用同一套用量结构**；
- GPT-6 Astra 从套餐的**内含额度**里扣，Plus 和 Business 标准席位的 Astra 用量有限，用完后可以选用积分；
- **不同任务消耗不同**，官方让你去看 Codex 定价页了解内含用量和积分；
- 网页和手机上，Work 里的 Voice 用的是你每天的语音分钟额度。

具体额度数字官方文章没有给，也不要照网上的数字理解。额度怎么看见 [/guides/chatgpt-usage-limits-check-reset](/guides/chatgpt-usage-limits-check-reset)。想要更高的套餐，可以看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus) 和 [/chongzhi/chatgpt-pro](/chongzhi/chatgpt-pro)。

## 七、管理员能管什么

如果你用的是公司或学校的工作区：官方说管理员可以在 **Permissions & roles（权限与角色）**里，**分别**管理 **Work Cloud、Work Local 和 Codex Local**，改 Work 的设置不会改变 Codex Local 的权限；**Chat 在所有配置里都保留**。所以同一个工作区里别人有 Work、你没有，先问管理员。

## 常见问题

**Q：Work 和以前的 Agent 模式是一回事吗？**
官方 Work 文章没有提到 Agent 模式。本站对 Agent 并入 Work 的说明见 [/guides/chatgpt-agent-mode](/guides/chatgpt-agent-mode)。

**Q：我是 Free，能用 Work 吗？**
官方文章写的是网页和手机面向符合条件的付费套餐。官方下载页（chatgpt.com/download）写明 Work 在 Plus、Pro、Business、Enterprise 套餐可用。

**Q：手机上的 Work 能读电脑里的文件吗？**
不能，官方说网页和手机的 Work 不能访问你电脑上的文件。

**Q：能用语音批准操作吗？**
不能，官方说网页和手机上不支持语音批准。

## 参考资料

- OpenAI 帮助中心：ChatGPT Work and Codex — https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex
- OpenAI 帮助中心：Scheduled tasks in ChatGPT — https://help.openai.com/en/articles/10291617-scheduled-tasks-in-chatgpt
