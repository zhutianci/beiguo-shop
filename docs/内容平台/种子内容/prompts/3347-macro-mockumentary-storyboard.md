---
title: 分镜提示词：18 格微距伪纪录片故事板（沙发底下的灰尘团遭遇吸尘器"天敌"，可接视频模型）
slug: macro-mockumentary-storyboard
model: gpt-image-2
topics: [comic, cinematic]
needsRefImage: false
aspectRatio: "16:9"
useCase: 做短视频 / 广告创意前期，用一张专业故事板把 15 秒左右的微距"自然纪录片"式小故事拆成 18 个镜头，每格带编号、标题和景别，之后可以直接拿去给视频模型当分镜参考。
prompt: |
  生成一张 16:9 的专业故事板，[18]格，排成紧凑的[3x6]网格，全彩电影感纪录片画面。
  - 片名：《[灰尘兔的自然纪录片]》，类型：微距野生动物写实 + 冷面幽默的伪纪录片，约 15 秒的生存追逐；
  - 故事：普通客厅的[沙发底下]藏着一片"荒野"——地毯纤维像草原，沙发腿像峡谷，面包屑像巨石，长头发像藤蔓森林，一块遗落的[红色积木]像古代遗迹，一枚硬币像金属月亮，一个笔帽像倒下的空心树干；一小团灰尘（主角）和几团同伴像兽群一样生活；突然地面震动，[吸尘器]像顶级掠食者一样出现，吸力卷起风暴，主角一路翻滚逃命，最后躲到积木块后面幸存，尘埃落定，生活继续；
  - 主角：一团灰米色、毛茸茸、形状不规则的灰尘和绒毛，有细小的发丝纤维；看起来是活的，但必须仍像真实的灰尘团——没有脸、没有眼睛、没有四肢、不说话、不卖萌；
  - 吸尘器：先出现阴影，再是震动，然后是吸嘴和吸力漩涡；要有真正的威胁感，但不要给它画脸；
  - 镜头顺序：01 隐秘世界（全景）→ 02 兽群 → 03 主角登场 → 04 探索 → 05 积木遗迹 → 06 硬币月亮 → 07 笔帽隧道 → 08 面包屑巨石 → 09 头发森林 → 10 地面震动 → 11 掠食者逼近 → 12 吸力风暴 → 13 碎屑漩涡 → 14 生存追逐 → 15 千钧一发 → 16 最后一刻躲进积木后 → 17 危险过去 → 18 生活继续；
  - 每格上方有干净的标题条，写编号、镜头名和景别（全景 / 近景 / 特写）；画面内部不要字幕、对话框、箭头、水印；
  - 风格：高端自然纪录片的微距摄影质感，浅景深，体积光里漂浮的尘埃，真实的地毯纹理，低饱和的土棕灰色调；笑点来自一本正经的纪录片语气，不要卡通化、不要闹剧。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/NeuralAIInsight/status/2063638281976189102
  author: "@NeuralAIInsight"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 原文是超长的分区结构化脚本（含镜头表、节奏轨、视频模型提示词），压缩成中文分点描述并保留 18 格镜头顺序；格数、网格、片名、场景、掠食者设为变量；积木玩具品牌名改为"红色积木"，删去电视机构名和后半段视频模型提示词
images:
  - 3347-macro-mockumentary-storyboard-1.jpg
imageCredit:
  by: "@NeuralAIInsight"
  url: https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts/blob/main/images/comparison_case99/output.jpg
  license: CC0 1.0
verify:
  - 示例图里有一格出现的积木块外观接近知名玩具品牌，商用前确认是否需要改成无凸点的普通木块
  - 用缩写后的中文版出一次，检查 18 格顺序和标题条是否正确
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么填变量**：这套结构可以讲任何"把小东西当野生动物拍"的故事。[灰尘兔的自然纪录片] 换片名；[沙发底下] 换舞台，比如"冰箱冷藏室""办公桌抽屉""浴室下水口"；[吸尘器] 换成对应的"天敌"，例如"开冰箱的手""拖把"；[红色积木] 是最后的避难所，可以换"一块橡皮""一个瓶盖"。格数和网格可以改小，比如[9]格配[3x3]，镜头顺序相应删减。示例图是 3x6 的英文故事板：每格顶上有编号、镜头名和 WS / CU / MCU 标记，画面里是昏暗地毯上的灰色绒团，中间几格分别出现红色积木、竖着的硬币和黑色笔帽，后几格是吸尘器吸嘴和卷起的碎屑，最后一格回到平静。示例图标题条是英文。

**常见问题与调整**：
- 主角被画成了带眼睛的萌物：在开头加"主角绝对没有脸和眼睛，只是一团真实的灰尘"。
- 格子顺序乱或数量不对：减少到 9 或 12 格，并把镜头顺序逐格写清。
- 画面太亮太干净：加"昏暗、有颗粒感，只有远处一束室内光照进来"。
- 想接着做视频：把满意的故事板上传给视频模型，说明"按故事板顺序逐格生成连续镜头，不要渲染故事板本身"。

**适合**：短视频 / 广告创意的前期分镜、微距创意提案、分镜教学示例；生成的画格是参考稿，正式拍摄或动画还需导演和美术二次确认。

### 英文原版

（原文较长，此处节选）

```
Create a 16:9 image.

[PROJECT CARD]
Create a compact designed masthead, not a table.
TITLE: THE DUST BUNNY NATURE DOCUMENTARY
META LINE: macro wildlife realism / under-couch survival ecosystem / dry documentary comedy / 15-second natural-history chase
PRIORITY: real nature-documentary seriousness, under-couch wilderness, dust bunny herd, fragile main dust bunny, household objects as landmarks, vacuum cleaner apex predator, survival chase, calm noble ending
MICRO BRIEF: Eighteen-panel storyboard of a small dust bunny under a couch filmed like a wild animal surviving in a dangerous natural habitat.
[CONTINUITY HEADER]
SEQUENCE ID: DUST-BUNNY-DOC-18
REFERENCE PRIORITY: This storyboard controls C1 dust bunny identity, under-couch geography, macro household scale, documentary lens language, herd behavior, vacuum predator logic, survival chase continuity, and dry comedic realism.
[SCENE PACKET]
PREMISE: Beneath an ordinary living-room couch exists a hidden wilderness. Dust bunnies drift and gather like a small herd in a shadowed ecosystem of carpet fibers, long hair strands, crumbs, lost objects, and canyon-like sofa legs. One small fragile dust bunny explores the terrain, moving through the under-couch world like a wild animal foraging in a hostile habitat. The peace breaks when the ground begins to tremble. The vacuum cleaner arrives like an apex predator: part lion, part shark, part sandstorm. Its suction pulls dust, crumbs, and debris into a violent vortex. C1 races through the under-sofa wilderness, dodges household dangers, tumbles past a lost LEGO brick, coin, pen cap, crumbs, and hair-strand forests, then finds cover just in time. The vacuum passes. Calm returns. The herd remains. Against all odds, life continues under the couch.
LOCATION:
The underside of a couch in a real home, filmed at extreme macro scale.
Environment: dark sofa underside, canyon-like couch shadows, carpet fibers like tall grass, dust motes drifting like desert particles, long hair strands like tangled vines or forest roots, crumbs like boulders, a lost LEGO brick like a red stone ruin, a coin like a metallic moon-disc, a pen cap like a fallen cylinder monument, deep shadow pockets used as cover.
World scale: everything is household-sized in reality but filmed like a vast natural ecosystem.
```

> 改编自 [@NeuralAIInsight](https://x.com/NeuralAIInsight/status/2063638281976189102) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0。
