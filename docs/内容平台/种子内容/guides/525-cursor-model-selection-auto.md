---
title: Cursor 模型选择：Auto、Grok、Composer、Claude、GPT 怎么选，模型不可用与自带 API Key
slug: cursor-model-selection-auto
products: [cursor]
models: []
accountTier: PLUS
excerpt: Cursor 模型怎么选？按官方文档讲清怎么切换模型、Auto 的三种优化模式、Cursor Models 与 Other Models 两个用量池、官方对各模型的定位、「模型不可用 / 不见了」的原因，以及自带 API Key 的规则与限制。
checkedOn: 2026-10-11
sources:
  - https://cursor.com/help/models-and-usage/available-models
  - https://cursor.com/docs/models-and-pricing
  - https://cursor.com/docs/cursor-router
  - https://cursor.com/help/models-and-usage/api-keys
  - https://cursor.com/help/models-and-usage/usage-limits
  - https://cursor.com/help/account-and-billing/pricing
verify:
  - 模型列表更新很快（官方模型页当天列出 Grok 4.7、Composer 2.5、Claude Opus 5.5、GPT-5.6 Sol、Gemini 3.1 Pro 等），以模型选择器里实际显示的为准
  - Cursor Router（Auto 的 Balance / Intelligence 模式）官方写明目前只在 Teams 和 Enterprise 提供，个人档「几个月后」跟进，具体时间未公布
---

> 本文根据 Cursor 官方帮助中心《Available models》和文档《Models & Pricing》《Cursor Router》整理，资料核对于 2026-10-11。模型名单和单价变化频繁，文中的定位描述是官方当天的说法。

## 适用于谁

- 打开模型下拉看到一长串名字，不知道日常该选哪个的人；
- 搜「cursor 模型选择」「cursor 模型不可用」「cursor 模型不见了」「cursor 模型计费」的人；
- 想在 Cursor 里用自己的 API Key 的人。

## 结论先说

1. **切换方式**：点聊天 / Agent 面板里的模型选择器，或按 `Ctrl+/`（macOS `Cmd+/`）在模型间轮换；选择会一直保留到你再次修改。
2. **两个用量池**决定了成本：**Cursor Models**（Grok 4.7 / 4.6 / 4.5 和 Composer 2.5，套餐里给的量明显更多）和 **Other Models**（Claude、GPT、Gemini 等第三方模型，按模型的 API 价计）。
3. 不想操心就用 **Auto**；日常交互式写代码用 **Composer**（快、便宜）；最难、最长的任务用 **Grok 4.7** 或 Claude Opus、GPT-5.6 Sol。
4. 模型「不见了」多半是**地区限制**（模型提供方定的，不是 Cursor）或者**被默认隐藏**；免费档能选的模型本来就少。
5. 可以填自己的 API Key，但**只对聊天模型有效**，Tab 补全仍用 Cursor 自带模型，而且自带 Key 时不适用 Cursor 的零数据保留政策。

## 官方对各模型的定位

| 选项 | 官方说法 | 走哪个用量池 |
| --- | --- | --- |
| Auto | 在智能、成本、可靠性之间自动平衡，适合日常任务 | 按实际路由到的模型计 |
| Grok 4.7 | Cursor 的旗舰模型，面向最难、运行时间最长的任务 | Cursor Models |
| Composer 2.5 | Cursor 自家的快速、低成本模型，能应付大多数任务，为交互式编码而做 | Cursor Models |
| Claude Opus / GPT-5.6 Sol | 擅长复杂的多步骤任务 | Other Models |
| Gemini Pro 系列 | 「也有用户偏好」 | Other Models |

官方没有给出「哪个模型写代码最强」的排名，本文也不做这种比较。一个可操作的思路是：**默认用 Cursor Models 池里的模型干日常活，遇到它搞不定的任务再临时切到第三方旗舰模型**——这样两个池子都不容易见底。

## Auto 到底在做什么

