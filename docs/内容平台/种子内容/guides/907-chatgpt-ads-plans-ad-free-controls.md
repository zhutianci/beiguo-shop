---
title: ChatGPT 广告怎么回事：哪些套餐有广告、能不能关掉、广告个性化和「无广告」怎么设置
slug: chatgpt-ads-plans-ad-free-controls
products: [chatgpt]
models: []
accountTier: FREE
excerpt: ChatGPT 现在有广告吗？按 OpenAI 帮助中心：Free 和 Go 可能出现广告，Plus、Pro、Business、Enterprise、Edu 没有；广告不影响回答、也不会把对话给广告主。本文讲怎么在设置里关个性化、隐藏广告、切换到「无广告」（用量更低），附官方截图。
checkedOn: 2026-10-14
sources:
  - https://help.openai.com/en/articles/20001047-ads-in-chatgpt
verify:
  - 官方说广告在部分地区逐步推出，2026-02-09 起先在美国测试；你的账号里有没有广告和「广告设置」入口，取决于所在地区和是否在测试范围内
  - 官方说个性化广告最初不在欧洲经济区（EEA）和瑞士提供
  - 「无广告」下的具体用量上限，官方只说「更低」、部分功能减少（如图片生成、深度研究），没有给数字
  - 官方截图是 iOS 手机界面（英文），广告示例里的商家是官方演示用的虚构名称；各平台的菜单文字官方也说「可能有所不同」
---

> 本文根据 OpenAI 帮助中心《Ads in ChatGPT》整理，资料核对于 2026-10-14。两张截图引自这篇官方文章，为 iOS 英文界面，广告里的商家是官方演示用的示例。广告的推出范围会变化，请以你账号里实际看到的为准。

## 适用于谁

- 用 ChatGPT 免费版或 Go 版，突然看到回答下面出现「Sponsored」，想弄清是怎么回事的人；
- 想知道广告会不会影响回答、会不会泄露对话的人；
- 想关掉广告个性化，或想「去掉广告」的人。

## 结论先说

1. **哪些套餐有广告**：官方说，**Free 和 Go** 可能出现广告；**Plus、Pro、Business、Enterprise 和 Edu 没有广告**。**不向被识别为未满 18 岁的账号展示广告**。
2. **正在逐步推出**：官方说，广告测试从 2026 年 2 月 9 日在美国开始，现在在选定地区逐步向符合条件的 Free 和 Go 用户推出。看不到广告或「广告设置」，可能是你的地区或账号还不在范围内。
3. **广告不影响回答**：官方明确说，广告运行在与聊天模型分开的系统上，**广告主无法塑造、排序或改变 ChatGPT 的回答**；广告有清楚的「Sponsored」标注，和回答视觉上分开。出现广告也不代表 OpenAI 认可或推荐广告主。
4. **广告主看不到你的对话**：官方说不会把你的对话分享给广告主，也永远不会向广告主出售你的数据；广告主只收到聚合的、不识别个人的数据，比如总浏览量或点击量。
5. **关个性化不等于去掉广告**：关掉个性化后，仍会看到基于你**当前这条聊天**的广告，只是不再用你的其他聊天、广告历史或兴趣主题来挑广告。
6. **想去掉广告，有两条路**：升级到不带广告的套餐（Plus 或 Pro），或者选一个**免费的无广告选项**，代价是用量上限更低、部分功能减少。

