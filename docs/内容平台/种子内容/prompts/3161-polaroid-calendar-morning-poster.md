---
title: "早安海报提示词：拍立得照片 + 日历日期 + 书法\"早安\"的日系城市早安图（gpt-image-2）"
slug: polaroid-calendar-morning-poster
model: gpt-image-2
topics: [poster]
aspectRatio: "3:4"
needsRefImage: false
useCase: "生成一张日系杂志风的城市早安海报：暖纸底上贴着一张拍立得照片，左上是大号日期，右上是星期和农历，书法\"早安\"斜压在照片右下角，下方是天气和一句金句，适合公众号 / 朋友圈每日早安图和城市号日更。"
prompt: |
  在有温暖纹理的纸张背景上，呈现一张竖版的日历杂志版面。
  画面左上方贴着一张拍立得胶片照片，加宽的白边和细微的立体投影。照片内容由主题决定：[深圳]在[2026 年 8 月 19 日]的早安问候，是一张有胶片质感的生活场景，色调清新自然。
  左上角是月份和超大号日期数字，使用从照片主色中提取的浓郁复古衬线字体；右上角是纤细精致的星期和农历文字。
  一组粗犷洒脱的手写毛笔书法"早安"斜着压在照片右下边缘，并延伸到卡片背景上，形成生动的层次感。
  照片下方放低饱和度的英文引语（如"GOOD MORNING · 城市名"），以及疏朗、有节奏感、左对齐的几行中文：问候、当天天气（温度）、一句祝福和一句金句；右下角是极简的品牌落款和细小的分类标签。
  整体文字和装饰的颜色呼应照片的主色调，形成深浅递进，呈现安静、优雅、松弛、治愈的日式生活美学。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/xiaoxiaodong01/status/2089860052308119958
  author: "小小东"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文中文说明的英文写法改写为中文；主题（城市、日期、天气、金句）改为变量"
images:
  - 3161-polaroid-calendar-morning-poster-1.jpg
  - 3161-polaroid-calendar-morning-poster-2.jpg
  - 3161-polaroid-calendar-morning-poster-3.jpg
imageCredit:
  by: "小小东"
  url: https://youmind.com/gpt-image-2-prompts?id=31915
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：两个方括号分别写城市和日期，例如"[西安]""[2026 年 8 月 19 日]"；想加天气就在后面补一句"天气：小雨转雷阵雨，17～24℃"，模型会自动配城市照片、天气和金句。想控制文案，就直接把天气和金句写出来；落款"晨间城市志"可以换成你的账号名。

示例图三张，同一模板换了三座城：深圳（雨后海滨步道和高楼，蓝色书法"早安"）、西安（古城墙上晨跑的人，红色书法"早安"）、昆明（雨中的花店街角，紫色书法"早安"），版式完全一致：左上大号"AUGUST 19"，右上星期与农历，下方几行问候和天气。

**常见问题**：
- 农历、天气是编的：发布前请按当天真实信息改写；日期与农历要对应。
- 书法字糊：只写"早安"两个字最稳。
- 照片里出现可识别的路人正脸：写"人物为远景背影"。

**适合**：公众号 / 朋友圈每日早安图、城市号日更、旅行账号、品牌日签。

### 原版提示词

```text
On a warm-textured paper background, the composition presents a vertical calendar magazine layout. In the upper-left of the frame, a Polaroid film photo with a widened white border and a subtle 3D projection is attached. The frame showcases a life scene with film texture determined by the {argument name="subject" default="Good morning greeting for a specific city with a quote and weather for August 19, 2026"}, with clear and natural tones. The upper-left of the frame features the month and large date digits in a rich, deep vintage serif font extracted from the primary colors, while the upper-right has slender, delicate characters for the day of the week and lunar calendar. Bold, free-spirited handwritten brush calligraphy diagonally stamps across the bottom-right edge of the frame, extending onto the card background to create a vivid layered effect. Below the frame, low-saturation English intros and sparsely arranged, rhythmic left-aligned Chinese poetic sentences are placed, with a minimalist brand signature and tiny category tags at the bottom-right. The overall colors of text and decoration echo the primary tones in the frame, creating a deep and shallow progression, overall presenting a quiet, elegant, relaxed, and healing Japanese lifestyle aesthetic.
```

> 改编自 [小小东](https://x.com/xiaoxiaodong01/status/2089860052308119958) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
