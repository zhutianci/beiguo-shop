---
title: ChatGPT 购物研究怎么用：从选商品到拿到购买指南，结果准不准、和普通购物结果的区别
slug: chatgpt-shopping-research
products: [chatgpt]
models: []
accountTier: FREE
excerpt: ChatGPT 的购物研究（shopping research）能帮你比较商品、列出取舍，最后给一份个性化的购买指南。本文按官方帮助中心讲清现在从哪里启动、过程中怎么调整、指南里有什么、价格和库存为什么可能不准，以及虚拟试穿、收藏商品这些相关功能。
checkedOn: 2026-10-13
sources:
  - https://help.openai.com/en/articles/12911370-using-shopping-research-in-chatgpt
  - https://help.openai.com/en/articles/11128490-shopping-with-chatgpt-search
  - https://help.openai.com/en/articles/6825453-chatgpt-release-notes
  - https://help.openai.com/en/articles/20001052-using-library-to-manage-files-in-chatgpt
verify:
  - 启动方式：现行帮助文章只写了「选中对话里的商品后点 Research」；2025-11 发布时的独立入口是否还在，以实际界面为准
  - 现行帮助文章没有列出套餐与次数限制；发布说明（2025-11-24）写的是面向登录的 Free、Go、Plus、Pro 用户
  - 商品结果以海外商家为主，能否覆盖你常用的购物平台以实际结果为准
---

> 本文根据 OpenAI 帮助中心《Using shopping research in ChatGPT》《Shopping with ChatGPT Search》和 ChatGPT 发布说明整理，资料核对于 2026-10-13。官方这两篇文章没有配界面截图，文中配图为本站整理的示意图。

## 适用于谁

- 要买的东西选项多、参数看不懂，想让 ChatGPT 帮忙比较的人；
- 看到商品卡片上有个 **Research** 按钮，不知道点了会发生什么的人；
- 想知道 ChatGPT 推荐的商品是不是广告、价格靠不靠谱的人。

## 结论先说

1. **购物研究是什么**：一种交互式的选购流程，适合需要比较、取舍、条件比较多的购买决定。它会先追问你的需求，再花几分钟查找和对比，最后给一份**购买指南（buyer's guide）**。
2. **从哪里启动**：现行官方文章写的是——**在对话里已经出现的商品上，选中一个或多个，点「Research」**。
3. **不是广告**：官方说明结果是自然结果，基于公开的零售网站，**你的聊天不会分享给商家**；广告是另外一套东西。
4. **会出错**：价格、库存、折扣变化很快，官方明确要求下单前到商家网站核对。
5. 2025 年 11 月发布时，官方写的是网页、iOS、安卓上登录的 Free、Go、Plus、Pro 用户都能用。

## 步骤

