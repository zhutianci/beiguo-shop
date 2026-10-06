---
title: gpt-image-2 怎么用：在 ChatGPT 里生成、编辑与改图
slug: gpt-image-2-how-to
products: [chatgpt]
models: [gpt-image-2]
accountTier: PLUS
excerpt: gpt-image-2（ChatGPT Images 2.0）在 ChatGPT 里怎么用？本文讲清它和 Images 2.5 的关系，以及从文字生成、上传照片改图、框选局部修改、换比例到带思考生图的完整操作。
sources:
  - https://help.openai.com/en/articles/11084440-images-in-chatgpt
  - https://openai.com/index/introducing-chatgpt-images-2-0/
  - https://openai.com/index/introducing-chatgpt-images-2-5/
  - https://help.openai.com/en/articles/11128753-gpt-image-api
  - https://help.openai.com/en/articles/6825453-chatgpt-release-notes
screenshots:
  - 对话中直接让 ChatGPT 画图的结果
  - 侧边栏「图片（Images）」页与入口（或「更多 → 图片」）
  - 图片编辑器：选择工具、宽高比、撤销 / 重做按钮
  - 框选局部后在对话里描述修改的示例（前后对比）
  - 选 Thinking 模型生图时的推理过程（Plus）
  - Images 2.5 新增的草图（Sketch）/ 模板 / 图片评论入口（如有）
verify:
  - 2026-09-08 发布 Images 2.5 后，ChatGPT 里能否手动选回 2.0（gpt-image-2）：第三方说法不一，需实测；如果不能选，本文标题与 models 标签需站长决定是否改为 2.5
  - Images 2.0 发布时的规格（最高 2K、宽高比 3:1 到 1:3、单次最多 8 个变体）来自发布报道，需对照官方发布稿；2.5 称最高 4K、最多 16 张参考图，同样需核对
  - Images 2.0 发布稿链接 openai.com/index/introducing-chatgpt-images-2-0/ 是按命名规律推测的，未能打开确认
  - 草图、模板、图片评论等 2.5 新功能在中文界面的名称和入口
---

## 适用于谁

- 搜「gpt-image-2 怎么用」「ChatGPT 怎么用 image2」，想在 ChatGPT 里用上 OpenAI 新一代图像模型的人；
- 想用 ChatGPT 改照片、换背景、做海报、做带文字的信息图；
- 本文按 Plus 账号写，Free 也能完成大部分操作，只是额度更少、没有「带思考生图」。

## 先弄清：gpt-image-2 和你在 ChatGPT 里用的是什么关系

- **gpt-image-2** 是 OpenAI 于 2026 年 4 月 21 日发布的图像模型。在 ChatGPT 里它的名字是 **ChatGPT Images 2.0**；在 API 里，开发者用 `gpt-image-2` 这个名字调用。
- 2026 年 9 月 8 日，OpenAI 又发布了 **ChatGPT Images 2.5**，现在 ChatGPT 里默认生图用的是 2.5。

所以在 ChatGPT 里，你**不需要、通常也没有地方手动选「gpt-image-2」**——直接让 ChatGPT 画图就行。下面的操作方法对 2.0 和 2.5 通用；2.5 额外加了几个工具，文末单独说明。

## 结论先说

1. **两种入口**：在任意对话里直接说「帮我画……」；或在侧边栏打开「图片（Images）」页专门生图。
2. **改图优先用编辑器**：点开图片，用选择工具框出要改的地方，再用一句话描述改动，比重新生成更稳。
3. **复杂的图用带思考生图（Plus）**：选 Thinking 类模型后再生图，它会先推理、可以联网查资料，适合信息图、带大量中文的海报。

## 步骤

### 1. 从文字生成

在对话里直接描述。好的描述包括五部分：**主体、场景、风格、构图 / 比例、画面里的文字**。

> 画一张竖版海报，比例 3:4。主体是一杯冒热气的拿铁，放在木桌上；背景是清晨的窗边，暖色调；风格为扁平插画。顶部大字「周一续命」，底部小字「早八咖啡 · 第二杯半价」。

这一代模型对**画面中的中文文字**支持明显变好，但仍建议把要出现的文字用引号写清楚，字数不要太多。

【截图：对话中直接画图的结果】

### 2. 用「图片」页集中创作

打开侧边栏的「图片（Images）」，或在对话里点「更多 → 图片」。这里可以生成新图，也能看到你所有生成过的图（自动保存在图库里）。

【截图：侧边栏「图片」页】

### 3. 上传照片来改

点输入框的「+」上传照片，再描述要改什么：

- 换背景：「把背景换成纯白色，人物不变」；
- 换风格：「保持构图，改成水彩画风格」；
- 合成：上传多张图，「把图 1 的产品放到图 2 的场景里」。

涉及真人照片时，只处理你自己或已获得同意的照片。

### 4. 框选局部修改

点开一张图进入编辑器：

1. 点**选择**工具，涂抹或框选要改的区域；
2. 在对话里描述修改，比如「把这块招牌上的字改成『营业中』」；
3. 不满意就用**撤销 / 重做**。

也可以不框选，直接在对话里描述整体修改。

【截图：图片编辑器的选择工具、宽高比、撤销 / 重做】

### 5. 换比例

在编辑器里点**宽高比**，选一个新比例重新生成；或者在提示词里直接写「16:9 横版」「9:16 竖版」。

### 6. 带思考生图（Plus）

在模型选择里切换到 Thinking 类模型，再提出生图需求。它会先规划版面、核对信息（必要时联网），再出图。适合：

- 信息图、流程图、数据海报；
- 多格漫画、分镜；
- 需要准确事实的图（比如某城市地标的示意图）。

代价是更慢，也会消耗更多额度。

【截图：Thinking 模型生图的推理过程】

## Images 2.5 新增了什么

按 OpenAI 发布说明，2.5 在 2.0 基础上主要加了：更清晰的细节和更精确的局部编辑、多轮修改更稳定、生成速度更快，以及几个新工具——**草图**（直接画个草稿当参考）、**模板**（从海报、商品图等格式起步）、**图片评论**（在图上某个位置留修改意见）。中文界面的具体名称以实测为准。

## 常见问题

**Q：我一定要在 ChatGPT 里用 gpt-image-2 而不是 2.5，可以吗？**
ChatGPT 里能否手动选回 2.0 目前未确认（待实测）。如果一定要指定 `gpt-image-2`，需要通过 API 调用，按用量单独计费，和 ChatGPT 订阅无关。

**Q：Free 能用吗？**
能。所有套餐都能生图，Free 额度较少、不能用带思考生图。额度差异见本站《ChatGPT 生图额度与限制》。如需开通 Plus，可前往 /chongzhi/chatgpt-plus。

**Q：生成失败怎么办？**
参考本站《ChatGPT 生图失败怎么办》按顺序排查。

**Q：做出来的图能商用吗？**
按 OpenAI 条款，你对自己生成的内容享有相应权利，但涉及他人肖像、商标、知名 IP 风格时仍可能侵权，商用前请自行评估。

## 参考资料

- OpenAI 帮助中心：Images in ChatGPT — https://help.openai.com/en/articles/11084440-images-in-chatgpt
- OpenAI：Introducing ChatGPT Images 2.0 — https://openai.com/index/introducing-chatgpt-images-2-0/
- OpenAI：Introducing ChatGPT Images 2.5 — https://openai.com/index/introducing-chatgpt-images-2-5/
- OpenAI 帮助中心：GPT Image API — https://help.openai.com/en/articles/11128753-gpt-image-api
- ChatGPT Release Notes — https://help.openai.com/en/articles/6825453-chatgpt-release-notes
