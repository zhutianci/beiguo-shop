---
title: ChatGPT 怎么看额度、什么时候重置：聊天会消耗额度吗，提示「已达上限」后怎么办
slug: chatgpt-usage-limits-check-reset
products: [chatgpt]
models: []
accountTier: FREE
excerpt: ChatGPT 额度在哪看、什么时候重置？按 OpenAI 帮助中心，达到上限时会提示是哪项功能并显示重置时间；Free 和 Go 日常文字聊天无限，文件、生图、语音等各有单独限额；客服不能重置额度。本文讲清哪些操作消耗额度、Settings 里的 Usage 是什么。
checkedOn: 2026-10-14
sources:
  - https://help.openai.com/en/articles/9275245-chatgpt-free-tier-faq
  - https://help.openai.com/en/articles/20001354-gpt-6-and-other-models-in-chatgpt
  - https://help.openai.com/en/articles/12642688-using-credits-for-flexible-usage-in-chatgpt-personal-plans
verify:
  - 官方没有为个人账号提供「剩余次数」仪表盘，也没有公布大多数功能的具体次数和重置周期；正文只写了官方明确写过的内容
  - Settings → Usage 在官方文章里是 Work、Codex 的用量与点数入口，普通聊天不在里面；是否能看到这个页面取决于账号
  - Plus、Pro 的日常文字聊天上限，官方这几篇文章没有写，正文没有下结论
  - GPT-6 正在分批推出，模型名称与档位变动较快，以模型菜单里实际看到的为准
---

> 本文根据 OpenAI 帮助中心《ChatGPT Free Tier FAQ》《GPT-6 and other models in ChatGPT》《Using Credits for Flexible Usage in ChatGPT》等文章整理，资料核对于 2026-10-14。官方说明可用额度和默认模型会随时间变化。配图中的横幅截图引自 OpenAI 帮助中心，其余为本站整理的示意图。

## 适用于谁

- 想知道自己的 ChatGPT 还剩多少额度、什么时候重置的人；
- 想知道「普通聊天算不算额度」的人；
- 看到「You've reached your limit」之类提示，不知道该等还是该换的人；
- 想知道升级套餐后额度会不会重新算的人。

## 结论先说

1. **官方没有给个人账号提供「还剩几次」的计数器。** 官方的做法是：**达到某项限额时，ChatGPT 在界面里提示，并在能提供时显示重置时间。**
2. **Free 和 Go：日常文字聊天无限**，但受防滥用规则约束；**文件和图片上传、生图、语音、数据分析**等功能各有**单独的限额**，用完这一项不影响别的。
3. **付费套餐里，手动选择更高的思考档位（Medium、High、Extra High）有额度**，达到上限后，ChatGPT 可能改用其他可用模型继续。**Pro 模型（如 GPT-6 Pro）也有上限**，订阅 Pro 不等于无限用。
4. **Work 和 Codex 的额度和聊天分开算。** 用量和点数余额，如果你的账号支持，在 **Settings → Usage** 查看。
5. **客服不能重置额度。** 官方原话的意思是：达到上限就等重置，或用账号里显示的其他选项；只有你认为**计数不对**，或到了说好的重置时间还是不能用，才联系客服。
6. **Free 升级到 Plus、Pro 或 Business 之后，已经达到的使用额度会重置。** 升级不是解决「额度怎么看」的办法，但官方确实这么写。

