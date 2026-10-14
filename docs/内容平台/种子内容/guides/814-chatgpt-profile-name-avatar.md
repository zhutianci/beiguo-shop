---
title: ChatGPT 个人资料怎么改：头像、名字、用户名在哪设置，个人主页怎么公开和关闭
slug: chatgpt-profile-name-avatar
products: [chatgpt]
models: []
accountTier: FREE
excerpt: 想换 ChatGPT 的头像、改显示的名字，或者看到别人分享的 chatgpt.com/u/ 开头的主页链接？本文按官方帮助中心讲清个人资料页在哪打开、能改哪些信息、名字改了不生效怎么办，个人主页上会显示什么、怎么公开和收回，以及公司工作区里的不同规则。
checkedOn: 2026-10-13
sources:
  - https://help.openai.com/en/articles/20001539-shareable-profiles-in-chatgpt
  - https://help.openai.com/en/articles/6640864-how-do-i-change-my-name-for-my-openai-account
verify:
  - 改名有两篇官方文章：新的《Shareable profiles》说在 chatgpt.com/profile 改显示名；较早的《How do I change my name》说到 platform.openai.com 改并最多等 15 分钟。两处是否同步，以实际界面为准
  - 个人主页的公开级别有哪几档，官方只写「choose the public sharing level」，没有列出选项名称
  - 官方文章没有配界面截图
---

> 本文根据 OpenAI 帮助中心《Shareable profiles in ChatGPT》《How do I change my name for my OpenAI account?》整理，资料核对于 2026-10-13。官方文章没有配界面截图，文中配图为本站整理的示意图。

## 适用于谁

- 想给 ChatGPT 账号换头像、改名字或用户名的人；
- 注册时名字填错了，想改过来的人；
- 听说 ChatGPT 有了「个人主页」，想知道别人能看到自己什么信息的人。

改登录邮箱、改密码、两步验证不在本文范围，见 [/guides/chatgpt-account-security-mfa](/guides/chatgpt-account-security-mfa)。

## 结论先说

1. **入口**：登录后打开 **chatgpt.com/profile**。在这里可以编辑**显示名、用户名、头像和简介**，还能改主页的主题、布局，选择显示哪些栏目。
2. **个人主页默认是私密的**。只有你主动点 **Share（分享）** 并选了公开级别，别人才看得到。
3. **公开后谁能看**：任何**登录了 ChatGPT** 的人；未登录的人看不了。链接格式是 `https://chatgpt.com/u/你的用户名`。
4. **不会泄露聊天**：官方写明，分享出去的主页**不显示对话标题和内容**。
5. **改了用户名，旧链接立即失效**，要重新发新链接。
6. 官方说明个人主页在所有国家可用；分享主页和展示 Sites 在网页和桌面端操作，手机上没有 Showcase。

## 个人主页上有什么

