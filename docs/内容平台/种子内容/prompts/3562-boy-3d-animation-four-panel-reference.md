---
title: "ai角色三视图提示词：3D 动画风少年四格参考图，全身正背+头部正侧（gpt-image-2）"
slug: boy-3d-animation-four-panel-reference
model: gpt-image-2
topics: [character, illustration]
aspectRatio: "16:9"
needsRefImage: false
useCase: "做绘本、动画短片或 AI 视频前，先给小主角出一张最精简的参考图：2×2 四格，上排全身正面和背面，下排头部正面和侧面，3D 动画电影质感。"
prompt: |
  生成一张 3D 动画角色的四格参考图，角色是一个[12 岁]左右的男孩：[蓬松微乱的黑色短发]，浓眉，圆圆的棕色大眼睛，表情温和好奇；穿着[米白连帽卫衣配深色牛仔外套]、黑色工装裤和高帮帆布鞋，背一只[棕色旧皮双肩包]。
  版面：2×2 四格，格与格之间用细线分开；四格里是同一个角色，发型、五官、服装和比例完全一致。
  - 左上：全身正面，自然站立，双手插在裤兜里；
  - 右上：全身背面，看得到背包和卫衣帽子；
  - 左下：头部和肩部的正面特写，直视镜头，微微带笑；
  - 右下：头部和肩部的正侧面特写，面朝左。
  背景：统一的中性灰色无缝影棚背景，脚下有柔和的接触阴影。
  光线：柔和均匀的影棚光，四格的光线方向和亮度一致。
  风格：3D 动画电影质感的 CG 卡通渲染，造型圆润，头发是成簇的雕塑感发束，皮肤和布料材质细腻，眼睛有清晰高光。
  不要文字、标注和水印，不要在同一格里出现两个角色。画幅[16:9]。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/itsshara_ai/status/2082715357182398585
  author: "@itsshara_ai"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文只有一句（9 岁男孩、恐龙睡衣、赤脚、手电筒），示例图实际是穿卫衣和牛仔外套、背皮包的少年，因此按示例图改写了年龄、发型、服装和随身物的默认值，并补充了四格各自的内容、灰色影棚背景、光线和一致性要求；年龄、发型、服装、随身物、画幅设为变量。"
images:
  - 3562-boy-3d-animation-four-panel-reference-1.jpg
imageCredit:
  by: "@itsshara_ai"
  url: https://youmind.com/gpt-image-2-prompts?id=30388
  license: CC BY 4.0
verify:
  - "原文默认值（恐龙睡衣 + 手电筒）与示例图（卫衣 + 牛仔外套 + 背包）不同，本条默认值已按示例图改写，请确认可接受"
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[12 岁] 是年龄，决定头身比；[蓬松微乱的黑色短发] 写发型和发色；[米白连帽卫衣配深色牛仔外套] 是上身穿着，[棕色旧皮双肩包] 是随身物件，这两处最能体现角色身份——换成"深蓝恐龙图案睡衣"和"红色小手电筒"就是睡前冒险的小男孩，换成"黄色雨衣"和"透明雨伞"就是雨天故事的主角。裤子和鞋子没设变量，需要时直接改那半句。

示例图是灰色影棚背景的 2×2 四格：左上是黑发少年穿卫衣、牛仔外套、工装裤的全身正面，右上是背着棕色皮包的背面，下面两格分别是他的正脸特写和朝左的侧脸特写，圆润的 3D 卡通质感，没有任何文字。

**常见问题**：
- 四格里衣服或发型有出入：加"四格是同一时刻、同一套服装，只换机位"。
- 侧脸方向不统一：明确写"侧面一律面朝左"。
- 全身像太小看不清：加"上排两格的全身像占格子高度的 80%"。

**适合**：给绘本、动画短片和 AI 视频准备角色参考，后续出图时把这张当参考图上传，能减少角色走样。风格只写通用的 3D 动画电影质感即可，不要指名具体公司或作品。

### 英文原版

```text
A 4-view character reference sheet of a {argument name="age" default="9"}-year-old boy with {argument name="hair style" default="messy dark brown hair"}, round curious eyes, wearing {argument name="pajamas" default="navy blue dinosaur-print pajamas"}, bare feet, holding a small red flashlight. 3D animated cartoon style, CGI animated
```

> 改编自 [@itsshara_ai](https://x.com/itsshara_ai/status/2082715357182398585) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
