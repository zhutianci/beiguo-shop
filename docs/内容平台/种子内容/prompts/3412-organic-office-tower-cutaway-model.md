---
title: "ai室内设计提示词：有机曲线办公楼剖切模型，等轴测建筑沙盘 + 暖光分层（Nano Banana）"
slug: organic-office-tower-cutaway-model
model: nano-banana
topics: [interior, illustration]
modelLabel: Nano Banana Pro
aspectRatio: "1:1"
needsRefImage: false
useCase: "做建筑 / 办公空间概念提案、作品集或 PPT 配图时，生成一座像展览沙盘一样的曲线形办公楼剖切模型：每层的会议室、休息区一目了然，内部有暖色小灯，干净的影棚背景。"
prompt: |
  一座[有机曲线造型的企业办公楼]的概念建筑等轴测模型，做成展览级的沙盘摆在展台上，画幅 1:1。
  - 剖切：建筑带一个剖切面，从俯视的等轴测角度露出内部——流动的空间动线、[弧形会议室和休息区]的分区；各体块之间用无缝弯曲的半透明隔断轻轻分开，暗示动线和功能；
  - 灯光：每一层内部有暖色的微型 LED 灯带把楼层照亮；
  - 配色与材质：细的结构轮廓线，[柔和的淡紫色和薄荷绿]，条纹木饰面和深色水磨石，极简抽象的楼层标识，少量白色小人作为比例尺；
  - 造型：表面光滑，药丸形的圆润边角；
  - 画面：大量留白，构图层次清晰，戏剧化但受控的影棚布光，建筑模型摄影风格，[干净的深色中性]背景，细节丰富但整体极简。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-nano-banana-pro-prompts
  url: https://x.com/lunarionart/status/2027705917081350395
  author: "@lunarionart"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并拆成要点；建筑类型、功能分区、配色与材质、背景色设为变量；按示例图补充了\"模型放在展台上、每层露出家具和小人比例尺\"的描述"
images:
  - 3412-organic-office-tower-cutaway-model-1.jpg
  - 3412-organic-office-tower-cutaway-model-2.jpg
imageCredit:
  by: "@lunarionart"
  url: https://youmind.com/nano-banana-pro-prompts?id=11074
  license: CC BY 4.0
verify:
  - "上线前在 Nano Banana 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[有机曲线造型的企业办公楼] 可以换成"社区图书馆""带中庭的学校""共享办公楼"；[弧形会议室和休息区] 写你想展示的功能分区；配色换成你的方案主色，如"暖灰和陶土橘"；背景想明亮就改成"干净的浅灰"。想在楼层上标中文名称，补一句"每层外沿有很小的中文标签，如'会议区''休息区'"。

示例图第一张是浅色版：浅灰展台上一座七层的波浪形小楼，淡紫、薄荷绿和原木色，每层能看到圆润的沙发、会议桌和绿植，还有米粒大的白色小人；第二张是深色背景版：木饰面外墙、黑色水磨石地面，楼层内透出暖黄色灯光，楼板边缘标着很小的英文功能名。

**常见问题**：
- 没有剖切、只看到外立面：强调"外墙被切开一半，露出每一层的室内布置"。
- 楼层标识是乱码：删掉"楼层标识"，或写明具体要标的 3～4 个词。
- 像游戏场景而不像实体模型：加"实体模型的微距摄影，浅景深，展台边缘可见"。

**适合**：建筑与空间概念提案、设计作品集、地产 / 联合办公宣传图、PPT 封面。它只是概念示意，不能替代真实的建筑图纸。

### 英文原版

```text
A conceptual architectural isometric model of an organic-form corporate office tower, presented as an exhibition-scale diorama. The building is shown with a cutaway section, exposing fluid spatial flow, curved meeting rooms, and lounge zoning from a top-down isometric perspective. Volumes are lightly separated by seamlessly curved translucent partitions to suggest circulation and function. Warm micro-LEDs illuminate the individual floors from within. Strong use of negative space and clear compositional hierarchy. Thin structural outlines, soft pastel lavender and mint, ribbed wood and dark terrazzo tones, minimal abstract signage, subtle human-scale markers. Smooth surfaces, pill-shaped rounded edges, dramatic controlled studio lighting, architectural model photography style, clean dark neutral background, high-detail yet minimal.
```

> 改编自 [@lunarionart](https://x.com/lunarionart/status/2027705917081350395) 发布、[YouMind-OpenLab/awesome-nano-banana-pro-prompts](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
