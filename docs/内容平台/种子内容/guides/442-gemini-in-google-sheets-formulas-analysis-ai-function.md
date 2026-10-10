---
title: Google 表格 Gemini 怎么用：生成表格和公式、数据分析图表与 AI 函数（=AI）的用法和限制
slug: gemini-in-google-sheets-formulas-analysis-ai-function
products: [gemini]
models: [gemini-llm]
accountTier: PRO
excerpt: Google 表格（Google Sheets）里的 Gemini 能按一句话建表、写公式和修公式、分析数据出图表、直接替你设条件格式和数据透视表，还有能写进单元格的 =AI() 函数。本文按官方帮助中心整理用法、示例提示、官方列出的限制，以及「AI function not available」的原因。
checkedOn: 2026-10-10
sources:
  - https://support.google.com/docs/answer/14356410
  - https://support.google.com/docs/answer/16959434
  - https://support.google.com/docs/answer/15877199
  - https://support.google.com/docs/answer/14226603
  - https://support.google.com/docs/answer/16541386
  - https://support.google.com/docs/answer/16813283
  - https://support.google.com/docs/answer/13952129
  - https://support.google.com/docs/answer/14925782
verify:
  - AI 函数的「短期 / 长期生成限额」官方没有给出具体数字，只写达到长期限额后可等 24 小时再试
  - AI 函数的语言列表（28 项，含 Mandarin zh-CN）里没有单列英语，推测英语为默认支持，官方页面未明说
  - 「查看 AI 函数网页来源」官方注明目前仅 Workspace Experiments 和 Beta 计划用户可用
  - 「Build」面板是否对所有符合条件的账号默认打开，官方只写「打开 Google 表格时侧边栏会自动以 Build 打开」，以实际界面为准
  - 截图为官方英文演示界面（演示数据），AI 函数截图中已抹去演示用的人名列和头像
---

> 本文根据 Google 官方文档编辑器帮助中心（Google Docs Editors Help）整理，核对日期 2026-10-10。以下步骤均为电脑网页版；功能在逐步推送，界面可能与下文略有出入。

## 适用于谁

- 搜「google 表格 gemini」「gemini sheets formula」「google sheets ai function」的人；
- 不想记函数语法，希望用一句话让表格自己出公式、出图表的人；
- 需要对一列文本批量做分类、摘要、情感判断的人；
- 遇到「gemini sheets not working」「AI function not available」的人。

## 结论先说

1. **入口是右上角的 Ask Gemini 侧边栏**。它能建表、写公式、分析数据、画图表，还能直接「动手」——加条件格式、建数据透视表、排序筛选、查找替换等，每次执行前会给你一张预览卡片。
2. **=AI() 是写在单元格里的函数**（也可以写成 `=Gemini()`），适合对一整列逐行生成文字、摘要、分类。它只输出文本，看不到整张表，也不能嵌套在别的函数里。
3. **官方写明的硬限制**：一次只为选中的前 350 个 AI 函数单元格生成；有短期和长期生成限额，触到长期限额要等 24 小时。
4. **Excel 文件要先转换**：官方说这些功能在原生 Google 表格文件里效果最好，`.xlsx` 需先「文件 → 另存为 Google 表格」。
5. **账号**：个人账号是 Google AI Pro / Ultra，工作账号是 Business Standard / Plus、Enterprise Standard / Plus；个人账号也可通过 Workspace Experiments 试用。侧边栏支持中文。

## 一、谁能用

| 项目 | 官方说明 |
| --- | --- |
| 个人账号 | Google AI Pro、Google AI Ultra（方案对比表中，表格的 AI 函数、增强型智能填充、数据分析三项都列在这两档下） |
| 工作 / 学校账号 | Business Standard、Business Plus、Enterprise Standard、Enterprise Plus |
| 试用途径 | 个人账号可报名 Workspace Experiments（受信任测试者计划） |
| 侧边栏语言 | 29 种，含中文 |
| AI 函数语言 | 列表共 28 项，含普通话（zh-CN）、日语、韩语等 |
| 增强型智能填充 | 只能识别英文内容，仅电脑端 |

价格不在本文范围，各档区别见本站《Gemini 会员有什么区别：免费版、Google AI Plus、Pro、Ultra 功能与额度对比》。

## 二、侧边栏的基本用法

1. 打开一个表格，点右上角 **Ask Gemini**；
2. 点一个建议提示，或在底部输入框写自己的要求，按 Enter；
3. 结果下方点**插入（Insert）**写进表格，点**重试（Retry）**换一版；做错了点**撤销（Undo）**。

几个实用细节：

