---
title: Claude Excel 怎么用：Claude for Excel 加载项安装与表格分析
slug: claude-for-excel
products: [claude]
models: []
accountTier: PLUS
excerpt: Claude for Excel 加载项哪些套餐能用、支持哪些 Excel 版本、怎么安装，能做公式解释、改假设、查错、建模型等什么事，有哪些限制；Free 用户怎么用对话分析表格。
checkedOn: 2026-10-07
sources:
  - https://claude.com/docs/office-agents/excel
  - https://claude.com/docs/office-agents/overview
  - https://claude.com/docs/office-agents/connectors-and-skills
  - https://claude.com/docs/office-agents/work-across-apps
  - https://claude.com/docs/office-agents/performance
  - https://support.claude.com/en/articles/12138966-release-notes
  - https://support.claude.com/en/articles/12111783-create-and-edit-files-with-claude
  - https://support.claude.com/en/articles/16951679-use-claude-in-google-docs-sheets-and-slides
  - https://claude.com/pricing
verify:
  - 加载项在 Microsoft AppSource 上的名字是「Claude for Microsoft 365」（Excel、PowerPoint、Word 共用一个列表），中文版 Office 里菜单名称（「加载项」或「增益集」）以实际界面为准
  - 加载项的界面语言是否支持中文，官方未说明
---

> 本文根据 Claude Docs《Use Claude for Excel》及 Claude for M365 相关文档、帮助中心发布说明整理，核对日期 2026-10-07。截图引用自 Claude Docs，图下注明出处。

## 适用于谁

- 搜「claude excel 怎么用」「claude excel 增益集 / 加载项」的人；
- 每天跟财务模型、报表打交道，想让 Claude 直接在 Excel 里解释公式、改假设、查 #REF! 错误的人；
- 想知道这个功能要不要另外付费、Free 能不能用的人。

## 结论先说

1. **Claude for Excel 是一个 Excel 加载项**（中文版 Office 里也叫「增益集」），在 Excel 侧边栏里直接和 Claude 对话，它能读写你打开的工作簿。
2. **Pro、Max、Team、Enterprise 可用，Free 不能用**。定价页把「Claude for Microsoft 365」列为 Pro 起包含的功能，官方没有写单独收费，用量计入你的 Claude 套餐额度。
3. **支持的版本**：Excel 网页版；Windows 版 Excel（Microsoft 365 订阅，16.0.13127.20296 或更高）；Mac 版 Excel 16.46 或更高（版本号 21011600 或更高）。**不支持** Excel 2016 / 2019 买断版、iPad 版、Android 版。
4. **擅长**：带单元格引用的问答、改假设且保留公式关系、查错误根源、填模板或从零建模型、排序筛选、透视表、条件格式、数据验证下拉框。**不支持**：模拟运算表（Data tables）、宏和 VBA。
5. **Free 用户的替代办法**：把表格上传到 Claude 对话里分析，或让 Claude 生成带公式的 .xlsx 文件，这个功能所有套餐都能用。

## 步骤

### 1. 安装加载项

**自己安装**：

1. 打开 Microsoft AppSource 上的「Claude for Microsoft 365」页面（Excel、PowerPoint、Word 共用这一个）；
2. 点 **Get it now** 安装；
3. 打开 Excel，启用加载项：Mac 在「工具 → 加载项」，Windows 在「开始 → 加载项」；
4. 用你的 Claude 账号登录。

**公司统一部署**：管理员在 Microsoft 365 管理中心 → 设置 → 集成应用 → 加载项里搜索「Claude for Microsoft 365」，分配给全组织或指定用户。如果公司关闭了「允许用户访问 Office 应用商店」，管理员可以改用官方提供的 Excel 清单（manifest）XML 文件部署。

### 2. 先给它定规矩（可选）

在加载项侧边栏打开 **Settings**，在 **Instructions** 里写下长期偏好，比如「数字用千分位分隔」「列标题一律加粗」「金额单位为人民币万元」。这些指示只对 Excel 生效，和 PowerPoint、Word 里的分开设置。

### 3. 开始用：官方示例提示词

**看懂复杂模型**：回答带单元格引用，点一下就跳到对应单元格。

```text
带我过一遍 C42 单元格的收入是怎么算出来的。
毛利率预测是由哪些假设驱动的？
```

**安全地改数**：改值时保留公式关系，下游单元格会正确重算。

```text
把折现率改成 8%，并更新所有相关计算。
把增长率从 5% 调到 10%，告诉我对终值的影响。
```

**建模型、填模板**：

```text
用 5 亿美元收购价、6 倍杠杆填好这个 LBO 模板。
根据这份试算平衡表搭一个三表模型。
```

**查错误**：

```text
找出汇总表里 #REF! 错误的来源。
查一下为什么 H15 返回 #DIV/0。
```

**原生 Excel 操作**：直接让它排序、筛选、编辑透视表、加条件格式、做数据验证下拉框。

改动已有数据前，Claude 会先提醒你，避免误覆盖；对话太长时会自动压缩成新对话，不会因为上下文用完而中断。

### 4. 连接外部数据和技能

- **连接器**：点侧边栏输入框下方的 **+** → **Connectors**。官方举例的常用连接器有 S&P Global、LSEG、Daloopa 等金融数据源，以及你们组织启用的自定义连接器；
- **技能**：你在 Claude 设置里启用的技能会在加载项里自动应用；也可以在侧边栏输入 `/` 直接调用。技能详见本站《Claude Skills 是什么、怎么装、推荐哪些》。

### 5. 跨 Excel 和 PowerPoint 一起干

