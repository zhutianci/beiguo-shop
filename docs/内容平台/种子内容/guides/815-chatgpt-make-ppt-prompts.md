---
title: ChatGPT 怎么做 PPT：能直接生成 .pptx 吗？一步步做出演示文稿和可复制的指令
slug: chatgpt-make-ppt-prompts
products: [chatgpt]
models: []
accountTier: PLUS
excerpt: ChatGPT 能做 PPT 吗？能。本文按官方帮助中心讲清现在有两条正路：在 Work 里直接生成演示文稿，或在 PowerPoint 里装官方加载项改现有的稿子；再给一套从大纲到成品的 5 步做法和 6 条可以直接复制的指令。
checkedOn: 2026-10-14
sources:
  - https://help.openai.com/en/articles/20001278-creating-and-editing-documents-spreadsheets-and-presentations-with-chatgpt-work
  - https://help.openai.com/en/articles/20001242-chatgpt-for-powerpoint
  - https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex
verify:
  - 官方帮助中心没有写「在普通 Chat 对话里直接导出 .pptx」，所以本文只把 Work 和 PowerPoint 加载项当作官方的出文件路线；Chat 里只用来先出大纲
  - Work 在各套餐、各设备上的具体开放范围会随灰度变化，以你账号里能否看到 Work 开关为准
  - 指令范例是本站原创写法，官方只给了英文的「Prompts to try」，其中的结构（说清用途、资料、格式、不能改什么）来自官方建议
---

> 本文根据 OpenAI 帮助中心《Creating and editing documents, spreadsheets, and presentations with ChatGPT Work》《ChatGPT for PowerPoint》《ChatGPT Work and Codex》整理，资料核对于 2026-10-14。这几篇官方文章没有配界面截图，文中配图为本站整理的示意图。

## 适用于谁

- 要做汇报、周会、方案、课件，想让 ChatGPT 直接给一份 PPT 的人；
- 搜「ChatGPT 可以生成 PPT 吗」「ChatGPT 生成 PPT 指令」，不知道该在哪里发指令的人；
- 已经有一份 PPT，想让它帮忙加页、改风格、压缩成几页的人。

文件怎么生成、找不到下载不了怎么办，见 [/guides/chatgpt-create-word-excel-ppt](/guides/chatgpt-create-word-excel-ppt)；PowerPoint 加载项的安装与额度，见 [/guides/chatgpt-for-word-powerpoint](/guides/chatgpt-for-word-powerpoint)；各种 AI 做 PPT 的横向对比，见 [/guides/ai-make-ppt-routes-compare](/guides/ai-make-ppt-routes-compare)。这篇只讲一件事：**用 ChatGPT 从零做出一份 PPT，指令怎么写**。

## 结论先说

1. **能做**。官方现在给了两条路：**ChatGPT Work** 可以根据你的说明或资料创建、编辑文档、表格和演示文稿；**ChatGPT for PowerPoint** 是装在 PowerPoint 侧边栏里的加载项，适合改你已有的稿子。
2. **Work 是「出成品」的入口**。官方说明 Work 在网页和手机上面向符合条件的付费套餐开放，桌面 App 里按你的套餐和工作区开放；要不要用 Work、能不能用，先看你的账号里有没有 Chat / Work 的切换开关。
3. **官方没有承诺在普通 Chat 里直接导出 .pptx**。普通对话适合做前期：定受众、出逐页大纲、写每页的要点，最后再交给 Work 或 PowerPoint 做成文件。
4. **指令写法决定一半效果**。官方的建议是：说清要什么文件和用途、附上原始资料、写明格式和保存位置、说明哪些东西不能改，然后先看结果再提修改。
5. **一定要自己核对**。官方提醒生成的幻灯片不一定完全贴合你的模板，数字、引用和版式都要检查；重要的文件先复制一份再让它改。

## 步骤

### 1. 先在 Chat 里定受众和大纲（可选，但推荐）

直接说「做一份 PPT」，得到的往往是泛泛的模板。先用普通对话把内容定下来，再去出成品。可以复制这一条：

```
我要做一份给 [受众，例如：部门负责人] 的 [主题，例如：Q3 用户增长复盘] 汇报，时长 [10] 分钟。
请先不要做 PPT，只给我一份逐页大纲：每页写页面标题、这页要讲的 1 个结论、最多 3 条支撑要点。
总页数 [8~10] 页，第一页放结论，最后一页放需要对方做的决定。
```

大纲里不满意的页，在这一步改最省事。

### 2. 在 Work 里生成演示文稿

切到 **Work**（新版桌面 App 和网页版顶部有 Chat / Work 切换），按官方说明把要求说完整，并**附上资料**：

