---
title: seedance 提示词：日系动画风清洁解压视频（脏鞋垫一喷变白）
slug: seedance-anime-cleaning-satisfying
model: seedance
topics: [product-video, motion-graphics]
modelLabel: Seedance 2.0
aspectRatio: "9:16"
needsRefImage: false
useCase: 生成 15 秒竖屏的 2D 动画风"脏→净"清洁过程，带速度线、网点和闪光特效，适合清洁剂、洗护用品的趣味广告，或解压类短视频。
prompt: |
  15 秒竖屏 9:16 的日系 2D 动画短片，主题是解压的清洁前后对比。手绘赛璐璐动画质感，干净的黑色描线，鲜艳的色彩，柔和的赛璐璐阴影，漫画式剪辑，带速度线、网点、闪光特效和白色冲击闪帧。动画工作室品质，动作流畅，24 帧。
  主体：一块很脏的[旧鞋垫]（棕黄色污渍、明显的脚印）平放在拉丝不锈钢台面上，正上方俯拍。一只动画风格的手（不露脸、不露身体，只出现手和小臂）拿着一个[黑色绿盖小喷瓶]。冷银色背景，柔和窗光，细小水珠。
  镜头 1（3 秒）：固定俯拍。脏鞋垫躺在台面上，手把它按平。灰尘缓缓漂浮，四角有淡淡的网点暗角，细速度线从画面边缘飘进来。
  镜头 2（3 秒）：近距离俯拍。喷瓶喷出细雾，浓密的白色泡沫在表面爆开、铺满，泡泡上闪着高光。第一次泡沫爆开时插入一帧白色冲击闪光和放射状墨线。
  镜头 3（3 秒）：紧凑俯拍。手打圈揉搓泡沫，棕黄色污渍溶进白泡沫，像墨水一样卷着流向边缘。动态线跟随手的动作。
  镜头 4（3 秒）：俯拍。一股清水冲走泡沫，鞋垫被利落地一翻，露出洁白干净的表面，闪光和亮线在上面跳出来。
  镜头 5（3 秒）：从上方缓慢推近。洁白的鞋垫在钢台上发亮，手把喷瓶放到角落。最后一次闪光，柔和光晕，漫画网点暗角，最后一拍定格得像漫画封面。
  声音：清脆的喷雾声、泡沫滋滋声、有节奏的揉搓声、流水声，每次闪光配一声明亮的叮，底下垫一段轻快的日系 lo-fi 节拍。没有说话和歌声。
  避免：人脸、真人实拍感、3D 渲染、文字、字幕、Logo、品牌名、多余手指、手部变形、画面闪烁。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-seedance-2-prompts
  url: https://x.com/nadyamaje/status/2106554883235356947
  author: "@nadyamaje"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 英文原文译为中文；被清洁物和喷瓶外观改为变量；删去原文末尾重复的简版摘要
images:
  - 212-seedance-anime-cleaning-satisfying-1.jpg
imageCredit:
  by: "@nadyamaje"
  url: https://x.com/nadyamaje/status/2106554883235356947
  license: CC BY 4.0
verify:
  - 实测成片是否真的是 2D 赛璐璐风（而不是 3D 或写实）
  - 镜头 4 翻面时鞋垫形状是否保持一致
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**时长与镜头**：5 个镜头各 3 秒，全部是俯拍，机位统一，所以动画风也不容易乱。节奏是"脏—喷—搓—冲—亮"，每个镜头只做一件事，这是清洁类解压视频的标准结构。

**怎么填变量**：[旧鞋垫] 可换"[发黄的白球鞋]""[油污的灶台]""[起球的毛衣]"；喷瓶写你的产品外观（颜色、瓶型），不要写品牌名，品牌 Logo 留到片尾后期加。

**常见失败与调整**：
- 变成了写实风或 3D 风：在开头重复一次"2D 手绘动画，不是 3D"，并保留"避免"里的"真人实拍感、3D 渲染"。
- 手画崩了：手只露小臂以下，动作尽量简单；镜头 3 的打圈动作可以改成"海绵一抹而过"。
- 闪光特效太多、看着累：把"每次闪光配一声叮"改成只在镜头 4、5 出现。

**提醒**：用于产品广告时，清洁效果要与产品真实效果相符，不要夸大。

> 改编自 [@nadyamaje](https://x.com/nadyamaje/status/2106554883235356947) 发布、[YouMind-OpenLab/awesome-seedance-2-prompts](https://github.com/YouMind-OpenLab/awesome-seedance-2-prompts) 收录的提示词，许可证 CC BY 4.0。

### 英文原版

```
15-second vertical 9:16 Japanese 2D anime short, satisfying cleaning transformation. Hand-drawn cel animation look, clean black ink outlines, vivid colors, soft cel shading, manga-style editing with speed lines, halftone screentone dots, sparkle effects and white impact flashes. Studio-quality anime production, smooth motion, 24fps. Subject: a worn, dirty shoe insole (brown-gold stains, footprint imprint) lying on a brushed stainless steel counter, shot from directly above. An anime-style hand (no face, no body, only hand and forearm visible) holds a small black spray bottle with a green cap. Cool silver background with soft window light and tiny water droplets. Shot 1: Locked top-down shot, 3 seconds. The dirty insole lies on the steel counter, a hand presses it flat. Dust motes float, subtle halftone vignette at the corners, thin speed lines drift in from the edges. Shot 2: Close top-down shot, 3 seconds. The spray bottle sprays a fine mist onto the insole, thick white foam bursts outward and spreads across the surface, bubbles catching sparkles. A one-frame white impact flash with radial ink lines on the first burst of foam. Shot 3: Tight overhead shot, 3 seconds. The hand rubs the foam in circular motions, the brown-gold dirt dissolves into the white foam and streams toward the edge in curling ink-like swirls. Dynamic motion lines follow the hand. Shot 4: Overhead shot, 3 seconds. A rinse of clear water washes the foam away, the insole is flipped over in one quick whip motion, revealing a bright clean white surface. Glittering sparkles and shine streaks pop across it. Shot 5: Slow push-in from above, 3 seconds. The spotless white insole gleams on the steel counter, the hand sets the bottle down at the corner. Final sparkle burst, soft glowing light, manga-style screentone vignette, held for the last beat like a manga cover panel. Audio: crisp spray hiss, fizzing foam crackle, rhythmic scrubbing, flowing water, a bright sparkle chime on each shine effect, soft upbeat Japanese lo-fi beat underneath. No speech, no singing. Avoid: faces, realistic live-action look, 3D render, text, subtitles, logos, brand names, extra fingers, deformed hands, flicker.  15-second vertical 9:16 Japanese 2D anime, satisfying cleaning transformation, top-down shot. An anime-style hand (no face) sprays foam onto a dirty brown shoe insole on a stainless steel counter, scrubs the foam in circles, rinses it, and the insole turns bright clean white with sparkle effects. Manga-style speed lines, halftone dots, and a white impact flash on the first foam burst. Audio: spray hiss, foam crackle, scrubbing, water, light sparkle chimes, soft lo-fi beat. No faces, no text, no logos.
```
