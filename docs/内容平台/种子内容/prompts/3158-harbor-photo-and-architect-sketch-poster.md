---
title: "旅行海报提示词：上半港口暮色实拍、下半建筑师淡彩速写 + 杂志排版（gpt-image-2）"
slug: harbor-photo-and-architect-sketch-poster
model: gpt-image-2
topics: [illustration, poster]
aspectRatio: "3:4"
needsRefImage: false
useCase: "生成一张高级旅行 × 建筑速写海报：上半是蓝调时刻的海港小镇照片，下半是同一场景的建筑师钢笔淡彩透视速写，配衬线大标题和多处小号排版文字，适合旅行海报、建筑 / 手绘作品集和装饰画。"
prompt: |
  生成一张精致的旅行与建筑海报：把写实的海港照片和同一场景的建筑师风格概念速写结合在一起。
  画布：竖版 3:4，优雅的编辑排版，上下恰好两段：上半是满版的暮色海港照片；下半是米白纸张的海报区，放排版文字和一幅手绘建筑透视速写。
  上半照片：[日本]一个蓝调时刻的安静海港。平静的深蓝海水，远处山峦剪影，右侧山坡上一座海边小村，温暖的黄色路灯和屋灯在水面拉出长长的倒影。恰好 4 条可见的船：中前景 1 条主要的白色渔船、右前景 1 条小船、右侧码头边 1 条深色的船、中右港堤旁 1 条小船。左边一条防波堤，上面一盏发光的航标灯；海湾对面有远处的小镇灯光，层叠的蓝色山峦，零散的暮色云，柔和的粉橙色地平线渐变成蓝色。
  下半海报：暖象牙色纸张带细颗粒。左上放大号优雅衬线标题"[Harbor at Twilight]"，下面两行小号宽字距大写副标题"A QUIET EDGE""A BRIGHTER TOMORROW"。右上放几行极小的竖叠大写字："PLACE""PEOPLE""LANDSCAPE""A BETTER DAILY LIFE"。左下三行小号大写字："COASTAL VILLAGE""STUDY SKETCH""[JAPAN]"。右下一行随性的手写落款"[Same Sea]"和"A Kinder Tomorrow"。
  建筑速写：下半中央是同一海港场景的精致手绘透视图：细石墨构造线、淡淡的透视辅助线、竖向尺寸标记、墨线轮廓、松弛的水彩淡彩、浅蓝山峦、柔灰屋顶、低调绿树，灯和倒影用暖黄色点出。恰好 4 条速写的船与照片对应，加上码头、村屋、山坡树木、山和航标灯，全部简化成建筑师的概念草图。
  视觉风格：高端日本海岸旅行海报，安静诗意，上方写实摄影、下方通透的建筑水彩速写；精致的字体、大量留白、细线、柔和光线、电影感暮色蓝和温暖金色倒影，不杂乱。
  限制：上下两半在视觉上对齐，速写要明显对应照片；不要额外面板、多余的船、Logo、二维码、边框和水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/sahilvermaai/status/2096857025212739616
  author: "Sahil Verma"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；地点、标题、国家标签、手写落款改为变量"
images:
  - 3158-harbor-photo-and-architect-sketch-poster-1.jpg
imageCredit:
  by: "Sahil Verma"
  url: https://youmind.com/gpt-image-2-prompts?id=33717
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[日本] 和 [JAPAN] 换成你的地点（"[厦门鼓浪屿]／[XIAMEN]""[意大利五渔村]／[ITALY]"），照片段落里的山、村、船按真实场景改；标题和手写落款换成你的文案。也可以上传自己拍的海港 / 古镇照片，写"上半使用我上传的照片"。

示例图上半是蓝调时刻的日本海港：平静的深蓝海面、右侧亮着暖灯的小镇和长长的倒影、几条白色渔船、远处层叠的山；下半象牙色纸上是同一港口的钢笔淡彩透视速写，左上衬线大字"Harbor at Twilight"，四角是小号排版文字，右下手写"Same Sea / A Kinder Tomorrow"。

**常见问题**：
- 小号排版字太多容易错：可以只保留主标题和一行副标题。
- 速写不像建筑师手稿：强调"可见的透视辅助线和尺寸标记"。
- 和 35319 的区别：35319 下半是纯水彩画；这条下半是"建筑师速写 + 杂志排版"，信息感更强。

**适合**：旅行海报、建筑 / 手绘作品集、装饰画、旅行账号封面。

### 英文原版

```text
Goal: Create a refined travel-and-architecture poster that combines a realistic coastal harbor photograph with a matching architect-style concept sketch of the same scene.

Canvas: Vertical 3:4 poster, elegant editorial layout. Split the composition into exactly 2 stacked sections: the top half is a full-bleed twilight harbor photograph; the bottom half is an off-white paper poster area containing typography and a hand-drawn architectural perspective sketch.

Top photographic section: Show a quiet harbor at blue hour in {argument name="place" default="Japan"}. The scene includes calm deep-blue water, mountain silhouettes in the background, a small coastal village on the right hillside, warm yellow streetlights and house lights, and long shimmering reflections on the water. Include exactly 4 visible boats: 1 main white fishing boat near the center foreground, 1 smaller boat near the right foreground, 1 darker boat moored near the right pier, and 1 small boat near the center-right harbor wall. Add a breakwater pier on the left with a single glowing beacon, distant town lights across the bay, layered blue mountains, scattered twilight clouds, and a soft pink-orange horizon fading into blue.

Bottom poster section: Use warm ivory paper with subtle grain. In the upper-left, set large elegant serif title text: “{argument name="headline text" default="Harbor at Twilight"}”. Beneath it, add small widely spaced uppercase subtitle text in two lines: “A QUIET EDGE” and “A BRIGHTER TOMORROW”. In the upper-right, add tiny stacked uppercase words: “PLACE”, “PEOPLE”, “LANDSCAPE”, “A BETTER DAILY LIFE”. In the lower-left, add small uppercase text in three lines: “COASTAL VILLAGE”, “STUDY SKETCH”, “{argument name="country label" default="JAPAN"}”. In the lower-right, add loose handwritten signature-style text: “{argument name="handwritten note" default="Same Sea / A Kinder Tomorrow"}”.

Architectural sketch: Center the bottom half with a delicate hand-rendered perspective drawing of the same harbor scene from the photo. Use thin graphite construction lines, faint perspective guides, vertical measurement marks, ink outlines, loose watercolor washes, pale blue mountains, soft gray roofs, muted green trees, and warm yellow highlights for lamps and reflections. Include exactly 4 sketched boats matching the top image: the main white fishing boat in the center foreground, one small skiff to its left, one small boat near the center-right, and one larger boat on the far right. Include the pier, village houses, hillside trees, mountains, and beacon, all simplified as an architect’s concept drawing.

Visual style: Premium Japanese coastal travel poster, calm and poetic, realistic photography above and airy architectural watercolor sketch below. Use refined typography, generous negative space, thin rules, soft lighting, cinematic twilight blues, warm golden reflections, and no clutter.

Constraints: Keep the top and bottom halves visually aligned so the sketch clearly corresponds to the photograph. Do not add extra panels, extra boats, logos, QR codes, borders, or watermarks.
```

> 改编自 [Sahil Verma](https://x.com/sahilvermaai/status/2096857025212739616) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
