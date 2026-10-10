---
title: NotebookLM 分享笔记本怎么设置：查看者 / 编辑者权限、公开链接与分享限制
slug: notebooklm-share-notebook-permissions-public-link
products: [gemini]
models: [gemini-llm]
accountTier: FREE
excerpt: NotebookLM（现名 Gemini Notebook）怎么把笔记本分享给别人？本文按官方帮助讲清私下分享的两种权限、公开链接和「仅对话视图」、单独分享音频或演示文稿、允许复制、使用分析，以及人数、账号类型等分享限制。
checkedOn: 2026-10-10
sources:
  - https://support.google.com/notebooklm/answer/16206563?hl=en
  - https://support.google.com/notebooklm/answer/16322204?hl=en
  - https://support.google.com/notebooklm/answer/16213268?hl=en
  - https://support.google.com/notebooklm/answer/16269187?hl=en
  - https://support.google.com/notebooklm/answer/17003757?hl=en
  - https://support.google.com/notebooklm/answer/17513891?hl=en
  - https://support.google.com/notebooklm/answer/16179536?hl=en
  - https://support.google.com/notebooklm/answer/16179559?hl=en
  - https://blog.google/technology/google-labs/notebooklm-public-notebooks/
  - https://blog.google/innovation-and-ai/models-and-research/google-labs/notebooklm-custom-personas-engine-upgrade/
  - https://workspaceupdates.googleblog.com/2026/03/new-ways-to-customize-and-interact-with-your-content-in-NotebookLM.html
verify:
  - 复制笔记本：「创建笔记本」一文有「创建私人副本」和「允许复制」的完整步骤，但官方 FAQ 里「Duplicate a notebook」一条仍写「暂不支持」，两处说法不一致
  - 使用分析（Analytics）：方案页写「自定义对话和分析对所有人开放，高级分享面向付费用户」，公开笔记本一文却写「付费订阅的公开笔记本所有者可以查看使用分析」，两处表述不同
  - 「高级分享（Advanced Sharing）」具体包含哪些功能，方案页没有展开说明
  - 含 Gemini 对话的笔记本：同一篇帮助文章里既写「含 Gemini 对话的笔记本是私密的，不能分享」，又写「分享笔记本后，协作者能看到这些 Gemini 对话」，以实际界面为准
  - 个人账号「最多分享给 50 个用户」是私下分享的人数上限；公开链接的访问人数官方未写上限
  - 搜索里常见的「分享笔记本时发生错误」，官方帮助没有对应的排查说明
---

> 本文根据 Google 官方 Gemini Notebook（原 NotebookLM）帮助中心和 Google 官方博客整理，核对日期 2026-10-10。分享意味着对方能看到你的来源原文，分享前请确认资料可以给对方看，并遵守版权要求。

## 适用于谁

- 想把整理好的笔记本发给同学、同事一起用，搜「notebooklm 分享笔记本」的人；
- 想做一个「公开的资料库」让任何人提问的人；
- 遇到分享人数、账号类型限制，想知道官方规则的人。

## 结论先说

1. **私下分享**：点右上角「分享（Share）」，填对方邮箱，选「查看者（Viewer）」或「编辑者（Editor）」。
2. **公开分享**：把访问权限设为「知道链接的任何人（Anyone with a link）」，对方需要登录 Google 账号才能打开。
3. **个人 Gmail 账号私下分享最多 50 个用户**，不能分享给 Google 群组；公开分享目前只对个人账号开放。
4. **聊天记录不随分享公开**：官方说明对话记录只有你自己能看到。
5. **来源原文对方是能看到的**：即使用「仅对话视图」链接，官方也提醒它只是默认隐藏，并不能真正撤销对方对来源的访问。

## 一、私下分享：查看者和编辑者

1. 打开笔记本，点右上角「分享」；
2. 输入对方的邮箱；
3. 选择权限后保存。

