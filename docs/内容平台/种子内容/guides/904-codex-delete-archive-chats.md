---
title: Codex 怎么删除对话、清理任务：桌面 App 先归档再删除，CLI 用 /archive 和 /delete
slug: codex-delete-archive-chats
products: [codex, chatgpt]
models: []
accountTier: PLUS
excerpt: Codex 的对话没有「直接删除」，要先归档再删除。按 OpenAI 帮助中心和 Codex 文档：桌面 App 在 Settings → Archived chats 里点垃圾桶，CLI 用 /archive、/delete。本文讲步骤、删除后多久清除、能不能恢复，以及找不到旧对话时怎么查。
checkedOn: 2026-10-14
sources:
  - https://help.openai.com/en/articles/20001333-how-to-archive-and-delete-codex-chats-in-the-chatgpt-app
  - https://learn.chatgpt.com/docs/cli/slash-commands
  - https://learn.chatgpt.com/docs/reference/troubleshooting
verify:
  - 官方帮助文章写的是「Archive chats」菜单，官方截图里是悬停对话时出现的「Archive chat」图标，两者可能因版本不同；按你界面上实际看到的为准
  - 官方这篇文章讲的是 ChatGPT App 里的本地 Codex 对话（文中写「When you delete a Codex chat locally」）；云端 Codex 任务怎么删除，这篇文章没有写，本文不推测
  - CLI 的 /archive、/delete、codex unarchive 来自 Codex 官方 slash 命令文档；命令行里直接归档或删除某个会话的 shell 命令，官方这页没有写，本文不写
  - 三张官方截图为英文界面，截图较小，仅用于对应步骤
---

> 本文根据 OpenAI 帮助中心《How to archive and delete Codex chats in the ChatGPT app》、Codex 的《Slash commands in Codex CLI》和《Troubleshooting》整理，资料核对于 2026-10-14。三张截图引自官方帮助文章，为英文界面。普通 ChatGPT 对话的删除见 [/guides/chatgpt-delete-chats-bulk](/guides/chatgpt-delete-chats-bulk)。

## 适用于谁

- 在 ChatGPT 桌面 App 里用 Codex，侧边栏里对话太多，想清理的人；
- 在命令行用 Codex CLI，想删掉某次会话的人；
- 找不到「删除」按钮，不知道要先归档的人；
- 担心删除后对话还留不留、能不能恢复的人。

## 结论先说

1. **必须先归档，才能删除**：官方说得很直白：「You must first archive a chat prior to deleting it.」所以侧边栏里不会有直接的删除按钮。
2. **桌面 App 的路径**：先在 Codex 对话列表里**归档**；再到 **Settings（设置）→ Archived chats（已归档的对话）**，把鼠标移到对话上，点**垃圾桶图标**，确认 **Delete archived chat**。
3. **想一次清空**：官方说 **Settings → Archived chats** 里有一次删除所有归档对话的选项，会应用于**所有已归档对话，包括项目里的**。
4. **CLI 里**：输入 **/archive** 归档当前会话，**/delete** 永久删除当前会话。
5. **删了不能恢复**：官方说，删除后的对话在界面、API 和客服那里都**找不回来**。对话会立刻从你的 Codex 历史里消失，并排期在 **30 天内**从 OpenAI 系统里永久删除。
6. **例外**：如果你允许 OpenAI 用你的内容改进模型，并且这段对话已经去标识化、与你的账号解除了关联；或者 OpenAI 因安全、保障、法律义务必须保留，则不在 30 天删除范围内。

