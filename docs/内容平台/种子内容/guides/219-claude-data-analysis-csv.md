---
title: Claude 数据分析教程：上传 CSV / Excel、做图表与导出结果
slug: claude-data-analysis-csv
products: [claude]
models: []
accountTier: FREE
excerpt: 在 claude.ai 里用「代码执行与文件创建」做数据分析：先打开开关，上传 CSV / Excel，让 Claude 清洗数据、做透视和图表、建模，再导出 Excel / Word / PDF 报告。附 8 条可复制的中文提问和安全注意事项。
checkedOn: 2026-10-07
sources:
  - https://support.claude.com/en/articles/12111783-create-and-edit-files-with-claude
  - https://support.claude.com/en/articles/8241126-upload-files-to-claude
  - https://claude.com/pricing
verify:
  - 文件大小限制两篇帮助中心文章说法不一（500MB / 30MB），站长实测确认
  - 截图为帮助中心配图（个人套餐的设置页面可能没有域名白名单下拉框，以实际界面为准）
---

> 本文根据 Claude 帮助中心《Create and edit files with Claude》等官方文章整理，核对日期 2026-10-07；截图引用自帮助中心并注明出处。示例提问为本站编写。

## 适用于谁

- 手头有销售表、问卷结果、运营数据，想让 AI 帮忙清洗、统计、画图、写结论的人；
- 不会写 Python / 不熟 Excel 公式，但想做出带公式和图表的表格或报告的人；
- 搜「claude 数据分析」「claude excel 分析」的人。

在 Excel 里直接用 Claude 的加载项是另一回事，详见本站《Claude Excel 怎么用：Claude for Excel 加载项安装与表格分析》。

## 结论先说

1. Claude 的数据分析靠的是 **「代码执行与文件创建」（Code execution and file creation）** 功能：Claude 在一个隔离的沙箱里写并运行 Python 代码，处理你上传的数据、生成图表和文件。
2. 这个功能**所有套餐都能用**（Free、Pro、Max、Team、Enterprise），网页、桌面和手机 App 都支持。个人套餐要先在 **设置 → 功能（Capabilities）** 里打开开关。
3. 可以上传 CSV、TSV、Excel 等数据文件；能生成 Excel（.xlsx，带可用的公式）、PowerPoint、Word、PDF 和 PNG 图表，直接下载或存到 Google Drive。注意：**上传 XLSX 文件必须先开启这个功能**。
4. 用这个功能会**更快消耗套餐额度**（帮助中心原话：创建文件比普通聊天用得多）。
5. 开了网络访问时存在提示词注入导致数据外泄的风险；处理敏感数据时要盯着它在做什么。

## 步骤

### 1. 打开功能开关

- **个人 Free / Pro / Max（网页或桌面）**：设置 → Capabilities（功能），打开 **Code execution and file creation**。需要安装额外的 Python 包或访问外部数据时，再打开 **Allow network egress**（允许网络访问）。
- **手机 App**：点侧边栏的头像 / 名字进入设置 → Capabilities，打开同名开关。
- **Team / Enterprise**：由组织 Owner 在「组织设置 → Capabilities」统一控制，Team 默认开启、Enterprise 新组织默认开启，网络访问默认受限。

