---
title: ChatGPT 的「任务」（Tasks）不见了怎么办：现在叫 Scheduled，三个入口、任务数量上限和被暂停的原因
slug: chatgpt-scheduled-tasks-missing
products: [chatgpt]
models: []
accountTier: FREE
excerpt: ChatGPT 找不到「任务」入口，或者设好的任务不再运行？官方帮助中心里这个页面叫 Scheduled。本文列出三个入口、各套餐同时开启的任务数量上限，以及任务被暂停或消失的官方原因，和桌面版看不到时的处理办法。
checkedOn: 2026-10-27
sources:
  - https://help.openai.com/en/articles/10291617-scheduled-tasks-in-chatgpt
verify:
  - 官方文章没有提到「Tasks」改名为「Scheduled」，只是标题和正文里用 tasks，页面名叫 Scheduled；正文只写「官方页面名是 Scheduled」，不说改过名
  - 任务数量上限（3、5、10、15）是官方文章当天的数字，之后可能调整，以官方文章为准
  - 官方文章没有按网页、桌面、手机分别写菜单名，除了「桌面版没有 Scheduled 就改用网页版」这一条
  - 事件触发的任务需要 Work 与符合条件的付费账号，Work 本身是分批开放的，以账号里实际看到的为准
---

> 本文根据 OpenAI 帮助中心《Scheduled tasks in ChatGPT》整理，资料核对于 2026-10-27。功能和上限会变动，请以官方文章和你账号里实际显示的为准。配图为本站整理的示意图，不是界面截图。

## 适用于谁

- 以前在 ChatGPT 里设过「任务」，现在找不到入口的人；
- 设好的提醒、定时汇总没有按时出现的人；
- 想新建任务，却提示数量已满的人；
- 在桌面版里看不到任务页面的人。

## 结论先说

1. **官方页面名叫 Scheduled（计划任务）**，创建、查看和管理任务都在这里。官方文章的标题和正文仍然用「tasks」这个词，所以你找的「任务」，就是找 Scheduled。
2. **三个入口**：直接打开 Scheduled 页面；**设置 → Notifications（通知）**里点 **Manage tasks**；在某个对话里点更多选项（•••）选 **See scheduled tasks**。
3. **桌面版里看不到 Scheduled，就改用网页版**，这是官方给的做法。
4. **同时开启的任务有上限**：Free 和 Go 是 3 个，Plus 是 5 个，Business 和 Edu 是 10 个，Pro 和 Enterprise 是 15 个（2026-10 查询）。
5. **任务没跑，多半是被暂停了**：任务处于 inactive、需要你额外操作、创建任务的对话被归档或删除、数量达到上限、连接的应用授权过期，都是官方列出的原因。
6. **删除对话会暂停对应任务**，而在 Scheduled 里删除任务，不会删除它的对话，这两件事别搞混。

![找到 ChatGPT 任务的入口：Scheduled 页面、设置里的 Manage tasks、对话里的 See scheduled tasks、桌面版改用网页版](seed:g1121-tasks-entries.png)
*图：本站根据 [OpenAI 帮助中心：Scheduled tasks in ChatGPT](https://help.openai.com/en/articles/10291617-scheduled-tasks-in-chatgpt) 整理的示意图*

## 一、哪些套餐有任务

按官方文章：

- **定时任务（Scheduled tasks）**：符合条件的 Free、Go、Plus、Pro、Business、Enterprise、Edu 用户都可以用，具体还要看账号和工作区设置。ChatGPT for Healthcare 的符合条件的工作区也可以；
- **Free 用户的限制**：可以设一次性任务，或者「每天最多一次」的重复任务，时间用的是「早上、下午、晚上」这种灵活时间段。**每小时一次、指定精确时间，需要符合条件的付费套餐**；
- **事件触发的任务（Event-triggered）**：需要 **Work**，并且是符合条件的 Plus、Pro、Business、Enterprise 或 Edu 账号，不适用于 Free、Go，也不适用于 FedRAMP 工作区。创建时要先在 **设置 → Apps** 里连接 Gmail、Slack 或 GitHub，然后在 Work 里描述触发的事件。

所以：如果你是 Free，只是看不到每小时或精确时间的选项，这是官方限制，不是故障。Work 是什么、和聊天的区别见 [/guides/chatgpt-chat-vs-work-difference](/guides/chatgpt-chat-vs-work-difference)。想开通套餐，看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)，各套餐的区别见 [/guides/chatgpt-plans-comparison](/guides/chatgpt-plans-comparison)。