![官方截图：Codex 对话列表里悬停时出现的置顶和归档图标（英文界面）](seed:g904-codex-archive-icon.png)
*图片来源：[OpenAI 帮助中心：How to archive and delete Codex chats in the ChatGPT app](https://help.openai.com/en/articles/20001333-how-to-archive-and-delete-codex-chats-in-the-chatgpt-app)*

## 一、桌面 App：归档，再永久删除

### 第一步：归档

官方的步骤：

1. 在 ChatGPT App 里打开 **Codex 对话历史侧边栏**；
2. **把鼠标移到**要归档的对话上；
3. 点对话标题旁边的**三个点**，选 **Archive chats**（官方文字写法）；
4. 看到提示时，确认 **Archive all**。

官方截图里，悬停对话时右侧出现的是**置顶**和**归档**两个图标，提示文字是「Archive chat」，点归档图标即可。文字和截图略有差别，按你界面上实际看到的操作。

归档只是把对话从侧边栏里**藏起来**，不是删除：官方在保留说明里写了，登录了 ChatGPT 的话，你保留的对话（未归档的和已归档的）都会保存在账号里，直到你删除。

### 第二步：永久删除已归档的对话

1. 在 ChatGPT App 里打开 Codex 对话历史侧边栏，进入 **Settings** 页；
2. 点 **Archived chats** 标签；
3. 把鼠标移到要删的对话上；
4. 点标题旁边的**垃圾桶图标**；
5. 确认 **Delete archived chat**。

![官方截图：Archived chats 里一条对话，右侧有垃圾桶（Delete archived chat）和 Unarchive 按钮（英文界面）](seed:g904-codex-delete-archived.png)
*图片来源：[OpenAI 帮助中心：How to archive and delete Codex chats in the ChatGPT app](https://help.openai.com/en/articles/20001333-how-to-archive-and-delete-codex-chats-in-the-chatgpt-app)*

从这张官方截图能看到，每条归档对话右侧有两个操作：**垃圾桶**（删除）和 **Unarchive**（取消归档）。想把对话放回原位，点 Unarchive；官方的排查说明里也写了，取消归档的对话会回到它原来在侧边栏里的位置。

### 一次删除所有归档

官方说，**Settings → Archived chats** 里有一次删除所有对话的选项。点之前注意：官方明确说这会作用于**所有已归档的对话，包括项目里的归档对话**。

![官方截图：确认框「Delete all archived local chats?」，说明这会永久删除所有本地归档对话（英文界面）](seed:g904-codex-delete-all-archived.png)
*图片来源：[OpenAI 帮助中心：How to archive and delete Codex chats in the ChatGPT app](https://help.openai.com/en/articles/20001333-how-to-archive-and-delete-codex-chats-in-the-chatgpt-app)*

确认框上写的是「Delete all archived local chats?」，说明这会**永久删除所有本地归档对话**。点 Delete 之前，先想想有没有还要留的。

## 二、命令行 Codex CLI

Codex 官方的斜杠命令文档里有这几条：

| 命令 | 作用 |
| --- | --- |
| **/archive** | 归档当前会话：把它从活动会话列表里拿走，但**不删除**转写 |
| **/delete** | **永久删除**当前会话：删除转写和派生的子会话 |
| **codex unarchive <SESSION>** | 把归档过的会话恢复回来（官方说归档后用它恢复） |

官方说明的细节：

- **/archive**：输入后回车，确认要归档当前会话。如果当前连着本地后台服务或远程服务，归档后回到命令中心；没有共享服务时，Codex 会退出。**如果有任务在运行，确认 /archive 会先停止那一轮，再归档**；
- **/delete**：输入后回车，确认要删除当前会话。会永久删除转写和**派生的子会话**。**对话运行时、或在旁支对话里，/delete 不可用**；
- 这两个操作都需要你在 TUI 里确认，没有确认就不会生效。

Codex 的会话转写默认存在 `$CODEX_HOME/sessions`（默认是 `~/.codex/sessions`），归档的会话在 `$CODEX_HOME/archived_sessions`（默认是 `~/.codex/archived_sessions`），这是 Codex 官方排查文档里列出的位置。

## 三、删除之后会怎样

按官方帮助文章：

- **立刻从你的 Codex 历史里消失**，排期在 30 天内从 OpenAI 系统里永久删除（例外见上）；
- **不能恢复**：不能通过界面、API，也不能通过客服找回；
- **连接的应用数据**：如果你连接过 Google Drive、Gmail、日历这类应用，对话里**留存的同步应用数据**会随对话一起删除，但**不会改动那些应用里的原始数据**；而**只归档**的对话，对话和它引用过的应用数据都会继续保存在你的账号里，想两者都去掉，必须**删除**对话；
- **断开应用**只会阻止 Codex 之后再访问，**不会**删除已经用过这些数据的对话。想从账号里清除这些数据，要删除引用过它们的对话。

## 四、找不到对话怎么办

官方给的排查步骤：

1. 确认你登录的是**正确的 OpenAI 账号或工作区**（包括邮箱、SSO 方式、团队）；
2. 在 Settings 里看 **Archived chats**，对话可能是被归档了，不是被删了；
3. 官方文章还提到确认设置里的「聊天记录与训练」开关是开着的；刷新页面，或退出再登录；
4. 看 status.openai.com 有没有故障，故障可能让历史记录暂时看不到；
5. 在 **Settings → Data controls** 请求导出数据，确认账号里还存着哪些对话。

官方的 Codex 排查文档里还有一条：**侧边栏只显示部分对话**时，点 **Chats** 旁边的筛选图标，选 **Chronological（按时间排序）**；仍然看不到，再去 **Settings → Archived chats** 找。

官方说明，已经删除的对话（包括用「删除全部」删掉的）**无法恢复**。

## 常见问题

**Q：为什么 Codex 侧边栏里没有删除按钮？**
官方规定必须先归档再删除，删除按钮在 Settings → Archived chats 里。

**Q：归档的对话还占着我的数据吗？**
官方说归档只是隐藏，对话继续保存在账号里，直到你删除。

**Q：云端的 Codex 任务怎么删？**
官方这篇帮助文章讲的是 ChatGPT App 里的本地 Codex 对话。云端任务怎么清理，文章里没有写，以官方界面和说明为准。

**Q：一次删除所有归档，会不会把项目里的也删掉？**
会。官方明确说作用于所有已归档的对话，包括项目里的。

**Q：删除之后，OpenAI 多久真正清除？**
官方说排期在 30 天内，例外是已去标识化并解除关联的内容，以及因安全、保障或法律义务必须保留的内容。

**Q：Codex 对话和普通 ChatGPT 对话的删除方式一样吗？**
不一样。普通 ChatGPT 对话可以直接在菜单里删除，见 [/guides/chatgpt-delete-chats-bulk](/guides/chatgpt-delete-chats-bulk)；Codex 要先归档再删除。Codex 本身的入门见 [/guides/codex-getting-started](/guides/codex-getting-started)。

## 参考资料

- OpenAI 帮助中心：How to archive and delete Codex chats in the ChatGPT app — https://help.openai.com/en/articles/20001333-how-to-archive-and-delete-codex-chats-in-the-chatgpt-app
- Codex 文档：Slash commands in Codex CLI — https://learn.chatgpt.com/docs/cli/slash-commands
- Codex 文档：Troubleshooting — https://learn.chatgpt.com/docs/reference/troubleshooting