- **限定范围**：输入框里的来源下拉菜单可以只勾选要用的工作表标签；也可以先在表里选中一块单元格区域，再提问（区域只对当前标签页有效）。Gemini 可能自动带上其他标签页作为来源，只想问选中区域时要先取消勾选；
- **引用外部资料**：点「Sources → Add from Drive」可加入文档、表格、幻灯片、PDF；也能让它总结你云端硬盘里的文件或 Gmail 邮件；
- **联网**：提示里写明「用 Google 搜索」才会去查网页；
- **历史会丢**：刷新、关闭再打开表格、电脑离线都会清空侧边栏对话，有用的结果要先插入；
- **快捷键**：总结表格——Windows `Ctrl + Alt + N`，Mac `⌘ + Ctrl + N`。

## 三、建表、写公式、修公式

**建表**。示例提示：「做一张团队全天活动的安排表」「做一张社交媒体排期表」。出来以后可以继续追加「再加 5 行不同的活动」「加上费用明细」，满意后再插入。

如果是从零做一整份表格，新版的 **Build** 面板可以完成「端到端」的任务：输入需求 → 回答它的澄清问题 → 查看它给出的计划和模板大纲 → 生成。官方示例：「做一张记录每月开销的表，包含日期、类别、金额、备注」「对这份数据做完整分析，帮我做经营决策」「给这份销售数据做一个可视化仪表盘」。想中止就点停止，或直接发新提示重新开始。

**写公式**。在侧边栏描述需求，可以用表里的列名或单元格名：

- 「写一个公式，用进球数除以场次」；
- 「写一个公式，在 D:G 范围里查找 C1，并返回 G 列的值」。

也可以在任意单元格输入 `=` 后按快捷键调出：Windows / ChromeOS `Ctrl + Alt + G`，Mac `⌘ + Ctrl + G`。生成后先点要放公式的单元格，再点「插入」。

**修公式**。公式报错时，把鼠标悬停在报错的单元格上，点 **Fix**，Gemini 会检查公式并分析问题。

## 四、数据分析、图表和「直接动手」

**分析**。示例提示：「找出这张表里的趋势」「帮我看懂每个月的食品价格变化」「这份数据怎么做回归和预测」。回答里可以点开**分析步骤（Analysis steps）**看它怎么算的，也能**导出到文档（Export to Docs）**。

**图表**。示例：「以日期为横轴、总额为纵轴画图」「画一张折线图」。要注意官方的两条说明：点「插入」后，图表会连同它用到的数据一起放进**新的标签页**；这张图**不会随原始数据的变化而更新**。

