---
title: "壁纸提示词：一个主题词生成开放世界游戏远景，巨大天体 + 无人旷野的史诗场景（Nano Banana）"
slug: open-world-vista-theme-environment
model: nano-banana
topics: [wallpaper, game-art]
modelLabel: Nano Banana Pro
aspectRatio: "16:9"
needsRefImage: false
useCase: "只给一个主题词（如\"双日沙漠\"\"月下浮岛\"），就生成一张像 3A 开放世界游戏远景原画一样的宽幅场景：辽阔地形、标志性的天空奇观、没有人物，适合做壁纸、世界观配图和视频背景。"
prompt: |
  主题 = "[双日照耀的红色沙漠峡谷]"。
  以这个主题为灵感，画一张宽幅的电影感奇幻游戏环境插画，画幅[16:9]。
  - 镜头：远景、以环境为主角，突出辽阔的尺度感和"想去探索"的感觉；
  - 世界：一片广袤的开放世界，地形、颜色、地表形态和地平线的轮廓，全部由主题本身的逻辑、氛围和材质自然生成；
  - 天空：有一个巨大的天空奇观或天体，从视觉上定义这个世界，并强化主题；
  - 无人：环境里没有角色、生物、载具和建筑；
  - 光线：柔和、有沉浸感，重氛围和尺度而不是写实；用游戏美术常见的空气透视表现纵深和距离；
  - 整体要像高成本开放世界游戏里的远眺画面，而不是一张照片；安静、壮阔，让人一眼看出这是由主题塑造的游戏世界。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-nano-banana-pro-prompts
  url: https://x.com/aimikoda/status/2020059702680269114
  author: "@aimikoda"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并拆成要点；主题设为变量并给出示例值；保留\"无人、无建筑、无载具\"\"天空有标志性天体\"等约束；删去重复的\"由主题决定\"表述"
images:
  - 3417-open-world-vista-theme-environment-1.jpg
  - 3417-open-world-vista-theme-environment-2.jpg
imageCredit:
  by: "@aimikoda"
  url: https://youmind.com/nano-banana-pro-prompts?id=9274
  license: CC BY 4.0
verify:
  - "上线前在 Nano Banana 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：主题写一个带画面感的短语最好，例如"破碎月亮下的雨林浮岛""极光笼罩的黑色玄武岩海岸""巨树化石构成的白色盐原"；只写一个抽象词（如"孤独""复苏"）也可以，模型会自己联想。手机壁纸把画幅改成 9:16。

示例图第一张：橙红色的沙漠峡谷，两侧是层层叠叠的砂岩峭壁，天空中一大一小两颗发光天体带着环状云气，整个画面笼罩在暖色的沙尘里。第二张是竖版：云海上的苔藓浮岛和瀑布，一道天然石拱，天空中是一弯缠着藤蔓的残月和日食般的光环。

**常见问题**：
- 画面里冒出小人或城堡：保留"无人"那一条，并补"没有任何人造物"。
- 天空平平无奇：在主题里直接点名天体，如"头顶悬着三个月亮"。
- 太写实像风光照：加"手绘概念原画质感，笔触可见"。

**适合**：电脑 / 手机壁纸、小说与桌游的世界观配图、视频背景、游戏提案情绪板。

### 英文原版

```text
[THEME] = "{argument name="theme" default="Enter a theme here"}" 

Make a wide cinematic fantasy game environment illustration inspired by [THEME].
Use a distant environment-focused camera with an expansive sense of scale and exploration.
Set the scene as a vast open world shaped entirely by the logic, atmosphere and materials implied by [THEME].
Show a monumental sky feature or celestial presence that visually defines the world and reinforces the theme.
Let the terrain, colors, surface forms and horizon geometry emerge naturally from [THEME] without explicit constraints.
Keep the environment uninhabited with no characters, creatures, vehicles or structures.
Use soft, immersive lighting appropriate to the world, favoring mood and scale over realism.
Apply game-style atmospheric perspective to suggest depth, distance and exploration.
Compose the scene to feel like a high-budget open-world game vista rather than a photograph.
Ensure the final image feels serene, epic and discovery-driven, clearly readable as a game world shaped by [THEME].
```

> 改编自 [@aimikoda](https://x.com/aimikoda/status/2020059702680269114) 发布、[YouMind-OpenLab/awesome-nano-banana-pro-prompts](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
