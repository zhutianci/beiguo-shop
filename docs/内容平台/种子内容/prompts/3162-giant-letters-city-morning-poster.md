---
title: "早安海报提示词：超大城市缩写字母 + 地标实景的撞色早安海报（北京 / 上海 / 广州）（gpt-image-2）"
slug: giant-letters-city-morning-poster
model: gpt-image-2
topics: [poster]
aspectRatio: "4:5"
needsRefImage: false
useCase: "生成一张平面海报秩序感 + 写实地标的城市早安图：上半大面积高亮纯色，下半低饱和纸色，两个超大的城市缩写字母横跨分界线，中间放写实的城市地标，左侧粗体\"城市名 GOOD MORNING\"，适合城市号、品牌城市限定海报和朋友圈日签。"
prompt: |
  主题：[早安问候] + [北京]
  生成一张兼具平面海报秩序和写实焦点图像的设计：
  先建立开阔的留白——画面上部是一大片鲜艳高亮的纯色，下部是几乎等高的低饱和浅色纸面，形成一条干净清晰的水平色彩分界线。
  把主题的核心形态转译成两个超大、低细节、厚重圆润的浅色字母（如城市拼音缩写"BJ"），横跨分界线并出血到画面边缘，作为视觉骨架而不是装饰。
  把主体压缩成一个中小尺寸的具体焦点（如城市地标建筑），放在分界线附近，部分遮挡巨型字母，形成清晰的前后层次。焦点物用自然摄影或高质感细节表现，保留真实表面、柔和的顶侧光和落地阴影。
  在左侧分界线附近放两行与主题相关的短标题，用粗体、紧凑的几何无衬线大写字，黑色左对齐，形成强锚点（如"北京 / GOOD MORNING"），下面一行小字标语。
  在字母上沿加几个极小、宽字距的信息标签（编号、天气、日期），增加设计节奏。
  整体像印在细纤维哑光纸上的干净胶印海报，避免浓重做旧。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/xiaoxiaodong01/status/2086617422312968279
  author: "小小东"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文中文说明的英文写法改写为中文；主题、城市改为变量，补充默认标语示例"
images:
  - 3162-giant-letters-city-morning-poster-1.jpg
  - 3162-giant-letters-city-morning-poster-2.jpg
  - 3162-giant-letters-city-morning-poster-3.jpg
imageCredit:
  by: "小小东"
  url: https://youmind.com/gpt-image-2-prompts?id=30984
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[北京] 换成任何城市，模型会自动选城市缩写字母、地标和主色：示例里北京是红色 + 天坛，上海是蓝色 + 东方明珠，广州是橙色 + 广州塔。[早安问候] 也可以换成"周末快乐""晚安"等主题。想指定颜色，就加一句"上部纯色用 XX 色"。

示例图三张：北京（上半大红色、两个奶白色超大字母"BJ"，中间写实的天坛祈年殿和远处高楼，左侧黑色粗体"北京 GOOD MORNING"）、上海（蓝色"SH"配东方明珠和陆家嘴）、广州（橙色"GZ"配广州塔），顶部都有一排极小的信息标签。

**常见问题**：
- 字母太花哨：保留"低细节、厚重圆润、浅色"。
- 地标太大压住字母：写"地标只占画面宽度的一半，部分遮挡字母"。
- 天气日期小字是编的：发布前替换成真实信息，或删掉信息标签。

**适合**：城市号日签、品牌城市限定海报、朋友圈早安图、旅行账号封面。

### 原版提示词

```text
Generate a design for {argument name="subject" default="Good Morning"} featuring flat poster order and realistic focal imagery: first, establish open white space with a large area of vivid, high-brightness color at the top, followed by a nearly equal, low-saturation light-colored paper area at the bottom to form a clean, clear horizontal color boundary. Translate the theme's core form into two sets of oversized, low-detail, heavy, and rounded light-colored character graphics that cross the boundary and bleed to the edges, serving as visual skeletons rather than decoration. Compress the subject into a small-to-medium-scale concrete focal point placed near the boundary, partially obscuring the giant graphics to create clear front-to-back layering. The focal object should be rendered with natural photography or high-texture detail, retaining realistic surfaces, soft top-side lighting, and grounded shadows. Place two lines of theme-related short titles near the left boundary using bold, compact, geometric sans-serif uppercase characters, left-aligned in black to form a strong anchor. Add micro-sized, wide-spaced metadata tags on the upper edges of the graphics for design rhythm. The overall look should feel like clean offset printing on matte paper with fine fibers. Avoid heavy aging, yellowing, or modern gradients. 

Theme: {argument name="quote" default="Good Morning + Greeting"} + {argument name="city" default="Beijing"}
```

> 改编自 [小小东](https://x.com/xiaoxiaodong01/status/2086617422312968279) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
