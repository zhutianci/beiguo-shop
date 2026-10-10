---
title: ChatGPT 已达上限 / Too many requests 怎么办：额度用完、请求过多与模型容量不足的区别
slug: chatgpt-too-many-requests-limit
products: [chatgpt]
models: []
accountTier: FREE
excerpt: ChatGPT 提示「已达上限」、「Too many requests」或「model is at capacity」时，原因并不相同。本文按官方帮助中心讲清套餐额度怎么算、何时重置、用完后的回退模型和点数，以及临时限制、容量不足时该怎么处理。
checkedOn: 2026-10-07
sources:
  - https://help.openai.com/en/articles/9275245-chatgpt-free-tier-faq
  - https://help.openai.com/en/articles/20001354-gpt-56-and-gpt-6-pro-in-chatgpt
  - https://help.openai.com/en/articles/9793128-about-chatgpt-pro-tiers
  - https://help.openai.com/en/articles/10258669-troubleshooting-model-feature-access-issues
  - https://help.openai.com/en/articles/12642688-using-credits-for-flexible-usage-in-chatgpt-personal-plans
  - https://help.openai.com/en/articles/7996703-troubleshooting-chatgpt-error-messages
  - https://help.openai.com/en/articles/5955604-how-can-i-solve-429-too-many-requests-errors
  - https://help.openai.com/en/articles/6825453-chatgpt-release-notes
verify:
  - ChatGPT 网页里「Too many requests in 1 hour. Try again later」这句提示，帮助中心没有专门文章解释；正文按「短时间请求过多 / 临时限制」处理，429 专文针对的是 API
  - 「selected model is at capacity」同样没有专门文章，正文按高峰期容量限制处理
---

> 本文根据 OpenAI 帮助中心（Free 套餐 FAQ、GPT-5.6 in ChatGPT、Pro 套餐说明、模型访问受限排查、点数说明、错误排查）和发布说明整理，资料核对于 2026-10-07。

## 适用于谁

- 用着用着弹出「你已达到上限」「upgrade or try again after …」的人；
- 看到「Too many requests」「Too many requests in 1 hour. Try again later」的人；
- 提示「The selected model is at capacity. Please try a different model」的人；
- 用 API 时遇到 429 报错的开发者（见文末）。

## 结论先说

先分清是哪一类，处理方法完全不同：

| 提示类型 | 本质 | 怎么办 |
| --- | --- | --- |
| **已达上限**（会显示重置时间） | 某个功能或模型的**套餐额度**用完了 | 等到显示的时间，或换其他可用模型 / 功能；部分功能可用点数继续；或升级套餐 |
| **Too many requests / 请求过多** | 短时间内请求太密集，或被防滥用机制**临时限制** | 停一会儿再发；别多开窗口反复重试；检查是否有自动化脚本、扩展或共用账号 |
| **model is at capacity / 容量不足** | 高峰期该模型资源紧张 | 换一个模型，或稍后再试 |
| **模型显示但灰色不可选** | 额度用完、工作区权限、账号安全或违规审查 | 看旁边的说明；按下文排查 |

**客服不能帮你重置额度**。只有你认为计数有误，或到了重置时间仍不能用，才需要联系客服。

## 一、「已达上限」：套餐额度怎么算

### 哪些有额度

- **日常文字对话**：2026 年 8 月起 Free 和 Go 也是「无限」（受防滥用规则约束）；付费套餐同样标注无限。
- **单独计额的功能**：文件和图片上传、生图、语音、数据分析、深度研究等都有**各自独立**的额度，用完一个不影响其他。
- **思考档位**：付费用户手动选 Medium、High、Extra High 使用 GPT-5.6 Sol 的思考额度；达到上限后，ChatGPT 可能改用其他可用模型继续。
- **Pro 模型**：GPT-6 Pro 有额度上限，Pro 订阅也不是无限用。Pro 200 用完 GPT-6 Pro 的每周额度后自动切到 GPT-5.6 Medium；Pro 100 的两个 Pro 模型共用每周额度。
- **Work、Codex、Office 插件**：Plus 和 Pro 的 Codex、ChatGPT Work、Excel、PowerPoint、Word 共用一份「代理类」额度，和普通聊天分开。

官方不公开大多数功能的具体次数，而且高峰期可能临时下调。

### 达到上限时会看到什么

ChatGPT 会提示你达到了哪项限额，并在能提供时显示**重置时间**。例如生图用完时会提示升级，或在某个时间之后再试。

### 怎么处理

