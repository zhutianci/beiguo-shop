---
title: Claude 做 PPT 教程：用 Slides 生成演示稿并导出 PowerPoint
slug: claude-make-ppt-slides
products: [claude]
models: []
accountTier: FREE
excerpt: 用 Claude 做 PPT 的四种方式：对话里生成 .pptx、Slides 模板做演示稿导出 PowerPoint、PowerPoint 加载项、Google 幻灯片侧边栏，附提示词写法。
checkedOn: 2026-10-07
sources:
  - https://support.claude.com/en/articles/12111783-create-and-edit-files-with-claude
  - https://support.claude.com/en/articles/17153992-what-are-artifacts-and-how-do-i-use-them
  - https://support.claude.com/en/articles/12138966-release-notes
  - https://support.claude.com/en/articles/16761823-claude-cowork-and-chat-are-one-claude
  - https://support.claude.com/en/articles/16951679-use-claude-in-google-docs-sheets-and-slides
  - https://support.claude.com/en/articles/10166901-use-google-workspace-connectors
  - https://claude.com/docs/office-agents/overview
  - https://claude.com/docs/office-agents/powerpoint
  - https://claude.com/pricing
verify:
  - Free 能否用 Slides 模板，三处官方说法不一致：帮助中心《What are artifacts》写「模板为付费套餐 beta」；定价页对比表里「Claude Design, Slides, Docs」Free 一栏为 No；2026-09-16 发布说明写「包括 Free 在内所有套餐可用」。站长用 Free 账号实际确认
  - 中文界面里「Output / Export / Capabilities」等按钮的中文名，以实际界面为准
---

> 本文根据 Anthropic 官方帮助中心、发布说明和 Claude Docs 中 Claude for PowerPoint 的说明整理，核对日期 2026-10-07。截图引用自官方帮助中心，图下注明出处。Artifacts 的分享、权限和旧版说明不在本文重复，详见本站《Claude Artifacts 是什么、怎么用：创建、分享与导出（2026 新版）》。

## 适用于谁

- 搜「claude 做ppt」「claude slides」，想让 Claude 把材料变成演示稿的人；
- 手里有公司 PPT 模板，想让 Claude 按模板出页、改页的人；
- 平时用 Google 幻灯片，想在里面直接用 Claude 的人。

## 结论先说

1. **最快的办法：在对话里直接让 Claude 生成 PowerPoint 文件（.pptx）**。这靠「代码执行与文件创建」功能，**Free 也能用**，生成后直接下载。
2. **想在线编辑、直接演示、再导出**：用 **Slides（幻灯片）模板**，做好后点 **Export** 导出成 PowerPoint 或 PDF。模板是否对 Free 开放，官方说法不一致（见文末）。
3. **想在 PowerPoint 里边做边改、严格按公司模板**：装 **Claude for PowerPoint** 加载项（Pro、Max、Team、Enterprise）。
4. **用 Google 幻灯片**：装 **Claude for Google Workspace**（beta，Pro 及以上），在幻灯片里打开 Claude 侧边栏。
5. **不管哪条路，提示词都要说清：页数、受众、结构、风格和要用的材料**，做完一定要人工检查。

## 四种方式怎么选

| 方式 | 适合 | 产出 | 套餐 |
| --- | --- | --- | --- |
| 对话里生成 .pptx | 快速出一版初稿 | 可下载的 .pptx 文件 | 所有套餐（含 Free） |
| Slides 模板 | 在线编辑、直接在 Claude 里演示、分享链接 | 可导出 PowerPoint / PDF | 见文末 verify 说明 |
| Claude for PowerPoint | 按公司模板出页、精修某几页、把要点变成原生图表 | 直接改你打开的 PPT | Pro / Max / Team / Enterprise |
| Claude for Google Workspace | 团队用 Google 幻灯片 | 直接改你打开的 Google 幻灯片 | Pro / Max / Team / Enterprise（beta） |

## 方式一：对话里直接生成 PowerPoint 文件

### 1. 打开「代码执行与文件创建」

Free、Pro、Max 默认开启。如果被关了：进入 **Settings → Capabilities**，打开 **Code execution and file creation**。手机 App 上是点左侧边栏你的名字 → Settings → Capabilities。Team / Enterprise 由组织 Owner 在 **Organization settings → Capabilities** 里控制。

