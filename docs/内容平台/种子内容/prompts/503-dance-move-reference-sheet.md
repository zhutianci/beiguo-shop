---
title: 动作参考图提示词：同一角色 16 格舞蹈动作分解图（带方向箭头和说明）
slug: dance-move-reference-sheet
model: gpt-image-2
topics: [character, infographic]
aspectRatio: "16:9"
needsRefImage: false
useCase: 把一套舞蹈、健身操、武术或拉伸动作拆成 16 个编号格子，每格一个全身姿势加箭头和两三行说明，适合做动作教学图、绘画姿势参考和角色动作库。
prompt: |
  一张干净的教学用动作分解参考图，4×4 网格共 16 格，每格大小一致，用细黑线分隔，从 1 到 16 编号。
  角色：[年轻女舞者]，运动型身材，[高马尾]，穿[运动背心和宽松工装裤]、运动鞋；16 格中始终是同一个角色，脸、发型、服装完全一致。
  动作主题：[街舞基础组合]，按顺序从准备姿势到收尾姿势。
  每一格的结构：
  - 左上角：粗体数字徽章 + 动作名称（[简体中文]）；
  - 中间：角色全身姿势；
  - 左下角：3–4 行简短动作说明（[简体中文]）；
  - 角色周围用弧形箭头、直线箭头和旋转圈标出动作方向和发力路线。
  画风：单色灰阶的 3D 雕塑感角色渲染，柔和棚拍光，轻微阴影，线条干净，像游戏概念设定里的动作参考表。
  白色背景，不要场景、不要彩色、不要多余人物，画面不要杂乱。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/Ciri_ai/status/2048074587955658848
  author: "@Ciri_ai"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 原文为分段标签式英文模板，译为中文完整句子；角色描述、动作主题、标注语言改为变量（原文默认韩文）；合并重复的风格要求
images:
  - 503-dance-move-reference-sheet-1.jpg
imageCredit:
  by: "@Ciri_ai"
  url: https://x.com/Ciri_ai/status/2048074587955658848
  license: CC0 1.0
verify:
  - 中文动作名称和说明的错字率；16 格小字较多，错字多时可改为只写动作名称
  - 16 格里角色服装、发型是否一致，有无多出或缺少格子
  - 动作说明是模型生成的，用作真实教学前需由懂行的人核对动作要领
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：[街舞基础组合] 可换成"八段锦""办公室肩颈拉伸""咏春基础手型""瑜伽拜日式"；如果你已经知道每一步叫什么，直接在提示词末尾列出"1. 准备 2. 弹跳 3. 胸部推送……"，模型会照着排，比让它自己编更准确。角色描述写清服装，方便看清四肢动作。

**常见问题**：
- 文字乱码：16 格的小字对模型压力很大。先只写动作名称，说明文字后期用设计软件补；或改成 3×3 九格。
- 动作重复、姿势看不出区别：在每个动作后补一句关键特征，例如"7. 半转身——背对镜头、单脚支撑"。
- 想要彩色：把"单色灰阶"改成"柔和低饱和配色"，并保留"白色背景"。

**适合**：舞蹈 / 健身课程讲义、绘画姿势参考、游戏角色动作设定。示例图为原作者生成的韩文版本，仅供参考。

### 英文原版

```text
[STYLE]
monochromatic grayscale illustration, 3D rendered character, clean instructional reference sheet,
white background, comic-style cell grid layout, technical diagram aesthetic

[LAYOUT]
4x4 grid layout, 16 panels total, each panel separated by thin black border lines,
numbered cells from 1 to 16, consistent panel size

[CHARACTER]
{argument name="character" default="young female dancer, athletic build, ponytail hairstyle, crop top and baggy pants, sneakers"}, same character in all panels

[PANEL STRUCTURE - per cell]
top-left: bold number badge + {argument name="title" default="Korean title text"}
center: full-body character pose illustration
bottom-left: {argument name="description" default="Korean description text (3-4 lines)"}
overlay: directional arrows indicating movement direction

[ARROWS / MOTION INDICATORS]
curved arrows, straight arrows, circular rotation indicators,
placed around the character to show movement flow and direction

[RENDERING STYLE]
high detail 3D sculpt style, soft studio lighting, subtle shadows,
no color, grayscale shading, clean linework, game concept art quality

[NEGATIVE]
no background scenery, no color tones, no extra characters,
no cluttered backgrounds
```

> 改编自 [@Ciri_ai](https://x.com/Ciri_ai/status/2048074587955658848) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0；示例图同样来自该仓库收录的原帖出图。
