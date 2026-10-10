---
title: "壁纸提示词：纸本钢笔细线风景速写，大留白 + 几处点色的旅行手稿风（gpt-image-2）"
slug: fine-line-travel-sketch-color-accent-wallpaper
model: gpt-image-2
topics: [wallpaper, illustration]
aspectRatio: "1:2"
needsRefImage: false
useCase: "把一个地标或风景画成\"旅行手稿里的一页\"：暖白色纸张、极细而略带抖动的手绘墨线、上方大面积留白，只在几个关键位置点一点高纯度颜色。适合做手机壁纸、明信片和文创图。"
prompt: |
  根据给定主题，生成一幅纸本线描风景作品。主题：[湖对岸的雪山，湖边有红色鸟居和一条小路]；画幅：[1:2 竖版]；用途：[手机壁纸]。
  - 线条：先用极细、略带抖动的手绘墨线建立空间、主体轮廓、结构转折、道路和比例关系；体积和阴影只靠细密的排线和线条疏密来表现。
  - 点色：整幅画以暖白色纸面和黑色细线为主，只在最关键的识别面、连接点和视线停留处加少量高纯度颜色——[鸟居的朱红、湖面的淡蓝、枝头的几点粉色]；颜色不是填满，而是像批注一样精确地引导注意力。
  - 纸感：暖调的米白色纸张，能看到纸纹、细小的斑点和轻微的扫描感。
  - 构图：上方或四周留出大面积空白，视觉重心落在画面中部或中下部，主体四周要有呼吸的距离；画面由一个清晰的主体、一层低密度的环境线稿和少数几个带颜色的节点组成。
  - 细节：主体保留可辨认的结构线、轮廓和局部排线，细节集中在边缘、开口、转角和路径上；背景是淡淡的、像记忆一样的稀疏线稿；加入几个极小的人影、小船或飞鸟作为尺度参照，增加生活气息。
  - 文字：如需文字，只在左下角用窄而克制的手写体标一行地名和一行小注，下方盖一枚很小的红色印章。
  - 成品质感：钢笔线稿叠加彩色铅笔或淡墨的手工感，安静、开阔，允许轻微的透视误差。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/xiaoxiaodong01/status/2060766929657397249
  author: "@xiaoxiaodong01"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "仓库收录的英文版译为中文并精简；主题、画幅、用途保留为变量，新增\"点色位置\"变量；原文默认主题是一座政治性地标建筑，按第一张示例图改为雪山湖景，并补充了\"左下角手写小字与小印章\""
images:
  - 3497-fine-line-travel-sketch-color-accent-wallpaper-1.jpg
imageCredit:
  by: "@xiaoxiaodong01"
  url: https://youmind.com/gpt-image-2-prompts?id=23330
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：主题一栏写"主体 + 一两个环境元素"，例如"悬崖上的灯塔和海鸥""老城里的钟楼与石桥"；点色一栏最多写三处、每处一种颜色，颜色越少越像手稿；画幅做手机壁纸用 1:2 或 9:16，做明信片可改成 3:2 横版，用途相应改成"明信片"。

示例图是一张细长的竖幅：上面三分之一几乎全是留白的米色纸面，只有几只小鸟和几笔云线；中部是用细密排线画出的雪山，山脚一片淡蓝色的湖；右下方一座朱红色的鸟居、一盏石灯笼和几个小人影，一条石子小路通向前景，岸边停着一只小船，右侧一枝带粉点的枯枝；左下角是手写的山名、海拔和一枚红色小印。

**常见问题**：
- 颜色涂得太满：强调"全画 90% 以上是黑线和纸色，颜色只是点缀"。
- 线条太工整像矢量图：加"手绘抖动、线条粗细不匀、有断线"。
- 留白被云和树填掉：写明"画面上三分之一保持空白"。

**适合**：手机壁纸、旅行明信片、文创周边图案；画面里的地名和数字请自行核对后再使用。

### 原版提示词

```text
Generate a paper-based line drawing visual work based on a specific theme. The image is first established by extremely fine, slightly shaky hand-drawn lines to build space, subject outline, structural transitions, paths, and scale relationships. Then, a few high-purity color surfaces are introduced only to the most critical recognition planes, connection nodes, emotional pauses, and centers of gravity; color is not a full fill but acts as precise annotations to edit attention. The overall visual area is dominated by warm off-white paper and black fine lines. Paper texture, tiny spots, and a slight scan feel should be clearly present. Ample white space is reserved above or around to make the subject appear as if observed in a page of a travel manuscript. Visual weight is concentrated in the middle or lower-middle part, maintaining breathable distance around the subject. The composition consists of a clear anchor, a low-density environment layer, and a few colored nodes. The core object maintains recognizable structural lines, outlines, local hatching, and compressed details. Details gather along edges, openings, corners, and movement paths. Volume and shadows are achieved through fine hatching and varying line density. Background appears as a low-density line-art memory layer. Added tiny figures or symbols serve as scale 'noise' to give a sense of life and usage. If text is needed, use narrow, restrained annotation-style fonts. The final surface shows the finish of pen line drawing, colored pencil, or light ink overlay, with quiet, open, manual textures and slight perspective errors. Theme: {argument name="subject" default="Close-up of the Great Hall of the People"} Aspect Ratio: {argument name="ratio" default="1:2"} Usage: {argument name="usage" default="Mobile wallpaper"}
```

> 改编自 [@xiaoxiaodong01](https://x.com/xiaoxiaodong01/status/2060766929657397249) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