Excel、PowerPoint、Word、Outlook 的 Claude 加载项可以共享同一段对话：比如在 Excel 里分析完数据，直接让它在打开的 PowerPoint 里做成图表页。需要在每个加载项的 Settings 里打开「Let Claude work across files」（Pro、Max 默认开，Team、Enterprise 默认关，按设备分别设置）。PowerPoint 那边的用法详见本站《Claude 做 PPT 教程：用 Slides 生成演示稿并导出 PowerPoint》。

## 文件太大会卡吗：官方给的参考线

加载项的操作都在 Excel 里一步步执行，文件越大越容易卡住或超时。官方按「所有工作表已使用单元格总数」给了参考：

| 规模 | 建议 |
| --- | --- |
| 100 万个单元格以下 | 运行良好 |
| 100 万～500 万 | 风险较高，请缩小每次请求的范围 |
| 500 万以上 | 风险自负 |

估算方法：在每个工作表按 Ctrl+End 跳到最后一个单元格，用行号 × 列号，再把各表相加（例如最后一格是 Z100000，就是 26 × 100000 ≈ 260 万）。空白单元格上的格式也会把「最后一格」往后推。

![官方给出的文件规模与风险示意：Excel 按已使用单元格总数、PowerPoint 按页数，越大风险越高（柱子表示趋势，不是测量值）](seed:g215-excel-file-size-risk.png)
*图片来源：[Claude Docs《Performance and limits》](https://claude.com/docs/office-agents/performance)*

其他官方建议：

- Claude 干活时别去点、打字、运行宏或刷新数据；
- 只给它任务需要的范围：说清楚工作表名和区域，或者把需要的表复制到新工作簿；
- 大改动拆成几步提；
- 遇到超时先等 Excel 响应、保存，再提一个更小的请求（那一步可能还在后台执行）；
- 一次 Claude 读取最多返回 2,000 个有数据的单元格，大表会分几次读；Excel 网页版单次请求上限 5 MB，大文件建议用桌面版；大工作簿建议用 64 位 Office。

## 数据与安全

- 聊天记录存在你本机浏览器的存储里，**不保存在 Anthropic 服务器上、不跨设备同步**，可以在 Settings 里清除；
- 输入输出在后端 30 天内删除；
- **只用于可信的表格**：外部下载的模板、供应商文件、导入的数据里可能藏有提示词注入，诱导它导出敏感信息或改坏数据。Claude 提出高风险操作时会请你确认，请认真看；
- 官方不建议在没有人工复核的情况下直接用于最终交付、审计关键计算，或处理高度敏感、受监管的数据。动大改之前，先备份一份工作簿。

## Free 用户怎么用 Claude 分析表格

Claude for Excel 不对 Free 开放，但「代码执行与文件创建」对所有套餐开放（在 **Settings → Capabilities** 打开 **Code execution and file creation**）：

1. 在对话里上传 Excel、CSV 文件（单个文件上限 30 MB）；
2. 让 Claude 清洗数据、做统计分析、画图，例如「找出每个月销售额的异常值，并画一张折线图」；
3. 需要时让它输出一个带公式的新 .xlsx 文件下载。

区别在于：这种方式是在 Claude 里处理文件副本，不会直接改你 Excel 里打开的那份。另外，用 Google 表格的付费用户还可以装 Claude for Google Workspace（beta），在 Google 表格侧边栏里写公式、修公式、建模型。

## 常见问题

**Q：Claude for Excel 要另外付费吗？**
官方定价页把「Claude for Microsoft 365」列为 Pro 起包含的功能，没有单独标价；使用计入你的 Claude 套餐额度。还没有订阅的话，可以在本站开通：[/chongzhi/claude-pro](/chongzhi/claude-pro)。

**Q：我的 Excel 2019 为什么装不上？**
官方列明 Excel 2016、2019 的买断或批量授权版不支持；iPad 版、Android 版也不支持（加载项依赖的 SharedRuntime 在 iPad 上没有）。可以改用 Excel 网页版。

**Q：能帮我写宏或 VBA 吗？**
加载项本身不支持宏和 VBA 操作，也不支持模拟运算表。

**Q：在加载项里能选哪些模型？**
加载项提供的是适合 Office 任务的部分模型，列表可能比 claude.ai 上短；企业账号还受组织的模型权限设置限制。

**Q：Claude 一直在等、或者报超时？**
别反复点击。等 Excel 响应后保存，再把请求拆小重试；如果 Excel 关闭了，重新打开文件看「文档恢复」窗格，或在「文件 → 信息 → 管理文档 → 恢复未保存的工作簿」里找回。

## 参考资料

- Use Claude for Excel（官方 Claude Docs）：https://claude.com/docs/office-agents/excel
- Claude for M365 overview（官方 Claude Docs）：https://claude.com/docs/office-agents/overview
- Connectors and Skills（官方 Claude Docs）：https://claude.com/docs/office-agents/connectors-and-skills
- Work across M365 apps（官方 Claude Docs）：https://claude.com/docs/office-agents/work-across-apps
- Performance and limits（官方 Claude Docs）：https://claude.com/docs/office-agents/performance
- Claude 发布说明（官方）：https://support.claude.com/en/articles/12138966-release-notes
- Create and edit files with Claude（官方）：https://support.claude.com/en/articles/12111783-create-and-edit-files-with-claude
- Use Claude in Google Docs, Sheets, and Slides（官方）：https://support.claude.com/en/articles/16951679-use-claude-in-google-docs-sheets-and-slides
- 套餐对比（官方）：https://claude.com/pricing
