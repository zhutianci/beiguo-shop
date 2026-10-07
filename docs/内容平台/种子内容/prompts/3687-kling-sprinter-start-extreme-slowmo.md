---
title: 可灵提示词：运动慢动作模板（短跑起跑蹬地 · 汗珠悬停 · 实时—极慢—缓出三拍）
slug: kling-sprinter-start-extreme-slowmo
model: kling
topics: [cinematic, product-video]
aspectRatio: "16:9"
needsRefImage: false
useCase: 把运动中"决定性的一瞬间"冻结成极慢动作：短跑选手起跑前的张力、蹬地爆发时汗珠悬停、最后缓回实时。换掉项目即可，适合运动品牌广告、体育赛事预热、健身房宣传。
prompt: |
  高速摄影慢动作运动片段，决定性瞬间的细节，自然场地光，有血有肉的发力；写实，不要游戏引擎回放感。约 10 秒，16:9。
  人物：[起跑器上的短跑选手]；场地：[黄昏泛光灯下的体育场跑道]；色调：[冷白泛光灯加暖肤色]。
  0–2 秒｜蓄势（实时）：选手就位、静止、急促喘息，每块肌肉都绷紧；镜头朝发力点缓慢推近。声音：呼吸声，逐渐收紧的人群嗡鸣。
  2–7 秒｜决定性瞬间（极慢动作）：[起跑器上爆发的第一蹬]炸开，但以极慢动作呈现——[汗珠从眉梢甩出、肌肉紧绷]悬停在空中，衣服布料波动，身体的全部力量逐帧读出；镜头跟住动作，焦点锁在细节上。声音：被时间拉长的冲击声和喘息，一切都被拉伸、变得沉重。
  7–10 秒｜释放（缓出）：动作完成，最后一滴汗落下；镜头定住，速度缓缓回到实时。
  不要胜利怒吼，不要英雄站姿，不要光晕；只有用尽全力的身体，和最后那滴汗落地。
negativePrompt: 游戏回放感，CG 感，肢体畸形，多余的肢体，品牌标志，文字，水印
source:
  repo: jnMetaCode/ai-shortfilm-prompts
  url: https://github.com/jnMetaCode/ai-shortfilm-prompts/blob/main/templates/sports-slowmo.zh.md
  author: "jnMetaCode"
  license: MIT
  licenseUrl: https://github.com/jnMetaCode/ai-shortfilm-prompts/blob/main/LICENSE
  changes: "原文为 5 段式结构的中英混合模板，本站合并为一条可直接复制的中文提示词；{{变量}} 改为 [方括号变量]"
imageBrief: 站长生成 1 条，截取"起跑前""汗珠悬停""最后一滴汗"三帧。
verify:
  - 可灵实测 3 次：极慢动作段肢体是否保持正确结构
---
**时长与镜头**：10 秒三拍：实时蓄势 → 极慢动作爆发 → 缓回实时。慢动作的冲击力来自"速度对比"：前 2 秒用实时建立张力，中间突然放慢，最后再缓回来，观众才会感到"时间被拉长了"。可灵 5 秒档建议只做中间那一拍。

**怎么填变量**：[起跑器上的短跑选手] 和动作一起换，例如"拳击手 / 拳头命中沙袋 / 汗水如帘幕甩出""游泳运动员 / 入水瞬间 / 水花皇冠""攀岩者 / 抓住岩点 / 镁粉爆开""滑板手 / 翻板 / 布料飘起"。运动品牌广告可以把鞋、服装写得具体一些，必要时上传产品图。

**常见失败与调整**：
- 慢动作段四肢扭曲：让镜头聚焦局部（脚、手臂、脸），少拍全身。
- 没有慢动作效果：写"每秒只前进一点点，汗珠几乎静止在空中"。
- 结尾模型加了欢呼庆祝：保留"不要胜利怒吼"。

> 改编自 [jnMetaCode/ai-shortfilm-prompts](https://github.com/jnMetaCode/ai-shortfilm-prompts/blob/main/templates/sports-slowmo.zh.md) 的实战范例（Copyright (c) 2026 jnMetaCode，MIT License）。