## 二、同时开启的任务上限

官方文章给的活跃任务（active tasks）数量：

| 套餐 | 同时开启的任务数 |
| --- | --- |
| Free、Go | 3 |
| Plus | 5 |
| Business、Edu | 10 |
| Pro、Enterprise | 15 |
| 其他符合条件的套餐 | 取决于账号或工作区 |

以上数字为 2026-10 查询，以官方文章为准。达到上限后，官方的办法是**暂停或删除一个任务，或者等某个任务跑完**。

## 三、任务不见了或没有运行：官方列的原因

官方文章里「任务可能缺失或被暂停」的原因有：

- 任务本身是 **inactive（未激活）**；
- 任务**需要额外操作**，例如需要你批准；
- 创建任务的**对话被归档或删除**；
- 已经**达到活跃任务数量上限**；
- 任务连接的应用**授权已失效**，去 Scheduled 看看，需要的话重新连接。

另外官方还提到一种情况：连接了财务账号到 ChatGPT Finances 后，可能会自动出现一个「Weekly finances update」任务。你不想要的话，可以在 Scheduled 里暂停或删除，或者在 **设置 → Notifications → Manage tasks** 里处理。

![任务不见了或被暂停时的原因与处理对照](seed:g1121-tasks-missing-decide.png)
*图：本站根据 [OpenAI 帮助中心：Scheduled tasks in ChatGPT](https://help.openai.com/en/articles/10291617-scheduled-tasks-in-chatgpt) 整理的示意图*

## 四、在 Scheduled 页面可以做什么

- 查看、暂停、恢复、编辑、删除任务；
- 要从对话里编辑或暂停：点任务标题，用弹出的任务面板；
- **在 Scheduled 里删除任务，不会删除它的对话**；**删除对话则会暂停对应的任务**；
- 任务**不支持语音对话、GPTs 和锁定的对话**。官方还说，要锁定某个对话，先把和它有关的任务（包括已暂停的）删掉；
- 在**项目**里创建的任务，**读不到该项目上传的文件**。

## 五、收不到通知

任务能运行，但你收不到提醒，要检查通知设置：

1. 打开 **设置 → Notifications**；
2. 选 **Push（推送）**、**Email（邮件）**或两个都选；
3. 浏览器通知：出现提示时选 **Allow（允许）**，浏览器再询问权限时也要同意；
4. 手机推送：先在支持的 ChatGPT 手机 App 里创建一个任务，并授权通知权限。

## 六、如果真的哪里都找不到

1. 先确认登录的是同一个账号，套餐和任务都是跟着账号走的，见 [/guides/chatgpt-account-sharing-multiple-devices](/guides/chatgpt-account-sharing-multiple-devices)；
2. 桌面版没有就用网页版，官方的建议；
3. 用法本身不熟，看 [/guides/chatgpt-scheduled-tasks](/guides/chatgpt-scheduled-tasks)；
4. 怀疑是服务故障，先看 [/guides/chatgpt-down-check-status-page](/guides/chatgpt-down-check-status-page)；
5. 仍然不行，联系官方客服，见 [/guides/chatgpt-contact-support](/guides/chatgpt-contact-support)。

## 常见问题

**Q：我记得是「Tasks」，现在怎么叫 Scheduled？**
官方文章没有写改名这回事，页面名叫 Scheduled，文章里仍然用 tasks 这个词。找的时候认准 Scheduled 就行。

**Q：任务多了之后新任务建不了？**
是同时开启的任务数量达到上限，暂停或删除一个，或等某个跑完。

**Q：删除了任务，对话会没吗？**
不会，官方说在 Scheduled 里删除任务不会删除其对话；但反过来，删除对话会暂停对应的任务。

**Q：Free 能不能设每小时一次的提醒？**
官方说每小时和精确时间需要符合条件的付费套餐，Free 只能用一次性任务或每天最多一次的灵活时间段。

## 参考资料

- OpenAI 帮助中心：Scheduled tasks in ChatGPT — https://help.openai.com/en/articles/10291617-scheduled-tasks-in-chatgpt