![官方截图：iOS 里 ChatGPT 回答下方的广告卡片，标有 Ad；点开「About this ad」可看到为什么看到这条广告以及 Go ad-free 按钮（英文界面）](seed:g907-ads-label-official.png)
*图片来源：[OpenAI 帮助中心：Ads in ChatGPT](https://help.openai.com/en/articles/20001047-ads-in-chatgpt)*

## 一、广告出现在哪、怎么看

官方说明：

- 广告**可以出现在回答的末尾下方**，有清楚的「Sponsored」标注，并与 ChatGPT 的回答在视觉上分开；
- 测试期间，**ChatGPT Atlas 浏览器里不展示广告**；
- **临时聊天不展示广告**（见 [/guides/chatgpt-temporary-chat](/guides/chatgpt-temporary-chat)）；
- 广告不会出现在**敏感或受监管话题**附近，官方举例包括个人健康、心理健康、政治；官方也说目前**不允许政治广告**；
- 测试期间，一条回答下面可能看到一个或多个广告单元；
- 登录之外的体验里展示的广告适合所有受众，成人内容类广告只限符合条件的已登录用户。

### 广告怎么挑的

官方说，广告系统会根据「预期的相关性和结果」选广告，会考虑你**当前对话的上下文和意图**、广告落地页和文案、广告主提供的提示和定向选择，以及在**广告个性化开启**时，你整个 ChatGPT 体验里的**部分信号**。如果有多个合适的广告，会综合相关性和广告主出价等因素决定先展示哪个。

广告个性化开启时，官方说可以用到：当前聊天串，包括个性化的模型回复；你和广告的互动（比如隐藏或点击）；过去的聊天和记忆。不论怎样，**广告主永远收不到**你的聊天、聊天历史、记忆、姓名、邮箱、精确位置、IP 地址或敏感信息（如健康、心理健康、政治话题）。

## 二、在设置里管理广告

官方说明：**设置（Settings）→ Ads controls（广告设置）**。如果你的手机 App 里没有看到，先更新到最新版本。官方还说，广告设置只对**所在地区有广告（或即将有广告）的 Free 和 Go 用户**提供。

![官方截图：iOS 里的 Ads controls 页面：History、Interests、Delete ads data、Personalize ads、Past chats and memory 两个开关、Change plan to go ad-free（英文界面）](seed:g907-ads-controls-official.png)
*图片来源：[OpenAI 帮助中心：Ads in ChatGPT](https://help.openai.com/en/articles/20001047-ads-in-chatgpt)*

从官方截图和说明里能看到这些控制项：

- **History（历史）和 Interests/Topics（兴趣）**：查看你看过或互动过的广告，以及用来让广告更相关的主题；
- **Delete ads data（删除广告数据）**：清除所有广告历史和兴趣数据，**不会影响你的聊天**。官方说，删除后可能需要**最多 30 天**才会从服务器上彻底清除；
- **Personalize ads（个性化广告）**：关掉后广告会没那么贴合你，但**不会去掉广告**；
- **Past chats and memory（过去的聊天和记忆）**：开着时，过去的聊天和记忆可以帮助让广告更相关；关掉后，广告更依赖你当前这条聊天，过去的聊天和记忆不会用来挑广告；
- **Change plan to go ad-free**：切换到「无广告」，见下面。

官方提醒：如果你开着记忆，ChatGPT 可能保存并使用记忆，也可能参考最近的聊天来挑广告；想在聊天时**不使用也不更新记忆**，用临时聊天。记忆本身的管理见 [/guides/chatgpt-memory-full](/guides/chatgpt-memory-full)，数据控制见 [/guides/chatgpt-data-controls-privacy](/guides/chatgpt-data-controls-privacy)。

另外：你对广告的操作（隐藏、举报、查看、点击）**不会被加进你的 ChatGPT 记忆**。但如果你用「Ask ChatGPT」把某条广告分享进对话并就它提问，那段对话在你开着「参考聊天记录」的情况下，可能在以后的聊天里被参考。

### 对某条广告的操作

点广告上的**三个点**，可以：

- **Hide ad**：隐藏不想看的广告；
- **Report ad**：觉得它有误导、不安全、不合适或违反政策，举报；举报同时会把它隐藏，并交给官方审核；
- **About this ad**：看这条广告为什么出现、谁赞助、广告主收到哪些信息；
- **Ask ChatGPT**：把这条广告分享到对话里并提问。官方说，**默认情况下 ChatGPT 看不到展示给你的广告**，要问就要主动分享；广告主无法影响 ChatGPT 对这条被分享的广告的回答。

## 三、想去掉广告：「无广告」或升级

官方说有两种方式：

1. **升级到不带广告的套餐**：Plus 或 Pro。要开通 ChatGPT Plus，可以看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)；各套餐的区别见 [/guides/chatgpt-plans-comparison](/guides/chatgpt-plans-comparison)；
2. **选免费的「无广告」选项**：官方说，这会去掉广告，但**用量上限更低**（每天消息更少），并且**减少部分功能**，比如图片生成、深度研究。

![哪些套餐有广告、怎么避开：Free、Go、付费套餐、未成年人、临时聊天、无广告选项](seed:g907-ads-plans.png)
*图：本站根据 [OpenAI 帮助中心：Ads in ChatGPT](https://help.openai.com/en/articles/20001047-ads-in-chatgpt) 整理的示意图*

### 怎么切到「无广告」（Free 套餐）

官方给的步骤（不同平台措辞可能略有不同）：

1. 打开 ChatGPT 的 **Settings**；
2. 选 **Ads controls**；
3. 点 **Change plan to go ad-free**；
4. 选 **Reduce message limits**（这样会免费去掉广告）；
5. 确认更改。

你会看到一个说明取舍的提示：广告能让更多人获得访问，而在 Free 上去掉广告会降低你的消息上限。

切换后会出现：没有广告；用量上限更低，可能更常触发限额；部分工具可能用不了，比如图片生成或深度研究。遇到限额时，ChatGPT 可能显示一个横幅，让你选择：**升级**（到 Plus 或 Pro），或者 **Show ads**（切回有广告的 Free 以获得更多额度）。要切回，也可以去 **Settings → Ads controls** 里用对应的套餐选项。用量限制的细节见 [/guides/chatgpt-free-plan-limits](/guides/chatgpt-free-plan-limits)。

### Go 套餐能用「无广告」吗？

官方说，**「无广告」是 Free 套餐的选项**。如果你在付费的 Go 上，要么先回到 Free 才能用它，要么升级到本来就没有广告的 Plus 或 Pro。Go 和 Plus 的区别见 [/guides/chatgpt-go-vs-plus](/guides/chatgpt-go-vs-plus)。

## 四、常见疑问

**Q：看到广告，是不是说明 ChatGPT 在推荐这个产品？**
不是。官方说，广告是付费投放，出现广告不代表 OpenAI 认可或推荐这个广告主或它的产品服务。

**Q：广告会不会改变 ChatGPT 的答案？**
官方说不会。广告运行在与聊天模型分开的系统上，广告主不能影响回答；切换到「无广告」也不会改变 ChatGPT 的回答方式。

**Q：广告主能看到我聊了什么吗？**
官方说不能。广告主看不到你的聊天、聊天历史、记忆或个人信息，只会收到聚合的广告表现数据。如果你主动通过广告向广告主发消息，对方只会看到你直接发给它的消息。

**Q：我看不到「广告设置」怎么办？**
官方说，广告设置只对广告所在地区的 Free 和 Go 用户提供；手机 App 看不到的话先更新到最新版本。如果你的地区还没有广告，可能就没有这些选项。

**Q：广告个性化关了，为什么还有广告？**
官方说，关掉个性化只会改变广告的挑选方式，不会去掉广告；去掉广告要选「无广告」或升级。

**Q：我删了广告数据，聊天会被删吗？**
不会。官方说「Delete ads data」只清除广告历史和兴趣数据，不影响你的聊天。

**Q：我是企业或学校用户，会有广告吗？**
官方说 Business、Enterprise、Edu 账号没有广告。

## 参考资料

- OpenAI 帮助中心：Ads in ChatGPT — https://help.openai.com/en/articles/20001047-ads-in-chatgpt
