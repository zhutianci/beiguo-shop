---
title: ChatGPT 怎么做贴图和表情包：透明背景、统一风格、局部修改和保存的完整流程
slug: chatgpt-make-stickers-emoji-pack
products: [chatgpt]
models: []
accountTier: FREE
excerpt: 想用 ChatGPT 做 LINE 贴图、微信表情包？按 OpenAI 帮助中心讲清 ChatGPT Images 能做的事：按指令让背景透明、选画面比例、用编辑器圈选局部修改、保存下载。再给出做一整套风格统一贴图的提示写法，以及上传平台前该注意什么。
checkedOn: 2026-10-14
sources:
  - https://help.openai.com/en/articles/11084440-images-in-chatgpt
  - https://help.openai.com/en/articles/12677804-what-is-chatgpt-faq
  - https://help.openai.com/en/articles/8912793-provenance-signals-in-openai-generated-content
verify:
  - 官方没有写「做贴图」专门教程；文中只用到官方写明的能力：透明背景、比例选择、模板、编辑器、保存与分享
  - 「怎么让一整套风格统一」是本站的写法建议，不是官方说明，效果因模型和提示而异
  - LINE、微信等平台的贴图尺寸、张数、审核规则本文没有核对，以平台为准；也不要用知名角色或他人肖像做贴图
---

> 本文根据 OpenAI 帮助中心《Images in ChatGPT》《What is ChatGPT: FAQ》和《Provenance signals in OpenAI-generated content》整理，资料核对于 2026-10-14。官方文章没有配可用的界面截图，文中配图为本站整理的示意图。

## 适用于谁

- 搜「ChatGPT 做贴图」「ChatGPT 做 LINE 贴图」，想自己做一套聊天贴图、表情包的人；
- 已经能让 ChatGPT 出一张图，但不知道怎么保证背景透明、风格统一、怎么只改局部的人。

生图额度见 [/guides/chatgpt-image-limits](/guides/chatgpt-image-limits)；写生图提示的要点见 [/guides/chatgpt-image-prompt-commands](/guides/chatgpt-image-prompt-commands)；图上的中文乱码见 [/guides/chatgpt-image-chinese-text](/guides/chatgpt-image-chinese-text)。

## 结论先说

1. **官方说 ChatGPT Images 能按指令加文字、加细节、让背景透明**。做贴图最关键的「透明背景」，直接在提示里写出来。
2. **所有套餐都能用 Images**，网页、iOS、安卓都有；Images with thinking（先规划再出图）面向 Plus、Pro、Business。
3. **可以选任意画面比例**：用 **Aspect ratio** 选择器，或在提示里写明比例。
4. **局部修改用编辑器**：点图片进入编辑器，用 **Select** 圈出要改的区域，再用文字描述怎么改；官方提醒圈选不一定精确，改动可能超出你选的范围。
5. **做一整套统一风格的贴图，官方没有专门功能**，下面的方法是本站的写法建议。
6. **图片会带看不见的来源标识**：见 [/guides/chatgpt-image-watermark-provenance](/guides/chatgpt-image-watermark-provenance)。

## 步骤

