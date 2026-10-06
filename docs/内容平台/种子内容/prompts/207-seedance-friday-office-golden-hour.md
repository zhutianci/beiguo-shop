---
title: seedance 提示词：周五下班氛围短片（办公室到黄昏街头 · 分镜图驱动）
slug: seedance-friday-office-golden-hour
model: seedance
topics: [cinematic, short-drama]
modelLabel: Seedance 2.0
aspectRatio: "16:9"
needsRefImage: true
useCase: 上传一张分镜图，按"格式—参考—场景—风格—静态锁定—动态—时间轴—声音—规则"的结构生成 15 秒情绪短片；这个结构可以直接当成 Seedance 长提示词模板套用。
prompt: |
  【格式】15 秒 / 720P / 16:9。
  【参考】图片 1 是分镜图和画面顺序参考。
  【场景】一位[职场女性]在现代城市办公室里赶完周五最后几个小时的工作，完成最后一项任务后，走进温暖诱人的黄昏。
  【风格】当代真人电影写实，节奏轻快；冷蓝灰的办公室色调逐渐转为琥珀色的夕阳和城市暖光。
  【镜头 / 光线 / 调色】35mm 全画幅为主，近景用 85mm；办公室冷色顶光转为画面右侧射入的黄金时刻逆光；轻微胶片颗粒。
  【静态锁定】同一位成年女性，长相、[剪裁合身的职业装]、发型和配饰全程一致；办公室空间关系、画面方向和光线变化保持连贯。
  【动态】快速瞥一眼时钟、专注打字、消息提醒、轻快的横移跟拍、果断合上笔记本、穿过玻璃门大步向前、城市中缓缓漫步、最后静止。
  【时间轴】
  0–1.5 秒：时钟紧凑特写，她期待的眼神。
  1.5–3.2 秒：办公室全景，她在打字，同事们陆续收拾下班。
  3.2–5 秒：消息提醒接连弹出，她克制地呼出一口气。
  5–7 秒：跟拍，她结束一通电话，拿起外套。
  7–8.8 秒：最后一封邮件发出，笔记本合上，如释重负。
  8.8–10.8 秒：她走出大楼，走进金色的傍晚。
  10.8–13 秒：城市街头漫步，周末的温暖气氛展开。
  13–15 秒：她微笑着把手机放进包里，定格在平静、放松的最后一帧。
  【声音】时钟滴答和轻敲键盘声叠在轻快的节奏器乐上；笔记本合上的咔嗒声，办公室环境音退去，换成傍晚的街道声；音乐转为温暖轻盈的周末感。没有对白和旁白。
  【规则】一条连续的电影感视频，不是分镜幻灯片；不要分格边框、字幕、标题、箭头、叠加图层或可读的屏幕文字；不要出现额外的主要角色；保持自然动作和人物一致。
  【负面】人物长相漂移、看不清的乱切、乱码文字、分屏、静帧拼贴。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-seedance-2-prompts
  url: https://x.com/amynys/status/2106009075049758825
  author: "@amynys"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 英文原文译为中文，按原结构加【】小标题、时间轴逐行排列；人物和服装改为变量
images:
  - 207-seedance-friday-office-golden-hour-1.jpg
imageCredit:
  by: "@amynys"
  url: https://x.com/amynys/status/2106009075049758825
  license: CC BY 4.0
verify:
  - 实测"分镜图作为参考"时，成片是否误把分镜格子、文字说明画进视频
  - 720P 选项和 15 秒时长在所用平台上是否可选（以官方说明为准）
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**这条的价值在结构**：【静态锁定】写"不能变的"（人、衣服、空间、光线方向），【动态】写"要动的"，两者分开写，比把所有描述混在一段里更不容易崩。【规则】一段专门防止模型把分镜图直接"贴"进画面。

**分镜图怎么来**：可以先用本站的"9 宫格 TVC 分镜"图像提示词出一张分镜，再把它作为图片 1 上传；没有分镜图时，删掉【参考】一行，把 needsRefImage 当作 false 用。

**常见失败与调整**：
- 成片出现分格边框或字幕：确认【规则】一段完整保留，并在分镜图里尽量少放文字。
- 8 个时间段太碎、动作没做完就切走：合并成 4 段（办公室、下班、出门、街头），每段 3–4 秒。
- 屏幕上的邮件、手机界面出现乱码：已写"不要可读的屏幕文字"，仍出现时把电脑屏幕改成背对镜头。

> 改编自 [@amynys](https://x.com/amynys/status/2106009075049758825) 发布、[YouMind-OpenLab/awesome-seedance-2-prompts](https://github.com/YouMind-OpenLab/awesome-seedance-2-prompts) 收录的提示词，许可证 CC BY 4.0。

### 英文原版

```
FORMAT: 15s / 720P / 16:9. REFERENCES: Image1 is the storyboard and sequential visual guide. SCENE: One career woman races through the final hours of Friday in a modern city office, finishes her last task, and steps into an inviting golden evening. STYLE: contemporary live-action cinematic realism, brisk pacing, cool blue-gray office shifting into amber sunset and warm city lights. LENS / LIGHT / GRADE: 35mm full-frame with 85mm close-ups; cool overhead office light shifting to golden-hour backlight from screen-right; subtle film grain. STATIC LOCKS: same adult woman, face, tailored workwear, hair and accessories throughout; coherent office geography, screen direction and light progression. DYNAMIC MOTION: quick clock glance, purposeful typing, notifications, brisk lateral tracking, decisive laptop close, forward stride through glass doors, gentle city drift, settle into stillness. TIMELINE: 0-1.5s tight clock and anticipatory eyes; 1.5-3.2s wide office typing as colleagues wind down; 3.2-5s notifications then controlled exhale; 5-7s tracking as she finishes a call and gathers her coat; 7-8.8s final email sent, laptop shuts, relief; 8.8-10.8s she exits into golden evening; 10.8-13s city walk opens into warm weekend atmosphere; 13-15s she smiles, phone goes into her bag, holds a calm liberated final frame. AUDIO / VOICE: ticking clock and soft keyboard taps build over light rhythmic instrumental music; laptop click, office ambience recedes into evening street sounds; music opens into warm buoyant weekend energy. No dialogue or voiceover. RULES: one continuous cinematic video, not a storyboard slideshow; no panel borders, captions, masthead, arrows, overlays or readable screen text; no extra featured characters; preserve natural movement and identity. NEGATIVE: no identity drift, frantic unreadable cuts, garbled text, split-screen or frozen montage.
```
