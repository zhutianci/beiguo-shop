---
title: nano banana 证件照提示词：一句话做二寸蓝底证件照
slug: nano-banana-id-photo
model: nano-banana
topics: [id-photo]
needsRefImage: true
useCase: 用 Gemini 里的 nano banana 把生活照快速做成蓝底 / 白底证件照，适合简历、报名表。
prompt: |
  截取图片中人物的头部和肩部，帮我做成[2寸]证件照，要求：
  1、[蓝]底，纯色无渐变
  2、[职业正装]
  3、正脸，双眼平视镜头
  4、[微笑]
  5、五官、发型保持原样，不要美颜
negativePrompt: null
source:
  repo: PicoTrex/Awesome-Nano-Banana-images
  url: https://x.com/songguoxiansen/status/1963602241610551609
  author: "@songguoxiansen"
  license: Apache-2.0
  licenseUrl: https://www.apache.org/licenses/LICENSE-2.0
  changes: 保留原文的 4 条要求，把尺寸、底色、服装、表情改为变量；补充了"头部和肩部""纯色无渐变""双眼平视""五官发型保持原样、不要美颜"
imageBrief: 用站长本人（或已书面同意的同事）一张正脸生活照作输入，生成 2 张：二寸蓝底一版、一寸白底一版；用与 01 号提示词相同的原图，方便两个模型对比。
verify:
  - 在 Gemini 应用中用 nano banana 实测 3 次，记录脸部相似度和衣领衔接
  - 与 01 号（gpt-image-2 证件照）用同一张原图对比，记录哪个更像本人
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：[2寸] 可换"1寸""小2寸"；[蓝] 可换"白""红"；[职业正装] 可换"白衬衫""校服"；[微笑] 不想笑就写"表情自然，闭嘴"。

**常见失败与调整**：
- 输出比例不对：nano banana 不一定按证件尺寸出图，生成后自己按尺寸裁剪。
- 西装领口和脖子衔接生硬：把"职业正装"改为"深色西装白衬衫，领口自然"。
- 微笑变成露齿大笑：改成"嘴角轻微上扬，不露齿"。

**适合 / 不适合**：适合简历、内部系统头像、非官方报名。身份证、护照、签证等正式证件通常要求未经修饰的真实照片，请以办理机构的要求为准。想用 gpt-image-2 做，可看本站另一条证件照提示词。

> 改编自 [@songguoxiansen](https://x.com/songguoxiansen/status/1963602241610551609) 发布、[PicoTrex/Awesome-Nano-Banana-images](https://github.com/PicoTrex/Awesome-Nano-Banana-images) 收录的提示词，仓库许可证 Apache-2.0。
