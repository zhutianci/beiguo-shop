---
title: Nano Banana 怎么用：在 Gemini 里生成图片、上传照片改图与「用 Pro 重做」
slug: nano-banana-how-to
products: [gemini]
models: [nano-banana]
accountTier: FREE
excerpt: Nano Banana 是 Gemini 里的图像生成与编辑模型。本文按 Google 官方帮助中心讲清入口在哪、免费和付费分别用的是哪个模型、怎么生成、怎么上传照片局部修改、怎么「用 Pro 重做」以及下载分辨率和年龄限制。
checkedOn: 2026-10-07
sources:
  - https://support.google.com/gemini/answer/14286560?hl=en
  - https://blog.google/innovation-and-ai/technology/ai/nano-banana-2/
  - https://ai.google.dev/gemini-api/docs/image-generation
  - https://support.google.com/gemini/answer/16275805?hl=en
  - https://policies.google.com/terms/generative-ai/use-policy
---

## 适用于谁

- 搜「Nano Banana 怎么用」「Nano Banana 入口」「Nano Banana 怎么垫图」「Nano Banana 图片编辑」的人；
- 听说 Gemini 改图很强，想上传自己的照片试试换背景、换装、加元素的人；
- 分不清 Nano Banana、Nano Banana 2、Nano Banana Pro 是什么关系的人（详细对比见《Nano Banana Pro 和 Nano Banana 2 区别》）。

本文根据 Google Gemini 官方帮助中心、官方博客和 Gemini API 文档整理，资料核对于 2026-10-07；界面以你实际看到的为准。

## 结论先说

1. **Nano Banana 不是一个单独的 App**，它是 Gemini 里的图像模型。打开 gemini.google.com 或 Gemini App，直接说「画一张……」，或从侧边栏进入 **Images（图片）** 即可。
2. **用哪个模型取决于你选的 Gemini 模型**：选 Flash 或 Pro 时用 **Nano Banana 2**；选 Flash-Lite 时用更快的 **Nano Banana 2 Lite**；付费用户可以对生成结果点 **Redo with Pro（用 Pro 重做）**，调用 **Nano Banana Pro**。
3. **免费也能用**：官方功能表显示，未订阅也可以用 Nano Banana 2 生图；下载分辨率方面，免费为 1K，订阅 Google AI 套餐为 2K。
4. **改图要满 18 岁**：生成图片要求 13 岁以上（或当地规定年龄），**编辑图片要求 18 岁以上**。

## 步骤

### 1. 生成图片

1. 打开 gemini.google.com，点左上角打开侧边栏，选择 **Images（图片）**；
2. 选一个模板（风格），或直接输入提示词；
3. 发送后等待生成。

