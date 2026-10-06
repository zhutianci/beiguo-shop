---
title: 节日海报提示词：巨型单字实验排版海报（中秋 / 春节 / 国庆通用）
slug: giant-type-festival-poster
model: gpt-image-2
topics: [poster]
aspectRatio: "9:16"
needsRefImage: false
useCase: 用一个占满画面的超大汉字 + 单一强调色做实验排版海报，适合节日海报、品牌节点稿和朋友圈配图。
prompt: |
  为[中秋]主题设计一张极简实验排版海报，核心概念、短句和辅助说明由你根据主题生成。
  把主题转化为一个被极度放大的文字主体："[秋]"字用厚重的粗体无衬线字形几乎填满整个画面，横向压入版面，字身像结构梁一样占据中心，部分被裁切或溢出画面，让"看字"先成为一次强烈的形式体验，再去读边缘的小字。
  背景大面积留白、冷白色，叠加极细的浅暖色构图线、基线和竖向栏线——它们像设计稿里没有隐藏的骨架，而不是装饰。
  只用一种高饱和的[朱红色]承担全部视觉重量；小字说明用灰色；不要多色，不要渐变。
  信息模块稀疏地放在网格交点和边缘：由简单几何角、圆点、短横线组成的小图标；标题短而粗；正文是窄栏浅灰小字。
  整体呈现精确、克制、实验性的排版教育感。
  字形要求：低对比、笔画粗、内白大、收笔平直、字距紧；标点和辅助符号也遵循网格节奏。
  禁止：插画背景、阴影、纸张纹理、居中卡片、圆润可爱风、商业海报光效、信息过满。
  画幅：[9:16]；可加入少量与[中秋]相关的元素提示。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/xiaoxiaodong01/status/2100526246707024323
  author: 小小东
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 英文原文译为中文；主题、主体单字、强调色和画幅改为变量；把原文"Gucci 红"等品牌色名改为通用色名
images:
  - 120-giant-type-festival-poster-1.jpg
  - 120-giant-type-festival-poster-2.jpg
imageCredit:
  by: 小小东
  url: https://youmind.com/gpt-image-2-prompts?id=34929
  license: CC BY 4.0
verify:
  - 在 gpt-image-2 上实测 3 次，记录成功率与最常见的失败形式
  - 巨型汉字笔画是否正确、有无缺笔多笔
  - 边缘小字是否出现乱码（可接受时注明）
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：[中秋] 和 [秋] 要配套，例如春节配"福 / 春"，国庆配"国"，品牌周年可以用品牌名首字。字越简单越好看，笔画多的字（如"龘"）容易出错。[朱红色] 换成你的品牌色，但只给一种。

**常见问题**：
- 字写错或笔画粘连：换笔画更少的字；或者先让 AI 只画排版骨架，主体字用字体软件自己放上去。
- 小字乱码：边缘说明文字只是"排版质感"，乱码在所难免；要正式发布就后期替换成真实文字。
- 变成普通节日海报（月亮、灯笼）：强调"禁止插画背景"，元素只用几何符号表达。

**示例图说明**：两张示例分别以"中"和"秋"为主体字，同一套提示词、不同强调色。

### 英文原版

```text
Take any futuristic theme providing core concepts, short phrases, and minor auxiliary notes, and translate the theme into an extremely enlarged text or symbol subject: The first impression must be heavy, bold sans-serif glyphs filling almost the entire frame, pressed horizontally into the layout, with the character body occupying the center like structural beams, partially cropped or overflowing, making reading first become a strong form event before reading subtitles at its edges. Keep the background largely empty with cool white space, overlaid with extremely thin, light warm-colored composition lines, baselines, and vertical column lines; these lines should look like unhidden skeletons of a design draft rather than decoration. Use only high-saturation orange-red as the primary color to carry all visual weight, gray for small explanatory text, avoiding multi-colors and gradients. Information modules are sparsely placed at grid intersections and edges: small icons composed of simple geometric angles, dots, and short dashes; titles are short and bold; body text is in narrow columns and light gray. The overall presentation should have a precise, restrained, experimental typographic educational feel. Glyph construction requires low contrast, thick strokes, large open counters, flat terminals, tight tracking; punctuation and auxiliary symbols also follow the grid rhythm. If switching to other writing systems, maintain equivalent block volume, inner/outer spatial relationships, cropping pressure, and horizontal reading momentum. Prohibit illustrative backgrounds, shadows, paper textures, centered cards, rounded cuteness, commercial poster lighting effects, and over-packed information.

——————
Theme: {argument name="theme_en" default="Joy"}
Aspect Ratio: {argument name="aspect_ratio_en" default="9:16"}
Note: Appropriate Mid-Autumn elements
Font Color: {argument name="font_color_en" default="Gucci Ancora Red"}
```

> 改编自 [小小东](https://x.com/xiaoxiaodong01/status/2100526246707024323) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