| 权限 | 能做什么（帮助中心） |
| --- | --- |
| 查看者（Viewer） | 只读：可以查看你分享的笔记本里的所有来源文档和笔记 |
| 编辑者（Editor） | 可以查看、添加、移除来源和笔记，**还可以把笔记本继续分享给其他人** |

此外，生成或删除音频概览、视频概览、抽认卡、演示文稿等成品，官方都要求有编辑权限。

官方的两条提示：

- 个人 Gmail 账号最多把一个笔记本分享给 **50 个用户**，并且**不能分享给 Google 群组**；
- 把笔记本分享给群组时，成员不会收到欢迎邮件或通知，需要你自己把链接发过去。

分享面板里可以直接「复制链接（Copy link）」。

## 二、公开分享：知道链接的任何人

1. 打开笔记本，点右上角「分享」；
2. 把访问权限设为「知道链接的任何人（Anyone with a link）」；
3. 复制链接发给别人。

要点：

- 访问者**必须登录 Google 账号**才能打开；
- 访问者不能修改来源，但可以提问，也可以查看所有者或编辑者生成的内容（音频概览、常见问题解答、简报文档等）；
- 打开过的公开笔记本会出现在访问者的首页，不想要了可以在三点菜单里选「移除笔记本（Remove notebook）」；
- 所有者和编辑者之后做的修改会直接反映在公开笔记本里，**不需要重新生成链接**；
- 只有所有者和编辑者能生成公开链接、管理公开访问；
- 笔记本公开后，「分享」按钮旁会出现一个**地球图标**。官方 FAQ 的说明是：没有分享给任何人时显示锁形图标，单独分享给用户后变成共享图标，公开后是地球图标。

**账号类型限制**：按 Google 官方博客（2025-08-01 更新）和帮助中心，公开分享目前只对个人账号开放；Workspace 企业版和教育版账号不能公开分享，分享范围限制在同一个域内。

## 三、「仅对话视图」链接

复制链接时还可以选「复制对话视图链接（Copy link to chat view）」。对话视图（Chat View）会隐藏来源和 Studio 里的成品，让访问者专注于提问。

官方特意加了一段提醒：对话视图只是为了更专注的体验而**隐藏**这些内容，并没有真正撤销访问者对笔记本内容的底层访问权限，访问者仍然可能通过其他方式看到被隐藏的材料。所以不要把它当成「只让人提问、看不到原文」的保密手段。

## 四、只分享一个成品

如果你是公开笔记本的所有者，可以单独分享某个成品，比如一份演示文稿、一段音频概览或一份报告。官方说明：**拿到成品链接的人即使没有登录 Google 账号也能查看**。

做法是在该成品的播放器或查看器里点「分享」，确认笔记本已分享给对方或已公开、并且查看者可以访问完整笔记本，然后复制这个成品的链接。

注意：成品被删除后，之前的分享链接就失效了。

## 五、停止分享

1. 以所有者或编辑者身份打开这个公开笔记本；
2. 点右上角「分享」；
3. 把笔记本访问权限改回「受限（Restricted）」。

关闭后，新访问者再打开旧链接就进不来了；以前访问过的人，也不会再在自己的共享笔记本列表里看到它。笔记本被删除或改回私密后，旧的公开链接同样失效。

## 六、允许别人复制你的笔记本

帮助中心「创建笔记本」一文介绍了复制功能：

- **自己复制**：打开一个你有复制权限的笔记本（你自己的、分享给你且允许复制的私密笔记本、允许复制的公开笔记本），在顶部选「复制（Copy）→ 创建（Create）」。**Studio 内容和来源会被复制，对话记录和笔记不会**；
- **允许别人复制**：打开笔记本 →「分享」→ 至少分享给一个人 → 勾选或取消「允许复制（Allow copies）」→ 保存。

官方说明：不允许复制时，对方不能复制整个笔记本，但仍然可以复制其中他们有权访问的内容。

