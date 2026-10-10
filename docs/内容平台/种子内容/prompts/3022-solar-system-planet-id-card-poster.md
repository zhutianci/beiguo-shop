---
title: "太阳系科普海报提示词：八大行星\"身份证\"数据信息图（gpt-image-2）"
slug: solar-system-planet-id-card-poster
model: gpt-image-2
topics: [infographic, poster]
aspectRatio: "9:16"
needsRefImage: false
useCase: "生成一张深蓝星空背景的竖版太阳系科普海报，每颗行星旁边配一张\"身份证\"数据卡（直径、自转周期、卫星数），冥王星在角落带着委屈表情吐槽\"被降级\"，适合儿童科普和天文课件。"
prompt: |
  生成一张"[太阳系行星指南]"竖版科普信息图海报，主体是太阳系的侧视图：左侧边缘露出半个发光的太阳，八大行星按离太阳由近到远自上而下排列，大小比例有区别，土星带光环。
  每颗行星旁边配一张小小的"身份证"数据卡，写着中文名、英文名和[直径、自转周期、卫星数量]三项数据，配简洁的图标。
  在画面边缘放一颗小小的冥王星，旁边一行小字"前第九大行星，2006 年被降级"，配一个委屈的小表情。
  背景是深蓝色星空，点缀星点和淡淡的星云；数据卡用半透明深色底、金色和白色文字，整体是清晰的图形化数据设计，层级分明、文字清楚。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/TOMRICH1619/status/2047317712205222347
  author: "TOM-RICKY"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文为中文短句的英文写法，本站改写为中文并展开版式细节；标题与数据项改为变量"
images:
  - 3022-solar-system-planet-id-card-poster-1.jpg
imageCredit:
  by: "TOM-RICKY"
  url: https://youmind.com/gpt-image-2-prompts?id=15193
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[太阳系行星指南] 是标题，可以改成"八大行星档案""给孩子的太阳系"；[直径、自转周期、卫星数量] 可以换成"公转周期、表面温度、与太阳距离"等你想展示的数据。想做成儿童版，把风格改成"可爱卡通行星，每颗都有表情"。

示例图是深蓝星空竖版海报，顶部黄色大字"太阳系行星指南"，太阳在左侧边缘，水星到海王星自上而下排列，每颗旁边一张深色数据卡，底部角落是冥王星和一张便签式的吐槽小字。

**常见问题**：
- 数据错误：示例里的数字由模型生成，用于教学前请逐项核对（可以在提示词里直接写出每颗行星的正确数据，让它照抄）。
- 行星顺序乱：在提示词里写明"水星、金星、地球、火星、木星、土星、天王星、海王星"。
- 卡片文字太小：竖版 9:16 放 8 张卡片已经很满，可以只保留 2 项数据。

**适合**：小学科学课件、儿童科普读物、天文主题海报、亲子科普账号配图。

### 原版提示词

```text
"Solar System Planet Guide" vertical infographic poster, featuring a side view of the solar system as the main subject, with an "ID card" next to each planet including diameter, rotation period, and number of moons. Pluto is marked on the edge with small text: "Former ninth planet, demoted in 2006" with a sad face. Deep blue starry sky background, graphical data design.
```

> 改编自 [TOM-RICKY](https://x.com/TOMRICH1619/status/2047317712205222347) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
