---
title: "室内设计提示词：从\"揉皱的纸团\"到一把椅子，五阶段产品设计推演展板（gpt-image-2）"
slug: crumpled-paper-chair-design-process-board
model: gpt-image-2
topics: [interior, infographic, ppt]
aspectRatio: "5:6"
needsRefImage: false
useCase: "做工业设计 / 家具设计作品集、课程汇报或概念提案时，一张图讲完\"灵感—形态推演—人机工学—结构—成品\"的全过程：主图是成品渲染，四周是分阶段的小图、线稿三视图、材质方案和规格参数。"
prompt: |
  生成一张产品设计推演展板，主题是"[揉皱的纸团椅]"：把[一个随手扔掉的纸团]的"受控的混乱"，转化成一件雕塑感强、坐感舒适的[单人休闲椅]。竖版 5:6，浅灰白底，杂志式网格排版，小标题和说明文字简短。
  - 顶部中央：成品主图——一把像纸团一样布满折面的白色椅子，中间凹出坐窝，深色影棚背景；左上角是标题和一句设计概念；
  - 阶段 1（观察与形态分析，左侧一列）：三张小图——折痕图（标出"谷线"和"脊线"）、多面体折面拆解、阴影研究；
  - 阶段 2（形态迭代）：一排灰色小模型，展示从球体到"挖出坐窝"的几种尝试，以及模拟纸张被压皱、下落后的形态；
  - 阶段 3（人机工学与图纸）：一张带人体侧影的剖面示意，标出靠背角度；旁边是正视、侧视、俯视三张线稿，带尺寸线；
  - 阶段 4（结构与材质，右侧一列）：内部的钢骨架线框图；两种材质方案的小样图：[白色粉末涂层铸铝外壳]和[再生塑料外壳 + 技术面料]；
  - 阶段 5（打样与成品，底部）：三张细节特写（表面肌理、坐面、光影对比）和一张深灰色款的成品图；最底部是四层结构的爆炸示意和一小栏关键规格；
  - 整体：克制的黑白灰配色，专业的工业设计作品集质感；图中的尺寸、角度均为示意。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/ShamsAmin56/status/2050281206139461780
  author: "@ShamsAmin56"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文长文（设计过程说明）改写为面向出图的分条中文；家具类型、灵感来源、材质方案设为变量；把原文里的软件操作与过程性叙述压缩成五个阶段各自要画的内容；按示例图补充了版式（左列阶段 1、右列阶段 4、底部阶段 5 与技术拆解）"
images:
  - 3447-crumpled-paper-chair-design-process-board-1.jpg
imageCredit:
  by: "@ShamsAmin56"
  url: https://youmind.com/gpt-image-2-prompts?id=17552
  license: CC BY 4.0
verify:
  - "示例图里的尺寸与角度是示意值，不能直接用于打样"
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：标题、灵感来源和家具类型是一组，可以换成"鹅卵石边几 / 河滩上的鹅卵石 / 边几""折纸台灯 / 一只纸鹤 / 台灯"；两种材质方案换成你想比较的材料。五个阶段的内容可以按你的真实设计过程改写，每个阶段写"要出现哪几张小图"即可。说明文字想用中文，就在开头加"所有标题和说明使用简体中文"。

示例图：浅灰底的展板，上方中间是一把像揉皱白纸一样的多折面椅子；左侧是折痕分析、折面拆解和阴影研究三张小图；中部是一排灰色的形态小模型，以及带人体侧影和三视图尺寸的图纸；右侧是钢架线框和白、灰两种外壳方案；底部是三张细节特写、一把深灰色成品椅和四层结构拆解，各处配着英文小标题。

**常见问题**：
- 小字密密麻麻且是乱码：写"每个阶段只有一个小标题，说明文字用灰色短线占位"。
- 各阶段挤成一团：明确写"五个阶段之间用细线和留白分隔"。
- 成品和过程图不是同一件东西：加"所有小图里的椅子与主图保持同一造型"。

**适合**：工业 / 家具设计作品集、设计课程汇报、概念提案 PPT、设计竞赛展板草稿。

### 英文原版

```text
Design Concept: {argument name="furniture type" default="The Crumple Chair"} Core Philosophy: Translating the "controlled chaos" of a {argument name="inspiration" default="tossed paper ball"} into a sculptural, high-comfort seating experience.\n\nStage 1: Observation & Morphological Analysis The goal is to deconstruct the image of the crumpled paper into usable geometric data. Crease Mapping: Identify the primary "valley" and "ridge" lines. These represent potential structural ribs or seams in the chair. Faceted Planes: Break down the sphere into a series of non-uniform polygons. Each flat surface of the paper becomes a potential panel for the chair’s upholstery or shell. Shadow Study: Analyze how the "tossed" form creates deep recesses. These natural pockets guide where the user’s weight will be cradled. \n\nStage 2: Iterative Form Exploration Moving from a sphere to a seat through "Digital Crumpling." Subtractive Sculpting: Imagine the paper ball as a solid mass. Use Boolean operations to "carve out" a seating cavity that fits the human form while maintaining the external jagged texture. Tension Simulation: Use 3D software (like Rhino or Blender) to simulate a flat sheet of material being compressed. This ensures the folds look authentic and not "modeled." The "Toss" Logic: Experiment with gravity-based simulation dropping a digital mesh to see how it settles naturally, mimicking the "tossed" origin. \n\nStage 3: Ergonomic Translation & Blueprinting Refining the raw aesthetic into a functional object. The Comfort Core: Overlay a standard ergonomic template (Seating Angle: 105°–110°) over the crumpled form. Adjust the internal "folds" to provide lumbar support and pressure relief. Blueprint Generation: Create technical orthographic views (Front, Side, Top). Map out the dimensions: Seat Height: 450mm Total Width: 850mm Surface Smoothing: Maintain the sharp "paper edges" on the exterior shell while softening the interior contact points for skin comfort. \n\nStage 4: Structural Integration & Scaling Making the concept physically viable. The Skeleton: Design a hidden internal frame (likely CNC-bent steel rods or a 3D-printed lattice) that follows the most prominent ridges of the paper folds to provide rigidity. Material Selection: * Option A (High-End): {argument name="material" default="Faceted, cast aluminum"} with a white powder coat. Option B (Soft): Vacuum-formed recycled plastic shell covered in "memory-fold" technical fabric that retains a wrinkled appearance. \n\nStage 5: Final Prototyping & Material Finish Textural Replication: Apply a matte, slightly porous finish to the material to mimic the tactile feel of heavy-bond paper. Lighting Contrast: Use directional studio lighting in the final renders to emphasize the "tossed" shadows, making the chair look like a giant piece of discarded inspiration. Design Tip: To keep the "tossed" look authentic, avoid symmetry.
```

> 改编自 [@ShamsAmin56](https://x.com/ShamsAmin56/status/2050281206139461780) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
