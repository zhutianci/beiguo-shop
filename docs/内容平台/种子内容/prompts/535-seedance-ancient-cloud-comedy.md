---
title: seedance 提示词：古装腾云搞笑短视频（竖屏 10 秒 · 云被风吹走人掉下来）
slug: seedance-ancient-cloud-comedy
model: seedance
topics: [short-drama]
modelLabel: Seedance 2.0
aspectRatio: "9:16"
needsRefImage: false
useCase: 生成一条 10 秒的竖屏反转搞笑视频：古装仙女踩云飞行，一阵风把云吹走，她在空中愣了半秒才掉下去。适合抖音 / 视频号的搞笑段子、古风账号的整活素材。
prompt: |
  10 秒，竖屏 9:16，写实质感的搞笑短视频。
  在一处[中式古建筑景区]，一位身穿[白色古装]的年轻女子站在一朵白云上，离地大约两米，踩着云慢慢向前飞。
  前 4 秒：人和云平稳、同步地向前移动，她神情放松自然，衣袖轻轻飘动。
  第 4 秒起：一阵很强的侧风突然吹来，吹乱她的头发和衣袖。脚下的白云被风单独吹向画面右侧，而她没有跟着云走。
  白云完全离开她的脚下后，她在原地悬空停留半秒：先低头看看空空的脚下，再抬头看看飘走的云，一脸茫然。
  然后她失去支撑，垂直掉出画面下方；白云继续悠闲地飘向远处。
  关键点：云是被风横向吹走的，人留在原地；云离开后人物先悬停半秒再掉落，这半秒的停顿就是笑点。不要加复杂的仙术特效。
  声音：轻柔的古风笛声，风声突然变大，掉落时一声短促的"诶？"，然后只剩风声和远处的鸟叫。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-seedance-2-prompts
  url: https://x.com/Adam38363368936/status/2106040102530977900
  author: "@Adam38363368936（Adam也叫吉米）"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 原帖为中文、仓库收录的是英文译本；本站据英文版回译为中文，景区和服装改为变量，补充"半秒停顿是笑点"的说明与声音描述
images:
  - 535-seedance-ancient-cloud-comedy-1.jpg
imageCredit:
  by: "@Adam38363368936（Adam也叫吉米）"
  url: https://x.com/Adam38363368936/status/2106040102530977900
  license: CC BY 4.0
verify:
  - 在 Seedance 2.0 实测 3 次：云和人是否能"分开"（常见失败是人跟着云一起飘走）
  - 掉落时是否出现肢体扭曲；"诶？"这类语气词是否生成清楚
  - 示例图是原帖视频封面（踩云的古装女子），站长实测后可替换
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**时长与镜头**：整条只有一个固定的平视中景，笑点靠时间差：4 秒铺垫、1 秒风起、半秒悬停、1 秒掉落。镜头一动，观众就看不清"人还在、云没了"这个反差，所以不要加运镜。

**怎么填变量**：[中式古建筑景区] 换成"[江南水乡石桥]""[雪山脚下]"，[白色古装] 换成"[道袍]""[红色嫁衣]"。同一套路也能换道具：把"踩云"改成"骑着扫帚""坐在飞毯上"，被吹走的就是扫帚、飞毯。

**常见失败与调整**：
- 人跟着云一起被吹走：把关键点挪到最前面，并写"女子的双脚始终停在原来的位置"。
- 没有悬停直接掉：把"半秒"改成"一秒"，模型常常会压缩停顿。
- 云变成烟雾或特效光：写"一朵蓬松、实体感强的白云，像棉花"。

> 改编自 [@Adam38363368936（Adam也叫吉米）](https://x.com/Adam38363368936/status/2106040102530977900) 发布、[YouMind-OpenLab/awesome-seedance-2-prompts](https://github.com/YouMind-OpenLab/awesome-seedance-2-prompts) 收录的提示词，许可证 CC BY 4.0。

### 英文原版

```
10 seconds, 9:16 aspect ratio, realistic funny short video.

At an ancient Chinese architecture scenic spot, a young Asian woman wearing traditional ancient costumes stands on a white cloud, about 2 meters above the ground, slowly flying forward stepping on the cloud.

First 4 seconds: The girl and the white cloud move stably and synchronously forward, with the girl looking relaxed and natural.

Starting from the 4th second, a sudden lateral strong wind blows, moving the girl's hair and sleeves. The white cloud under her feet is slowly blown to the right side alone, while the girl does not follow the cloud.

After the white cloud completely leaves the girl's feet, she remains suspended in the original position for half a second. She first looks down at her feet, then looks up at the drifting cloud, showing a confused expression.

Then the girl loses support and falls vertically out of the frame. The white cloud continues to drift leisurely into the distance.

Key points: The cloud is blown away horizontally by the wind, leaving the person in place; after the cloud leaves, the character suspends for half a second before falling. Do not include complex magical effects.
```
