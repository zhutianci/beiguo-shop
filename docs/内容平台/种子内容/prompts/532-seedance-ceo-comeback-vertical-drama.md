---
title: seedance 提示词：AI 短剧霸总逆袭（竖屏 15 秒 · 婚礼当众打脸反转）
slug: seedance-ceo-comeback-vertical-drama
model: seedance
topics: [short-drama]
modelLabel: Seedance 2.0
aspectRatio: "9:16"
needsRefImage: false
useCase: 生成竖屏逆袭爽剧最经典的"当众羞辱 → 撕协议反转 → 保镖跪迎身份揭晓"15 秒高潮片段，带台词口型；适合做短剧预告、投流素材，或作为写 AI 短剧爽点分镜的模板。
prompt: |
  【风格】国产爆款逆袭爽剧，竖屏 9:16，高饱和滤镜，大量面部特写，情绪起伏强烈。
  【时长】15 秒，三个镜头。
  【人物】被羞辱的[新郎]（廉价西装，眼神里压着怒火）VS 看不起人的[丈母娘]（满身珠宝，一脸嫌弃）。
  [00:00-00:05] 镜头一｜当众羞辱：豪华婚宴现场。丈母娘当着所有宾客，把一张[离婚协议]拍在新郎胸口，周围宾客哄笑。她伸出手指戳着新郎的额头。
  【台词口型】丈母娘："[没车没房还想娶我女儿？]拿着这一百块滚出去！"
  [00:05-00:10] 镜头二｜突然反转：新郎忽然冷笑，把协议撕成两半。就在这一刻，巨大的直升机轰鸣声盖过全场，狂风把丈母娘的头发吹乱。新郎整了整衣领，气场瞬间变得压人。
  【台词口型】新郎："这婚，是你们要退的。"
  [00:10-00:15] 镜头三｜身份揭晓：宴会厅大门被推开，两排黑衣保镖冲进来，单膝跪地铺开红毯。白发管家双手捧着[一件金色锦袍]，小跑到新郎面前深深鞠躬。丈母娘吓得瘫坐在地，瞳孔震颤。
  【台词口型】管家高喊："[恭迎少主回家！]家族资产已全部解冻！"
  【声音】宾客哄笑、撕纸声、直升机轰鸣和风声、整齐的脚步声；镜头三进入激昂的鼓点。
negativePrompt: null
source:
  repo: ZeroLu/awesome-seedance
  url: https://x.com/johnAGI168/status/2020688711172620665
  author: "@johnAGI168"
  license: MIT
  licenseUrl: https://github.com/ZeroLu/awesome-seedance/blob/main/LICENSE
  changes: 由仓库英文版回译为中文；新郎、丈母娘、协议、信物和两句台词改为变量；"龙王（少主）"统一为"少主"，"黄袍或黑卡"取锦袍；补充【声音】一段
images:
  - 532-seedance-ceo-comeback-vertical-drama-1.jpg
imageCredit:
  by: "@johnAGI168"
  url: https://github.com/ZeroLu/awesome-seedance#63-chinese-viral-ceo-drama-style-vertical-format
  license: MIT
verify:
  - 示例图是从仓库附带的成片视频（github.com/user-attachments/assets/510355c2-6c53-4587-8f1a-9913a0a54bbb）第 11.3 秒抽取的一帧（镜头三：保镖跪地、管家捧锦袍），不是封面图
  - 在 Seedance 2.0 实测 3 次：中文台词口型、保镖人数是否稳定、直升机风效是否出现
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**时长与镜头**：爽剧的标准节奏是"压 → 翻 → 爆"，每 5 秒一个节拍，镜头三的人越多、仪式感越强，反转越爽。想做成更长的一集，就把每个镜头单独扩成 10 秒左右分别生成，再按顺序剪辑。

**怎么填变量**：人物和信物一换就是另一个套路：[新郎] / [丈母娘] 换成"[外卖小哥] / [势利店长]"，[一件金色锦袍] 换成"[一张黑卡]""[集团印章]"，管家台词跟着改成"[董事长，车已备好]"。台词保持一句一人、10 字左右。

**常见失败与调整**：
- 保镖越跪越多、互相穿插：写明"左右各四名保镖"，并把"冲进来"改成"快步走进来"。
- 镜头一宾客的脸和主角串了：把主角定妆照作为参考图上传，写"新郎参考图片 1"。
- 直升机真的出现在室内：保留"只有声音和风"，或改成"窗外传来直升机轰鸣"。

> 改编自 [@johnAGI168](https://x.com/johnAGI168/status/2020688711172620665) 发布、[ZeroLu/awesome-seedance](https://github.com/ZeroLu/awesome-seedance) 收录的提示词（Copyright (c) 2026 ZeroLu，MIT License）。

### 英文原版

```
【Style】Popular Chinese rich-tycoon (爽剧/Satisfying Drama) (Viral CEO Drama), vertical composition (Portrait Mode), high saturation filter, extreme facial close-ups, dramatic emotional range.
【Duration】15 seconds
【Characters】Humiliated groom (wearing cheap suit, eyes showing suppressed anger) VS disdainful mother-in-law (covered in jewelry, looking disgusted).
[00:00-00:05] Shot 1: Extreme humiliation (Humiliation).
Luxurious wedding venue. The mother-in-law slams a "divorce paper" onto the male lead's chest in front of everyone, surrounding guests burst into laughter.
【Action】Mother-in-law pokes her finger at the male lead's forehead.
【Dialogue lip-sync guidance】"Want to marry my daughter without a car or house? Take this hundred bucks and scram!"
[00:05-00:10] Shot 2: Sudden reversal (The Turn).
Male lead suddenly smirks and tears the divorce paper. At this moment, a massive helicopter sound (audio effect) drowns out the entire venue, the wind wildly messes up the mother-in-law's hair.
【Action】Male lead adjusts his collar, his aura instantly becomes domineering.
【Dialogue lip-sync guidance】"This marriage is what you want to cancel."
[00:10-00:15] Shot 3: Rich tycoon reveal (The Reveal).
The main door is kicked open, two rows of black-clad bodyguards rush in, kneeling on one knee to roll out a red carpet. An elderly butler tremblingly holds up a yellow robe (or ultimate black card) and runs to deeply bow in front of the male lead. The mother-in-law is so scared she collapses to the ground, her pupils shaking.
【Dialogue lip-sync guidance】The butler shouts: "Welcome back, Dragon King (Young Master)! Family assets have been unfrozen!"
```
