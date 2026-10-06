---
title: 改图提示词：照片一键换季节 / 天气（雪景、雨夜、秋天）（gpt-image-2）
slug: season-weather-edit
model: gpt-image-2
topics: [photo-edit, photography]
needsRefImage: true
useCase: 上传一张照片，在不改变构图和主体的前提下换成雪天、雨夜、深秋等不同季节天气，适合做节气海报、同景四季对比。
prompt: |
  把我上传的照片改成[冬天的傍晚，正在下大雪]：[主要物体]上落满薄雪，空气中能看到呼出的白气，整体是冷调的蓝灰色光线；[主体]依然清晰可辨。
  严格保留原照片的构图和画幅比例；所有物体保持原有位置、对齐和可读性，不要增加或删除主要物体。
negativePrompt: null
source:
  repo: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill#gallery-edit-endpoint-showcase
  author: wuyoscar
  license: MIT
  licenseUrl: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE
  changes: 英文改图指令译为中文；季节天气效果、受影响的物体和主体改为变量；原示例为国际象棋棋局
imageBrief: 用站长自己拍的一张街景或桌面照片，分别生成"雪天傍晚""夏夜暴雨""深秋落叶"三张，附原图组成四宫格对比。
verify:
  - 在 gpt-image-2 上实测 3 次，记录成功率与最常见的失败形式
  - 构图与主体位置是否和原图一致
  - 换成雨夜、秋天等效果是否同样稳定
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：[冬天的傍晚，正在下大雪] 换成你要的效果，并配一个"细节证据"让画面可信：雨夜写"地面有积水倒影、路灯有光晕"，深秋写"地上铺满落叶、树叶变黄"。[主要物体] 写画面里最大的东西（街道、桌面、汽车），[主体] 写你最在意不能变的东西。

**常见问题**：
- 构图变了：第二句是关键，不要删；照片里人物较多时变形风险更高。
- 效果太弱：加程度词，如"厚厚的积雪""大雨倾盆"。
- 人物脸被改：含人像的照片，补一句"人物的脸和衣服保持不变"。

**迭代**：同一张原图依次生成春、夏、秋、冬四版，拼成"四季同框"非常适合节气内容。

### 英文原版

原例先用 OpenAI Cookbook 的提示词生成一张棋局照片，再用下面这条指令把它改成冬夜雪景。

```text
Make it a winter evening with heavy snowfall, snow dusted on the board and pieces, breath vapor in the air, cold blue-grey lighting, chess position still clearly readable. Preserve the original chess-board composition and landscape aspect ratio exactly; keep the board and pieces aligned and readable.
```

> 改编自 [wuyoscar/GPT-Image2-Skill](https://github.com/wuyoscar/GPT-Image2-Skill) 图库「Edit Endpoint Showcase」中的改图示例（棋局 → 冬夜雪景），原图提示词出自 [OpenAI Cookbook](https://github.com/openai/openai-cookbook/blob/main/examples/multimodal/image-gen-models-prompting-guide.ipynb)；Copyright (c) 2026 Wuyoscar，[MIT License](https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE)。示例图为 PNG 且超过 1.2MB，未收录。
