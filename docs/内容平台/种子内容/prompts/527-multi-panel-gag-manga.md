---
title: AI 漫画提示词（nano banana）：一句话生成多格搞笑漫画，自定标题、剧情和台词
slug: multi-panel-gag-manga
model: nano-banana
topics: [comic, illustration]
needsRefImage: false
aspectRatio: "4:3"
useCase: 做公众号 / 小红书段子漫画、产品吐槽漫画、课堂上的趣味故事时，只给一个"梗"和一句关键台词，nano banana 会自己分镜、配对白和拟声词，生成一整页多格漫画。
prompt: |
  [8]格漫画，标题：《[一款叫"人生"的复古游戏]》。
  剧情：主角兴冲冲地开始玩这款游戏，结果一开局就被各种离谱的事情秒杀，他大喊"[这也太坑了吧！]"，愤怒地按下了重置键——可重新开始后，一切又从头来过，什么都没变，最后他瘫在床上无奈吐槽。
  要求：
  - 分镜有起承转合，最后一格要有反转或无奈的笑点；
  - 每格都有对话气泡和拟声词，所有文字使用[简体中文]，字要清晰可读；
  - 同一个主角的发型、衣服在每一格保持一致；
  - 画风：[彩色日式搞笑漫画]，表情夸张，线条干净。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-nano-banana-pro-prompts
  url: https://x.com/NOBU79834619/status/2074602867470766572
  author: "@NOBU79834619"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 原文只有三行（格数、"一款叫'世界'的复古游戏"、一句台词）；本站译成中文，把梗扩写成完整剧情，补充分镜、对话气泡、角色一致性和画风要求，格数、标题、台词、文字语言、画风均设为变量
images:
  - 527-multi-panel-gag-manga-1.jpg
imageCredit:
  by: "@NOBU79834619"
  url: https://x.com/NOBU79834619/status/2074602867470766572
  license: CC BY 4.0
verify:
  - 示例图中的游戏机外形接近某款经典家用游戏机，确认是否介意（不涉及游戏角色）
  - 实测简体中文对话气泡的错字率，以及 8 格时字是否太小
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么用**：最省事的写法是只改三处——格数、标题、关键台词，剧情让模型自己发挥；想要可控就把"剧情"那一段换成你自己的故事梗概。示例图是原作者的日文版"名为'世间'的复古游戏"：主角插卡、开机、瞬间 Game Over、怒按重置，最后发现重置了也什么都没变，一共画成了 12 格（模型会自行增减格数，需要准确格数时请强调）。

**变量建议**：
- 格数：4 格最稳（适合"四格漫画"），6–8 格能讲更完整的小故事，超过 8 格字会变小。
- 画风：可写"黑白日漫网点风""韩系条漫""美式卡通""简笔火柴人"。
- 题材：打工人日常、产品使用前后对比、宠物视角、学科知识小剧场都很适合。

**常见问题**：
- 中文对白出错：每格台词控制在 10 个字以内，或者在提示词里把每格台词逐条写好。
- 主角每格长得不一样：先生成一张角色设定图，再上传并写"主角严格按参考图"。
- 笑点不好笑：在"剧情"里把最后一格的反转写明白，模型只负责画。

**适合**：段子漫画、品牌趣味内容、教学插图、社群活动海报。

### 英文原版

仓库收录的英文译文（原帖为日文）：

```
8-panel manga
A retro game called 'The World'
{argument name="dialogue" default="Yikes! This is a total ultra-super-special crap game!"} I pressed the reset button.
```

> 改编自 [@NOBU79834619](https://x.com/NOBU79834619/status/2074602867470766572) 发布、[YouMind-OpenLab/awesome-nano-banana-pro-prompts](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)。
