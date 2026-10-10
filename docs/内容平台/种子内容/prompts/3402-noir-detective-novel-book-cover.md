---
title: "海报提示词：悬疑推理小说封面，雾巷路灯下的风衣侦探剪影 + 斑驳印章字标题（即梦）"
slug: noir-detective-novel-book-cover
model: jimeng
topics: [poster, illustration]
modelLabel: Seedream 4.5
aspectRatio: "2:3"
needsRefImage: false
useCase: "给悬疑 / 推理 / 犯罪题材的小说、有声书、剧本杀做封面：黑色电影气氛的雾巷，一盏孤灯，戴礼帽穿风衣的背影剪影，标题是带磨损颗粒的粗体字。"
prompt: |
  一张惊悚又神秘的犯罪小说封面，书名是《[影子侦探]》，竖版 2:3。
  - 画面：一个[戴礼帽、穿长风衣的侦探]背对镜头的黑色剪影，站在一条[昏暗起雾的小巷]正中，双手插在口袋里；
  - 光线：唯一的光源是巷子深处左侧的一盏老式路灯，冷白色的光穿过雾气，勾出人物轮廓，两侧砖墙沉在阴影里，地面潮湿有微弱反光；
  - 标题：书名放在画面上方三分之一，白色粗体字，带粗砺的磨损颗粒，像盖印章时油墨没印全；
  - 色调：冷蓝灰加黑色，黑色电影风格，充满悬念；
  - 不要出现人物的脸，不要多余的文字和 Logo。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-seedream-4.5
  url: https://github.com/YouMind-OpenLab/awesome-seedream-4.5/blob/8b09e6de35de0b6f90121cb6cf916cba3d453403/README.md#no-14-crime-novel-book-cover-the-shadow-detective
  author: "@jaredliu_bravo"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并拆成要点；书名、人物造型、场景设为变量；按示例图补充了人物背对镜头居中、路灯在左侧、标题位于上方三分之一、冷蓝灰色调等构图信息"
images:
  - 3402-noir-detective-novel-book-cover-1.jpg
imageCredit:
  by: "@jaredliu_bravo"
  url: https://cms-assets.youmind.com/media/1765359749886_kp53z5_6e8b4aee7f3968c08d89355e02eac75f80081c5a652af5be3043a2f7ddf122f3-600x900.png
  license: CC BY 4.0
verify:
  - "上线前在 即梦 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
原作者用 Seedream 4.5 生成；在即梦里选用 Seedream 系列图片模型使用。

**怎么填变量**：《[影子侦探]》换成你的书名，中文书名建议 2～6 个字，字越少越有冲击力；[戴礼帽、穿长风衣的侦探] 可以换成"撑黑伞的女人""提着手提箱的男人"；[昏暗起雾的小巷] 可以换成"雨夜的码头""空无一人的地铁站台"。想加作者名，在提示词里补一句"底部居中一行小字：作者名"。

示例图是英文版：两侧是高耸的黑色砖墙，左侧一盏路灯在雾里发出冷白的光，正中是戴宽檐帽、穿长风衣的男人背影，纯黑剪影；上方两行白色粗体字"The Shadow Detective"，字面上有斑驳的掉墨效果。

**常见问题**：
- 中文书名笔画粘连：改成"粗黑体，笔画清晰，只在边缘有轻微磨损"。
- 画面太黑看不清层次：加"雾气被路灯照亮，形成由亮到暗的纵深"。
- 人物转成了正面：强调"背对镜头，只见轮廓"。
- 需要系列感：固定路灯和字体，只换人物和场景，做成一套。

**适合**：网文 / 有声书封面、剧本杀海报、悬疑播客头图、读书分享会 PPT 封面。

### 英文原版

```text
A thrilling and mysterious book cover for a crime novel titled “The Shadow Detective”. The cover features a silhouette of a detective in a fedora and trench coat, standing in a dark, foggy alleyway. The only light source is a single, distant streetlamp. The title is in a gritty, textured font that looks like it was stamped on. The mood is noir and full of suspense, demonstrating strong atmospheric control. –ar 2:3
```

> 改编自 [@jaredliu_bravo](https://github.com/YouMind-OpenLab/awesome-seedream-4.5/blob/8b09e6de35de0b6f90121cb6cf916cba3d453403/README.md#no-14-crime-novel-book-cover-the-shadow-detective) 发布、[YouMind-OpenLab/awesome-seedream-4.5](https://github.com/YouMind-OpenLab/awesome-seedream-4.5) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
