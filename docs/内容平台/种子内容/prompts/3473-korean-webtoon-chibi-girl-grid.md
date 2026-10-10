---
title: "ai头像生成提示词：韩漫风 Q 版女孩四宫格，撞色纯色底（Nano Banana）"
slug: korean-webtoon-chibi-girl-grid
model: nano-banana
topics: [portrait, illustration]
modelLabel: Nano Banana Pro
aspectRatio: "3:4"
needsRefImage: false
useCase: "想要一组风格统一的可爱插画头像时用：2×2 四格，每格一位大眼腮红的 Q 版女孩，粗黑描边、纯平涂，配青绿、明黄、宝蓝的撞色底和夸张的大圈耳环。"
prompt: |
  一张干净的四宫格拼贴插画，2×2 排列，四格里是四位各不相同的[时髦 Q 版女孩]，[韩漫风格]。
  - 画风：极简扁平矢量插画，粗而利落的黑色描边，带波普漫画感；
  - 背景：每一格是一块纯色底，分别用[青绿色、明黄色、宝蓝色]等高饱和色，四格之间留出等宽的浅色间隔；
  - 人物：大头小身的半身像，大而有光泽的深色动漫眼睛，脸颊晕着柔和的粉色腮红，小巧的嘴；发型各不相同，如整齐的侧编麻花辫、优雅的低盘发；
  - 穿搭：[高对比黑白条纹高领衫和黑色修身毛衣]，配夸张的彩色大圆圈耳环；
  - 四个人的朝向和神态各异，有侧脸、回头、斜视和抬眼，但线条粗细、五官画法和配色体系保持统一；
  - 构图对称工整，高分辨率，平面设计感；不要文字和水印。
  画幅[3:4]。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-nano-banana-pro-prompts
  url: https://x.com/Mind_Boticni/status/2072294123152044416
  author: "@Mind_Boticni"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并拆成要点；人物、画风、底色、穿搭、画幅改为变量；按示例图补充了\"半身像、四人朝向各异、格间留浅色间隔\"；删去 Midjourney 式的 --ar 参数写法，改为直接写画幅。"
images:
  - 3473-korean-webtoon-chibi-girl-grid-1.jpg
imageCredit:
  by: "@Mind_Boticni"
  url: https://youmind.com/nano-banana-pro-prompts?id=27300
  license: CC BY 4.0
verify:
  - "上线前在 Nano Banana 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[时髦 Q 版女孩] 可以换成"Q 版男孩""戴眼镜的上班族""猫耳少女"；[韩漫风格] 可换"日系杂志插画风"；三个底色换成自己喜欢的撞色组合，如"珊瑚粉、薄荷绿、奶油黄"；穿搭那一项写两三件有辨识度的单品即可。想让四格是同一个人，把"各不相同"改成"同一个女孩的四种发型和角度"。

示例图是浅蓝底上 2×2 的四张小卡：左上青绿底，黑高领、侧编麻花辫配黄色大圈耳环；右上明黄底，黑白条纹高领衫加串珠耳环；左下宝蓝底，低盘发配红黄双圈耳环；右下明黄底，条纹衫配粉橙圆片耳环。四个女孩都是大眼睛、粉腮红、嘟嘴的 Q 版半身像，黑色描边很粗，右下角有 Gemini 的小四角星标记。

**常见问题**：
- 四格长得一模一样：分别写出每格的发型和朝向。
- 画成了 3D 或带渐变：强调"纯平涂、无渐变、无阴影"。
- 想单独当头像：改成"只画一格，1:1"，再逐个生成。

**适合**：社交头像、闺蜜群头像套图、手账贴纸、小红书封面配图。

### 英文原版

```text
A clean 4-panel grid art collage featuring four distinct, {argument name="subject" default="stylish chibi girls"} in a {argument name="aesthetic" default="Korean webtoon aesthetic"}. The illustration uses a minimalist flat vector design with bold, crisp black outlines and a pop-art comic vibe. Each panel features a unique solid color backdrop, including vibrant teal, bright sun yellow, and deep royal blue. The characters have large glossy anime-style dark eyes, softly blushed pink cheeks, and trendy hairstyles such as neat side-braids and elegant low buns. They wear fashionable {argument name="clothing" default="high-contrast striped turtlenecks and sleek black sweaters"}, accessorized with oversized colorful hoop earrings. Perfect symmetry, high resolution, graphic art style. --ar 3:4
```

> 改编自 [@Mind_Boticni](https://x.com/Mind_Boticni/status/2072294123152044416) 发布、[YouMind-OpenLab/awesome-nano-banana-pro-prompts](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
