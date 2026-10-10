---
title: "海报提示词：美术馆展览海报，名画局部大裁切 + 大留白的中英双语极简排版（即梦）"
slug: ukiyoe-exhibition-minimal-museum-poster
model: jimeng
topics: [poster, illustration]
modelLabel: Seedream 4.5
aspectRatio: "2:3"
needsRefImage: false
useCase: "给美术馆展览、艺术讲座、艺术史课程做海报或封面：把一幅公有领域名画的局部放大裁切铺满下半幅，上方留白放中英双语标题，克制、有设计感。"
prompt: |
  一张优雅、有艺术气质的美术馆展览海报，主题是[日本浮世绘木版画展]，竖版 2:3。
  - 画面：取一幅已进入公有领域的名作——[葛饰北斋《神奈川冲浪里》]——的高清局部，做大胆的创意裁切：只保留[巨浪和浪花]，从画面下方和右侧铺上来，占满下面三分之二；
  - 留白：上方三分之一是米黄色的旧纸底色，大面积留白；
  - 文字：留白处居中两行标题，第一行是优雅的衬线体外文"[Ukiyo-e Exhibition]"，第二行是书法感的中文 / 日文标题"[日本浮世绘木版画展]"，黑色；
  - 排版极简、克制，尊重原作，不加边框、不加多余装饰，保留木版画的纸纹和套色质感。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-seedream-4.5
  url: https://github.com/YouMind-OpenLab/awesome-seedream-4.5/blob/8b09e6de35de0b6f90121cb6cf916cba3d453403/README.md#no-15-japanese-ukiyo-e-museum-poster
  author: "@jaredliu_bravo"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并拆成要点；展览主题、作品、中外文标题设为变量；删去\"展示艺术史知识与设计功底\"的说明性语句；补充了\"只用已进入公有领域的作品\"的提醒和按示例图得到的版式细节"
images:
  - 3403-ukiyoe-exhibition-minimal-museum-poster-1.jpg
imageCredit:
  by: "@jaredliu_bravo"
  url: https://cms-assets.youmind.com/media/1765359780100_qk33pd_beae2d398472f2b3de739d44e5bf89f8efa9c33dfe4296325c296f7d75081a85-600x900.png
  license: CC BY 4.0
verify:
  - "示例图用的是葛饰北斋《神奈川冲浪里》（公有领域）；如换成其他画作，确认作品已进入公有领域"
  - "上线前在 即梦 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
原作者用 Seedream 4.5 生成；在即梦里选用 Seedream 系列图片模型使用。

**怎么填变量**：展览主题和两行标题换成你的内容，例如"宋代山水画特展"；作品一定选已经进入公有领域的（作者去世多年的古典作品），如"《千里江山图》局部""莫奈《睡莲》局部"；[巨浪和浪花] 写你想保留的局部，越具体越好。不想要外文标题就删掉那一行。

示例图：米黄色纸底上，深蓝色的巨浪从右下方卷起，白色浪尖像爪子一样伸向左上，左下角露出一点小船；上方居中是两行衬线体英文展览名，下面一行黑色楷体"日本浮世绘木版画展"。

**常见问题**：
- 画作被改得面目全非：加"忠实还原原作的线条和配色，只改变裁切范围"。
- 中文标题有错字：标题控制在 10 个字以内，出图后逐字核对。
- 想加展期和地点：在标题下补一行更小的字，不要超过两行，否则破坏留白。

**适合**：展览海报、艺术讲座封面、艺术史课件首页、书店活动海报。商用印刷前请自行确认所用画作的版权状态。

### 英文原版

```text
An elegant and artistic poster for a museum exhibition of Japanese Ukiyo-e woodblock prints. The design features a beautiful, high-resolution detail from a famous print, like Hokusai’s “The Great Wave,” but creatively cropped. The typography is a mix of an elegant English serif font and Japanese calligraphy. The layout is minimalist and respectful of the artwork, using a lot of negative space. This showcases knowledge of art history and sophisticated graphic design skills. –ar 2:3
```

> 改编自 [@jaredliu_bravo](https://github.com/YouMind-OpenLab/awesome-seedream-4.5/blob/8b09e6de35de0b6f90121cb6cf916cba3d453403/README.md#no-15-japanese-ukiyo-e-museum-poster) 发布、[YouMind-OpenLab/awesome-seedream-4.5](https://github.com/YouMind-OpenLab/awesome-seedream-4.5) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
