---
title: Claude 使用限制与额度：用量怎么看、什么时候重置（Free / Pro / Max / Claude Code）
slug: claude-usage-limits
products: [claude]
models: []
accountTier: PLUS
excerpt: Claude 的「5 小时会话额度」和「每周额度」分别怎么算、在哪里看、什么时候重置？Free、Pro、Max 有什么区别，Claude Code 提示额度用完时该怎么办，一篇讲清。
checkedOn: 2026-10-07
sources:
  - https://support.claude.com/en/articles/11647753-how-do-usage-and-length-limits-work
  - https://support.claude.com/en/articles/8325606-what-is-the-pro-plan
  - https://support.claude.com/en/articles/11049741-what-is-the-max-plan
  - https://support.claude.com/en/articles/8114491-getting-started-with-claude
  - https://support.claude.com/en/articles/9797557-usage-limit-best-practices
  - https://support.claude.com/en/articles/17007452-what-is-a-limit-reset
  - https://support.claude.com/en/articles/12429409-manage-usage-credits-for-paid-claude-plans
  - https://support.claude.com/en/articles/14246112-buy-usage-bundles
  - https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan
  - https://support.claude.com/en/articles/15424964-claude-fable-models-on-your-plan
  - https://claude.com/pricing
  - https://code.claude.com/docs/en/costs
  - https://code.claude.com/docs/en/errors
  - https://code.claude.com/docs/en/interactive-mode
  - https://code.claude.com/docs/en/statusline
  - https://tldv.io/blog/claude-usage/
  - https://atlas.utdallas.edu/TDClient/30/Portal/KB/ArticleDet?ID=1597
verify:
  - Free 账号的设置页是否也显示用量进度条：帮助中心只写了 Pro / Max / Team / 按席位 Enterprise 可在「设置 → 用量」看进度条，Free 只说「到上限时会通知」
  - Free 是否有每周上限：官方 Free 说明只写了「5 小时会话额度」和「可能另有其他限制」，未写每周上限
  - 各套餐每 5 小时 / 每周具体能发多少条消息：官方未公开具体数字
  - 支持文章《Use Claude Code with your Pro or Max plan》仍写「用 /status 查看剩余额度」，Claude Code 文档写的是 /usage，以当前版本为准
---

> 本文根据 Anthropic 官方帮助中心、定价页和 Claude Code 官方文档整理，核对日期 2026-10-07；截图引用自公开发布的教程和高校 IT 帮助文档，并在图下注明出处。额度规则调整较频繁，以 Claude 设置页和帮助中心为准。

## 适用于谁

- 搜「claude 使用限制」「claude 额度重置时间」，想知道自己还剩多少、什么时候能继续用的人；
- 用 Free 或 Pro，经常看到「已达到使用上限」提示，在犹豫要不要升级的人；
- 同时用 claude.ai 网页 / App 和 Claude Code，搞不清两边额度是不是一起算的人。

## 结论先说

1. **两层限制**：所有套餐都有「5 小时会话额度」；Pro、Max 另外还有一个**跨所有模型的每周额度**。
2. **在哪看**：网页版或桌面版 Claude 的「设置（Settings）→ 用量（Usage）」；Claude Code 里输入 `/usage`。
3. **什么时候重置**：会话额度每 5 小时重置；每周额度在**系统给你账号分配的固定星期几、固定时间**重置，不随你的订阅日期或首次使用时间变化，具体时间在「设置 → 用量」里显示。
4. **一份额度，多处共用**：claude.ai、桌面 App、手机 App、Claude Code（含 IDE 插件）都从同一份额度里扣。
5. **官方没有公布「每 5 小时能发多少条」的固定数字**：消息越长、附件越大、对话越长、用的模型和功能越重，消耗越快。

## 各套餐的额度规则

| 套餐 | 5 小时会话额度 | 每周额度 | 官方说明要点 |
| --- | --- | --- | --- |
| Free | 有，每 5 小时重置 | 官方未写明 | 可发消息数随需求变化，可能另有其他限制 |
| Pro | 有，比 Free 多 | 有，跨所有模型 | 包含 Claude Code |
| Max 5x | 每次会话为 Pro 的 5 倍 | 有，跨所有模型 | 新功能和新模型优先 |
| Max 20x | 每次会话为 Pro 的 20 倍 | 有，跨所有模型 | 同上 |

另外几条官方写明的规则：

