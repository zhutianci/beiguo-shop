---
title: Codex 额度与使用限制：Plus / Pro 能用多少、怎么查、什么时候重置、用完怎么办
slug: codex-usage-limits
products: [codex, chatgpt]
models: []
accountTier: PLUS
excerpt: Codex 额度怎么算？按 OpenAI 官方定价页（2026-10-07 版）讲清 Plus 每 5 小时大约能发多少条、Pro 有没有 5 小时限制、是否和 Work 共用、去哪查剩余额度与重置时间，以及用完后买 credits、即时重置怎么选。
checkedOn: 2026-10-07
sources:
  - https://learn.chatgpt.com/docs/pricing
  - https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan
  - https://help.openai.com/en/articles/20001516-managing-usage-with-gpt-6-astra-in-work-and-codex
  - https://help.openai.com/en/articles/20001507-paid-weekly-work-and-codex-rate-limit-resets
  - https://help.openai.com/en/articles/20001498-how-banked-codex-resets-work
  - https://help.openai.com/en/articles/12642688-using-credits-for-flexible-usage-in-chatgpt-personal-plans
  - https://help.openai.com/en/articles/9793128-about-chatgpt-pro-tiers
  - https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex
verify:
  - Plus 的 5 小时条数是官方给的估算区间，不是固定配额；每周上限官方没有公布具体数字
  - 「Buy an instant reset」（即时重置）的价格和可购买的国家官方未列出，以账号里显示为准
  - Settings → Usage 的中文界面名称（「设置 → 用量」）未在中文界面核实
  - Pro 200 老用户沿用旧额度到 2026-10-29，之后改为新额度，新额度具体数字官方未公开
---

> 本文根据 OpenAI 官方 Codex 定价页（learn.chatgpt.com/docs/pricing）和帮助中心多篇文章整理，资料核对于 2026-10-07。Codex 的额度规则 2026 年改了好几次，**数字只代表核对当天的官方说法**，请以你账号里的用量页面为准。

## 适用于谁

- 用 ChatGPT 账号登录 Codex（桌面 App、CLI、IDE 插件、云端），想知道「我这个套餐到底能用多少」的人；
- 刚收到「已达到使用上限」提示，想知道多久恢复、能不能马上继续的人；
- 在 Plus 和 Pro 之间犹豫，想先看清两者额度差别的人。

安装和第一个任务请先看 [Codex 入门教程](/guides/codex-getting-started)。

## 结论先说

1. **Codex 和 ChatGPT Work 共用一份额度**。官方定价页开头就写明 Work 用的是和 Codex 相同的定价、credits 和使用限制；在 Plus / Pro 上，ChatGPT for Excel、PowerPoint、Word 也从这份「智能体用量」里扣。
2. **额度不是固定条数**。消耗多少取决于模型、任务大小、上下文长度、推理强度、是否在云端跑、是否开 Fast 模式。
3. **Plus 有两个窗口**：每 5 小时一个窗口，另外可能还有每周上限；两个都还有余量才能继续用。**Pro（Pro 100 / 200 / 500）目前没有 5 小时限制**，但仍有套餐内额度。
4. **在哪查**：桌面 App 或网页的 **Settings → Usage**（设置 → 用量），或官方用量面板 chatgpt.com/codex/settings/usage；CLI 里输入 `/status`。
5. **用完怎么办**：正在跑的那一轮通常可以跑完；之后可以等重置、用账号里已有的重置次数、买 credits（Plus / Pro 可买，不用升级套餐）、买一次「即时重置」，或者升级套餐。**客服不会手动帮你重置额度**。

## 各套餐能用多少（官方 2026-10-07 版本）

### Plus 和 Business 标准席位：每 5 小时的估算

官方给的是「本地消息条数」的估算区间（每 5 小时）：

| 模型 | Plus | Business 标准席位 |
|---|---|---|
| GPT-6 Astra | 5–45 条 | 5–45 条 |
| GPT-6.1 Sol | 15–160 条 | 15–160 条 |
| GPT-6 Sol | 15–150 条 | 15–150 条 |
| GPT-6 Luna | 350–3,000 条 | 350–3,000 条 |

