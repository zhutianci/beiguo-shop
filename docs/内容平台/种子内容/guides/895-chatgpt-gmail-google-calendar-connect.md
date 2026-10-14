---
title: ChatGPT 怎么连接 Gmail 和 Google 日历：连接步骤、能做什么、连不上怎么办、怎么断开
slug: chatgpt-gmail-google-calendar-connect
products: [chatgpt]
models: []
accountTier: PLUS
excerpt: 想让 ChatGPT 读你的 Gmail 邮件、查 Google 日历？按 OpenAI 帮助中心：在设置 → 插件里连接，登录要用的 Google 账号并批准权限，再用 @ 提及。本文讲连接步骤、「All permissions are required」等报错怎么办、数据会不会用于训练、怎么断开和到 Google 里移除权限。
checkedOn: 2026-10-14
sources:
  - https://help.openai.com/en/articles/20001494-connecting-and-managing-app-accounts-in-chatgpt
  - https://help.openai.com/en/articles/10408842-google-app-data-controls-faq
  - https://help.openai.com/en/articles/20001497-troubleshooting-plugins-apps-in-chatgpt
  - https://support.google.com/accounts/answer/13533235
verify:
  - 官方文章没有逐个套餐列出 Gmail 和 Google 日历的可用范围，只说应用的可用性取决于套餐、地区、账号、平台和工作区；以你账号里「插件」页实际显示为准
  - 「插件」「应用」「连接」等按钮的中文名称以实际界面为准；官方近期把「应用」归入「插件」，不同账号可能显示「Apps」或「Plugins」
  - 官方文章没有给出 Gmail 能做的所有动作清单，文中的示例指令是本站拟的写法；能读、能写到什么程度取决于应用能力、Google 权限和工作区设置
  - Google 一侧的「移除访问权限」路径来自 Google 账号帮助，Google 可能调整界面
---

> 本文根据 OpenAI 帮助中心《Connecting and managing app accounts in ChatGPT》《Google app data controls FAQ》《Troubleshooting plugins & apps in ChatGPT》和 Google 账号帮助整理，资料核对于 2026-10-14。这几篇官方文章没有配界面截图，配图为本站整理的示意图。连接器的总览和名称变迁，见 [/guides/chatgpt-plugins-connected-apps](/guides/chatgpt-plugins-connected-apps)，本文专讲 Gmail 和 Google 日历。

## 适用于谁

- 想让 ChatGPT 帮你查邮件、总结邮件往来、对照日历安排时间的人；
- 点了连接却报「All permissions are required」「ChatGPT needs all requested permissions」的人；
- 担心邮件内容被拿去训练，想知道怎么断开、怎么在 Google 账号里移除授权的人。

## 结论先说

1. **连接入口**：**Settings（设置）→ Plugins（插件）**，选 Gmail 或 Google Calendar 对应的应用，或者包含它的插件；如果看到 **Install plugin**，先安装，它可能同时开始连接流程；然后点 **Connect**，登录你要连接的 Google 账号并批准权限。官方说有的账号显示的是 Apps 而不是 Plugins，看你账号里显示的是哪个。
2. **选对账号最重要**：官方明确说，连接个人账号，**并不会**让你访问只存在于工作账号里的文件、频道或记录。选那个本来就能看到你需要的邮件和日程的账号。
3. **怎么用**：在对话里用 **@** 提及对应的应用，或点 **+** 在菜单里选择它（有的界面放在 **More** 下面），然后描述具体任务。ChatGPT 可能在读取信息或执行操作前请你批准。
4. **只读到你授权账号里的内容**：官方说，ChatGPT 只能访问你所连接的那个 Google 账号里本来就有权限看的内容。
5. **数据不拿去训练**：官方说，OpenAI 不会用来自已连接 Google 应用的数据训练通用模型，也不会用它来投放广告，只有三种例外（见下文第三节）。
6. **断开不等于删除聊天**：在 ChatGPT 里断开 Google 应用，不会自动删除已有的对话和已保存的记忆。

