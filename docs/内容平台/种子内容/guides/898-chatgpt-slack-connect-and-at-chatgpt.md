---
title: ChatGPT 怎么和 Slack 一起用：在 ChatGPT 里查 Slack、在 Slack 里 @ChatGPT，两种方式有什么区别
slug: chatgpt-slack-connect-and-at-chatgpt
products: [chatgpt]
models: []
accountTier: PLUS
excerpt: ChatGPT 和 Slack 现在有两种用法：自己在 ChatGPT 里连接 Slack，让它搜索总结你有权限的频道；或者由管理员在 Slack 里启用 @ChatGPT 助手。按 OpenAI 帮助中心讲清区别、连接步骤、连不上怎么办，以及它能看到和做什么。
checkedOn: 2026-10-14
sources:
  - https://help.openai.com/en/articles/12525822-using-slack-in-chatgpt
  - https://help.openai.com/en/articles/20001537-using-chatgpt-in-slack-and-microsoft-teams
  - https://help.openai.com/en/articles/20001494-connecting-and-managing-app-accounts-in-chatgpt
verify:
  - 官方对 Slack 的付费计划要求，文章内部有出入：个人设置一节写「符合条件的 Plus、Pro、Business、Enterprise、Edu 用户可连接」，FAQ 写「不需要付费 Slack 计划，但需要付费 ChatGPT 计划」；本文按这两处写，实际以你账号里的显示为准
  - 官方说明旧的 Slack 侧边栏用法正在迁移到 @ChatGPT 助手，现有安装需要升级 Slack 权限；具体迁移安排本文没有展开，请向你的管理员确认
  - 官方说 @ChatGPT 上线时不记录也不访问记忆，后续可能变化
  - 「Apps」「Plugins」「Connect」等按钮的中文名称以实际界面为准
---

> 本文根据 OpenAI 帮助中心《Using Slack in ChatGPT》《Using @ChatGPT in Slack and Microsoft Teams》《Connecting and managing app accounts in ChatGPT》整理，资料核对于 2026-10-14。这些官方文章没有配界面截图，配图为本站整理的示意图。

## 适用于谁

- 搜「ChatGPT Slack」，想弄清是「ChatGPT 里查 Slack」还是「Slack 里用 ChatGPT」的人；
- 想让 ChatGPT 帮你总结频道、补读未读线程的人；
- 在 Slack 里看到 @ChatGPT，不知道它用谁的账号、能看到什么的人；
- 连接 Slack 时碰到「被要求重新连接」「点不了 Connect」的人。

## 结论先说

1. **有两种用法，互相独立**，官方也分成两篇文章：
   - **A. 在 ChatGPT 里连接 Slack**：你自己在设置里连接，之后在 ChatGPT 对话里让它搜索、总结你有权限访问的 Slack 消息、线程和频道。
   - **B. 在 Slack 里 @ChatGPT**：由你们组织的管理员安装并启用 @ChatGPT 助手，大家在 Slack 的频道里直接提及它。官方说，**这和 A 是两回事**。
2. **A 的连接入口**：在 **Apps 或 Plugins**（取决于你的账号显示哪个）里找到 **Slack**，点 **Connect**，完成 Slack 的授权流程。官方说，符合条件的 **Plus、Pro、Business、Enterprise、Edu** 用户可以连接，具体可用性取决于套餐、地区和工作区设置。
3. **一次只能连一个 Slack 工作区**：想换，先断开当前的，再连新的。
4. **它只能看到你有权限的内容**：A 里，ChatGPT 能访问的是你自己在 Slack 里有权限的对话、线程和频道。
5. **B 用的是服务账号**：@ChatGPT 是通过一个专门配置的服务账号运行的，**不是你的个人 ChatGPT 账号**；你的个人记忆、自定义指令、技能和对话历史不会自动带过去，需要的上下文要写进请求里。

