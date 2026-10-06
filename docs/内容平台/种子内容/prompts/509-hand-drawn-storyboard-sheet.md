---
title: AI分镜提示词：铅笔手绘分镜头脚本（四格分镜 + 镜头与光线标注）
slug: hand-drawn-storyboard-sheet
model: gpt-image-2
topics: [comic, poster]
aspectRatio: "16:9"
needsRefImage: false
useCase: 拍短片、做 AI 视频或写提案前，先把"前后变化"类的故事画成一张铅笔手绘分镜稿：四格画面 + 每格的场景名、机位、光线手写标注，方便和团队对齐，也可以当图生视频的参考帧。
prompt: |
  一张专业的手绘分镜头脚本稿，铅笔加钢笔墨线插画风：粗犷有艺术感的线条、交叉排线表现阴影、松弛有表现力的笔触；黑白单色，背景是泛黄的米白旧纸纹理。
  2×2 网格，四个大小相同的分镜格，每格用粗的手绘黑色墨线框住。
  故事：[一艘废弃生锈的渔船被修复一新]，四格按时间顺序推进：
  - 左上：[锈迹斑斑的船停在码头]，栏杆断裂、海鸥盘旋，阴天无人；下方手写标注"SCENE 01 — [废弃状态] | [固定广角码头镜头] | [阴天] | [无人]"。
  - 右上：[工人用高压水枪冲洗船体]，穿防护服，水雾飞溅，地上堆着杂物；手写标注"SCENE 02 — [清洗与拆除] | [高压冲洗] | [多云日光]"。
  - 左下：[脚手架搭起、焊接火花迸射]，工人打磨和刷底漆；手写标注"SCENE 03 — [修复与重建] | [焊接火花 + 脚手架]"。
  - 右下：[船体焕然一新，工人站成一排]，金色夕阳的光线斜射下来；手写标注"SCENE 04 — [修复完成] | [最终上漆 + 黄金时刻]"。
  顶部用粗体手写字写标题"[渔船修复分镜]"；底部手写制作备注："Cam: [固定广角] | Lens: [广角] | 节奏: [线性推进]"。
  整体要有铅笔石墨质感、钢笔描边和粗糙纸张手感，像真正的电影分镜稿。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/saniaspeaks_/status/2050465100973191219
  author: "@saniaspeaks_"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 英文原文译为中文；故事主题、四格画面内容、每格标注、标题与制作备注改为变量；原文船名（含真实地名）改为通用标题；删去开头与画面无关的说明句
images:
  - 509-hand-drawn-storyboard-sheet-1.jpg
imageCredit:
  by: "@saniaspeaks_"
  url: https://x.com/saniaspeaks_/status/2050465100973191219
  license: CC0 1.0
verify:
  - 中文手写标注的清晰度和错字率；中文不稳时标注保留英文、标题用中文
  - 四格之间主体（船 / 房间 / 人物）是否保持同一个
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：最适合"同一个主体的前后变化"：老房翻新、花园改造、旧车修复、一道菜从备料到上桌。先用一句话写故事，再给每格写"画面内容 + 场景名 + 机位 / 光线"。四格里主体位置尽量不变（例如都写"同一机位"），画面才连贯，后续拿去做图生视频也更顺。

**常见问题**：
- 画得太精细不像分镜：加一句"草图感，留出未完成的线条，不要上色"。
- 想要 6 格或 9 格：把"2×2 网格，四个"改成"2×3 网格，六个"，并补齐每格内容。
- 标注挤出格子外：每格标注控制在 3 段以内，用竖线分隔。

**适合**：短片 / 广告提案、AI 视频前期规划、分镜课作业。示例图为原作者生成，仅供参考。

### 英文原版

```text
A professional hand drawn sketch storyboard sheet, pencil and ink illustration style, rough artistic linework, cross-hatching for shadows, loose expressive strokes, monochrome black and white on aged cream/off-white paper texture background, 2x2 grid layout with four equal storyboard panels bordered by thick hand-drawn black ink frames. Top-left panel sketch: abandoned rusted cargo ship at dock, heavy hatching for rust texture, broken railings, algae, seagulls, no humans, dark moody pencil shading, handwritten label below: "SCENE 01 — ABANDONED STATE | Static wide dock shot | Overcast | No humans". Top-right panel sketch: same ship with workers using pressure washers, dynamic water spray motion lines, figures in safety gear, debris piles, handwritten label: "SCENE 02 — CLEANING & STRIP-DOWN | Pressure wash + debris clear | Cloudy daylight". Bottom-left panel sketch: welding sparks as burst star lines, scaffolding structure, worker figures grinding and painting, primer sections with hatching, handwritten label: "SCENE 03 — REPAIR & REBUILD | Welding sparks + scaffolding | Primer applied". Bottom-right panel sketch: fully restored ship, clean hull, workers standing back, golden hour rays as radiating diagonal lines, handwritten label: "SCENE 04 — FULL RESTORATION | Final paint + golden hour | Completion". Bold hand-lettered title at top: "SEA HARVEST VALLETTA — RESTORATION STORYBOARD". Handwritten production notes at bottom: "Cam: Static Wide-Angle Dock | Lens: Wide | Progression: Linear | Style: Photorealistic". Pencil graphite texture, ink pen outlines, rough paper feel, professional film storyboard aesthetic.
```

> 改编自 [@saniaspeaks_](https://x.com/saniaspeaks_/status/2050465100973191219) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0；示例图同样来自该仓库收录的原帖出图。