- 帮助中心在 Pro 和 Max 的说明里都写了：为保证公平，官方可能还会用其他方式限制用量，例如每周或每月上限、按模型或功能限制。
- **Fable 模型**：Max 套餐最多可以把每周额度的 50% 用在 Fable 5 / Fable 5.1 上（是「最多用一半」，不是「额外多给一半」）；Pro 套餐的 Fable 不计入套餐额度，只能用按量付费的「用量积分（usage credits）」使用。Free 不能用 Fable，定价页显示 Free 也不含 Opus。
- 影响消耗的因素（官方列出的）：消息长度、附件大小、当前对话长度、工具使用（Research、联网搜索等）、模型选择、思考强度（effort）、生成和使用 Artifacts、运行代码 / 创建文件 / 浏览网页这类多步骤任务。

## 步骤一：在网页版查看用量

1. 打开网页版或桌面版 Claude，进入「设置 → 用量」（Settings → Usage）。手机 App 上部分操作（比如下面说的免费重置）不可用，建议用电脑查看。
2. 顶部「套餐用量限制（Plan usage limits）」里有两条进度条：
   - **当前会话（Current session）**：这 5 小时窗口已经用了多少、还剩多久重置；还没开始时会显示「发送第一条消息后开始计时」。
   - **每周额度（Weekly limits / This week）**：本周用了百分之多少、什么时候重置；套餐包含 Fable 时会单独显示 Fable 那一条。

