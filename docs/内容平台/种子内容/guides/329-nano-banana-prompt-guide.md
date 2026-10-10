---
title: Nano Banana 提示词怎么写：官方提示词指南要点与 7 个生成模板
slug: nano-banana-prompt-guide
products: [gemini]
models: [nano-banana]
accountTier: FREE
excerpt: Nano Banana（Gemini 生图）的提示词怎么写效果最好？本文把 Google 官方提示词指南提炼成 6 条原则和写实照片、贴纸、带文字设计、商品图、留白背景、漫画分镜、搜索增强 7 个可复制模板，并给出改图句式。
checkedOn: 2026-10-07
sources:
  - https://ai.google.dev/gemini-api/docs/image-generation
  - https://support.google.com/gemini/answer/14286560?hl=en
  - https://blog.google/innovation-and-ai/technology/ai/nano-banana-2/
---

## 适用于谁

- 搜「Nano Banana 提示词教学」「Nano Banana 提示词大全」「Gemini 生图提示词」的人；
- 用 Gemini 画图，经常得到「差不多但不是我想要的」结果的人；
- 想要一套能反复套用的模板，而不是每次从零想的人。

本文根据 Google Gemini API 官方文档中的「提示词指南与策略」（CC BY 4.0）及 Gemini 帮助中心整理改写，资料核对于 2026-10-07。模板中的方括号是要替换的内容。

## 结论先说

官方指南反复强调的一点：**把场景详细描述出来**——描述得越具体，你对结果的控制就越多。Nano Banana 能理解完整的自然语言段落，与其堆一串逗号分隔的关键词，不如写一段有主体、环境、光线和机位的完整描述。

六条原则（官方「最佳实践」意译）：

1. **极度具体**：不要写「奇幻盔甲」，写「精致的精灵板甲，蚀刻银叶纹，高领，肩甲形如鹰翼」。
2. **交代用途和意图**：「为一个高端极简护肤品牌设计 logo」比「设计一个 logo」效果好得多。
3. **迭代修改**：别指望一次完美，用对话做小改动——「很好，但光线再暖一点」。
4. **复杂画面分步说**：先背景、再前景、最后点睛的物件。
5. **语义化的负面提示**：不写「没有车」，写「一条空荡荡、看不到任何车辆的街道」。
6. **用镜头语言控制构图**：广角、微距、低角度、俯拍等摄影术语。

另外，帮助中心建议提示词以「画 / 生成 / 创建」开头，写明风格和画面细节；API 文档提到想在图中加文字时，**先把文字内容定下来，再要求生成带这段文字的图**效果更好。

## 7 个生成模板

### 1. 写实照片

```
一张写实的[景别，如广角 / 特写]照片：[主体描述]，位于[场景描述]。
[光线描述]。从[机位角度]拍摄，使用[镜头类型，如 85mm 人像镜头 / 广角镜头]。
```

### 2. 插画与贴纸

```
一张[风格，如可爱风贴纸 / 扁平插画]：[主体及配饰]正在[动作]。
设计特点：[粗描边 / 赛璐璐上色等]，[配色]，背景为[白色 / 透明感纯色]。
```

### 3. 图中准确文字（海报、logo、菜单）

```
为[品牌 / 主题]设计一张[图片类型]，上面的文字是"[要出现的文字]"，
字体为[字体风格描述，如粗体无衬线]。整体设计[风格描述]，配色[配色方案]。
```

官方提示：专业级、文字多的素材更推荐用 Nano Banana Pro。

### 4. 商品图与商业摄影

```
一张高分辨率的影棚商品照：[商品描述]，放在[台面 / 背景]上。
布光为[如三点柔光箱布光]，以[目的，如柔和高光、消除硬阴影]。
机位为[如略高的 45 度俯拍]，突出[卖点]。超写实，焦点清晰地落在[关键细节]。[画幅]。
```

### 5. 极简留白背景（给文字留位置）

```
极简构图：一个[主体]位于画面[右下 / 左上等]。背景是大面积的[颜色]空白，
留出充足的负空间。柔和、细腻的光线。[画幅]。
```

