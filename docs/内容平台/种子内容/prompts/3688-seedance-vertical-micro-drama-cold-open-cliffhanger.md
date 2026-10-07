---
title: seedance 提示词：竖屏短剧三幕模板（2 秒冷开场钩子—正反打对峙—悬念剪断 · 12 秒）
slug: seedance-vertical-micro-drama-cold-open-cliffhanger
model: seedance
topics: [short-drama]
modelLabel: Seedance 2.0
aspectRatio: "9:16"
needsRefImage: true
useCase: 通用的竖屏短剧结构：前 2 秒直接上最炸的钩子、中间正反打对峙一句一句顶上去、结尾一个没解答的反转直接切断。换掉人物、钩子、台词和反转，就能批量做 AI 短剧的单集或预告。
prompt: |
  竖屏短剧，对话对峙，钩子前置的冷开场，正反打（shot-reverse-shot）；写实克制的表演，不要狗血浮夸。竖屏 9:16，约 12 秒。
  人物（脸部以参考图为准）：
  A：@图片1，[一个疲惫的年轻女子，穿职业装]；
  B：@图片2，[一个上了年纪的男人，穿名贵西装]。
  0–2 秒｜冷开场：不铺垫，直接进——[她把一封辞职信拍在桌上]。镜头对 A 猛地推进的单人近景，脸放大。声音：拍桌那一下尖锐的现场音，然后一片死寂。
  2–8 秒｜对峙：A 说："[你早就知道。从头到尾。]"切到 B 的反应，再切回 A；张力一句一句往上顶，脸越绷越紧。镜头：干净的单人镜和反打单人镜，随着升温对每张脸缓慢推近。声音：对白和室内底噪，一条低频嗡鸣慢慢进来。
  8–12 秒｜悬念：[他把一张照片推到她面前，她僵住]——一个掀翻整场戏的反转，悬着不解。镜头定在她僵住的反应上，微微推近，切在表情正到一半的脸上。
  不解答，不加配乐重音，不要"未完待续"字卡。
  两人的脸、服装和座位关系全程一致。
negativePrompt: 狗血浮夸表演，瞪眼，哭喊，人物换脸，服装变化，左右互换，字幕，文字，水印
source:
  repo: jnMetaCode/ai-shortfilm-prompts
  url: https://github.com/jnMetaCode/ai-shortfilm-prompts/blob/main/templates/micro-drama.zh.md
  author: "jnMetaCode"
  license: MIT
  licenseUrl: https://github.com/jnMetaCode/ai-shortfilm-prompts/blob/main/LICENSE
  changes: "原文为 5 段式结构的中英混合模板，本站合并为一条可直接复制的中文提示词；{{变量}} 改为 [方括号变量]；增加 @图片1 / @图片2 人物参考写法"
imageBrief: 站长用两张虚构人物定妆图生成 1 条，截取"拍辞职信""对峙反打""僵住的脸"三帧。
verify:
  - Seedance 2.0 实测 3 次：正反打时两人是否被画混
---
**时长与镜头**：12 秒三幕：冷开场（2 秒）→ 对峙（6 秒）→ 悬念（4 秒）。短剧的生死在前 2 秒——观众随时会划走，所以"最炸的那一下"必须放在第一秒，而不是铺垫之后；结尾则相反，故意不给答案，切在一张"表情正到一半"的脸上，让人想看下一集。

**怎么填变量**：钩子 [她把一封辞职信拍在桌上] 换成"他把戒指摘下放在桌上""她当众撕掉了合同"；冲突台词换成一句把矛盾推上去的话；反转 [他把一张照片推到她面前] 换成"门口走进来一个本该在国外的人""她的手机屏幕亮起一条消息"。人物外貌只写描述、不用任何影视 IP。

**常见失败与调整**：
- 表演太狗血：保留"写实克制"，负面提示词写"瞪眼，哭喊"。
- 两人被画成一个人或左右互换：用两张差异明显的参考图，并写"A 始终在画面左侧"。
- 结尾模型自己"解答"了反转：写"在她僵住的一瞬间直接结束"。

> 改编自 [jnMetaCode/ai-shortfilm-prompts](https://github.com/jnMetaCode/ai-shortfilm-prompts/blob/main/templates/micro-drama.zh.md) 的实战范例（Copyright (c) 2026 jnMetaCode，MIT License）。
