---
title: ChatGPT 项目功能有什么用、怎么用（Projects 使用教程）
slug: chatgpt-projects
products: [chatgpt]
models: []
accountTier: FREE
excerpt: ChatGPT「项目」能把同一件事的对话、文件和说明放在一起，不用每次重复交代背景。本文讲清它和自定义指令、记忆、GPTs 的区别，以及创建、上传文件、仅项目记忆和共享的用法。
checkedOn: 2026-10-07
sources:
  - https://help.openai.com/en/articles/10169521-projects-in-chatgpt
  - https://help.openai.com/en/articles/8590148-memory-in-chatgpt
  - https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex
  - https://help.openai.com/en/articles/6825453-chatgpt-release-notes
  - https://thoughtsbrewing.com/blog/ai-quick-tips-243-isolate-chatgpt-projects
---

## 适用于谁

- 同一件事要和 ChatGPT 聊很多次：写论文、备考、做一个客户项目、写小说、长期学英语；
- 每次新开对话都要重新上传资料、重新交代背景，觉得麻烦；
- 想和同学 / 同事共用一套资料和对话。

项目功能在 Free 账号上也能用，本文根据 OpenAI 帮助中心整理，付费账号的差别主要在文件数量和协作人数上（见下文）。

## 结论先说

**项目 = 一个文件夹 + 一份专属说明 + 一块共享上下文。**放进同一个项目的对话，会共享你上传的文件和写好的说明，ChatGPT 还能参考项目里其他对话的内容，所以「上次聊到哪」不用再讲一遍。

和几个相似功能的区别：

| 功能 | 作用范围 | 适合放什么 |
| --- | --- | --- |
| 自定义指令 | 全部对话 | 长期不变的偏好：语气、格式、身份 |
| 记忆 | 全部对话 | ChatGPT 自动或按你要求记住的事实 |
| 项目 | 只在该项目内 | 某个课题的资料、规则、历史对话 |
| GPTs | 任何人调用该 GPT 时 | 想分享给别人反复用的固定助手 |

简单说：**跟某一件事有关的，放项目；跟你这个人有关的，放自定义指令或记忆。**另外，OpenAI 在 2026 年 9 月宣布计划逐步停用自定义 GPT、迁移到插件，具体时间以官方通知为准。

## 步骤

### 1. 新建项目

在左侧边栏找到「项目」，点「新建项目」。起一个看得懂的名字，例如「毕业论文-第三章」「客户A-年度方案」，还可以选图标和颜色。项目数量不限。