![官方示例（从左到右）：可爱风小熊猫贴纸、影棚商品图（黑色马克杯）、右下角一片红枫叶的极简留白构图](seed:g329-nb-templates-examples.jpg)
*图片来源：[Google AI for Developers · Image generation](https://ai.google.dev/gemini-api/docs/image-generation)（CC BY 4.0）*

### 6. 漫画分镜 / 故事板

```
用[风格]画一个 3 格漫画，把角色放在[场景类型]里。
第 1 格：[内容]；第 2 格：[内容]；第 3 格：[内容，可含对白]。
```

官方说明这类需要文字和叙事的提示，在 Nano Banana Pro 和 Nano Banana 2 上效果更好。

### 7. 结合实时信息（搜索增强）

Nano Banana Pro 和 Nano Banana 2 可以借助 Google 搜索生成基于最新信息的图，比如天气图、赛事比分卡片、新闻信息图。写法上直接说明需要实时信息即可，例如「根据今天[城市]的天气预报，做一张五天天气信息图」。官方博客还演示了「先搜索视觉参考，再生成」的写法。

![官方示例：用 Nano Banana 2 生成的「水循环」平铺手工风信息图，文字标签清晰可读](seed:g329-nb2-water-cycle-infographic.jpg)
*图片来源：[Google 官方博客 · Nano Banana 2](https://blog.google/innovation-and-ai/technology/ai/nano-banana-2/)*

## 改图句式速查

| 需求 | 句式（意译自官方模板） |
| --- | --- |
| 加 / 删元素 | 用这张[主体]的图，给画面[添加 / 移除 / 修改][元素]，确保改动[与原图光线、透视自然融合] |
| 只改局部 | 用这张图，**只把**[元素]改成[新样子]，其他内容完全不变，保留原有风格、光线和构图 |
| 换风格 | 把这张[主体]的照片改成[艺术风格]，保持原构图，用[风格特征]来呈现 |
| 多图合成 | 用这几张图生成新图：把[图 1 元素]放到[图 2 元素]上，最终画面是[场景描述] |
| 草图变成品 | 把这张[铅笔 / 马克笔]草图里的[主体]变成[风格]照片，保留草图中的[特征]，加上[新材质 / 细节] |

![官方示例：一张汽车铅笔草图被细化为展厅中的蓝色概念跑车照片](seed:g329-nb-sketch-to-photo.jpg)
*图片来源：[Google AI for Developers · Image generation](https://ai.google.dev/gemini-api/docs/image-generation)（CC BY 4.0）*

文字翻译与本地化也是改图的一种：Nano Banana 2 官方演示了把一块英文告示牌的文字翻译成其他语言、同时把场景改成当地风格。

![官方示例：左为英文告示牌原图，右侧两张分别翻译为印地语和德语并调整了场景](seed:g329-nb2-sign-text.jpg)
*图片来源：[Google 官方博客 · Nano Banana 2](https://blog.google/innovation-and-ai/technology/ai/nano-banana-2/)*

## 常见问题

**Q：用中文写提示词可以吗？**
可以。Gemini API 文档列出的推荐语言里包括简体中文（zh-CN）。专业摄影、镜头术语可以中英并写。

**Q：我要 4 张图，它只给了 1 张？**
官方说明模型不一定严格遵守你要求的输出张数。可以要求「逐张生成，每张单独输出」，或分几次生成。

**Q：本站有现成的 Nano Banana 提示词吗？**
有，在本站提示词库里按「Nano Banana」模型筛选，每条都附示例图和使用说明。

**Q：同样的提示词放到 ChatGPT 或 Midjourney 里能用吗？**
自然语言描述大体通用；Midjourney 更偏好简短描述加参数。通用写法见《AI绘画提示词怎么写》。

## 参考资料

- Google AI for Developers：Image generation（Prompting guide and strategies、Best practices、Limitations）— https://ai.google.dev/gemini-api/docs/image-generation
- Gemini Apps Help：Generate & edit images with Gemini Apps — https://support.google.com/gemini/answer/14286560?hl=en
- Google 官方博客：Nano Banana 2 — https://blog.google/innovation-and-ai/technology/ai/nano-banana-2/
