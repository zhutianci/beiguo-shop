---
title: ChatGPT 搜索怎么用：联网搜索、查看来源与结果不准怎么办
slug: chatgpt-search
products: [chatgpt]
models: []
accountTier: FREE
excerpt: ChatGPT 能联网搜索最新信息并附上来源链接。本文按官方帮助中心讲清怎么手动开启搜索、怎么看引用来源、本地结果不准的原因（位置设置）、搜索按钮不见了怎么排查，以及什么时候该用深度研究。
checkedOn: 2026-10-07
sources:
  - https://help.openai.com/en/articles/9237897-chatgpt-search
  - https://help.openai.com/en/articles/10056348-finding-your-chats-projects-and-files-in-chatgpt
  - https://help.openai.com/en/articles/10500283-deep-research-in-chatgpt
  - https://help.openai.com/en/articles/6825453-chatgpt-release-notes
verify:
  - 手动开启搜索的入口：帮助文章写「View all tools → Search」或输入「/」选择 Search，新版输入框可能在「+」菜单里，以实际界面为准
  - 「来源」「位置」等中文菜单名以实际界面为准
---

> 本文根据 OpenAI 帮助中心《Searching the web with ChatGPT》及相关文章整理，资料核对于 2026-10-07；截图引用自 OpenAI 帮助中心，为英文界面。

## 适用于谁

- 想让 ChatGPT 查今天的新闻、最新价格、天气、比赛结果的人；
- 不确定 ChatGPT 的回答有没有联网、信息是不是过时的人；
- 搜索按钮找不到、或者附近餐厅总推荐到别的城市的人。

## 结论先说

1. **所有套餐都能联网搜索**，包括 Free，甚至不登录也能用；网页、桌面和手机 App 都支持，受套餐额度限制。
2. **两种触发方式**：问题需要最新信息时 ChatGPT 会**自动**搜索；也可以**手动**开启——在输入框的工具菜单里选 **Search（搜索）**，或者输入 `/` 选 Search。已有的回答也可以点重新生成，选 **Search the web（搜索网页）** 用联网结果重答。
3. **看来源**：联网回答里会有引用标记，点开就是原网页；点 **Sources（来源）** 能看到全部引用。
4. **搜索结果可能出错或过时**。重要信息一定要点开来源核对发布时间。
5. **快速查事实用搜索，系统调研用深度研究**。

## 步骤

### 1. 手动开启搜索

1. 打开一个对话；
2. 在输入框打开工具菜单（帮助中心写作 **View all tools**），选 **Search**；
3. 输入问题并发送。

更快的办法：在输入框里打 `/`，从弹出的列表里选 **Search**。

不手动开也没关系——问「今天北京天气怎么样」「最新的 iPhone 是哪款」这类问题时，ChatGPT 通常会自己判断要不要联网。

### 2. 查看和核对来源

- 回答中带有来源标签的句子，点标签可以打开原网页；在电脑网页版上，鼠标悬停就能预览来源标题、发布日期和摘要。
- 点回答下方的 **Sources（来源）**，查看这次回答引用的全部网页以及其他相关链接。
- 回答里出现的图片，点开可以看到图片来源；在手机上，本地类结果还可能显示地图。

