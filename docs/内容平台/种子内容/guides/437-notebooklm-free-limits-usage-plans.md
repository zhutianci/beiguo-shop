---
title: NotebookLM 免费版限制有哪些：笔记本和来源上限、5 小时用量限额与用量查询
slug: notebooklm-free-limits-usage-plans
products: [gemini]
models: [gemini-llm]
accountTier: FREE
excerpt: NotebookLM（现名 Gemini Notebook）免费版每天能用多少？2026 年 9 月起个人账号改为按算力计的用量限额。本文按官方帮助讲清免费与各付费档的笔记本数、来源数、限额倍数、刷新规则、用量查询和「稍后生成」。
checkedOn: 2026-10-10
sources:
  - https://support.google.com/notebooklm/answer/17670842?hl=en
  - https://support.google.com/notebooklm/answer/17670842?hl=zh-Hans
  - https://support.google.com/notebooklm/answer/16213268?hl=en
  - https://support.google.com/notebooklm/answer/16337734?hl=en
  - https://support.google.com/notebooklm/answer/16215270?hl=en
  - https://support.google.com/notebooklm/answer/16269187?hl=en
  - https://blog.google/innovation-and-ai/products/gemini-notebook/new-flexible-usage-limits/
verify:
  - 个人账号的「标准限额」到底相当于多少次对话、多少个音频或视频，官方没有公开具体数字，只给了倍数关系和「每 5 小时刷新、直到每周上限」的规则
  - 每周上限的具体数值和每周从哪一天开始计算，官方未说明
  - 单位 / 学校账号：Workspace 帮助页在核对日仍按「每天次数」列表（如标准档对话 50 次 / 天），官方博客只说新的算力限额面向个人账号推出；Workspace 账号是否也会改，以官方通知为准
  - AI Ultra 的来源上限：个人方案表写 500（20 TB）/ 600（30 TB），Workspace 表「Expanded」档写 400，两表不同
  - 方案页写「如果你的方案按每日配额，24 小时后重置；按月配额，30 天后重置」，没有说明哪些方案属于哪一种
  - 价格本文不写，以 Google 官方订阅页面为准
---

> 本文根据 Google 官方 Gemini Notebook（原 NotebookLM）帮助中心和 Google 官方博客整理，核对日期 2026-10-10。官方在表格上标注「限额可能调整」，一切以帮助中心和你账号里显示的为准。本文不涉及价格。

## 适用于谁

- 搜「notebooklm 免费版限制」「notebooklm 每天限制」「notebooklm 限制次数」，想知道免费够不够用的人；
- 看到「已达到用量限额」的提示，想知道什么时候恢复的人；
- 在网上看到「每天 50 次对话、3 个音频」之类的旧说法，想核对现在还准不准的人。

## 结论先说

1. **个人账号不再按「每天几次」算**：从 2026 年 9 月 2 日起，Gemini Notebook 改为**按算力计的用量限额**，提示越复杂、对话越长、来源越多、用的功能越重，消耗越多。
2. **刷新规则**：限额**每 5 小时刷新一次，直到用完每周上限**。
3. **各档是倍数关系**：无订阅是标准限额；AI Plus 是 2 倍；AI Pro 是 4 倍；AI Ultra 是 AI Pro 的 5 倍或 20 倍（视订阅而定）。官方没有公布标准限额对应的具体次数。
4. **数量类上限仍然是固定数字**：免费账号最多 100 个笔记本、每个笔记本 50 个来源。
5. **在「设置 → 用量」里能查**；用量不够时网页版可以选「稍后生成」。

## 一、固定上限：笔记本数和来源数

帮助中心「方案」页的表格（标注「可能调整」）：

