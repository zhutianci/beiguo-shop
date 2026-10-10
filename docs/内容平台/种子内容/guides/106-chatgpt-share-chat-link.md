---
title: ChatGPT 分享对话怎么用：生成分享链接、谁能看到、怎么更新和删除
slug: chatgpt-share-chat-link
products: [chatgpt]
models: []
accountTier: FREE
excerpt: 想把一段 ChatGPT 对话发给同事或朋友？本文按官方帮助中心讲清怎么生成分享链接、对方能看到什么、个人账号和工作区链接的区别、怎么更新内容、在哪里统一管理和删除，以及分享前要注意的隐私问题。
checkedOn: 2026-10-07
sources:
  - https://help.openai.com/en/articles/7925741-sharing-conversations-and-scheduled-tasks-in-chatgpt
  - https://help.openai.com/en/articles/7730893-data-controls-in-chatgpt
  - https://help.openai.com/en/articles/8096356-chatgpt-custom-instructions
  - https://help.openai.com/en/articles/10245791-reporting-content-in-chatgpt-and-openai-platforms
verify:
  - 「分享」「创建链接」「更新链接」「共享链接 → 管理」等中文按钮名以实际界面为准
---

> 本文根据 OpenAI 帮助中心《Sharing conversations and scheduled tasks in ChatGPT》及数据控制相关文章整理，资料核对于 2026-10-07。

## 适用于谁

- 想把 ChatGPT 的一段回答或整段对话发给别人看的人；
- 分享过链接、现在想撤回或者修改内容的人；
- 收到别人发来的 ChatGPT 链接，担心安全问题的人。

## 结论先说

1. **生成链接**：打开对话 → 点 **Share（分享）** → 预览内容 → **Create link（创建链接）/ Copy link（复制链接）**。也可以只分享某一条回答。
2. **个人账号的链接 = 快照**：任何拿到链接的人都能看，内容停留在你创建或更新链接的那一刻，之后新增的消息**不会自动同步**，要手动 **Update link（更新链接）**。
3. **工作区链接只限同工作区成员**：Business、Enterprise、Edu、ChatGPT for Healthcare 里创建的链接，外部人员打不开，而且之后新增的消息**会**出现在链接里。
4. **统一管理**：**Settings（设置）→ Data controls（数据控制）→ Shared links（共享链接）→ Manage（管理）**，可以逐条删除或全部删除。
5. **链接不能设置有效期、不能指定只给某个人看**。不需要了就删掉。

## 步骤

### 1. 分享整段对话或单条回答

1. 打开要分享的对话；
2. 点 **Share**（侧边栏对话菜单里、单条回答下方也可能有分享按钮）；
3. 检查预览里的全部内容，确认没有不想公开的信息；
4. 点 **Create link** 或 **Copy link**；
5. 把链接发给对方。手机上会弹出系统的分享面板。

分享单条回答时，链接可以只包含那一条，而不是整段对话。还在生成中的回答，要等生成完才会出现在分享内容里。

新建的链接可能要稍等片刻才能打开，对方如果看到一直在加载，过一会儿再试即可。

### 2. 更新已分享的内容

个人账号的分享是快照。你在原对话里继续聊之后，想让对方看到新内容：打开对话 → **Share** → **Update link**。链接地址不变，内容刷新为最新。

工作区里的分享则相反：之后的新消息会自动出现在链接里。继续在一个已分享的工作区对话里聊之前，先看清分享提示，别把不该给同事看的信息写进去。

### 3. 查看和删除所有分享链接

1. 进入 **Settings（设置）→ Data controls（数据控制）**；
2. 在 **Shared links（共享链接）** 旁点 **Manage（管理）**；
3. 列表里会同时显示分享出去的对话和定时任务；
4. 单条删除点 **Delete shared link**；想一次全删，打开 **More actions（更多操作）** 选 **Delete all shared links**。

## 对方能看到什么

- **能看到**：分享时的对话内容（或单条回答），以及其中支持显示的图片和上传的文件。你在对话里写过的姓名、个人信息同样会被看到。
- **看不到**：你的账号本身；你的自定义指令（官方说明不会展示给分享链接的查看者）。
- **署名**：分享链接默认匿名，但部分旧的分享方式可能显示创建者名字，发送前看一眼预览。
- **对方继续聊**：对方在你的分享基础上继续对话，会在他自己的账号里生成一份独立的私人对话，你看不到，也不会影响你的原对话。

官方明确提醒：分享内容里不要包含健康信息、财务信息、密码、账号号码等敏感个人信息。

## 删除后会怎样

| 操作 | 结果 |
| --- | --- |
| 删除分享链接 | 别人以后打不开这个链接；你的原对话不受影响；别人已经保存（继续聊）的副本仍在他们账号里 |
| 删除原对话 | 对应的分享链接一起失效 |
| 删除账号 | 你创建的对话分享链接会被删除 |
| 关闭「为所有人改进模型」 | 不会删除已有分享链接，也不改变谁能打开 |

如果对话关联了定时任务：删掉对话后任务会暂停，但任务的分享链接仍然有效，需要单独删除。定时任务的分享方法见 [/guides/chatgpt-scheduled-tasks](/guides/chatgpt-scheduled-tasks)。

## 收到分享链接时注意

- 真正的对话分享链接以 `https://chatgpt.com/share/` 开头，定时任务分享链接以 `https://chatgpt.com/s/` 开头。先确认域名是 chatgpt.com、发送人可信再打开。
- 发现内容不当，可以在页面上点 **Report conversation（举报对话）**；没有这个按钮时，用 OpenAI 的内容举报表单。

## 常见问题

**Q：分享链接会被搜索引擎收录吗？**
官方说分享页面并不打算被搜索引擎索引，但这**不等于私密**——任何拿到链接的人都能看，也能转发给别人。

**Q：能不能只让某个人看？或者设置过期时间？**
都不能。个人账号的链接人人可看，工作区链接限同工作区成员；没有逐人授权，也没有过期时间。不需要时手动删除。

**Q：导出的数据里有分享记录吗？**
个人账号的数据导出里有一个 `shared_conversations.json`，记录分享链接 ID、对话 ID、标题和是否匿名。定时任务的分享链接目前不在导出范围内。导出方法见 [/guides/chatgpt-export-chat-history](/guides/chatgpt-export-chat-history)。

**Q：公司管理员能禁止分享吗？**
Enterprise 和 Edu 管理员可以在工作区设置里关闭「在工作区内分享聊天和定时任务」。Business 的链接本来就只限本工作区，但没有提供同样的整体关闭开关。

## 参考资料

- OpenAI 帮助中心：Sharing conversations and scheduled tasks in ChatGPT — https://help.openai.com/en/articles/7925741-sharing-conversations-and-scheduled-tasks-in-chatgpt
- OpenAI 帮助中心：Data controls in ChatGPT — https://help.openai.com/en/articles/7730893-data-controls-in-chatgpt
- OpenAI 帮助中心：ChatGPT Custom Instructions — https://help.openai.com/en/articles/8096356-chatgpt-custom-instructions
- OpenAI 帮助中心：Reporting content in ChatGPT and OpenAI platforms — https://help.openai.com/en/articles/10245791-reporting-content-in-chatgpt-and-openai-platforms
