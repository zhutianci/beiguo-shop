---
title: ChatGPT Sites 怎么用：Sites 是什么、把对话做成网页、发布分享与自定义域名
slug: chatgpt-sites
products: [chatgpt]
models: []
accountTier: PLUS
excerpt: ChatGPT Sites 是什么、怎么用？按 OpenAI 帮助中心和官方文档讲清哪些套餐和地区可用、在 Work 或 Codex 里怎么创建网站、预览与发布的区别、分享权限、改网址与自定义域名，以及使用限制。
checkedOn: 2026-10-07
sources:
  - https://help.openai.com/en/articles/20001339-creating-and-using-chatgpt-sites
  - https://learn.chatgpt.com/docs/sites
  - https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan
  - https://learn.chatgpt.com/docs/pricing
  - https://help.openai.com/en/articles/6825453-chatgpt-release-notes
  - https://help.openai.com/en/articles/20001340-chatgpt-sites-complying-with-data-protection-laws
verify:
  - 收款说法两处不一致：帮助中心写「可以通过第三方支付服务商销售商品或收款」，官方开发者文档写「不要用 Sites 进行金融交易」，正文只提示以最新条款为准
  - 地区限制：帮助中心 Codex 文章写 Sites 目前不在欧洲经济区、瑞士、英国提供；2026-07-09 发布说明写的是「公开发布和扩大的测试版」在这些地区上线时不提供，以官方最新说明为准
  - 各套餐的测试期用量上限官方未公布具体数字（产品内显示）
  - 「More → Sites」「Who has access」等中文界面名称未核实
---

> 本文根据 OpenAI 帮助中心《Creating and using ChatGPT Sites》、官方文档（learn.chatgpt.com）《Sites》、Codex 定价页和发布说明整理，资料核对于 2026-10-07。Sites 仍是**公开测试版（public beta）**，功能和限制可能变化。

## 适用于谁

- 想把一段对话、一份资料、一个想法直接变成能分享的网页的人（活动页、项目看板、作品集、小游戏）；
- 想给团队做个内部小工具（需求登记、文档查找、问题看板），又不想自己搭服务器的人；
- 搜「ChatGPT Sites 是什么」「ChatGPT Sites 怎么用」的人。

## 结论先说

1. **ChatGPT Sites** 让 ChatGPT 帮你生成、托管、修改并分享网站、轻量 Web 应用和游戏，不需要另外搭部署流程。2026 年 7 月 9 日起以公开测试版推出。
2. **谁能用**：Plus、Pro、Business、Enterprise、Edu；**Free 和 Go 不能用**。Enterprise 需要管理员开启，公开发布默认关闭。帮助中心的 Codex 文章写明 Sites 目前**不在欧洲经济区、瑞士和英国**提供。测试期间包含在套餐里，但有按套餐的用量上限。
3. **在哪做**：网页版选 **Work**；桌面 App 选 **ChatGPT → Work**，或者选 **Codex**。在提示里写上「网站（website）」或 `@Sites` 就会进入 Sites 流程。旧版 ChatGPT Classic 桌面 App 不支持。
4. **先预览，再发布**：ChatGPT 会先给你一个私有预览；**每一次部署生成的网址都是正式线上地址**，想先检查就让它「保存一个版本，先不部署」。
5. **新建的网站默认只有你（和工作区管理员）能看**，在 **Share** 里选择开放给谁之后才算发布出去。

## 步骤

### 1. 描述你要的网站

在 Work 或 Codex 里写清楚：给谁看、做什么用、需要哪些功能、用哪些资料。可以附上文件、数据、链接和限制条件。例如：

```
帮我做一个网站：展示我们读书会 10 月的 4 本书，每本书一张卡片（封面占位图、作者、一句话推荐、讨论日期），顶部有报名表单（姓名、想读哪本），报名数据要保存下来，下次打开还在。手机上也要好看。
```

几条官方建议：

- 需要**长期保存的数据**（报名记录、游戏分数）或**上传的文件**，要在需求里说出来，Sites 会相应配上数据库（D1）或文件存储（R2）；
- 主题颜色、关掉的提示条这种临时状态不需要持久存储；
- 内部工具需要知道「当前是谁在用」，就要求用工作区账号登录；面向公众的网站可以加「Sign in with ChatGPT」（用 ChatGPT 账号登录）。

### 2. 预览和修改

ChatGPT 生成预览后，检查内容和交互是否符合预期、数据处理对不对。不满意就继续说要改哪里——文案、布局、颜色、链接、表单、交互都可以；网页版可以在预览里点 **Edit**，在 **Describe website edits** 里描述修改，必要时附截图或文件。

### 3. 选择谁能访问，然后发布

1. 打开网站预览，点 **Share**；
2. 在 **Who has access** 里选一个（可选项取决于套餐和工作区设置）：
   - 只有所有者和工作区管理员；
   - 指定的用户或群组，以及按邮箱邀请的外部访客；
   - 工作区内所有人；
   - **互联网上任何人**（仅在允许公开发布时出现）；
3. 点 **Publish**；上线后用 **Visit** 打开，或 **Copy link** 复制网址分享。

按邮箱邀请的外部访客只能查看，不能编辑或发布，需要用收到邀请的那个账号登录才能打开。选「任何人」就是公开网站，发布前请仔细检查内容。

### 4. 以后去哪找、怎么改

