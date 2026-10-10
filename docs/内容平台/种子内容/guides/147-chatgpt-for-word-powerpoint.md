---
title: ChatGPT for Word 和 PowerPoint 怎么用：在 Office 里安装 ChatGPT 加载项（插件）
slug: chatgpt-for-word-powerpoint
products: [chatgpt]
models: []
accountTier: FREE
excerpt: ChatGPT 有官方的 Word 和 PowerPoint 加载项（插件），和 Excel 共用一个，Free 也能装。按 OpenAI 帮助中心讲清怎么安装、怎么在侧边栏改文档和做幻灯片、额度怎么算、公司电脑找不到怎么办和目前的限制。
checkedOn: 2026-10-07
sources:
  - https://help.openai.com/en/articles/20001526-chatgpt-for-word
  - https://help.openai.com/en/articles/20001242-chatgpt-for-powerpoint
  - https://help.openai.com/en/articles/12642688-using-credits-for-flexible-usage-in-chatgpt-personal-plans
  - https://marketplace.microsoft.com/en-us/product/office/WA200010215
  - https://help.openai.com/en/articles/6825453-chatgpt-release-notes
  - https://chatgpt.com/apps/spreadsheets/
verify:
  - Word 帮助文章写「2026-10-01 起 ChatGPT for Word 将默认开启」，未说明指工作区管理员设置还是所有用户，正文按工作区设置理解
  - Word 文章写插件里不支持 Plugins，PowerPoint 文章写「在支持的情况下可以用插件」，两者不同，正文分别说明
  - Office 中文界面里「加载项 / 我的加载项」的具体名称以 Office 版本为准
  - 配图是 Excel 里的加载项菜单（官方宣传图），Word / PowerPoint 的入口位置相同但未找到官方截图
---

> 本文根据 OpenAI 帮助中心《ChatGPT for Word》《ChatGPT for PowerPoint》、credits 说明、Microsoft Marketplace 上的官方加载项页面和发布说明整理，资料核对于 2026-10-07；截图引用自 ChatGPT 官网，为英文界面。

## 适用于谁

- 天天用 Word 写报告、方案、合同，想在文档旁边直接让 ChatGPT 改写、总结、调格式的人；
- 要做汇报 PPT，想从笔记、文档直接生成可编辑幻灯片的人；
- 搜「ChatGPT Word 插件」「ChatGPT Word 增益集」，想找官方版本、避开来路不明插件的人。

Excel 和 Google 表格的用法见 [ChatGPT 分析 Excel 数据](/guides/chatgpt-excel-data-analysis)。

## 结论先说

1. **官方加载项**：OpenAI 在 Microsoft Marketplace 上架了一个名为「ChatGPT」的 Microsoft 加载项（add-in），**装一次，Word、Excel、PowerPoint 三个都能用**，不需要分别安装。
2. **Free 也能用**：ChatGPT for Word（2026 年 9 月 17 日推出）覆盖所有套餐；ChatGPT for PowerPoint（2026 年 7 月 6 日正式上线）覆盖 Free、Go、Plus、Pro、Business、Enterprise、Edu、K-12，Free 和 Go 是有限用量。
3. **怎么装**：Office 里 **开始（Home）→ 加载项（Add-ins）→ 搜索 ChatGPT → 添加**，再从功能区打开 ChatGPT，用 ChatGPT 账号登录。
4. **额度**：在 Plus / Pro 上，Word 和 PowerPoint 都从和 Codex、ChatGPT Work **共用的智能体额度**里扣，按 token 计费；超出后可以用 credits 继续。
5. **对话不互通**：加载项里的对话不进 ChatGPT 聊天记录，ChatGPT 的记忆也不会带进来。

## 步骤

### 1. 安装加载项

**方法一：在 Office 里装（PowerPoint 帮助文章给的方法，Word 同理）**

1. 打开 Word 或 PowerPoint；
2. 点 **开始（Home）** 选项卡；
3. 点 **加载项（Add-ins）**，搜索 **ChatGPT**；
4. 添加后，从功能区打开 **ChatGPT**；
5. 用有权限的 ChatGPT 账号登录；如果用的是公司或学校的工作区，登录时选中那个工作区。

