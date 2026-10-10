---
title: ChatGPT 聊天记录怎么导出：导出数据步骤、下载链接与迁移到新账号
slug: chatgpt-export-chat-history
products: [chatgpt]
models: []
accountTier: FREE
excerpt: 想备份 ChatGPT 聊天记录，或换账号前把对话带走？本文按官方帮助中心讲清设置里导出数据和隐私门户两种方法、要等多久、链接多久失效、压缩包里有什么，以及能不能把记录导入另一个账号。
checkedOn: 2026-10-07
sources:
  - https://help.openai.com/en/articles/7260999-exporting-your-chatgpt-history-and-data
  - https://help.openai.com/en/articles/9106926-transfer-exported-conversations-between-chatgpt-accounts
  - https://help.openai.com/en/articles/7730893-data-controls-in-chatgpt
  - https://privacy.openai.com/
verify:
  - 压缩包里除 conversations.json 外还有哪些文件，官方只写「聊天记录和其他相关账号数据」，未逐项列出
  - 「数据控制」「导出数据」「确认导出」等中文菜单名以实际界面为准
---

> 本文根据 OpenAI 帮助中心（Exporting your ChatGPT history and data、Transfer exported conversations between ChatGPT accounts、Data controls）整理，资料核对于 2026-10-07。

## 适用于谁

- 想把 ChatGPT 聊天记录完整备份到本地的人；
- 准备删除账号、换新账号，或者个人账号要并入公司 Business 工作区，担心记录丢失的人；
- 点了导出却一直没收到邮件、下载链接打不开的人。

## 结论先说

1. **两种导出方法**：ChatGPT 里 **Settings（设置）→ Data controls（数据控制）→ Export data（导出数据）→ Export → Confirm export**；或者在 [隐私门户 privacy.openai.com](https://privacy.openai.com/) 提交「下载我的数据」请求。登录不了账号时用后者。
2. **谁能自助导出**：Free、Go、Plus、Pro，以及管理员开启了导出的 Edu 工作区。Business、Enterprise、ChatGPT for Healthcare 工作区**不能自助导出**，要找工作区所有者。
3. **时间**：准备好后通过邮件（只用手机号注册的账号是短信）发下载链接，**最长可能要 7 天**；链接**收到后 24 小时内有效**，必须登录发起导出的同一个账号下载。
4. **已删除的对话导不出来**。导出只能拿到现存的数据。
5. **不能把记录真正「搬」进另一个账号**，只能把导出的 JSON 文件作为附件上传到新账号的某个对话里当参考。

## 步骤

### 方法一：在 ChatGPT 设置里导出

1. 登录 [chatgpt.com](https://chatgpt.com/)（退出登录状态下不能导出）；
2. 打开头像菜单，进入 **Settings（设置）**；
3. 选 **Data controls（数据控制）**；
4. 在 **Export data（导出数据）** 旁点 **Export（导出）**；
5. 在确认页点 **Confirm export（确认导出）**。

提交前确认你能收到账号绑定邮箱或手机号的消息，系统可能需要验证你是账号本人。

### 方法二：通过隐私门户申请

1. 打开 [privacy.openai.com](https://privacy.openai.com/)；
2. 点 **Make a Privacy Request（提交隐私请求）**；
3. 选 **I have a consumer ChatGPT account（我有个人 ChatGPT 账号）**；
4. 选 **Download my data（下载我的数据）**，按页面提示完成。

隐私门户也可以用来行使其他隐私权利，比如申请删除个人数据。

### 下载并检查

1. 收到邮件或短信后，点里面的 **Download data export（下载导出数据）**；
2. 确保浏览器里登录的是**发起导出的那个账号**；
3. 下载得到一个 ZIP 压缩包，里面是聊天记录和其他相关账号数据；
4. 解压后检查需要的对话是否都在。对话数据一般在 `conversations.json` 里，数据量大时可能拆成多个带编号的对话 JSON 文件。

导出文件里有账号敏感信息，下载链接和压缩包都要妥善保管，不要发给别人。

## 导出没收到 / 链接打不开

| 情况 | 处理方法 |
| --- | --- |
| 迟迟没收到邮件 | 最长要等 7 天；查收件箱、垃圾邮件、推广邮件分类；只用手机号的账号看短信。超过 7 天仍没收到，联系 OpenAI 客服 |
| 提示「已经申请过导出」 | 等上一次请求处理完再提交，不要重复点 |
| 链接过期 | 链接只有 24 小时有效，过期后重新申请一次 |
| 链接打不开 | 确认登录的是发起导出的同一个账号 |
| 账号登录不了 | 改用隐私门户申请；忘记密码的处理见 [/guides/chatgpt-login-problems](/guides/chatgpt-login-problems) |

## 换账号：能把聊天记录导入新账号吗

不能完整迁移。官方说明 ChatGPT **不支持合并账号**，也不支持把一个账号的历史对话移到另一个账号的侧边栏里。可行的做法是「当参考资料用」：

1. 在旧账号导出并下载 ZIP；
2. 解压，找到 `conversations.json`（或带编号的多个 JSON 文件）；
3. 登录要继续使用的新账号，**新开一个对话**；
4. 把 JSON 文件上传到这个对话里，之后就可以让 ChatGPT 参考里面的内容回答，例如「根据我上传的旧对话，帮我找出去年讨论过的装修预算」。

文件太大传不上去时：分别上传带编号的 JSON 文件；把文件拆小；或只挑需要的对话上传。上传限制可参考 [/guides/chatgpt-file-upload-failed](/guides/chatgpt-file-upload-failed)。

这样做**不会**：把旧对话变回一条条独立聊天、恢复原来的侧边栏、合并两个账号，也**不会**转移订阅、自定义指令、记忆、GPTs、文件或工作区成员身份。换账号前记得检查两个账号上的 Plus / Pro 订阅，避免重复付费。

## 个人账号并入公司工作区前

如果你的个人工作区要迁移或合并到 Business、Enterprise、Edu 或 ChatGPT for Healthcare 工作区，**一定要在迁移前**申请、下载并检查导出。官方提醒：个人工作区被移除后，之前的导出链接可能打不开，也不能再从那个工作区申请导出。

## 常见问题

**Q：导出会包含记忆和自定义指令吗？**
自定义指令帮助文章明确写了包含在数据导出里。记忆的备份方法见 [/guides/chatgpt-memory-full](/guides/chatgpt-memory-full)。

**Q：手机 App 能导出吗？**
数据控制页面在手机设置里也有；官方步骤以网页版为例。无论在哪里申请，下载链接都会发到邮箱或短信。

**Q：导出后会删除账号里的记录吗？**
不会。导出只是复制一份，账号里的记录保持不变。删除账号是另一个操作，见 [/guides/chatgpt-delete-account](/guides/chatgpt-delete-account)。

**Q：想在导出前先找回不见的对话？**
先确认它是不是被归档了，方法见 [/guides/chatgpt-archived-chats-missing](/guides/chatgpt-archived-chats-missing)。

## 参考资料

- OpenAI 帮助中心：Exporting your ChatGPT history and data — https://help.openai.com/en/articles/7260999-exporting-your-chatgpt-history-and-data
- OpenAI 帮助中心：Transfer exported conversations between ChatGPT accounts — https://help.openai.com/en/articles/9106926-transfer-exported-conversations-between-chatgpt-accounts
- OpenAI 帮助中心：Data controls in ChatGPT — https://help.openai.com/en/articles/7730893-data-controls-in-chatgpt
- OpenAI 隐私门户 — https://privacy.openai.com/
