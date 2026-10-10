---
title: Gemini 会议记录怎么用：Google Meet「帮我记笔记」开启方法、支持中文吗、记录存在哪
slug: gemini-meet-take-notes-for-me
products: [gemini]
models: [gemini-llm]
accountTier: PRO
excerpt: Google Meet 的「Take notes for me（帮我记笔记）」能让 Gemini 自动记会议纪要并生成 Google 文档。本文按官方帮助中心讲清：谁能用、三种开启方式、官方支持的 8 种语言（目前不含中文）、笔记存在云端硬盘哪个文件夹、谁能收到，以及按钮点不了的原因。
checkedOn: 2026-10-10
sources:
  - https://support.google.com/meet/answer/14754931
  - https://support.google.com/meet/answer/16909639
  - https://support.google.com/meet/answer/17020724
  - https://support.google.com/meet/answer/16024610
  - https://support.google.com/docs/answer/13952129
  - https://support.google.com/docs/answer/14925782
  - https://support.google.com/mail/answer/15604322
verify:
  - 语言：帮助页和语言总表都只列英、法、德、意、日、韩、葡、西 8 种；日历设置页提到「部分语言目前仅对 Beta 用户开放」，但没列出是哪些，中文是否在 Beta 范围内官方未说明
  - 「Take notes for me」在简体中文界面的确切译名（本文暂译「帮我记笔记」）以实际界面为准
  - 个人订阅档位：方案对比表把 Take notes for me 列在 Google AI Pro / Ultra 下（Plus 不在其中）
  - 存放位置：官方写明自 2026 年 9 月起旧的「Meet Recordings」文件夹改名为「Legacy Meet Recordings」并移入新的「Google Meet」文件夹，个别账号是否已完成迁移以实际为准
  - 截图为官方英文演示动图的局部截帧，已遮去演示人名和头像
---

> 本文根据 Google 官方 Google Meet 帮助中心整理，核对日期 2026-10-10。本文讲的是 Google Meet 里自带的 Gemini 记笔记功能，不涉及第三方录音或转写工具。录制、转写或记录会议前，请确认所有参会者知情并同意，遵守所在地的法律和所在单位的规定。

## 适用于谁

- 搜「gemini 会议记录」「gemini 会议记录 中文」「google meet 会议记录 ai」「gemini meet notes」的人；
- 用 Google Meet 开会，想让 AI 自动出会议纪要和待办的人；
- 开了功能却找不到笔记文档，或者按钮是灰的人。

## 结论先说

1. **「帮我记笔记（Take notes for me）」会在会后自动生成一份 Google 文档**，含摘要、决定、后续步骤和细节；迟到的人还能在会中看「目前为止的摘要（Summary so far）」。
2. **官方支持的会议语言只有 8 种**：英语、法语、德语、意大利语、日语、韩语、葡萄牙语、西班牙语。**列表里没有中文**，而且一场会议只能选一种语言，多语言混说不支持。
3. **谁能用**：工作账号需要 Business Standard / Plus、Enterprise Standard / Plus 或 Frontline Plus；个人账号需要 Google AI Pro 或 Ultra。关键是**会议组织者**的账号要符合条件。
4. **笔记存在组织者的云端硬盘**「Google Meet」文件夹里，每场会议一个子文件夹；同时挂在日历活动上，并按设置用邮件发给相应的人。
5. **点不了按钮**的官方原因就三条：组织者的方案不含此功能、管理员没开、智能功能被关了。

## 一、使用前要知道的条件

| 条件 | 官方说明 |
| --- | --- |
| 账号 | 符合条件的 Google Workspace 版本或 Google AI 方案；组织者必须有包含该功能的版本 |
| 语言 | 会议必须用上述 8 种语言之一进行；一次一种语言 |
| 会议时长 | 建议 15 分钟到最长 8 小时 |
| 智能功能 | 需要开启（在 Meet「设置 → 常规 → Google Workspace 智能功能 → 管理」里打开「Google Workspace 中的智能功能」） |
| 主持人管理 | 开了「主持人管理（Host Management）」时，只有主持人能开关记笔记 |
| 同意 | 管理员可以要求所有参会者明确同意后才能使用记笔记、录制、转写；该设置默认关闭 |

