---
title: gpt-image-2 怎么用：在 ChatGPT 里生成、编辑与改图
slug: gpt-image-2-how-to
products: [chatgpt]
models: [gpt-image-2]
accountTier: PLUS
excerpt: gpt-image-2（ChatGPT Images 2.0）在 ChatGPT 里怎么用？本文讲清它和 Images 2.5 的关系，以及从文字生成、上传照片改图、框选局部修改、换比例到带思考生图的完整操作。
checkedOn: 2026-10-07
sources:
  - https://help.openai.com/en/articles/11084440-images-in-chatgpt
  - https://openai.com/index/introducing-chatgpt-images-2-0/
  - https://openai.com/index/introducing-chatgpt-images-2-5/
  - https://help.openai.com/en/articles/6825453-chatgpt-release-notes
  - https://developers.openai.com/api/docs/models/gpt-image-2
  - https://developers.openai.com/api/docs/guides/image-generation
  - https://openai.com/academy/image-generation/
  - https://www.techradar.com/ai-platforms-assistants/chatgpt/chatgpt-images-2-5-is-out-ive-been-testing-it-for-24-hours-and-these-are-the-3-new-features-youll-actually-use
---

## 适用于谁

- 搜「gpt-image-2 怎么用」「ChatGPT 怎么用 image2」，想在 ChatGPT 里用上 OpenAI 新一代图像模型的人；
- 想用 ChatGPT 改照片、换背景、做海报、做带文字的信息图；
- 本文按 Plus 账号写，Free 也能完成大部分操作，只是额度更少、没有「带思考生图」。

本文根据 OpenAI 官方帮助中心、发布说明、开发者文档和公开资料整理，界面截图来自官方或第三方公开文章，多为英文界面。

## 先弄清：gpt-image-2 和你在 ChatGPT 里用的是什么关系

- **gpt-image-2** 是 OpenAI 于 2026 年 4 月 21 日发布的图像模型。在 ChatGPT 里它的名字是 **ChatGPT Images 2.0**；在 API 里，开发者用 `gpt-image-2` 这个名字调用。
- 2026 年 9 月 8 日，OpenAI 又发布了 **ChatGPT Images 2.5**，面向所有套餐的 ChatGPT、ChatGPT Work 和 Codex 用户推出，现在 ChatGPT 里生图用的是 2.5。官方称它比 2.0 生成更快（延迟最多降低一半）、局部编辑更准、多轮修改更稳定。

所以在 ChatGPT 里，你**不需要、通常也没有地方手动选「gpt-image-2」**——直接让 ChatGPT 画图就行。下面的操作方法对 2.0 和 2.5 通用；2.5 额外加了几个工具，文末单独说明。

## 结论先说

1. **两种入口**：在任意对话里直接说「帮我画……」；或打开「图片（Images）」页专门生图。
2. **改图优先用编辑器**：点开图片，用选择工具框出要改的地方，再用一句话描述改动，比重新生成更稳。
3. **复杂的图用带思考生图（Plus）**：在模型选择器里选带推理的档位后再生图，它会先规划、可以联网查资料，适合信息图、带大量中文的海报。

## 步骤

### 1. 从文字生成

在对话里直接描述。好的描述包括五部分：**主体、场景、风格、构图 / 比例、画面里的文字**。OpenAI 的官方教程也建议：一般一到三句话说清用途、主体、发生什么、在哪里、什么风格就够了，清楚比花哨更重要。

> 画一张竖版海报，比例 3:4。主体是一杯冒热气的拿铁，放在木桌上；背景是清晨的窗边，暖色调；风格为扁平插画。顶部大字「周一续命」，底部小字「早八咖啡 · 第二杯半价」。

这一代模型对画面中的文字（包括多种语言）支持明显变好，但官方仍建议把要出现的文字用引号写清楚、字数尽量少，并写明字体风格和位置。生成可能需要几分钟，期间可以继续聊天。

### 2. 用「图片」页集中创作

在侧边栏打开「图片（Images）」，或在对话里点「更多 → 图片」；手机 App 上，「图片」在对话列表上方的横向入口栏里。这里可以生成新图，也能看到你所有生成过的图（自动保存在图库里）。Images 2.5 之后，图片页还多了「模板（Templates）」入口，手机端还能从这里开始画草图。