![用 ChatGPT Images 做一张贴图的流程](seed:g832-sticker-flow.png)
*图：本站根据 [OpenAI 帮助中心：Images in ChatGPT](https://help.openai.com/en/articles/11084440-images-in-chatgpt) 整理的示意图*

### 1. 先做第一张：定下角色

在对话里直接描述，或点 **More → Images**。可以复制这一条（换成你的角色）：

```
画一张聊天贴图：一只圆脸的橘色小猫，粗黑描边，扁平插画风格，表情是开心地挥手。
白色粗描边，背景透明，主体居中，留出一圈边距，画面比例 1:1。
图上不要文字。
```

想要带字的，把文字写进去，并说明字体风格和位置：

```
贴图右下角加一行字：「收到！」，圆润的手写体，深棕色，字要完整、清楚。
```

中文字出错的处理方法见 [/guides/chatgpt-image-chinese-text](/guides/chatgpt-image-chinese-text)。

### 2. 做一整套：保持风格统一（本站建议）

官方没有「一套贴图」的功能。比较稳妥的做法是：

1. **先做满意的第一张**，把它当成「角色定稿」；
2. 在**同一个对话**里继续，每次只换表情或动作，其余写「保持角色、配色、描边、风格不变」；
3. 想一次出多张，也可以让它画一张包含 8 或 9 个表情的整版图，再逐个修；
4. 每张都检查：脸部比例、配色、描边粗细有没有跑偏，跑偏的单独重画。

指令示例：

```
保持上面这只橘色小猫的造型、配色、描边和风格完全不变，只改表情和动作：生气地叉腰。
背景透明，比例 1:1，不要文字。
```

本站另有按主题整理的贴纸和表情包提示词，可在提示词库里搜「贴纸」「表情包」。

### 3. 局部不满意：用编辑器

按官方，编辑图片有两种方式：

- **用选择工具圈出一块区域**，再在聊天里描述怎么改；
- **不用选择工具**，直接在对话里描述怎么改。

打开编辑器：点对话里或 **Images** 里的图片。编辑器里可以：**Select** 选出要改的区域；**Aspect ratio** 以另一个比例重新生成；**Undo / Redo** 修改选择；**Cancel** 重来；改完点 **Save**。官方还说你也可以不用选择工具，直接在编辑器的文本框里描述。

在手机 App 上，点开 ChatGPT Images 生成的图片，可以编辑或评论；手机上的图片控件还有 **Resize** 和 **Remove**。手机上还可以用 **@ → Sketch** 先画草图，再配文字说明让它生成；比如先涂一个简单的小人轮廓，写「把它变成扁平风格的贴图」。

### 4. 保存和下载

官方说，你用 ChatGPT 创建的图片会自动保存在 **Images** 里，方便浏览和重复使用。点开一张图，可以：**Copy** 复制到剪贴板；**Save** 下载到设备；**Share** 发到其他应用。

要删除某张图片，需要删除生成它的那个对话（网页上把鼠标放到对话标题上，点 **•••** → **Delete**；手机上长按对话标题，选 **Delete**）。

## 做贴图时常见问题

![做贴图时常见问题怎么办：风格统一、局部修改、背景透明、平台要求](seed:g832-sticker-issues.png)
*图：本站根据 [OpenAI 帮助中心：Images in ChatGPT](https://help.openai.com/en/articles/11084440-images-in-chatgpt) 整理的示意图；其中「一整套风格统一」一条是本站建议*

## 上传到平台之前

- **规格和审核以平台为准**：LINE、微信等平台对贴图的尺寸、张数、文件格式和审核有各自的要求，本文没有核对，请先看平台官方的创作指南；
- **版权和肖像**：不要用知名动漫、影视角色或他人肖像做贴图；用自己的原创角色更安全；
- **文字**：贴图里的文字要自己逐个核对，AI 生成的文字容易出错。

## 常见问题

**Q：Free 能做吗？**
官方说 ChatGPT Images 面向所有套餐开放，不过生图有额度限制，见 [/guides/chatgpt-image-limits](/guides/chatgpt-image-limits)。

**Q：做出来的图背景不是透明的怎么办？**
官方说它能按指令让背景透明，所以在提示里明确写「背景透明」；还不行就说「重新生成，这次背景必须是透明的」。如果你下载后看到的是白色或棋盘格，请确认保存的是你期望的文件，并在其他软件里检查。

**Q：能一次生成 9 宫格或 16 宫格的表情包吗？**
可以写进提示里让它画整版，但每个格子的细节和一致性要自己检查，必要时用编辑器局部修改，或单独重画。

**Q：图片标识（水印）会不会影响用在贴图上？**
官方说明的是看不见的内容凭证和水印，见 [/guides/chatgpt-image-watermark-provenance](/guides/chatgpt-image-watermark-provenance)；平台是否接受 AI 生成的作品，以平台规则为准。

## 参考资料

- OpenAI 帮助中心：Images in ChatGPT — https://help.openai.com/en/articles/11084440-images-in-chatgpt
- OpenAI 帮助中心：What is ChatGPT: FAQ — https://help.openai.com/en/articles/12677804-what-is-chatgpt-faq
- OpenAI 帮助中心：Provenance signals in OpenAI-generated content — https://help.openai.com/en/articles/8912793-provenance-signals-in-openai-generated-content