![Office 功能区「Home」下的「Add-ins」按钮，弹出「My Add-ins」列表里的 ChatGPT 加载项（官方宣传图，此图为 Excel，Word 和 PowerPoint 入口相同，英文界面）](seed:g147-office-addins-menu.jpg)
*图片来源：[ChatGPT 官网《ChatGPT for Excel and Google Sheets》](https://chatgpt.com/apps/spreadsheets/)*

**方法二：从 Microsoft Marketplace 网页装**

打开官方加载项页面 https://marketplace.microsoft.com/en-us/product/office/WA200010215 ，点 **Get it now**，按提示完成安装，然后回到 Word 从功能区打开 ChatGPT 登录。

认准发布者是 OpenAI 的这个加载项，不要安装名字相似的第三方插件。

### 2. 在 Word 里用

ChatGPT 会出现在 Word 右侧的侧边栏里，能读你当前打开的文档。

- **改一段**：先在 Word 里选中文字，再说要怎么改，并写明哪些不能变；
- **大改动**：先让它给提纲或说明打算怎么改，确认后再动手；
- **从素材起草**：把笔记或原文粘进提示里，让它据此写初稿。

可以直接用的提问：

```
为这份文档写一段执行摘要，包含结论建议和主要风险，300 字以内。
```

```
把这一节改写给管理层看，压缩到一半篇幅，保留所有数据和已定义的术语。
```

```
把下面这些会议笔记整理成一份给客户的备忘录，用清晰的小标题：[粘贴笔记]
```

```
检查全文前后不一致的术语，列出位置并给出统一建议，先不要直接修改。
```

Word 里还能用**技能（Skills）**复用常用流程（如备忘录起草、格式整理、合同审阅），以及通过**应用**引入 Outlook、SharePoint、Google Workspace、Dropbox 等服务里的资料（取决于套餐和权限）。帮助中心写明 Word 加载项**目前不支持 Plugins**。

模型方面（credits 说明）：Word 里 Free 和 Go 使用 GPT-5.6 Luna；Plus 和 Pro 可以在 GPT-5.6 Luna、Terra、Sol、GPT-6 Astra 四个里选，默认 GPT-5.6 Sol。

### 3. 在 PowerPoint 里用

PowerPoint 版能从资料生成初稿、在现有演示稿里增改幻灯片、回答关于整份演示「讲了什么故事、缺什么」的问题，并尽量保留可编辑的幻灯片结构。

官方建议的写法：说清楚**改什么、保留什么、改在哪**；大改先要计划；需要基于资料的就附上资料。示例：

```
在「市场概况」那页后面加一页「风险」，沿用这份演示稿的样式，不要改动前后的幻灯片。
```

```
动手之前，先列出你打算改哪几页、为什么。
```

```
根据这些笔记和 KPI 做一份 10 页的董事会汇报。
```

```
把这份备忘录改成 5 页幻灯片。
```

点侧边栏的 **+** 可以浏览技能（Skills）和应用，或在提示里用 **@** 调用某个技能；在支持的情况下，PowerPoint 版也能用插件（Plugins）。

## 额度和费用怎么算

- Word 和 PowerPoint 都按**模型的 token 用量**计费（输入、缓存输入、输出）；文档越大、要求越复杂，用得越多。
- **Free / Go**：有限用量。**Plus / Pro / Business**：受套餐的智能体用量上限约束，这份额度与 Codex、ChatGPT Work、Excel 共用——在 Word 里用得多，Codex 能用的就少了（规则见 [Codex 额度与使用限制](/guides/codex-usage-limits)）。
- 套餐额度用完后，Plus / Pro 可以用 credits 继续。官方给的参考：一次典型的 PowerPoint 任务每条消息约 **10–50 credits**，Excel 约 5–20 credits，实际因模型和任务而异。
- 想用更高的额度可以看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)；价格以 https://chatgpt.com/pricing 为准。

## 目前的限制

