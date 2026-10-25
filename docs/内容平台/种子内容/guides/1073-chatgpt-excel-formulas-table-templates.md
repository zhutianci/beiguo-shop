---
title: 用 ChatGPT 做表格、写 Excel 公式：在对话里描述需求、上传表格、修公式、生成表格模板（附可复制指令）
slug: chatgpt-excel-formulas-table-templates
products: [chatgpt]
models: []
accountTier: FREE
excerpt: 不装加载项，在 ChatGPT 对话里也能写和修 Excel 公式、做表格模板。上传表格或粘贴前几行，写清列的含义和想要的结果，让它解释公式，再自己抽几行验算。附 6 条可复制指令。
checkedOn: 2026-10-25
sources:
  - https://chatgpt.com/use-cases/chat-with-spreadsheets/
  - https://openai.com/academy/data-analysis
  - https://openai.com/academy/prompting/
  - https://help.openai.com/en/articles/8555545-file-uploads-faq
verify:
  - 官方表格用例页写 ChatGPT 能「写和修公式」「按描述生成模板，如预算跟踪表」，上传方式是点 + 选 Add photos & files；Plus 和 Pro 可连接 Google Drive 和 Microsoft Teams 取文件
  - 官方数据分析指南的建议（先说要支持什么决定、给出列含义和时间范围、要方法而不只是答案、要求展示公式和假设、抽几个关键数字验算）正文如实引用；具体 Excel 函数写法由 ChatGPT 生成，本文不替官方背书，要以你自己的 Excel 版本实际结果为准
  - 6 条指令和问法是本站示范；Excel 加载项的安装和用法见本站另一篇，本文不重复
---

> 本文根据 ChatGPT 表格用例页、OpenAI Academy 的《Data analysis》《Prompting》整理，资料核对于 2026-10-25。本文讲**在普通对话里**让 ChatGPT 帮你写公式、做表格；想在 Excel 里直接让它改工作簿，用官方的 ChatGPT for Excel，见 [/guides/chatgpt-for-excel-addin-formulas-vba](/guides/chatgpt-for-excel-addin-formulas-vba)；整份数据的分析见 [/guides/chatgpt-excel-data-analysis](/guides/chatgpt-excel-data-analysis)。

## 适用于谁

- 不会写 Excel 公式，想直接描述需求的人；
- 公式报错、结果不对，不知道哪里错的人；
- 想让 ChatGPT 帮忙做一张表格模板的人；
- 搜「chatgpt 做表格」「chatgpt excel」的人。

## 结论先说

1. **官方说 ChatGPT 能「写和修公式」，也能按描述生成模板**（官方例子是预算跟踪表）：给出列、格式和公式。
2. **上传方式：** 点 **+**，选 **Add photos & files**，选要讨论的表格。官方说 Plus 和 Pro 用户还可以连接 Google Drive 和 Microsoft Teams 取文件。也可以直接粘贴前几行。
3. **官方数据分析指南的建议：** 先说你要支持什么决定；给出数据，并说明列的含义和时间范围；要的是方法，而不只是答案；需要复用的输出（比如干净的表格）要明确要求。
4. **要它展示依据。** 官方说，数字重要时，可以要求它说明用了什么公式、做了什么假设，并做缺失数据、异常值的快速检查；分享结果或做决定前，**挑几个关键数字自己验算**。
5. **设几条规矩。** 官方举例：不要把相关当成因果，指出数据的局限，标出看着不对的地方。
6. 需要更多的上传和更强的数据分析，可以看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)；写公式、做模板，免费版通常够用。

