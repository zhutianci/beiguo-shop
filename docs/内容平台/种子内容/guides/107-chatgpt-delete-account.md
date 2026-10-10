---
title: ChatGPT 删除账号怎么操作：步骤、订阅怎么处理与 30 天规则
slug: chatgpt-delete-account
products: [chatgpt]
models: []
accountTier: FREE
excerpt: 想注销 ChatGPT 账号？删除是永久的，还会影响 API 和订阅。本文按官方帮助中心讲清删除前要做的检查、网页版和隐私门户两种删除方法、数据多久清除、苹果订阅为什么不会自动取消，以及同一邮箱多久后能重新注册。
checkedOn: 2026-10-07
sources:
  - https://help.openai.com/en/articles/6378407-deleting-your-chatgpt-account
  - https://help.openai.com/en/articles/9019931-creating-a-new-chatgpt-account-after-deletion
  - https://help.openai.com/en/articles/7232927-canceling-your-chatgpt-subscription
  - https://help.openai.com/en/articles/7260999-exporting-your-chatgpt-history-and-data
  - https://help.openai.com/en/articles/7925741-sharing-conversations-and-scheduled-tasks-in-chatgpt
  - https://privacy.openai.com/
verify:
  - 「账户」「删除账户」「永久删除我的账户」等中文按钮名以实际界面为准
  - iOS / Android App 内删除的具体步骤官方另有文章（8980410、8142208），正文只写网页版和隐私门户
---

> 本文根据 OpenAI 帮助中心（Deleting your ChatGPT account、Creating a new ChatGPT account after deletion、Canceling your ChatGPT subscription 等）整理，资料核对于 2026-10-07。

## 适用于谁

- 不再使用 ChatGPT，想彻底注销账号、清除数据的人；
- 想换邮箱、换登录方式，以为必须先删号的人（多数情况下不用删）；
- 删号后想用同一个邮箱重新注册的人。

## 结论先说

