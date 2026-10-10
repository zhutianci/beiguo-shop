---
title: "壁纸提示词：雾中没有尽头的巨型城墙，草原上一匹小马的超现实极简建筑（gpt-image-2）"
slug: fog-megastructure-wall-tiny-horse-surreal
model: gpt-image-2
topics: [wallpaper, photography, illustration]
aspectRatio: "9:16"
needsRefImage: false
useCase: "用\"巨大到看不到顶的建筑 + 极小的参照物\"做一张安静又有压迫感的超现实画面：前景是空旷的草地，远处一面住宅楼般的巨墙消失在雾里。适合做手机壁纸、专辑和小说封面、概念设计的氛围参考。"
prompt: |
  生成一张超现实的极简建筑摄影，9:16 竖版，像用长焦镜头从很远的地方拍摄。
  - 主体：一面由[浅色混凝土]建成的"公寓城墙"——一整座城市被压成一面墙，矗立在空旷的[草原]尽头；它大到顶部完全消失在[蓝绿色的雾]里，一排排窗户密到连成一整块连续的竖向立面，只剩下细密的肌理。
  - 构图：画面约 60% 是空旷的草地和蓝灰色的雾气；下三分之一处有[一匹很小的马]，一条窄窄的土路从前景蜿蜒通向巨墙；墙脚下立着一个极小的深色入口。
  - 观看顺序：第一眼看到的是空旷安静的原野，第二眼才意识到远处那片"天空"其实是一座不可能存在的建筑。
  - 光线：清冷的晨雾，柔和的漫射光，没有明显的阴影。
  - 色调：克制的浅灰和灰绿色，低饱和，低对比。
  - 质感：写实的摄影颗粒，草地的细节清楚，建筑越往上越淡；不要人物，不要文字和水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/Pinkuo_/status/2068050331817365673
  author: "@Pinkuo_"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文是一组三条同系列提示词，这里取与第 1 张示例图对应的\"城墙\"一条译为中文并整理为分条；建筑材质、地貌、雾色、参照物改为变量"
images:
  - 3554-fog-megastructure-wall-tiny-horse-surreal-1.jpg
imageCredit:
  by: "@Pinkuo_"
  url: https://youmind.com/gpt-image-2-prompts?id=26233
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[浅色混凝土] 可换"锈红色钢板""白色陶砖""黑色玻璃"；地貌和雾色搭配着换，例如"盐湖 / 乳白色的雾""沙漠 / 橙黄色的沙尘""雪原 / 淡紫色的晨霭"；[一匹很小的马] 是尺度参照物，可换成"一个撑伞的人影""一棵孤零零的树""一辆小货车"，一定要小，才显得建筑巨大。

示例图上面四分之三是一片灰绿色的"墙"，仔细看是无数层密密的窗格，越往上越模糊，最后融进雾里；下面是一片暗绿色的草地，一条浅色的小路弯弯曲曲通向墙脚，路边站着一匹很小的深色的马，墙根处有一个小小的黑色门洞。

**常见问题**：
- 建筑有了屋顶和天际线：强调"顶部不可见，直接消失在雾中，画面上方没有天空"。
- 参照物太大：写"参照物高度不超过画面的 2%"。
- 颜色太鲜艳：加"整体像褪色的胶片，饱和度很低"。

**适合**：手机壁纸、专辑与小说封面、科幻和反乌托邦题材的概念氛围图。

### 英文原版

```text
1. City Wall: A single {argument name="structure material" default="pale concrete"} apartment-city wall rising beyond an empty {argument name="terrain" default="grassland"}, so large that the top disappears into {argument name="atmosphere" default="blue-green fog"} and the window rows merge into one continuous vertical face. Vertical 9:16 distant telephoto from a quiet meadow, 60 percent empty grass and blue haze, one tiny horse in the lower third and a narrow dirt path leading toward the wall; first read is the empty field, second read is the impossible city mass. Cool morning mist, soft diffused light, restrained pale gray and muted green palette, repeated apartment rows softened into texture, one dark rectangular gate far above the ground. No street-level city scene, no skyline collage, no many separate towers, no market, no traffic, no busy engineering, no pipes, no cranes, no cyberpunk lights, no readable text, no logo, no watermark.

2. Inverted Ceiling: A single inverted city ceiling suspended over a black wet plain, so large that only the underside fragment fits in frame and the hanging building layers fade into night fog. 21:9 wide low-angle shot from an empty reflective plain, 70 percent mist, darkness, and mirror-like ground, three tiny people at the lower edge below the overhang; closest point is empty wet ground, final focus is the impossible city underside. Deep blue night haze, faint warm window texture as a thin distant seam, matte concrete slabs, soft reflections, silence. No street-level city scene, no skyline collage, no separate tower cluster, no traffic, no cranes, no pipes, no neon clutter, no readable text, no logo, no watermark, no fisheye distortion, no feet dominating foreground.

3. City Gate: A single stacked apartment-city gate cut through a world-scale city dam, so large that both vertical edges leave the frame and the city details merge into one quiet inhabited cliff. 16:9 frontal long shot across an empty pale salt flat, 65 percent blank foreground and fog-bright sky seen through the colossal rectangular opening, two tiny vehicles stopped at the threshold on a thin road; first read is the empty salt flat, second read is the city gate. White haze, soft overcast light, pale concrete and blue-gray shadows, repeated window bands as quiet surface texture, the far side of the opening dissolving into mist. No street-level city scene, no skyline collage, no fantasy ruin, no ornate city gate, no sci-fi corridor, no many separate towers, no traffic, no cranes, no pipes, no cyberpunk lights, no readable text, no logo, no watermark.
```

> 改编自 [@Pinkuo_](https://x.com/Pinkuo_/status/2068050331817365673) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
