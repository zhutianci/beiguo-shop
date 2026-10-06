---
title: nano banana 图标生成提示词：同一主题的 3D 图标套装（3×3 九宫格）
slug: icon-set-3d-grid
model: nano-banana
topics: [illustration, ppt, logo]
needsRefImage: false
aspectRatio: "1:1"
useCase: 做 PPT、App 原型、活动页、小程序时需要一整套风格统一的图标，一句话生成 9 个同主题的彩色 3D 图标，切开就能用。
prompt: |
  创建一组代表"[香蕉]"主题的图标，9 个图标属于同一个系列、风格完全统一。
  排成 3×3 网格，每个图标居中在自己的格子里，大小一致、间距均匀。
  纯白背景，图标采用色彩丰富、有触感的 3D 风格（圆润、柔和的光影，像软陶或塑料玩具）。
  不要任何文字。
negativePrompt: null
source:
  repo: jau123/nanobanana-trending-prompts
  url: https://x.com/NanoBanana/status/2009660363227152653
  author: "@NanoBanana"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 译成中文；补充"大小一致、间距均匀"和 3D 质感的具体描述；原帖给出的主题示例移到正文
images:
  - 186-icon-set-3d-grid-1.jpg
imageCredit:
  by: "@NanoBanana"
  url: https://x.com/NanoBanana/status/2009660363227152653
  license: CC BY 4.0
verify:
  - 用"办公软件功能"这类抽象主题实测，看 9 个图标是否各不相同
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么用**：只改 [香蕉] 这一个变量。原帖作者给的主题示例有：不同情绪的小狗、香蕉、一月份、同一只猫的不同情绪。实用一点的主题比如"[咖啡店菜单]""[健身动作]""[理财工具]""[春节年货]"。示例图是"香蕉"主题的 9 个图标。

**进阶用法**：
- 想要 2×2 大图标：把网格改成"2×2，图标之间不要分隔线"。
- 想要指定每一个图标：在主题后面列清单，如"依次为：咖啡杯、蛋糕、Wi-Fi、收银台……"。
- 想要扁平风：把"3D 风格"改成"扁平线性图标，2px 线宽，单色 #1E6FFF"。

**常见问题**：图标偶尔会重复或混进文字，追问"把第 6 个换成 XX，并去掉所有文字"即可。切图可以在任何图片编辑器里按九宫格裁切。

### 英文原版

```
Create a collection of icons representing [a theme], they belong together as a single theme. Put them in a 3x3 grid. The background is white. Make the icons in a colorful and tactile 3D style. No text.

- dogs with different emotions
- bananas
- January
- the same cat in different emotions
```

> 改编自 [@NanoBanana](https://x.com/NanoBanana/status/2009660363227152653) 发布、[jau123/nanobanana-trending-prompts](https://github.com/jau123/nanobanana-trending-prompts) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)。
