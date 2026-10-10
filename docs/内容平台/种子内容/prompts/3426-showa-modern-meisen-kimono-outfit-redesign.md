---
title: "ai穿搭提示词：给角色换一身昭和摩登和洋混搭，铭仙和服 + 贝雷帽 + 皮包的复古街景（gpt-image-2）"
slug: showa-modern-meisen-kimono-outfit-redesign
model: gpt-image-2
topics: [fashion, character, illustration]
aspectRatio: "4:5"
needsRefImage: true
useCase: "上传一张自己的原创角色图，让模型保留角色的脸、发型和气质，只换一套\"昭和初期摩登\"的和洋混搭服装，并放到有路面电车和咖啡馆的复古街角里，适合做角色换装图、同人设定和服装灵感。"
prompt: |
  以上传的图片作为角色参考，画一张全新的插画：保持角色本人不变，换上一身[昭和摩登的和洋混搭]服装。画幅 4:5。
  - 保持不变：五官、发型、发色、瞳色和眼型、年龄感、体型、气质和标志性的小元素，不能画成另一个人；
  - 不要沿用：原图的服装、姿势、构图、镜头角度、手的位置、视线方向和背景——参考图只用来确认"她 / 他是谁"；
  - 服装：以昭和初期都市里外出穿的轻便铭仙和服为基础，纹样用[几何纹、箭羽纹、条纹和抽象花卉]大胆拼配，再加一点斜向渐变和装饰艺术元素，带一点先染絣织物特有的轻微晕开和错位；配色明快又复古：藏青、绯红、灰紫、奶油色、芥末黄，加一点蓝绿做点缀；是日常的时髦外出服，而不是过分华丽的礼服；
  - 配饰：西式帽子（如贝雷帽）、短外褂或披肩、手套、皮质手提包、短靴或浅口鞋，和服与洋装自然融合；把角色的标志性图案用在带扣、帽饰、刺绣和包的五金上；
  - 背景：[老式咖啡馆门前的街角]，昭和初期的街景，有路面电车驶过，暖色的街灯、复古招牌、湿润的石板路；
  - 画风：精致的动漫插画，暖色灯光，细节丰富。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/MioWorkshop/status/2063516639476519029
  author: "@MioWorkshop"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "日文思路的英文长提示词，改写为分条的中文；服装主题、纹样、背景设为变量；合并了多处重复的\"保持角色身份、不沿用原图构图\"要求；保留铭仙纹样、配色、配饰的具体描述"
images:
  - 3426-showa-modern-meisen-kimono-outfit-redesign-1.jpg
  - 3426-showa-modern-meisen-kimono-outfit-redesign-2.jpg
imageCredit:
  by: "@MioWorkshop"
  url: https://youmind.com/gpt-image-2-prompts?id=24630
  license: CC BY 4.0
verify:
  - "需要上传角色参考图；只用自己的原创角色或已获授权的形象"
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：上传一张角色的清晰立绘或半身图；[昭和摩登的和洋混搭] 是整套造型的主题，想换风格可以改成"民国学生装混搭""90 年代港风"，但下面"服装"那一段也要对应改写；纹样变量里挑你喜欢的两三种即可；背景可换成"怀旧咖啡馆内部""挂满灯笼的商店街"。

示例图第一张：银灰色短发的角色戴着黑色贝雷帽，穿紫、藏青、奶油色几何纹拼接的和服，外披绣花的深紫披肩，手戴蕾丝手套、提着黑色皮包，站在亮着暖灯的咖啡馆橱窗前，身后是一辆路面电车。第二张：黑色长发的角色同样的和洋混搭思路，换成了菱形和条纹拼接的纹样、黑色短外套和高跟短靴，背景是雨后的电车街道。

**常见问题**：
- 角色脸变了：把"保持不变"那一条放到最前面，并上传更清晰的正脸图。
- 直接照搬了原图的衣服：保留"不要沿用"那一条。
- 纹样太花看不清层次：纹样只留"条纹 + 箭羽纹"，配色减到三种。

**适合**：原创角色换装图、服装设计灵感、同人企划、和风主题活动主视觉。

### 日文原版

```text
Use the attached image as a character reference to draw a new illustration of {argument name="fashion theme" default="Showa-era modern Japanese-Western fusion fashion"} while maintaining character identity. Maintain the facial features, hairstyle, hair color, eye color and shape, age, body type, atmosphere, charm, personality impression, motifs, racial characteristics, and symbolic details of the reference image without making it a different person. Do not reproduce the original costume; instead, carry over only the character's essence and dress them in a completely new outfit. Treat the reference image as a resource for identity and do not carry over the costume, pose, composition, camera angle, body orientation, hand position, gaze direction, background, or layout of the original image. The outfit should be a Showa-era modern Japanese-Western fusion style inspired by Meisen kimono. Use light, Meisen-style kimono typical of urban fashion and outdoor wear in the early Showa era as a base. Incorporate {argument name="garment patterns" default="geometric patterns, arrow patterns, stripes, diagonal transitions, abstract floral patterns, and Art Deco elements"} to create a bold and modern pattern composition characteristic of Meisen. Subtly add slight blurring, faint misalignment, and soft outlines typical of yarn-dyed kasuri to evoke the unique flavor of Meisen. Use bright and retro color schemes, including navy, crimson, muted purple, cream, mustard, and blue-green as accent colors. Aim for the friendliness and elegance of everyday stylish wear rather than overly luxurious formal attire. Combine with Western-style hats, short haori coats, shawls, gloves, leather bags, and boots or pumps for an urban and elegant style where Japanese and Western clothing blend naturally. Reflect the character's symbolic motifs in obi clips, hat decorations, embroidery, bag hardware, accessories, and small items as needed. The background should be {argument name="background setting" default="an early Showa-era street, in front of a classic cafe, a street corner with a tram, a shopping street with retro signs, or inside a nostalgic coffee shop"}. Incorporate warm lights, old street lamps, cobblestones, classic buildings, wooden furniture, and stained glass to create a nostalgic and elegant atmosphere typical of Showa modernism. Keep the background modest, ensuring the character is always the protagonist. Create natural changes in pose, composition, camera angle, and expression to establish it as a single illustration with storytelling and atmosphere rather than a static character portrait. Align the final output with the art style, coloring, line texture, and color usage of the reference image to maintain the original atmosphere.
```

> 改编自 [@MioWorkshop](https://x.com/MioWorkshop/status/2063516639476519029) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