- **格式**：复杂格式、表格、图表可能要手动调整；生成或修改的幻灯片不一定完全贴合你的模板。
- **只看当前文件**：Word 加载项只能处理打开的文档，读不到你电脑上的其他文件，需要的内容请粘贴进来。
- **会出错**：可能改错或删掉你想保留的内容。重要文件**先另存一份副本**再大改，数字、引用和改动都要自己核对。
- **隐私**：加载项运行在 Microsoft Office 里，按 Microsoft 加载项市场条款，Microsoft 可能能读取文件内容；ChatGPT 这边按你的套餐和数据控制设置处理数据，Business / Enterprise / Edu 默认不用于训练。

## 常见问题

**Q：Word 里找不到 ChatGPT？**
公司或学校的电脑可能限制了能安装哪些 Microsoft 365 加载项，需要 Microsoft 365 管理员把 ChatGPT 加载项开放给你。另外 ChatGPT 工作区管理员也要在 ChatGPT 管理后台为工作区开启 Word / PowerPoint 功能。

**Q：公司打不开 Microsoft 商店，管理员怎么部署？**
PowerPoint 帮助文章给了官方 manifest 文件，管理员可以在 Microsoft 365 管理中心 **Integrated apps → Deploy Add-in → Upload custom apps** 上传并分配给用户或群组。使用基于角色的访问控制（RBAC）的组织，可能还需要管理员单独开启。

**Q：登录后看不到我的工作区？**
确认登录的是关联该工作区的 ChatGPT 账号，并在登录时选中了那个工作区；仍不行请工作区管理员确认已开启。

**Q：Windows 上登录时弹出「This add-in could not be started」？**
帮助中心说明这可能发生在企业单点登录（SSO）回调时，需要租户的全局管理员在 OpenAI 管理后台的 SSO 设置里取得新的 ACS 地址，更新到身份提供商的应用配置中。

**Q：Word、PowerPoint、Excel 要分别装三个插件吗？**
不用。三者用的是同一个 ChatGPT Microsoft 加载项，装一次，在三个应用的功能区里都能打开。

**Q：加载项里的对话、记忆和技能会和 ChatGPT 同步吗？**
不会。加载项里的对话和 ChatGPT 的聊天记录是分开的，ChatGPT 里的记忆和技能也不会带进加载项。需要固定的写作要求时，可以在加载项里使用技能，或者每次在提示开头写清楚。

**Q：做 PPT 应该用加载项，还是用 ChatGPT Work？**
已经有一份演示稿、想在原文件上增删改，用 PowerPoint 加载项更直接，改完的幻灯片仍然可以在 PowerPoint 里继续编辑；从零开始、需要先查资料再成稿，可以先在 Work 里生成初稿，再打开到 PowerPoint 里用加载项精修。

**Q：在网页版 ChatGPT 里生成 Word、PPT 文件和用这个加载项有什么区别？**
网页版（ChatGPT Work）生成的是新文件让你下载；加载项是在你已经打开的文档里直接改。前者见 [ChatGPT 生成 Word、Excel、PPT 文件](/guides/chatgpt-create-word-excel-ppt)。

## 参考资料

- OpenAI 帮助中心：ChatGPT for Word — https://help.openai.com/en/articles/20001526-chatgpt-for-word
- OpenAI 帮助中心：ChatGPT for PowerPoint — https://help.openai.com/en/articles/20001242-chatgpt-for-powerpoint
- OpenAI 帮助中心：Using Credits for Flexible Usage in ChatGPT (Personal plans) — https://help.openai.com/en/articles/12642688-using-credits-for-flexible-usage-in-chatgpt-personal-plans
- Microsoft Marketplace：ChatGPT 加载项 — https://marketplace.microsoft.com/en-us/product/office/WA200010215
- ChatGPT Release Notes（2026-07-06 PowerPoint 正式上线、2026-09-17 Word 上线）— https://help.openai.com/en/articles/6825453-chatgpt-release-notes
- 截图来源：ChatGPT 官网《ChatGPT for Excel and Google Sheets》— https://chatgpt.com/apps/spreadsheets/