| 项目 | 标准（无订阅） | AI Plus | AI Pro | AI Ultra（20 TB） | AI Ultra（30 TB） |
| --- | --- | --- | --- | --- | --- |
| 笔记本数（每个用户） | 100 | 200 | 500 | 500 | 500 |
| 来源数（每个笔记本） | 50 | 100 | 300 | 500 | 600 |
| Gemini 模型 | 可使用 | 可使用 | 更高的使用权限 | 最高 | 最高 |
| 新功能抢先体验 | 标准 | 较早 | 优先 | 优先 | 优先 |
| 可见水印可移除 | 否 | 否 | 是* | 是* | 是* |

\* 官方注明：居住在印度、韩国或越南的用户会自动加上可见水印。

另外：

- **单个来源**最多 50 万词，上传文件最大 200 MB，没有页数限制；
- 「自定义对话」和「使用分析」对所有人开放，「高级分享」面向付费用户；
- **分享不改变上限**：把笔记本分享给别人，对方的来源上限还是按他自己的档位算；
- 第一次添加来源时系统自动生成的报告、抽认卡、信息图、演示文稿、音频或视频概览，只生成一次，**不计入限额**。

来源类型和添加失败的原因，见本站《NotebookLM 来源上限是多少》。

## 二、用量限额：现在怎么算

帮助中心的说法是：用量限额决定你能和各项功能互动多少，它综合考虑**提示的复杂程度、使用的模型和功能、对话长度以及具体功能**。Google 官方博客（2026-08-28）补充说，来源的数量也是影响因素之一，并解释了这样改的原因：限额每 5 小时刷新而不是每天刷新，一天之内可以持续工作，也让你自己决定把额度花在哪种功能上。

| 方案 | 用量限额（帮助中心） |
| --- | --- |
| 无订阅 | 标准限额 |
| Google AI Plus | 标准限额的 2 倍 |
| Google AI Pro | 标准限额的 4 倍 |
| Google AI Ultra | AI Pro 的 5 倍或 20 倍，取决于订阅方案 |

- **刷新**：达到限额后可以等一等，配额每 5 小时刷新一次，直到触及每周上限；
- **推出时间**：官方博客写明从 2026 年 9 月 2 日起，在网页和手机端向**个人账号**推出；
- **功能不变**：官方强调原有功能都还在，变的是计量方式。

这意味着网上流传的「免费版每天多少次对话、几个音频概览」这类固定次数，已经不适用于个人账号。

## 三、怎么查自己还剩多少

1. 打开 Gemini Notebook；
2. 点右上角「设置（Settings）→ 用量（Usage）」，可以查看 AI 用量和每周上限。

另外两个会显示用量的地方：

- **对话底部**：快用完时会出现提示，例如「你即将达到 AI 用量限额，限额将于下午 3:00 重置」；用完后是「已达到限额，所有功能在下午 3:00 后恢复」；
- **Studio 生成时**：面板底部会显示这次生成**预计消耗的用量**，进度条填得越满，预计消耗越高。可以据此决定要不要换一种成品——官方博客说，当首选的成品超出限额时，笔记本还会建议替代的输出形式。

## 四、用完了怎么办

**等刷新**：对话底部的提示会告诉你几点重置。

**稍后生成（Generate later）**——目前只在网页版提供：

1. 打开 Gemini Notebook；
2. 在 Studio 面板选择要生成的成品；
3. 点底部的「稍后生成」。

官方说明稍后生成可能需要几个小时，如果开启了通知，完成时会提醒你。适合视频概览、演示文稿这类不急着要的成品。

**升级方案**：在对话或 Studio 生成界面点「升级（Upgrade）」，按提示操作。升级后头像旁边会出现对应的徽标，可以据此确认升级是否生效。价格以 Google 官方订阅页面为准。

**省着用的思路**（以下是根据官方公布的计量因素做的推断，不是官方给出的建议）：

- 只勾选和问题相关的来源，而不是每次都带上全部来源；
- 一个话题聊得很长之后，换个新话题前可以清空对话记录重新开始；
- 生成前先看 Studio 底部的预计用量，音频、视频、演示文稿想清楚提示再点，减少返工。

