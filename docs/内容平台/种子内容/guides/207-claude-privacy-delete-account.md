---
title: Claude 隐私设置：模型训练开关、删除对话与删除账号
slug: claude-privacy-delete-account
products: [claude]
models: []
accountTier: FREE
excerpt: Claude 会不会拿我的对话训练模型？在哪关？删除对话后多久彻底删除、怎么批量删、怎么注销账号，以及无痕对话和数据保留期限，按官方说明一篇讲清。
checkedOn: 2026-10-07
sources:
  - https://privacy.claude.com/en/articles/12109829-how-do-i-change-my-model-improvement-privacy-settings
  - https://privacy.claude.com/en/articles/10023580-is-my-data-used-for-model-training
  - https://privacy.claude.com/en/articles/10023548-how-long-do-you-store-my-data
  - https://privacy.claude.com/en/articles/7996878-can-you-delete-data-sent-via-claude
  - https://privacy.claude.com/en/articles/10023660-deleting-claude-accounts
  - https://support.claude.com/en/articles/8325621-i-would-like-to-input-sensitive-data-into-my-chats-with-claude-who-can-view-my-conversations
  - https://support.claude.com/en/articles/8230524-delete-or-rename-a-conversation
  - https://support.claude.com/en/articles/9028421-delete-your-claude-account
  - https://support.claude.com/en/articles/12260368-use-incognito-chats
  - https://support.claude.com/en/articles/10593882-share-and-unshare-chats
  - https://claude.com/pricing
verify:
  - 模型训练开关在隐私中心原文里叫「Help Improve our AI models」，帮助中心其他地方称「Model Improvement」，设置页实际文字（及中文译名）以界面为准
  - 新用户的模型训练开关默认状态，本次读到的官方页面没有写明，文中只写「以设置页显示为准」
  - 数据保留期限（删除后 30 天、允许训练时最长 5 年、违规内容 2 年 / 7 年、反馈 5 年）摘自 Anthropic 隐私中心，可能随隐私政策更新
  - 「Account → Delete Account」截图是隐私中心较早的深色界面配图，现在的设置页布局可能不同
  - 本文只覆盖个人套餐（Free / Pro / Max）；Team / Enterprise 和 API 的数据规则不同
---

> 本文根据 Anthropic 隐私中心（privacy.claude.com）和 Claude 帮助中心的官方文章整理，核对日期 2026-10-07；截图引用自 Claude 帮助中心并注明出处。本文只讲个人套餐（Free / Pro / Max）。按钮名称以英文界面为准。

## 适用于谁

- 搜「claude 隐私设定」，想知道 Claude 会不会用自己的对话训练模型、在哪里关闭的人；
- 想删除某几个对话或批量清空历史（「claude 删除对话」）的人；
- 不再使用、想注销账号（「claude 删除账号」）的人。

## 结论先说

1. **模型训练开关**：Settings → Privacy →「Help improve our AI models」（隐私中心原文的叫法），可以随时开关。关掉后，新旧对话都不会再用于**以后的**训练，但已经开始的训练和已训练好的模型不受影响。
2. **无痕对话（Incognito）不会用于训练**，即使你开着训练开关也一样。
3. **删除对话**：立刻从历史记录消失，**30 天内**从后端系统删除；网页版可以批量删除。
4. **删除账号**：Settings → Account →「Delete account」，**永久且不可恢复**。Pro / Max 要先取消订阅、等当前计费周期结束后才能删。删除前建议先导出数据。
5. 被安全系统标记为违规的对话，即使关了训练开关，仍可能被用于改进安全模型。

## 一、模型训练开关

### 在电脑上（网页版 / 桌面版）

1. 点左下角你的名字，打开菜单；
2. 选「Settings」；
3. 进入「Privacy」；
4. 找到「Help improve our AI models」，点开关切换开 / 关。

### 在手机上

点你的名字 →「Settings」→「Privacy」→ 同样找到「Help improve our AI models」切换。

### 开和关分别意味着什么（官方说明）

