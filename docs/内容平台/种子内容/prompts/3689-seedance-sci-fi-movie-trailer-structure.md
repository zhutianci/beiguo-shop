---
title: seedance 提示词：电影预告片模板（安静建场—引爆点—快切升级—硬切黑场 · 六镜头节奏）
slug: seedance-sci-fi-movie-trailer-structure
model: seedance
topics: [cinematic, short-drama]
modelLabel: Seedance 2.0
aspectRatio: "16:9"
needsRefImage: false
useCase: 标准的电影预告片节奏骨架：安静的长镜头建场 → 主角近景 → 第一个不对劲的迹象 → 越来越短的快切 → 一记硬切黑场 → 标题。换掉世界观和威胁，就能做短片预告、游戏 / 小说宣传片。
prompt: |
  电影感预告片，层层升级的多镜头蒙太奇，全片锁定一种胶片色调，由声音设计驱动；克制的揭示，没有俗套旁白，没有频闪硬切。16:9，约 15 秒。
  世界：[一座被海水淹没的近未来沿海城市]；主角：[一名孤身的潜水工程师]；威胁：[水下某个庞然大物正在移动]；色调：[去饱和的钢蓝调]。
  镜头 1｜建场（长镜头，安静）：城市的宽景，缓慢推进，几近静止，只有微弱的环境声。暴风雨前的平静。
  镜头 2｜主角（近景）：紧贴主角的脸，一闪而过的不安；一个遥远的低沉声音开始响起。
  镜头 3｜引爆点：中景，有什么不对劲——水面晃动、一盏灯熄灭、一个读数飙升；次声开始抬升。
  镜头 4–5｜升级：一对急促的快切：运动、反应、威胁的惊鸿一瞥（绝不完整露出）；镜头更躁动，低频继续爬升。
  镜头 6｜硬切黑场：在最后一个动作上一记重击，切黑；一拍静默。
  不要主角金句，不要旁白，不要爆炸蒙太奇；只有切黑和最后一记声音。片名后期添加。
negativePrompt: 怪物完整现身，旁白，频闪，过饱和，字幕，文字，乱码片名，水印
source:
  repo: jnMetaCode/ai-shortfilm-prompts
  url: https://github.com/jnMetaCode/ai-shortfilm-prompts/blob/main/templates/movie-trailer.zh.md
  author: "jnMetaCode"
  license: MIT
  licenseUrl: https://github.com/jnMetaCode/ai-shortfilm-prompts/blob/main/LICENSE
  changes: "原文为 5 段式结构的中英混合模板，本站合并为一条可直接复制的中文提示词；{{变量}} 改为 [方括号变量]；原文结尾让模型淡入一个单词片名，本站改为片名后期添加（避免乱码）"
imageBrief: 站长生成 1 条，截取"安静建场""主角近景""威胁一瞥"三帧。
verify:
  - Seedance 2.0 实测 3 次：15 秒内六个镜头的节奏是否"由慢到快"
---
**时长与镜头**：约 15 秒六个镜头，节奏由慢到快：第一个镜头最长、最安静，越往后切得越短，最后一记重击切黑。预告片的情绪几乎全靠声音推动：环境声 → 低沉声 → 次声抬升 → 越来越响 → 切黑后的静默，提示词里每个镜头都写了声音的变化，这是这套模板的精髓。

**怎么填变量**：世界换成"一处冰封的边境殖民地""一座停电的超级城市"；主角换成"一个疲惫的侦探""一个拿着奇怪装置的孩子"；威胁换成"不断蔓延的大停电""逼近的风暴墙"——关键是"绝不完整揭示"，观众看到的永远只是迹象。色调换成"琥珀尘黄""病态绿"。

**常见失败与调整**：
- 怪物完整现身：负面提示词写"怪物完整现身"，并在镜头 4–5 写"只露出一部分轮廓或影子"。
- 节奏平均没有升级：在镜头 4–5 写"每个镜头不到 1 秒"。
- 结尾冒出乱码标题：保留"片名后期添加"。

> 改编自 [jnMetaCode/ai-shortfilm-prompts](https://github.com/jnMetaCode/ai-shortfilm-prompts/blob/main/templates/movie-trailer.zh.md) 的实战范例（Copyright (c) 2026 jnMetaCode，MIT License）。
