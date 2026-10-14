---
title: ChatGPT 怎么做思维导图：用 Mermaid 代码生成并在对话里预览，没有 Preview 按钮怎么办
slug: chatgpt-mind-map-mermaid
products: [chatgpt]
models: []
accountTier: FREE
excerpt: ChatGPT 能做思维导图吗？按 OpenAI 帮助中心，它的代码块能预览 Mermaid 图、SVG、HTML 页面。本文讲让 ChatGPT 输出 Mermaid 思维导图代码、点 Preview 查看和修改的 4 步，附可复制的指令和代码示例，以及没有 Preview 时的替代做法。
checkedOn: 2026-10-14
sources:
  - https://help.openai.com/en/articles/20001246-working-with-writing-blocks-and-code-blocks-in-chatgpt
  - https://help.openai.com/en/articles/6825453-chatgpt-release-notes
verify:
  - 官方只说代码块支持预览的类型包括「Mermaid 图」，没有说明其中是否包括 mindmap（思维导图）这一种图类型；文中的 mindmap 写法是 Mermaid 官方语法，能否在 ChatGPT 的 Preview 里显示，以点开后实际是否出现 Preview 为准
  - 官方说 Preview 按钮并非每个对话都有，取决于代码块类型、设备、套餐、工作区设置和账号的开通情况
  - 「输出缩进大纲再导入思维导图软件」是通用做法，各软件的导入方式不同，不属于官方内容
---

> 本文根据 OpenAI 帮助中心《Working with writing blocks and code blocks in ChatGPT》和发布说明整理，资料核对于 2026-10-14。官方文章没有配界面截图，文中配图为本站整理的示意图。

## 适用于谁

- 搜「ChatGPT 思维导图」，想让它把一篇文章、一个主题画成思维导图的人；
- 想要的是能看的图，而不是一大段缩进文字的人；
- 听说过 Mermaid，但不知道怎么在 ChatGPT 里用的人。

## 结论先说

1. **ChatGPT 没有一个叫「思维导图」的专用按钮**。官方文档里没有这样的功能。可行的做法是让它输出**图表代码**，再用对话里的代码块预览查看。
2. **官方说代码块支持预览的类型包括：HTML 页面、React 组件、SVG 图像、Mermaid 图、Vega 或 Vega-Lite 图表**。思维导图可以用 Mermaid 来画。
3. **在代码块上点 Preview**，就能在 ChatGPT 里看结果；点 **Code** 切回代码。官方说：**如果没有 Preview 按钮，说明这个代码块不支持预览**。
4. **能不能显示，要实际看**：官方只说支持「Mermaid 图」，没有说里面有没有思维导图（mindmap）这种图类型，所以请以你点开后的实际效果为准。
5. **预览在沙盒里进行**：官方说，代码预览和运行都使用沙盒环境；如果预览需要外部资源，ChatGPT 可能会先征求你的许可。

## 步骤