![ChatGPT 回答中的来源标签，悬停后显示来源网站名称、文章标题、发布日期和摘要（英文界面）](seed:g114-citation-preview.png)
*图片来源：[OpenAI 帮助中心《Searching the web with ChatGPT》](https://help.openai.com/en/articles/9237897-chatgpt-search)*

官方提醒：搜索结果和引用可能**不完整、过时或错误**。重要的事情要点开来源，确认它真的支持回答里的说法，并看看发布或更新时间；准确度要求高时，优先看权威来源。发现结果不对，可以让 ChatGPT「只看某某官网再搜一次」，或者指定日期、地点重新搜。

### 3. 让本地结果更准

问「附近有什么好吃的」时，ChatGPT 会用你的大致位置：

- **默认**：根据 IP 地址推断大致的国家、省份或城市；
- **可选**：分享设备的精确位置，默认关闭。

结果总是跑到别的城市，可以：

1. 直接在问题里写上城市、区或邮编，这是最简单有效的；
2. 去 **Settings（设置）→ Data controls（数据控制）→ Location（位置）** 查看位置权限；浏览器以前拒绝过的话，在浏览器的 chatgpt.com 网站设置里把「位置」改成允许，再刷新页面；
3. 开着记忆的话，你以前告诉过 ChatGPT 的居住城市也会影响搜索。

官方说明：使用网络代理或特定网络时，根据 IP 推断的位置也可能不准确。

### 4. 搜索按钮不见了 / 提示无法搜索

按官方排查顺序：

1. 新开一个对话，看工具菜单里有没有 **Search**；
2. 更新 ChatGPT App，或者改用浏览器打开 chatgpt.com；
3. 确认登录的是正确的账号或工作区，并且没有用完套餐额度；
4. 公司工作区的话，问管理员是否为你的角色开启了网页搜索。

仍然不行，联系 OpenAI 客服，附上套餐、设备、App 或浏览器版本和完整的错误提示。

## 搜索、深度研究、侧边栏搜索的区别

| | 网页搜索（Search） | 深度研究（Deep research） | 侧边栏搜索 |
| --- | --- | --- | --- |
| 搜什么 | 互联网 | 互联网（及已连接的应用） | 你自己的聊天、项目、文件 |
| 速度 | 快 | 慢，可能要几分钟以上 | 快 |
| 产出 | 简短回答 + 来源链接 | 有引用的长篇报告 | 跳转到对应内容 |
| 适合 | 查一个事实、看最新消息 | 行业调研、竞品分析、文献综述 | 找以前的对话 |

深度研究的用法见 [/guides/chatgpt-deep-research](/guides/chatgpt-deep-research)；找回旧对话见 [/guides/chatgpt-archived-chats-missing](/guides/chatgpt-archived-chats-missing)。

## 隐私：搜索时分享了什么

- ChatGPT 搜索有时会和第三方搜索服务合作，会把你的问题**改写成关键词**发给对方，例如把「附近有什么好餐厅」改写成「某城市 热门餐厅」；
- 会分享根据 IP 推断的**大致位置**，但**不会**分享 IP 地址本身和你的 ChatGPT 账号信息；
- 开着记忆时，改写搜索词可能用到相关记忆（比如你说过自己吃素）；
- ChatGPT 不会在对话内容之外单独保存你的精确位置；回答里的地图会去掉你的精确位置。

## 常见问题

**Q：搜索次数有限制吗？**
官方说明搜索受套餐额度限制，没有公布具体次数。

**Q：语音对话里能搜索吗？**
可以，直接说「帮我搜一下……」，同样计入额度。

**Q：能把 ChatGPT 设成浏览器默认搜索引擎吗？**
可以。在 Chrome 安装官方的「ChatGPT search」扩展后，在地址栏输入内容就会发起 ChatGPT 对话；想用 Google 搜，在关键词前加 `!g`。

**Q：网站怎么出现在 ChatGPT 搜索结果里？**
官方说明需要允许 OAI-SearchBot 抓取网站，并确保服务器或 CDN 放行 OpenAI 公布的搜索爬虫 IP；排名由多种因素决定，不保证收录位置。

## 参考资料

- OpenAI 帮助中心：Searching the web with ChatGPT — https://help.openai.com/en/articles/9237897-chatgpt-search
- OpenAI 帮助中心：Finding your chats, projects, and files in ChatGPT — https://help.openai.com/en/articles/10056348-finding-your-chats-projects-and-files-in-chatgpt
- OpenAI 帮助中心：Deep research in ChatGPT — https://help.openai.com/en/articles/10500283-deep-research-in-chatgpt
- 截图来源：OpenAI 帮助中心（见图下方链接）