Auto 背后是 **Cursor Router**：不是每个请求都需要最强的模型，路由器把简单请求发给快而省的模型，复杂的发给能力最强的。它有三种优化模式（在模型选择器里选 Auto 后，在 Optimize For 下挑）：

- **Cost**：沿用旧版 Auto 的逻辑，优先省 token；
- **Balance**：在智能、速度、成本之间平衡；
- **Intelligence**：把更难的任务路由到最强的模型，同时比一直用单个旗舰模型便宜。

Balance 和 Intelligence 消耗额度比 Cost 快。要注意两点：

- **计费**：所有 Auto 模式都按「实际路由到的那个模型」的标价计费，路由到第三方模型就从 Other Models 池里扣。Auto 不等于免费。
- **适用范围**：官方写明 Cursor Router 目前只在 Teams 和 Enterprise 提供，个人档（Hobby / Pro / Pro Plus / Ultra）要晚几个月。默认情况下具体路由到哪个模型是隐藏的，团队管理员可以改为显示。

## 模型不可用、不见了

- **地区限制**：有些模型在某些地区不提供，这是模型提供方的限制。这时它们干脆不会出现在列表里。官方给的办法是用 Auto（所有地区可用，会自动选一个可用的模型），或者换一家提供方的模型。
- **默认隐藏**：官方模型表里很多旧型号标着 Hidden by default，需要到 Cursor Settings → Models 里手动打开。
- **套餐限制**：Hobby 免费档只能用较少的一组模型，付费档解锁全部。
- **团队屏蔽**：公司账号下，管理员可以在后台禁用某些模型。

## 自带 API Key（BYOK）

1. 打开 **Cursor Settings → Models**；
2. 找到提供方（OpenAI、Anthropic、Google、Azure、AWS Bedrock）；
3. 粘贴 Key，点 **Save**。

官方列出的规则：

- 自带 Key **只用于聊天模型**，Tab 补全继续用 Cursor 内置模型；
- 个人档下，这些请求由提供方直接向你收费，**不占用套餐里的两个用量池**；Teams / Enterprise 下仍会收每百万 token 0.25 美元的 Cursor Token Rate；
- **零数据保留（ZDR）不适用**于自带 Key 的请求，数据怎么处理按提供方的隐私政策；
- Key 不存在 Cursor 服务器上，但每次请求都会经加密连接发到 Cursor 后端（所有请求都要经过那里组装最终提示词），请求结束后不保留；
- Key 无效或被提供方拒绝时，该提供方的模型请求会一直失败，直到你更新或删除 Key；如果提供方本身不服务你所在的地区，自带 Key 也可能失败。

API Key 属于高敏感凭据，只在 Cursor 自己的设置页里填，不要贴进聊天框或写进项目文件。

## 常见问题

**Q：我现在用的是哪个模型？**
看聊天面板顶部的模型选择器。选了 Auto 时，每一轮的实际模型可能不同，且默认不显示。

**Q：子代理（subagent）用什么模型？**
内置子代理（Explore、Bash、Browser）按子任务自动选；自定义子代理默认继承父 Agent 的模型，也可以在它的 frontmatter 里用 `model` 字段指定。注意官方的提醒：子代理可能跑一个指定的第三方模型，这部分会从 Other Models 池里按标价扣。

**Q：Max Mode 去哪了？**
官方说明 Max Mode 只存在于旧的「按请求次数」套餐；现在的按用量计费套餐没有这个开关。

**Q：选哪个模型更省额度？**
见[《Cursor 额度与套餐》](/guides/cursor-usage-limits-plans)。

## 参考资料

- Available models（官方帮助中心）：https://cursor.com/help/models-and-usage/available-models
- Models & Pricing（官方）：https://cursor.com/docs/models-and-pricing
- Cursor Router（官方）：https://cursor.com/docs/cursor-router
- Bring your own API key（官方帮助中心）：https://cursor.com/help/models-and-usage/api-keys
- Usage and limits（官方帮助中心）：https://cursor.com/help/models-and-usage/usage-limits
