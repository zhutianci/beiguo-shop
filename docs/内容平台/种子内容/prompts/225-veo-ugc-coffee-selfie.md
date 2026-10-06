---
title: veo 3 提示词：UGC 自拍种草视频（真人口播风格 · 晨间咖啡）
slug: veo-ugc-coffee-selfie
model: veo
topics: [product-video, short-drama]
modelLabel: Veo 3
aspectRatio: "1:1"
needsRefImage: false
useCase: 生成 8 秒"像用户自己拍的"手机自拍种草视频：打哈欠、指向产品、冲咖啡、喝一口点头，带一句台词和环境声，适合做信息流广告的 UGC 风格素材。
prompt: |
  一臂距离的手机自拍视频，1:1，8 秒。清晨的家里，一张杂乱的书桌，一位[自由职业的年轻女生]戴着卫衣帽子，一袋[单一产地咖啡豆]靠在显示器旁边。
  0–2 秒：她对着镜头打了个哈欠，懒懒地指了指那袋咖啡豆，轻声说："[就这款。]"
  2–4 秒：切到更近的镜头：咖啡豆倒进磨豆机，然后热水冲下，热气从一只有缺口的陶瓷杯里升起。
  4–6 秒：她双手捧着杯子喝了一口，眼睛慢慢睁大，真诚地点了点头。
  6–8 秒：她靠回椅背，把杯子贴在胸前，冲镜头满足地轻呼一口气。
  光线：黎明冷蓝的窗光渐渐变成琥珀色，能看到上升的热气、木纹和釉面陶瓷的质感。
  杯子和咖啡豆袋的形状、标签、质感全程一致，不变形、不漂移、没有伪影。
  声音：磨豆机的嗡嗡声、细细的注水声、一声带着困意的轻笑；没有背景音乐；不要字幕。
negativePrompt: null
source:
  repo: LichAmnesia/awesome-ad-video-prompts
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts#desk-coffee-morning-ritual
  author: awesome-ad-video-prompts contributors
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 英文原文译为中文；原文"口型说 this one"改为一句可替换的中文台词；补充"没有背景音乐、不要字幕"；人物、产品、台词改为变量
images:
  - 225-veo-ugc-coffee-selfie-1.jpg
imageCredit:
  by: LichAmnesia/awesome-ad-video-prompts
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts/blob/main/images/desk-coffee-morning-ritual.png
  license: CC BY 4.0
verify:
  - 实测 Veo 3 生成中文台词的发音和口型同步效果；不理想时改用英文台词对比
  - 是否会自动烧录字幕
  - 示例图是仓库提供的关键帧图（已转为 JPG 压缩），不是 Veo 成片截图
---
**UGC 风格的关键**：不完美才真实——"一臂距离自拍""杂乱的书桌""有缺口的杯子""打哈欠"这些细节，都是为了让画面不像广告。别把它们改成"精致的桌面"。

**台词怎么写**：Veo 3 能按引号里的内容说话，台词放在双引号里，并写清是谁、用什么语气说。8 秒里最多一两句短台词；台词越长，口型越容易对不上，后半段也会被挤掉。

**怎么填变量**：[单一产地咖啡豆] 可换"[一盒燕麦早餐]""[一瓶维生素软糖]"，同时把冲咖啡那段换成对应的使用动作。人物描述写年龄段、穿着和状态，不要写具体真人。

**常见失败与调整**：
- 画面自动出现字幕：保留"不要字幕"，并写"画面中没有任何文字"。
- 包装上的字乱码：让包装背对镜头或虚化，产品名后期加贴纸。
- 镜头太稳，像专业拍摄：加"轻微的手持晃动，偶尔对焦不准"。

**提醒**：用 AI 生成的"用户口碑"视频做广告时，需按平台规则标注 AI 生成，不能冒充真实用户的使用评价。

> 改编自 [LichAmnesia/awesome-ad-video-prompts](https://github.com/LichAmnesia/awesome-ad-video-prompts)（awesome-ad-video-prompts contributors），许可证 CC BY 4.0。

### 英文原版

```
Arm's-length selfie at a cluttered home desk in first light, freelancer with her hood up, a bag of [brand] single-origin beans propped against the monitor. 0-2s: she yawns into the camera, points lazily at the bag, mouths 'this one.' 2-4s: cut to a tighter shot of beans tumbling into a grinder, then steam curling off a fresh pour-over into a chipped ceramic mug. 4-6s: she cups the mug in both hands, takes a sip, eyes widening into a slow, honest nod. 6-8s: she leans back with the mug pressed to her chest, exhaling a soft satisfied breath toward the lens. Cool dawn-blue window light warming to amber, visible rising steam, grain of wood and glazed ceramic. Mug and bean bag keep consistent shape, label, and finish, no deformation, drift, or artifacts. Implied sound: grinder whir, the trickle of a pour, a sleepy half-laugh.
```
