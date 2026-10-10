---
title: "祝福海报提示词：高考加油 / 好运连连的印章票据风贺卡（gpt-image-2）"
slug: blessing-greeting-poster-stamp-style
model: gpt-image-2
topics: [poster]
aspectRatio: "9:16"
needsRefImage: false
useCase: "输入一个祝福主题，生成上方留白、中间手写祝福语、下方是印章票据边框 + 粗颗粒大字 + 中心吉祥物的竖版祝福海报，适合高考、开学、新年、生日等节点的朋友圈和公众号配图，也能当手机壁纸。"
prompt: |
  以[高考金榜题名]为主题，生成一张有仪式感的极简扁平祝福插画，9:16 竖版。
  画面上部保留大面积留白，左上角放小号落款和淡淡的印章痕迹。
  中部用少量手写祝福语或口号作为情感转折，例如"[愿你落笔生花，圆梦今夏]"。
  下部是主信息区，像印章和票据边框的结合：线条粗细不均，带手压的毛边。区域内铺着粗糙有颗粒感的大号主题字或符号作背景，被中央的象征物部分遮挡。
  中央象征物用干净线条和平涂色块绘制，端正稳定，是祝福的视觉焦点；周围点缀小图标、简短题字和圆形印章，像手作礼物卡上的层层标记。
  配色从主题的文化符号中提取：明亮干净的背景，结构线和文字用清晰的强调色。
  情绪：明亮、干净、庄重又亲切；带细腻纸纤维质感和轻微套色错位，不要厚重做旧和脏污感。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/xiaoxiaodong01/status/2063884566247723406
  author: "小小东"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文中文说明的英文写法改写为中文提示词；主题改为变量，补充了\"手写祝福语\"的默认文字示例"
images:
  - 3038-blessing-greeting-poster-stamp-style-1.jpg
  - 3038-blessing-greeting-poster-stamp-style-2.jpg
imageCredit:
  by: "小小东"
  url: https://youmind.com/gpt-image-2-prompts?id=24619
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[高考金榜题名] 换成你的祝福主题，如"新年好运连连""考研上岸""开学快乐""生日快乐"；手写祝福语换成对应的一句话。模型会自动选象征物：高考是铅笔和向日葵，好运是锦鲤和中国结。想指定象征物可以直接写出来。

示例图两张：一张"高考加油"——红色粗颗粒大字被中央的铅笔和向日葵遮挡，四周"金榜题名""全力以赴""前程似锦"等小印章和书本、录取通知书小图标；另一张"好运连连"——红色锦鲤挂着中国结，四周铜钱、祥云和小印章，上方都是大面积留白和手写祝福语。

**常见问题**：
- 大字笔画错误：主题大字最好 2～4 个常用字。
- 小印章文字乱：周围小字是装饰，想要可读就限定"最多 4 个小印章，每个 4 个字"。
- 太像春联、过于喜庆：强调"留白、克制、手作贺卡质感"。

**适合**：高考 / 考研祝福、新年好运图、朋友圈节点海报、手机壁纸。

### 原版提示词

```text
Generate a minimalist flat illustration with a ceremonial greeting feel based on the theme of {argument name="theme" default="college entrance exam success"}. The top of the frame retains a large area of white space for breathing room, with a small-font signature and subtle seal marks in the upper left corner. The middle section uses a small amount of handwritten blessings or slogans as an emotional pivot. The lower section features a main information area resembling a combination of a printed stamp and a ticket border, with uneven line thickness and hand-pressed deckled edges. Inside this area, a large, coarse, textured thematic character or symbol is spread as a background, partially obscured by the central symbolic object. The central object is rendered with clean lines and flat color blocks, standing upright and stable as the focal point of blessing. Small icons, short inscriptions, and circular seals are arranged around it, unfolding layers of information like marks on a handmade gift note. Colors are extracted from the theme's cultural signals: high-brightness, clean backgrounds, with clear accent colors for structural lines and characters. The mood is bright, clean, solemn, and intimate, with textures of fine paper fiber and slight misregistration, avoiding heavy aging or dirt.
```

> 改编自 [小小东](https://x.com/xiaoxiaodong01/status/2063884566247723406) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
