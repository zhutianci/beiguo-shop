---
title: 室内设计 AI 提示词（nano banana）：房间爆炸图，墙面 / 天花 / 地板拆开悬浮并标注材料尺寸
slug: exploded-room-interior
model: nano-banana
topics: [interior, infographic]
needsRefImage: false
aspectRatio: "16:9"
useCase: 做室内设计方案汇报、装修科普、作品集封面时，把一个房间"拆开"：天花板抬起、四面墙向外滑开、家具悬浮原位，并在建筑构件旁标注材料和尺寸，一张图讲清空间做法。
prompt: |
  把一间[书房]做成 3D 爆炸图：每个面和每件物品都悬浮在它原本的位置，彼此稍稍分开。
  - 拆分方式：天花板向上抬起，四面墙向外滑开，地板向下沉，家具在原位悬浮，小物件围绕所在的面轻轻漂浮；
  - 即使拆开，也能一眼看出房间原本的样子；
  - 光照：每个构件仍被原来的光源照亮，窗户的光穿过缝隙照进空间，台灯在空中投下光锥；
  - 只给建筑构件加标注（细引线 + 小字）：构件名称 / 材料 / 尺寸，例如"[地板] / [实木人字拼] / [22mm]"；
  - 背景是深色虚空，房间漂浮其中；
  - 左上角大标题"[书房]"，下面一行副标题"[房屋类型与年代]"；
  - 氛围像一个变成了宇宙的建筑模型，4K，空间关系极其清晰，画面锐利。
negativePrompt: null
source:
  repo: jau123/nanobanana-trending-prompts
  url: https://x.com/AllaAisling/status/2035390729527378146
  author: "@AllaAisling"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 译成中文并按"拆分方式 / 光照 / 标注 / 背景 / 标题"分条；房间类型、标注示例、标题副标题设为变量；删去原文重复的修辞句
images:
  - 522-exploded-room-interior-1.jpg
  - 522-exploded-room-interior-2.jpg
imageCredit:
  by: "@AllaAisling"
  url: https://x.com/AllaAisling/status/2035390729527378146
  license: CC BY 4.0
verify:
  - 实测中文标注（如"实木人字拼 / 22mm"）的清晰度和错字率，错字多就改用英文标注
  - 标注里的尺寸、材料是模型编的，商用时需替换成真实参数
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么填变量**：[书房] 换成"开放式厨房""主卧""卫生间""咖啡店吧台"都可以；副标题写房屋类型和年代，例如"老洋房改造 · 1930 年代"或"现代公寓 · 2024 年"，模型会据此选材和配家具。示例图是原作者生成的两张：英式乡村书房（护墙书架、藻井天花、人字拼地板）和工业风仓库厨房（清水混凝土岛台、红砖墙、钢窗），标注都贴在墙、地、顶这些构件上。

**用在真实方案上**：把你的设计要点写进标注里，比如"背景墙 / 微水泥 / 3.2m 宽""吊顶 / 无主灯 + 磁吸轨道"，这张图就成了能拿去和业主沟通的"做法示意"。也可以先上传自家房间照片，在开头加"参考上传照片里房间的布局和家具"。

**常见问题**：
- 拆得太散看不出房间：加"各部件间距小一点，保持房间轮廓"。
- 标注贴到了家具上：强调"只标注墙、地、顶、窗等建筑构件"。
- 画面太暗：把背景改成"深灰色"或"浅灰色纸张"。

**适合**：设计公司方案封面、装修科普笔记、建筑 / 室内专业作品集。

### 英文原版

```
[ROOM TYPE] pulled apart in 3D, every surface and object  floating at its exact position, slightly separated.  EXPLOSION: ceiling lifted, four walls sliding outward,  floor dropped, furniture floating in place,  objects orbiting their surfaces, light sources  still emitting across the exploded void.  The ghost of the room readable in the arrangement.  Labels on architectural elements only: "[SURFACE]" / "[MATERIAL]" / "[DIMENSION]"  LIGHTING: each element still lit by its original source,  windows casting light across the gap, lamps throwing cones  into empty space.  BACKGROUND: deep dark, the room floats in void. TITLE: "[ROOM NAME]" / SUBTITLE: "[BUILDING TYPE] [PERIOD]"  Mood: architectural model that became a universe. 4K, extraordinary spatial clarity, tack sharp.
```

> 改编自 [@AllaAisling](https://x.com/AllaAisling/status/2035390729527378146) 发布、[jau123/nanobanana-trending-prompts](https://github.com/jau123/nanobanana-trending-prompts) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)（Copyright (c) 2026 MeiGen.ai）。
