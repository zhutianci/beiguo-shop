---
title: seedance 提示词：雪山木屋冰怪来袭（惊悚动作短片 · 开场 1 秒抓人 · 15 秒压缩版）
slug: seedance-ice-monster-ski-lodge-horror
model: seedance
topics: [cinematic, short-drama]
modelLabel: Seedance 2.0
aspectRatio: "16:9"
needsRefImage: false
useCase: 学习"第一秒就抓住观众"的惊悚短片写法：窗户瞬间结霜碎裂、冰怪闯入、员工抄起火钳和热水反击、最后用火把它击碎。适合怪物惊悚短片、短剧开场和悬疑号素材。
prompt: |
  电影感惊悚动作短片，暴风雪中的[雪山滑雪度假村木屋]，开场立刻抓人，写实风格，运镜极具动感，约 15 秒，16:9。
  场景：温馨的木屋大厅，壁炉燃着火，大窗外雪花纷飞，客人们捧着热饮放松聊天。
  角色锁定：主角是一位木屋女员工，二十八九岁，穿[红色滑雪服]，每个镜头保持一致。
  冷色调、低饱和调色，全程真实的环境同期声，紧张配乐一开场就进入。
  0–1 秒：硬切——大落地窗从外面瞬间结霜，冰晶以不自然的速度爬满玻璃。
  1–3 秒：玻璃向内炸碎，一个由锯齿状冰块和霜晶构成的人形怪物跨进来，冷气中呼出白雾；壁炉边的客人惊呼着后退。
  3–6 秒：怪物走向最近的客人，碰到的东西都结上一层薄霜；客人踉跄后退，衣袖被擦过的地方结了霜，大厅陷入慌乱。
  6–9 秒：女员工从壁炉旁抓起火钳，挡在怪物和逃跑的客人之间，一钳砸中它的肩膀，冰面裂开一道缝。
  9–12 秒：另一名员工把一保温壶热水泼向怪物，命中处蒸汽爆开，冰明显变脆；女员工抓起壁炉里一根燃烧的木柴。
  12–15 秒：慢动作——她把燃烧的木柴挥向怪物胸口，裂纹瞬间遍布全身，怪物在慢动作中碎成四散的冰块和寒雾。她站在原地大口喘气，手里的木柴还冒着烟，雪花从破窗飘进来。
  人物服装与样貌全程一致，不出现血腥画面。
negativePrompt: 血腥，肢体断裂，角色前后不一致，脸部变形，多余的人物，文字，字幕，水印
source:
  repo: YouMind-OpenLab/awesome-seedance-2-prompts
  url: https://x.com/auqibhabib/status/2106235341548273915
  author: "@auqibhabib"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文为 26 秒、按秒拆分的英文长脚本，本站译为中文并压缩为 15 秒六段，保留开场钩子、反击三步和碎裂结局；场景与主角服装改为变量；补充\"不出现血腥画面\""
images:
  - 3629-seedance-ice-monster-ski-lodge-horror-1.jpg
imageCredit:
  by: "@auqibhabib"
  url: https://x.com/auqibhabib/status/2106235341548273915
  license: CC BY 4.0
verify:
  - Seedance 2.0 实测 3 次，记录开场 1 秒"窗户结霜碎裂"的钩子是否成立
  - 多人奔逃场面的人物畸形情况
  - 确认原帖仍可访问
---
**时长与镜头**：原作是 26 秒、每秒一个动作的超细脚本，单条生成放不下，本站压缩成 15 秒六段。原作最值得学的是开场：0–1 秒就给出异常（窗户结霜），1–3 秒怪物登场，不做任何铺垫——短视频观众前 2 秒决定要不要划走。

**怎么用**：想要完整的 26 秒版本，可以拆成两条：第一条"闯入 + 第一次反击"（0–12 秒），第二条以第一条最后一帧作首帧，接着生成"热水 + 燃烧木柴 + 碎裂"。Seedance 2.0 支持上传视频作参考，也可以把第一条作为 @视频1 让第二条延续风格。

**怎么填变量**：[雪山滑雪度假村木屋] 可换成"深夜便利店""海边灯塔"，怪物也随之换成"水做的怪物（被吹风机打败）""影子怪物（被灯光打败）"——核心是"怪物有一个可被日常物品克制的弱点"，这让剧情有爽点。

**常见失败与调整**：
- 客人群戏人脸崩坏：把客人放在虚化的背景里，镜头主要跟主角。
- 怪物像穿着冰甲的人：写"没有人类五官，整体是半透明的冰晶结构"。
- 结尾碎裂太像爆炸：写"像玻璃一样碎裂，冰块落地后迅速融化"。

> 改编自 [@auqibhabib](https://x.com/auqibhabib/status/2106235341548273915) 发布、[YouMind-OpenLab/awesome-seedance-2-prompts](https://github.com/YouMind-OpenLab/awesome-seedance-2-prompts) 收录的提示词，许可证 CC BY 4.0。

### 英文原版（原文较长，此处节选）

```
Cinematic horror-thriller short film set at a mountain ski resort lodge during a snowstorm, opens with an immediate hook, grounded realistic style, maximum dynamic camera work. Setting: a cozy wooden lodge interior with a fireplace, large windows looking out to falling snow, guests relaxing with hot drinks. CHARACTER LOCK: the main character is a lodge staff member, a woman in her late 20s, red ski jacket, consistent in every shot. Muted cold-toned color grading, natural diegetic sound throughout, tension score entering immediately.
>
> **[0-1s]** Hard cut: the large lodge window frosts over instantly from outside, ice crystals spreading unnaturally fast across the glass.
>
> **[1-2s]** It shatters inward, a humanoid creature of jagged ice and frost crystal stepping through, breath visible as steam in the sudden cold.
>
> **[2-3s]** Nearby guests gasp, backing away from their tables near the fireplace.
>
> **[3-4s]** It moves toward the nearest guest, a thin layer of frost spreading across anything it touches.
>
> **[4-5s]** He stumbles back, his sleeve frosting over where it brushed him.
>
> **[5-6s]** Panic spreads through the lodge, guests scrambling toward the far end of the room.
>
> **[6-7s]** The staff member grabs a fire poker from beside the fireplace, stepping between the creature and the fleeing guests.
>
> **[7-8s]** It turns toward her, crystalline features catching the firelight.
>
> **[8-9s]** She swings the poker; it connects, a crack splintering across its icy shoulder.
>
> **[9-10s]** It recoils, frost receding slightly from the point of impact.
>
> **[10-11s]** A second staff member grabs a thermos of hot water, flinging it directly at the creature.
>
> **[11-12s]** Steam erupts where the water hits, the ice visibly weakening at the contact point.
>
> **[12-13s]** It staggers, momentarily destabilized, frost patterns flickering across its form.
>
> **[13-14s]** The staff member presses the advantage, striking again with the poker.
>
> **[14-15s]** Wide shot: guests reach the far hallway, a few glancing back in fear.
>
> **[15-16s]** The creature lunges toward her, icy claws reaching out.
>
> **[16-17s]** She ducks low, narrowly avoiding the strike, rolling toward the fireplace.
>
> **[17-18s]** She grabs a burning log directly from the fire with gloved hands.
>
> **[18-19s]** SLOW MOTION insert: she swings it in an arc toward the creature's chest.
>
> **[19-20s]** Contact sends a shockwave of cracking ice through its entire body.
>
> **[20-21s]** It freezes mid-motion, fractures spreading rapidly across its crystalline form.
>
……
```