![Claude 设置中的「Code execution and file creation」开关，下方是「Allow network egress」网络访问开关和可访问域名的设置](seed:g219-capabilities-toggle.png)
*图片来源：[Claude 帮助中心《Create and edit files with Claude》](https://support.claude.com/en/articles/12111783-create-and-edit-files-with-claude)*

开启网络访问后，帮助中心列出的默认可访问域名主要是软件包源：GitHub、npm、PyPI、crates.io、Ubuntu 软件源、Yarn 等，用来安装数据分析需要的库。

### 2. 上传数据

在对话框里点附件按钮或直接拖入文件。可以一次上传多个文件，生成的文件在整个对话期间都能下载。数据较大时，先删掉无关的列和工作表再上传，既快又省额度。

### 3. 先让 Claude「看懂」数据

第一句不要急着要结论，先让它摸底：

```text
请先读取我上传的 sales_2026.xlsx，告诉我：
1. 有几个工作表、每个表多少行多少列；
2. 每一列的含义（你推测的）和数据类型；
3. 有没有缺失值、重复行、明显异常的数值或格式不一致的日期。
先不要修改数据，只汇报情况。
```

它会实际运行代码读取文件，给出概览。确认它理解对了列的含义（特别是英文缩写、编码字段），再进入下一步。

### 4. 清洗、统计、做图

确认后一步一步提要求，每次说清楚**口径**和**输出形式**。可直接复制的提问示例：

**清洗数据**

```text
按以下规则清洗数据，并告诉我每一步改了多少行：
- 删除完全重复的行；
- 「下单日期」统一成 YYYY-MM-DD；
- 「金额」去掉货币符号转成数字，负数单独列出来给我确认；
- 「地区」里「华东区」「华东」统一为「华东」。
清洗后另存为 sales_clean.xlsx 让我下载。
```

**分组汇总（数据透视）**

```text
按「地区」和「月份」汇总销售额和订单数，算出每个地区的环比增长率，
结果做成一张透视表放进新的 Excel 工作表，数字保留两位小数。
```

**画图**

```text
画一张 2026 年 1–9 月各地区销售额的折线图，图中文字用中文，
标题写「各地区月度销售额」，保存为 PNG 给我。
```

**找原因**

```text
华南区 7 月销售额下降明显。请从产品类别、客户类型、平均客单价三个角度拆解，
找出贡献最大的因素，用数据说明，不要猜测。
```

**做成带公式的模型**

```text
基于清洗后的数据，做一个 Excel 预算模型：输入「明年各地区增长率」，
自动算出明年各月预计销售额。用真实的 Excel 公式，不要写死数值。
```

**出一份报告**

```text
把以上分析整理成一份 Word 报告：一页摘要 + 关键图表 + 结论和建议，
面向不懂数据的管理层，语言简洁。
```

**从 PDF 里抽表格**

```text
把这份 PDF 里所有表格的数据提取到 Excel，每张表一个工作表，并做一张汇总图。
```

**简单建模**

```text
用这份客户数据训练一个模型预测是否会流失，告诉我用了什么方法、模型效果怎么样、
最重要的几个影响因素是什么，并用一段话解释给非技术人员听。
```

（以上为本站编写的示例提问，官方帮助中心也给出了类似的预算表、季度销售报告、格式转换、PDF 提取、机器学习建模等示例。）

### 5. 检查结果再使用

- 让它**给出计算口径和关键中间数据**，抽查几项和原表对一下；
- 生成的 Excel 打开检查公式是否引用正确；
- 结论类内容要求它「每个结论都附上支撑的数据」；
- 需要反复用的分析流程，可以把要求整理成固定提示词，或做成技能（Skill）重复使用。

## 安全注意事项（官方提醒）

帮助中心专门说明：这个功能给了 Claude 一个沙箱计算环境；如果开启了网络访问，坏人可能把指令藏在外部文件或网页里，诱导 Claude 下载执行不可信的代码，或者把对话、项目、连接器里的数据发到外部服务器。建议：

- 处理敏感数据时**关闭网络访问**（只用预装的库也能完成大多数分析）；
- 使用过程中留意 Claude 的操作摘要，发现异常随时停止；
- 只上传你有权处理的数据，不要上传含他人隐私的原始数据；
- 发现问题可以用回复下方的「踩」按钮反馈。

官方还说明了已采取的防护：每个用户的沙箱互相隔离、限制任务时长和资源、有提示词注入检测，以及 Free / Pro / Max 用户包含这类生成文件的对话不能公开分享。

## 常见问题

**Q：为什么 Claude 只是给我写了一段代码，没有直接算出结果？**
多半是「代码执行与文件创建」没开。到设置 → Capabilities 打开后重新提问。

**Q：Free 账号能做数据分析吗？**
能。帮助中心说明这个功能对所有套餐开放。但 Free 额度较少，大文件、多轮分析很快会用完。额度规则详见本站《Claude 使用限制与额度：用量怎么看、什么时候重置（Free / Pro / Max / Claude Code）》。

**Q：文件太大传不上去？**
帮助中心两篇文章的写法不同：《Upload files to Claude》写聊天中单个文件最大 500MB、每个对话最多 20 个文件，项目文件每个最大 30MB；《Create and edit files with Claude》写代码执行功能的上传和下载每个文件最大 30MB（超过 30MB 的 PDF 可以在计算环境里处理而不载入上下文）。以实际提示为准。表格数据建议先精简列、拆分文件，或者先在本地筛选再上传。更多上传限制详见本站《Claude 上传文件限制：支持格式、大小与 PDF 分析》。

**Q：项目（Projects）里的文件能直接分析吗？**
能。帮助中心说明项目里的文件可以在 Claude 的计算环境中访问，适合固定的数据集反复分析。

**Q：生成的图表中文显示成方框怎么办？**
这是绘图环境缺少中文字体时的常见现象（本站经验，官方未专门说明）。可以在提问时要求「确保图表中文正常显示」，或者让图表使用英文标签、中文写在报告正文里。

## 参考资料

- Create and edit files with Claude（帮助中心）：https://support.claude.com/en/articles/12111783-create-and-edit-files-with-claude
- Upload files to Claude（帮助中心）：https://support.claude.com/en/articles/8241126-upload-files-to-claude
- 套餐对比（官方）：https://claude.com/pricing