![Google 表格里的 Gemini 侧边栏：对三张表提问后生成趋势折线图，下方可插入、预览、导出到文档（官方演示界面）](seed:g442-sheets-gemini-chart.jpg)
*图片来源：[Google 官方帮助中心《Collaborate with Gemini in Google Sheets》](https://support.google.com/docs/answer/14356410)（官方动图截帧）*

**直接动手**。输入要求后，Gemini 会生成一张**操作预览卡片（Action preview card）**，点**应用（Apply）**才执行；完成后可点**设置**微调（如透视表参数、条件格式规则），或点**撤销**（在你做下一步修改之前有效）。官方列出的操作：

| 操作 | 示例提示 |
| --- | --- |
| 条件格式 | 「把销售额大于 500 的行高亮」 |
| 下拉列表 | 「在 A 列建一个下拉列表，选项是高、中、低」 |
| 数据透视表 | 「建一张透视表，按地区汇总销售额」 |
| 筛选 / 清除筛选 | 「筛出销售额大于 1000 的」 |
| 排序 | 「按日期降序排」 |
| 复选框 | 「在表格最前面加一列复选框，命名为已完成」 |
| 查找替换 | 「把 I 列里所有的 Clay 换成 Clay court」 |
| 插入 / 删除 / 冻结行列 | 「冻结首行」「删掉 2021 年那一行」 |
| 填充区域、数字格式、套用表格样式 | 「把奖金列改成带两位小数的货币格式」 |

多个操作可以写在一条提示里一次完成，比如「把状态和优先级两列改成下拉列表，末尾加一列『距到期天数』的公式列和一列复选框，再把两周内到期的日期高亮」。侧边栏还内置**优化问题求解器**，可以描述预算分配、排班、采购量这类「在约束下求最优」的问题。

## 五、AI 函数：把 Gemini 写进单元格

语法：

```
AI("提示", [可选的单元格范围])
```

1. 在单元格里输入函数，例如 `=AI("Generate slogan for event in 10 words or less", A2)`；也可以点「插入 → 函数 → AI」；
2. 选中一个或多个含 AI 函数的单元格；
3. 点**生成并插入（Generate and Insert）**。之后想更新结果，点**刷新并插入（Refresh and Insert）**。

官方给的四类用法：

| 用途 | 示例 |
| --- | --- |
| 生成文字 | `=AI("Create an email to the reviewer addressing specific items in their reviews.", A2:G2)` |
| 摘要 | `=AI("For the customer, write a one sentence summary of their feedback.", A2:D2)` |
| 分类 | `=AI("Categorize the customer inquiry as a compliment, exchange request, or return request.", C2)` |
| 情感分析 | `=AI("Classify the body of the email, as either positive, negative, or neutral.", D2)` |

它还能取 Google 搜索上的实时信息，例如 `=AI("What is the current capital of Kazakhstan?", A2)`。

配套功能：在表格（Table）最后一列右上角点**在右侧插入 AI 列**，首行自动带上 AI 函数，写好后向下填充即可整列生成。另有两种「用 Gemini 填充列」的方式：列里至少有一格已填时拖动填充柄，或选中一片空单元格后点「Fill」并可自写提示。

![在表格里使用 AI 函数：公式栏是 =AI("…", A2:C2)，左侧一列已生成结果，右侧一列还显示为待生成的公式（官方演示界面）](seed:g442-sheets-ai-function.jpg)
*图片来源：[Google 官方帮助中心《Use the AI function in Google Sheets》](https://support.google.com/docs/answer/15877199)（官方动图截帧，已抹去演示人名列和头像）*

### 官方列出的限制

- 结果**只能是文本**；
- AI 函数**读不到整张表**，也读不到云端硬盘里的其他文件——要给它数据，就放进当前表并用第二个参数指向它（官方强烈建议这样做）；
- **不能撤销 / 重做**，只能重新生成；
- **不支持嵌套**，如 `=IF(AI("sentiment analysis", A2), "negative", 0)` 这种写法不行；
- 自定义函数如果也叫 `AI` 或 `Gemini`，会被表格自带的 AI 函数覆盖；
- 一次选中很多单元格时，**只生成前 350 个**，等这批完成再选下一批；
- 有短期和长期生成限额，达到长期限额后「生成」按钮暂时不可点，官方建议等 24 小时；
- 通过 Box、Dropbox、Egnyte 等第三方云存储打开表格时不能用 AI 函数；
- 用 `&` 把不相邻的单元格拼进提示可以，但这些单元格变化时不会提示你刷新，需要自己判断何时重新生成。

## 六、用不了的官方原因

**提示「AI function not available」**，官方给了两种解释：

1. 你没有参加 Workspace Experiments，或所在的 Workspace 方案不含 AI 函数；
2. 管理员设置或你的**语言设置**不支持——可以到 Google 账号里改语言。

**右上角没有 Ask Gemini / 侧边栏不出来**：检查账号档位、年龄、智能功能开关和管理员设置，详见本站《Gemini 侧边栏不见了怎么办》。

**打开的是 Excel 文件**：先「文件 → 另存为 Google 表格」。

**共享表格里出现警告**「Content added by Gemini may be visible to users outside your domain」：说明这份文件有组织外的人能查看或编辑，或者它最初由组织外的人创建，输入提示和开启搜索前要留意。

## 常见问题

**Q：增强型智能填充（Enhanced Smart Fill）和 AI 函数有什么区别？**
智能填充是自动出现的建议：表里至少有 3 行示例、两列之间有可识别的对应关系时，它会预测剩余单元格，点气泡接受。它只对文本列生效，数字和日期列不触发，且只识别英文。AI 函数则是你主动写提示。

**Q：Gemini 生成的公式和分析可靠吗？**
官方反复提醒 Gemini 可能出错，建议核对结果。公式可以自己在几行数据上验算；分析可以点开「分析步骤」看过程。

**Q：侧边栏的对话会进「Gemini 应用活动记录」吗？**
不会。帮助中心写明表格里的对话不保存到 Gemini 活动记录，两边的删除互不影响。

## 参考资料

- Collaborate with Gemini in Google Sheets：https://support.google.com/docs/answer/14356410
- Build or edit entire spreadsheets with Gemini in Sheets：https://support.google.com/docs/answer/16959434
- Use the AI function in Google Sheets：https://support.google.com/docs/answer/15877199
- Use enhanced Smart Fill with Gemini in Google Sheets：https://support.google.com/docs/answer/14226603
- Tables in Google Sheets with Gemini：https://support.google.com/docs/answer/16541386
- Learn how to use sources with Google Workspace with Gemini：https://support.google.com/docs/answer/16813283
- Get started with Google Workspace with Gemini：https://support.google.com/docs/answer/13952129
- Supported languages for Google Workspace with Gemini：https://support.google.com/docs/answer/14925782