几点要看清：

- 这是**估算区间，不是保证条数**。小脚本、改个函数只用一点点；大项目、长任务、需要读很多上下文的会话，每条消耗会多得多。
- **云端任务通常比本地消息更耗额度**，本地和云端共用同一份额度。
- 区间之外**可能还有每周上限**，官方没有公布每周的具体数字。
- 5 小时窗口的计时方式：上一个窗口结束后，你在 Work 或 Codex 里发出第一条消息时，新窗口才开始。所以可能不到 5 小时就用完当前窗口，但每周额度还有剩余。

### Pro 100 / Pro 200 / Pro 500

- 三档 Pro **目前都没有 Work 和 Codex 的 5 小时限制**，但仍然有套餐内额度，剩余量和重置时间同样在 Settings → Usage 查看。
- 官方只说 Pro 200 比 Pro 100 额度多、Pro 500 最多，**没有公布具体数字**。
- 2026-09-29 起新订阅的 Pro 200 额度比以前低；如果你在 2026-09-22 到 09-29（太平洋时间上午 10 点）之间有过有效的 Pro 200 订阅，旧额度可以沿用到 **2026-10-29**。
- Astra 的 **Ultrafast** 只有 Pro 500 能用；Pro 100 / 200 即使买了 credits 也解锁不了。

各套餐价格请看官方定价页 https://chatgpt.com/pricing 。

### Free 和 Go

官方定价页对 Free 和 Go 的 Codex 描述是：在桌面 App 里使用 GPT-6 Luna（标准速度），**逐步开放**；Codex Cloud（云端任务）**不包含**在 Free 和 Go 里。具体额度官方未公开。少部分 Free / Go 用户可以购买 credits，但买 credits 不会改变套餐，也不会提高套餐内额度。

### Enterprise / Edu

开了灵活计费（flexible pricing）的 Enterprise / Edu 没有固定速率限制，按 credits 计；没开的，大部分功能的每席位限制和 Plus 相同。按美元 token 计费的企业合同另有规则，问你的工作区管理员。

## 哪些操作特别费额度

- **换更强的模型**：同一个任务，GPT-6 Astra 可能比 GPT-5.6 Sol 消耗更快。
- **Fast 模式**：相对同一模型的标准速度，消耗套餐内额度的速率是 **2.5 倍**；Astra Ultrafast 是 **8 倍**（用买来的 credits 时分别是 2 倍和 6 倍）。官方强调这是计费倍率，不代表速度提升的倍数。
- **在 Codex 里生成图片**：平均比不生成图片的同类回合快 3–5 倍消耗额度，视画质和尺寸而定（Free 不能生成图片）。
- **云端任务、长任务、子代理**：任务越长、步骤越多越费。
- **MCP 服务器开太多**：每个 MCP 服务器都会往消息里加上下文，不用的就关掉（配置方法见 [Codex 怎么配置 MCP](/guides/codex-mcp-config)）。

不占 Codex 额度的：用 ChatGPT 账号登录时的 **Auto-review 安全检查**是免费的；ChatGPT 里的生图次数、文件上传、语音（Chat Voice）有各自独立的限制，看到「过去一天 50 张图」这类提示与 Codex 无关。

## 步骤：查看剩余额度和重置时间

1. **桌面 App 或网页**：打开 **Settings → Usage**，看 5 小时和每周两个用量条、credits 余额和重置时间。达到上限时的横幅也会告诉你是哪一个额度用完了。
2. **用量面板**：直接打开 https://chatgpt.com/codex/settings/usage 。
3. **CLI**：在会话里输入 `/status`，能看到当前模型、审批设置和剩余额度；新版 CLI 也内置了用量统计。
4. 官方建议每一两周看一次用量面板，了解自己的消耗节奏；消耗偏高时，考虑换小一点的模型或缩小任务范围。

## 用完了怎么办：五个选项怎么选

