---
title: gpt-image-2 职业形象照提示词：自拍变简历 / 领英头像
slug: resume-headshot
model: gpt-image-2
topics: [portrait, id-photo]
aspectRatio: "4:5"
needsRefImage: true
useCase: 把一张清晰自拍改成棚拍质感的职业形象照，用于简历、领英、公司官网团队页。
prompt: |
  根据我上传的照片生成一张专业的职业形象照，严格保持照片中这个人的脸部结构、五官和身份特征不变。
  构图：胸部以上，头顶留出适当空间，人物直视镜头。
  服装：[炭灰色休闲西装外套]，面料纹理清晰可见。
  背景：纯色[深酒红色]棚拍背景，没有其他物体。
  光线：明亮通透的柔光，从略高的角度照亮面部，眼睛里有自然的眼神光。
  镜头：85mm 人像镜头效果，焦点落在眼睛上，背景柔和虚化。
  质感：保留自然的皮肤纹理和发丝细节，不要过度磨皮。
  氛围：自信、专业、亲和；色调干净明亮，略带暖调。
negativePrompt: null
source:
  repo: ZeroLu/awesome-nanobanana-pro
  url: https://x.com/PavolRusnak/status/1994097306526994558
  author: "@PavolRusnak"
  license: MIT（Copyright (c) 2025 ZeroLu）
  licenseUrl: https://github.com/ZeroLu/awesome-nanobanana-pro/blob/main/LICENSE
  changes: 英文原文译为中文并改成分条结构；原文写死的外套颜色和背景色值（#562226）改为变量；删减了部分重复的氛围修饰词；原文为 Nano Banana Pro 编写，本站改投 gpt-image-2
imageBrief: 用站长本人（或已书面同意的同事）的一张手机自拍作输入；输出 2 张：深酒红背景 + 炭灰外套一张、浅灰背景 + 白衬衫一张，并保留原图做对比。
verify:
  - 原提示词为 Nano Banana Pro 编写，需在 gpt-image-2 上实测 3 次，记录脸部相似度
  - 同一提示词在 nano-banana 上对比一次，记录哪个模型更像本人
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：[炭灰色休闲西装外套] 按行业换，例如互联网可用"浅色针织衫"，金融法律用"深色正装"；[深酒红色] 换成你想要的背景色，写得越具体越稳定。

**说明**：这条原本是给 Nano Banana Pro 写的，本站改投 gpt-image-2，效果待实测。

**常见失败与调整**：
- 脸不像本人：换一张光线均匀、正脸、没有遮挡的原图；在开头再强调一次"不得改变五官"。
- 皮肤像塑料：保留"不要过度磨皮"这一句，必要时加"可见毛孔"。
- 服装与脖子衔接不自然：把构图改成"肩部以上"。

**适合 / 不适合**：适合简历、职场社交头像、团队介绍页；不适合需要官方规格的证件照（见本站证件照提示词）。

> 改编自 [@PavolRusnak](https://x.com/PavolRusnak/status/1994097306526994558) 发布、[ZeroLu/awesome-nanobanana-pro](https://github.com/ZeroLu/awesome-nanobanana-pro) 收录的提示词，许可证 MIT（Copyright (c) 2025 ZeroLu）。
