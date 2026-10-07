---
title: veo 3 提示词：霓虹雨夜都市漫游模板（贴地缓推 · 坏掉的灯管 · 人影消融进人群）
slug: veo-neon-rain-city-drift-walk
model: veo
topics: [cinematic]
modelLabel: Veo 3.1
aspectRatio: "16:9"
needsRefImage: false
useCase: 赛博朋克氛围镜头的骨架：沿着被雨水浸透的霓虹街市缓慢推进，经过一块坏了一根灯管的闪烁招牌，一个兜帽人影作为剪影经过、最后消融在人群里。适合 MV、科幻短片转场、游戏宣传和视频背景。
prompt: |
  霓虹赛博朋克大都会，雨夜漫游，体积感薄雾，低饱和的墨绿底色加霓虹点缀；氛围写实，不要游戏 CG 城市，不要干净的渲染感。16:9，约 8 秒。
  城市：[密集的东亚霓虹街边市集]；天气：[持续的冷雨、体积感薄雾]；霓虹配色：[品红加青，压在墨绿底色上]；人物：[一个孤身戴兜帽的人影]。
  0–3 秒｜进入：沿街缓慢向前推进的轨道镜头，雨水划过画面，霓虹在湿镜头上拖出晕染；镜头压低，倒影引着视线往街道深处走。声音：雨声和远处车流，近处霓虹灯管的嗡鸣。
  3–6 秒｜穿行：经过一块闪烁的霓虹招牌（其中一根灯管已经坏了），蒸汽横穿画面，兜帽人影作为剪影经过；水洼倒影随着脚步荡起涟漪。污渍和磨损接住光——有人生活过的质感。
  6–8 秒｜消融：人影融进流动的人群，消失了；街道不为谁停下，继续流动。镜头继续漂移，不停在那个人影上。
  没有揭示，没有主角回头，没有标题；只有招牌再闪一次，雨继续落在这条街上。
negativePrompt: 游戏 CG 城市，干净渲染，乱码招牌文字，人物回头看镜头，过饱和，水印
source:
  repo: jnMetaCode/ai-shortfilm-prompts
  url: https://github.com/jnMetaCode/ai-shortfilm-prompts/blob/main/templates/cyberpunk-city.zh.md
  author: "jnMetaCode"
  license: MIT
  licenseUrl: https://github.com/jnMetaCode/ai-shortfilm-prompts/blob/main/LICENSE
  changes: "原文为 5 段式结构的中英混合模板（约 10 秒），本站合并为一条可直接复制的中文提示词并压缩为适合 Veo 单条的 8 秒；{{变量}} 改为 [方括号变量]"
imageBrief: 站长生成 1 条，截取"湿镜头霓虹""坏灯管招牌""人影消失"三帧。
verify:
  - Veo 3.1 实测 3 次：招牌是否出现乱码文字（建议写"招牌只是图形和色块"）
---
**时长与镜头**：8 秒三段：进入 → 穿行 → 消融。这条是"纯氛围"镜头：没有剧情、没有主角，靠雨、雾、霓虹倒影和一根坏掉的灯管撑起整个画面。坏灯管、污渍、磨损这类"不完美"的细节，是让赛博城市看起来像真的有人住、而不是游戏贴图的关键。

**怎么填变量**：[密集的东亚霓虹街边市集] 换成"野兽派企业大楼之间的峡谷""被水淹的后巷"；天气换成"飘散的酸雾""落灰"；配色换成"钠光橙加绿""冷蓝加红"；人物换成"一个骑车的快递员"或干脆不要人。做 MV 时可以把镜头放慢，正好做副歌前的过渡。

**常见失败与调整**：
- 招牌出现大量乱码汉字：写"招牌只是霓虹图形和色块，没有可读文字"。
- 画面太干净像渲染图：保留"污渍和磨损""湿镜头晕染"。
- 人影回头看镜头：保留"没有主角回头"。

> 改编自 [jnMetaCode/ai-shortfilm-prompts](https://github.com/jnMetaCode/ai-shortfilm-prompts/blob/main/templates/cyberpunk-city.zh.md) 的实战范例（Copyright (c) 2026 jnMetaCode，MIT License）。
