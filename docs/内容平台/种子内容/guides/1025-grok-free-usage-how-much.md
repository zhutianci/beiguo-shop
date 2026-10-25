---
title: Grok 能免费用吗：免费版有哪些功能、额度多少、什么时候该付费
slug: grok-free-usage-how-much
products: [grok]
models: []
accountTier: OTHER
excerpt: Grok 能免费用吗？能。官方页面写明网页、iOS、Android 都可以免费试用，定价页的 Free 档是「有限的聊天请求、有限的代理请求」，没有公布具体次数。本文讲免费入口、Free 和付费档的差别，以及什么情况下值得升级（2026-10 查询）。
checkedOn: 2026-10-25
sources:
  - https://x.ai/grok
  - https://x.ai/pricing
  - https://docs.x.ai/grok/faq
  - https://docs.x.ai/grok/overview
  - https://x.ai/legal/faq
verify:
  - 官方定价页 Free 档只写「Limited Chat requests、Limited agent requests」，没有给出每天或每周的具体次数，本文不编数字
  - 定价页的功能对比表里，Free 列的 Chat、Imagine、Build 标注为 Limited；视频生成、Grok API、Grok Bot 等项在页面上用图标表示，纯文本抓取无法区分打勾与空白，所以表里写「官方未列」，以官方页面为准
  - 官方隐私 FAQ 写「视所在地区，提供有限的免费使用和付费订阅」，也就是免费范围可能因地区而异；本文不判断中国大陆能否访问，也不写任何访问方法
  - 官方 FAQ 提到免费档的 Chat 和 Voice 限额与付费周用量是分开的、各自按自己的时间重置，具体重置时间官方没写
  - 价格为官方定价页的美元标价、不含税，2026-10-25 查询，官方注明可能调整
---

> 本文根据 Grok 官方站（x.ai）的产品页、定价页、docs.x.ai 的 FAQ 和隐私 FAQ 整理，资料核对于 2026-10-25，价格为「2026-10 查询」。免费范围和限额可能随时调整，**以官方页面为准**。图为本站整理的示意图。

## 适用于谁

- 搜「grok能免费用吗」「grok免费额度多少」的人；
- 想先试试 Grok，再决定要不要订阅的人；
- 用着用着提示限额，不确定是免费限制还是别的问题的人。

## 结论先说

1. **能免费用**。官方 x.ai/grok 页面写的是「Free to try on the web and in the apps」，定价页也有一档 Free，月费 0。
2. **免费额度没有公布具体数字**。定价页 Free 档只写「有限的聊天请求」「有限的代理请求」，官方文档里也找不到每天几条、每周几条这样的数字。所以网上流传的具体次数，官方页面都没有依据。
3. **免费档和付费周用量是分开的**。官方 FAQ 说，付费用户的周用量用完以后，仍然可以用 Grok 免费档的 Chat 和 Voice 限额，这部分按自己的节奏重置。
4. **想要更多**：付费档给的是「共享用量池」，Plus 是基础用量，Premium 是 Plus 的 4 倍，Super 15 倍，Ultra 50 倍。需要开通可以看本站 [/chongzhi/grok-super](/chongzhi/grok-super)。