![Gemini 的图片模板页「Pick a style for your image」：Monochrome、Color block、Sketch、Cinematic 等风格卡片，底部是带「Create image」标签的输入框（英文界面，官方示意图）](seed:g326-gemini-templates.jpg)
*图片来源：[Google 官方博客 · Nano Banana 2](https://blog.google/innovation-and-ai/technology/ai/nano-banana-2/)*

官方帮助中心给的提示词建议：

- 以「画 / 生成 / 创建（draw、generate、create）」开头；
- 写明风格：写实照片、炭笔素描、水彩、卡通插画等；
- 写清画面细节：主体是什么、在做什么、背景和环境是什么。

> 生成一张水彩风格的图：雨后的江南小巷，青石板路反光，一位撑油纸伞的路人走向远处的拱桥，画面右侧有一棵开花的桂树。

更系统的写法见《Nano Banana 提示词怎么写》。

### 2. 上传照片修改（垫图）

官方列出三种编辑方式：

- 修改在 Gemini 里生成的图片；
- **上传一张图片，让 Gemini 修改**；
- **上传多张图片，让 Gemini 基于它们生成一张新图**（多图融合，见《Nano Banana 多图融合与人物一致性》）。

操作：点输入框的「+」上传图片（或从侧边栏 **Library** 里点开已生成的图，点图片下方的 **Chat**），然后在输入框写修改要求并发送。

![官方示例：上传一张猫的照片，要求「给猫戴一顶针织巫师帽」，左为原图、右为修改结果](seed:g326-nb-edit-cat-hat.jpg)
*图片来源：[Google AI for Developers · Image generation](https://ai.google.dev/gemini-api/docs/image-generation)（CC BY 4.0）*

### 3. 只改一个地方（局部编辑）

Nano Banana 不需要你手动涂抹选区，直接用文字「圈定」要改的部分就行。Gemini API 官方文档把这叫「语义遮罩」，推荐的句式是：

> 使用这张图片，**只把**[某个元素]改成[新的样子]，**其他所有内容保持完全不变**，保留原图的风格、光线和构图。

![官方示例：只把客厅里的蓝色沙发换成棕色皮质切斯特菲尔德沙发，其余陈设不变](seed:g326-nb-inpaint-living-room.jpg)
*图片来源：[Google AI for Developers · Image generation](https://ai.google.dev/gemini-api/docs/image-generation)（CC BY 4.0）*

如果第一次没改对，继续在同一个对话里追问，例如「很好，但光线再暖一点」「其他都不变，只把表情改得严肃些」。官方建议把大改动拆成多次小改动。

### 4. 用 Nano Banana Pro 重做（付费）

订阅 Google AI 套餐后，可以对 Nano Banana 2 或 2 Lite 生成的图点右下角 **More（更多）→ Redo with Pro（用 Pro 重做）**。官方说明 Pro 能提供更多细节，尤其适合**带文字的图和信息图**。

注意：如果当天 Nano Banana 2 的配额已经用完，也就不能再用 Pro 重做了。

### 5. 下载与导出

- 悬停在图片上，点 **Download full size（下载原尺寸）**；
- 点 **More → Export to Docs**，导出到 Google 文档继续编辑。

### 6. 用 Avatar 生成自己的形象（可选）

Gemini 支持录制自己的面部和声音创建 avatar，之后生成包含你本人的图片时不必每次上传照片。只有你自己能使用你的 avatar。

## 常见问题

**Q：Nano Banana 免费能用吗？每天能生成多少张？**
能用。官方没有公布固定张数，Gemini 的用量按计算量折算、每 5 小时刷新直到周上限，生图比普通聊天更耗额度。详见《Gemini 生图次数限制》。

**Q：为什么我上传照片后它说不能编辑？**
最常见的原因：账号未满 18 岁；照片涉及真实人物的敏感修改；请求违反 Google 生成式 AI 禁止使用政策。详见《Gemini 图片编辑请求被拒绝怎么办》。

**Q：生成的图片能直接用吗？**
官方提醒：生成图片时你同意了 Google 服务条款和禁止使用政策，不要侵犯他人版权或隐私，发布或使用前自行判断。所有生成图片都带 SynthID 不可见水印，见《Gemini 生成的图片有水印吗》。

**Q：中文提示词和中文文字效果如何？**
Gemini API 文档把简体中文（zh-CN）列入推荐使用的语言之一；Nano Banana 2 官方称文字渲染更准确，支持图中文字的翻译和本地化。中文长文案仍建议先确定文字内容、再要求生成带文字的图。

**Q：国内能用吗？**
需要在 Gemini 支持的国家 / 地区使用，具体以 Google 官方的可用地区列表为准。

## 参考资料

- Gemini Apps Help：Generate & edit images with Gemini Apps — https://support.google.com/gemini/answer/14286560?hl=en
- Google 官方博客：Nano Banana 2 — https://blog.google/innovation-and-ai/technology/ai/nano-banana-2/
- Google AI for Developers：Image generation（Nano Banana）— https://ai.google.dev/gemini-api/docs/image-generation
- Gemini Apps Help：Gemini Apps limits & upgrades — https://support.google.com/gemini/answer/16275805?hl=en
- Google：Generative AI Prohibited Use Policy — https://policies.google.com/terms/generative-ai/use-policy
