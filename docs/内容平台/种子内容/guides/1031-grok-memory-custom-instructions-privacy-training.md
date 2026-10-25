---
title: Grok 记忆、自定义指令与隐私：训练开关、Private Chat、删除对话怎么设置
slug: grok-memory-custom-instructions-privacy-training
products: [grok]
models: []
accountTier: OTHER
excerpt: Grok 的对话会被拿去训练吗？官方说你可以在 设置 → Data 里关闭「Improve the Model」，也可以用右上角幽灵图标的 Private Chat。本文按官方隐私 FAQ 讲训练开关、个性化、删除对话与分享链接，并说明记忆和自定义指令官方公开了什么。
checkedOn: 2026-10-25
sources:
  - https://x.ai/legal/faq
  - https://x.ai/grok
  - https://docs.x.ai/grok/faq
  - https://docs.x.ai/build/settings/reference
verify:
  - 官方 x.ai/grok 页面的功能清单里列有「Memory across chats（跨对话记忆）」和「Custom instructions（自定义指令）」，但官方公开文档里没有这两项的操作步骤、入口位置和限制，所以本文不写具体按钮，只写官方说了什么
  - 官方隐私 FAQ 里的设置路径：手机 App 是 Settings → Data Controls，网页是 Settings → Data；官方示例截图的版本与你的界面可能略有差异
  - 示例截图里开关的开启或关闭状态只是官方示例，不代表默认值；官方 FAQ 没有写默认是开还是关，请以自己账号里显示的为准
  - Private Chat 官方写「where available（视情况提供）」，对话不显示在历史里，并在 30 天内从系统删除；删除对话与账号同样是最多 30 天内删除
  - Grok Build 命令行里的跨会话记忆（grok memory clear）是另一个产品，官方设置参考写明默认关闭，本文只作区分提示
  - 在 X 里使用 Grok 的隐私设置走 X 帮助中心，不在本文范围
---

> 本文根据 Grok 官方隐私与使用 FAQ（x.ai/legal/faq）、产品页和 docs.x.ai 整理，资料核对于 2026-10-25。设置入口可能随版本变化，**以官方页面和你的界面为准**。图为官方示例截图和本站整理的清单。

## 适用于谁

- 搜「grok隐私」「grok怎么关闭训练」「grok删除对话」的人；
- 想知道 Grok 有没有记忆功能、自定义指令怎么设的人；
- 担心聊天内容被分享链接泄露的人。

## 结论先说

1. **训练开关**：官方说你可以决定自己的数据是否用于训练 Grok。网页在 **设置 → Data → Improve the Model**，手机 App 在 **设置 → Data Controls → Improve the model**。关闭后，**新的**对话不会被用来训练。
2. **不想留痕用 Private Chat**：界面右上角的幽灵形状图标。官方说用 Private Chat 时对话不会显示在你的历史里，会在 30 天内从系统删除，且不用于训练。
3. **个性化**：设置里的 **Personalize Grok using X** 开关，决定是否允许用你的 X 数据（资料、位置、设置、偏好、你账号上可见的帖子）来个性化 Grok。
4. **记忆和自定义指令**：官方产品页的功能清单里有「跨对话记忆」和「自定义指令」，但公开文档没有写具体怎么开、在哪设，所以这里不编造步骤，见第三节。
5. **删除**：可删单个对话、删全部对话、删账号，官方说删除后最多需要 30 天才会从系统里彻底清除。

