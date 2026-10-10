---
title: Gemini Canvas 怎么用：写文档、生成网页和小应用、导出与分享全流程
slug: gemini-canvas-docs-apps-web-pages
products: [gemini]
models: [gemini-llm]
accountTier: FREE
excerpt: Gemini Canvas 是对话旁边的一块可编辑工作区：在里面写文档、做幻灯片、生成能直接运行的网页和小应用。本文按官方帮助中心讲入口、文档的局部修改与格式工具、应用的预览 / 代码 / 控制台、把文档变成测验 / 信息图 / 网页，以及导出和分享的方法与限制。
checkedOn: 2026-10-10
sources:
  - https://support.google.com/gemini/answer/16047321
  - https://support.google.com/gemini/answer/16275805
  - https://support.google.com/gemini/answer/13743730
  - https://support.google.com/gemini/answer/13666746
  - https://support.google.com/gemini/answer/18560919
  - https://support.google.com/gemini/answer/16279220
verify:
  - Canvas 入口：帮助中心写在输入框下方「Add Files > Canvas」，界面曾多次调整（早期在「工具」菜单），以实际为准
  - 「Select & ask」「Add Gemini features」「Suggest edits」等按钮的中文名称以实际界面为准
  - 手机 App 上 Canvas 的功能范围与网页版可能不同，本文按电脑版帮助页面编写
---

> 本文根据 Google 官方 Gemini 帮助中心整理，核对日期 2026-10-10。用 Canvas 做 PPT 的详细方法本站另有《Nano Banana 怎么做 PPT：Google 幻灯片、NotebookLM 与 Gemini 三种官方方法》，本文侧重文档、网页和应用。

## 适用于谁

- 搜「gemini canvas 是什么」「gemini canvas 怎么用」「gemini canvas 生成网页」「gemini 做 app」的人；
- 想让 Gemini 写长文，并且只改其中一段而不是整篇重写的人；
- 想不写代码就做出一个能分享的小网页、小工具的人。

## 结论先说

1. **Canvas 是对话右侧的工作区**，Gemini 在里面生成文档、幻灯片、代码或应用，你可以直接动手改，也可以选中一部分让它改；改动自动保存。
2. **入口**：输入框下方「添加文件（Add Files）→ Canvas」，然后正常写需求；想要特定形式（比如幻灯片）就在提问里说明。
3. **免费可用**：帮助中心的功能对比表里，Canvas 对所有档位都标了可用。
4. **做应用**：Canvas 能生成可以直接预览运行的网页应用，支持看代码、看控制台报错、让 Gemini 给应用加上 AI 功能。
5. **带得走**：文本可导出到 Google 文档，幻灯片可导出到 Google 幻灯片或 PDF，Python 代码可导出到 Colab；也可以生成公开链接分享。

## 一、打开 Canvas

1. 打开 gemini.google.com 并登录（Canvas 必须登录才能用）；
2. 在输入框下方点「添加文件（Add Files）」→「Canvas」；
3. 输入需求；需要参考资料的话，再点「添加文件」上传文件或图片；
4. 提交。Gemini 会在右侧打开 Canvas 面板并开始生成。

想让它产出特定类型，在提问里直接说：

- 「写一份关于……的方案文档」
- 「做一份关于……的幻灯片演示文稿」
- 「出一套测验题，考考我对……的掌握」
- 「做一个可以……的网页小工具」

## 二、在 Canvas 里写文档

**直接改**：把 Canvas 当普通编辑器，点进去就能打字，改动自动保存。

**选中一段让 Gemini 改**：

1. 在 Canvas 里用鼠标选中要改的文字；
2. 在输入框里说明怎么改，例如「这段压缩到三句话」「换成更正式的语气」；
3. 回车。只有选中的部分会被修改。

选中文字后还可以点「建议修改（Suggest edits）」，让 Gemini 主动提出改法。

**一键调整**：面板里有两个快捷按钮——

- 「调整长度（Change length）」：选择想要的篇幅；
- 「调整语气（Change tone）」：在随意和正式之间选择。

**格式工具栏**：选中文字后，顶部工具栏可以设置标题层级、加粗、斜体、项目符号列表和编号列表；工具栏显示不全时点「更多」。

**版本**：顶部的「上一个版本 / 下一个版本」可以在保存过的版本之间切换，改坏了能退回去。

**LaTeX 公式**：面板右上角「创建（Create）→ LaTeX」可以在文档里加入公式。含 LaTeX 的文档能导出为 PDF，下载前可以预览；复制含公式的回答时，得到的是未渲染的 LaTeX 源码。

## 三、把文档变成别的东西

打开含文档的对话，点 Canvas 面板右上角「创建（Create）」（官方注明此功能暂不对 18 岁以下用户开放）：

| 选项 | 得到什么 |
| --- | --- |
| 输入描述 | 按你的描述把文档变成幻灯片、自定义可视化或应用 |
| 音频概览（Audio Overview） | 一段播客式的讲解音频 |
| 测验（Quiz） | 一套可以直接作答的测验 |
| 信息图（Infographic） | 一张信息图 |
| 网页（Web page） | 一个网页 |