（官方 FAQ 里另有一条仍写「复制笔记本暂不支持」，与上面这篇文章不一致，见文首待核对事项。）

## 七、使用分析（Analytics）

点顶部的「分析（Analytics）」可以看笔记本过去 7 天的使用情况：

- 每日用户数：当天至少提问一次的用户数量，包含所有者本人；
- 每日提问数：所有用户当天的提问总数，包含所有者本人。

条件：笔记本要分享给**至少 4 个其他用户**，并且过去 7 天内有对话活动；数据大约每 24 小时更新一次。

## 八、其他分享限制

- **来源上限不变**：分享不会改变任何协作者自己的来源上限；
- **对话设置是共用的**：按官方博客配图里的界面说明，「配置对话」里的风格和长度设置会对所有能访问这个笔记本的人生效；
- **Play 图书电子书**：以电子书为来源的笔记本可以分享，但对方要查看电子书来源、甚至查看由它生成的成品，可能需要自己购买这本书；**用电子书生成了成品的笔记本不能公开分享**；
- **在 Gemini 应用里**：帮助中心写明，所有「已分享」的笔记本（包括你自己拥有的）不会显示在 Gemini 应用里，仍然要到 Gemini Notebook 里打开；
- **在 Google 搜索的 AI 模式里**：你拥有并分享出去的笔记本可见，别人分享给你的不可见。

## 常见问题

**Q：对方能看到我和 AI 的聊天记录吗？**
官方说明对话记录会保留并且只有你自己可见；Workspace Updates 也写明，在共享笔记本里，你的对话只有你能看到。

**Q：查看者能生成音频概览或演示文稿吗？**
不能。生成和删除这些成品需要编辑权限；公开笔记本的访问者只能查看已经生成好的内容。

**Q：公开笔记本里发现违规内容怎么办？**
打开该笔记本，在「设置（Settings）→ 举报笔记本（Report notebook）」里选择问题类型并提交。官方说明举报不保证一定会删除内容。

**Q：精选笔记本（Featured notebooks）是什么？**
是官方与作者、研究者、出版机构等合作整理的公开笔记本，个人账号可以在「精选笔记本」标签页里浏览。访问者可以阅读来源、提问、查看预先生成的成品，但不能添加自己的来源，也不能生成新的成品。

## 参考资料

- Create a notebook in Gemini Notebook（帮助中心，分享、复制与分析）：https://support.google.com/notebooklm/answer/16206563?hl=en
- Use public notebooks and featured notebooks in Gemini Notebook（帮助中心）：https://support.google.com/notebooklm/answer/16322204?hl=en
- Learn about Gemini Notebook's plans（帮助中心）：https://support.google.com/notebooklm/answer/16213268?hl=en
- Frequently asked questions（帮助中心）：https://support.google.com/notebooklm/answer/16269187?hl=en
- Notebooks in Gemini Apps（帮助中心）：https://support.google.com/notebooklm/answer/17003757?hl=en
- About notebooks in AI Mode in Google Search（帮助中心）：https://support.google.com/notebooklm/answer/17513891?hl=en
- Report a problem（帮助中心）：https://support.google.com/notebooklm/answer/16179536?hl=en
- Use chat in Gemini Notebook（帮助中心）：https://support.google.com/notebooklm/answer/16179559?hl=en
- Google 官方博客：NotebookLM is adding a new way to share your own notebooks publicly（2025-06-03，2025-08-01 更新）：https://blog.google/technology/google-labs/notebooklm-public-notebooks/
- Google 官方博客：Chat in NotebookLM（2025-10-29，「配置对话」界面说明）：https://blog.google/innovation-and-ai/models-and-research/google-labs/notebooklm-custom-personas-engine-upgrade/
- Google Workspace Updates：New ways to customize and interact with your content in NotebookLM（2026-03-20，对话记录私密说明）：https://workspaceupdates.googleblog.com/2026/03/new-ways-to-customize-and-interact-with-your-content-in-NotebookLM.html
