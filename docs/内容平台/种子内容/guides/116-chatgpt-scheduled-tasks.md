---
title: ChatGPT 定时任务怎么设置：每天自动提醒、汇总、监控变化与事件触发
slug: chatgpt-scheduled-tasks
products: [chatgpt]
models: []
accountTier: PLUS
excerpt: ChatGPT 的定时任务（Scheduled tasks）可以按时提醒、每天推送简报、监控网页或邮箱变化，Plus 起还能由 Gmail、Slack、GitHub 事件触发。本文按官方帮助中心讲清怎么创建、各套餐能建几个、多久能跑一次、通知怎么开、怎么分享。
checkedOn: 2026-10-07
sources:
  - https://help.openai.com/en/articles/10291617-scheduled-tasks-in-chatgpt
  - https://help.openai.com/en/articles/7925741-sharing-conversations-and-scheduled-tasks-in-chatgpt
  - https://help.openai.com/en/articles/11487775-connected-apps-in-chatgpt
  - https://help.openai.com/en/articles/6825453-chatgpt-release-notes
verify:
  - 帮助文章里连接应用的入口有的写「Settings > Apps」，有的写「Settings > Plugins」，以实际界面为准
  - 桌面 App 是否显示「Scheduled」页面取决于版本，官方建议看不到时用网页版
---

> 本文根据 OpenAI 帮助中心《Scheduled tasks in ChatGPT》《Sharing conversations and scheduled tasks》和发布说明整理，资料核对于 2026-10-07；截图引用自 OpenAI 帮助中心，为英文界面。

## 适用于谁

- 想让 ChatGPT 每天早上推送新闻简报、每周一汇总行业动态的人；
- 想让它盯着某件事（快递到没到、某网页有没有更新）、有变化再通知的人；
- 想在收到某类邮件、Slack 消息或 GitHub PR 时自动处理的人。

## 结论先说

1. **怎么建**：最简单的是直接对 ChatGPT 说「每天早上 8 点给我……」「快递送到了告诉我」；也可以去侧边栏的 **Scheduled（定时）** 页面创建和管理。
2. **三种任务**：一次性 / 周期性的**定时任务**；有变化才通知的**监控任务**；由应用事件触发的**事件触发任务**（在 Work 里运行，仅 Plus 及以上）。
3. **数量上限（活跃任务）**：Free 和 Go 3 个、Plus 5 个、Business 和 Edu 10 个、Pro 和 Enterprise 15 个。
4. **频率**：Free 只能一次性或每天最多一次，而且只能选「上午 / 下午 / 晚上」这种宽泛时段；付费套餐最快每小时一次，可以指定准确时间。
5. **别忘了开通知**：**Settings（设置）→ Notifications（通知）**，选推送、邮件或两者，否则任务跑完你可能不知道。

## 步骤

### 1. 创建一个任务

**方法一：在对话里说**

直接描述你要的动作和时间，比如：

```
每个工作日早上 8 点，给我一份不超过 300 字的科技新闻简报，重点关注 AI 和半导体，每条附来源链接。
```

```
帮我盯着这个网页 [网址]，价格降到 2000 元以下时通知我，降价后就停止监控。
```

ChatGPT 确认后，会在对话里显示一个任务标签，例如「Monitoring · 任务名」。