Deep Research 的报告也是在 Canvas 里打开的，所以同样可以用这个菜单把报告变成音频、测验或网页。

## 四、用 Canvas 做网页和小应用

提出需求后，Gemini 会写出代码并在 Canvas 里直接运行出预览。之后可以这样迭代：

- **用对话改**：在输入框里说「把按钮改成蓝色」「加一个导出 CSV 的功能」，Gemini 会更新代码，改动自动保存；
- **看和改代码**：面板右上角点「代码（Code）」，可以直接编辑；
- **看报错**：右上角「显示控制台（Show console）」能看到预览运行时的错误和日志，把报错贴给 Gemini 让它修；
- **看最近改了什么**：「代码 → 显示最近的更改（Show recent changes）」；
- **选中界面元素提要求**：右下角「选择并提问（Select & ask）」，用鼠标框选要改的区域，再输入修改要求；
- **给应用加 AI 功能**：右下角「添加 Gemini 功能（Add Gemini features）」，可以让应用具备生成文字、生成图片等能力（需年满 18 岁）。添加后，左侧对话里会说明加了什么。

一个提问示例：

```
做一个单页的番茄钟网页：25 分钟专注、5 分钟休息，可以暂停和重置，
完成的番茄数显示在页面上方，整体用浅色简洁风格，适配手机屏幕。
```

## 五、导出

打开对话，点 Canvas 面板右上角「分享与导出（Share & export）」：

| 内容类型 | 导出方式 |
| --- | --- |
| 文本 | 「导出到文档（Export to Docs）」在云端硬盘新建 Google 文档；或「复制内容」 |
| 幻灯片 | 「导出到幻灯片（Export to Slides）」；也可以导出为 PDF |
| Python 代码 | 面板顶部「导出到 Colab」，再点「打开 Colab」 |
| 含 LaTeX 的文档 | 导出为 PDF |

## 六、分享 Canvas 作品

1. 「分享与导出 → 分享（Share）」；
2. 如果分享的是应用，先查看「应用信息」；
3. 复制 g.co/gemini/share 开头的链接，或直接发到列出的社交平台。

分享应用前要读懂的一句官方说明：**任何拿到公开链接的人，都可以查看和修改与这个应用关联的数据**。应用信息页会告诉你这个应用是否——

- 在用户之间共享数据；
- 使用了 Gemini 驱动的功能（比如用 AI 生成文字和图片）；
- 跨会话、跨设备保存数据（比如一个用来长期记录的打卡应用）。

所以不要在要公开分享的应用里存放私人数据。

**别人打开你的链接后**：可以点底部「复制 Canvas（Copy Canvas）」做一份自己的副本继续改。限制：分享链接只能在网页版打开，手机 App 里打不开；18 岁以下用户暂不可用。撤回分享的方法见本站《Gemini 分享对话怎么操作》。

## 七、注意事项

- **删除对话会连带删除 Canvas 内容**：帮助中心写明，在最近对话里删除一个对话，会同时删除其中创建的 Canvas 文档和应用。重要的东西先导出；
- **技能暂时不能和 Canvas 一起用**（见本站 Gems 与 Skills 那篇）；
- **额度**：Canvas 本身不限档位，但生成长文档和应用会消耗账号的用量额度，见本站《Gemini 怎么看额度》；
- **核对内容**：生成的文档可能有事实错误，生成的代码可能受开源许可证约束——帮助中心提醒，使用 Gemini 生成的代码由你自己负责。

## 常见问题

**Q：找不到 Canvas 入口？**
先确认已登录。入口在输入框下方的「添加文件」菜单里；这个位置调整过多次，找不到时看看输入框附近的「工具」或「+」菜单。

**Q：Canvas 生成的 PPT 怎么下载？**
「分享与导出 → 导出到幻灯片」会在你的 Google 幻灯片里生成一份可编辑的演示文稿，也可以直接导出 PDF；需要 .pptx 的话，在 Google 幻灯片里另存即可。

**Q：做出来的网页能绑定自己的域名、长期运行吗？**
帮助中心提供的是 g.co/gemini/share 的公开分享链接，没有提到自定义域名或托管服务。想正式上线，可以把代码复制出来自行部署。

**Q：和 ChatGPT Canvas、Claude Artifacts 有什么不同？**
三者都是「对话旁边的可编辑成品区」。各自的现状见本站《ChatGPT Canvas 不见了？2026 年 Canvas 怎么用、改成了什么（写作块 / 代码块）》和《Claude Artifacts 是什么、怎么用：创建、分享与导出（2026 新版）》。

## 参考资料

- Create docs, apps & more with Canvas（Gemini 帮助中心）：https://support.google.com/gemini/answer/16047321
- Gemini Apps limits & upgrades for Google AI subscribers（功能对比表）：https://support.google.com/gemini/answer/16275805
- Share your chats from Gemini Apps：https://support.google.com/gemini/answer/13743730
- Find & manage your recent chats in Gemini Apps（删除对话的影响）：https://support.google.com/gemini/answer/13666746
- About the transition from Gems to skills（技能暂不支持的功能）：https://support.google.com/gemini/answer/18560919
- Learn about responses from Gemini Apps：https://support.google.com/gemini/answer/16279220