![手机端「图片」页：顶部有「热门 / 模板」切换，左图是「从草图开始」入口，右图是草图画板（英文界面）](seed:g08-images-page-sketch.webp)
*图片来源：[TechRadar](https://www.techradar.com/ai-platforms-assistants/chatgpt/chatgpt-images-2-5-is-out-ive-been-testing-it-for-24-hours-and-these-are-the-3-new-features-youll-actually-use)（原图注明 Image credit: OpenAI）*

### 3. 上传照片来改

点输入框的「+」上传照片，再描述要改什么：

- 换背景：「把背景换成纯白色，人物不变」；
- 换风格：「保持构图，改成水彩画风格」；
- 合成：上传多张图，「把图 1 的产品放到图 2 的场景里」。

官方建议多图时按顺序称呼「图 1、图 2」，并用左 / 右、前景 / 背景这类空间词说明关系；改图时写明「只改 X，其余保持不变」。涉及真人照片时，只处理你自己或已获得同意的照片。

### 4. 框选局部修改

点开一张图进入编辑器（网页端）：

1. 点**选择（Select）**工具，涂抹要改的区域；
2. 在编辑器的输入框里描述修改，比如「把这块招牌上的字改成『营业中』」；
3. 不满意就用**撤销 / 重做（Undo / Redo）**调整选区，或点**取消（Cancel）**重来，改好后点**保存（Save）**。

也可以不框选，直接在对话里描述整体修改。官方提醒：涂抹的选区不一定精确，修改可能会超出你选的范围。

手机 App 上，点开生成的图会全屏显示，下方有编辑、评论、调整尺寸、移除等按钮；选「选择」后可以用滑块调整画笔大小，涂好后点「下一步」再描述修改。

### 5. 换比例

在编辑器里点**宽高比（Aspect ratio）**，选一个新比例重新生成；或者在提示词里直接写「16:9 横版」「9:16 竖版」。官方说明 ChatGPT 可以生成任意宽高比的图。

### 6. 带思考生图（Plus）

在模型选择器里切换到带推理的档位（2026 年 6 月起网页端选项为 Instant / Medium / High 等，即时档 Instant 不会先推理），再提出生图需求。按官方介绍，它会先规划版面、必要时联网查实时信息，可以一次提示生成多张不同的图，并检查自己的输出，再给出结果。适合：

- 信息图、流程图、数据海报；
- 多格漫画、分镜；
- 需要准确事实的图（比如某城市地标的示意图）。

代价是更慢，也会消耗更多额度。带思考生图目前面向 Plus、Pro、Business（官方称 Enterprise、Edu 即将支持）。

## Images 2.5 新增了什么

按 OpenAI 发布说明和帮助中心，2.5 在 2.0 基础上主要加了：更清晰的细节和更精确的局部编辑、多轮修改更稳定、生成速度更快，以及几个新工具（中文界面的具体名称以实际显示为准）：

- **模板（Templates）**：打开「图片」→「模板」，选海报、商品图、Logo 等类别和模板，再补充细节；ChatGPT 可能会追问风格等细节，有的模板可以上传参考图。模板目前在 Work 模式里不可用。
- **草图（Sketch）**：在手机 App 的输入框里输入 **@** 选「Sketch」，画个草稿（可换颜色、擦除、撤销），点对勾确认后再写文字说明，ChatGPT 会按草图生成完整图片。
- **图片评论（Comment）**：在手机 App 上全屏打开生成的图，可以直接编辑，或在图上某个位置留评论告诉 ChatGPT 要改什么。
- **分享提示词**：分享图片时可以附带提示词，别人能用自己的照片和细节做一版；手机上依次点「分享 → 提示词模板 → 复制链接」。

![手机 App 全屏查看生成的图，底部是编辑、评论、调整尺寸、移除按钮（英文界面）](seed:g08-mobile-edit-comment.webp)
*图片来源：[TechRadar](https://www.techradar.com/ai-platforms-assistants/chatgpt/chatgpt-images-2-5-is-out-ive-been-testing-it-for-24-hours-and-these-are-the-3-new-features-youll-actually-use)（原图注明 Image credit: OpenAI）*

![用「商品图」模板：左边上传商品照片并回答追问，右边是按「深色影棚」风格生成的商品图（英文界面）](seed:g08-template-product-photo.webp)
*图片来源：[TechRadar](https://www.techradar.com/ai-platforms-assistants/chatgpt/chatgpt-images-2-5-is-out-ive-been-testing-it-for-24-hours-and-these-are-the-3-new-features-youll-actually-use)*

## 常见问题

**Q：我一定要在 ChatGPT 里用 gpt-image-2 而不是 2.5，可以吗？**
官方没有提供在 ChatGPT 里切回 2.0 的说明，ChatGPT 里生图统一用当前版本。如果一定要指定 `gpt-image-2`，需要通过 API 调用，按用量单独计费，和 ChatGPT 订阅无关；按 API 文档，`gpt-image-2` 仍可调用，但 OpenAI 建议新项目改用 2.5 系列的 API 模型。

**Q：gpt-image-2 最大能出多大的图？**
ChatGPT 里的输出分辨率官方没有公开。API 里的 `gpt-image-2` 支持自定义尺寸：最长边不超过 3840 像素，长短边之比不超过 3:1（即 3:1 到 1:3 之间），常用尺寸里包括 2K 和 4K 规格。

**Q：Free 能用吗？**
能。所有套餐都能生图，Free 额度较少、不能用带思考生图。额度差异见本站《ChatGPT 生图额度与限制》。如需开通 Plus，可前往 /chongzhi/chatgpt-plus。

**Q：生成失败怎么办？**
参考本站《ChatGPT 生图失败怎么办》按顺序排查。

**Q：做出来的图能商用吗？**
按 OpenAI 条款，你对自己生成的内容享有相应权利，官方也说明使用时不必署名 OpenAI；但涉及他人肖像、商标、知名 IP 风格时仍可能侵权，商用前请自行评估。

## 参考资料

- OpenAI 帮助中心：Images in ChatGPT — https://help.openai.com/en/articles/11084440-images-in-chatgpt
- OpenAI：Introducing ChatGPT Images 2.0 — https://openai.com/index/introducing-chatgpt-images-2-0/
- OpenAI：Introducing ChatGPT Images 2.5 — https://openai.com/index/introducing-chatgpt-images-2-5/
- ChatGPT Release Notes — https://help.openai.com/en/articles/6825453-chatgpt-release-notes
- OpenAI API 文档：GPT-Image-2 — https://developers.openai.com/api/docs/models/gpt-image-2
- OpenAI API 文档：Image generation — https://developers.openai.com/api/docs/guides/image-generation
- OpenAI Academy：Creating images with ChatGPT — https://openai.com/academy/image-generation/
- 截图来源：TechRadar、GlobalGPT（见各图下方链接）