1. **等重置**：看提示里的时间；
2. **换可用选项**：换一个模型或思考档位（比如从 High 切回 Instant）；
3. **用点数继续**（部分功能）：Plus、Pro 在 Codex、Work、Word、Excel、PowerPoint 用完额度后，可以在 **Settings → Usage（用量）** 购买点数继续；点数不能给所有模型和功能加额度；Free 和 Go 只有小部分用户能买；
4. **升级套餐**：Free 达到上限后升级到 Plus、Pro 或 Business，额度会重置。套餐区别见 [/guides/chatgpt-plans-comparison](/guides/chatgpt-plans-comparison)，需要 Plus 可以看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

### 用完主模型后的「回退模型」

2026 年 7 月起，用户达到 GPT-5.5 Instant 或 Auto 的额度后，会回退到 GPT-5.5 Instant Mini；它不会出现在模型选择器里。随着 GPT-5.6 推出，回退规则以官方最新说明为准。

## 二、「Too many requests」：请求过多

帮助中心没有专门解释 ChatGPT 网页里的这句提示。按官方相关说明，可能的原因有：

- **短时间请求太密集**：连续快速发送、多个标签页同时生成、反复点重新生成；
- **防滥用的临时限制**：官方说明「无限」受防滥用规则约束，系统可能偶尔临时限制你的使用，并会通知你；如果没有发现违规，访问会恢复；
- **自动化行为**：用脚本、浏览器扩展自动批量提问，会被识别为异常流量。

处理办法：

1. 停下来等一段时间（提示里写了「in 1 hour」就等够一小时）；
2. 只保留一个对话窗口，别反复重试；
3. 停用会自动操作 ChatGPT 的扩展；
4. 确认**没有和别人共用账号**——共用账号是官方明确禁止的，也最容易触发限制；必要时改密码、登出所有设备（见 [/guides/chatgpt-account-security-mfa](/guides/chatgpt-account-security-mfa)）；
5. 一直出现且没有上述情况，联系客服。

## 三、模型「容量不足」或显示为灰色

**容量不足**：通常是高峰期资源紧张，换一个模型或稍后再试。

**模型灰色不可选**，官方列出的可能原因：

- **额度用完**：看旁边的提示和重置时间；
- **工作区权限**：公司工作区里，管理员可能没给你的角色开放这个模型；
- **账号安全**：多次登录失败、陌生地点登录可能导致临时降级——改密码、开两步验证；
- **疑似违反服务条款**：例如共享账号凭证、有害用途；
- **账号变更处理中**：刚改了套餐或付款信息，等几个小时再试。

## 四、用 API 遇到 429？

API 的 429（Too Many Requests、insufficient_quota）是另一套规则，和 ChatGPT 会员额度无关，处理方法见 [/guides/openai-api-429-error](/guides/openai-api-429-error)。

## 常见问题

**Q：Plus 每 3 小时能发多少条？**
官方现在不再按固定条数公布，日常对话标注为无限，推理、Pro 模型、生图等各有额度并可能随负载调整。

**Q：额度什么时候重置？**
不同功能周期不同（有的按天、有的按周），ChatGPT 会在提示里显示具体时间，以提示为准。

**Q：额度用完了，客服能帮我加吗？**
不能。官方说明客服不会重置 ChatGPT 或 Codex 的额度。

## 参考资料

- OpenAI 帮助中心：ChatGPT Free Tier FAQ — https://help.openai.com/en/articles/9275245-chatgpt-free-tier-faq
- OpenAI 帮助中心：GPT-5.6 and GPT-6 Pro in ChatGPT — https://help.openai.com/en/articles/20001354-gpt-56-and-gpt-6-pro-in-chatgpt
- OpenAI 帮助中心：About ChatGPT Pro tiers — https://help.openai.com/en/articles/9793128-about-chatgpt-pro-tiers
- OpenAI 帮助中心：Troubleshooting model & feature access issues — https://help.openai.com/en/articles/10258669-troubleshooting-model-feature-access-issues
- OpenAI 帮助中心：Using Credits for Flexible Usage in ChatGPT — https://help.openai.com/en/articles/12642688-using-credits-for-flexible-usage-in-chatgpt-personal-plans
- OpenAI 帮助中心：Troubleshooting ChatGPT error messages — https://help.openai.com/en/articles/7996703-troubleshooting-chatgpt-error-messages
- ChatGPT Release Notes（2026-07-06 回退模型、2026-08-06 Free / Go 无限对话）— https://help.openai.com/en/articles/6825453-chatgpt-release-notes