![用 ChatGPT Work 做一份 PPT 的 5 步示意图](seed:g815-ppt-work-steps.png)
*图：本站根据 [OpenAI 帮助中心：Creating and editing documents, spreadsheets, and presentations with ChatGPT Work](https://help.openai.com/en/articles/20001278-creating-and-editing-documents-spreadsheets-and-presentations-with-chatgpt-work) 整理的示意图*

可以复制的指令（把方括号里的内容换成你的）：

```
根据附件里的 [笔记 / 数据表 / 访谈记录]，做一份 [8~10] 页的演示文稿，给 [受众] 在 [场合，例如：周会] 上用。
页面结构按下面的大纲：[把第 1 步的大纲粘在这里]
要求：每页不超过 [4] 条要点；数字只能用附件里有的，附件里没有的写「待补充」；
每页的标题就是这一页的结论。输出 .pptx。
```

官方对演示文稿的提示是：**写明章节、页面类型和你会检查的视觉要素**。比如：「第 3 页用对比表，第 5 页放一张折线图，最后一页是行动清单」。

### 3. 套用你们公司的模板

不想它自己设计版面，就给它一份**参考文件**，并说清楚「照什么、换什么」。官方给的例子是：

```
沿用这份演示文稿的母版和章节顺序，但内容全部换成附件里的客户调研结果。
```

每周都做同一种格式的，可以用 **@Template-Creator** 把参考文件存成模板，以后在输入框里选 **@Presentations** 打开模板库。步骤见 [/guides/chatgpt-create-word-excel-ppt](/guides/chatgpt-create-word-excel-ppt)。

### 4. 想用 Google Slides 或在 PowerPoint 里改

- **Google Slides**：官方说明，连接并启用 Google Workspace 应用后，Work 可以创建或编辑原生的 Google Slides。做完要去 Google 里检查文件位置和分享设置。
- **PowerPoint**：官方文章写的是 Work 的桌面流程在发布时**不包含 PowerPoint**，要在 PowerPoint 里直接做，请用加载项。安装方法：打开 PowerPoint → **Home** → **Add-ins** → 搜 **ChatGPT** → 添加，再从功能区打开 ChatGPT 并登录你的 ChatGPT 账号。

加载项里官方建议的写法，是说清楚**改什么、保留什么、改在哪**，大改先让它出计划：

```
在「市场概况」那页后面加一页「风险」，沿用这份演示文稿的样式，不要改动前后的幻灯片。
```

```
动手之前，先列出你打算改哪几页、为什么。
```

选哪条路，可以看这张图：

![做 PPT 五种情况怎么选](seed:g815-ppt-routes.png)
*图：本站根据 [OpenAI 帮助中心：Creating and editing documents, spreadsheets, and presentations with ChatGPT Work](https://help.openai.com/en/articles/20001278-creating-and-editing-documents-spreadsheets-and-presentations-with-chatgpt-work) 与 [ChatGPT for PowerPoint](https://help.openai.com/en/articles/20001242-chatgpt-for-powerpoint) 整理的示意图*

### 5. 检查并逐页修改

生成之后别直接发出去：

1. 逐页核对**数字、引用、结论**是否和你的资料一致；
2. 看版式有没有溢出、图表标签是否清楚；
3. 在桌面 App 的侧边栏里可以打开生成的演示文稿，**选中**要改的地方再描述修改，比如标记某页要换布局；
4. 修改指令一次只提一两件事，例如「第 4 页的要点压缩到 3 条，并把最重要的数字放在标题里」。

## 其他可复制的指令

官方的「Prompts to try」翻成中文大概是这几类，换上你自己的资料就能用：

- 「根据这些笔记和 KPI 做一份 10 页的汇报。」
- 「把这份备忘录改成 5 页幻灯片。」
- 「把这份演示文稿改得更适合高管看。」
- 「让这些幻灯片符合我们的风格。」
- 「这份演示文稿讲的是什么故事？缺了什么？」

## 常见问题

**Q：ChatGPT 能不能直接给我一个 .pptx 下载？**
用 Work 创建演示文稿，得到的是可编辑的文件。普通对话里官方没有写这个能力，所以拿不到文件时，先确认你是不是在 Work 里，而不是在 Chat 里。

**Q：我看不到 Work，只有普通聊天，怎么办？**
Work 面向符合条件的付费套餐，并受套餐和工作区设置影响。看不到时，可以改用免费可装的 PowerPoint 加载项（官方写明 Free 和 Go 有限用量），或者在 Chat 里先出大纲，再手动放进 PowerPoint。需要升级可以看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

**Q：生成的版面不好看，能改吗？**
官方承认生成或编辑的幻灯片不一定完全贴合你偏好的样式，一些高级的图表、形状、格式和页面管理能力也可能有限。给参考文件或模板、把「不能改的东西」写明白，效果更稳定。

**Q：数字是 ChatGPT 编的怎么办？**
所以要在指令里写「数字只能用附件里的，没有的写待补充」，并在生成后逐条核对。官方也提醒，重要的文件要核对数据和引用后再用。

**Q：PowerPoint 加载项会不会弄坏我的原稿？**
官方提醒 ChatGPT 在编辑或删除内容时可能出错，重要文件先复制一份，以便回退。

## 参考资料

- OpenAI 帮助中心：Creating and editing documents, spreadsheets, and presentations with ChatGPT Work — https://help.openai.com/en/articles/20001278-creating-and-editing-documents-spreadsheets-and-presentations-with-chatgpt-work
- OpenAI 帮助中心：ChatGPT for PowerPoint — https://help.openai.com/en/articles/20001242-chatgpt-for-powerpoint
- OpenAI 帮助中心：ChatGPT Work and Codex — https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex
