---
title: Gemini 关联应用怎么设置：连接 Gmail、云端硬盘、日历，让 Gemini 查邮件找文件
slug: gemini-connected-apps-gmail-drive-calendar
products: [gemini]
models: [gemini-llm]
accountTier: FREE
excerpt: Gemini 的「关联应用」（原扩展程序）能在聊天里直接读你的 Gmail、云端硬盘、日历、Keep 和 Tasks。本文讲开启条件、怎么连接和断开、用 @ 指定应用的写法、它做不到的事、连不上的官方原因，以及数据会被怎样使用。
checkedOn: 2026-10-10
sources:
  - https://support.google.com/gemini/answer/13695044
  - https://support.google.com/gemini/answer/15229592
  - https://support.google.com/gemini/answer/16598406
  - https://support.google.com/gemini/answer/16836988
  - https://support.google.com/gemini/answer/17209137
verify:
  - 「关联应用」在中文界面的确切名称（Connected Apps，早期叫扩展程序 Extensions）以实际界面为准
  - 设置入口有两种写法：「设置 → Connected Apps」或「设置 → Personal Intelligence → Connected Apps」，取决于账号是否已有 Personal Intelligence
  - 可连接的应用因国家、设备、账号类型而异；Google 相册、Google 钱包、通讯录等仅部分地区或特定订阅可用
---

> 本文根据 Google 官方 Gemini 帮助中心整理，核对日期 2026-10-10。本文针对个人 Google 账号；工作 / 学校账号能否连接应用由管理员决定。

## 适用于谁

- 搜「gemini gmail 整合」「gemini gmail 设定」「gemini 连结 google 日历」的人；
- 想让 Gemini 直接总结邮件、找云端硬盘里的文件、往日历里加日程的人；
- 连接时提示失败，或担心连上以后数据怎么被使用的人。

## 结论先说

1. **「关联应用（Connected Apps）」让 Gemini 能调用别的应用**：Gmail、云端硬盘、文档、日历、Keep、Tasks 统一由「Google Workspace」这一个应用连接；还有 YouTube、地图、Spotify、WhatsApp、智能家居等。
2. **三个前提**：登录、打开「保留活动记录（Keep Activity）」、在关联应用设置里把对应应用打开。连接 Workspace 还要求 Gmail 里的「其他 Google 产品中的智能功能」是开着的。
3. **用法**：直接用自然语言问，并在提问里点名「邮件 / 文档 / 日历」；或者输入 `@` 选择应用。**不要贴文档或邮件的链接**，官方建议用关键词描述。
4. **做不到的**：读不了文档和邮件里的评论与图片、读不了云端硬盘里的照片视频、不能建文件夹或移动文件、不能统计邮件数量或存储空间。
5. **数据**：开着活动记录时，Gemini 处理关联应用数据产生的摘要、摘录等可能被用于改进服务和人工审核；不想这样就不要连接含敏感信息的应用。

## 一、开启前的检查

| 条件 | 说明 |
| --- | --- |
| 登录 | 必须登录 Gemini，且和你用 Gmail / 云端硬盘的是同一个账号 |
| 保留活动记录 | 关闭时，网页版、iPhone 和智能手表上关联应用全部不可用；安卓上只剩设备协助、电话、信息、WhatsApp |
| Gmail 智能功能 | Gmail 设置里的「其他 Google 产品中的智能功能（Smart features in other Google products）」要打开；打开后刷新 Gemini 再试 |
| 账号类型 | 工作 / 学校账号需要管理员先开启「连接应用」的权限 |

Google Messages 里的 Gemini 目前不能使用关联应用。

## 二、连接和断开应用

1. 打开 gemini.google.com；
2. 点左下角「设置与帮助（Settings & help）」→「关联应用（Connected Apps）」；如果没有这一项，先点「Personal Intelligence」再进「Connected Apps」；
3. 找到要用的应用，打开开关即连接，关闭即断开；
4. 按屏幕提示完成授权。

这个页面只会列出**你当前账号、当前设备、当前地区能用的应用**。比如只在安卓 App 里可用的应用，不会出现在网页版或 iPhone 的列表里。每个应用下面的「了解详情（Learn more）」里能看到它支持和不支持的操作，以及示例提问。

也可以不提前连接：第一次问到相关内容时，Gemini 会弹出连接选项，或征求你的同意。

## 三、怎么问：以 Google Workspace 为例

连接「Google Workspace」之后，官方给的典型用法：

- **找信息**：「Erik 在关于大峡谷徒步的邮件里提了哪几个日期？」「在我的云端硬盘里找最新的租房合同，看看押金是多少」；
- **总结文档**：「找到云端硬盘里那份标题是『2023 年 6 月』的简历，概括成一小段个人陈述」；
- **整理信息**：「找 Ashley 发的那份社区清洁项目文档，用 5 个要点总结提案」；
- **记任务**：先让它帮你列露营清单，再说「在 Tasks 里建一个提醒，让我带上这些东西」；
- **记笔记**：「推荐几个京都值得去的地方，存到 Keep」；
- **管日程**：「我今天日历上有什么？」「看看 Alice 发的关于周末去太浩湖的邮件，把它加到我的日历」。

