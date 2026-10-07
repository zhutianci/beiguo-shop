---
title: "照片转水彩提示词：旅行照片变成彩铅水彩手绘旅行日记（雨天街景示例）（gpt-image-2）"
slug: photo-to-watercolor-travel-sketch
model: gpt-image-2
topics: [illustration]
aspectRatio: "3:4"
needsRefImage: true
useCase: "上传一张旅行或街景照片，保留构图、建筑和人物，转成暖米色旧纸上的彩铅 + 水彩速写，四周大量留白，上下配手写标题和小字，适合旅行手账、游记配图和明信片。"
prompt: |
  把参考照片转成一张精致的[手绘旅行日记插画]，保留原照片的构图、建筑、人物、树木、草地、道路和整体透视。
  使用传统彩铅 + 水彩速写的美感，画在暖色、略显陈旧的奶油色纸上。建筑保持可辨认，但简化成有表现力的手绘造型：可见的铅笔笔触、松弛的水彩淡彩、细微的纸张颗粒、不完美的轮廓和轻柔的交叉排线。
  保留宁静的[雨天]氛围：柔和的阴天天空、暖米色和低调的建筑、清新的绿色草坪、撑伞散步的零星行人、湿润的路面、树木、长椅、水洼和远处的车。
  使用低调的复古旅行速写配色，带自然的瑕疵和含蓄的颜色。
  插画放在页面下半部分，四周留出大量奶油色空白。上方加一行优雅的手写标题"[Rainy Days]"，下方一行"— Quiet moments —"。
  极简、怀旧、有艺术感的旅行杂志美学，像把胶片照片变成了私人速写本里的回忆；精致、真实，不要照片质感。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/selinatasnim1/status/2097923838449516732
  author: "Selina"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；风格、氛围、标题改为变量"
images:
  - 3128-photo-to-watercolor-travel-sketch-1.jpg
imageCredit:
  by: "Selina"
  url: https://youmind.com/gpt-image-2-prompts?id=34219
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：上传一张构图清楚的旅行照（街景、建筑、公园最适合）；[雨天] 换成照片的真实氛围，如"晴朗午后""黄昏""雪后"；标题可以写中文"[雨天的伦敦]""[西湖·清晨]"。[手绘旅行日记插画] 也可以换成"钢笔淡彩速写""水彩明信片"。

示例图是一张米色旧纸上的竖版速写：下半部分是彩铅水彩画的雨天公园和欧式建筑，草地、路灯、撑伞的行人和湿润的小路，上方手写体"Rainy Days"，下方小字"— Quiet moments —"，四周大面积留白。

**常见问题**：
- 画得太写实：强调"可见的铅笔笔触、松弛的水彩，不要照片质感"。
- 人物和建筑被改掉：重复"保留原照片的构图、建筑和人物"。
- 想要更满的画面：把"放在页面下半部分"改成"占据页面中央三分之二"。

**适合**：旅行手账、游记 / 公众号配图、明信片、旅行纪念册。

### 英文原版

```text
Transform the reference photograph into a delicate {argument name="style" default="hand-drawn travel journal illustration"} while preserving the original composition, architecture, people, trees, grass, road, and overall perspective. Use a traditional colored-pencil and watercolor sketch aesthetic on warm, slightly aged cream paper. Keep the buildings recognizable but simplify them into expressive hand-drawn shapes, with visible pencil strokes, loose watercolor washes, subtle paper grain, imperfect outlines, and gentle cross-hatching. Preserve the peaceful {argument name="atmosphere" default="rainy-day"} atmosphere, soft overcast sky, warm beige and muted buildings, fresh green lawn, scattered people walking with umbrellas, wet pavement, trees, benches, puddles, and distant cars. Use a muted vintage travel-sketch palette with natural imperfections and understated colors. Place the illustration in the lower portion of the page with generous cream-colored negative space around it. Add elegant handwritten typography above: ‘{argument name="heading" default="Rainy Days"}’, and below: — Quiet moments —. Minimal, nostalgic, artistic travel magazine aesthetic, analog photography transformed into a personal sketchbook memory, sophisticated and authentic, no photorealism.
```

> 改编自 [Selina](https://x.com/selinatasnim1/status/2097923838449516732) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