![ChatGPT 购物研究的 5 步](seed:g808-shopping-research-steps.png)
*图：本站根据 [OpenAI 帮助中心：Using shopping research in ChatGPT](https://help.openai.com/en/articles/12911370-using-shopping-research-in-chatgpt) 整理的示意图*

### 1. 先让对话里出现商品

当你的问题带有购物意图时，ChatGPT 会直接展示商品选项：图片、商品详情，以及可以进一步了解或购买的网站链接。所以第一步就是正常提问，把用途、预算和在意的点说清楚，例如：

```
我想给小户型买一台无线吸尘器，预算 2000 元以内，最在意噪音小和续航，家里有猫。
```

### 2. 选中商品，点 Research

在出现的商品里选中一个或多个，点 **Research**，可以让它比较这几样，或者找替代品。

### 3. 回答追问

研究开始时，ChatGPT 会问几个澄清问题，比如偏好的品牌、尺寸范围，更看重性能、舒适度、款式还是价格。官方说明，认真回答这些追问能让研究更聚焦、推荐更贴合。

如果你开着**记忆（Memory）**，购物研究会用上 ChatGPT 已经知道的关于你的信息——官方举的例子是：它知道你喜欢玩游戏，推荐笔记本或配件时就会把这点考虑进去。

### 4. 边找边调整

需求明确后，ChatGPT 开始多步骤地查找商品。过程中找到的商品会陆续出现，你可以**实时操作**：

- 把不想要的移除；
- 让它找「类似这个」的；
- 修改条件，比如把预算压低、排除某个品牌。

你也可以什么都不做，搜索会自己继续。商品可以并排比较价格、功能、评价等关键信息。

### 5. 阅读购买指南

几分钟后，购物研究会交一份为你定制的书面总结，通常包括：

- **买这类东西要看什么**：用大白话解释，把技术参数翻译成实际影响；
- **少量首选**：每个都写明为什么适合你、主要优点、要做的取舍，并附上目前在售商家的链接；
- **并排对比**：价格、尺寸、核心功能，以及你提过的限制条件，常以表格或结构化段落呈现；
- **更多候选**：一个可滚动的列表，列出其他也符合条件的商品。

指南出来后可以继续聊，比如「只看便宜的」「去掉某个品牌」「改成出差用而不是家用」，它会调整，必要时再做有针对性的搜索。

## 下单之前

![照着购买指南下单前先核对的 5 件事](seed:g808-before-buy-check.png)
*图：本站根据 [OpenAI 帮助中心：Using shopping research in ChatGPT](https://help.openai.com/en/articles/12911370-using-shopping-research-in-chatgpt) 整理的示意图*

官方的原话是：购物研究实时读取商家和其他公开网站的信息，但仍然可能出错；价格和是否有货，**最终以商家网站为准**。另外，有些商家会阻止自动访问，这时购物研究会跳过这些来源，或者改用有类似商品的其他网站——所以「没列出来」不等于「没有更好的」。

## 购物研究和普通购物结果有什么不同

![ChatGPT 购物结果和购物研究的区别](seed:g808-shopping-compare.png)
*图：本站根据 OpenAI 帮助中心 [Shopping with ChatGPT Search](https://help.openai.com/en/articles/11128490-shopping-with-chatgpt-search) 与 [Using shopping research in ChatGPT](https://help.openai.com/en/articles/12911370-using-shopping-research-in-chatgpt) 整理的示意图*

关于普通购物结果，官方《Shopping with ChatGPT Search》还说明了几件容易误解的事：

- **标签不是保证**：商品图上的「Budget-friendly（实惠）」「Most popular（最受欢迎）」等标签是 ChatGPT 根据可获得的信息生成的，不是经过验证的结论。比如「实惠」可能只是评价里常有人说性价比高，不一定是最低价；
- **首屏价格不一定最低**：回答里先显示的通常是列表中第一个商家的价格。点进商品后会看到更多商家，其中 ChatGPT 所知的最低价可能标为 **Best price**；
- **评价摘要是模型生成的**：依据公开网站上的评价汇总，评价和评分未经 OpenAI 核实；
- **不是所有商品都会展示**，买之前自己确认是否符合需要。

## 相关功能

- **虚拟试穿（Try on）**：服饰和配饰的商品卡片上有 **Try on** 按钮，点它 → 拍一张或上传一张自拍 → 查看生成的试穿图。官方提醒试穿图不保证合身或尺码准确。参考照片会保存起来供下次使用，可以在 **Settings（设置）→ Personalization（个性化）→ Reference photos（参考照片）** 里更换或删除；
- **收藏商品**：点商品上的书签图标存入 **Favorites（收藏）**，也可以新建文件夹归类，之后到文件库里查看，见 [/guides/chatgpt-library-files](/guides/chatgpt-library-files)；
- **Instant Checkout（即时结账）**：官方说明对部分符合条件的商品和商家，可能出现在 ChatGPT 里直接完成结账的选项，是否出现取决于商品和商家。

## 常见问题

**Q：推荐的商品是广告吗？商家付钱了吗？**
官方说明：商品结果由 ChatGPT 独立选择，不是广告，也不受 OpenAI 合作关系影响；购物研究的结果是自然结果。广告是分开的，Go 等套餐的广告情况见 [/guides/chatgpt-go-vs-plus](/guides/chatgpt-go-vs-plus)。

**Q：我的聊天会被发给商家吗？**
不会。官方写明你的聊天留在 ChatGPT，不会分享给零售商。

**Q：能关掉个性化吗？**
能。购物研究可能使用记忆来贴合推荐，你可以随时在个性化设置里关闭或清除记忆；关掉之后它照样能用，只是少一些个性化。记忆的管理见 [/guides/chatgpt-memory-full](/guides/chatgpt-memory-full)。

**Q：结果明显不对或者过时了怎么办？**
直接告诉 ChatGPT 哪里不对，让它带着新条件重新查。价格和库存仍然以商家页面为准。

**Q：购物研究和深度研究是一回事吗？**
不是。购物研究专门用于选购商品，产出购买指南；深度研究用于一般性的调研，产出带引用的报告，见 [/guides/chatgpt-deep-research](/guides/chatgpt-deep-research)。只想快速查个价格或参数，用普通的联网搜索就够了，见 [/guides/chatgpt-search](/guides/chatgpt-search)。

## 参考资料

- OpenAI 帮助中心：Using shopping research in ChatGPT — https://help.openai.com/en/articles/12911370-using-shopping-research-in-chatgpt
- OpenAI 帮助中心：Shopping with ChatGPT Search — https://help.openai.com/en/articles/11128490-shopping-with-chatgpt-search
- ChatGPT Release Notes（2025-11-24 购物研究发布）— https://help.openai.com/en/articles/6825453-chatgpt-release-notes
- OpenAI 帮助中心：Using Library to manage files in ChatGPT — https://help.openai.com/en/articles/20001052-using-library-to-manage-files-in-chatgpt