![连接 Gmail 和 Google 日历的 4 步](seed:g895-gmail-connect-steps.png)
*图：本站根据 [OpenAI 帮助中心：Connecting and managing app accounts in ChatGPT](https://help.openai.com/en/articles/20001494-connecting-and-managing-app-accounts-in-chatgpt) 整理的示意图*

## 一、连接步骤

官方给的步骤：

1. 打开 **Settings → Plugins**，选择 Gmail 或 Google Calendar，或者包含它的插件；
2. 如果显示 **Install plugin** 就点它（这也可能直接开始应用的连接或设置流程）；
3. 如果被提示，点 **Connect**，或继续应用的设置流程；
4. 在 Google 的登录页**登录你要连接的账号**；
5. **查看要求的服务和权限**，按提示完成 Google 的授权；
6. 选择本来就能访问你所需信息的那个账号。

官方还提醒了几件事：

- 有的服务商允许在同一次授权里附带相关服务，**逐项看清楚每个被选中的服务**再同意；
- 一个插件可能先被列出或安装，但它里面的应用还没准备好；你仍需要有这个应用的访问权、连对的账号，以及服务商那边要求的批准；
- **可以连多个账号**：有的应用支持，在应用详情里看到 **Connected accounts** 时，点 **Connect another account**。如果用错了账号，可以去查看已连接的账号，支持时也可以在请求里指定要用的账号。

### 能让它做什么

官方这几篇文章只写了「描述你想做什么」，没有给 Gmail 的动作清单。下面是几条示例指令，具体能做到什么程度，取决于应用本身的能力、Google 给的权限和工作区设置：

> @Gmail 找出这周所有来自供应商的邮件，按「需要我回复」「只需知晓」分成两组，每封写一句话摘要。

> @Gmail 帮我找一下上个月关于「合同续签」的邮件，列出时间、发件人和结论。

> @Google Calendar 看一下我下周三下午有没有空，给我三个可以安排一小时会议的时间段。

官方还提到：有的应用能读信息，但不一定能创建、修改、发送或删除；读和写分别取决于应用是否支持、账号是否有权限、Google 是否批准了对应的授权范围、工作区管理员是否允许，以及 ChatGPT 是否在等你批准。权限设置见 [/guides/chatgpt-plugins-connected-apps](/guides/chatgpt-plugins-connected-apps) 里「权限」一节。

另外官方在 Google 应用的说明里提到：符合条件的用户可以在 Work 里创建**由事件触发**的任务，对已连接的 Gmail 里的新邮件作出响应，可以设置发件人或主题条件；想停掉就暂停或删除这个任务，或断开 Gmail。相关任务的设置见 [/guides/chatgpt-scheduled-tasks](/guides/chatgpt-scheduled-tasks)。

## 二、连不上、用不了怎么办

![连不上或用不了：按提示对照怎么处理](seed:g895-gmail-connect-errors.png)
*图：本站根据 [OpenAI 帮助中心：Troubleshooting plugins & apps in ChatGPT](https://help.openai.com/en/articles/20001497-troubleshooting-plugins-apps-in-chatgpt) 与 [Connecting and managing app accounts in ChatGPT](https://help.openai.com/en/articles/20001494-connecting-and-managing-app-accounts-in-chatgpt) 整理的示意图*

### 授权过程中的提示

- **All permissions are required**：点 **Reconnect**，批准所选应用要求的**每一项**权限；
- **ChatGPT needs all requested permissions**（连接 Google 应用时）：点 **Try again**，在 Google 的授权页点 **Select all** 批准所有请求的权限；
- 只想连部分 Google 应用：在 ChatGPT 里点 **Select fewer apps** 选择你要的应用；但所选应用要求的权限仍然要全部批准；
- 先自查几件事：选对了 Google 账号吗？你在 Google 服务里能直接访问相关信息吗？所选服务的权限是不是都批准了？是否满足工作区批准的账号域名要求？是否还需要 Google 那边的管理员另外批准？

### 公司或学校的 Google 账号

官方在 Google 应用的说明里写道：如果你的 Google 账号归公司或学校的 Google Workspace 管理，这个组织的设置可能限制 ChatGPT 这个应用能请求哪些 OAuth 权限范围。要用的动作没有被批准时，你在连接、重新连接或使用时可能看到授权、需要管理员批准或权限错误。处理办法是：**Google Workspace 管理员批准缺失的权限范围**，或者 **ChatGPT 工作区管理员关闭需要该权限的动作**。ChatGPT 的工作区管理员和 Google 的管理员可能是不同的人。

官方列出的 Gmail 请求的 Google 权限范围是 `gmail.modify`，Google 日历是 `calendar.events`（以及用于 Google Meet 相关动作的 `meetings.space.readonly`）。这些权限范围的具体含义以 Google 的定义为准。

### 已连接但 ChatGPT 用不了

官方说，应用显示 **Connected** 并不代表在当前聊天、模型或平台里都能用：

1. 确认用的是对的 ChatGPT 工作区和对的 Google 账号；
2. 看这个应用对你选的模型和平台有没有要求；
3. **新开一个对话**，用应用的入口，提一个具体的、支持的任务，比如「按标题找一封邮件」；
4. 如果控件仍然缺失、或授权检查后仍有问题，**不要反复重连**，查看 OpenAI 服务状态并联系客服，并写明应用和插件名称、账号或工作区、完整提示信息、所选模型和使用的界面、你试过的步骤、尝试的日期时间和时区，以及去掉敏感信息的截图。**不要在给客服的消息里附上密码、访问令牌或敏感对话内容**。

### 显示 Disabled by admin 或受工作区限制

在受管理的工作区里，需要管理员在 **Workspace settings → Apps** 里检查这个应用；Enterprise 和 Edu 还要看基于角色的权限，Business 则看工作区范围内是否启用。如果你用的是个人账号、没有工作区管理员，官方说这条提示**不一定**说明有管理员封了它，要检查套餐、地区、服务商账号、应用版本和使用平台；仍然出现就联系 OpenAI 客服，见 [/guides/chatgpt-contact-support](/guides/chatgpt-contact-support)。

### 找不到我期望的邮件或日程

官方说，要确认连的是对的服务商账号；支持多账号时，可能需要在请求里指定账号；连接应用不会创造额外的源系统权限，也就是说你本来在 Gmail 里就看不到的东西，ChatGPT 也看不到。

## 三、数据会不会被拿去训练

按官方 Google 应用数据说明：

- **不训练**：不会用直接来自已连接的 Google 应用的数据，或它的衍生数据，训练通用模型，也不会用它来定向投放广告；
- **三种例外**：对话作为反馈提交时（比如点赞或点踩）、你手动复制粘贴或上传到 ChatGPT 对话里的 Google 应用数据、以及 ChatGPT 的回答里已包含的内容；
- **「改进所有人的模型」开关**：即使它是开着的，也不会拿直接来自连接的 Google 应用的数据来训练通用模型；它关着时，即使应用数据出现在你的对话里，也不会用来改进模型；
- **记忆**：开启记忆时，来自已连接 Google 应用的合格信息可能帮助个性化 ChatGPT；有些来源或流程不会保存新记忆。想关记忆或删除，去 **Settings → Personalization**；
- **推荐提示**：如果你看到基于 Google 数据的推荐提示，可以在 **Settings → Personalization** 关掉 Suggested prompts（如果有这个开关），这不会断开 Google 应用；
- **普通连接不会自动建同步索引**：官方说，个人的 Google 应用同步已不再提供；管理员管理的同步是另一回事。
- 邮件里可能有你认为敏感的信息，官方的原则是：只在你放心让 ChatGPT 使用这些数据时才启用 Google 应用。

![连接前确认 5 件事：账号、权限、敏感信息、断开不等于删除、如何停掉](seed:g895-gmail-before-connect.png)
*图：本站根据 [OpenAI 帮助中心：Google app data controls FAQ](https://help.openai.com/en/articles/10408842-google-app-data-controls-faq) 整理的示意图*

## 四、怎么断开

**在 ChatGPT 里断开：**

1. 打开 **Settings → Plugins**，选相关的插件或应用；
2. 如果有 **Connected accounts**，点对应账号的更多选项（•••）；否则用 **Connection** 或插件的更多选项（•••）；
3. 选 **Disconnect**。

断开后，今后就不能通过这个账号访问了；断开最后一个账号时，有的相关插件可能从已安装列表里消失；卸载插件可能断开该插件连接的所有账号。官方说：**断开不会自动删除已有的或已归档的对话、已保存的文件、记忆摘要或其他记忆**，这些要另外处理，见 [/guides/chatgpt-delete-chats-bulk](/guides/chatgpt-delete-chats-bulk)、[/guides/chatgpt-memory-full](/guides/chatgpt-memory-full)。官方还说明：如果你删除一个对话，其中保留的应用数据按 ChatGPT 的删除政策处理，会排期在 30 天内永久删除（已去标识化并与你解除关联的内容，或因安全和法律义务必须保留更久的除外）。

**在 Google 里移除访问权限**（按 Google 账号帮助）：

1. 打开你的 Google 账号的已关联应用页面 myaccount.google.com/linkedapps；
2. 选 **Access to your Google Account**，选中要查看的应用；
3. 点 **See details**，查看它有哪些访问权限；
4. 点 **Remove access**，再点 **Confirm**。

Google 的页面提醒：移除后，该应用无法再访问你的 Google 账号，部分功能可能停止工作。

## 常见问题

**Q：免费用户能连 Gmail 吗？**
官方的排查文章只明确了一点：Free 和 Go 账号可以通过目录发现插件，但**插件扩展功能**对这两种套餐不可用。Gmail 和日历具体对哪些套餐开放，官方文章没有逐项写，以你账号里「插件」页面的显示为准。套餐对比见 [/guides/chatgpt-plans-comparison](/guides/chatgpt-plans-comparison)；要开通 ChatGPT Plus，可以看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

**Q：ChatGPT 会改我的邮件或日程吗？**
官方说有的应用能读但不一定能写；是否执行修改取决于应用能力、Google 权限、工作区控制，以及 ChatGPT 是否在等你批准。关键操作建议保持「先询问」的权限设置。

**Q：我有两个 Gmail 账号，怎么只用其中一个？**
官方说有的应用支持连多个账号，在应用详情里点 Connect another account；用错账号时，可以在请求里指定要用的账号。

**Q：删了对话，Gmail 里的邮件会被删吗？**
删除对话只处理 ChatGPT 里的内容。官方在 Google Drive 的说明里写明，断开连接不会改动 Drive 里的原文件；Gmail 官方没有单独写这一条，以你 Gmail 里实际看到的为准。

**Q：想知道各类应用怎么连、总体有哪些规则？**
见 [/guides/chatgpt-plugins-connected-apps](/guides/chatgpt-plugins-connected-apps)。

## 参考资料

- OpenAI 帮助中心：Connecting and managing app accounts in ChatGPT — https://help.openai.com/en/articles/20001494-connecting-and-managing-app-accounts-in-chatgpt
- OpenAI 帮助中心：Google app data controls FAQ — https://help.openai.com/en/articles/10408842-google-app-data-controls-faq
- OpenAI 帮助中心：Troubleshooting plugins & apps in ChatGPT — https://help.openai.com/en/articles/20001497-troubleshooting-plugins-apps-in-chatgpt
- Google 账号帮助：Manage third-party apps & services with access to your Google Account — https://support.google.com/accounts/answer/13533235