![ChatGPT 个人主页上有什么、谁能看](seed:g814-profile-what.png)
*图：本站根据 [OpenAI 帮助中心：Shareable profiles in ChatGPT](https://help.openai.com/en/articles/20001539-shareable-profiles-in-chatgpt) 整理的示意图*

- **基本信息**：显示名、用户名、头像、简介；
- **活动（Activity）**：Chat 的消息数、Work 和 Codex 的 token 用量，分别显示，有每日、每周和累计总数；还有「连续活跃」记录——它只按 Work 或 Codex 的 token 活动计算，**普通聊天消息不计入**；
- **常用插件**：单独一栏显示你用得最多的插件；
- **Showcase（展示区）**：每个主页最多展示 **12 个**你自己的 Sites。Sites 是什么见 [/guides/chatgpt-sites](/guides/chatgpt-sites)。

## 步骤

### 1. 改头像、显示名、用户名和简介

1. 登录 ChatGPT，访问 **chatgpt.com/profile**；
2. 编辑 **display name（显示名）**、**username（用户名）**、**profile photo（头像）** 和 **bio（简介）**；
3. 需要的话，调整主页的主题和布局，选择要显示哪些栏目。

几点说明：

- 你的个人主页和 Business 工作区主页**共用**同一个名字、用户名和头像；但每个工作区有各自的活动数据、展示区和分享设置，主题与布局也按工作区分别保存；
- 要查看或管理另一个工作区里的主页，先在 ChatGPT 里切换到那个工作区；
- 某个用户名提示已被占用、却搜不到对应主页，是正常的——官方说明用户名可能已被占用但主页不可见。

### 2. 名字改了没变化？

OpenAI 还有一篇较早的官方文章，讲的是另一处改名入口：

- 打开 **platform.openai.com** 的用户设置：头像 → **Your Profile** → **User** → **Name**；
- 文章写明：ChatGPT 的名字取自 API 平台的资料，改完后**最多可能需要 15 分钟**才会在 ChatGPT 里体现，刷新页面查看；
- 名字的要求：不能为空；不超过 96 个字符；只能包含字母、部分标点和空格，**不能有数字**。

所以如果在个人资料页改了名字却没生效，可以到这里再改一次，等一会儿刷新。

### 3. 公开个人主页

![公开或收回 ChatGPT 个人主页的步骤](seed:g814-profile-share-steps.png)
*图：本站根据 [OpenAI 帮助中心：Shareable profiles in ChatGPT](https://help.openai.com/en/articles/20001539-shareable-profiles-in-chatgpt) 整理的示意图*

1. 打开你的主页；
2. **先看一遍主页上的信息**——官方特别提醒，分享链接之前要检查；
3. 点右上角的 **Share**，选择公开级别（如果你的账号有分享功能）；
4. 把 `https://chatgpt.com/u/你的用户名` 发给别人。

### 4. 收回：改回私密

再点右上角的 **Share**，选择设为私密即可。

注意官方写明：**不能只屏蔽某几个人**。不想让某人看，只能把整个主页改回私密。

### 5. 把 Sites 放到展示区

1. 在主页里从你自己的 Sites 中选一个添加；或者在某个公开 Site 的分享选项里把它加进展示区；
2. 可以调整显示顺序，也可以移除。

Site 能不能出现在主页上，取决于看主页的人能不能访问它：

- **公开的个人主页**：Site 必须是公开的；
- **工作区内共享的 Business 主页**：Site 必须对整个工作区开放或公开；
- **私密主页**：你拥有且能访问的 Site 都能加，包括只分享给特定人的。

把 Site 加进展示区**不会改变**它本身的访问权限；反过来，如果 Site 的权限后来改了、看主页的人打不开了，它会自动从分享出去的主页上消失。Site 被删除或转给别人，也会从展示区移除。

## 公司工作区（Business）里的主页

- Business 主页**默认对同一工作区的成员可见**；
- 成员**不能自己修改**工作区主页的分享级别。管理员在 **Workspace settings → Permissions & roles → Member profiles** 里统一设置，可以把所有成员主页设为私密；
- 工作区之外的人看不到 Business 主页；
- 你的个人主页另有一套分享设置：把个人主页公开，不会让工作区里的活动或展示区变成公开；
- 同一个主页链接，不同的人打开可能看到不同内容：对方进不了你的 Business 主页时，如果你的个人主页是公开的，他看到的会是个人主页。

官方说明 Enterprise 的可分享主页「即将推出」。

## 常见问题

**Q：别人能从我的主页看到我和 ChatGPT 聊了什么吗？**
不能。分享出去的主页不显示对话标题或内容，只有消息数量这类统计。想把某段对话给别人看，用分享链接，见 [/guides/chatgpt-share-chat-link](/guides/chatgpt-share-chat-link)。

**Q：我没公开过主页，别人能搜到我吗？**
个人主页默认私密。只有你主动公开后，登录 ChatGPT 的人才能通过链接查看。

**Q：能在个人主页上分享 Skills 吗？**
不能。官方明确写了个人主页不能分享 Skills。Skills 的用法见 [/guides/chatgpt-skills](/guides/chatgpt-skills)。

**Q：改了用户名，以前发出去的链接怎么办？**
旧链接会失效，需要把带新用户名的链接重新发给对方。

**Q：手机上找不到 Showcase？**
官方说明 Showcase 在手机上不可用，要到网页或桌面端查看和添加。

**Q：头像和名字会影响 ChatGPT 怎么称呼我吗？**
主页资料是给别人看的。想让 ChatGPT 用特定的称呼和语气回答，应该在自定义指令里设置，见 [/guides/chatgpt-custom-instructions](/guides/chatgpt-custom-instructions)。

## 参考资料

- OpenAI 帮助中心：Shareable profiles in ChatGPT — https://help.openai.com/en/articles/20001539-shareable-profiles-in-chatgpt
- OpenAI 帮助中心：How do I change my name for my OpenAI account? — https://help.openai.com/en/articles/6640864-how-do-i-change-my-name-for-my-openai-account