![用 ChatGPT 做思维导图的 4 步](seed:g829-mindmap-steps.png)
*图：本站根据 [OpenAI 帮助中心：Working with writing blocks and code blocks in ChatGPT](https://help.openai.com/en/articles/20001246-working-with-writing-blocks-and-code-blocks-in-chatgpt) 整理的示意图*

### 1. 把主题和层级交代清楚

指令可以这样写（把方括号里的换成你的）：

```
请用 Mermaid 的 mindmap 语法，为「[时间管理]」画一张思维导图。
要求：根节点是主题；3 到 5 个一级分支；每个分支下 2 到 4 个要点；
每个节点不超过 10 个字；只输出一个 mermaid 代码块，不要多余的解释。
```

如果你有一篇资料要整理，可以先上传文件或粘贴文字，再问：

```
把下面这篇文章的结构整理成思维导图，用 Mermaid 的 mindmap 语法输出。
一级分支对应文章的大标题，二级节点对应小标题，三级只放关键数据。
[粘贴文章]
```

### 2. 看代码块

ChatGPT 通常会把代码放进代码块里，官方说代码块会显示语言标签，比如 Python、JavaScript、HTML。Mermaid 代码一般会以 `mindmap` 开头，类似这样：

```
mindmap
  root((时间管理))
    规划
      每周目标
      每日三件事
    执行
      番茄钟
      先做最难的
    复盘
      每周回顾
      调整计划
```

### 3. 点 Preview

在代码块上点 **Preview**，结果会显示在 ChatGPT 里。官方还说，支持的代码块可以：复制代码、直接编辑、让 ChatGPT 帮忙修改、全屏打开、在 **Code** 和 **Preview** 之间切换；发布说明（2026-02-27）说，代码块里的流程图、图表这类可视化可以导出为图片。

### 4. 要改就直接说

```
把「执行」这个分支拆成「专注」和「避免打断」两个分支，每个分支 3 个要点；其他不变。
```

```
节点文字太长了，全部缩短到 8 个字以内，保持原来的层级。
```

官方说，对支持的代码块所做的编辑，会在短暂延迟后随对话一起保存，ChatGPT 之后回答追问时可以用到最新的版本；但在临时聊天里，编辑可能不会在对话结束后保留。

## 没有 Preview，或者想要别的形式

![代码块上没有 Preview 按钮时的 5 种处理](seed:g829-no-preview.png)
*图：本站根据 [OpenAI 帮助中心：Working with writing blocks and code blocks in ChatGPT](https://help.openai.com/en/articles/20001246-working-with-writing-blocks-and-code-blocks-in-chatgpt) 整理的示意图*

- **改成 SVG 或 HTML**：官方列在支持预览里。可以说「改用 SVG 画成同样的思维导图」，得到的是一张图；
- **要在别处继续编辑**：让它输出带缩进的文字大纲，再导入你常用的思维导图软件。这是通用做法，各软件的导入方式不同；
- **要放进 PPT 或文档**：用 Work 做，见 [/guides/chatgpt-make-ppt-prompts](/guides/chatgpt-make-ppt-prompts)；
- **看不到任何操作**：官方说你不一定能在每个对话里看到每个操作，取决于代码块的类型、设备、套餐、工作区设置，以及功能是否对你的账号开通。

## 常见问题

**Q：为什么我点了 Preview，却是一堆报错或空白？**
可能是代码本身有语法问题。可以把报错告诉 ChatGPT，说「这段 Mermaid 代码预览报错，请修正语法，保持内容不变」。

**Q：能不能导出成图片或 XMind 文件？**
图片：官方发布说明（2026-02-27）写道，在代码块里创建的流程图、图表和数据可视化，现在可以导出为图片，方便再使用；具体按钮位置以界面为准。XMind 等专用格式：官方文档没有写导出功能，需要的话让 ChatGPT 输出缩进大纲，再用专门的软件导入处理。

**Q：能用在手机上吗？**
官方说可用的操作取决于设备。先在你的手机上试试代码块有没有 Preview。

**Q：和 Canvas 有什么关系？**
Canvas 是另一个协作写作和写代码的工作区，见 [/guides/chatgpt-canvas](/guides/chatgpt-canvas)。本文讲的是对话里的代码块预览。

**Q：想把整篇文章总结成要点，用得着画图吗？**
不一定。文章总结可以直接看 [/guides/chatgpt-summarize-pdf](/guides/chatgpt-summarize-pdf)；只有当你想把结构一眼看清楚时，才值得画导图。

## 参考资料

- OpenAI 帮助中心：Working with writing blocks and code blocks in ChatGPT — https://help.openai.com/en/articles/20001246-working-with-writing-blocks-and-code-blocks-in-chatgpt
- OpenAI 帮助中心：ChatGPT release notes — https://help.openai.com/en/articles/6825453-chatgpt-release-notes
