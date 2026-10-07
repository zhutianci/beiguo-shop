---
title: seedance 提示词：地下洞穴的巨龙化石心跳了（暗黑奇幻悬念短片 · 15 秒四段 + 黑场）
slug: seedance-fossil-dragon-heartbeat-cave
model: seedance
topics: [cinematic]
modelLabel: Seedance 2.0
aspectRatio: "16:9"
needsRefImage: false
useCase: 写实暗黑奇幻悬念短片：两名探险者在地下洞穴里摸到巨龙化石，化石传出心跳、肋骨扩张、下颌张开、巨爪合拢，最后一声巨大的吸气后黑场。适合悬疑号、奇幻短片预告和"留钩子"的系列开头。
prompt: |
  15 秒写实真人质感的暗黑奇幻短片，16:9。两名探险者在一座巨大的[地下洞穴]里，发现一具嵌在岩石中的远古巨龙化石骨架，完整的头骨和巨大的肋骨清晰可见。真实的地质、头灯、灰尘、尺度感和人物动作。
  0–4 秒｜发现：远景，探险者走在高耸的化石肋骨下。其中一人把戴手套的手按在一根肋骨上比较大小。"咚"——一声低沉的心跳在整具骨架里回荡，两人僵住。
  4–8 秒｜又跳了：近景，手按在化石上。"咚"——更强了，所有骨头上的灰尘同时跳起来，探险者立刻缩回手。"咚"——巨龙的肋骨明显扩张了几厘米，像是几百年来第一次呼吸，然后落回。两人慢慢后退。
  8–12 秒｜苏醒：镜头推向巨大的头骨。又一声剧烈的心跳，小石块从头骨上掉落，它的下颌伴随低沉的摩擦声缓缓张开；空洞的眼窝深处，黑暗里有什么东西动了一下。
  12–15 秒｜悬念：远景，渺小的探险者站在骨架下。"咚"——整个洞穴都在震动，巨龙的化石前爪突然在石地上合拢。探险者抬头凝视，一声巨大的吸气在洞穴中回荡。切黑。
  声音：洞穴环境声，越来越强的心跳在骨头里共振，落下的砂砾，化石关节的摩擦声，最后一声巨大的呼吸。
  写实、符合物理。巨龙全程保持化石骨架状态——不长出血肉、不变形、没有魔法光效和火焰。只有两名探险者和一具骨架。
negativePrompt: 长出血肉，魔法光效，发光的眼睛，火焰，多余的肢体，多余的人物，CG 感，文字，水印
source:
  repo: YouMind-OpenLab/awesome-seedance-2-prompts
  url: https://x.com/DeCat2025/status/2104414219047166049
  author: "@DeCat2025"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；修正原文第二段时间码（0–8 秒 → 4–8 秒）；场景改为变量"
images:
  - 3638-seedance-fossil-dragon-heartbeat-cave-1.jpg
imageCredit:
  by: "@DeCat2025"
  url: https://x.com/DeCat2025/status/2104414219047166049
  license: CC BY 4.0
verify:
  - Seedance 2.0 实测 3 次，记录"心跳"声效与灰尘跳起是否同步
  - 确认原帖仍可访问
---
**时长与镜头**：15 秒四段 + 切黑：发现 → 心跳 → 苏醒 → 悬念。原作的结构是"同一个刺激（心跳）重复四次、每次升级一点"，这是悬疑片最经典的节奏：第一次让人怀疑、第二次确认、第三次升级、第四次爆发。

**写法要点**：①用拟声词"咚"标出节拍，模型会把声音和画面变化对齐；②结尾的约束句很关键——"全程保持化石状态、不长血肉、没有魔法光效"，否则模型很容易把化石"复活"成一条完整的龙，悬念就没了；③固定"两名探险者 + 一具骨架"的数量。

**怎么填变量**：[地下洞穴] 换成"沙漠考古现场""深海沉船舱""博物馆闭馆后的大厅"；巨龙可以换成"远古巨鲸""巨人石像""沉睡的机甲"。

**常见失败与调整**：
- 龙直接复活飞起来：保留结尾约束，并把"前爪合拢"作为最大的动作。
- 洞穴太暗什么也看不清：写"两盏头灯的光束和洞顶裂缝透下的微光"。
- 探险者数量变化：每段都写"两名探险者"。

> 改编自 [@DeCat2025](https://x.com/DeCat2025/status/2104414219047166049) 发布、[YouMind-OpenLab/awesome-seedance-2-prompts](https://github.com/YouMind-OpenLab/awesome-seedance-2-prompts) 收录的提示词，许可证 CC BY 4.0。

### 英文原版

```
15-second photorealistic live-action dark fantasy. Two explorers inside a vast underground cavern discover the enormous fossilized skeleton of an ancient dragon embedded in rock. The complete skull and massive rib cage are clearly visible. Realistic geology, headlamps, dust, scale and human movement.  

0–4s - DISCOVERY: Wide shot. The explorers walk beneath gigantic fossilized ribs towering over them. One places his gloved hand against a rib for scale.  THUMP.  A deep heartbeat reverberates through the entire skeleton.  Both explorers freeze.  

0–8s  IT BEATS AGAIN: Close shot on the hand touching the fossil.  THUMP.  Stronger.  Dust jumps from every bone simultaneously. The explorer immediately pulls his hand away.  THUMP.  The dragon’s huge rib cage visibly expands a few centimeters as if taking its first breath in centuries, then settles.  The explorers slowly back away.  

8–12s - WAKING: Camera tracks toward the enormous fossilized skull.  Another violent heartbeat.  Small rocks fall from the skull. Its lower jaw slowly opens with a deep grinding sound.  Inside the empty eye socket, something moves deep in the darkness.  

12–15s - CLIFF-HANGER: Wide shot with the tiny explorers beneath the skeleton.  THUMP.  The entire cavern shakes.  The dragon’s enormous fossilized front claw suddenly CLOSES against the stone floor.  The explorers stare upward.  A massive inhale echoes through the cavern.  

CUT TO BLACK.  Sound: cavern ambience, increasingly powerful heartbeats resonating through bone, falling grit, grinding fossilized joints, final enormous breath.  Photorealistic and physically grounded. The dragon remains a fossilized skeleton throughout - no flesh regeneration, transformation, magical glow or fire. Keep exactly two explorers and one consistent skeleton. Real bone weight, dust and rock interaction. No extra limbs, changing anatomy, glowing eyes, fantasy particles or CGI look.
```
