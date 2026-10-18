---
title: GPT-6 Pro（Astra）怎么用、哪些套餐有：怎么选到 Pro 档、用量限制和 Pro 三档价格
slug: chatgpt-gpt6-pro-astra-how-to-use-plans
products: [chatgpt]
models: [gpt]
accountTier: PRO
excerpt: GPT-6 Pro（由 GPT-6 Astra 驱动）怎么用、哪些套餐有？按 OpenAI 帮助中心核对：聊天里 Pro 档只给 Pro 100、Pro 200、Business 和 Enterprise；Plus 在 Work 和 Codex 里含 Astra。讲怎么选到、用量上限和官方列出的 Pro 价格。
checkedOn: 2026-10-19
sources:
  - https://help.openai.com/en/articles/20001354-gpt-6-and-other-models-in-chatgpt
  - https://help.openai.com/en/articles/9793128-about-chatgpt-pro-tiers
  - https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex
verify:
  - GPT-6 帮助文章标注更新于 2026-10-19 之前约 9 天，官方说 GPT-6 仍在逐步推送，是否看到取决于账号；菜单名和档位以你账号里实际显示的为准
  - 聊天里的 GPT-6 Pro 官方点名的是 Pro $100、Pro $200、Business、Enterprise；Pro $500 官方 GPT-6 文章没有单独点名，但 Pro 档位页写了 Pro 500 的 Ultrafast 用于 GPT-6 Astra，本文不下「Pro 500 一定有」的结论
  - 价格取自官方 Pro 档位页 2026-10-19：Pro 100 为 100 美元、Pro 200 为 200 美元、Pro 500 为 500 美元（每月）；官方页没有写 Pro 各档具体能发多少条消息
  - 官方说 Pro 200 的新订阅用量低于此前；2026-09-22 至 09-29 期间持有 Pro 200 的用户可用旧用量到 2026-10-29，这是官方档位页的说法，到期后以官方通知为准
---

> 本文根据 OpenAI 帮助中心《GPT-6 and other models in ChatGPT》《About ChatGPT Pro tiers》整理，资料核对于 2026-10-19，价格为「2026-10 查询」。**官方说 GPT-6 正在逐步推送**，菜单里没看到不一定是你的问题。图为本站整理的示意图。模型名字的由来见 [/guides/chatgpt-gpt6-sol-terra-luna-astra](/guides/chatgpt-gpt6-sol-terra-luna-astra)，Pro 各档的对比见 [/guides/chatgpt-plus-vs-pro-tiers](/guides/chatgpt-plus-vs-pro-tiers)。

## 适用于谁

- 搜「gpt-6 astra怎么用」「gpt-6-astra价格」的人；
- 订阅了 Plus 或 Pro，想知道自己有没有 GPT-6 Pro 的人；
- 在模型菜单里找不到 Pro 档的人；
- 想知道 Pro 要多少钱、用量够不够的人。

## 结论先说

1. **GPT-6 Pro 是什么**：官方说，在聊天里选 GPT-6，Instant 到 Extra High 由 **GPT-6 Sol** 驱动，**Pro 档由 GPT-6 Pro 负责，它由 GPT-6 Astra 驱动**，适合难题和长时间运行的任务。
2. **哪些套餐在聊天里有**：官方写明 GPT-6 Pro 在 **Pro $100、Pro $200、Business 和 Enterprise** 套餐里可用，Enterprise 还要看工作区的模型访问权限。**Plus 在聊天里没有 Pro 档**，但 Plus 套餐在 **ChatGPT Work 和 Codex** 里包含 GPT-6 Astra。
3. **怎么用**：更新 App，打开模型菜单选 **GPT-6**，再用 **Thinking** 滑块选到 **Pro**。
4. **有上限**：官方明说，Pro 订阅**不包含无限使用 GPT-6 Pro**；Work 和 Codex 有单独的额度。
5. **价格**（官方 Pro 档位页，美元，每月）：Pro 100 为 100 美元，Pro 200 为 200 美元，Pro 500 为 500 美元；官方没有写每档能发多少条消息。需要开通 GPT-6 Pro 用到的 ChatGPT Pro，可以看本站的 [/chongzhi/chatgpt-pro](/chongzhi/chatgpt-pro)；只需要 Plus，见 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