![对话中让 ChatGPT 扫描邮件、包裹送达时通知；ChatGPT 回复将每小时检查一次 Gmail，下方显示「Monitoring · Package Delivery Watch」任务标签（英文界面）](seed:g116-monitoring-task.png)
*图片来源：[OpenAI 帮助中心《Scheduled tasks in ChatGPT》](https://help.openai.com/en/articles/10291617-scheduled-tasks-in-chatgpt)*

**方法二：在 Scheduled 页面创建**

点侧边栏的 **Scheduled**，在「Schedule a task」输入框里描述任务，或者从下方的示例（每日简报、邮件监控、行业趋势）一键添加。

![Scheduled 页面：顶部是「Schedule a task」输入框，下方是 Daily brief、Email monitor、Industry trends 三个示例（英文界面）](seed:g116-scheduled-page.png)
*图片来源：[OpenAI 帮助中心《Scheduled tasks in ChatGPT》](https://help.openai.com/en/articles/10291617-scheduled-tasks-in-chatgpt)*

注意：在**项目里**创建的任务，不能访问项目里上传或存储的文件。

### 2. 打开通知

1. **Settings → Notifications**，在任务通知里选 **Push（推送）**、**Email（邮件）** 或两者；
2. 网页版如果浏览器禁止了通知，ChatGPT 会提示开启，点 **Allow**，再在浏览器弹窗里允许；
3. 想收手机推送，就在手机 App 里创建任务，并按提示授予通知权限。

### 3. 查看、修改、暂停、删除

- 打开 **Scheduled** 页面看全部任务、下次运行时间和结果；
- 也可以从 **Settings → Notifications → Manage tasks** 进入，或在对话的 **•••** 菜单里选 **See scheduled tasks**；
- 在对话里点任务标题会打开任务面板，可以改提示词、重复频率、结束时间，或暂停、删除。

![任务编辑面板：显示任务名、PROMPT（提示词）、Repeat（重复：Custom）、Until（结束：Never），右上角有更多、暂停、关闭按钮（英文界面）](seed:g116-task-edit-panel.png)
*图片来源：[OpenAI 帮助中心《Scheduled tasks in ChatGPT》](https://help.openai.com/en/articles/10291617-scheduled-tasks-in-chatgpt)*

## 事件触发任务（Plus 及以上）

2026 年 8 月起，Plus、Pro、Business、Enterprise、Edu 用户可以在 **Work** 里创建由应用事件触发的任务：

1. 在设置里连接 Gmail、Slack 或 GitHub 账号（连接方法见 [/guides/chatgpt-plugins-connected-apps](/guides/chatgpt-plugins-connected-apps)）；
2. 打开 **Work**，描述事件和要做的事，例如「收到客户发来的带『合同』字样的邮件时，帮我总结要点并起草回复」；
3. 检查 **Trigger（触发条件）**、**Condition（筛选条件）** 和 **Prompt（指令）**，完成授权；
4. 到 **Scheduled** 页面管理。

可用的事件：Gmail 新邮件（可按发件人或主题筛选）、Slack 频道新消息（需要把 **@ChatGPT** 加进被监控的频道）、已授权 GitHub 仓库的 PR 动态。所有事件触发任务合计每小时最多运行 30 次、每天 720 次。需要审批的操作（比如发消息）会让任务暂停，等你确认。Free 和 Go 不能创建这类任务。

## 分享任务

Free、Go、Plus、Pro 都可以分享任务：**Scheduled** → 任务的 **•••** → **Share** → **Copy link**。对方打开链接、登录后点 **Schedule task**，会在**他自己的账号**里生成一份独立副本，用他自己的应用连接和权限。

分享内容包括任务标题、完整指令、频率和原时区；**不包括**你的名字、聊天记录、之前的运行结果、记忆、自定义指令、文件和应用凭证。但指令是谁都能看到的，别在标题和指令里写健康、财务、密码等敏感信息。修改原任务后，要重新点一次 **Copy link** 才会更新分享内容。

## 常见问题

**Q：任务为什么自己暂停了？**
可能是长期不活跃、需要你补充操作（如审批），或者关联的对话被删了。去 **Scheduled** 恢复、修改或删除。删除对话会暂停任务；但在 Scheduled 里删任务不会删对话。

**Q：语音对话和 GPTs 里能建定时任务吗？**
不能，官方写明定时任务不支持语音聊天和 GPTs。

**Q：桌面 App 里找不到 Scheduled？**
取决于 App 版本和账号，看不到就用网页版。桌面 App 能显示已有的事件触发任务，但不能创建或修改触发条件。

**Q：和 Codex 的自动化有什么区别？**
定时任务在 ChatGPT 里跑，适合提醒、日报、监控；Codex 的自动化在 Codex 里运行，是另一套功能。

**Q：突然收到一个「Weekly finances update」任务？**
连接 ChatGPT Finances 的金融账户后可能会自动创建这个周报任务，不想要的话在 Scheduled 里暂停或删除即可。

## 参考资料

- OpenAI 帮助中心：Scheduled tasks in ChatGPT — https://help.openai.com/en/articles/10291617-scheduled-tasks-in-chatgpt
- OpenAI 帮助中心：Sharing conversations and scheduled tasks in ChatGPT — https://help.openai.com/en/articles/7925741-sharing-conversations-and-scheduled-tasks-in-chatgpt
- OpenAI 帮助中心：Connected apps in ChatGPT — https://help.openai.com/en/articles/11487775-connected-apps-in-chatgpt
- ChatGPT Release Notes（2026-06-17 Scheduled 页面、2026-08-25 事件触发与分享）— https://help.openai.com/en/articles/6825453-chatgpt-release-notes