三条官方提示：

1. **每个新对话的第一句要点名**：明确提到 Gmail / 邮件、Docs / 文档、Drive / PDF、日历 / 日程、Tasks / 待办、Keep / 笔记之一，Gemini 才会去查；同一对话里的追问不用再重复；
2. **用 `@` 指定应用**：在输入框输入 `@`，从列表里选应用或具体的 Workspace 服务；
3. **不要粘贴文档或邮件的 URL**：用内容里的关键词加上服务类型来描述，比如「上周财务发的报销说明邮件」。

Gemini 可能给出过时的信息（比如引用了一封旧邮件而不是最新的那封），回答后面列出的来源要点开核对。

## 四、它做不到的事

帮助中心明确列出，通过 Google Workspace 应用，Gemini **不能**：

- 读取文档或邮件里的评论和图片；
- 读取云端硬盘里的图片和视频（只能处理文档、表格、幻灯片和 PDF）；
- 管理云端硬盘的内容，比如新建文件夹、在文件夹之间移动文件；
- 统计云端硬盘或 Gmail 里有多少项内容，或告诉你用了多少存储空间。

## 五、不需要连接就会用到的公开信息

Gemini 会自动使用以下 Google 服务的**公开信息**：Google 搜索、Google 航班、Google 酒店、Google 地图、YouTube。关联应用的开关不影响这一点，但没有你的允许，它不会碰你在这些服务里的个人内容。其中航班、酒店、地图、YouTube 的公开信息需要开着活动记录才能用；Google 搜索则始终可用，即使关闭活动记录或没登录。

## 六、连不上的官方原因

1. **工作 / 学校账号**：管理员没有开启连接应用；
2. **Gmail 智能功能没开**：到 Gmail 设置里打开「其他 Google 产品中的智能功能」，然后刷新 Gemini 重新连接；
3. **提问里没点名**：新对话的第一句没有提到邮件、文档、日历等字眼，Gemini 就不会去调用；
4. **保留活动记录是关的**；
5. **以前连过、现在断开了**：帮助中心说明，Personal Intelligence 上线时，此前连接的 Google Workspace 和 Google 相册设置被重置过，需要重新连接。

## 七、连接之后数据怎么用

按帮助中心「About personalization with Connected Apps」页面：

- **不会直接拿去训练的**：Gemini 不会直接用你的 Gmail 收件箱、云端硬盘、通讯录、日历等 Workspace 内容，Google 钱包和支付信息，或 Google 相册里的图像和音频来训练生成式 AI 模型；
- **可能被使用的**：你和 Gemini 互动时，从相关邮件、文件中生成的**摘要、摘录、推断**，以及你的提问和 Gemini 的回答，在活动记录开启的情况下可能用于改进服务（包括训练模型），其中一部分会经过人工审核；邮件或文件很短、或和提问高度相关时，摘要可能就是原文本身；
- **官方提醒**：如果应用里有你不希望被人工审核或用于训练的机密内容，就不要把它连接到 Gemini；
- **断开不等于删除**：断开应用或在应用里删数据，不会删掉「Gemini 应用活动记录」里已有的内容；想彻底清掉，需要**既删除相关对话、又断开应用**。

活动记录的开关和删除方法见本站《Gemini 隐私设置》。

## 八、进阶：连接自定义应用

帮助中心还提供「自定义应用」：通过填写某个应用的 MCP（Model Context Protocol）服务器地址，把个人或第三方应用加进关联应用设置，之后可以在对话或任务里调用。目前的条件比较严：须年满 18 岁且**在美国**、用个人 Google 账号登录、开着活动记录，界面和提示仅支持英语；只能在网页版添加，添加后手机 App 也能用。官方同时提醒，Google 不控制也不保障第三方 MCP 服务器的安全，连接前要确认信任对方并了解它能执行哪些操作。

## 常见问题

**Q：「扩展程序」去哪了？**
现在叫「关联应用（Connected Apps）」，功能是同一类：让 Gemini 调用 Google 和第三方应用。

**Q：Gemini 会不会自己乱发邮件、乱改日历？**
帮助中心的表述是「在你允许的情况下」Gemini 可以帮你执行操作，过程中会有屏幕提示需要你确认；Live 语音对话里做的操作还可以当场撤销。

**Q：免费账号能连 Gmail 吗？**
帮助中心的功能对比表里，「Connected Apps」对无订阅用户也标了可用。

**Q：手机上在哪设置？**
Gemini App 里点「菜单 → 设置（或设置与帮助）→ Personal Intelligence → Connected apps」，同样是逐个开关。

## 参考资料

- Use & manage Connected Apps in Gemini（Gemini 帮助中心）：https://support.google.com/gemini/answer/13695044
- Connect the Google Workspace app to Gemini Apps：https://support.google.com/gemini/answer/15229592
- Connect your Google apps to personalize your Gemini experience：https://support.google.com/gemini/answer/16598406
- About personalization with Connected Apps：https://support.google.com/gemini/answer/16836988
- Connect & manage custom apps for Gemini Apps：https://support.google.com/gemini/answer/17209137
