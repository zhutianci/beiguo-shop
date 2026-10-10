---
title: ChatGPT Go 是什么？和 Plus 的区别、广告与适合谁
slug: chatgpt-go-vs-plus
products: [chatgpt]
models: []
accountTier: OTHER
excerpt: ChatGPT Go 是介于 Free 和 Plus 之间的低价套餐。本文按官方帮助中心和价格页讲清 Go 包含什么、和 Plus 差在哪（模型、Work、Codex、Sites、广告）、怎么开通和切换，以及什么人选 Go 就够、什么人应该直接上 Plus。
checkedOn: 2026-10-07
sources:
  - https://help.openai.com/en/articles/11989085-what-is-chatgpt-go
  - https://chatgpt.com/pricing
  - https://help.openai.com/en/articles/6950777-what-is-chatgpt-plus
  - https://help.openai.com/en/articles/20001047
  - https://help.openai.com/en/articles/20001274-chatgpt-voice
  - https://help.openai.com/en/articles/6825453-chatgpt-release-notes
verify:
  - Go 的语音额度：Go FAQ 写「与 Free 相同」，2026-09-09 发布说明写「GPT-Live-1 mini 最多 3 小时」，价格页写「扩展」，正文按发布说明和价格页
  - Go FAQ 写「未来可能开始在 Go 中测试广告」，广告 FAQ 写「Free 和 Go 可能出现广告」，正文写「可能出现」
  - 「升级套餐」「试用 Go」等中文按钮名以实际界面为准
---