- 网页版：**More → Sites**，或直接打开 https://chatgpt.com/sites ；桌面 App：侧边栏的 **Sites**；
- 改网站：回到创建它的对话，或在 Sites 列表里点编辑图标，描述修改、看新预览，**确认后再发布新版本**；
- Plus / Pro 的网站所有者和编辑者，还可以在电脑浏览器里打开已发布的网站，点 **Edit site** 直接写修改意见，再回到 ChatGPT 继续（这一步不会立刻改动线上网站）。

## 进阶功能

| 功能 | 说明 |
|---|---|
| 访问统计 | **More actions → Analytics** 查看独立访客和页面浏览量趋势，不用自己装统计代码（Enterprise 工作区拥有的网站暂不提供） |
| 改网址 | 网站设置里 **Change URL**：至少 5 个字符，小写字母开头，只能用小写字母、数字和单个连字符，不能以连字符结尾；旧地址会自动跳转到新地址 |
| 自定义域名 | 设置里 **Add domain**，填你**已经拥有**的主域名或子域名，把 Sites 给出的 DNS 记录加到域名服务商那里，等几分钟后刷新状态；Sites 不帮你注册域名，Enterprise 工作区上线时不支持 |
| 定时更新 | 网站的 **Automations → Create schedule**，让它定期在云端更新内容 |
| 多人编辑 | 需要工作区：所有者可以把同工作区成员设为 **Can edit**；首次发布必须由所有者完成；编辑者能读到网站数据库里的线上数据，只邀请你信任的人 |
| 环境变量与密钥 | 在网站设置里添加，**不要把密钥写进提示、附件或网站内容** |
| 读取连接应用 | Business / Enterprise 工作区可以做读取访客自己连接应用（如问题跟踪系统）的内部工具，每个访客用自己的账号和权限 |

存储上限：每个网站的 D1 数据库 10 GB，R2 文件存储没有固定上限。支持 HTTP、HTTPS 和 WebSocket，不支持原始 TCP 连接。

## 下线和删除

- 只想暂时不让别人看：在 **Share** 里把访问范围收回到只有自己或指定的人；
- 永久删除：在 Sites 里找到网站，点 **Delete site**，输入网站的 slug，再点 **Permanently delete**。**删除后无法恢复**。

## 使用限制与注意事项

- 不能用来处理受保护的健康信息或银行卡数据、面向 13 岁以下儿童、传播恶意软件、钓鱼、冒充他人或机构，或其他违反 OpenAI 使用政策和 Sites 条款的用途。涉及收款、交易的，请先看最新的 Sites 条款（官方两份文档说法不完全一致）。
- 你的网站如果收集访客的个人信息（表单、留言板、登录），你要负责遵守适用的隐私和数据保护法律，官方建议准备隐私政策。
- 测试期达到套餐上限时，可能无法新建网站、增加存储，或让高流量网站保持公开，但已有网站仍可编辑和管理。
- 不支持数据驻留 / 推理驻留。
- Free、Go、Plus、Pro 用户如果开着「Improve the model for everyone」（为所有人改进模型），创建和编辑网站的对话可能被用于训练；Business / Enterprise / Edu 默认不用于训练。

需要 Plus 的话可以看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

## 常见问题

**Q：为什么我找不到 Sites？**
依次确认：套餐不是 Free / Go；不在暂不提供的地区；登录的是正确的账号或工作区；用的是新版 ChatGPT 桌面 App 而不是 ChatGPT Classic；Enterprise 用户问管理员是否为你的角色开启了 Sites。也可能还没推送到你的账号。

**Q：Enterprise 工作区为什么不能公开发布？**
Enterprise 默认关闭公开发布，需要管理员开启并给对应角色授权。

**Q：别人打不开我分享的网站？**
网站必须已分享给对方、对其工作区开放或公开发布；受邀访客要用收到邀请的账号登录。修改分享设置后，建议用访客的身份实际打开测一次。

**Q：网站被下线了怎么办？**
OpenAI 可能下线有违反政策风险的网站。认为是误判，可以用通知邮件里的链接申诉；在工作区里的，管理员也可能停用网站。

**Q：Sites 和 Work 里生成的文件有什么不同？**
Work 生成的文档、表格、PPT 是可下载的文件（见 [ChatGPT 生成 Word、Excel、PPT](/guides/chatgpt-create-word-excel-ppt)）；Sites 是托管在线上、带网址、可以持续更新的网站。Work 和 Codex 怎么选见 [ChatGPT Work 和 Codex 的区别](/guides/chatgpt-work-vs-codex)。

## 参考资料

- OpenAI 帮助中心：Creating and using ChatGPT Sites — https://help.openai.com/en/articles/20001339-creating-and-using-chatgpt-sites
- 官方文档：Sites — https://learn.chatgpt.com/docs/sites
- OpenAI 帮助中心：Using Codex with your ChatGPT plan（Sites in Codex，地区说明）— https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan
- Codex 官方定价页（How much does Sites cost）— https://learn.chatgpt.com/docs/pricing
- ChatGPT Release Notes（2026-07-09 Sites 公开测试、2026-08-20 改网址、2026-09-29 Edit site 与定时更新）— https://help.openai.com/en/articles/6825453-chatgpt-release-notes
- OpenAI 帮助中心：ChatGPT Sites: Complying with data protection laws — https://help.openai.com/en/articles/20001340-chatgpt-sites-complying-with-data-protection-laws