开启后，Meet 会通知所有参会者正在记笔记，每个人的屏幕上都会出现铅笔图标。官方也建议你主动告诉大家。

## 二、三种开启方式

### 方式一：在 Google 日历里预先打开（组织者）

1. 打开 Google 日历，选中会议，点「编辑活动」；
2. 确认已添加 Google Meet 视频会议，点**视频通话选项（Video call options）**；
3. 左侧点**会议记录（Meeting records）**；
4. 勾选「**Take notes with Gemini**」；
5. 在语言下拉菜单里选会议语言；下方的「Take notes for me sharing default settings」里选笔记发给谁。

### 方式二：会议中打开

1. 在 meet.google.com 进入会议；
2. 点屏幕右上角的「Take notes for me」；
3. （可选）点「设置」调整，见下一节；
4. 点 **Start taking notes**。

### 方式三：让以后的会议自动开

1. 打开 meet.google.com，右上角点「设置」；
2. 左侧点**会议记录（Meeting records）**；
3. 在「Automatic note taking for all future meetings」下选一项：
   - 关闭；
   - 我主持的所有已安排会议；
   - 我主持且有 3 位及以上来宾（含组织者）的已安排会议；
4. 点「保存」。

工作 / 学校账号还可能因为管理员的设置，在某些会议里自动开启。已经有人进入会议后，这些预设就不能改了。

