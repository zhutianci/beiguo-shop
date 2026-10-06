---
title: 梦幻插画提示词：星空下发着金光的帆船（手机壁纸 / 绘本风）
slug: glowing-sailboat-illustration
model: gpt-image-2
topics: [illustration]
aspectRatio: "9:16"
needsRefImage: false
useCase: 生成一张安静、治愈的星空发光帆船插画，适合手机壁纸、读书笔记封面、晚安文案配图。
prompt: |
  一艘轮廓发着金色光芒的帆船，静静漂浮在泛起涟漪的深色水面上，头顶是满天繁星的夜空。
  船帆半透明、带淡淡的蓝色，映着空灵的光；船身是深色剪影。
  黑色夜空里散落着许多闪烁的小金星，[一弯新月]柔和地挂在右侧。
  前景是从光滑灰色石头间长出的、鲜绿色的芦苇和野草，草尖点缀着细小的发光金色花穗。
  水面倒映出帆船的金色轮廓，形成温暖的粼粼光晕，与夜色的冷与深形成对比。
  略低的仰视角度，突出帆船在广阔夜空下的存在感。
  整体氛围梦幻、宁静、如梦似幻，带着平和的冒险感和星空的奇妙。风格接近带霓虹发光点缀的数字奇幻插画。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/churvikv/status/2054315113587384469
  author: "@churvikv"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 英文原文译为中文；月亮形态改为变量；其余保留
images:
  - 127-glowing-sailboat-illustration-1.jpg
imageCredit:
  by: "@churvikv"
  url: https://x.com/churvikv/status/2054315113587384469
  license: CC0 1.0
verify:
  - 在 gpt-image-2 上实测 3 次，记录成功率与最常见的失败形式
  - 9:16 竖版下构图是否完整、帆船是否居中偏下
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么用**：这条几乎不用改就能出好图，适合新手练手。想换主体，把"帆船"换成"纸飞机""鲸鱼""小木屋"，再把对应的"船帆、船身"描述一起改掉；[一弯新月] 可以换成"一轮满月""一颗流星"。

**常见问题**：
- 发光太强、像霓虹灯招牌：把"霓虹发光点缀"改成"柔和的金色微光"。
- 画面太满：删掉"前景芦苇"，留出更多夜空做文字区。
- 做壁纸被图标挡住：在提示词末尾加"画面上方三分之一留给夜空，主体在下半部分"。

**迭代**：同一提示词换成 16:9，就是一张电脑壁纸；换成 1:1，适合做头像。

### 英文原版

```text
A luminous sailboat, outlined in glowing golden light, floats serenely on dark, rippling water under a starry night sky. The sails, translucent and faintly blue, catch the ethereal light, while the hull is a solid, dark silhouette. Numerous tiny, twinkling golden stars are scattered across the black expanse above, and a crescent moon hangs softly to the right. Lush, vibrant green reeds and grasses sprout from smooth, grey stones in the foreground, their tips adorned with delicate, glowing golden florets. The water reflects the golden outline of the sailboat, creating a shimmering, warm glow that contrasts with the cool, deep darkness of the night. The scene is composed with a slightly low angle, emphasizing the majestic presence of the sailboat against the vastness of the night. The overall atmosphere is magical, tranquil, and dreamlike, evoking a sense of peaceful adventure and celestial wonder. The style is reminiscent of digital fantasy art with glowing neon accents.
```

> 改编自 [@churvikv](https://x.com/churvikv/status/2054315113587384469) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0；示例图同样来自该仓库收录的原帖出图。