![达到限额时 ChatGPT 对话框上方的提示条：You've reached your image creation limit，Upgrade to ChatGPT Plus or try again tomorrow after 9:17 AM（官方示例）](seed:g866-limit-reached-banner.png)
*图片来源：[OpenAI 帮助中心：ChatGPT Free Tier FAQ](https://help.openai.com/en/articles/9275245-chatgpt-free-tier-faq)*

上图是官方文章里的示例：提示条说明**哪项功能**到了上限（这里是生图），以及**什么时间之后再试**。重置时间就写在这条提示里，没有别的专门页面。

## 一、哪些操作会消耗额度

![哪些操作有额度、哪些没有：日常聊天、上传生图语音、思考档位、Pro 模型、Work 与 Codex](seed:g866-what-counts-toward-limits.png)
*图：本站根据 [OpenAI 帮助中心：GPT-6 and other models in ChatGPT](https://help.openai.com/en/articles/20001354-gpt-6-and-other-models-in-chatgpt) 与 [ChatGPT Free Tier FAQ](https://help.openai.com/en/articles/9275245-chatgpt-free-tier-faq) 整理的示意图*

**日常文字聊天**：官方明确写的是 Free 和 Go 用户「无限的日常文字聊天，受防滥用保护措施约束」。Plus、Pro 的日常聊天有没有上限，这几篇官方文章里没有给出说法，本文不下结论；遇到限额以提示为准。

**单独计额的工具**：官方列出：数据分析、文件和图片上传、生成图片，**限额与主聊天限额分开**。达到其中一项的限额后，需要等一段时间才能再用那一项。生图的细节见 [/guides/chatgpt-image-limits](/guides/chatgpt-image-limits)。

**GPT 的使用**：Free 用户使用 GPT（自定义聊天机器人）跟随当前 Free 的模型限额，到上限后 GPT 的使用暂停，直到限额重置，界面里会显示重置时间。

**思考档位**：在模型菜单里手动选 Medium、High、Extra High，用的是更强的模型，有对应的思考额度。达到思考上限时，ChatGPT 可能继续用别的可用模型，你可以换模型，也可以等到显示的重置时间。选档位见 [/guides/chatgpt-model-picker-thinking](/guides/chatgpt-model-picker-thinking)。

**Pro 模型**：官方强调 **GPT-6 Pro 有使用上限，Pro 订阅不包含无限使用**。官方还举了几个例子：Pro $200 用完 GPT-6 Pro 的周额度后，会自动切到 GPT-5.6 Thinking 的 Medium；Pro $100 的两个 Pro 模型共用一份周额度，切换模型不会多出消息数。到了 Pro 模型上限，不会改变你的订阅，可以用其他可用模型，或等到重置。

**Work 和 Codex**：官方明说「Work 和 Codex 的用量与点数规则和聊天分开」。区别见 [/guides/chatgpt-work-vs-codex](/guides/chatgpt-work-vs-codex)。

## 二、额度在哪里看

按官方文章能确认的位置：

1. **提示条 / 提示信息**：达到限额时在输入框上方出现，说明哪项功能、什么时候重置（上面的截图）；
2. **产品界面里的其他位置**：官方文章只说「ChatGPT 在能提供这个信息时会显示重置时间」，没有逐个列出位置，以你实际看到的为准；
3. **Settings（设置）→ Usage（用量）**：这是 **Work 和 Codex 点数**的入口。如果你的账号可以购买点数，在这里能查看当前余额，购买点数，开启自动补充。官方特别说明，**用量点数和 ChatGPT 钱包余额是两回事**。看不到这个页面，说明你的账号暂时没有这个功能。

官方没有说「普通聊天还剩几条」可以在哪里查。第三方浏览器扩展声称能显示剩余次数，那不是官方功能，本文不做介绍。

## 三、什么时候重置

官方的写法是：**ChatGPT 在能提供时显示额度重置的时间**，没有统一给出「每几小时 / 每天 / 每周」的列表。能确认的几点：

- 提示里的时间就是以那一项的重置时间为准，不同功能的重置时间可以不一样；
- Pro 的部分模型有**每日**和**每周**的额度，官方文章里提到 GPT-6 Pro 的周额度、GPT-5.6 Sol Pro 的日额度，各档位不同；
- Free 用户的限额升级后重置：官方说，Free 达到上限后，升级到 Plus、Pro 或 Business，使用额度会重置。

大多数功能的**具体次数官方不公开**，而且「可能随时调整」，别信网上流传的固定数字。

## 四、看到「已达上限」，按这个顺序处理

![看到已达上限提示后的处理步骤：读提示、等重置或换模型、看 Usage、升级、联系客服](seed:g866-limit-reached-steps.png)
*图：本站根据 [OpenAI 帮助中心：GPT-6 and other models in ChatGPT](https://help.openai.com/en/articles/20001354-gpt-6-and-other-models-in-chatgpt) 整理的示意图*

1. **读提示**：是哪个功能、几点重置；
2. **等，或换**：等到显示的重置时间，或换一个可用的模型 / 功能。各功能的额度互相独立，生图用完不影响聊天；
3. **Work 或 Codex 想继续**：看 Settings → Usage，账号支持购买时会出现 **Add credits**。官方说明：点数先用套餐内含的额度，用完再扣点数；点数有效期 12 个月，不可转让，一般不退，有经核实的账单错误等例外；
4. **想让 Free 额度马上重置**：升级到付费套餐。要开通 Plus，可以看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)；
5. **过了时间还不行**：联系官方客服，见 [/guides/chatgpt-contact-support](/guides/chatgpt-contact-support)，附上提示截图、出现时间和你用的功能。

## 常见问题

**Q：聊天会消耗额度吗？**
Free 和 Go 的日常文字聊天官方写的是无限（受防滥用规则约束）；上传、生图、语音、数据分析有各自的限额；付费套餐的思考档位和 Pro 模型有额度。简单说：不是所有操作都耗同一份额度。

**Q：为什么我还没用多少就提示已达上限？**
可能是你用的那一项有单独的限额（比如生图、上传文件），而不是聊天。也可能用的是有额度的思考档位或 Pro 模型。看提示里写的是哪项功能。

**Q：模型显示灰色选不了？**
可能是额度用完，也可能是工作区权限、账号安全限制，见 [/guides/chatgpt-too-many-requests-limit](/guides/chatgpt-too-many-requests-limit) 第三节。

**Q：重置时间到了还是用不了，怎么办？**
先刷新页面、确认登录的是同一个账号。仍然不行就联系客服，官方说这种情况客服可以调查。

**Q：能不能让客服帮我重置？**
不能。官方明说 OpenAI 客服不重置 ChatGPT 或 Codex 的使用限额。

**Q：Free 的功能有哪些？**
见 [/guides/chatgpt-free-plan-limits](/guides/chatgpt-free-plan-limits)；套餐区别见 [/guides/chatgpt-plans-comparison](/guides/chatgpt-plans-comparison)。

## 参考资料

- OpenAI 帮助中心：ChatGPT Free Tier FAQ — https://help.openai.com/en/articles/9275245-chatgpt-free-tier-faq
- OpenAI 帮助中心：GPT-6 and other models in ChatGPT — https://help.openai.com/en/articles/20001354-gpt-6-and-other-models-in-chatgpt
- OpenAI 帮助中心：Using Credits for Flexible Usage in ChatGPT (Personal plans) — https://help.openai.com/en/articles/12642688-using-credits-for-flexible-usage-in-chatgpt-personal-plans