## 五、单位和学校账号：仍按档位列出每日次数

Workspace 帮助页在核对日仍然用「每天次数」的方式列出各档上限（同样标注可能调整）。各档对应的版本大致是：标准档（Business Starter、教育版 Fundamentals 等）、更多档（Education Plus 等）、更高档（Business Standard / Plus、Enterprise Standard / Plus 等）、扩展档（AI Expanded Access 附加项）、最高档（AI Ultra Access 附加项），完整对应关系见官方页面。

| 项目 | 标准 | 更多 | 更高 | 扩展 | 最高 |
| --- | --- | --- | --- | --- | --- |
| 笔记本 / 用户 | 100 | 200 | 500 | 500 | 500 |
| 来源 / 笔记本 | 50 | 100 | 300 | 400 | 600 |
| 对话 / 天 | 50 | 200 | 500 | 1000 | 5000 |
| 音频概览 / 天 | 3 | 6 | 20 | 40 | 200 |
| 视频概览 / 天 | 3 | 6 | 20（电影效果 2） | 40（电影效果 4） | 200（电影效果 20） |
| 报告、抽认卡、测验、思维导图（各自）/ 天 | 10 | 20 | 100 | 200 | 1000 |
| Deep Research | 10 / 月 | 3 / 天 | 20 / 天 | 30 / 天 | 200 / 天 |
| 数据表格、信息图、演示文稿及修改 | 有限 | 更多 | 更高 | 扩展 | 最高 |

这张表只适用于单位或学校的 Google 账号。想确认自己是否有更高档位，官方的办法是：在网页版登录后看头像旁是否有 Pro、Plus、Expanded 或 Ultra 徽标。需要更高上限时，要由管理员升级组织的许可。

## 常见问题

**Q：免费版每天到底能问多少次？**
官方没有给个人账号公布具体次数。能确定的只有：按算力计量、每 5 小时刷新、有每周上限、付费档是 2 倍 / 4 倍 / 更高。实际剩余量以「设置 → 用量」为准。

**Q：5 小时刷新后就又满了吗？**
帮助中心的原话是「每 5 小时刷新，直到达到每周上限」。也就是说，一周内累计用到每周上限后，要等每周额度恢复。

**Q：和 Gemini 应用的额度是一回事吗？**
两者的规则描述很像（都是按算力、5 小时刷新、每周上限），但它们是两篇不同的官方说明；Gemini 应用的情况见本站《Gemini 使用技巧：Gems 改为 Skills、Deep Research 与上传文件怎么用》。两边额度是否互通，官方帮助没有写。

**Q：分享给朋友的笔记本，他用的是谁的额度？**
官方明确的只有来源上限：分享不改变任何协作者的来源上限。

**Q：为什么上传失败，是到上限了吗？**
先看来源数是否已满（免费 50 个，失效的云端硬盘来源也占名额），再看单个文件是否超过 50 万词或 200 MB，或 PDF 是否带复制保护。

## 参考资料

- Manage your Gemini Notebook usage limits（帮助中心）：https://support.google.com/notebooklm/answer/17670842?hl=en
- 管理 Gemini Notebook 用量限额（帮助中心简体中文版，含生效日期）：https://support.google.com/notebooklm/answer/17670842?hl=zh-Hans
- Learn about Gemini Notebook's plans（帮助中心）：https://support.google.com/notebooklm/answer/16213268?hl=en
- Use Gemini Notebook with a work or school Google account（帮助中心）：https://support.google.com/notebooklm/answer/16337734?hl=en
- Add or discover new sources for your notebook（帮助中心）：https://support.google.com/notebooklm/answer/16215270?hl=en
- Frequently asked questions（帮助中心）：https://support.google.com/notebooklm/answer/16269187?hl=en
- Google 官方博客：We're introducing flexible usage limits for Gemini Notebook（2026-08-28）：https://blog.google/innovation-and-ai/products/gemini-notebook/new-flexible-usage-limits/
