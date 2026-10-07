---
title: 游戏UI提示词：低多边形即时战略游戏截图，梯田山村 + 两队兵阵 + 资源栏小地图
slug: low-poly-rts-village
model: gpt-image-2
topics: [game-art]
needsRefImage: false
aspectRatio: "16:9"
useCase: 做独立策略游戏的概念截图、RTS 关卡氛围图、游戏设计课作业时，生成一张低多边形风格的等距战略地图：建筑、梯田、单位选框、资源计数和战争迷雾小地图都在画面里。
prompt: |
  创作一张等距视角的低多边形策略游戏截图，场景是[山间的日式村庄]，有层层梯田和鸟居。
  - 单位：[武士与弓箭手]排成阵列，分成两支颜色不同的队伍；
  - 界面：即时战略游戏 UI——单位选择框、[稻米和木材]资源计数、带战争迷雾的小地图、指令按钮覆盖层；
  - 光线：温暖的白天日光，柔和阴影；
  - 风格：风格化但清晰易读，现代独立策略游戏的主视觉质感。
  画幅[16:9]。
negativePrompt: null
source:
  repo: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/skills/gpt-image/references/gallery-gaming.md
  author: null
  license: MIT
  licenseUrl: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE
  changes: 仓库整理的提示词，译成中文并拆成要点；场景、兵种、资源类型、画幅设为变量；补充"两队颜色不同"的约束和常见问题
images:
  - 3211-low-poly-rts-village-1.jpg
imageCredit:
  by: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/docs/gaming/lowpoly-samurai-strategy.png
  license: MIT
verify:
  - 原始出处：原帖：https://www.reddit.com/r/midjourney/comments/1l2d5dr/lowpoly_strategy_video_games_in_japan_prompts/，核对原帖仍可访问、作者未另行声明保留权利
  - 原文要求 16:9，示例图实际接近 3:2，确认出图比例
  - 页面署名需保留"Copyright (c) 2026 Wuyoscar, MIT License"及许可证链接
---
**怎么填变量**：[山间的日式村庄] 可以换成"黄土高原的窑洞村落""北欧峡湾边的维京营地""沙漠绿洲集市"；[武士与弓箭手] 跟着场景换成"长枪兵与骑兵""维京战士与长船"；[稻米和木材] 换成"粮食、石料、金币"。示例图是仓库作者的出图：俯视的低多边形山谷里有几座木屋、一片梯田和两座红色鸟居，左下是一队蓝衣长枪兵、右下是一队红衣士兵，各自被绿色选框框住；左上角显示资源数 295，右上是黑色小地图，右下有剑、菱形和旗帜三个指令按钮。

**常见问题与调整**：
- 画面像普通插画：加"标准 RTS 俯视角，四周有完整游戏 UI 边框"。
- 资源栏只有一项：明确"左上角并排显示两种资源图标和数字"。
- 单位太小看不清：加"单位模型稍大，头盔和武器轮廓清楚"。
- 想要战斗场面：改成"两队在村口交战，有箭矢轨迹和小型爆炸特效"。

**适合**：独立策略游戏概念图、关卡设计氛围参考、游戏设计课作业；不适合当作真实游戏截图宣传。

### 英文原版

```
Create an isometric low-poly strategy game screenshot of a mountainous Japanese village with rice terraces, torii gates, samurai and archer units in formation, and a tactical RTS interface. Include unit selection boxes, resource counters for rice and wood, fog-of-war minimap, command overlays, and warm daylight with soft shadows. Stylized but readable, modern indie strategy game key art, 16:9.
```

> 改编自 [wuyoscar/GPT-Image2-Skill](https://github.com/wuyoscar/GPT-Image2-Skill) 收录的提示词（仓库整理），许可证 MIT（Copyright (c) 2026 Wuyoscar）。