| | 允许用于改进 Claude | 不允许 |
| --- | --- | --- |
| 你的对话 / 编程会话 | 可能用于模型训练，包括完整对话、上传内容、自定义风格和偏好设置 | 不会用于以后的训练 |
| 保留期限 | 以去标识化形式在训练流程中最长保留 **5 年**（只针对开启后新建或继续的对话） | 按常规规则；删除的对话 30 天内从后端删除 |
| 已有训练 | — | 已经开始的训练、已训练好的模型里仍包含之前的数据 |

补充几点：

- **连接器的原始内容不用于训练**：Google Drive 等连接器、远程或本地 MCP 服务器里的原始数据不在训练范围内；但如果你把内容直接复制进对话，就属于对话的一部分；
- **点赞 / 点踩反馈**会把整段相关对话保存最长 5 年，与账号去关联后可能用于研究和训练；
- **从对话历史里删掉的对话**，不会用于以后的模型训练；
- 允许用于训练时，官方说明会先把数据和你的用户 ID（如邮箱）去关联，只有少数参与训练的人员能接触，且不会用这些数据联系你、给你画像或卖给第三方。

无论开关如何，官方都建议**不要在对话里输入高度敏感的信息**：身份证号、银行卡号、病历、密码、机密文件等。

## 二、删除对话

### 网页版删除单个对话

1. 在左侧栏找到对话，或点「Chats and tasks」查看全部历史；
2. 鼠标移到对话上，点右侧的「⋮」；
3. 选「Delete」（「Rename」是改名）；
4. 在确认框里再点一次「Delete」。

### 网页版批量删除

1. 点左侧栏的「Chats and tasks」；
2. 鼠标移到任一对话，点「⋮」→「Select」；
3. 勾选其他要删的对话，或点顶部「Select all」全选；
4. 点「Delete」，再在确认框里点「Delete」。

### iOS

在对话列表里**长按**某个对话 → 点「Delete」→ 再确认。正在打开的对话也可以点右上角「⋯」→「Delete」。

