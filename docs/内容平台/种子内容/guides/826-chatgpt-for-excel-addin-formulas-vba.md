---
title: ChatGPT 怎么用在 Excel 里：官方 Excel 加载项安装、公式报错、整理数据，VBA 和宏支持吗
slug: chatgpt-for-excel-addin-formulas-vba
products: [chatgpt]
models: []
accountTier: FREE
excerpt: 想让 ChatGPT 直接在 Excel 里改公式、整理表格？按 OpenAI 帮助中心讲清官方 Excel 加载项（ChatGPT for Excel）怎么装、能做什么、5 条可复制的指令、桌面 App 里 Codex 怎么操作打开的工作簿，VBA 和宏的支持情况，以及哪种做法该选哪个。
checkedOn: 2026-10-14
sources:
  - https://help.openai.com/en/articles/20001063-chatgpt-for-excel-and-google-sheets
  - https://help.openai.com/en/articles/8437071-data-analysis-with-chatgpt
  - https://help.openai.com/en/articles/20001278-creating-and-editing-documents-spreadsheets-and-presentations-with-chatgpt-work
verify:
  - 官方文章写 VBA 和宏「可能不能完整支持」，没有给出具体能做和不能做的清单；文中只按这一句写
  - Free 与 Go 「有限用量」、Plus 与 Pro 「受套餐智能体用量上限约束」，具体数字官方没有列在这篇文章里
  - 中文版 Excel 里「Home / Add-ins」的名称以实际界面为准
---

> 本文根据 OpenAI 帮助中心《ChatGPT for Excel and Google Sheets》《Data analysis with ChatGPT》《Creating and editing documents, spreadsheets, and presentations with ChatGPT Work》整理，资料核对于 2026-10-14。官方文章没有配界面截图，文中配图为本站整理的示意图。

## 适用于谁

- 搜「ChatGPT Excel」「ChatGPT Excel 自动化」「ChatGPT Excel 加载项」，想让它在表格里直接干活的人；
- 搜「ChatGPT Excel VBA」，想知道能不能写宏、能不能直接跑宏的人；
- 表格里公式报错、数据乱，不知道该「上传文件」还是「装插件」的人。

只想把一份表格丢给 ChatGPT 分析趋势，见 [/guides/chatgpt-excel-data-analysis](/guides/chatgpt-excel-data-analysis)；Word 和 PowerPoint 的加载项见 [/guides/chatgpt-for-word-powerpoint](/guides/chatgpt-for-word-powerpoint)。

## 结论先说

1. **官方有 Excel 加载项，叫 ChatGPT for Excel**：它在 Excel 里以**侧边栏**的形式出现，可以直接构建、更新和解释表格，包括有很多标签页、公式、引用和假设的大文件。Google 表格有另一个独立的版本（ChatGPT for Google Sheets），两者工作流程相似。
2. **Free、Go、Plus、Pro、Business、Enterprise、Edu、K-12 都能用**：官方写明面向全球上述用户开放；Free 和 Go 是**有限用量**，Plus 和 Pro 受套餐的智能体用量上限约束。
3. **用法的关键是说清「改什么、保留什么、改在哪」**，大改先让它出计划，再动手。
4. **VBA 和宏：官方说可能不能完整支持**。写宏代码可以问 ChatGPT，但**直接让它在 Excel 里操作宏不要指望**。
5. **输出一定要核对**：官方要求在分享或使用前，核对公式、计算、引用和改动过的单元格；重要文件先复制一份。
6. **想让桌面 App 里的 Codex 操作打开的工作簿**，也可以：仅限 Microsoft Excel，需要先装好加载项。

## 步骤

### 1. 安装 ChatGPT for Excel

