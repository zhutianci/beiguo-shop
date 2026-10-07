---
title: AI角色一致性怎么做：角色设定表、参考图与各工具的官方方法
slug: ai-character-consistency
products: [ai-tools, gemini]
models: [midjourney, nano-banana]
accountTier: FREE
excerpt: 做绘本、漫画、IP 形象、短视频，怎么让 AI 画出的同一个角色每张都长得一样？本文按 OpenAI、Google、Midjourney 官方指南，总结「固定描述 + 定妆参考图 + 逐张迭代」的通用流程，并给出各工具的具体入口。
checkedOn: 2026-10-07
sources:
  - https://developers.openai.com/api/docs/guides/image-prompting
  - https://ai.google.dev/gemini-api/docs/image-generation
  - https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/video/best-practice
  - https://docs.midjourney.com/hc/en-us/articles/48495453462797-Edit-Model
  - https://docs.midjourney.com/hc/en-us/articles/32604356340877-Seeds
---

## 适用于谁

- 搜「AI角色一致性」「AI人物一致性」的人；
- 做绘本、四格漫画、品牌吉祥物、短剧分镜，需要一个角色出现在很多张图里的人；
- 试过「同一段提示词」却每次得到不同长相的人。

本文综合 OpenAI、Google（Gemini 图像与视频）和 Midjourney 官方文档整理，资料核对于 2026-10-07。各工具的详细操作见文中提到的专门教程。

## 结论先说

1. **一致性靠三样东西叠加**：一段**固定不变的角色描述** + 一套**定妆参考图** + **每次只改场景、动作**的迭代方式。
2. **参考图比文字更可靠**：现在主流工具都支持用参考图锁定角色——ChatGPT 编辑、Gemini 多图参考、Midjourney V8 的 Edit 模型、Flow 的 Ingredients。
3. **随机种子不是「角色锁」**：Midjourney 官方明确说 seed 不能保存角色或风格；它只能让同一提示词的结果更接近。

## 通用流程（5 步）

### 第 1 步：写一份角色设定

把角色写成一段「身份证」，以后每次原样复制。Google 视频最佳实践建议包含：名字、年龄体型、发色发型、脸型、眼睛颜色和形状、标志性特征、服装，以及（做视频时）声音风格。

```
角色：小禾，8 岁女孩，圆脸，齐耳短发、深棕色，大眼睛，左脸颊有一颗小痣。
服装：黄色雨衣、红色雨靴、背一只青蛙造型的小书包。
气质：好奇、勇敢、爱笑。画风：手绘水彩绘本风，柔和描边，暖色调。
```

OpenAI 官方的绘本示例也是先写清角色外形、服装、性格、画风，并在约束里写明「原创角色、不使用受版权保护的角色、无文字、无水印、背景简单以便看清角色」。

### 第 2 步：先出一张「定妆照」

用上面的描述生成角色的标准形象：**背景简单、全身或半身清楚、正面或 3/4 侧面**。满意后保存下来，它就是之后所有图的参考。

### 第 3 步：补齐多角度

Google 官方的「360 度视图」做法：基于定妆照依次要求「侧脸朝右」「背面」「坐姿」等，**每次都把之前生成的图一起作为参考**输入。得到一组多角度定妆照后，后续一致性会明显提高。

### 第 4 步：每张新图 = 参考图 + 原样描述 + 新场景

OpenAI 绘本示例的第二步：把上一张角色图作为输入，写新场景（雪后的森林里帮小松鼠），再重复列出「同样的绿色兜帽上衣、同样的五官比例和配色、不要重新设计角色」。

![官方示例：先确立绘本角色（左），再用同一角色图作为输入续写雪地场景（右），服装和五官保持一致](seed:g337-gpt-childrens-book-consistency.jpg)
*图片来源：[OpenAI API 文档 · Image prompting](https://developers.openai.com/api/docs/guides/image-prompting)*

### 第 5 步：一次只改一处，跑偏就重申

OpenAI 提醒多轮编辑可能累积偏差：每次只提一个修改，并重复要保留的细节；画面开始跑偏时，回到定妆照重新开始比继续修补更快。

## 各工具怎么锁定角色

| 工具 | 官方方式 | 要点 | 本站教程 |
| --- | --- | --- | --- |
| ChatGPT（Images 2.5） | 上传角色图 + 编辑 / 生成 | 按编号说明每张参考图的角色；重申「不要改变脸和身份」 | 《ChatGPT 生图提示词与改图指令》 |
| Gemini（Nano Banana） | 一次上传多张图 | API 文档：Nano Banana 2 / 2.1 最多保持 4 个角色相似，Pro 最多 5 个 | 《Nano Banana 多图融合与人物一致性》 |
| Midjourney V8 | Edit 模型（Attach to prompt） | 最多 4 张参考图；画幅默认跟随第一张参考图 | 《Midjourney 角色一致性》 |
| Midjourney 画风 | `--sref` 风格参考 | 只统一画风，不锁角色长相 | 《Midjourney 风格参考 sref 怎么用》 |
| Google Flow（视频） | Ingredients 参考素材、@角色、@me | 参考图用干净背景；可加声音参考保持音色 | 《Google Flow 怎么用》 |
| 视频提示词 | 固定角色描述 + 相同 seed（API） | 每个镜头原样复制角色描述 | 《Veo 3.1 提示词怎么写》 |

## 常见失败与对策

| 现象 | 原因 | 对策 |
| --- | --- | --- |
| 脸每张都不一样 | 只用文字描述 | 加定妆参考图；描述中写清五官特征 |
| 衣服细节对不上 | 细节太多、太小 | 简化服装设计，突出 2～3 个标志性元素（颜色、配饰） |
| 多个角色特征串了 | 参考图太多、描述混在一起 | 分开描述每个角色；Midjourney 官方建议可把几个角色合成一张参考图 |
| 画风越改越偏 | 多轮编辑累积偏差 | 回到定妆照；固定风格参考或风格词 |
| logo、雀斑等小细节丢失 | 模型难以保真微小细节 | 最后用局部编辑单独修 |

## 常见问题

**Q：可以用真人照片做角色吗？**
可以用你自己或已获授权的人的照片。不要用明星、公众人物或他人照片，涉及肖像权和平台政策（Google、Midjourney 的条款都禁止侵犯他人隐私和权利）。

**Q：哪个工具一致性最好？**
官方没有给出横向对比，效果和角色类型、风格、参考图质量关系很大。建议用同一套定妆图在两三个工具里各试几张再定。

**Q：做 IP 形象，最终要交付矢量图怎么办？**
AI 出的是位图。定稿后建议请设计师按 AI 稿重绘矢量版，也便于申请商标和版权登记（见《AI生成图片有版权吗、能商用吗》）。

## 参考资料

- OpenAI API 文档：Image prompting（Keep a character consistent）— https://developers.openai.com/api/docs/guides/image-prompting
- Google AI for Developers：Image generation（Character consistency: 360 view；多图参考上限）— https://ai.google.dev/gemini-api/docs/image-generation
- Google Cloud 文档：Best practices for generating videos（角色与声音一致性）— https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/video/best-practice
- Midjourney 官方文档：Edit Model — https://docs.midjourney.com/hc/en-us/articles/48495453462797-Edit-Model
- Midjourney 官方文档：Seeds — https://docs.midjourney.com/hc/en-us/articles/32604356340877-Seeds
