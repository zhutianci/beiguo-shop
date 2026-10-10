---
title: "信息图提示词：办公坐姿对错对比图，红叉 / 绿勾小人的极简安全宣传画（即梦）"
slug: desk-posture-right-wrong-safety-poster
model: jimeng
topics: [infographic, poster]
modelLabel: Seedream 4.5
aspectRatio: "3:4"
needsRefImage: false
useCase: "给公司培训、健康科普、工位提示牌做一张一眼能懂的\"对错对比\"宣传画：左边驼背低头的小人打红叉，右边坐直的小人打绿勾，极简图标风，文字很少。"
prompt: |
  一张面向职场的视觉安全指南，主题是[预防腰背痛的正确办公坐姿]，竖版 3:4。
  - 版式：米白色背景，顶部一条红色色条；色条下方是黑色粗体标题"[告别腰背痛：正确的办公坐姿]"，两行以内；
  - 主体：左右并排两个黑色图标风格的小人，都坐在办公椅上、面对桌子：左边的小人[弯腰驼背、头向前探]，肩背处打一个红色的叉；右边的小人[腰背挺直、头颈在一条线上]，身上打一个绿色的勾；
  - 标签：左下角红色圆角标签写"[错误坐姿]"，右下角绿色圆角标签写"[正确坐姿]"；
  - 风格：极简、清晰、不用读文字也能看懂，像安全标识一样的扁平图标，没有多余装饰和渐变；
  - 除标题和两个标签外不出现其他文字，不写具体角度和数据。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-seedream-4.5
  url: https://github.com/YouMind-OpenLab/awesome-seedream-4.5/blob/8b09e6de35de0b6f90121cb6cf916cba3d453403/README.md#no-37-workplace-posture-safety-guide
  author: "@jaredliu_bravo"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并拆成要点；主题、标题、左右标签设为变量，方便改成其他\"正确 / 错误\"对比；按示例图补充了黑色图标小人、顶部红色色条、底部红绿圆角标签等版式细节"
images:
  - 3411-desk-posture-right-wrong-safety-poster-1.jpg
imageCredit:
  by: "@jaredliu_bravo"
  url: https://cms-assets.youmind.com/media/1765359948609_2vso37_0490ff1e27881908c2f57279ed53cb0683a6246fe993c76ed401e66f57f0caac-600x800.png
  license: CC BY 4.0
verify:
  - "示例图只示意\"驼背 vs 坐直\"，不含具体角度数值；如需写入人体工学参数，请以权威指南为准"
  - "上线前在 即梦 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
原作者用 Seedream 4.5 生成；在即梦里选用 Seedream 系列图片模型使用。

**怎么填变量**：这是一个通用的"对错对比"模板。[预防腰背痛的正确办公坐姿] 是主题；标题换成你要的大字；两个小人的动作分别写错误做法和正确做法，例如"单手提重物、弯腰 / 屈膝下蹲、双手抱起"（搬重物）、"低头看手机 / 手机举到视线高度"。标签通常保持"错误 / 正确"即可。

示例图是英文版：米白底，顶部一条红色横条，黑体标题"Avoid Back Pain: Ergonomic Desk Setup"；下面两个黑色剪影小人坐在转椅上，左边的含胸低头、背上有红叉，右边的坐得笔直、胸前有绿勾；底部分别是红色标签"Incorrect Posture"和绿色标签"Correct Posture"。

**常见问题**：
- 两个小人看起来差不多：把差异写夸张一些，如"左边的背弯成 C 形，头明显前伸"。
- 模型自己加了一堆说明小字：强调"除标题和两个标签外没有任何文字"。
- 想加 3 条要点：在两个小人下方加"三行图标 + 短语"，每条不超过 8 个字，并自行核对内容。

**适合**：企业培训课件、工位 / 茶水间提示牌、健康科普配图、班会宣传画。图只做示意，不能代替专业的健康或康复指导。

### 英文原版

```text
A visual safety guide for a workplace, illustrating the correct posture for sitting at a desk to avoid back pain. The infographic should show two figures: one in an incorrect, slouched posture with red X-marks, and one in a correct, ergonomic posture with green check-marks. The style should be simple, clear, and universally understandable, suitable for corporate training materials. –ar 3:4
```

> 改编自 [@jaredliu_bravo](https://github.com/YouMind-OpenLab/awesome-seedream-4.5/blob/8b09e6de35de0b6f90121cb6cf916cba3d453403/README.md#no-37-workplace-posture-safety-guide) 发布、[YouMind-OpenLab/awesome-seedream-4.5](https://github.com/YouMind-OpenLab/awesome-seedream-4.5) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
