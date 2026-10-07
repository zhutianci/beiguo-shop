---
title: "AI做系列PPT提示词：一次生成 10 页风格统一的介绍型幻灯片（夏季果蔬示例）（gpt-image-2）"
slug: ppt-series-consistent-slides
model: gpt-image-2
topics: [ppt]
aspectRatio: "16:9"
needsRefImage: false
useCase: "一句主题让 gpt-image-2 连续生成一整套 16:9 幻灯片，每页介绍一个对象（果蔬、城市、产品），版式各不相同但风格统一，示例是黑底微缩场景风的\"夏季果蔬\"系列。"
prompt: |
  主题：[介绍 10 种夏季水果和蔬菜]
  连续生成 10 张图，每张介绍其中一种，像一套 16:9 的 PPT。每页都要有：引语逻辑（一句有画面感的短句）、知识逻辑（3～4 个信息模块）和统一的配色与版式逻辑，同时保证每页的版式各不相同。
  统一风格：深色背景，主体是超大特写的实物，带水珠和柔和逆光；实物脚下是一组微缩小人场景（采摘、摆摊、野餐等），形成"巨物 + 小人"的趣味对比；文字为白色，现代无衬线中文配细英文。
  每页内容：大号页码（01～10）+ 中文名 + 英文名；一句引语；4 个带线性图标的信息模块，例如"风味关键词 / 夏季亮点 / 挑选提示 / 适合场景"，每个模块 2～3 行短句。
  版式变化：在左文右图、右文左图、标题居中、竖排大标题、卡片网格之间轮换，不要每页都一样。
  先生成第 1 页，确认风格后继续生成剩余页面，保持同一套视觉语言。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/xiaoxiaodong01/status/2072970775896977595
  author: "小小东"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文只有三句话，本站在保留原意（10 页、每页一个对象、版式各异、16:9）的基础上，按示例图补充了统一风格、每页信息模块和版式变化的具体写法；主题改为变量"
images:
  - 3015-ppt-series-consistent-slides-1.jpg
  - 3015-ppt-series-consistent-slides-2.jpg
  - 3015-ppt-series-consistent-slides-3.jpg
imageCredit:
  by: "小小东"
  url: https://youmind.com/gpt-image-2-prompts?id=27553
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[介绍 10 种夏季水果和蔬菜] 可以换成"介绍 8 座江南古镇""介绍公司 6 款产品""介绍 12 种常见咖啡豆"。页数写多了单次对话里容易风格漂移，建议"先出第 1 页 → 满意后说'继续第 2 页，保持完全相同的风格'"这样逐页推进。

示例图是这套系列中的三页：06 黄瓜（左侧竖列四个图标模块，右侧巨大黄瓜，下方微缩人物在黄瓜片上野餐）、03 荔枝（标题居中、四个模块横排）、01 西瓜（左上标题、两列模块），都是黑底、带水珠的特写和小人场景。

**常见问题**：
- 第 5 页以后风格走样：每次续写时把"统一风格"那段原样再贴一次。
- 文字错字：每个模块控制在 2 行以内，中文名用常见写法。
- 页码重复或跳号：每次明确告诉它"现在生成第 X 页：XX"。

**适合**：科普 / 课程类整套课件、产品介绍 PPT、小红书多图笔记。

### 原版提示词

```text
Theme: {argument name="theme" default="Introducing 10 types of summer fruits and vegetables"} 
Continuously generate 10 images, each being a different fruit or vegetable introduction, including quote logic, knowledge logic, and color and layout logic. Similar to a PPT, generate 10 slides, ensuring layout differences between them. Aspect ratio 16:9
```

> 改编自 [小小东](https://x.com/xiaoxiaodong01/status/2072970775896977595) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
