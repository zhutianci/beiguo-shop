---
title: "饮品海报提示词：复古放射色块 + 充气胖字标题的夏日饮品海报（gpt-image-2）"
slug: retro-inflated-type-drink-poster
model: gpt-image-2
topics: [poster, food]
aspectRatio: "3:4"
needsRefImage: false
useCase: "生成明亮活泼的复古商业饮品海报：超粗圆润、像充气招牌一样的中文大标题，下方写实的饮品摄影，背景是放射状色块，适合奶茶店、咖啡店、汽水饮料的新品海报。"
prompt: |
  围绕[生椰冰咖啡]主题，生成一张明亮欢快的复古商业视觉海报，3:4 竖版。
  视觉焦点是超大、厚实、圆润的主标题"[椰咖一下]"，像柔软的充气招牌。
  主饮品出现在画面中下部，写实产品摄影质感：锐利的高光、冷凝水珠和自然阴影，与背景和文字前后交叠，形成纵深。
  背景使用锐利的放射状色块，带来速度感和欢乐感。
  文字系统分三层：巨大的主标题、窄长的复古大写英文副标题"[COCONUT ICED COFFEE]"，以及角落里的小细节（价格角标、小标语、口味说明）。
  颜色鲜艳干净，从饮品口味和品牌情绪中提取；整体清新、俏皮、有活力，避免暗沉浑浊的复古滤镜。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/xiaoxiaodong01/status/2064000945458217220
  author: "小小东"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文中文说明的英文写法改写为中文；饮品、主标题、副标题改为变量"
images:
  - 3081-retro-inflated-type-drink-poster-1.jpg
  - 3081-retro-inflated-type-drink-poster-2.jpg
imageCredit:
  by: "小小东"
  url: https://youmind.com/gpt-image-2-prompts?id=24753
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[生椰冰咖啡]、[椰咖一下]、[COCONUT ICED COFFEE] 三处一起换，例如"杨梅气泡水 / 杨梅冒泡 / BERRY SODA""冷萃乌龙 / 乌龙醒脑局 / COLD BREW OLONG"。标题用 4 个字左右的谐音梗或口语最有效果；颜色会自动跟着口味变（杨梅是玫红，乌龙是橙色）。

示例图两张：椰咖一下（绿色放射背景、奶白色胖字标题、透明杯里的冰咖啡叠在椰汁上，旁边半个椰子，右下角"新品尝鲜 ¥19"爆炸贴）和杨梅冒泡（玫红放射背景、粉白胖字、挂满水珠的杨梅气泡水罐和一堆杨梅）。

**常见问题**：
- 标题不够"胖"：写"字形像充气气球，边缘圆润，带轻微立体感"。
- 价格角标是模型编的：正式使用前改成真实价格，或者删掉角标。
- 背景太乱：放射色块限定为两种颜色交替。

**适合**：奶茶 / 咖啡 / 汽水新品海报、外卖活动图、门店灯箱、社媒上新图。

### 原版提示词

```text
Generate a bright and cheerful retro commercial visual around the theme of {argument name="beverage" default="lychee iced tea"}. The visual focus is established by an oversized, thick, rounded typography for the main title "{argument name="main_title" default="Lychee Opening"}", resembling soft, inflated signage. The main beverage appears in the lower center with a realistic product photography texture, featuring sharp highlights, condensation, and natural shadows, overlapping the background and text to create depth. The background uses sharp radiating blocks for a sense of speed and joy. The text system has three layers: the large main logo, a narrow retro uppercase subtitle "{argument name="subtitle" default="LYCHEE ICED TEA"}", and small corner details. Colors are vibrant and clean, extracted from the beverage's flavor and brand mood. The overall tone is fresh, playful, and energetic, avoiding dark or muddy vintage filters.
```

> 改编自 [小小东](https://x.com/xiaoxiaodong01/status/2064000945458217220) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
