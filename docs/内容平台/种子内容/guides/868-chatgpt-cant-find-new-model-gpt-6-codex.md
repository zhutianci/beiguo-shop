---
title: ChatGPT 找不到 GPT-6、GPT-5.6 Sol、Codex 或 Pro 模型怎么办：官方列出的原因与逐项排查
slug: chatgpt-cant-find-new-model-gpt-6-codex
products: [chatgpt]
models: []
accountTier: PLUS
excerpt: ChatGPT 模型菜单里没有 GPT-6、没有 GPT-5.6 Sol、没有 Codex 或 Pro 模型？按 OpenAI 帮助中心，GPT-6 在分批推出，各套餐包含的思考档位不同，桌面版要手动更新，托管工作区还看管理员权限。本文给出官方的套餐可用性表和一份逐项排查清单。
checkedOn: 2026-10-14
sources:
  - https://help.openai.com/en/articles/20001354-gpt-6-and-other-models-in-chatgpt
  - https://help.openai.com/en/articles/10258669-troubleshooting-model-feature-access-issues
  - https://help.openai.com/en/articles/9793128-about-chatgpt-pro-tiers
verify:
  - GPT-6 正在分批推出，模型名称、档位和各套餐的可用性变动很快，以模型菜单里实际看到的和官方文章最新版本为准
  - 文中的桌面版和 Codex CLI 最低版本号来自官方文章当天的写法，之后版本会继续更新
  - 官方没有写 Plus 在 Chat 里是否会获得 GPT-6 Pro，只写了 Plus 包含 Work 和 Codex 里的 GPT-6 Astra；正文只照原话写
---

> 本文根据 OpenAI 帮助中心《GPT-6 and other models in ChatGPT》《Troubleshooting Model Feature Access Issues》《About ChatGPT Pro tiers》整理，资料核对于 2026-10-14。模型更新很快，请以官方文章和你账号里实际显示的为准。配图为本站整理的示意图，不是界面截图。

## 适用于谁

- 听说 ChatGPT 出了 GPT-6，自己的模型菜单里却没有的人；
- 想用 GPT-5.6 Sol，找不到的人；
- 不知道自己为什么没有 Codex、Pro 模型，或者 Extra High 档位的人；
- 模型显示出来了却是灰色，点不了的人。

## 结论先说

1. **没看到 GPT-6，可能只是还没轮到你。** 官方原话的意思是：GPT-6 正在逐步推给符合条件的 Pro、Plus、Enterprise 和 Business 用户，菜单里没有，说明你的账号暂时还没有。在菜单里找的名字就叫 **GPT-6**，不带 Sol 字样。
2. **套餐决定能选哪些思考档位。** 官方有一张表：Free 和 Go 不含 Medium、High、Extra High、Pro；Plus 含 Medium 和 High，不含 Extra High 和 Pro；Pro、Business、Enterprise 都包含。
3. **GPT-5.6 Sol 仍是单独选项**，选了它，对话就留在 GPT-5.6。Free 和 Go 不含 Sol，它们默认用 **GPT-5.6 Luna**。
4. **Terra 和 Luna 不能在普通对话里选**，按套餐出现在 Work 和 Codex 里，开发者也可以通过 API 用。
5. **桌面版找不到新模型，先手动更新**：菜单 → **Check for Updates**，官方强调即使刚通过自动更新提示更新过，也要手动再检查一次。
6. **托管工作区（公司、学校）里**，能用哪些模型取决于管理员设置和你的角色，同一个工作区里别人能用，你不一定能用。
7. **灰色选项旁边有说明**，先读，可能写着额度已用完和重置时间，不是故障。