![在对话里让 ChatGPT 写 Excel 公式的 5 步：说目的、交代数据、描述结果、要求解释、自己验算](seed:g1073-formula-steps.png)
*图：本站根据 [OpenAI Academy：Data analysis](https://openai.com/academy/data-analysis) 与 [ChatGPT 表格用例页](https://chatgpt.com/use-cases/chat-with-spreadsheets/) 整理的示意图*

## 一、6 条可以直接复制的指令

方括号里是要你自己填的内容。**这些指令是本站示范，不是官方原话。**

### 1. 按描述写公式

> 我的表格 A 列是日期，B 列是产品名，C 列是销售额，D 列是成本，第一行是表头。请在 E 列写一个公式，计算每行的毛利率，结果显示为百分比；如果 C 列是空的，E 列显示为空。请给出放在 E2 的公式，并用一句话解释它。

### 2. 解释一个看不懂的公式

> 请逐段解释下面这个公式在做什么，用一个具体的数字例子演示：[粘贴公式]。我的表格里 A 列是 [含义]，B 列是 [含义]。

### 3. 修一个报错的公式

> 下面这个公式报错了：[公式]，错误是 [错误提示]。A 列是 [含义]，B 列是 [含义]，第 [N] 行的数据是 [样例]。请告诉我错在哪里，给出修改后的公式，并说明为什么之前会报错。

### 4. 结果不对，但没报错

> 我想得到 [期望结果]，但这个公式在第 [N] 行给出了 [实际结果]：[公式]。样例数据：[粘贴几行]。请对照检查公式的逻辑，指出可能出错的地方。

### 5. 生成表格模板

> 请帮我做一张 [用途，如：个人月度预算] 的表格模板。给出：列名、每列的格式、示例的 3 行数据，以及汇总行用到的公式。请用表格形式展示，我复制到 Excel 里用。

官方表格用例页里的说法就是：描述你需要什么，ChatGPT 帮你生成布局、格式和公式。

### 6. 整理杂乱的数据

> 下面是一列从系统导出的杂乱日期，格式不统一：[粘贴]。请告诉我怎么用公式或「分列」把它们统一成「年-月-日」，先给方法，再给公式。我用的是 Excel [版本]。

## 二、出问题时怎么问

![公式出问题时的问法：报错、结果不对、公式太长、要整张模板、要在 Excel 里直接改](seed:g1073-formula-fix.png)
*图：本站根据 [ChatGPT 表格用例页](https://chatgpt.com/use-cases/chat-with-spreadsheets/) 整理的示意图；具体问法为本站示范*

## 三、用之前的核对

- **先在小范围测试：** 把公式放进一两个单元格，拿手算的结果对一下，再往下拉；
- **注意版本差异：** 不同版本的 Excel、WPS、Google 表格支持的函数不完全一样；公式报「不认识的函数」，就告诉 ChatGPT 你的软件和版本，让它换一种写法；
- **别上传敏感数据：** 含客户隐私、工资、身份信息的表，先脱敏；数据用于训练的设置见 [/guides/chatgpt-data-controls-privacy](/guides/chatgpt-data-controls-privacy)；
- **让它生成文件：** 想直接得到 Excel 文件，见 [/guides/chatgpt-create-word-excel-ppt](/guides/chatgpt-create-word-excel-ppt)；
- **上传失败：** 见 [/guides/chatgpt-file-upload-failed](/guides/chatgpt-file-upload-failed)。

## 常见问题

**Q：ChatGPT 写的公式一定对吗？**
不一定。官方的建议是要求它展示公式、假设和检查方法，并自己挑几个数字验算。

**Q：它能直接改我的 Excel 文件吗？**
在普通对话里它给你公式和结果，你自己放回表格；想让它在工作簿里直接改，要用官方的 ChatGPT for Excel，见 [/guides/chatgpt-for-excel-addin-formulas-vba](/guides/chatgpt-for-excel-addin-formulas-vba)。

**Q：WPS 里的公式也能问吗？**
可以问，但要告诉它你用的是 WPS，让它给出 WPS 支持的写法，并自己验证。

**Q：表格太大上传不了？**
官方文件上传文章写了 CSV 和表格约 50 MB 的限制（取决于每行大小），见 [/guides/chatgpt-file-upload-failed](/guides/chatgpt-file-upload-failed)。

## 参考资料

- ChatGPT 表格用例页 — https://chatgpt.com/use-cases/chat-with-spreadsheets/
- OpenAI Academy：Data analysis — https://openai.com/academy/data-analysis
- OpenAI Academy：Prompting — https://openai.com/academy/prompting/
- OpenAI 帮助中心：File uploads FAQ — https://help.openai.com/en/articles/8555545-file-uploads-faq