![官方示例：网页版 Settings → Data 页的数据控制项](seed:g1031-grok-web-data-controls.jpg)
*图片来源：[x.ai 隐私与使用 FAQ](https://x.ai/legal/faq)，官方示例截图；开关状态只是示例*

## 一、怎么设置训练开关和个性化

官方 FAQ 给的路径：

- **网页 grok.com**：Settings → Data，里面有 Improve the Model、Personalize Grok using X、导出账号数据、删除全部对话、删除账号；
- **手机 App**：Settings → Data Controls，同样有这些项目。

![官方示例：手机 App 的 Data Controls 页](seed:g1031-grok-app-data-controls.jpg)
*图片来源：[x.ai 隐私与使用 FAQ](https://x.ai/legal/faq)，官方示例截图*

官方写的几条限制：

- 关闭训练后，只影响**之后**的新对话；
- 即使关闭，你之后主动给回答点评、提交反馈，这些反馈仍可能用于训练；
- 不登录就用 Grok 时，内容可能被匿名收集，在部分地区（欧盟、英国除外）没有关闭训练的选项；
- 企业和商业客户的内容不用于改进模型，这是另一套条款；
- 如果你是在 X 里用 Grok，训练和个性化要去 X 的帮助中心设置。

官方还提醒：为保护隐私，不要在向 Grok 提的问题里放个人或敏感信息。另外官方 FAQ 说明，少量授权人员可能出于改进模型、调查安全事件、满足法律义务等目的查看对话。

## 二、删除对话、导出数据、分享链接

| 想做的事 | 官方给的做法 |
| --- | --- |
| 删某一个对话 | 网页：历史页点对话旁的垃圾桶；手机：点头像进历史，长按对话名，选 Delete Conversation |
| 删全部对话 | 手机：Settings → Data Controls → Delete All Conversations；网页：Settings 里对应按钮 |
| 删账号 | 同样在设置里；官方 FAQ 另说可在 accounts.x.ai/account 操作，30 天内重新登录并确认可恢复账号 |
| 导出数据 | Settings 里的 Export Account Data（手机端叫 Export Data） |
| 看历史 | 网页右上角带搜索的三横线图标；iOS 点左上角头像 |
| 撤销分享链接 | 登录后打开 grok.com/share-links，点 Remove |
| 释放文件空间 | 网页 grok.com/files |

关于**分享链接**，官方有个提醒：任何你生成的链接，拿到链接的人都能看；如果你把链接发到社交平台，可能被搜索引擎收录，和其他公开内容一样。不想继续公开，就去 share-links 页面移除。

![Grok 隐私相关设置清单](seed:g1031-grok-privacy-checklist.png)
*图：本站根据 [x.ai 隐私与使用 FAQ](https://x.ai/legal/faq) 整理的示意图*

## 三、记忆和自定义指令：官方公开了什么

官方 x.ai/grok 页面的功能清单里有两项：

- **Memory across chats**：记住你的偏好和过往对话；
- **Custom instructions**：按你的风格和需要定制回答。

官方隐私 FAQ 另外说明，你可以通过选择功能（比如不同的人设）、措辞和语气来决定 Grok 怎么回答。

但是，docs.x.ai 的 Grok FAQ 和隐私 FAQ 里**没有**这两项功能的操作步骤，所以我们无法告诉你「点哪里开启」。建议直接在你的 Grok 设置里看看有没有 **Customize** 之类的页面（官方示例截图里设置左侧栏有 Account、Appearance、Customize、Data 四项）。

需要区分：Grok 的编程命令行工具 **Grok Build** 另有「跨会话记忆」功能，官方设置参考写明默认关闭，并提供 `grok memory clear` 命令清除。这是另一个产品，不是聊天里的记忆。

## 四、相关文章

- 免费版和限额见 [/guides/grok-free-usage-how-much](/guides/grok-free-usage-how-much)；
- 订阅、取消订阅见 [/guides/grok-how-to-subscribe-download](/guides/grok-how-to-subscribe-download) 和 [/guides/grok-cancel-subscription](/guides/grok-cancel-subscription)；
- Grok 和 X 账号关联见 [/guides/grok-how-to-use-x-account-weekly-usage](/guides/grok-how-to-use-x-account-weekly-usage)；
- 需要开通 Grok 订阅可看 [/chongzhi/grok-super](/chongzhi/grok-super)。

## 参考资料

- Grok 官方：隐私与使用 FAQ — https://x.ai/legal/faq
- Grok 官方：Grok — https://x.ai/grok
- docs.x.ai：Grok FAQ — https://docs.x.ai/grok/faq
- docs.x.ai：Grok Build 设置参考 — https://docs.x.ai/build/settings/reference