> 本文根据 OpenAI 帮助中心（What is ChatGPT Go、What is ChatGPT Plus、Ads in ChatGPT）、ChatGPT 价格页和发布说明整理，资料核对于 2026-10-07；截图引用自 OpenAI 帮助中心，为英文界面。价格以[官方价格页](https://chatgpt.com/pricing)为准。

## 适用于谁

- 觉得 Free 的上传、生图次数不够，又不确定要不要直接开 Plus 的人；
- 在升级页面看到「Go」，不知道是什么的人；
- 已经是 Plus，想降级省钱的人。

## 结论先说

1. **Go 是「额度加强版的 Free」**：包含 Free 的全部功能，并提高生图、文件上传、数据分析、语音等工具的额度，上下文（记忆）更长，还能用项目、定时任务、文件库。
2. **Go 和 Free 用的是同一代主力模型**：都是 GPT-5.6 Luna，点 **Think（思考）** 也是 GPT-5.6 Luna。**Go 不包含 GPT-5.6 Sol，也没有 GPT-6 系列**——这是它和 Plus 最大的差别。
3. **Plus 多出来的是「干活」能力**：完整的 ChatGPT Work（网页、手机、桌面）、扩展的 Codex、完整深度研究、带思考的生图、Sites、交互式图表、开发者模式、旧版模型等。
4. **广告**：Go 和 Free 可能出现广告（部分地区），Plus 及以上没有广告。
5. **怎么选**：主要是聊天、改文案、偶尔生图和传文件——Go 够用；写代码、做研究报告、让 AI 端到端交付文档表格——直接选 Plus。

## Go 包含什么

据官方 Go FAQ：

- Free 的全部功能；
- **更高的工具额度**：生图、文件上传、高级数据分析（用 Python 分析数据）次数都比 Free 多；
- **更长的记忆 / 上下文**：价格页标注 Go 的 Instant 总上下文窗口为 54K（Free 为 27K），推理模型 256K；
- **项目、定时任务、自定义 GPTs、文件库**（受当前功能可用性和存储空间限制）；
- 可以通过「Sign in with ChatGPT」在支持的第三方应用里使用 Go 的额度；
- 日常文字对话无限（受防滥用规则约束）。

**不包含**：API 用量（单独计费）、旧版模型（如 4o）、部分高级产品。

## Go 和 Plus 对比

| 项目 | Go | Plus |
| --- | --- | --- |
| 日常文字对话 | 无限* | 无限* |
| 主力模型 | GPT-5.6 Luna（含 Think） | 另有 GPT-5.6 Sol（Instant / Medium / High）；Work 和 Codex 里还有 GPT-6 系列 |
| 旧版模型 | 无 | 有 |
| 上下文窗口（Instant / 推理） | 54K / 256K | 54K / 256K |
| ChatGPT Work | 有限（仅桌面 App） | 桌面、网页、手机 |
| Codex | 有限 | 有 |
| 深度研究 | 有限 | 有 |
| 生图 | 有 | 有，另有「带思考的生图」 |
| Sites、交互式表格图表、开发者模式 | 无 | 有 |
| 响应速度 | 视带宽和可用性 | 快，高峰期优先 |
| 广告 | 可能出现 | 无 |

\* 需合理使用并遵守政策。数据来自官方价格页（2026-10-07）。

一个容易被忽略的点：**Go 和 Plus 的上下文窗口在价格页上是一样的**，所以「能塞多长的文件」并不是两者的主要差别；差别在模型能力、Work 和 Codex。

## 用 Think 处理难题

Go 用户在网页和手机 App 上都能用 **Think**：手机上从输入框 **+** 菜单里选 Think。它用的仍是 GPT-5.6 Luna，只是会多花时间推理。

![输入框「+」菜单：添加照片和文件、创建图片、深度研究、购物研究、Thinking（思考）（英文界面）](seed:g110-plus-menu-thinking.png)
*图片来源：[OpenAI 帮助中心《What is ChatGPT Go?》](https://help.openai.com/en/articles/11989085-what-is-chatgpt-go)*

## 关于广告

按官方广告 FAQ：

- 广告测试自 2026 年 2 月 9 日在美国开始，逐步扩展到部分地区的 Free 和 Go 用户；
- 广告显示在回答末尾下方，标注「赞助」，官方称广告**不影响** ChatGPT 的回答，也不会把对话内容分享给广告主；
- 涉及个人健康、心理健康、政治等敏感话题时不会出现广告；临时聊天里不显示广告；未成年账号不显示广告；
- 可以在 **Settings → Ad Controls（广告控制）** 关闭广告个性化、清除广告数据。

不想看到广告，只能选 Plus 及以上套餐。

## 开通与切换

- **开通 Go**：登录 ChatGPT → 点头像 → **Upgrade Plan（升级套餐）** → 选 **Try Go**。
- **从 Plus / Pro 改成 Go**：头像 → **Settings → Account（账户）** 管理订阅。当前套餐会用到本期结束，下期起按 Go 计费，**不退差价**。
- **在手机商店订阅后看不到 Go**：等几分钟、重启 App。
- 付款方式和本地货币支持因国家而异；Go、Plus、Pro 都只有月付，没有年付。

## 常见问题

**Q：Go 在哪些国家能买？**
官方说明 Go 在所有支持 ChatGPT 的国家都可以购买，以美元计价，部分国家支持本地货币结算。支持的国家见官方列表。

**Q：Go 能用语音吗？**
能。2026 年 9 月起官方把 Go 的 GPT-Live 语音调整为每天最多 3 小时 GPT-Live-1 mini。详见 [/guides/chatgpt-voice-mode](/guides/chatgpt-voice-mode)。

**Q：Go 能用插件 / 已连接应用吗？**
插件目录可以浏览，但具体某个插件能否安装和使用取决于套餐和设置，部分能力需要 Plus 或更高。

**Q：完整的套餐对比在哪？**
见 [/guides/chatgpt-plans-comparison](/guides/chatgpt-plans-comparison)。确定要 Plus 的话可以看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

## 参考资料

- OpenAI 帮助中心：What is ChatGPT Go? — https://help.openai.com/en/articles/11989085-what-is-chatgpt-go
- ChatGPT 价格页 — https://chatgpt.com/pricing
- OpenAI 帮助中心：What is ChatGPT Plus? — https://help.openai.com/en/articles/6950777-what-is-chatgpt-plus
- OpenAI 帮助中心：Ads in ChatGPT — https://help.openai.com/en/articles/20001047
- OpenAI 帮助中心：ChatGPT Voice — https://help.openai.com/en/articles/20001274-chatgpt-voice
- ChatGPT Release Notes（2026-08-06 Luna 默认与 Think、2026-09-09 语音额度）— https://help.openai.com/en/articles/6825453-chatgpt-release-notes