![「设置 → 用量」里的当前会话和本周用量进度条（英文界面）](seed:g18-usage-bars.png)
*图片来源：[tl;dv 博客](https://tldv.io/blog/claude-usage/)*

![设置窗口左侧选中「用量（Usage）」后的完整页面，右侧是会话和每周额度（深色模式，截图来自企业版账号，个人套餐的条目会略有不同）](seed:g18-settings-usage.png)
*图片来源：[德州大学达拉斯分校 IT 帮助文档](https://atlas.utdallas.edu/TDClient/30/Portal/KB/ArticleDet?ID=1597)*

3. 往下还能看到**本周按产品划分的用量**（Claude Code、聊天、Cowork 等各占多少），方便判断是哪一块用得最多。

![「本周按产品划分的用量」：Claude Code、聊天（Chats）、Cowork、其他各占的比例](seed:g18-usage-by-product.png)
*图片来源：[tl;dv 博客](https://tldv.io/blog/claude-usage/)*

## 步骤二：在 Claude Code 里查看用量

- 输入 `/usage`（`/cost`、`/stats` 是它的别名）。用 Pro / Max 订阅登录时，会显示套餐用量进度条、活动统计，以及**哪些技能、子代理、插件、MCP 服务器占了多少用量**，按 `d` / `w` 切换最近 24 小时和最近 7 天。这部分细分是根据本机会话记录估算的，不包含其他设备和网页版的用量。
- 官方文档特别说明：`/usage` 顶部的「Session」美元金额是给 API 用户看的估算值，订阅用户的用量已包含在套餐里，这个金额与扣费无关。
- 想一直看到剩余额度：可以自定义状态栏，读取 `rate_limits.five_hour` 和 `rate_limits.seven_day` 两个字段（已用百分比和重置时间，只对 Pro / Max 订阅显示）；桌面 App 的 Code 标签页可以点模型选择器旁的用量圆环查看。
- 快用完时，Claude Code 会提示类似「You've used 85% of your session limit · resets 3:45pm」。

## 步骤三：额度用完了怎么办

**网页版 / App：**

1. **等重置**：会话额度到点自动恢复；每周额度要等到「设置 → 用量」里显示的重置时间。
2. **用免费重置（如果有）**：官方会不定期给符合条件的套餐发放「额度重置（limit reset）」。在网页版或桌面版的「设置 → 用量」→「重置（Resets）」里点「Reset for free」，会话额度或每周额度会立刻回满；达到上限的提示上也会出现同一个按钮。用了不能撤销，未使用的会在标注的日期过期，手机 App 和 Claude Code 里暂时没有这个按钮。
3. **开启用量积分**：Pro / Max 用户在「设置 → 用量 → 用量积分（Usage credits）」开启后，超出套餐的部分按标准 API 价格另外计费，可以设置每月消费上限；官方还提供预购套餐包，最高约 7 折（Pro / Max 每月可买的折扣包有上限）。通过手机 App 订阅的，只能在网页版开启。
4. **升级套餐**：Pro 经常不够用可以考虑 Max 5x，Max 5x 不够再考虑 Max 20x。在本站开通或升级可前往 [/chongzhi/claude-pro](/chongzhi/claude-pro)。

![「设置 → 用量」底部的用量积分开关和「购买更多用量」入口](seed:g18-usage-credits.png)
*图片来源：[tl;dv 博客](https://tldv.io/blog/claude-usage/)*

**Claude Code 里：**

- 看到 `You've hit your session limit · resets 3:45pm` 或 `You've hit your weekly limit · resets Mon 12:00am`：会话和每周额度是**所有模型共用**的，切换模型也没用，只能等、用积分或升级。
- 看到 `You've hit your Opus limit` 或 `You've hit your Sonnet limit`：这是单个模型系列的额度，用 `/model` 换到别的系列可以继续工作。
- v2.1.234 及以后的版本，交互会话里额度用完时，Claude Code 会**保持会话等待，重置后自动接着干**，按 `Esc` 可取消；`/rate-limit-options` 可以选择等待、加积分或升级。
- 注意：如果系统里设置了 `ANTHROPIC_API_KEY` 环境变量，Claude Code 会优先用 API Key 计费，而不是你的订阅额度。

## 让额度更耐用的几个习惯

- **新任务开新对话**：长对话每一轮都会把前文重新带上，越聊越费。Claude Code 里切换任务时用 `/clear`，同一任务太长用 `/compact`。
- **把常用资料放进项目（Projects）**：项目里的内容会被缓存，重复引用时计入额度更少；但长时间不用后缓存会过期，第一次重新引用时按全量计算。
- **一次把需求说清楚**：多个相关问题合并到一条消息里，减少来回追问。
- **按需选模型和思考强度**：日常任务用 Sonnet、低一档的 effort；不需要深度推理时关掉扩展思考；不需要联网时不要开搜索和多余的连接器。
- **Claude Code 里指路径而不是粘贴整个文件**，并保持 CLAUDE.md 简短（官方建议 200 行以内）。

## 常见问题

**Q：每周额度是从我订阅那天开始算吗？**
不是。官方说明每周额度在分配给账号的固定星期几、固定时间重置，和订阅开始日期、首次使用时间都无关，每个周期都会给满一整周的额度。具体时间看「设置 → 用量」。

**Q：会话额度是不是每天固定几点重置？**
不是固定钟点。会话按 5 小时窗口计算，进度条下方会显示还剩多久重置；没有开始使用时会显示「发送第一条消息后开始」。

**Q：网页上聊天和 Claude Code 是分开算的吗？**
不是。官方明确写了 claude.ai、Claude Code、桌面 App 的使用都计入同一份额度，IDE 插件里的 Claude Code 也一样。

**Q：Free 每 5 小时能发几条？Pro 呢？**
官方没有公布具体条数，只说明会随消息长度、附件、对话长度、模型和功能变化，Free 还会随整体需求变化。Max 5x / 20x 的倍数是相对 Pro 的「每次会话额度」而言的。

## 参考资料

- 用量限制与长度限制的区别（官方）：https://support.claude.com/en/articles/11647753-how-do-usage-and-length-limits-work
- Pro 套餐说明（官方）：https://support.claude.com/en/articles/8325606-what-is-the-pro-plan
- Max 套餐说明（官方）：https://support.claude.com/en/articles/11049741-what-is-the-max-plan
- Free 版使用说明（官方）：https://support.claude.com/en/articles/8114491-getting-started-with-claude
- 用量最佳实践与「设置 → 用量」说明（官方）：https://support.claude.com/en/articles/9797557-usage-limit-best-practices
- 额度重置（官方）：https://support.claude.com/en/articles/17007452-what-is-a-limit-reset
- 用量积分与套餐包（官方）：https://support.claude.com/en/articles/12429409-manage-usage-credits-for-paid-claude-plans 、https://support.claude.com/en/articles/14246112-buy-usage-bundles
- Fable 模型在各套餐的用法（官方）：https://support.claude.com/en/articles/15424964-claude-fable-models-on-your-plan
- Claude Code 用量与报错说明（官方）：https://code.claude.com/docs/en/costs 、https://code.claude.com/docs/en/errors
- 套餐对比（官方）：https://claude.com/pricing
- 截图来源：tl;dv《Claude usage》、UT Dallas IT《How to Check Your Claude Usage》
