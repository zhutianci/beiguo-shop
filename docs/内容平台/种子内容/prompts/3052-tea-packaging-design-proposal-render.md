---
title: "AI包装设计提示词：高山茶礼盒包装提案效果图（等高线山雾视觉）（gpt-image-2）"
slug: tea-packaging-design-proposal-render
model: gpt-image-2
topics: [ecommerce]
aspectRatio: "4:3"
needsRefImage: false
useCase: "为茶叶、咖啡、香氛等系列产品生成一张包装设计提案效果图：三款不同颜色的抽屉盒 + 小罐摆在岩层台座上，盒面是等高线和雾气组成的抽象山形，适合包装提案、电商包装展示和品牌招商资料。"
prompt: |
  为一份包装设计提案设计一组茶叶包装主视觉，概念是"[山雾把一口茶折进纸盒里的微缩地形]"。
  产品是三种不同发酵程度的高山乌龙茶系列。画面展示三个长条抽屉盒和几只小茶罐的组合，摆在一块像岩层剖面的灰白色台座上。
  盒面图形不是传统山水插画，而是由茶汤颜色、海拔等高线和层层雾气关系构成的抽象地形系统。
  构图：横版陈列摄影，前景、中景、背景层次分明；主盒正对镜头，侧面的盒子和小罐制造结构变化。背景以低对比的留白为主，适合包装提案展示。
  光线：柔和的侧向晨雾光，强调纸张纹理、局部银色烫印、封口贴纸、铝箔内袋和茶叶纹理，而不是高反差。
  色彩：按系列分为[冷雾灰绿、焙火棕灰、浅金琥珀]，整体低饱和、克制、成熟。
  材质：[特种纸、压凹等高线、局部 UV]、铝封膜、拉丝金属罐盖，以及茶叶叶脉纹理。
  文字：少量以中文为主，包括系列名（如"[雾岭乌龙]"）、产品名、一个很短的英文标识，以及角落里的海拔批次信息，文字直接融入包装正面的设计系统。
  适用于茶叶品牌包装提案、零售陈列效果图、电商包装展示和品牌招商资料。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/Mrpinecone888/status/2083095939427000725
  author: "Mr.pinecone"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文中文说明的英文写法改写为中文提示词；设计概念、色彩体系、材质细节改为变量；补充了画面中文字内容的默认示例"
images:
  - 3052-tea-packaging-design-proposal-render-1.jpg
imageCredit:
  by: "Mr.pinecone"
  url: https://youmind.com/gpt-image-2-prompts?id=30380
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：设计概念是整组包装的灵魂，换成你的产品故事，例如"[一杯咖啡里的火山与雨林]""[把江南梅雨装进香薰盒]"；系列名、三种配色和材质按产品改写。三款产品的差异（发酵程度、产地、口味）写清楚，模型会在颜色和图形上做出区分。

示例图是三只竖立的长方形茶盒排在灰白岩石台座上，盒面是灰绿、棕灰、浅金三色的雾中山形等高线，盒前各配一只同色小罐，左下角一小碟茶叶和一个铝箔小袋，左上角"雾岭乌龙 MIST RIDGE OOLONG"，右上角小字"ALT.1600M LOT 03"。

**常见问题**：
- 盒面画成了写实山水画：强调"抽象等高线和雾层，不是山水插画"。
- 盒子上的小字乱码：只保留系列名和产品名，其余用"细小的装饰性文字"代替。
- 要用于正式提案：效果图适合做方向探索，最终印刷稿仍需设计师按刀版做矢量稿。

**适合**：包装设计提案、茶叶 / 咖啡 / 香氛品牌、电商包装展示、招商资料。

### 原版提示词

```text
Design a set of tea packaging key visuals for a packaging design proposal, with the concept '{argument name="design concept" default="mountain mist folding a sip of tea into a miniature terrain inside a paper box"}'. The products are a series of high-mountain oolong teas with three different fermentation levels. The visual shows a combination of three elongated drawer boxes and small tins, placed on a grey-white pedestal resembling a rock strata cross-section. The graphics on the boxes are not traditional landscape illustrations but an abstract terrain system composed of tea soup colors, altitude contour lines, and layered mist relationships. The composition uses horizontal display photography with clear foreground, midground, and background layers; the main box faces the camera, while side boxes and tins create structural variety. The background remains mostly low-contrast white space, suitable for packaging proposal presentations. The lighting is soft, side-angled morning mist light, emphasizing paper texture, local silver foil stamping, sealing paper, foil inner bags, and tea leaf textures rather than high contrast. The color system is divided into {argument name="color scheme" default="cold mist grey-green, roasted brown-grey, and pale gold amber"} by series, but overall it remains low-saturation, restrained, and mature. Material descriptions focus on {argument name="material details" default="specialty paper fibers, embossed contour lines, spot UV, aluminum sealing film, brushed metal tin lids, and tea leaf vein patterns"}. A small amount of dominant Chinese text is needed, including the series name, product name, a very short English identifier, and altitude batch info in the corner, with the text integrated directly into the front packaging system. Applicable for tea brand packaging proposals, retail display renderings, e-commerce packaging showcases, and brand investment materials.
```

> 改编自 [Mr.pinecone](https://x.com/Mrpinecone888/status/2083095939427000725) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
