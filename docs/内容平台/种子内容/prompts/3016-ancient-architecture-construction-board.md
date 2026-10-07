---
title: "古建筑科普信息图提示词：木塔营造过程示意图（中文测绘展板）（gpt-image-2）"
slug: ancient-architecture-construction-board
model: gpt-image-2
topics: [infographic, interior]
aspectRatio: "4:5"
needsRefImage: false
useCase: "生成一张中文古建筑营造展板：中央是施工中的 3D 木构模型和微缩工匠，四周是平面图、立面图、剖面图、斗拱详图和工程概况文字，示例是应县木塔，换成其他古建筑也适用。"
prompt: |
  生成一张高信息密度的中文建筑展板，展示[应县木塔]的营造过程示意图，画面中央是一座正在施工的写实 3D 剖切 / 等轴测模型。
  画布：4:5 竖版，米白色绘图纸背景，干净的博物馆展陈 / 建筑蓝图风格。黑色中文字体、灰色细尺寸线、深褐色木材，像技术图版和微缩沙盘的结合。
  版式：中央是一座巨大精细的八角形木塔模型，占据大半画面，从略高的正面角度观看，露出屋顶结构和内部放射状木构架。塔基周围是许多微缩工匠、脚手架、木料堆、推车、梯子、吊架和拼装架。四周的图纸和文字要像专业建筑图纸一样对齐。
  文字：左上角大标题"[应县木塔]"，下方副标题"[建筑营造过程示意图]"；左栏两个信息块"工程概况"和"营造特点"，用多行中文短句写工程名称、地点、建造年代、高度、结构类型、平面形式和工艺特点。
  必须包含恰好 7 个主要图区：1）中央 3D 施工模型；2）左栏"工程概况"；3）左栏"营造特点"；4）左下"平面图"，八角形平面带尺寸标注；5）右上"立面图 [1:400]"，带楼层标注和竖向尺寸；6）右中"剖面图 [1:400]"，带层数标注；7）底部一排小技术详图，分别标"斗拱详图""构件解析""结构分析""节点详图"。
  主体细节：八角形多重檐木塔，深灰瓦屋面，外露的褐色梁枋，密集的斗拱，层层出檐，塔顶有刹，顶部可见放射状屋架；施工状态：上层内部桁架未完成，下层围着脚手架，有木栅栏，工匠扛着梁木。主要材料为[木构架]。
  风格：高度精细的建筑可视化，写实微缩模型渲染，精确的技术标注，细墨线，柔和阴影，低饱和的褐色与灰色，不要鲜艳颜色；照片级 3D 施工沙盘与清晰的 2D 蓝图叠加，排版像正式的中文建筑图纸。
  限制：保持密集的中文版式和技术图清晰度；不要 Logo、水印、英文标签或现代建筑；各图区空间有序，文字不要压在主塔上；中文必须正确，尤其是标题和副标题。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/uniswap12/status/2058777914083266617
  author: "唐华斑竹🦅"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；建筑名称、主材料、比例尺、标题改为变量；精简重复的约束描述"
images:
  - 3016-ancient-architecture-construction-board-1.jpg
imageCredit:
  by: "唐华斑竹🦅"
  url: https://youmind.com/gpt-image-2-prompts?id=22645
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[应县木塔] 换成其他古建筑，如"佛光寺东大殿""天坛祈年殿""苏州虎丘塔"，同时把"八角形多重檐木塔"等主体描述改成该建筑的形制；砖石建筑把 [木构架] 改成"砖石结构"，图区名称可以改成"砌筑详图"。[1:400] 是比例尺，按建筑大小调整。

示例图与描述一致：米白底上一座占满中部的八角木塔施工模型，底层满是微缩工匠和木料，左上"应县木塔 / 建筑营造过程示意图"，左栏两块说明文字，右侧上下是立面图和剖面图，左下八角平面，底部一排构件详图。

**常见问题**：
- 文字信息不准确：高度、年代等数据由模型生成，用于教学前请对照资料修改，或在提示词里直接写出正确数字。
- 小字糊：信息块每块控制在 5 行以内。
- 画成了完工状态：强调"上层未完成，下层有脚手架"。

**适合**：历史 / 美术课件、古建筑科普账号、博物馆风格展板、研学手册插页。

### 英文原版

```text
Goal: Create a high-density architectural presentation board in Chinese showing the construction process diagram of an ancient wooden pagoda, centered on a realistic 3D cutaway/isometric model of {argument name="building name" default="应县木塔"} under construction.

Canvas: Portrait poster, off-white drafting-paper background, 4:5 ratio, clean museum-exhibition / architectural blueprint style. Use black Chinese typography, fine grey measurement lines, and sepia-brown timber materials. The image should feel like a technical architecture plate mixed with a miniature diorama.

Layout: Place a huge detailed octagonal timber pagoda model in the center, occupying most of the poster. Show the pagoda from a slightly elevated front angle so the roof structure and interior radial timber frame are visible. Surround the base with many tiny construction workers, scaffolds, timber piles, carts, ladders, cranes, and assembly frames. The surrounding drawings and text must stay aligned like a professional architectural sheet.

Text content: At top left, large title text: 「应县木塔」. Directly below, subtitle: 「建筑营造过程示意图」. Add two left-column information blocks titled 「工程概况」 and 「营造特点」 with multiple short Chinese lines describing project name, location, construction period, height, structure type, plan form, and craft characteristics. Keep the Chinese legible and not garbled.

Required diagram elements: Include exactly 7 major labeled diagram areas: 1) central 3D pagoda construction model, 2) left-column工程概况 text block, 3) left-column营造特点 text block, 4) lower-left 「平面图」 octagonal plan drawing with dimension marks around 30.27米, 5) upper-right 「立面图 1:400」 elevation drawing with floor labels and vertical dimensions, 6) mid-right 「剖面图 1:400」 section drawing with storey labels, 7) bottom strip of small technical detail panels labeled with categories such as 「斗拱详图」, 「构件解析」, 「结构分析」, and 「节点详图」.

Subject details: The pagoda should be an octagonal, multi-eaved Chinese timber tower with dark grey tiled roofs, exposed brown wooden beams, dense bracket sets, layered eaves, a central finial, and radial roof framing visible at the top. Add construction staging: unfinished upper interior trusses, scaffolding around lower levels, timber fences, and workers carrying beams. Use {argument name="primary material" default="wooden timber frame"} as the dominant construction material and {argument name="drawing scale" default="1:400"} for the elevation and section labels.

Visual style: Highly detailed architectural visualization, realistic miniature model rendering, precise technical annotation, fine ink lines, soft shadows, muted sepia and grey palette, no bright colors. Combine photorealistic 3D construction diorama with crisp 2D blueprint overlays. Make the typography resemble a formal Chinese architectural drawing sheet.

Constraints: Preserve the dense Chinese layout and technical drawing clarity. Do not add logos, watermarks, English labels, or modern buildings. Keep all diagrams spatially organized, with no overlapping text on the main pagoda. Ensure Chinese characters render correctly, especially the title {argument name="main title" default="应县木塔"} and subtitle {argument name="subtitle" default="建筑营造过程示意图"}.
```

> 改编自 [唐华斑竹🦅](https://x.com/uniswap12/status/2058777914083266617) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
