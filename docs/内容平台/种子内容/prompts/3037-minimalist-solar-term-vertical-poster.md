---
title: "节气海报提示词：竖线阵列 + 微缩叙事的极简留白海报（小暑示例）（gpt-image-2）"
slug: minimalist-solar-term-vertical-poster
model: gpt-image-2
topics: [poster]
aspectRatio: "3:4"
needsRefImage: false
useCase: "用\"三层结构\"做一张安静的极简节气 / 节日海报：上方垂落的竖线阵列、下方城市里的微缩小人叙事、大面积干净留白，适合节气推文、品牌海报和手机壁纸。"
prompt: |
  以[小暑]为主题生成一张竖版极简海报，把画面分成三层：
  上层：[竖线阵列]——从顶部垂落许多细长的浅蓝色竖线，像雨丝或光束，几根竖线末端挂着与节气相关的小物件（如用网兜挂着的西瓜、半块西瓜）。
  下层：[微缩叙事]——画面底部是清晨的城市街道，几个很小的行人、骑自行车的人，前景有一点运动模糊，远处是淡淡的高楼轮廓。
  背景：[干净的留白]——大面积明亮的浅灰白色，空气感很强。
  文字：右上角竖排宋体"小暑"，下面配几行竖排小字（城市清晨、节气说明），一个小小的节气标识。
  整体安静、清透、克制，像一张摄影与插画结合的节气海报。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/xiaoxiaodong01/status/2072585405317443591
  author: "小小东"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文只有一句分层思路，本站译为中文并按示例图补充了节气元素、文字排版和色调；三层元素改为变量"
images:
  - 3037-minimalist-solar-term-vertical-poster-1.jpg
imageCredit:
  by: "小小东"
  url: https://youmind.com/gpt-image-2-prompts?id=27359
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[小暑] 换成别的节气或节日，并把挂在竖线上的物件换掉：立秋挂"银杏叶"，冬至挂"饺子和雪花"，端午挂"粽子和艾草"。三层结构的三个变量也可以替换，比如把 [竖线阵列] 改成"层层叠叠的横向光带"，把 [微缩叙事] 改成"海边散步的小人"。

示例图是一张竖版海报：上方垂下密密的浅蓝竖线，其中几根挂着装在网兜里的西瓜和西瓜块，下方是清晨街道上的小人和骑车人、左下有模糊的电车，远处淡淡的城市天际线，右上角竖排"小暑"和小字。

**常见问题**：
- 画面变满、失去留白：强调"至少一半面积是空白"。
- 小人太大：写"人物只占画面高度的十分之一"。
- 竖排文字乱码：竖排小字控制在 3 行以内。

**适合**：节气 / 节日推文、品牌海报、手机壁纸、朋友圈配图。

### 原版提示词

```text
Divide the screen into three layers: a {argument name="composition element" default="vertical line array"} at the top, a {argument name="narrative style" default="miniature narrative"} at the bottom, and {argument name="environment" default="clear white space"} in the background.
```

> 改编自 [小小东](https://x.com/xiaoxiaodong01/status/2072585405317443591) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