![各套餐的思考档位：Free、Go、Plus、Pro、Business、Enterprise 对照表](seed:g868-plan-thinking-levels.png)
*图：本站根据 [OpenAI 帮助中心：GPT-6 and other models in ChatGPT](https://help.openai.com/en/articles/20001354-gpt-6-and-other-models-in-chatgpt) 整理的示意图*

## 一、为什么没有 GPT-6

官方《GPT-6 and other models in ChatGPT》给了几条：

- GPT-6 **正在向符合条件的 Pro、Plus、Enterprise 和 Business 用户推出**，菜单里没看到，可能暂时没开放给你的账号；
- 在托管工作区里，**模型访问权限**也要满足；
- 在模型菜单里，GPT-6 取代了原来的 **Latest**：原来选 Latest 的会转到 GPT-6，同样的思考强度；明确选了 GPT-5.6 Sol 的仍留在 GPT-5.6；
- GPT-6 的各档（Instant、Medium、High、Extra High）由 **GPT-6 Sol** 驱动，Pro 档由 **GPT-6 Pro**（基于 GPT-6 Astra）驱动，具体可选项取决于套餐和工作区设置；
- 这次推出**不会下线**其他可选的旧模型。

Free 和 Go：官方写的是它们收到的是 GPT-5.6 Luna，不含 Sol，也没有思考档位里的 Medium、High、Extra High、Pro。Go 用户遇到难题可以选 **Think**，用的是 GPT-5.6 Luna，不是 Sol。

## 二、没有 Pro 模型、没有 Extra High

- **GPT-6 Pro**（基于 GPT-6 Astra）在 ChatGPT 里提供给 **Pro 100、Pro 200、Business 和 Enterprise** 套餐；Enterprise 还要看工作区的模型访问权限；
- **Plus** 包含 Work 和 Codex 里的 GPT-6 Astra，官方对 Plus 在聊天里的 Pro 档没有给出可用说明，表格里 Plus 的 Extra High、Pro 是「不包含」；
- **Extra High** 只在 Pro、Business、Enterprise 套餐里；
- **Pro 档的各套餐额度不同**，Pro 模型有使用上限，订阅 Pro 并不是无限用。额度怎么看见 [/guides/chatgpt-usage-limits-check-reset](/guides/chatgpt-usage-limits-check-reset)。

套餐的整体区别见 [/guides/chatgpt-plans-comparison](/guides/chatgpt-plans-comparison)，想开通 Plus 可以看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

## 三、没有 Codex、Work，或桌面版里没有某个模型

官方文章对 GPT-5.6 在各产品里的可用性列了一张表：

| 产品 | GPT-5.6 可用性 |
| --- | --- |
| ChatGPT Work | Plus、Pro、Business、Enterprise 可用 Sol、Terra、Luna |
| Codex | Free 和 Go 可用 Terra；Plus、Pro、Business、Enterprise 可用 Sol、Terra、Luna |
| OpenAI API | Sol、Terra、Luna |

另外几条官方说明：

- 要在 Codex 里用 GPT-5.6，ChatGPT 桌面版（Codex 模式）至少需要某个版本，Codex CLI 也有最低版本，写在官方文章里；Astra 对 Codex CLI 版本要求更高。具体数字会随更新变化，以官方文章为准；
- **桌面版里没有 Astra**：菜单 → **Check for Updates** 装上最新版；
- Work 和 Codex 里的模型选择、用量规则**和聊天分开**。两者区别见 [/guides/chatgpt-work-vs-codex](/guides/chatgpt-work-vs-codex)。

Plus 与 Pro 套餐里，**Instant 不会自动切换到更高的思考档位**，对 ChatGPT 说「再想深一点」也不会自动换档，需要自己在模型菜单里选。官方也说明，出于安全原因，ChatGPT 仍然可能自动切换。

![找不到某个模型或功能的常见原因：GPT-6 分批推出、套餐不含、桌面版要更新、Terra 与 Luna 不可选、灰色选项](seed:g868-missing-model-causes.png)
*图：本站根据 [OpenAI 帮助中心：GPT-6 and other models in ChatGPT](https://help.openai.com/en/articles/20001354-gpt-6-and-other-models-in-chatgpt) 与 [Troubleshooting Model Feature Access Issues](https://help.openai.com/en/articles/10258669-troubleshooting-model-feature-access-issues) 整理的示意图*

## 四、模型显示着却是灰色

官方《Troubleshooting Model Feature Access Issues》说，你可能收到「模型访问或功能暂时受限」的通知，或者看到某个模型或智能选项**仍然显示，但是不可用**。官方列的原因：

- **工作区权限**：托管工作区里，模型是否可用取决于工作区设置和基于角色的访问控制。别人能用你不一定能；
- **达到使用上限**：读灰色选项旁边的说明。写着已达上限或重置时间，就等到那个时间，或选别的选项；
- **可能违反服务条款**：账号因疑似违规被标记，比如共享账号凭据、有害或被禁止的用途、滥用平台；
- **安全问题**：多次登录失败、从陌生地点登录等可疑活动，可能触发临时降级；
- **账号变更或维护**：最近改过订阅、套餐或付款信息，更新处理期间功能可能暂时受限。

官方建议的处理：

1. 托管工作区：先确认你在对的工作区，请工作区所有者检查你对该模型的访问权限，这和使用上限、账号限制是三回事；
2. 对照服务条款：官方点名的可能违规包括与未授权的人共享账号凭据、用于有害或被禁止的用途、尝试滥用平台；
3. 重新加固账号：重设密码，开启两步验证，见 [/guides/chatgpt-account-security-mfa](/guides/chatgpt-account-security-mfa)；
4. 过几个小时再试：最近的账号变更、维护或安全审核，可能导致临时降级，官方说等几个小时让更新处理完；
5. 以上都做了还不行，联系官方客服，见 [/guides/chatgpt-contact-support](/guides/chatgpt-contact-support)。

![找不到模型时的 6 步排查顺序](seed:g868-missing-model-steps.png)
*图：本站根据 [OpenAI 帮助中心：Troubleshooting Model Feature Access Issues](https://help.openai.com/en/articles/10258669-troubleshooting-model-feature-access-issues) 整理的示意图*

## 五、地区和账号方面

- 官方说明，GPT-5.6 **没有单独的国家列表**，ChatGPT 的访问跟随官方的受支持国家和地区。受支持的欧洲地区（包括 EEA、瑞士、英国）和阿联酋的符合条件用户，可以在套餐和产品支持时使用；
- 如果你的所在地区本来就不在官方支持范围内，那就是官方不支持，见 [/guides/chatgpt-supported-countries](/guides/chatgpt-supported-countries)；
- 同时有多个 ChatGPT 账号时，先确认当前登录的是哪一个，套餐和模型是跟着账号走的，见 [/guides/chatgpt-account-sharing-multiple-devices](/guides/chatgpt-account-sharing-multiple-devices)。

## 常见问题

**Q：我是 Plus，为什么没有 Extra High 和 Pro 档？**
官方表格里 Plus 只含 Medium 和 High，不含 Extra High 和 Pro。

**Q：GPT-5.6 Terra 和 Luna 在哪选？**
官方说它们在标准的 ChatGPT 对话里不能选，按套餐出现在 Work 和 Codex 里，开发者可以通过 API 使用。

**Q：模型菜单里没有 GPT-6，是不是账号出了问题？**
不一定，官方说 GPT-6 在分批推出。可以先看你的套餐是否在推出范围内，更新应用，过一段时间再看；怀疑账号异常，见上面第四节。

**Q：选模型的时候，为什么系统自己换了模型？**
达到某个模型的额度上限后，ChatGPT 可能继续用别的可用模型；出于安全原因也可能自动切换。额度见 [/guides/chatgpt-usage-limits-check-reset](/guides/chatgpt-usage-limits-check-reset)。

**Q：怎么选思考档位？**
见 [/guides/chatgpt-model-picker-thinking](/guides/chatgpt-model-picker-thinking)。

## 参考资料

- OpenAI 帮助中心：GPT-6 and other models in ChatGPT — https://help.openai.com/en/articles/20001354-gpt-6-and-other-models-in-chatgpt
- OpenAI 帮助中心：Troubleshooting Model Feature Access Issues — https://help.openai.com/en/articles/10258669-troubleshooting-model-feature-access-issues
- OpenAI 帮助中心：About ChatGPT Pro tiers — https://help.openai.com/en/articles/9793128-about-chatgpt-pro-tiers
