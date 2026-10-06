---
title: nano banana 手办提示词：插画 / 照片一键变角色手办（带包装盒）
slug: illustration-to-figure
model: nano-banana
topics: [figurine]
needsRefImage: true
useCase: 把自己画的角色、宠物或本人照片做成"摆在桌上的手办 + 包装盒 + 建模屏幕"效果图，nano banana 最早一批出圈的玩法。
prompt: |
  把这张图里的角色做成一个[1/7 比例]的角色手办。手办后面放一个印有该角色图像的包装盒，盒子旁边有一台电脑，屏幕上显示这个手办的 Blender 建模过程。包装盒前面是一个圆形透明塑料底座，手办站在底座上。场景设在室内的[书桌]上，光线自然真实。
negativePrompt: null
source:
  repo: PicoTrex/Awesome-Nano-Banana-images
  url: https://x.com/ZHO_ZHO_ZHO/status/1958539464994959715
  author: "@ZHO_ZHO_ZHO"
  license: Apache-2.0
  licenseUrl: https://www.apache.org/licenses/LICENSE-2.0
  changes: 在仓库中文版提示词基础上，新增手办比例变量；把原文"如果可能的话，将场景设置在室内"改为明确的室内书桌场景（书桌为变量），并补充"光线自然真实"
imageBrief: 用站长自己画的或用 AI 生成的原创角色图（不得使用已有动漫 / 游戏角色）作输入，另用一张宠物照片作输入，各生成 1 张；附输入图对比。
verify:
  - 在 Gemini 应用中用 nano banana 实测 3 次，记录包装盒上的图像与手办是否一致
  - 电脑屏幕上的"建模界面"是否出现明显乱码
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：[1/7 比例] 可改"1/6 比例""Q 版"；[书桌] 可以换成"展示柜""电脑桌"等，场景越具体越真实。

**常见失败与调整**：
- 包装盒上的图和手办对不上：在末尾加"包装盒上印的是同一个角色的正面插画"。
- 电脑屏幕内容很乱：可以直接删掉电脑这一句，只保留手办和包装盒。
- 照片里的人变得不像：真人照片转手办时，脸部相似度不稳定，多生成几次挑最像的。

**适合 / 不适合**：最适合自己的原创角色、宠物、本人照片。用知名动漫或游戏角色生成的图仅供学习交流，商用请注意版权；不要用明星等真实公众人物的照片。

> 改编自 [@ZHO_ZHO_ZHO](https://x.com/ZHO_ZHO_ZHO/status/1958539464994959715) 发布、[PicoTrex/Awesome-Nano-Banana-images](https://github.com/PicoTrex/Awesome-Nano-Banana-images) 收录的提示词，仓库许可证 Apache-2.0。
