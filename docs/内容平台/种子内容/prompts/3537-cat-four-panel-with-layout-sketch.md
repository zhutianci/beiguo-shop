---
title: "ai四格漫画提示词：上传角色图和编号分格草图，按编号填剧情（Nano Banana）"
slug: cat-four-panel-with-layout-sketch
model: nano-banana
topics: [comic]
modelLabel: Nano Banana Pro
aspectRatio: "3:4"
needsRefImage: true
useCase: "想自己决定漫画怎么分格时用：上传一张角色图和一张写了编号的分格草图，再按编号写剧情，模型照草图的格子形状排版并把每段剧情画进对应的格子。示例是三花猫想喝抹茶拿铁的四格小故事。"
prompt: |
  画一页日式四格故事漫画。
  参考图用法：图 1 是主角，[一只三花猫]，全篇只有它一个角色，花色和脸要与图 1 一致；图 2 是分格草图，每个格子里写着编号，请完全照图 2 的格子形状、大小和位置来分格，再按编号把下面的剧情依次放进去。成品里不要保留草图上的编号数字。
  剧情（编号对应草图上的格子）：
  1. 主角端坐着，头顶一个想象气泡，里面是一杯[抹茶拿铁]。心声气泡："[好想喝抹茶拿铁喵。]"
  2. 主角闭着眼叹气，一脸嫌麻烦。心声气泡："[专门跑去买又有点麻烦……]"
  3. 主角眼睛一亮，头边冒出一个小灯泡，想象气泡里是一台自动售货机。对白框："[对了，附近的售货机有卖！]"
  4. 主角站在自动售货机旁，笑眯眯地举着一罐[抹茶拿铁]。对白框："[这里有卖，得救了喵！]"
  画风：线条圆润的可爱彩色漫画，偏粗的深色描边，平涂上色，背景是简单的纯色或淡色块，如浅黄、浅蓝；粗黑的分格线，格与格之间留白。
  文字：全部用简体中文，写在心声气泡或对白框里，字要大、清晰可读；除这四句外不要其他文字。售货机里的饮料不要画出真实品牌。
  画幅：竖版 3:4。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-nano-banana-pro-prompts
  url: https://x.com/xoMushinxo/status/1997654692856283497
  author: "@xoMushinxo"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文只有三四句话，译为中文后按示例图补充了每格的画面、气泡类型、画风和文字要求；角色、想要的东西、四句台词设为变量；原文的一段连写剧情拆成按编号的四条；补充\"成品不保留草图编号\"\"饮料不画真实品牌\"。"
images:
  - 3537-cat-four-panel-with-layout-sketch-1.jpg
imageCredit:
  by: "@xoMushinxo"
  url: https://cdn.gooo.ai/cms/1765421966474_1845na_G7kU6Y9aQAAiFma.jpg
  license: CC BY 4.0
verify:
  - "上线前在 Nano Banana 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：要上传两张图。图 1 是角色，宠物照片、吉祥物、原创角色都行；图 2 是自己画的分格草图——白纸上用黑线画几个框，每个框里写上编号，手绘即可。[一只三花猫] 写角色是什么，[抹茶拿铁] 是它想要的东西，四句引号里的话是台词，每句不超过 14 个字。格子不限四个，草图画几格就写几条剧情。

示例图是日文版：最上面的横向大格里，圆脸三花猫端坐着，想象气泡里是一杯抹茶拿铁；中间并排两格，右格的猫闭眼叹气，左格的猫眼睛一亮、身旁亮起小灯泡；最下面的大格里，猫站在售货机旁举着一罐绿色饮料眯眼笑。中间两格按日式漫画从右往左读。

**常见问题**：
- 没按草图分格：草图线条画粗一些，并补一句格子的排法，如"上面一大格、中间左右两格、下面一大格"。
- 中间两格顺序反了：想从左往右读，就在草图上把 2 写在左格，并注明"从左到右阅读"。

**适合**：宠物账号的日常小漫画、吉祥物四格、想自己控制分格节奏的漫画练习。

### 日文原版

```text
A Japanese 4-panel story. The cat in Image 1 is the character. Image 2 is the panel layout. Assign the story according to the numbers on the panels.
I want to drink matcha latte, meow. It's a bit hard to go buy it... Oh, right, they sell it in the nearby vending machine!! I'm saved that they sell it here, meow!!
```

> 改编自 [@xoMushinxo](https://x.com/xoMushinxo/status/1997654692856283497) 发布、[YouMind-OpenLab/awesome-nano-banana-pro-prompts](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