![侧边栏「项目」区域和「新建项目」](seed:g04-sidebar-new-project.png)
*图片来源：[OpenAI 帮助中心：Projects in ChatGPT](https://help.openai.com/en/articles/10169521-projects-in-chatgpt)*

创建时可以设置记忆方式：**默认记忆**或**仅项目记忆**。选择仅项目记忆后：项目内的对话可以互相参考，但不会用到你之前保存的记忆，也不能参考项目外的对话；项目里的内容也不会带到项目外。适合涉及隐私或需要「干净上下文」的课题。

这个选项**创建后也能改**：2026 年 8 月起，未共享的项目可以在 项目「•••」→ 项目设置 → 记忆 里切换，官方说明改动可能要几个小时才生效。共享的项目固定为仅项目记忆，不能切回默认。另外，**仅项目记忆的项目里不能使用 ChatGPT Work**。

![新建项目时的记忆选项（2025 年截图，当时提示「之后无法更改」，现已可改）](seed:g04-new-project-memory.png)
*图片来源：[Thoughts Brewing](https://thoughtsbrewing.com/blog/ai-quick-tips-243-isolate-chatgpt-projects)*

### 2. 上传文件

在项目页上传 PDF、表格、文档、图片，或直接粘贴文本；还可以粘贴 Google Drive 文件 / 文件夹或 Slack 频道链接作为项目来源，或把对话里有用的回复保存到项目。项目里所有对话都能用到这些资料。

官方公布的每个项目文件上限：Free 5 个；Go、Plus 25 个；Pro、Business、Enterprise、Edu 40 个。一次最多同时上传 10 个文件。

建议：
- 只放和这个项目直接相关的资料，太多反而降低准确度；
- 资料更新后，删掉旧版本再上传新版本，避免 ChatGPT 引用过期内容。

### 3. 写项目说明

点项目页右上角「•••」→「项目设置」，在说明里写下这个项目的固定规则，例如：

> 这是我的毕业论文第三章，主题是 [主题]。回答用学术中文，引用资料时注明来自哪个文件；不确定的内容直接说不确定。

![项目页右上角「•••」→「项目设置」](seed:g04-project-settings-menu.png)
*图片来源：[OpenAI 帮助中心：Projects in ChatGPT](https://help.openai.com/en/articles/10169521-projects-in-chatgpt)*

官方明确说明：项目说明只在本项目里生效，并且**会覆盖**你的全局自定义指令。

![项目页：文件数量、项目内新对话输入框和对话列表](seed:g04-project-page.png)
*图片来源：[OpenAI 帮助中心：Projects in ChatGPT](https://help.openai.com/en/articles/10169521-projects-in-chatgpt)*

### 4. 在项目里对话

在项目页直接新开对话即可。已经在外面聊过的对话，可以拖进项目，或在对话菜单里选「移到项目」，移进来后会继承项目的说明和文件。用 GPT 发起的对话不能移进项目。

![把已有对话拖进项目](seed:g04-move-chat-to-project.webp)
*图片来源：[OpenAI 帮助中心：Projects in ChatGPT](https://help.openai.com/en/articles/10169521-projects-in-chatgpt)*

### 5. 共享项目（可选）

在项目里点「共享」即可邀请别人，Free、Go、Plus、Pro 及企业套餐都支持。个人套餐可以选「仅受邀者」逐个邀请，或开启「任何拥有链接的人」；成员权限分为「可聊天」和「可编辑」。成员能看到项目里的对话、文件、说明和成员名单（包括姓名和邮箱），共享前请确认里面没有不想让对方看到的内容。

官方公布的协作人数上限（由项目所有者的套餐决定）：Free 5 人；Go、Plus 10 人；Pro 100 人；企业工作区项目最多 100 人。共享后的项目会自动改为仅项目记忆，不会用到任何成员在项目外的记忆和自定义指令。

### 6. 配合其他功能

- 在项目里可以用画布、生图、语音、联网搜索等工具，付费套餐还可能用到深度研究等功能；学习模式不适用于项目对话；
- 2026 年 7 月推出的 ChatGPT Work 也能从项目里发起，让它在项目资料基础上完成多步骤任务（仅项目记忆的项目除外）。

## 常见问题

**Q：项目和 GPTs 选哪个？**
自己长期做一件事，用项目；想做一个给别人反复用的固定助手，过去用 GPTs，但 OpenAI 已宣布计划停用自定义 GPT 并迁移到插件，新做的话建议先看官方最新说明。

**Q：项目里的 ChatGPT 还会用我的全局记忆吗？**
默认记忆下会（个人 Plus / Pro 等套餐还会优先参考项目内的对话和文件）。不想混用就把项目设为「仅项目记忆」，创建时或之后在项目设置里改都可以。使用项目记忆需要在个人设置里开启「参考已保存的记忆」和「参考聊天记录」。

**Q：删除项目会怎样？**
项目「•••」→「删除项目」后，项目里的对话、说明，以及只存在于该项目里的文件会被永久删除，**无法撤销**；单独保存在文件库里的文件不受影响，共享项目的成员也会失去访问权。删除前把需要的对话移出来。

**Q：Free 和 Plus 在项目上差在哪？**
主要是每个项目的文件数（5 个 vs 25 个）、协作人数（5 人 vs 10 人），以及能在项目里调用的模型和工具额度。如需开通 Plus，可前往 /chongzhi/chatgpt-plus。

## 参考资料

- OpenAI 帮助中心：Projects in ChatGPT — https://help.openai.com/en/articles/10169521-projects-in-chatgpt
- OpenAI 帮助中心：Memory in ChatGPT — https://help.openai.com/en/articles/8590148-memory-in-chatgpt
- OpenAI 帮助中心：ChatGPT Work and Codex — https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex
- ChatGPT Release Notes（2025-10-23 共享项目、2026-08-13 项目记忆可修改、2026-09-11 自定义 GPT 停用计划） — https://help.openai.com/en/articles/6825453-chatgpt-release-notes
