---
title: "信息图提示词：博物馆级天文展板，左线稿图解、中分层剖面、右写实渲染的黑洞（Nano Banana）"
slug: museum-board-black-hole-blueprint-to-render
model: nano-banana
topics: [poster, infographic, ppt]
modelLabel: Nano Banana Pro
aspectRatio: "2:3"
needsRefImage: false
useCase: "做科普展板、课件封面或科学主题海报：一张图里从左到右由\"档案蓝图式的黑白线稿\"过渡到\"分层剖面\"再到\"写实的宇宙渲染\"，底部一行标题，像天文馆里的展陈面板。"
prompt: |
  生成一块天文学专家水准的博物馆级展板，主题是[超大质量黑洞]——事件视界、发光的吸积盘和相对论性喷流。竖版 2:3。
  - 左栏：黑白的二维科学线稿（[剖面图、轨道路径图、光谱分析图]），带精细的引线标注、比例尺和技术标签，像档案馆里的蓝图；线稿上的小字只需要有标注的样子。
  - 中栏：自上而下排列的爆炸式轴测图或分层示意，逐层展示[奇点核心、等离子体环和时空弯曲层]，每一层都带细网格线。
  - 右栏：照片级写实的三维渲染——位于星系中心的黑洞，周围是旋转的恒星和被扭曲的光，橙色与蓝色的等离子体辉光，拖着长长的星尘尾迹。
  - 视觉过渡：从左到右，由档案蓝图的色调（石墨灰线稿、精确的轨道线）逐渐过渡到宇宙的氛围色（深黑、炽橙、电光蓝）。
  - 版式：干净的网格布局，栏与栏之间有细细的边框；底部通栏一条标题栏，写一行全大写标题（示例，可整行替换）："SAGITTARIUS A* — COSMIC ABYSS — 4 MILLION SOLAR MASSES"。
  - 质感：超精细、电影级的真实感，天文馆展陈的品质，高分辨率；不要水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-nano-banana-pro-prompts
  url: https://x.com/seven_cuz/status/2004032268676038732
  author: "@seven_cuz"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并分条；天体主题、左栏与中栏的图解内容改为变量，底部标题保留原文作示例并注明可替换；说明中补充了\"线稿里的小字只是示意、不可当作数据\"的提醒"
images:
  - 3513-museum-board-black-hole-blueprint-to-render-1.jpg
imageCredit:
  by: "@seven_cuz"
  url: https://youmind.com/nano-banana-pro-prompts?id=3445
  license: CC BY 4.0
verify:
  - "示例图底部标题称银河系中心黑洞约 400 万倍太阳质量，与公开资料的量级一致；左侧线稿中的小字和刻度为示意性乱码，不构成数据"
  - "上线前在 Nano Banana 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[超大质量黑洞] 可以换成"土星及其光环""脉冲星""猎户座大星云"等天体，后面两栏的图解内容相应改成该天体的结构（如土星写"内部分层、环缝、卫星轨道"）；底部标题不是方括号变量，直接整行改写，建议"名称 — 一句别称 — 一个关键数字"的三段式，中文英文都可以，其中的数字请先查证。

示例图是一块竖版展板：左侧一列是五张黑底白线的图解（圆形坐标网、曲线图、轨道俯视图等），中间一列是五个由上到下排列的发光吸积盘分层模型，右侧是一条宽幅的写实画面，橙蓝色的星流绕着黑洞旋转；底部一行英文标题写着银河系中心黑洞的名字和"400 万倍太阳质量"。

**常见问题**：
- 左栏小字是乱码：这是常态，展示时可以当作装饰；要可读就写"左栏只保留图形和 3 个大号标签"。
- 三栏比例失衡：写"左栏 30%、中栏 30%、右栏 40%"。
- 主题换了但标题数字没换：标题里的数字模型不会替你核对，务必自己查资料。

**适合**：天文科普展板、课件和讲座封面、科学社团海报的版式参考；图中的图解只是视觉示意，不能当作教学数据使用。

### 英文原版

```text
An expert astronomer's museum-grade presentation board for a supermassive black hole — event horizon, glowing accretion disk, relativistic jets. Left: black-and-white 2D scientific diagrams (cross-section, orbital paths, spectral analysis) with precise annotations, scale bars, and technical labels. Center: exploded axonometric or layered diagram revealing singularity core, plasma torus, and spacetime curvature layers. Right: photorealistic 3D render of the black hole in the galactic center with swirling stars and distorted light, vibrant orange and blue plasma glow, stellar debris trails. Visual style transitions from archival blueprint tones (graphite schematics, orbital precision) to cosmic atmospheric palette (deep blacks, fiery oranges, electric blues). Clean grid layout with subtle borders, ultra-detailed cinematic realism, NASA or Hubble exhibition quality, high resolution. Title block at bottom: 'SAGITTARIUS A* — COSMIC ABYSS — 4 MILLION SOLAR MASSES'.
```

> 改编自 [@seven_cuz](https://x.com/seven_cuz/status/2004032268676038732) 发布、[YouMind-OpenLab/awesome-nano-banana-pro-prompts](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