![安装 ChatGPT for Excel 的 5 步](seed:g826-excel-install.png)
*图：本站根据 [OpenAI 帮助中心：ChatGPT for Excel and Google Sheets](https://help.openai.com/en/articles/20001063-chatgpt-for-excel-and-google-sheets) 整理的示意图*

1. 打开 Microsoft Excel（桌面版或网页版）；
2. 点 **Home → Add-ins**；
3. 搜索 **ChatGPT**，添加；
4. 从功能区打开 ChatGPT；
5. 用有支持套餐的 ChatGPT 账号登录。

公司电脑装不了的话，官方说如果组织不能访问 Microsoft Store，Microsoft 365 管理员可以用官方提供的清单（manifest）文件在内部部署。

**Google 表格**：从 Google Workspace Marketplace 安装 ChatGPT，打开 Google 表格，在 **Extensions** 菜单里打开 ChatGPT，并登录。

### 2. 官方推荐的写法

- **说清楚改什么、保留什么、改在哪。** 官方的例子是：「只更新 Inputs 标签页里的假设，不要改格式，最后总结改了什么。」
- **大改先要计划。** 例如：「动手之前，先列出你会改哪些标签页和区域。」
- 可以用 **@** 提及工作簿里的某些工作表，让它聚焦。
- 它可以搜索网页，把信息拉进工作簿。

官方列出的试用指令，翻成中文大意：

```
做一份带分类、合计和图表的月度预算表，格式要整齐。
```

```
B145 单元格为什么报错？请解释公式的计算链并给出修复建议。
```

```
总结这三个标签页里的趋势，指出不寻常的地方。
```

```
整理这张表：统一格式，修正不一致的标签，删除重复项。
```

```
按新的假设更新这张表，然后列出具体改了什么。
```

```
新建一个情景标签页，对比基准、乐观和悲观三种情况。
```

本站补充一条常用的（不是官方文案）：

```
只改「汇总」这个工作表，其他工作表一律不动。先说明你要改哪几列、用什么公式，等我说「执行」再改。
```

### 3. 在桌面 App 里用 Codex 操作打开的工作簿

官方说明，你也可以在 ChatGPT 桌面 App 里用 **Codex** 直接处理一个打开的 Excel 工作簿，它可以检查和修改工作表、公式、数值、格式和图表，还可以使用代码和你提供的本地文件。目前**只支持 Microsoft Excel**。

1. 按上面的步骤装好 ChatGPT for Excel 加载项并登录；
2. 在 Excel 里打开已有工作簿，或新建一个；
3. 打开 ChatGPT 桌面 App，选 **Codex**；
4. 输入 **@Microsoft Excel**，或让 Codex 处理打开的工作簿；
5. 保存或分享前，先检查工作簿的改动。

官方还说：Computer Use 是可选的，可用时 Codex 可以用它打开 Excel 并启动加载项；否则你自己打开工作簿和加载项，再回到 Codex 继续。并非每个表格请求都会用到直接操作 Excel。

选哪种做法，看这张图：

![在 Excel 里用 ChatGPT：选哪种做法](seed:g826-excel-routes.png)
*图：本站根据 [OpenAI 帮助中心：ChatGPT for Excel and Google Sheets](https://help.openai.com/en/articles/20001063-chatgpt-for-excel-and-google-sheets) 与 [Data analysis with ChatGPT](https://help.openai.com/en/articles/8437071-data-analysis-with-chatgpt) 整理的示意图*

## 目前的限制

官方在文章里列了这几条：

- **独立体验**：表格里的对话与主 ChatGPT 的聊天记录分开，对话和表格数据不会在两边同步；
- **记忆有限**：表格里的对话不能使用 ChatGPT 的记忆；
- **高级功能**：VBA 和宏等功能可能不能完整支持；
- **结果要核对**：输出可能不完整或不正确，分享前要检查公式、计算、引用和改过的单元格，重要文件先复制一份。

官方还提醒：ChatGPT 不是财务、法律或税务顾问，输出不应被视为建议。

## 隐私

ChatGPT for Excel 在 Microsoft Excel 里运行，使用 Excel 受你与微软的协议约束；官方说，按微软加载项市场的服务条款，微软可能能读取你的工作簿内容、附件和提示。ChatGPT 为了回复会处理你的提示、附件和相关的表格上下文；你的数据保存在产品本地，可以在设置里删除或下载；一些日志可能在 OpenAI 保留 30 天，用于安全和完整性。

## 常见问题

**Q：ChatGPT 能直接帮我写 VBA 吗？**
官方文章说的是加载项对 VBA 和宏「可能不能完整支持」。在普通对话里让它写宏代码、解释怎么用，是另一回事，但跑之前务必在备份文件里先试，并自己审一遍代码。

**Q：我只想让它分析一张表，要装加载项吗？**
不用。把文件传到对话里分析即可。官方建议表格的第一行用描述性的列名、每行一条记录，避免一个工作表里放多个不相关的表、避免空行空列。详见 [/guides/chatgpt-excel-data-analysis](/guides/chatgpt-excel-data-analysis)。

**Q：它会把我的表格数据拿去训练吗？**
这篇官方文章没有写训练相关的内容，只说明了数据处理和保留；训练设置见 [/guides/chatgpt-data-controls-privacy](/guides/chatgpt-data-controls-privacy)。

**Q：付费方面怎么算？**
官方说 Free 和 Go 有限用量；Plus 和 Pro 受套餐智能体用量上限约束，与其他智能体功能共用；任务越大、越复杂，用量越多。需要升级可以看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

**Q：用 Work 能生成 Excel 文件吗？**
可以。官方说 ChatGPT Work 可以创建或编辑表格文件，写明工作表、列、公式和图表即可，见 [/guides/chatgpt-create-word-excel-ppt](/guides/chatgpt-create-word-excel-ppt)。

## 参考资料

- OpenAI 帮助中心：ChatGPT for Excel and Google Sheets — https://help.openai.com/en/articles/20001063-chatgpt-for-excel-and-google-sheets
- OpenAI 帮助中心：Data analysis with ChatGPT — https://help.openai.com/en/articles/8437071-data-analysis-with-chatgpt
- OpenAI 帮助中心：Creating and editing documents, spreadsheets, and presentations with ChatGPT Work — https://help.openai.com/en/articles/20001278-creating-and-editing-documents-spreadsheets-and-presentations-with-chatgpt-work