![哪些套餐有 GPT-6 Pro（Astra）](seed:g942-gpt6-pro-plans.png)
*图：本站根据 [OpenAI 帮助中心：GPT-6 and other models in ChatGPT](https://help.openai.com/en/articles/20001354-gpt-6-and-other-models-in-chatgpt) 整理的示意图*

## 一、在聊天里怎么选到 GPT-6 Pro

![在 ChatGPT 里选 GPT-6 Pro 的 4 步](seed:g942-gpt6-pro-select-steps.png)
*图：本站根据 [OpenAI 帮助中心：GPT-6 and other models in ChatGPT](https://help.openai.com/en/articles/20001354-gpt-6-and-other-models-in-chatgpt) 整理的示意图*

1. **更新 App**：官方说，如果在桌面版的聊天、Work 或 Codex 里没看到 Astra，打开 **Menu > Check for Updates** 安装最新版，**即使刚通过自动更新提示更新过，也要手动查一次**。用 Codex CLI 的话，Astra 需要 **0.153.0 或更新版本**。
2. **打开模型菜单，选 GPT-6**：官方说，菜单里 **GPT-6 取代了原来的 Latest**，原来选 Latest 的会按同样的思考强度迁到 GPT-6；明确选了 GPT-5.6 Sol 的对话仍停留在 GPT-5.6。
3. **用 Thinking 滑块选 Pro**：档位有 Instant、Medium、High、Extra High、Pro。官方说，GPT-6 下 Instant 到 Extra High 是 GPT-6 Sol，**Pro 才是 GPT-6 Pro**；在 Pro 档的可选模型里，还有 GPT-5.6 Sol Pro（属于 GPT-5.6 家族）。
4. **看不到怎么办**：官方说 GPT-6 正逐步推送给符合条件的付费账号，菜单里的名字就叫「GPT-6」，不带 Sol；没有就是账号还没轮到；在企业工作区还要看管理员的权限。

两个官方提醒：

- 在 Plus 和 Pro 套餐里，**Instant 不会自动切换到更高的思考档位**，你对它说「再想想」「深度思考」也不会切换；
- 官方说，GPT-6 的「智能界面」（文字、视觉和交互元素混合的回答）在 Instant 到 Extra High 下可用，**Pro 档不支持**。

## 二、用量上限怎么算

官方说明里，几条要点：

- **GPT-6 Pro 有使用上限**，Pro 订阅不包含无限使用；ChatGPT Work 和 Codex 的额度另算，与聊天分开；
- **Pro $200**：用到 GPT-6 Pro 的每周上限后，ChatGPT 会自动切到 GPT-5.6 Thinking 的 Medium；想用 GPT-5.6 Sol Pro，要在模型菜单里手动选 GPT-5.6 Sol，再选 Pro，前提是 GPT-5.6 Sol Pro 的每日额度和合并的每日额度还有剩余；
- **Pro $100**：两种 Pro 模型共用同一个每周额度，在两者之间切换并不会多出消息；
- **用到上限**：不会改变你的订阅，可以换别的模型，或者等重置；ChatGPT 会在能显示时告诉你重置时间；
- **官方客服不能重置用量**；觉得计数有误，或者重置后仍没恢复，可以联系客服排查。

用量怎么查，见 [/guides/chatgpt-usage-limits-check-reset](/guides/chatgpt-usage-limits-check-reset)。

## 三、Pro 三档价格与几个新规则

官方 Pro 档位页（2026-10-19）写明：

| 套餐 | 每月价格（美元） | Ultrafast |
| --- | --- | --- |
| Pro 100 | 100 | 不含 |
| Pro 200 | 200 | 不含 |
| Pro 500 | 500 | 含 |

- 官方说 Pro 200 的用量比 Pro 100 多，Pro 500 是三档里包含用量最高的；
- **Pro 200 的新订阅用量低于此前**，月费仍是 200 美元；2026-09-22 到 09-29 上午 10 点（太平洋时间）期间持有 Pro 200 的用户，可以在订阅有效期间用旧的用量到 2026-10-29，之后降到新的用量，价格不变；
- **Ultrafast** 只有 Pro 500 有，在模型选择器里选；对 GPT-6 Astra 和 GPT-6.1 Sol，它先用你套餐的包含用量，按所选模型标准速率的 8 倍消耗，用完后再用积分，按标准积分速率的 6 倍计；官方强调这是消耗速率，不是速度保证；
- **买积分**：积分可以用于 Codex、ChatGPT Work、ChatGPT for Word、Excel、PowerPoint 的符合条件的使用，不是所有模型和功能都能用积分；
- **订阅方式**：登录 ChatGPT，打开价格页选 Pro 档；已有账号换档，在 **Settings → My Plan** 里改。订阅后管理见 [/guides/chatgpt-cancel-subscription](/guides/chatgpt-cancel-subscription)，升级的步骤见 [/guides/chatgpt-how-to-upgrade-plus](/guides/chatgpt-how-to-upgrade-plus)。

## 四、Plus 用户在哪里用到 Astra

官方说，Plus 套餐的 GPT-6 Astra 在 **ChatGPT Work 和 Codex** 里包含，聊天里没有 Pro 档。Work 和 Codex 的使用和积分规则与聊天分开，见 [/guides/chatgpt-work-vs-codex](/guides/chatgpt-work-vs-codex) 和 [/guides/chatgpt-chat-vs-work-difference](/guides/chatgpt-chat-vs-work-difference)。另外，官方帮助文章里还提到 **GPT-6.1 Sol** 是 Work 和 Codex 里的一个模型选项，与聊天里的 GPT-6、GPT-5.6、GPT-6 Pro 是分开的。

## 常见问题

**Q：为什么我订阅了 Pro 却看不到 GPT-6 Pro？**
先更新 App；再看模型菜单里有没有 GPT-6；官方说 GPT-6 在逐步推送，也可能是账号还没轮到；企业工作区还要看管理员权限。

**Q：Plus 够用吗？**
Plus 聊天里没有 Pro 档，但 Work 和 Codex 包含 Astra；用不用得上取决于你要在聊天里做难题，还是要 Work、Codex 的长任务。对比见 [/guides/chatgpt-plans-comparison](/guides/chatgpt-plans-comparison)。

**Q：GPT-6 和 GPT-5.6 有什么区别？**
见 [/guides/chatgpt-gpt6-sol-terra-luna-astra](/guides/chatgpt-gpt6-sol-terra-luna-astra)。

**Q：模型菜单里没有我想要的模型？**
见 [/guides/chatgpt-cant-find-new-model-gpt-6-codex](/guides/chatgpt-cant-find-new-model-gpt-6-codex)。

## 参考资料

- OpenAI 帮助中心：GPT-6 and other models in ChatGPT — https://help.openai.com/en/articles/20001354-gpt-6-and-other-models-in-chatgpt
- OpenAI 帮助中心：About ChatGPT Pro tiers — https://help.openai.com/en/articles/9793128-about-chatgpt-pro-tiers
- OpenAI 帮助中心：ChatGPT Work and Codex — https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex
