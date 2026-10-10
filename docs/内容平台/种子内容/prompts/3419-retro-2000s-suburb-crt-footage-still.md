---
title: "壁纸提示词：千禧年日本郊外小镇的老录像画面，显像管电视 + 日期水印的怀旧感（Nano Banana）"
slug: retro-2000s-suburb-crt-footage-still
model: nano-banana
topics: [wallpaper, photography]
modelLabel: Nano Banana Pro
aspectRatio: "1:1"
needsRefImage: false
useCase: "想要一张\"像从旧录像带里截出来\"的怀旧街景时用：2000 年代初的郊外小镇，雨后的马路和红叶，画面被装进一台老式显像管电视里，带扫描线和时间戳，适合做壁纸、专辑封面和视频片头。"
prompt: |
  [日本郊外的小镇]，[2000 年代初]的氛围，看起来像一段[老旧的家用摄像机录像]。
  - 画面：从高处俯拍的街角，雨后湿漉漉的柏油路映着车灯，路边有便利店、停车场和电线杆，远处是成片的住宅屋顶和山，树叶是深秋的红色；
  - 影像质感：整个画面显示在一台老式显像管电视的屏幕上，四角是圆弧形，带扫描线、轻微的色彩溢出和噪点，电视机外框是黑色；
  - 时间戳：右下角有白色点阵字体的日期和时间"[OCT 23 2001 5:48 PM]"；
  - 色调：偏暖的傍晚天光，低饱和、略微褪色；
  - 所有招牌和广告牌上的文字都模糊或打码，不出现任何可读的品牌名；不要人物特写。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-nano-banana-pro-prompts
  url: https://x.com/PSN62595111/status/2053455512570626105
  author: "@PSN62595111"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文只有一句话，译为中文并保留地点、年代、影像风格三个变量；按示例图补充了显像管电视边框、扫描线、右下角时间戳、雨后街道、招牌文字打码等画面要素，并加入\"招牌不出现可读品牌名\"的约束"
images:
  - 3419-retro-2000s-suburb-crt-footage-still-1.jpg
imageCredit:
  by: "@PSN62595111"
  url: https://youmind.com/nano-banana-pro-prompts?id=19417
  license: CC BY 4.0
verify:
  - "示例图里的店铺招牌被打了马赛克（原图如此）；出图时注意不要生成可辨认的真实连锁店标识"
  - "上线前在 Nano Banana 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[日本郊外的小镇] 可以换成"南方县城的老街""海边渔港""北方工厂家属区"；[2000 年代初] 换成"90 年代"时，画质可以再写差一点；时间戳换成你想纪念的日期。[老旧的家用摄像机录像] 也可以换成"监控摄像头画面""一次性胶片相机照片"，但那样就把显像管电视那一条删掉。

示例图：黑色电视机边框里是一幅微微鼓起的屏幕画面——傍晚的十字路口，雨后的路面反着橙色的光，几辆亮着大灯的轿车驶过，路边是蓝白色调的便利店和红叶树，远处是密密的屋顶和淡紫色的山；招牌都被马赛克遮住，右下角是白色点阵字"OCT 23 2001 5:48 PM"。

**常见问题**：
- 画面太清晰、不像老录像：加"分辨率很低，边缘发虚，有横向的拖影条纹"。
- 出现真实连锁店的标志：保留最后一条约束，或写"招牌是空白的灯箱"。
- 电视边框太抢眼：写"电视外框只露出很窄的一圈"。

**适合**：怀旧风壁纸、歌单 / 专辑封面、短视频片头、回忆类文章配图。

### 英文原版

```text
{argument name="location" default="a Japanese suburb"} in the the {argument name="year" default="2000s"} atmosphere that like an {argument name="style" default="old footage"}
```

> 改编自 [@PSN62595111](https://x.com/PSN62595111/status/2053455512570626105) 发布、[YouMind-OpenLab/awesome-nano-banana-pro-prompts](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