![会议中点「Take notes for me」后弹出的设置面板：笔记发给谁、会议语言、是否同时转写、详细程度、包含哪些小节、是否加入演示内容截图（官方演示界面局部）](seed:g443-meet-take-notes-settings.jpg)
*图片来源：[Google 官方 Google Meet 帮助中心《"Take notes for me" in Google Meet》](https://support.google.com/meet/answer/14754931)（官方动图局部截帧，已遮去演示人名和头像）*

## 三、可以调整的设置

| 设置 | 选项与说明 |
| --- | --- |
| 发送给谁（Send notes to） | 所有受邀来宾（含组织外）/ 组织内的受邀来宾 / 仅主持人和联席主持人。这个菜单只有主持人和联席主持人看得到 |
| 笔记长度（Notes length） | 标准（Standard，简明摘要）/ 更长（Longer，更多细节） |
| 小节（Sections） | 摘要、决定、后续步骤、细节，可按需勾选（官方注明部分自定义项仅 Beta 用户可用） |
| 截图（Screenshots） | 把会上展示的幻灯片等内容截图放进笔记；展示内容在屏幕上停留至少 10 秒才会被收录；开启后顶部会提示所有人 |
| 会议语言（Meeting language） | 可在会中改；改动也会影响 Ask Gemini 和其他正在进行的会议记录，但不会套用到之后的例会 |
| 以后的同系列会议也开启 | 主持人开启记笔记时默认勾选 |

两点细节：

- 「受邀来宾」指的是日历邀请上的人，而不是实际到场的人；通过群组邮箱被邀请的成员需要各自申请文档权限。临时发起的即时会议，笔记只分享给主持人和开启记笔记的人；
- 「决定」小节会把会议结论标成已达成一致、需进一步讨论、有分歧或搁置；该小节对所有用户提供英语版，其他 7 种语言仅 Beta 用户可用。

如果会议中有人改用另一种语言说了至少 30 秒，你会收到通知，可以选「更改语言」或「忽略」。

**谁能停**：组织者以及与主持人同一组织的参会者可以随时停止和重新开始，方便把敏感讨论排除在纪要之外；开启主持人管理后，只有组织者、主持人和联席主持人可以操作。

## 四、会后：笔记在哪、长什么样

**存放位置**

- 会议结束后不久生成文档，保存在**会议组织者的云端硬盘**「**Google Meet**」文件夹下，每场会议有自己的子文件夹；
- 组织者如果设置了自动分享，受邀者的「Google Meet」文件夹里会出现这份文档的快捷方式；
- 文档会自动附在对应的 Google 日历活动上；
- 组织者会收到一封带回顾链接的邮件；其他人是否收到，取决于「发送给谁」的设置。邮件里有文档链接、会议摘要和建议的后续步骤。

官方另有说明：从 2026 年 9 月起，原来的「Meet Recordings」文件夹会自动改名为「Legacy Meet Recordings」并移到新的「Google Meet」文件夹里；旧笔记仍然可用，新笔记存进按会议划分的子文件夹。工作账号的笔记文档遵循组织配置的 Meet 保留政策。

**文档结构**：两个标签页——

- **Quick notes**：默认页，只有最重要的结论和待办；
- **Full notes**：更完整的概览，含摘要、决定、待办和细节。

**权限提醒**：能在日历活动里看到「有一份笔记附件」，不等于能打开它；能不能打开只看文档的分享设置。

## 五、线下会议也能记

不在视频会议里也可以用：

1. 电脑打开 meet.google.com；
2. 点顶部的 **Take notes → Start taking notes**；
3. 把设备放在附近即可。过程中可以**暂停**（转写和记录都停，点 Continue 继续）或**停止**。

笔记文档会发到你的邮箱，并保存在开启功能的人的云端硬盘里。如果临时有人要远程加入，可以把这次记录转成普通的视频通话流程。支持的语言与线上相同。

## 六、点不了、没生成怎么办

**按钮不能点**，官方列出的原因：

1. 会议组织者的 Workspace 版本不包含「Take notes for me」；
2. 工作 / 学校账号的管理员没有开启；
3. 智能功能控制被关闭。

**纪要不完整、不准确或没生成**，官方列出的原因：

1. 会议内容不符合 Google Meet 可接受使用政策；
2. 会议期间有网络连接问题；
3. 会议时长不足建议的 15 分钟。

如果是文档生成这一步出问题，官方建议先刷新浏览器。

## 常见问题

**Q：Gemini 会议记录支持中文吗？**
按 2026-10-10 的官方页面，支持的 8 种语言里没有中文，会议须用这 8 种语言之一进行。日历设置页提到有些语言只对 Beta 用户开放，但没有列出具体语言。也就是说，中文会议目前不在官方列出的支持范围内；官方写明会议须以所列语言进行，这项功能才能正常工作。

**Q：个人 Google 账号能用吗？**
方案对比表里，Take notes for me 列在 Google AI Pro 和 Ultra 下。价格见官方订阅页，各档区别见本站《Gemini 会员有什么区别：免费版、Google AI Plus、Pro、Ultra 功能与额度对比》。

**Q：会中的「Ask Gemini」和记笔记是一回事吗？**
不是。Ask Gemini in Meet 是会中向 Gemini 提问（总结刚才的讨论、列出待办），回答只有你自己看得到；官方写明它需要符合条件的 Workspace 订阅，支持的语言同为上述 8 种。如果你加入会议之前已经开了记笔记，它还能回答你加入前的内容。

**Q：外部来宾能拿到笔记吗？**
只有组织者把「发送给谁」设为「所有受邀来宾，包括组织外的人」时才会收到。

**Q：笔记可以删除吗？**
官方说明笔记是保存在组织者云端硬盘里的 Google 文档，工作账号的笔记遵循组织配置的 Meet 保留政策。本文读到的页面没有单独讲删除规则，个人账号可按云端硬盘文件的常规方式管理，以实际界面为准。

## 参考资料

- "Take notes for me" in Google Meet：https://support.google.com/meet/answer/14754931
- Calendar & Meet settings for "Take notes for me"：https://support.google.com/meet/answer/16909639
- Use "Take notes for me" for in person meetings：https://support.google.com/meet/answer/17020724
- Ask Gemini in Google Meet：https://support.google.com/meet/answer/16024610
- Get started with Google Workspace with Gemini（功能与方案对比表）：https://support.google.com/docs/answer/13952129
- Supported languages for Google Workspace with Gemini：https://support.google.com/docs/answer/14925782
- Learn about smart features & controls for Google Workspace & other Google products：https://support.google.com/mail/answer/15604322
