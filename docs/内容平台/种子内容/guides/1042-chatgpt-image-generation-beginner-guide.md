---
title: ChatGPT 生图怎么用：新手完整流程，从一句话画图到模板、草图、局部改图和保存（ChatGPT Images）
slug: chatgpt-image-generation-beginner-guide
products: [chatgpt]
models: [gpt-image-2]
accountTier: FREE
excerpt: ChatGPT 怎么画图、怎么改图？按官方帮助中心走一遍：对话里直接说或进 Images 页，用模板和手机草图起步，用编辑器框选局部修改、换比例，再保存、分享、删除。附可复制的提问。
checkedOn: 2026-10-25
sources:
  - https://help.openai.com/en/articles/11084440-images-in-chatgpt
  - https://help.openai.com/en/articles/9275245-chatgpt-free-tier-faq
  - https://chatgpt.com/pricing
verify:
  - 官方文章说生成「可能需要几分钟」，Images 2.5 官方称更快；具体耗时官方没有给数字，正文没有写秒数
  - 官方没有公布每个套餐的生图张数，只说所有套餐都能用、带思考的生图是 Plus、Pro、Business；正文没有写任何张数
  - 官方说「Templates 尚未在 Work 模式里提供」「手机上才有 @ Sketch」，界面可能随版本变化
  - 文中的提问示例是我们写的示范，不是官方原话；官方提醒编辑高亮不总是精确
---

> 本文根据 OpenAI 帮助中心《Images in ChatGPT》、Free 版常见问题和价格页整理，资料核对于 2026-10-25。官方当前叫法是 **ChatGPT Images**（现为 2.5 版）。模型名字和版本关系见 [/guides/gpt-image-2-how-to](/guides/gpt-image-2-how-to)；提示词写法见 [/guides/chatgpt-image-prompt-commands](/guides/chatgpt-image-prompt-commands)；额度见 [/guides/chatgpt-image-limits](/guides/chatgpt-image-limits)。本文讲**从头到尾的操作流程**。

## 适用于谁

- 第一次用 ChatGPT 画图，不知道从哪里开始的人；
- 搜「chatgpt 画图」「chatgpt 图片生成」的人；
- 图画出来了，不知道怎么只改一部分、怎么换比例、怎么保存的人；
- 想知道哪些生图功能是 Plus 才有的人。

## 结论先说

1. **所有套餐都能生图**，网页、iOS、Android 都行。官方说，**带思考的生图（Images with thinking）是 Plus、Pro、Business** 的。
2. **两个入口：** 在任意对话里直接说想要什么图；或者点 **More → Images**，也可以在侧栏打开 **Images** 页。
3. **改图有两种方式：** 用选择工具框出区域再描述，或者不框选、直接在对话里描述。想只改某个区域，就在提示里把那个区域写清楚。
4. **官方提醒：高亮不总是精确，改动可能超出你框选的范围。**
5. **生成的图自动保存在 Images 里**，可以复制、保存到设备、分享。想删图，要删除生成它的那个对话。
6. 想要带思考的生图和更高用量，可以看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