![Claude iOS 版对话列表：长按对话后弹出菜单，包含 Add to project、Star、Rename 和 Delete](seed:g207-ios-chat-list.jpg)
*图片来源：[Claude 帮助中心《Delete or rename a conversation》](https://support.claude.com/en/articles/8230524-delete-or-rename-a-conversation)*

### Android

- 删除当前对话：右上角「⋮」→「Delete」→ 确认；
- 批量删除：在对话列表点右上角的清单图标 → 勾选要删的对话 → 点垃圾桶图标 → 确认「Delete」。

### 删除后会怎样

- 对话立即从历史记录消失，**30 天内**从后端存储删除；
- 项目、账号信息等其他数据不会跟着删，直到你手动删除或注销账号；
- 如果用了记忆功能，新版记忆里**由该对话生成的记忆条目不会自动删除**，要去 Settings → Memory 手动删，详见本站《Claude 记忆功能怎么用：开启、查看、导入与导出记忆》；
- 如果对话的保留另有法律要求或涉及违规调查，可能按要求保留（见下文）。

### 分享过的对话记得取消分享

分享链接是对话快照，删对话前最好先取消分享：Settings → Privacy →「Shared chats」旁点「Manage」，在列表里对每条点「Unshare」。

![Shared chats 弹窗：列出分享过的对话链接、分享日期，右侧有 Unshare 按钮](seed:g207-shared-chats.png)
*图片来源：[Claude 帮助中心《Share and unshare chats》](https://support.claude.com/en/articles/10593882-share-and-unshare-chats)*

## 三、删除（注销）账号

**删除前**：

- 删除是永久的，对话、项目和其他数据都无法恢复。想保留的话，先在网页版或桌面版导出，步骤见本站《Claude 导出聊天记录：导出数据步骤与导出文件怎么看》；
- **Pro / Max 用户**：先在 Billing 设置里取消订阅，等当前订阅周期结束、订阅失效后再删除账号。

### 网页版

1. 打开 claude.ai，点左下角的姓名首字母或名字；
2. 选「Settings」，或直接进入 Settings → Account；
3. 点「Delete account」，按提示完成。

![Claude 设置页的 Account 标签，右侧是 Delete Account 按钮](seed:g207-account-settings.png)
*图片来源：[Anthropic 隐私中心《Deleting Claude accounts》](https://privacy.claude.com/en/articles/10023660-deleting-claude-accounts)*

### iOS

打开 Claude App →「Settings」→ Account 区域点「Profile」→「Delete account」→ 点「Delete」确认。

### Android

点左上角菜单按钮 → 点左下角的姓名首字母 →「Profile」→ 在「Account Actions」下点「Delete Account」→ 点「I Understand」确认。

### 特殊情况

- 部分账号需要联系官方支持才能删除，这种情况会在账号设置里注明；
- 同一个邮箱下有多个账号时，联系支持时要说明删哪几个；
- 通过第三方服务（例如 Poe、Slack）使用 Claude 的，要向该第三方申请删除。

## 四、无痕对话与数据保留期限

**无痕对话**：在项目外新建对话时点右上角的幽灵图标开启。不进历史记录、不进记忆、不用于训练；但官方说明它仍会**保留 30 天**（安全用途）。关掉后无法再打开，也不能转成普通对话。所有套餐都能用。

**个人套餐的数据保留（Anthropic 隐私中心）**：

| 情况 | 保留期限 |
| --- | --- |
| 你删除的对话 | 立即从历史移除，30 天内从后端删除 |
| 允许用于改进 Claude | 去标识化数据在训练流程中最长 5 年 |
| 被判定违反使用政策 | 输入和输出最长 2 年，安全分类分数最长 7 年 |
| 点赞 / 点踩等反馈 | 5 年 |

此外，法律要求、解决争议或处理违规时，Anthropic 可能按需保留数据。

## 常见问题

**Q：我关了训练开关，以前的对话还会被用吗？**
官方说明关掉后，以前和以后的对话都不会用于**以后的**训练；但已经在进行中的训练、已经训练好的模型不会因此改变。

**Q：删除的对话还能恢复吗？**
官方没有提供恢复功能。删除后立即从历史中消失，30 天内从后端删除。重要对话请先导出。

**Q：取消订阅后账号和数据会被删吗？**
不会。定价页说明取消订阅不会删除数据，对话、项目和文件都保留，Pro / Max 在周期结束后转为 Free。要彻底删除，需要按上面的步骤注销账号。

**Q：注销后能用同一个邮箱重新注册吗？**
本次读到的官方页面没有说明，以官方支持的答复为准。

**Q：Team / Enterprise 的数据规则一样吗？**
不一样。商业套餐的数据由组织管理，保留期限和导出权限由组织设置决定，本文不适用。

## 参考资料

- How do I change my model improvement privacy settings?（Anthropic 隐私中心）：https://privacy.claude.com/en/articles/12109829-how-do-i-change-my-model-improvement-privacy-settings
- Is my data used for model training?（Anthropic 隐私中心）：https://privacy.claude.com/en/articles/10023580-is-my-data-used-for-model-training
- How long do you store my data?（Anthropic 隐私中心）：https://privacy.claude.com/en/articles/10023548-how-long-do-you-store-my-data
- Can you delete data sent via Claude?（Anthropic 隐私中心）：https://privacy.claude.com/en/articles/7996878-can-you-delete-data-sent-via-claude
- Deleting Claude accounts（Anthropic 隐私中心）：https://privacy.claude.com/en/articles/10023660-deleting-claude-accounts
- 输入敏感信息前须知（帮助中心）：https://support.claude.com/en/articles/8325621-i-would-like-to-input-sensitive-data-into-my-chats-with-claude-who-can-view-my-conversations
- Delete or rename a conversation（帮助中心）：https://support.claude.com/en/articles/8230524-delete-or-rename-a-conversation
- Delete your Claude account（帮助中心）：https://support.claude.com/en/articles/9028421-delete-your-claude-account
- Use incognito chats（帮助中心）：https://support.claude.com/en/articles/12260368-use-incognito-chats
- Share and unshare chats（帮助中心）：https://support.claude.com/en/articles/10593882-share-and-unshare-chats
- Claude 定价页（官方）：https://claude.com/pricing
