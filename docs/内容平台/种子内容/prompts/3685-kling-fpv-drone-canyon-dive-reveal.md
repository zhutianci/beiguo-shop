---
title: 可灵提示词：FPV 穿越机航拍模板（贴地起飞—俯冲穿过岩缝—拉升揭露全景 · 一镜到底）
slug: kling-fpv-drone-canyon-dive-reveal
model: kling
topics: [cinematic]
aspectRatio: "16:9"
needsRefImage: false
useCase: 刺激的 FPV 穿越机一镜到底：贴地高速掠过、俯冲穿过狭窄的岩缝、再拉升豁然看到辽阔全景。换掉地点即可，适合文旅宣传片开场、户外运动、地产项目的航拍段落。
prompt: |
  FPV 穿越机飞行，航拍尺度与速度，自然光，一镜到底；写实质感，不要游戏引擎穿越感。约 10 秒，16:9。
  地点：[一道深红岩峡谷，谷底有河]；光线：[低角度的金色日出，长影，薄雾]。
  0–3 秒｜起飞贴地：无人机贴着地面快速掠过，紧贴表面飞行，让速度被读出来；超广角，果断地向前冲。
  3–7 秒｜穿越：低空俯冲并穿过[岩壁间的一道狭缝]，岩壁和边缘贴着镜头飞速掠过，这种贴近就是刺激所在；连续不切镜，轻微的广角畸变，最快的一段带一点微抖。风声呼啸渐强。
  7–10 秒｜拉升揭露：无人机拉升、飞出，豁然揭露[日出时展开的辽阔山谷]，尺度一下子全部铺开；平滑地爬升，世界豁然开朗。
  结尾：没有片名、没有 logo、没有转圈环绕；全景停住，无人机稳下来，风声向外散开。
negativePrompt: 游戏引擎画面，CG 感，剪辑切镜，撞墙，画面撕裂，过饱和，文字，水印
source:
  repo: jnMetaCode/ai-shortfilm-prompts
  url: https://github.com/jnMetaCode/ai-shortfilm-prompts/blob/main/templates/drone-fpv.zh.md
  author: "jnMetaCode"
  license: MIT
  licenseUrl: https://github.com/jnMetaCode/ai-shortfilm-prompts/blob/main/LICENSE
  changes: "原文为 5 段式结构的中英混合模板，本站合并为一条可直接复制的中文提示词；{{变量}} 改为 [方括号变量]"
imageBrief: 站长生成 1 条，截取"贴地掠过""穿过岩缝""拉升全景"三帧。
verify:
  - 可灵实测 3 次：10 秒一镜到底是否出现切镜；穿越岩缝时是否"撞墙"
---
**时长与镜头**：10 秒一镜到底三段：贴地确立速度 → 穿越制造刺激 → 拉升给出回报。FPV 的爽感来自"先近后远"：前面越贴近地面和岩壁，最后拉升时的开阔感越震撼。可灵选 5 秒时，直接从"穿越"开始，接"拉升揭露"。

**怎么填变量**：[一道深红岩峡谷] 换成"海崖小镇""摩天楼之间""林间瀑布"；[岩壁间的一道狭缝] 换成"一座拱门""一段桥下""一排树线之间"；揭露的全景换成"城市天际线""开阔海面""连绵雪山"；光线换成"蓝调时刻""暴风雨前的光"。

**常见失败与调整**：
- 中途切了镜头：保留"连续不切镜""一镜到底"，负面提示词写"剪辑切镜"。
- 穿越时撞上岩壁或画面糊成一片：把狭缝写宽一点，或降低速度描述。
- 像游戏过场：负面提示词保留"游戏引擎画面"，并加"运动相机实拍质感"。

> 改编自 [jnMetaCode/ai-shortfilm-prompts](https://github.com/jnMetaCode/ai-shortfilm-prompts/blob/main/templates/drone-fpv.zh.md) 的实战范例（Copyright (c) 2026 jnMetaCode，MIT License）。
