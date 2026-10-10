---
title: "ai角色设定图提示词：淡彩线稿角色姿势合集，散落手写心情短句（gpt-image-2）"
slug: line-art-character-pose-collection-handwritten
model: gpt-image-2
topics: [character, sticker, illustration]
aspectRatio: "3:4"
needsRefImage: true
useCase: "上传一张自己的原创角色图，生成一整页\"画师速写本\"式的姿势合集：同一个角色二十来个日常小动作散落在米白底上，细墨线加低饱和淡彩，每个小图旁边一句手写心情短句，适合做角色介绍页、周边贴纸素材。"
prompt: |
  以我上传的角色图为参考，画一张"插画合集"式的角色小图集。
  - 画风：简洁的线稿插画，造型平面、轻盈，墨线纤细均匀，氛围安静平和；
  - 配色：整体以黑、灰、白的单色调为主，只在眼睛里加一点[参考图里的瞳色]作点缀；头发保留参考图的发色，但降低饱和度；
  - 服装：每个小图换一套得体的日常穿搭，衣服用[藏青、红、绿]等几种颜色，低饱和淡彩平涂；
  - 排布：同一个角色的[20]个左右不同姿势和小动作，有半身、有全身，大小不一、随意散落在整张米白色画面上，像画师的速写合集，不画分格线；
  - 台词：在每个小图旁边加一句表达角色此刻心情的短句，不用对话气泡，用柔软的手写体直接写在空白处，内容由你自由发挥，如[开心、有点困、肚子饿了、加油]，全部用简体中文；
  - 点缀：零星的小爱心、小花、小星星线描符号；
  - 不要水印、签名和边框。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/ShynUrab70521/status/2059245289421340696
  author: "@ShynUrab70521"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "日文原帖是两步（先出无字合集，再让模型加台词），合并为一条中文提示词；瞳色、服装颜色、姿势数量、台词示例改为变量；台词由日文改为简体中文；按示例图补充了保留发色、米白底、小符号点缀和\"得体的日常服装\"等要求"
images:
  - 3452-line-art-character-pose-collection-handwritten-1.jpg
imageCredit:
  by: "@ShynUrab70521"
  url: https://youmind.com/gpt-image-2-prompts?id=22720
  license: CC BY 4.0
verify:
  - "示例图为动漫少女多姿势合集（含制服、居家服趴卧姿势），请站长确认尺度可接受；角色应为原作者自创形象，无法逐一核实"
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：先上传一张角色图（正面、五官和发型清楚的立绘最好，建议用自己的原创角色）。[参考图里的瞳色] 一般不用改，想指定就写"琥珀色""湖蓝色"；[藏青、红、绿] 是衣服的点缀色，换成"奶茶色、雾蓝、浅粉"会更柔和；[20] 是小图数量，想要每个画得更精细就改成 9 或 12；台词示例换成你想要的语气，比如"上班中、摸鱼、想放假、下班啦"。

示例图是一位橙色长发、头顶有一撮呆毛的少女，同一页里有二十来个小图：伸懒腰、揉眼睛、抱着玩偶熊、啃汉堡、捧着马克杯、趴在桌上写字等等，衣服有制服、针织衫、连帽衫、风衣；墨线很细，颜色淡，空白处散落着"元気""お腹すいた"等日文手写短句和小爱心。

**常见问题**：
- 角色越画越不像：把数量减到 9～12 个，并强调"每个小图的发型、发色、脸型与参考图一致"。
- 中文手写字出错：台词限制在 2～5 个字，或先出无字版，再单独让模型加字。

**适合**：原创角色介绍页、同人本扉页、切开做成贴纸或手账素材；不建议上传真人照片或他人作品里的角色。

### 日文原版

```text
Simple line drawing illustration style, flat and light shapes, delicate and uniform ink-style lines, quiet and calm atmosphere. Monotone palette based on black, gray, and white, with a subtle accent by adding a hint of {argument name="eye color" default="the eye color from the attached image"} to the eyes. Arrange characters in various poses and gestures randomly, like an illustration collection. No text. However, set the clothing colors to {argument name="clothing colors" default="navy blue, red, and green"}, or various other colors. Add lines expressing their feelings to this image. Instead of speech bubbles, use a soft, handwritten font. Scatter many lines throughout. Think of the lines freely.
```

> 改编自 [@ShynUrab70521](https://x.com/ShynUrab70521/status/2059245289421340696) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