![ChatGPT 生图从一句话到改图的 5 步：描述、模板或草图、编辑器、换比例、保存](seed:g1042-image-workflow.png)
*图：本站根据 [OpenAI 帮助中心：Images in ChatGPT](https://help.openai.com/en/articles/11084440-images-in-chatgpt) 整理的示意图*

## 一、第一步：说出你要的图

最简单的做法，就是在对话里直接描述。官方说，ChatGPT Images 可以按指令**添加文字、添加画面细节、把背景做成透明**。生成可能要几分钟，期间可以继续用 ChatGPT。

可以直接复制的例子：

> 画一张竖版海报，比例 3:4：一杯冒热气的拿铁放在木桌上，背景是清晨的窗边，暖色调，扁平插画风格。顶部写大字「周一续命」。

> 画一个猫咪咖啡店的 Logo，圆形，奶油色背景，背景透明，文字只写「喵咖」。

官方对海报类的建议是：说明用途，以及你想放进去的文字。

## 二、第二步：需要起点时，用模板或草图

### 模板（网页和手机）

1. 打开侧栏，点 **Images**；
2. 点 **Templates**，浏览类别；
3. 选一个类别，再选一个模板（官方举例是海报、Logo）；
4. 填入你的细节，发送；
5. 如果 ChatGPT 追问（比如视觉风格），点选项或自己输入；有上传入口时，可以加一张参考图。

官方说，模板还没有在 **Work 模式**里提供。

### 草图（仅手机 App）

1. 在消息框输入 **@**，选 **Sketch**；
2. 画草图，可以选颜色、擦除、撤销一笔；
3. 确认草图，点对勾；
4. 写上你要的图：主体、颜色、风格；
5. 发送。

官方示例：画一座房子，写「把这张草图变成一幅水彩画，红色的房子，周围是树」。

## 三、第三步：用编辑器改图

点开对话里的图，或在 **Images** 页点开图，就进入编辑器。编辑器里可以：

- **Select**：框出要改的区域；
- **Aspect ratio**：用别的比例重新生成；
- **Undo / Redo**：改选区；
- **Cancel**：重来；
- **Save**：改好后保存。

也可以不用选择工具，直接在编辑器的文字框里描述改动。

**手机上**：点开图片全屏，可以 **Edit**（在对话里描述）或 **Select**（用滑杆调选择工具大小，选完点 **Next**，再描述改动）；手机端的图片控制里还有 **Resize** 和 **Remove**。

可以复制的改图提示：

> 只把图中人物的衬衫改成蓝色，其他部分保持不变。

> 把背景换成傍晚的海边，主体位置和光线不变。

![图改得不对时怎么办：框选局部、范围被超出、换比例、文字与透明背景、找不到旧图](seed:g1042-image-fix.png)
*图：本站根据 [OpenAI 帮助中心：Images in ChatGPT](https://help.openai.com/en/articles/11084440-images-in-chatgpt) 整理的示意图*

## 四、第四步：换比例

两种办法：在编辑器里用 **Aspect ratio** 选择器；或者在提示里直接写比例，比如「3:4 竖版」「16:9 横版」。官方说，可以生成任意比例的图。

## 五、第五步：保存、分享、管理

- **自动保存**：用 ChatGPT 生成的所有图，都自动存在 **Images** 里，网页和手机都能进，点 **Create Image** 再画；
- **打开一张图**可以：**Copy**（复制到剪贴板）、**Save**（下载到设备）、**Share**（发给其他 App）；
- **删除**：要删 My images 里的图，就删除生成它的那个对话。网页上把鼠标放到对话标题上，点「•••」→ **Delete**；iOS、Android 长按对话标题，选 **Delete**；
- **分享提示词**：手机上点 **Share → Prompt template → Copy link**，别人可以用同样的提示词自己生成一张。

## 六、不是你的问题的几件事

- **DALL·E**：官方说，已经把官方的 DALL·E GPT 从 ChatGPT 下线，继续画图请用 ChatGPT Images；
- **GPT 里的生图**：官方说，在 GPT 的 **Capabilities** 里启用 **Image Generation**，GPT 也能用新模型生图；
- **Codex 里也能生图**，用法见官方 Codex 文档；
- **中文字有问题**：见 [/guides/chatgpt-image-chinese-text](/guides/chatgpt-image-chinese-text)；
- **生图失败**：见 [/guides/chatgpt-image-failed](/guides/chatgpt-image-failed)；
- **生成图的水印和来源标记**：见 [/guides/chatgpt-image-watermark-provenance](/guides/chatgpt-image-watermark-provenance)；
- **上传图片让它看懂**：见 [/guides/chatgpt-image-recognition](/guides/chatgpt-image-recognition)。

## 常见问题

**Q：免费版能画图吗？**
能。官方价格页写 Free 的生图是 Limited（有限），官方 Free 文章说到上限时会提示，具体张数不公开。

**Q：为什么画图要等好几分钟？**
官方说，生成时间取决于请求的复杂程度，可能需要几分钟，期间可以继续聊天。

**Q：为什么我只想改一处，别的地方也变了？**
官方说，高亮并不总是精确，编辑可能超出选区。可以在提示里补一句「只改这一处，其余保持不变」。

**Q：我能用它做证件照吗？**
不建议把它生成的图当作官方证件照使用，证件照要按办理机构的要求拍摄。

## 参考资料

- OpenAI 帮助中心：Images in ChatGPT — https://help.openai.com/en/articles/11084440-images-in-chatgpt
- OpenAI 帮助中心：ChatGPT Free Tier FAQ — https://help.openai.com/en/articles/9275245-chatgpt-free-tier-faq
- ChatGPT 价格页 — https://chatgpt.com/pricing