![免费用 Grok 的入口：网页、手机 App、登录方式](seed:g1025-grok-free-entry-steps.png)
*图：本站根据 [x.ai/grok](https://x.ai/grok) 与 [x.ai/pricing](https://x.ai/pricing) 整理的示意图*

## 一、免费版怎么开始用

官方页面给的上手步骤只有三步：

1. 打开 Grok：网页 grok.com，或 iOS、Android 的 Grok App；
2. 登录：用 X 账号或邮箱，换设备后对话、设置、订阅状态会同步；
3. 开始聊天，可以在搜索、推理、语音、图片等模式之间切换。

官方隐私 FAQ 还提到，不登录也可能使用 Grok，但这种情况下你的内容可能被匿名收集，并且在部分地区没有关闭「用于模型训练」的选项。想控制这一点，建议登录后在设置里管理，见 [/guides/grok-memory-custom-instructions-privacy-training](/guides/grok-memory-custom-instructions-privacy-training)。

另外，官方 FAQ 提醒：网页版请用 **grok.com**，并使用 Chrome 或 Chromium 内核浏览器，不要用旧的 grok.x.ai，否则可能缺少 Projects 等功能。

## 二、Free 和付费档差在哪

![Grok Free 与 Plus、Premium 的差别](seed:g1025-grok-free-vs-paid.png)
*图：本站根据 [Grok 官方定价页](https://x.ai/pricing) 整理的示意图*

| 套餐 | 月费（美元，不含税） | 官方写的用量 |
| --- | --- | --- |
| Free | 0 | 有限 |
| Plus | 8 | 共享用量池（基础） |
| Premium | 30 | Plus 的 4 倍 |
| Super | 100 | Plus 的 15 倍 |
| Ultra | 200 | Plus 的 50 倍 |

几个容易误会的点：

- **付费档是一个「周用量池」**，不是每天固定几条。聊天、图片视频生成、语音、Build 都从同一个池里扣，不同功能每次扣得不一样：官方说一条普通聊天消耗的算力很少，生成高质量视频或跑长时间编程任务则多得多。
- **官方对「该选哪档」的建议**：新手用 Premium，每天用代理功能的用 Super，重度用户用 Ultra，Plus 更适合只想要 X 创作者权益、AI 用量不多的人。
- **免费档的图片视频**：生成的图片和视频都会带 Grok 水印，官方明确说没有去除水印的设置。

## 三、什么时候该考虑付费

可以按下面几种情况自己判断：

| 你的情况 | 建议 |
| --- | --- |
| 偶尔问几句、查资料 | 先用免费版，够用就不用订 |
| 经常提示限额，影响正常使用 | 看 Plus 或 Premium |
| 要稳定地做图片、视频、长时间编程任务 | 官方建议看 Super、Ultra，这类任务耗用量大 |
| 已经有 X Premium 或 Cursor 订阅 | 先读 [/guides/grok-how-to-subscribe-download](/guides/grok-how-to-subscribe-download)，官方说合并订阅是可选的 |

用量怎么看、用完怎么办，见 [/guides/grok-usage-limit-weekly-pool-why](/guides/grok-usage-limit-weekly-pool-why)。要做图片和视频，可以先看 [/guides/grok-imagine-image-video](/guides/grok-imagine-image-video)。想对比 ChatGPT，见 [/guides/chatgpt-vs-grok-which-to-choose](/guides/chatgpt-vs-grok-which-to-choose)。

## 常见问题

**Q：免费版每天能问几次？**
官方没有公布。定价页只写「有限」，页面没有数字就不要相信带具体次数的说法。

**Q：免费版能用最新的 Grok 模型吗？**
官方定价页把「最新 Grok 模型」列在 Premium 档的要点里，Free 档没有列这一项。最新模型是什么，见 [/guides/grok-47-what-is-release](/guides/grok-47-what-is-release)。

**Q：免费用 Grok API 行不行？**
官方 API 快速入门的第一步是注册 console.x.ai 账号，「然后充值才能开始用 API」。API 单独计费，价格见 [/guides/grok-api-pricing-api-key](/guides/grok-api-pricing-api-key)。

**Q：免费版的对话会被拿去训练吗？**
官方说你可以在设置里选择是否「Improve the model」，也可以用 Private Chat，详见上面链接的隐私文章。

## 参考资料

- Grok 官方：Grok — https://x.ai/grok
- Grok 官方：Pricing — https://x.ai/pricing
- docs.x.ai：Grok FAQ — https://docs.x.ai/grok/faq
- docs.x.ai：Welcome to Grok — https://docs.x.ai/grok/overview
- Grok 官方：隐私与使用 FAQ — https://x.ai/legal/faq
