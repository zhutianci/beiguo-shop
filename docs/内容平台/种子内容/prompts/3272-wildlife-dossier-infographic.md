---
title: 信息图提示词：野生动物电影感档案海报，写实主体+栖息地地图+食性+保护等级（gpt-image-2）
slug: wildlife-dossier-infographic
model: gpt-image-2
topics: [infographic, poster]
needsRefImage: false
aspectRatio: "9:16"
useCase: 做动物科普账号、自然教育课件、手机壁纸或可收藏海报时，填入一种动物和它的栖息环境，生成一张"高端野生动物档案"风格的竖版海报：动物主体超写实，四周层叠解剖标注、食性、分布图和保护状态。
prompt: |
  制作一张高级、电影感的野生动物信息图海报，主角是一种稀有或外形独特的动物：[动物名称]。整张作品要像一份未来感的高端野生动物档案，而不是普通科普图。
  - 主体：动物占据画面主导，细节极其写实——毛发 / 鳞片根根分明、眼睛真实、湿润质感、电影级阴影、与环境互动、姿态有张力、肌肉线条可见、空气中有漂浮颗粒，强烈的眼神接触；
  - 环境：完全匹配这个物种——[栖息环境]；
  - 信息层：围绕动物层层叠加——解剖标注、适应性特征、猎物与食性图、生态系统叠层、保护等级、地理分布图、捕猎行为图示、气候威胁、局部细节小图、战术感图标、科学标签和简短数据；
  - 版式：不对称的编辑排版、半透明叠层信息面板、高级字体、细微纸纹、等高线叠层、少量全息 UI 元素、电影感标记点、博物馆级的视觉层级；
  - 风格融合：奢华编辑美学 + 纪录片写实 + 未来感信息设计 + 可收藏的野外图鉴；
  - 配色：[配色主题]；情绪：[情绪]；
  - 光线：戏剧性电影光、体积雾、发光的轮廓光、空气薄雾、真实的环境反射、高对比阴影。
  超写实、细节丰富、质感可触、叙事分层，像一张让人想保存、转发、装裱的收藏级海报。画幅[9:16]竖版。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/sha_zdiii/status/2054229209460117552
  author: "@sha_zdiii"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 译成中文并拆成要点；原文圆括号占位（动物、环境、配色、情绪）改为方括号变量；补充画幅；精简了结尾重复的"病毒式传播"类堆词
images:
  - 3272-wildlife-dossier-infographic-1.jpg
imageCredit:
  by: "@sha_zdiii"
  url: https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts/blob/main/images/poster_case255/output.jpg
  license: CC0 1.0
verify:
  - 示例图里的学名、保护等级、频率等数据由模型生成，页面需提醒"科普使用前逐项核对"
  - 示例图是英文版，中文标注版出一次看小字可读性
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么填变量**：[动物名称] 选外形有特点的效果最好，例如"雪豹""川金丝猴""中华穿山甲""蓝鲸"；[栖息环境] 写具体，如雪豹写"海拔四千米的碎石山脊，飘雪"；[配色主题] 如"冷灰蓝 + 冰白"，[情绪] 如"孤独、警觉"。示例图是英文版：夕阳下的非洲稀树草原上站着一只大耳狐，正对镜头；顶部是英文名和学名，左上有分布地图和听觉频谱图，右上是食性面板（白蚁、甲虫、蝗虫小图），左侧标注大耳朵、牙齿、体温调节，底部是社会行为地图和保护等级柱状图。

**常见问题与调整**：
- 信息面板挡住动物：写"动物占画面中央 60%，信息面板只在四周边缘"。
- 数据不准：把核对过的数据直接写进提示词，如"保护等级：易危；分布：青藏高原"。
- 太像游戏 UI：删掉"全息 UI""战术感图标"，改成"博物馆展签风格"。
- 想做横版课件：画幅改 16:9，动物放左侧，信息放右侧。

**适合**：动物科普账号、自然教育课件、手机壁纸和装饰海报；不适合未经核对直接作为科学资料。

### 英文原版

```
.

Create a premium cinematic wildlife infographic poster centered around a rare or visually unique animal species such as (animal). The entire artwork must feel like a futuristic luxury wildlife dossier rather than a normal educational infographic.
The animal should dominate the composition with intense photorealistic detail: ultra-detailed fur/scales, realistic eyes, moisture textures, cinematic shadows, environmental interaction, dramatic posture, visible muscle definition, floating particles, and powerful eye contact.
The environment must fully match the chosen species: (environment).
Build dense layered infographic storytelling around the animal using: • anatomy callouts
• adaptation systems
• prey and diet visuals
• ecosystem overlays
• conservation status indicators
• geographic range maps
• hunting behavior graphics
• climate danger visuals
• detail inserts
• tactical icon systems
• scientific labels and compact data snippets
The layout should feel highly artistic and cinematic instead of educational. Use: • asymmetric editorial composition
• layered transparent info panels
• premium typography
• subtle paper grain textures
• contour-line overlays
• holographic UI elements
• cinematic infographic markers
• museum-grade visual hierarchy
Blend: (luxury editorial aesthetic) + (cinematic documentary realism) + (futuristic infographic design) + (collectible field-guide energy).
Color Theme: (color theme)
Mood: (mood)
Lighting: dramatic cinematic lighting, volumetric fog, glowing rim light, atmospheric haze, realistic environmental reflections, high contrast shadows, ultra-premium editorial lighting.
The final artwork must look like a viral collectible wildlife poster people would instantly save, repost, print, and frame.
Ultra-realistic, 8K, cinematic infographic masterpiece, insanely detailed, premium art direction, tactile textures, layered storytelling, emotional visual impact, museum-quality composition, viral social-media-worthy aesthetic.
```

> 改编自 [@sha_zdiii](https://x.com/sha_zdiii/status/2054229209460117552) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0。