![ChatGPT 和 Slack 的两种用法：在 ChatGPT 里查 Slack、在 Slack 里 @ChatGPT](seed:g898-slack-two-ways.png)
*图：本站根据 [OpenAI 帮助中心：Using Slack in ChatGPT](https://help.openai.com/en/articles/12525822-using-slack-in-chatgpt) 与 [Using @ChatGPT in Slack and Microsoft Teams](https://help.openai.com/en/articles/20001537-using-chatgpt-in-slack-and-microsoft-teams) 整理的示意图*

## 一、在 ChatGPT 里连接 Slack（用法 A）

![在 ChatGPT 里连接 Slack 的 4 步](seed:g898-slack-connect-steps.png)
*图：本站根据 [OpenAI 帮助中心：Using Slack in ChatGPT](https://help.openai.com/en/articles/12525822-using-slack-in-chatgpt) 整理的示意图*

### 步骤

官方的个人设置步骤：

1. 在 **Apps 或 Plugins** 里找到 **Slack**；
2. 点 **Connect**；
3. 对**你要连接的 Slack 工作区**完成授权流程。

连好后，在 ChatGPT 对话里直接描述需求即可。官方文章说，Slack 应用开启且相关时，ChatGPT 可以自动在对话里使用它，**不必每次手动调用**；官方说明可用的场景是**聊天、深度研究和智能体**。

### 能做什么

按官方说明：

- **搜索和总结**：总结频道和私信里的讨论，从中提炼信息；按关键词搜索频道和私信（所有 Slack 套餐都可以）；
- **语义搜索**：按含义搜，需要受支持的 Slack Business+ 或 Enterprise+ 工作区，并且启用了 Slack AI 搜索；
- **做简报**：把散落在一个频道里的信息整理成回顾或简报；
- **执行 Slack 操作**：在管理员启用的情况下，可以代你加入频道、创建提醒、上传文件、更新你的 Slack 个人资料等；
- **频道名不用写全**：官方说频道匹配是模糊的，名字相近就行，提到频道时也**不需要写 # 号**。

官方文章里的示例提问：

> 总结一下本周 #engineering-team 频道里的讨论，给出主要话题和决策的简明概览。

> 帮我把我所有未读的 Slack 线程过一遍。

> 给我 #incident-service-unavailable 频道最近的更新，包括事故根本原因的总结。

> 做一份一页纸的会议简报，写出本周 #Marketing 频道讨论的要点，并列出行动项。

### 用 Slack 频道动态触发任务

官方说，符合条件的用户可以在 **Work** 里创建**事件触发**的任务，对已连接 Slack 频道里的**新消息**做出响应：

1. 在 **Settings → Apps 或 Plugins** 里连接 Slack；
2. 把 **@ChatGPT 添加到**你要监控的每个公开或私有频道；
3. 打开 Work，描述 Slack 里发生什么、ChatGPT 应当做什么；
4. 检查任务详情里的 **Trigger（触发）**、**Condition（条件）**、**Prompt（提示）**。

触发只对应用已加入的频道里的消息有效，可以按频道、发送者或线程收窄；**私信、表情回应、消息编辑和删除不会触发任务**。Enterprise、Edu 和医疗版的管理员要先开启「允许 Work 的事件触发定时任务」。定时任务的整体用法见 [/guides/chatgpt-scheduled-tasks](/guides/chatgpt-scheduled-tasks)。

分享这类任务时：分享链接**不会转移**你的 Slack 连接、凭证、频道访问权或消息历史，但**任务说明的文字是可见的**，分享前要去掉敏感的 Slack 内容；接收的人要连接自己的 Slack 账号。

### 它请求哪些权限

官方在文章里列出了 ChatGPT Slack 应用请求的 Slack 权限范围，包括 `search:read.public`、`search:read.private`、`search:read.mpim`、`search:read.im`、`search:read.files`、`search:read.users`、`chat:write`、`channels:history`、`groups:history`、`mpim:history`、`im:history`、`canvases:read`、`canvases:write`、`users:read`、`users:read.email` 等；执行 Slack 操作还可能请求额外权限（例如创建提醒需要 `reminders:write`，上传文件需要 `files:write`，更新个人资料需要 `users.profile:write`）。**连接前看一眼 Slack 的授权页**，确认你接受这些权限。这些权限范围的含义，以 Slack 的定义为准。

## 二、连不上、结果不对怎么办

![Slack 连不上或结果不对：管理员启用、一次一个工作区、重新授权、保留期、语义搜索、配额](seed:g898-slack-troubleshoot.png)
*图：本站根据 [OpenAI 帮助中心：Using Slack in ChatGPT](https://help.openai.com/en/articles/12525822-using-slack-in-chatgpt) 整理的示意图*

- **找不到 Slack，或 Connect 点不了**：官方说，在 **Enterprise 和 Edu 工作区**，Slack 应用必须已为你的工作区启用，并且对你的账号可用；管理员可用基于角色的访问控制管理谁能用。**Business 工作区**里 Slack 应用默认启用。通用的「应用不见了」排查见 [/guides/chatgpt-notion-connect-not-working](/guides/chatgpt-notion-connect-not-working) 的第二节；
- **被要求重新连接 Slack**：官方说，这通常是因为 ChatGPT 需要一个你的账号还没授予的 Slack 权限范围，比如工作区管理员开启了需要新权限的 Slack 动作。如果 Slack 管理员还没批准所需范围，新动作可能一直不可用，而**之前可用的动作应继续工作**。需要时，Slack 管理员可能要批准或重新安装更新后的 ChatGPT Slack 应用；
- **想连第二个工作区**：不行，一次只能连一个。先断开当前的，再连新的；
- **搜不到某些旧消息或文件**：官方说，ChatGPT 只访问**请求时**通过 Slack 接口对你可用的内容；已删除或因 Slack 保留策略不再可用的消息和文件不会出现。检查你的 Slack 保留策略和频道访问权限；
- **按含义搜却只匹配关键词**：语义搜索只在受支持的 Slack Business+ 或 Enterprise+ 且启用 Slack AI 搜索时可用，其他情况用关键词；Slack 管理员也可以限制对 AI 功能的访问；
- **额度问题**：官方说，用深度研究、Pro 模型或智能体可能会用尽**你个人**的 Slack API 额度，即使工作区整体限额没到。

通用的连接、重新连接和断开步骤（**Settings → Plugins → 选 Slack → 账号旁「•••」→ Disconnect**），见 [/guides/chatgpt-plugins-connected-apps](/guides/chatgpt-plugins-connected-apps) 和 [/guides/chatgpt-gmail-google-calendar-connect](/guides/chatgpt-gmail-google-calendar-connect) 的「怎么断开」一节。

## 三、在 Slack 里 @ChatGPT（用法 B）

这部分是给**使用者**看的；管理员的安装配置另有官方文章《Setting up and managing @ChatGPT in Slack and Microsoft Teams》，本文不展开。

- **谁开通**：你们组织必须先安装并启用 @ChatGPT 助手，才能使用。问管理员它在哪些地方可用、能用哪些公司工具。官方说，如果你以前用过 Slack 侧边栏里的 ChatGPT，要向管理员问清如何迁移到 @ChatGPT；
- **怎么开始**：在组织已启用 @ChatGPT 的频道里，**提及 @ChatGPT** 并描述你要做什么；读回复、核对细节；要改的话再次 @ChatGPT。示例：「@ChatGPT，根据我们在这个线程里的讨论，写一份简短的项目进展。」在 Slack 里，需要先**把 @ChatGPT 添加到频道**；管理员也可以限制哪些频道能和它发起对话，**私信不受频道限制**；
- **账号**：它走的是服务账号。在已启用的频道里，你**不用**连接自己的 ChatGPT 账号就能提需求，除非管理员要求；涉及你个人应用的请求，要另外连接和授权。给 @ChatGPT 发私信，**不会**自动切换成你的个人 ChatGPT 账号；
- **它能看到什么**：它使用它拿得到的对话上下文和你们组织配置的工具，**不会自动继承你本人的文件、应用或私密频道的访问权**。连接公司工具后，由连接账号的权限决定它能读什么、做什么。比如让它读某份文档，要提供文档名称或直链并说明要什么——**你自己能打开文档，不代表 @ChatGPT 能打开**；
- **Allow for a week**：在 Slack 里看到这个选项，可以点选，让它在 7 天内记住所请求的访问级别；多人参与时仍可能让你确认这件事是为你做的；
- **回复谁看得到**：共享对话里的回复，参与者都能看到，发消息或授权个人连接前要想想这个受众；生成的文件有自己的权限，同事可能看得见链接却打不开文件；
- **记忆**：官方说 @ChatGPT 在上线时不记录也不访问记忆；
- **没有响应**：确认你在正确的 Slack 工作区，在一个新线程里 @ChatGPT，先用消息里自带的信息提一个请求；仍然不行，把消息链接和大致时间发给你的管理员。

## 常见问题

**Q：Slack 里的 @ChatGPT 和我自己的 ChatGPT 是同一个账号吗？**
不是。它用服务账号运行，你的 Slack 或 Teams 账号只用来识别是谁在提请求。

**Q：连了 Slack，ChatGPT 能看到所有频道吗？**
不能。只能看到你本人在 Slack 里有权限访问的对话、线程和频道。

**Q：需要付费的 Slack 吗？**
官方 FAQ 写的是不需要付费的 Slack 计划，但需要付费的 ChatGPT 计划；没启用 Slack AI 搜索时，搜索用关键词。官方文章内部对此有出入，以你账号里的显示为准。

**Q：ChatGPT 能代我发 Slack 消息吗？**
官方说，在管理员启用的情况下，可以代你执行部分 Slack 操作，比如加入频道、创建提醒、上传文件、更新个人资料；具体能做什么以你们工作区启用的动作为准。

**Q：Slack 数据安全吗？**
官方提醒：Slack 是第三方服务，使用 ChatGPT Slack 应用时，相关请求和数据可能会传给 Slack，由 Slack 的条款、隐私、保留和数据驻留政策管理；启用前先看你们组织的 Slack 政策。

**Q：Microsoft Teams 呢？**
官方的 @ChatGPT 助手同时支持 Slack 和 Microsoft Teams，Teams 的具体用法以你们组织的说明为准。

**Q：想知道各套餐能不能用？**
见 [/guides/chatgpt-plans-comparison](/guides/chatgpt-plans-comparison)；要开通 ChatGPT Plus，可以看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

## 参考资料

- OpenAI 帮助中心：Using Slack in ChatGPT — https://help.openai.com/en/articles/12525822-using-slack-in-chatgpt
- OpenAI 帮助中心：Using @ChatGPT in Slack and Microsoft Teams — https://help.openai.com/en/articles/20001537-using-chatgpt-in-slack-and-microsoft-teams
- OpenAI 帮助中心：Connecting and managing app accounts in ChatGPT — https://help.openai.com/en/articles/20001494-connecting-and-managing-app-accounts-in-chatgpt
