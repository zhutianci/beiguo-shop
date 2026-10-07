---
title: AI写真提示词：黑白模特试镜四宫格，同一人四种表情和角度的胶片接触印样（gpt-image-2）
slug: casting-contact-sheet-bw
model: gpt-image-2
topics: [fashion, portrait]
needsRefImage: false
aspectRatio: "4:5"
useCase: 做角色定妆参考、写真风格样片、社媒九宫格素材时，生成一张黑白胶片质感的 2×2 试镜表：同一个人、同一身造型，四格分别是不同表情和机位。
prompt: |
  一张黑白时装试镜接触印样，主角是[一位二十多岁的女性]，发型[齐刘海黑色短卷发]，排成干净的 2×2 四格近景人像，背景是[纯灰色影棚墙]，穿着[黑色无袖背心]，戴着[小圈耳环]。
  - 四格分别是不同的表情和角度：[皱眉眯眼、嘟嘴、开怀大笑、侧脸]；
  - 柔和的影棚光，清晰的单色对比，皮肤纹理自然、面部细节清楚；
  - 干净的纯色背景，轻微胶片颗粒，四格之间有黑色胶片边框；
  - 气质：高端杂志的试拍样片，造型极简，镜头距离亲近，专业人像摄影。
  画幅[4:5]竖版。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/Ciri_ai/status/2064027400426709259
  author: "@Ciri_ai"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 译成中文并拆成要点；原文的人物、发型、背景、服装、配饰、表情占位符保留为变量并按示例图给出默认填法；补充胶片边框描述
images:
  - 3256-casting-contact-sheet-bw-1.jpg
imageCredit:
  by: "@Ciri_ai"
  url: https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts/blob/main/images/portrait_case274/output.jpg
  license: CC0 1.0
verify:
  - 示例图胶片边框上印有真实胶卷品牌字样，展示时考虑裁掉边缘或注明
  - 人物为 AI 生成，提醒用户不要用真人照片冒充他人
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么填变量**：六个变量对应原提示词的六个占位：人物（年龄、性别、气质）、发型、背景、服装、配饰、四种表情。例如"[一位短发男生] + [寸头] + [白墙] + [白 T 恤] + [银色项链] + [面无表情、挑眉、低头笑、仰头]"；想做定妆参考，就把服装换成角色的戏服。示例图是 2×2 黑白胶片格：同一位齐刘海短卷发女生，左上皱着脸眯眼，右上嘟嘴，左下露齿大笑，右下是右侧脸，四格边缘有胶片齿孔边和数字。

**常见问题与调整**：
- 四格长得不像同一个人：加"四格是同一个人，五官、发型、雀斑位置完全一致"。
- 表情不够夸张：每个表情写得更具体，如"用力皱鼻子、眼睛紧闭"。
- 想用自己的照片：上传一张正脸照，写"保持上传照片人物的五官，生成四种表情"，请只用本人或已获授权的照片。
- 想要彩色版：把"黑白"改成"低饱和彩色胶片"。

**适合**：角色定妆参考、写真风格样片、社媒拼图素材；不适合用他人照片生成后冒充本人发布。

### 英文原版

```
Black-and-white fashion casting contact sheet of [HUMAN] with [HAIR], arranged in a clean 2x2 grid of four close portrait frames against [BACKGROUND], wearing [CLOTHING] and [ACCESSORY]. Each frame shows a different expression and angle: [EXPRESSIONS]. Soft studio lighting, crisp monochrome contrast, natural skin texture, visible facial details, clean plain backdrop, subtle film grain, high-end editorial test shoot, minimal styling, intimate camera distance, professional portrait photography, aspect ratio 4:5.
```

> 改编自 [@Ciri_ai](https://x.com/Ciri_ai/status/2064027400426709259) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0。
