---
title: veo 3 提示词：宇航员太空行走模板（安全绳漂浮 · 脚下地球晨昏线 · 真空静默）
slug: veo-astronaut-spacewalk-silent-vista
model: veo
topics: [cinematic]
modelLabel: Veo 3.1
aspectRatio: "16:9"
needsRefImage: false
useCase: 硬科幻风格的太空镜头：系着安全绳的宇航员在空间站外缓缓漂移、伸手去够扶手，脚下是地球的弧线和晨昏分界线，只有头盔里的呼吸声。换掉场景即可，适合科幻短片、科普视频、航天主题宣传。
prompt: |
  硬科幻太空，失重物理，宏大尺度，克制的真空静默；照片级的航天实拍写实感，不要游戏过场动画感。16:9，约 8 秒。
  主体：[一名系着安全绳的宇航员]；动作：[漂移、伸手去够扶手]；背景：[脚下地球的弧线与晨昏分界线]。
  磨损细节：[磨花的宇航服、满是细小划痕的面罩反光]；光线：[强烈的低角度阳光、深黑的阴影]。
  0–3 秒｜漂移：宇航员衬着地球缓缓漂移，安全绳和线缆漂浮着；在这样的尺度前显得渺小、脆弱。镜头缓慢环绕漂移。声音：只有头盔里的呼吸，舱外是浩大的静默。
  3–6 秒｜那一刻：伸手的动作以真实的失重物理展开——缓慢伸手，惯性带着身体走，一次克制的姿态修正；镜头延续漂移，宇航员在画面里保持很小。声音：呼吸加快，一声无线电噼啪，一记闷闷的金属钝响。
  6–8 秒｜静止：宇航员稳住，地球在下方缓缓转动；镜头定住，失重漂浮。
  没有爆炸，没有激昂配乐，没有英雄转身看镜头；只是一个渺小的身影、那片静默，和一颗缓缓转动的行星。
negativePrompt: 爆炸，激昂配乐，露出人脸，宇航服变形，游戏过场动画，卡通，文字，水印
source:
  repo: jnMetaCode/ai-shortfilm-prompts
  url: https://github.com/jnMetaCode/ai-shortfilm-prompts/blob/main/templates/sci-fi-space.zh.md
  author: "jnMetaCode"
  license: MIT
  licenseUrl: https://github.com/jnMetaCode/ai-shortfilm-prompts/blob/main/LICENSE
  changes: "原文为 5 段式结构的中英混合模板（约 10 秒），本站合并为一条可直接复制的中文提示词并压缩为适合 Veo 单条的 8 秒；{{变量}} 改为 [方括号变量]"
imageBrief: 站长生成 1 条，截取"漂移远景""伸手够扶手""稳住"三帧。
verify:
  - Veo 3.1 实测 3 次：失重运动是否自然（不像在水里游泳或在地面走路）
---
**时长与镜头**：8 秒三段：漂移 → 伸手 → 稳住。太空镜头的震撼来自"渺小"和"静默"：人物在画面里要小，背景要大；声音只有头盔里的呼吸和偶尔的无线电，真空里没有声音——反而比任何配乐都紧张。本站另有一条"太空站崩塌逃生"的高强度动作镜头，这条正好是它的反面：安静、缓慢、写实。

**怎么填变量**：主体换成"一艘正在对接的飞船""一座废弃的空间站"；动作换成"脱离对接""缓慢自旋""舱外维修"；背景换成"一颗气态巨行星""一片小行星带""深空星场"；磨损细节换成"用旧的船体板、喷逸的冰晶、微陨石坑"。

**常见失败与调整**：
- 宇航员像在游泳：写"没有划水动作，只靠惯性缓慢移动"。
- 出现爆炸或火光：负面提示词保留"爆炸"。
- 面罩里露出人脸并变形：写"面罩是反光的金色，看不见脸"。

> 改编自 [jnMetaCode/ai-shortfilm-prompts](https://github.com/jnMetaCode/ai-shortfilm-prompts/blob/main/templates/sci-fi-space.zh.md) 的实战范例（Copyright (c) 2026 jnMetaCode，MIT License）。
