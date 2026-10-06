---
title: seedance 提示词：产品开箱试用短视频（电商带货竖屏）
slug: seedance-product-unboxing
model: seedance
topics: [ecommerce]
modelLabel: Seedance 2.0
aspectRatio: "9:16"
needsRefImage: true
useCase: 用产品参考图生成一条"开箱—取出—试用—生活场景"的竖屏短视频，适合店铺主图视频、短视频带货素材。
prompt: |
  生成一条写实的[10]秒竖屏产品短视频，产品外观以我上传的参考图为准。
  镜头一：一双手打开一个精致的小纸盒，里面是[一支粉色唇釉]。
  镜头二：双手把产品从盒中取出，展示[银色反光盖和透明瓶身]。
  镜头三：[把产品试涂在手背上]，特写展示质地和光泽。
  镜头四：一位女性自然地使用产品的近景，动作轻柔准确，皮肤纹理真实。
  镜头五：产品立在[木质咖啡桌]上，旁边放着两杯拉花拿铁，营造温暖的生活方式广告氛围。
  整体：柔和自然光，真实阴影，浅景深，平稳的手持运镜，商业广告质感，产品细节准确，镜头之间顺滑转场。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-seedance-2-prompts
  url: https://x.com/Aiwithmaha/status/2102952087823044888
  author: "@Aiwithmaha"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 英文原文译为中文并拆成 5 个编号镜头；时长、产品、产品细节、试用动作、收尾场景改为变量；新增"产品外观以上传的参考图为准"
imageBrief: 用站长自己拍的一件普通产品照片（如护手霜、保温杯，去掉或遮挡真实品牌商标）作参考图，生成 1 条视频，并截取 3 帧（开箱、试用、收尾）作为封面图；附参考图。
images:
  - 21-seedance-product-unboxing-1.jpg
imageCredit:
  by: "@Aiwithmaha"
  url: https://x.com/Aiwithmaha/status/2102952087823044888
  license: CC BY 4.0
verify:
  - 在即梦 / 火山引擎等提供 Seedance 2.0 的平台实测 3 次，记录入口名称、可选时长和比例（以官方说明为准）
  - 参考图里的包装文字和 Logo 在视频中是否变形
  - 手部动作是否出现多指、穿模
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：[一支粉色唇釉] 写清产品种类和颜色；[银色反光盖和透明瓶身] 写最想展示的外观卖点；[把产品试涂在手背上] 按品类改，如"把杯子倒满热水""挤出一点护手霜"；镜头四不适合的品类可以删掉。

**常见失败与调整**：
- 包装文字乱掉：视频模型很难保持小字，重要的品牌信息建议后期叠加。
- 手部畸形：减少手部动作，或把镜头一、二合并成"产品已经放在桌上"。
- 产品前后不一致：参考图用白底、清晰、正面的产品照。

**适合 / 不适合**：适合做素材初稿，可配合本站"9 宫格 TVC 分镜"提示词先规划镜头。广告内容需遵守广告法和平台规则，不要用 AI 视频演示产品没有的功效。

> 改编自 [@Aiwithmaha](https://x.com/Aiwithmaha/status/2102952087823044888) 发布、[YouMind-OpenLab/awesome-seedance-2-prompts](https://github.com/YouMind-OpenLab/awesome-seedance-2-prompts) 收录的提示词，许可证 CC BY 4.0。
