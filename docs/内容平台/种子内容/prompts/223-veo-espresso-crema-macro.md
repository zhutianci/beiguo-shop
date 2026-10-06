---
title: veo 3 提示词：咖啡广告视频（意式浓缩萃取微距 + 同期声）
slug: veo-espresso-crema-macro
model: veo
topics: [product-video]
modelLabel: Veo 3
aspectRatio: "9:16"
needsRefImage: false
useCase: 生成 8 秒竖屏的咖啡萃取微距广告：浓缩液流下、油脂绽开、方糖落入激起涟漪，并自带萃取声、蒸汽声和杯碟轻碰声，适合咖啡店、咖啡豆品牌的短视频广告。
prompt: |
  8 秒竖屏 9:16 咖啡广告。一只[哑光陶瓷杯]放在温暖的[洞石台面]正中，清晨从侧窗射入的硬光斜穿整个画面。
  0–2 秒：正上方微距俯拍，一股油脂丰厚的浓缩咖啡从抛光的冲煮手柄流下，液面绽开成虎斑纹的油脂层，蒸汽从表面卷起。
  2–3 秒：镜头倾斜到与桌面齐平的低角度，金色逆光点亮升腾的水汽，背景是深色阴影。
  3–5 秒：镜头绕杯子缓慢横移，一块方糖落下，慢动作的同心涟漪在油脂层上扩散开。
  5–8 秒：停在四分之三角度的主视觉，[品牌名]的铝箔咖啡豆袋在后方闪着光。
  液体保持真实的黏稠度，油脂层始终是一层连续的"皮"——不拖影、不出现重影、液流不断裂、液面不沸腾翻滚。
  音效：萃取时咕嘟的流液声、蒸汽的嘶嘶声、一声陶瓷轻碰的叮。没有背景音乐，没有人声。
negativePrompt: null
source:
  repo: LichAmnesia/awesome-ad-video-prompts
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts#espresso-pour-crema-physics
  author: awesome-ad-video-prompts contributors
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 英文原文译为中文；原文为通用视频模型提示词，本站按 Veo 3 原生音频的特点把声音单列为"音效"并注明不要音乐和人声；杯子、台面、品牌名改为变量
images:
  - 223-veo-espresso-crema-macro-1.jpg
imageCredit:
  by: LichAmnesia/awesome-ad-video-prompts
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts/blob/main/images/espresso-pour-crema-physics.png
  license: CC BY 4.0
verify:
  - 在 Google 提供 Veo 3 的入口（如 Gemini 应用、Flow）实测 3 次，记录可选比例（是否支持 9:16）、时长和是否生成音效（以官方说明为准）
  - 音效与画面动作（方糖落下、杯碟轻碰）是否同步
  - 示例图是仓库提供的关键帧图（已转为 JPG 压缩），不是 Veo 成片截图
---
**时长与镜头**：Veo 3 单条通常是 8 秒，这条的四段（2+1+2+3 秒）刚好填满。每段只有一个镜头动作：俯拍 → 压低 → 横移 → 定格，是食品饮料广告最常见的节奏。

**声音怎么写**：Veo 3 会同时生成声音，所以要把想听到的声音按画面顺序写出来，并明确"没有背景音乐、没有人声"，否则可能自动配上音乐或旁白。想加音乐就改成"轻柔的爵士钢琴铺底"。

**怎么填变量**：[哑光陶瓷杯] 可换"玻璃双层杯""纸杯"（外带店）；换成拿铁就把方糖段改成"牛奶倒入，拉出一朵叶子拉花"。

**常见失败与调整**：
- 液流断断续续：写"一股连续不断的细流"。
- 油脂层像在沸腾：保留"液面不沸腾翻滚"，并删掉"蒸汽卷起"中过于夸张的修饰。
- 咖啡豆袋上的字乱码：删掉 5–8 秒的豆袋，改成"背景虚化的咖啡豆"，品牌名后期叠加。

> 改编自 [LichAmnesia/awesome-ad-video-prompts](https://github.com/LichAmnesia/awesome-ad-video-prompts)（awesome-ad-video-prompts contributors），许可证 CC BY 4.0。

### 英文原版

```
A matte ceramic cup sits centered on warm travertine, hard morning side-window light slanting across the scene. 0-2s: top-down macro of a thick crema-rich espresso stream falling from a polished portafilter, the surface blooming into a tiger-striped crema as steam curls off it. 2-3s: tilt to a low table-level angle, golden backlight igniting the rising vapor against deep shadow. 3-5s: a slow lateral truck around the cup as a single sugar cube drops, concentric ripples spreading through the crema in slow motion. 5-8s: settle on a hero three-quarter with the [brand] foil bag glinting behind. Liquid keeps believable viscosity and the crema reads as a continuous skin — no smearing, ghosting, broken-stream artifacts, or boil-up. Sound: gurgle of extraction, hiss of steam, a single ceramic clink.
```