| 选项 | 适合谁 | 要点 |
|---|---|---|
| 等待重置 | 不急的 | 看 Settings → Usage 显示的重置时间 |
| 使用已有的重置（banked reset） | 账号里显示「1 reset available」的 | 来自推荐好友等促销活动；使用后同时刷新 5 小时和每周窗口，**每周重置日会改到使用当天往后推**；过期作废 |
| 买 credits | Plus / Pro，偶尔超出的 | 套餐额度用完后才扣 credits；有效期 12 个月；一般不退款；不能转让 |
| 买一次即时重置（Buy an instant reset） | Plus / Pro 个人账号，急着继续的 | 付款成功**立即**恢复 5 小时和每周额度，不能存着以后用；下一个每周重置在你重置后第一条请求的 7 天后；一般不退款；是否可买因账号和账单国家而异 |
| 升级套餐 | 长期不够用的 | Pro 没有 5 小时限制 |

另外，任何人都可以改用 API Key 登录跑本地会话，按标准 API 价格另行计费（不走 ChatGPT 套餐额度，也没有云端功能）。

想先开通 Plus 体验 Codex，可以看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

### 让额度更耐用的几个习惯

- 提示写准确，删掉无关上下文；只给相关文件。
- 先用较低的推理强度试，结果不够再调高。官方举例：**Astra 用 Low 强度可能比 Sol 用 High 效果更好**，习惯用 Sol High 的可以试试 Astra Low / Medium。
- 大项目把 `AGENTS.md` 拆成分目录的小文件，减少每次注入的上下文（写法见 [AGENTS.md 教程](/guides/claude-md-agents-md)）。
- 大任务开始前先看一眼剩余额度。

## 常见问题

**Q：额度用完时 Codex 正在干活，会被直接打断吗？**
官方说法是：在一轮进行中达到上限，Codex 可以把这一轮做完（受公平使用限制），之后再按横幅提示选择继续方式。

**Q：可以找客服重置额度吗？**
不行。官方明确写了客服不重置 ChatGPT 或 Codex 的额度。如果你认为额度算错了、或过了重置时间还没恢复，可以带上截图、客户端、模型、时间和时区联系客服调查。

**Q：换一个模型能「换一份额度」吗？**
不能。Work 和 Codex 是共享额度池，换模型不会恢复额度，只会改变后续消耗速度。

**Q：在 GitHub 上让 Codex 审 PR 算哪份额度？**
通过 GitHub 触发的审查（`@codex review` 或自动审查）算 Code Review 用量；在本地或 GitHub 之外跑的审查算普通额度。详见 [Codex 代码审查怎么用](/guides/codex-code-review)。

**Q：GPT-5.5 还能在 Codex 里用吗？**
官方定价页写明 GPT-5.5 将于 **2026-10-14** 从 ChatGPT、Work 和 Codex 的所有套餐退役（API 不受影响），之前用 GPT-5.5 的配置和自动化记得提前改掉。

## 参考资料

- Codex 官方定价与使用限制（learn.chatgpt.com）— https://learn.chatgpt.com/docs/pricing
- OpenAI 帮助中心：Using Codex with your ChatGPT plan — https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan
- OpenAI 帮助中心：Managing usage with GPT-6 Astra in Work and Codex — https://help.openai.com/en/articles/20001516-managing-usage-with-gpt-6-astra-in-work-and-codex
- OpenAI 帮助中心：Paid weekly Work and Codex rate limit resets — https://help.openai.com/en/articles/20001507-paid-weekly-work-and-codex-rate-limit-resets
- OpenAI 帮助中心：How banked Codex resets work — https://help.openai.com/en/articles/20001498-how-banked-codex-resets-work
- OpenAI 帮助中心：Using Credits for Flexible Usage in ChatGPT (Personal plans) — https://help.openai.com/en/articles/12642688-using-credits-for-flexible-usage-in-chatgpt-personal-plans
- OpenAI 帮助中心：About ChatGPT Pro tiers — https://help.openai.com/en/articles/9793128-about-chatgpt-pro-tiers
- OpenAI 帮助中心：ChatGPT Work and Codex — https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex
