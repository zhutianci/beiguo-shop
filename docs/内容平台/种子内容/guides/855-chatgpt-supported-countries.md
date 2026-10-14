---
title: ChatGPT 支持哪些国家和地区：官方清单怎么查、提示 unsupported country 的含义与出国时的登录问题
slug: chatgpt-supported-countries
products: [chatgpt]
models: []
accountTier: FREE
excerpt: ChatGPT 支持的国家和地区以 OpenAI 帮助中心的官方清单为准，目前列了两百多个国家、地区和属地。本文讲清清单在哪看、亚太常见地区是否在内、注册时提示 unsupported country 是什么意思、官方对清单外访问和付款方式的说法，以及在支持地区却被误判时的官方处理步骤。
checkedOn: 2026-10-13
sources:
  - https://help.openai.com/en/articles/7947663-chatgpt-supported-countries
  - https://help.openai.com/en/articles/8983035-why-cant-i-sign-up-due-to-unsupported-country
  - https://help.openai.com/en/articles/9131992-chatgpt-and-api-services-in-unsupported-countries-and-territories
  - https://help.openai.com/en/articles/9022015-im-traveling-to-a-different-country-and-i-cant-access-chatgpt-or-the-api
  - https://help.openai.com/en/articles/8142208-chatgpt-android-app-faq
  - https://help.openai.com/en/articles/7885016-chatgpt-ios-app-faq
verify:
  - 官方清单条目数（本次核对为 208 条，含属地）会随时增减，正文写「两百多个」
  - 《unsupported country》一文里的注册清单比《Supported Countries》少 20 个属地条目，两份清单口径略有差别，以《ChatGPT Supported Countries》为准
---

> 本文根据 OpenAI 帮助中心《ChatGPT Supported Countries》《Why can't I sign up due to "unsupported country"?》等文章整理，资料核对于 2026-10-13。清单会变动，使用前请以官方页面为准。配图为本站整理的示意图。

## 适用于谁

- 想知道 ChatGPT 在自己所在的国家或地区是否受官方支持的人；
- 注册或生成 API Key 时看到「unsupported country」提示的人；
- 准备出国出差、留学、旅行，想确认到了当地还能不能正常用的人；
- 人在支持的地区，却被提示地区不支持，想知道官方怎么处理的人。

## 结论先说

1. **以官方清单为准**。OpenAI 帮助中心有一篇《ChatGPT Supported Countries》，列出了目前支持访问 ChatGPT 的国家、地区和属地，本次核对时共两百多个条目，网页版和手机 App 用的是同一份清单。
2. **不在清单内的地方，官方不提供服务**。官方的说法是：在清单以外访问或向他人提供访问，**可能导致账号被封锁或停用**；使用清单以外国家的付款方式，也会导致无法使用服务。
3. **「unsupported country」不是故障**，是注册或创建 API Key 时所在地不在清单内的提示。
4. **人在支持地区却被误判**（常见于刚从不支持的地区回来）：官方给的步骤是清除浏览器缓存和 Cookie → 换浏览器或无痕窗口 → 还不行联系客服。

![ChatGPT 官方支持清单：亚太常见国家和地区是否在内的对照图](seed:g855-supported-countries-asia.png)
*图：本站根据 [OpenAI 帮助中心：ChatGPT Supported Countries](https://help.openai.com/en/articles/7947663-chatgpt-supported-countries) 整理的示意图*

## 一、官方清单在哪看

打开 OpenAI 帮助中心（help.openai.com），搜索 **ChatGPT Supported Countries**，或直接访问文末参考资料里的链接。页面里的小标题是「Supported countries & regions on web and mobile」，下面按英文字母顺序列出全部条目。手机 App 的官方 FAQ 也写明：iOS 和安卓 App 的可用范围就是这份清单。

清单是英文的，查的时候用英文国名搜索页面即可（浏览器里按 Ctrl / Cmd + F）。

## 二、清单里有哪些（节选）

完整清单很长，这里只挑中文读者常问的，全部来自本次核对的官方页面：

| 区域 | 在清单内的（节选） |
| --- | --- |
| 东亚 | 日本（Japan）、韩国（South Korea）、台湾（Taiwan）、蒙古（Mongolia） |
| 东南亚 | 新加坡、马来西亚、泰国、越南、菲律宾、印度尼西亚、柬埔寨、老挝、缅甸、文莱 |
| 南亚与中亚 | 印度、巴基斯坦、孟加拉国、尼泊尔、斯里兰卡、哈萨克斯坦 |
| 中东 | 阿联酋、沙特阿拉伯、土耳其 |
| 欧美与大洋洲 | 美国、加拿大、英国、德国、法国、澳大利亚、新西兰等 |

**本次核对时，清单里没有中国大陆、香港和澳门的条目。** 俄罗斯、白俄罗斯等也不在其中。乌克兰的条目后面带有「with certain exceptions（有若干例外）」的说明。

除了国家，清单还包含不少海外属地，比如格陵兰、百慕大、开曼群岛、法属波利尼西亚、新喀里多尼亚等。

## 三、不在清单内会怎样

这部分只转述官方原话，不做延伸：

- 《ChatGPT Supported Countries》开头写着：在清单所列国家和属地之外访问、或向他人提供我们服务的访问，**可能导致你的账号被封锁或停用**；
- 《unsupported countries and territories》一文对「不在支持国家怎么用」的回答同样是这一句；
- 对「付款方式不属于支持国家怎么付」的回答是：使用清单以外国家的付款方式，**会导致你被禁止使用服务**。

也就是说，官方对清单外的访问和付款**没有提供任何可行的办法**，给出的只有风险提示。本文到此为止，不讨论清单外如何使用。账号被停用后的申诉流程见 [/guides/chatgpt-account-deactivated-appeal](/guides/chatgpt-account-deactivated-appeal)。

## 四、提示「unsupported country」是什么意思

官方解释：当你**注册账号**或**创建 API Key** 时所在的位置不在支持清单上，就会看到这个提示。它说明的是地区不在服务范围，不是网络故障，也不是账号问题，刷新、换浏览器都不会改变结果。

手机验证同理：需要验证手机的场景（见 [/guides/chatgpt-change-phone-number](/guides/chatgpt-change-phone-number)），号码也要来自受支持的国家或地区。

## 五、在支持地区，却被提示不支持

![出国旅行前后遇到 ChatGPT 地区提示时的官方处理方式对照图](seed:g855-travel-region-error.png)
*图：本站根据 [OpenAI 帮助中心：I'm traveling to a different country and I can't access ChatGPT or the API](https://help.openai.com/en/articles/9022015-im-traveling-to-a-different-country-and-i-cant-access-chatgpt-or-the-api) 整理的示意图*

官方专门写了一篇旅行相关的说明，要点有三个：

1. **在支持地区注册的账号，到了不支持的地区**：可能登录不了，或用不了服务。官方没有给解决办法，只说明会出现这种情况；
2. **回到支持地区后仍被提示地区不支持**：官方举的例子正是「去过不支持的地区、在当地用设备上过网，回家后再访问 OpenAI 服务」。处理步骤：
   - 先**清除浏览器的缓存和 Cookie**；
   - 再**换一个浏览器或用无痕 / 隐私窗口**访问；
   - 仍然不行，**联系客服**；
3. **以后都用不了了**：官方说可以帮你**取消订阅**。自己能登录的话，取消步骤见 [/guides/chatgpt-cancel-subscription](/guides/chatgpt-cancel-subscription)。

![判断 ChatGPT 是否支持你所在地区的检查清单](seed:g855-region-checklist.png)
*图：本站根据 [OpenAI 帮助中心：ChatGPT Supported Countries](https://help.openai.com/en/articles/7947663-chatgpt-supported-countries) 等文章整理的示意图*

## 常见问题

**Q：清单会变吗？**
会。帮助中心文章会标注更新时间，条目有增有减。重要的安排（长期出国、给团队统一开通）之前，建议当天再看一遍官方页面。

**Q：功能在所有支持地区都一样吗？**
不一样。能注册使用，不代表每个功能都开放。比如本次核对到的两处：用 WhatsApp 接收手机验证码只在 12 个国家提供；仅用手机号注册的方式只对部分国家的新用户开放。其他功能是否可用，以各功能的官方说明为准。

**Q：ChatGPT 和 API 的支持范围相同吗？**
官方在同一篇文章里把 ChatGPT 和 OpenAI API 放在一起说明：两者在不支持的国家和地区访问，都可能导致账号被封锁或停用。API 的详细情况以 platform.openai.com 的文档为准。

**Q：手机 App 在应用商店里搜不到，是地区问题吗？**
有可能。官方说明 App 只在支持清单上的国家和地区提供。怎么辨认官方 App，见 [/guides/chatgpt-official-website-app](/guides/chatgpt-official-website-app)。

**Q：打不开页面、一直转圈，也是地区原因吗？**
不一定。浏览器扩展、网络工具、缓存问题都会造成打不开，排查顺序见 [/guides/chatgpt-cant-open-loading](/guides/chatgpt-cant-open-loading)。

## 参考资料

- OpenAI 帮助中心：ChatGPT Supported Countries — https://help.openai.com/en/articles/7947663-chatgpt-supported-countries
- OpenAI 帮助中心：Why can't I sign up due to "unsupported country"? — https://help.openai.com/en/articles/8983035-why-cant-i-sign-up-due-to-unsupported-country
- OpenAI 帮助中心：ChatGPT and API services in unsupported countries and territories — https://help.openai.com/en/articles/9131992-chatgpt-and-api-services-in-unsupported-countries-and-territories
- OpenAI 帮助中心：I'm traveling to a different country and I can't access ChatGPT or the API — https://help.openai.com/en/articles/9022015-im-traveling-to-a-different-country-and-i-cant-access-chatgpt-or-the-api
- OpenAI 帮助中心：ChatGPT Android App FAQ — https://help.openai.com/en/articles/8142208-chatgpt-android-app-faq
- OpenAI 帮助中心：ChatGPT iOS App FAQ — https://help.openai.com/en/articles/7885016-chatgpt-ios-app-faq