![「Code execution and file creation」设置：打开后 Claude 可以执行代码并创建文档、表格、演示稿、PDF；下方还可以设置网络访问范围](seed:g214-files1.png)
*图片来源：[Claude 帮助中心《Create and edit files with Claude》](https://support.claude.com/en/articles/12111783-create-and-edit-files-with-claude)*

### 2. 把材料交给 Claude，说清楚要什么

可以上传 Word、PDF、表格，或直接粘贴笔记，然后说：

```text
根据我上传的季度报告，做一份 10 页的 PowerPoint，给管理层汇报用。
结构：封面 → 本季要点 → 3 页核心数据（每页一张图表）→ 问题与原因 → 下季计划 → 总结。
风格：简洁商务，每页不超过 5 条要点，标题用结论句。
最后输出 .pptx 文件。
```

官方建议：先从简单任务开始熟悉，再做复杂的；**把结构、内容和格式要求说具体**；生成后需要你检查并继续修改。

### 3. 下载和继续修改

Claude 生成的文件可以直接在对话里下载，也可以保存到 Google Drive（需连接 Google Drive）。单个文件上传、下载上限都是 30 MB。不满意就接着说，比如「第 4 页的图换成柱状图」「把总结页压缩到 3 条」，再重新生成。

## 方式二：用 Slides 模板做演示稿，再导出 PowerPoint

2026 年 9 月 16 日起，可以在任何对话里直接要一份演示稿，Claude Slides 是专门做演示稿的起点。

### 1. 开始一份 Slides

三种入口，任选其一：

- 在对话里直接说「把我们刚才的讨论做成一份演示稿」；
- 在输入框里选 **Output**，再选 **Slides** 模板；
- 去侧边栏的 **Artifacts** 标签页，从模板开始。

Slides 可以根据你的笔记、报告或对话里已有的内容生成；如果设置了设计系统，演示稿会自动用上你的颜色、字体和组件。

### 2. 编辑

- 直接告诉 Claude 要改什么，演示稿实时更新；
- 也可以自己动手**直接改某一页**；
- 想换个方向又不丢当前版本：编辑之前的某条消息，会生成一个新的对话分支，各自保留自己的演示稿。

### 3. 演示和导出

- **直接在 Claude 里演示**，不用离开页面；
- 做好后点 **Export**，导出为 **PowerPoint** 或 **PDF**；
- 也可以分享链接给同事查看或协作（默认只有自己能看）。

注意：这种模板做的演示稿，在手机 App 上只能查看，从模板开始、编辑、改分享设置要用网页版或桌面版。所有做过的演示稿都在侧边栏的 Artifacts 标签页里。

## 方式三：在 PowerPoint 里用 Claude for PowerPoint

适合「公司模板已经定好，只想让 Claude 按模板出内容」的场景。

### 支持的版本

- PowerPoint 网页版；
- Windows 版 PowerPoint（Microsoft 365 订阅，版本 16.0.13127.20296 或更高）；
- Mac 版 PowerPoint 16.46 或更高。

**不支持**：PowerPoint 2016 / 2019 买断或批量授权版、iPad 版、Android 版。

### 安装

1. 打开 Microsoft AppSource 上的「Claude for Microsoft 365」页面；
2. 点 **Get it now** 安装；
3. 打开 PowerPoint，启用加载项（Mac 在「工具 → 加载项」，Windows 在「开始 → 加载项」），用 Claude 账号登录。

企业可以由管理员在 Microsoft 365 管理中心统一部署。

### 它能做什么（官方示例提示词）

- **按模板出页**：先把公司模板应用好，再说「做一个市场规模章节，3 页，分别讲 TAM、SAM、SOM，配图示」。Claude 会读取母版里的版式、字体和配色来生成；
- **精修某一页**：选中一页说「简化这页的文字」「加一张季度趋势图」「重新梳理第 4 到第 7 页的故事线」，不会重做整份；
- **从零生成整份**：打开空白演示稿，说「做一份 10 页的演示稿，讲我们进入新市场的几个假设」；
- **要点变图表**：「把这些要点做成流程图」「做一张 Q1 到 Q4 对比的柱状图」，生成的是可编辑的原生 PowerPoint 图表，不是图片；
- **长期偏好**：在加载项侧边栏的 Settings → Instructions 里写「每条要点只写一行」「强调色用蓝色」，只对 PowerPoint 生效。

它还能和 Claude for Excel、Word、Outlook 共享同一段对话的上下文，比如在 Excel 里分析完数据，到 PowerPoint 里直接做成图表页。Excel 加载项详见本站《Claude Excel 怎么用：Claude for Excel 加载项安装与表格分析》。

**数据说明**：加载项的聊天记录存在你本机浏览器存储里，不同步到其他设备；输入输出在后端 30 天内删除。官方提醒只处理可信文件，外部下载的模板、供应商文件里可能藏有提示词注入。

## 方式四：在 Google 幻灯片里用 Claude

**Claude for Google Workspace**（beta，Pro / Max / Team / Enterprise）会在 Google 文档、表格、幻灯片里加一个 Claude 侧边栏，一次安装三个都能用：

1. 在 Google Workspace Marketplace 打开 Claude 的页面，点 **Install**，选择你的 Google 账号并授权；
2. 刷新已经打开的文件，在菜单 **Extensions（扩展程序）→ Claude → Open Claude** 打开侧边栏；
3. 用 Claude 账号登录，就可以让它新建幻灯片、精简和重新排版现有幻灯片；先选中某一页，能让它只改这一页。

![Google 文件菜单里的「Extensions → Claude → Open Claude」入口（Google 文档、表格、幻灯片相同）](seed:g214-gslides1.png)
*图片来源：[Claude 帮助中心《Use Claude in Google Docs, Sheets, and Slides》](https://support.claude.com/en/articles/16951679-use-claude-in-google-docs-sheets-and-slides)*

如果安装按钮是灰的，或提示「This application is not allowed by your administrator」，需要你们的 Google Workspace 管理员放行。

另一种方式是反过来在 Claude 里操作：打开 Google Slides 连接器后，在对话里说「用这些笔记做一份 Google Slides」，文件会在对话旁的面板里打开，你和 Claude 可以同时编辑（beta，网页版需在 Chrome 中使用）。注意要**明确说「Google Slides」**，只说「做个 deck」会生成本地文件。

## 提示词怎么写

不管用哪种方式，以下几点写清楚，出来的结果会好很多：

- **受众和目的**：给谁看、要他们做什么决定；
- **页数和结构**：大致几页、每部分讲什么；
- **每页的密度**：要点条数、是否每页配图；
- **风格**：商务 / 简约 / 活泼，主色调，是否用公司模板；
- **材料来源**：上传的文件、连接的 Drive 文件、对话里的内容；
- **交付格式**：.pptx、PDF，还是在线演示稿。

更多写法详见本站《提示词怎么写：ChatGPT / Claude 官方提示词技巧与万能公式》。

## 常见问题

**Q：Free 账号能用 Claude 做 PPT 吗？**
能。对话里生成 .pptx 文件对所有套餐开放。Slides 模板对 Free 是否开放，帮助中心和定价页写「付费套餐」，9 月 16 日的发布说明写「包括 Free 在内所有套餐」，以你账号的实际界面为准。还没有订阅的话，可以在本站开通：[/chongzhi/claude-pro](/chongzhi/claude-pro)。

**Q：为什么 Claude 只给了文字大纲，没有生成文件？**
先检查「Settings → Capabilities」里的代码执行与文件创建是否打开；然后在提示词里明确写「输出 .pptx 文件」或「做成演示稿」。

**Q：导出的 PowerPoint 能继续改吗？**
能。导出的是标准 PowerPoint 文件，可以在 PowerPoint 里改；装了 Claude for PowerPoint 的话，还能在里面继续让 Claude 改。

**Q：PowerPoint 2019 能装 Claude 加载项吗？**
不能。官方列明 2016、2019 的买断或批量授权版不支持，需要 Microsoft 365 版、网页版或 Mac 16.46 以上。

**Q：做 PPT 很耗用量吗？**
生成文件、跑代码、多步骤任务都比普通问答耗得多。用量规则详见本站《Claude 使用限制与额度：用量怎么看、什么时候重置（Free / Pro / Max / Claude Code）》。

## 参考资料

- Create and edit files with Claude（官方）：https://support.claude.com/en/articles/12111783-create-and-edit-files-with-claude
- What are artifacts and how do I use them?（官方）：https://support.claude.com/en/articles/17153992-what-are-artifacts-and-how-do-i-use-them
- Claude 发布说明（2026-09-16 条目）（官方）：https://support.claude.com/en/articles/12138966-release-notes
- Claude Cowork and chat are one Claude（官方）：https://support.claude.com/en/articles/16761823-claude-cowork-and-chat-are-one-claude
- Use Claude in Google Docs, Sheets, and Slides（官方）：https://support.claude.com/en/articles/16951679-use-claude-in-google-docs-sheets-and-slides
- Use Google Workspace connectors（官方）：https://support.claude.com/en/articles/10166901-use-google-workspace-connectors
- Claude for M365 overview（官方 Claude Docs）：https://claude.com/docs/office-agents/overview
- Use Claude for PowerPoint（官方 Claude Docs）：https://claude.com/docs/office-agents/powerpoint
- 套餐对比（官方）：https://claude.com/pricing
