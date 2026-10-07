---
title: 即梦提示词：PPT配图用的彩色思维导图，云朵中心 + 四个带图标的分支（16:9）
slug: mind-map-illustration-slide
model: jimeng
topics: [ppt, infographic]
needsRefImage: false
aspectRatio: "16:9"
useCase: 做课件、培训 PPT、头脑风暴讨论页时，生成一张以某个主题为中心的彩色思维导图：中心是云朵形状，四周分支各有独立颜色和小图标，文字用亲切的手写体。
prompt: |
  一张充满活力、线条有机流动的思维导图，中心主题是"[创造性思维]"。
  - 中心主题放在一个白色云朵形状里；
  - 从中心伸出 4 条弯曲的彩色分支，分别连向子主题：[头脑风暴、正念、发散思维、协作]；
  - 每条分支用不同颜色（如橙、绿、蓝、紫），末端有一个同色圆形图标，图标与子主题相关（如灯泡代表点子、叶子代表正念、树状图代表发散、握手代表协作）；
  - 文字使用亲切的手写风字体，清晰易读；
  - 背景是[虚化的自然林地]，让前景的导图更突出；
  - 用作教学和头脑风暴工具的配图。
  画幅 16:9。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-seedream-4.5
  url: https://github.com/YouMind-OpenLab/awesome-seedream-4.5#no-48-vibrant-mind-map-for-creative-thinking
  author: "@jaredliu_bravo"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 译成中文并拆成要点；中心主题、子主题、背景设为变量；按示例图补充了分支颜色、圆形图标和虚化自然背景
images:
  - 3298-mind-map-illustration-slide-1.jpg
imageCredit:
  by: "@jaredliu_bravo"
  url: https://cms-assets.youmind.com/media/1765360046589_xbdktm_7f8ef516875cb2529572760ff3af83434fa448b108c72ee77fbed2f0d0c31349-600x337.png
  license: CC BY 4.0
verify:
  - 示例图是英文版，在即梦里换成中文子主题实测，看手写体中文是否清晰
  - 分支超过 6 个时文字容易出错，确认推荐分支数写在正文里
---
原作者用 Seedream 4.5 生成；即梦里选用 Seedream 系列图片模型使用。

**怎么填变量**：[创造性思维] 换成你这一页 PPT 的主题，比如"时间管理""新媒体运营""光合作用"；[头脑风暴、正念、发散思维、协作] 换成 3～6 个子主题，例如时间管理写"四象限、番茄钟、待办清单、拒绝拖延"。[虚化的自然林地] 可以换成"浅色纸张纹理""纯白背景"，正式汇报用纯色背景更稳。示例图是英文版：白色云朵里写着两行黑色手写体标题，四条分支分别是橙色灯泡、绿色叶子、蓝色树状图、紫色握手图标，背景是虚化的青苔石头和树林。

**常见问题与调整**：
- 想要二级分支：加"每个子主题再分出 2 个更细的小分支，用更细的线和小字"，但总字数要控制。
- 图标和主题对不上：直接写明"头脑风暴配灯泡图标"这样的对应关系。
- 背景太花影响阅读：改成"背景纯白，四周留白，适合直接放进 PPT"。
- 字体太可爱不够正式：把手写体改成"简洁的圆角无衬线字体"。

**适合**：课件、培训 PPT、读书笔记、头脑风暴页；不适合信息量很大的复杂知识图谱。

### 英文原版

```
A vibrant and organic mind map centered around the topic of “Creative Thinking.” The central idea is in a cloud-like shape, with branches extending to sub-topics like “Brainstorming,” “Mindfulness,” “Divergent Thinking,” and “Collaboration.” Each branch should have a unique color and be accompanied by a small, relevant icon (e.g., a lightbulb for ideas). The text should be in a friendly, handwritten font, showcasing a tool for educational and brainstorming purposes. –ar 16:9
```

> 改编自 [@jaredliu_bravo](https://github.com/YouMind-OpenLab/awesome-seedream-4.5#no-48-vibrant-mind-map-for-creative-thinking) 发布、[YouMind-OpenLab/awesome-seedream-4.5](https://github.com/YouMind-OpenLab/awesome-seedream-4.5) 收录的提示词，仓库许可证 CC BY 4.0。