1. **删除是永久的**：账号删了不能恢复，也不能「重新激活」。删除后这个账号**连同 API 平台**一起无法使用，数据会在 30 天内删除（法律要求或允许保留的少量数据除外）。
2. **先想清楚是不是真的要删**：只是想停止付费，取消订阅就行；想换邮箱、换登录方式、删掉某段对话，都不需要删号。
3. **苹果、谷歌商店的订阅不会因为删号自动取消**：官方明确说删号不会取消 Apple 订阅，Google Play 的也要自己检查。务必先去商店里取消。
4. **删除入口**：网页版 **Settings（设置）→ Account（账户）→ Delete account（删除账户）**；登录不了时，用 [隐私门户](https://privacy.openai.com/) 申请。
5. **同一邮箱 30 天后可重新注册**（前提是彻底删除，而不是被停用）。新账号不会带回旧的聊天、文件和记忆。

## 删除前的检查清单

1. **导出数据**：需要保留的聊天记录先导出备份，方法见 [/guides/chatgpt-export-chat-history](/guides/chatgpt-export-chat-history)。删除后再也拿不到。
2. **取消应用商店订阅**：在 iPhone / Google Play 里订阅的 Plus 或 Pro，先在对应商店取消，见 [/guides/chatgpt-cancel-subscription](/guides/chatgpt-cancel-subscription)。直接在 ChatGPT 网页订阅的，删号时会一并取消。
3. **处理分享链接**：你创建的对话分享链接会随账号删除；但分享出去的定时任务链接要先在 **设置 → 数据控制 → 共享链接** 里手动删除。
4. **检查 API 用途**：账号同时用于 OpenAI API 的，删号后 API 也无法使用。
5. **检查广告账号**：如果同一邮箱还用来管理 OpenAI 的广告账户，删号可能导致你无法再管理它，而且正在投放的广告不一定会自动暂停。先暂停或结束投放，并确保有其他有权限的人能访问。
6. **公司账号不能自助删除**：Business、Enterprise、Edu、ChatGPT for Healthcare 工作区的账号要找所在组织处理。

## 步骤

### 方法一：在网页版删除

1. 登录 [chatgpt.com](https://chatgpt.com/)；
2. 打开账号菜单，进入 **Settings（设置）**；
3. 选 **Account（账户）**；
4. 在 **Delete account（删除账户）** 旁点 **Delete（删除）**；
5. 按提示输入账号邮箱或手机号，并输入 `DELETE`；
6. 点 **Permanently delete my account（永久删除我的账户）**。

手机 App 里也能删除，官方为 iOS 和 Android 分别写了操作说明。

### 方法二：登录不了时用隐私门户

1. 打开 [privacy.openai.com](https://privacy.openai.com/)；
2. 点 **Make a Privacy Request（提交隐私请求）**；
3. 选 **I have a consumer ChatGPT account（我有个人 ChatGPT 账号）**；
4. 选 **Delete my ChatGPT account（删除我的 ChatGPT 账号）**，按步骤完成验证。

你需要能验证账号绑定的邮箱或手机号。两个都无法访问的，只能联系 OpenAI 客服做账号归属审核。

## 删除后数据会怎样

- **账号数据**：30 天内删除，法律要求或允许保留的少量数据除外。
- **聊天记录**：已删除的对话 30 天内从系统中永久移除；若之前已经去标识化、与账号脱钩，或因安全、法律原因需要保留，则另行处理。
- **自定义指令**：随账号删除流程在 30 天内删除。
- **训练**：如果你没有关闭「为所有人改进模型」，之前可能已有去标识化的对话记录被使用，这部分不随账号删除而撤回。不想被用于训练，建议平时就在数据控制里关闭，见 [/guides/chatgpt-data-controls-privacy](/guides/chatgpt-data-controls-privacy)。

## 不删号也能解决的事

| 你的目的 | 不用删号的做法 |
| --- | --- |
| 不想再扣费 | 取消订阅 |
| 换邮箱 | 按官方「修改邮箱」文章操作（部分账号支持） |
| 换登录方式 | 用 Google / Apple / Microsoft 注册的，可在 **设置 → Security and login（安全与登录）** 看「密码」项是否显示 **Add（添加）**，能加就加 |
| 删掉某段对话 | 单独删除或归档那段对话 |
| 清掉 ChatGPT 记住的内容 | 在 **设置 → 个性化** 里管理记忆 |

官方特别提醒：**删号并不能让你更换登录方式**。

## 常见问题

**Q：删号后多久能用同一个邮箱重新注册？**
30 天后，前提是旧账号被彻底删除。想更早注册，只能用别的邮箱，或者邮箱服务商支持的别名（如 `name+new@example.com`）。超过 30 天仍注册不了，先确认旧账号是「删除」而不是「停用」，再联系客服。

**Q：登录时提示「You do not have an account because it has been deleted or deactivated」？**
意思是这个邮箱对应的账号已被删除或停用。自己删的，无法恢复；不是自己删的，去邮箱找关于停用、年龄验证或违规的通知邮件。被停用的账号等 30 天也不会恢复。

**Q：手机号能重复用吗？**
注册 ChatGPT 不需要手机号验证；但在 API 平台生成第一个 API 密钥时需要。一个手机号最多为 3 个账号验证首个 API 密钥，删号不会重置这个次数。

**Q：删号后还能不登录用 ChatGPT 吗？**
可以，不登录也能使用，但同一时间只支持一个对话，想保存对话需要登录或注册。

## 参考资料

- OpenAI 帮助中心：Deleting your ChatGPT account — https://help.openai.com/en/articles/6378407-deleting-your-chatgpt-account
- OpenAI 帮助中心：Creating a new ChatGPT account after deletion — https://help.openai.com/en/articles/9019931-creating-a-new-chatgpt-account-after-deletion
- OpenAI 帮助中心：Canceling your ChatGPT subscription — https://help.openai.com/en/articles/7232927-canceling-your-chatgpt-subscription
- OpenAI 帮助中心：Exporting your ChatGPT history and data — https://help.openai.com/en/articles/7260999-exporting-your-chatgpt-history-and-data
- OpenAI 帮助中心：Sharing conversations and scheduled tasks in ChatGPT — https://help.openai.com/en/articles/7925741-sharing-conversations-and-scheduled-tasks-in-chatgpt
- OpenAI 隐私门户 — https://privacy.openai.com/
