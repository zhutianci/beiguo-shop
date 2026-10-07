---
title: veo 3 提示词：迷雾森林发现巨大爪痕（徒步者两句惊恐对白 · 悬疑短片开场）
slug: veo-misty-forest-claw-marks-suspense
model: veo
topics: [short-drama, cinematic]
modelLabel: Veo 3.1
aspectRatio: "16:9"
needsRefImage: false
useCase: 悬疑 / 冒险短片的开场：两名疲惫的徒步者在雾气弥漫的森林里，男人突然停下盯着一棵树，特写树皮上新鲜的深爪痕，两人一问一答，四周只有树枝断裂和一声鸟鸣。适合悬疑短剧开头、户外探险题材、学习"台词 + 动作提示 + 环境声"写法。
prompt: |
  远景：一片雾气弥漫的[太平洋西北部原始森林]，16:9，约 8 秒。
  两名精疲力竭的徒步者——一男一女——拨开蕨类植物往前走，男人突然停住，盯着一棵树。
  特写：树皮上被抓出了新鲜的、深深的爪痕。
  男人（手按在腰间的猎刀上）："[这不是普通的熊。]"
  女人（声音因恐惧而发紧，扫视着四周的树林）："[那会是什么？]"
  声音：粗糙的树皮，树枝断裂的声音，脚踩在潮湿泥土上的声音，一只孤零零的鸟叫了一声。
negativePrompt: 背景音乐，怪物出现，血腥，字幕，文字，人物畸形，水印
source:
  repo: Gemini API 文档：Veo 3.1 视频生成
  url: https://ai.google.dev/gemini-api/docs/veo
  author: "Google"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "官方英文示例译为中文；地点与两句台词设为变量；补充时长与画幅、负面提示词"
imageBrief: 站长生成 1 条，截取"森林远景""爪痕特写""女人扫视四周"三帧。
verify:
  - Veo 3.1 实测 3 次：远景 → 特写的切换是否出现、两句台词是否由对应人物说出
---
**时长与镜头**：8 秒，"远景 → 特写 → 两句对白"。注意示例里直接写了"特写："，Veo 会理解为一次镜头切换；用"远景 / 特写 / 中景"这类景别词开头写段落，是在单条视频里做简单剪辑的最省事办法。

**官方写法要点**：这是 Gemini API 文档里"更多细节（对白 + 环境声）"那一档示例。两个值得学的细节：①台词前用括号写"表演提示"——"（手按在腰间的猎刀上）""（声音因恐惧而发紧，扫视着四周）"，模型会据此安排动作和语气；②结尾一句列出所有环境声，把"恐惧"留给声音来营造，画面里不需要出现怪物。

**怎么填变量**：[太平洋西北部原始森林] 可以换成"大兴安岭的雪林""雨后的竹海""废弃矿区"；两句台词换成你的剧情，保持"一句发现 + 一句追问"的结构，悬念就留住了。

**常见失败与调整**：
- 模型自作主张画出了怪物：负面提示词写"怪物出现"，并保持"只看到爪痕"。
- 两人的台词口型对不上：每句控制在 6–8 个字，并在台词前写清是谁说。
- 远景里的人太小看不清：改成"中远景"。

> 改编自 Gemini API 官方文档《[Generate videos with Veo 3.1](https://ai.google.dev/gemini-api/docs/veo)》中的示例提示词，许可证 CC BY 4.0。

### 英文原版

```
A wide shot of a misty Pacific Northwest forest. Two exhausted hikers, a man and a woman, push through ferns when the man stops abruptly, staring at a tree. Close-up: Fresh, deep claw marks are gouged into the tree's bark. Man: (Hand on his hunting knife) "That's no ordinary bear." Woman: (Voice tight with fear, scanning the woods) "Then what is it?" A rough bark, snapping twigs, footsteps on the damp earth. A lone bird chirps.
```
