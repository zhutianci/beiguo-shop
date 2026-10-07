---
title: AI海报提示词：黄昏江边长裙大片，主角彩色+背后斜排分镜画框拼贴（gpt-image-2）
slug: fashion-collage-sunset
model: gpt-image-2
topics: [fashion, photography]
needsRefImage: false
aspectRatio: "1:1"
useCase: 做服装上新海报、写真样片、情绪短片封面时，生成一张"主角彩色定格 + 背后多个暖色分镜小画面"的电影感拼贴，一张图讲出一段故事。
prompt: |
  一张电影感的时装拼贴大片，主角是一位[东亚女性]，在[金色夕阳下的江边]，穿着优雅的服装。
  - 背景：由多个暖色调圆角分镜画框组成，沿对角线斜向排列，每个画框里是低饱和、近乎单色的动态小场景——[撩头发、走过桥面、远眺天际线、迎风微笑]；
  - 主角：保持浓郁的彩色，身上有夕阳的高光，穿一条飘逸的[铁锈橙长裙]，裙摆有自然的布料流动感；
  - 氛围：有情绪的叙事感，浪漫的电影色调，高端时装杂志海报风格。
  画幅[1:1]。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/Mind_Boticni/status/2054203134411739609
  author: "@Mind_Boticni"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 译成中文并拆成要点；人物、场景、分镜动作、服装、画幅设为变量；把原文"日本女性"泛化为可替换的人物描述；补充了常见问题与改法
images:
  - 3257-fashion-collage-sunset-1.jpg
imageCredit:
  by: "@Mind_Boticni"
  url: https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts/blob/main/images/poster_case257/output.jpg
  license: CC0 1.0
verify:
  - 示例图背景小画框也带有较浓的暖色，并非提示词说的"近乎单色"，实测加"背景画框褪色、低饱和"后对比是否更明显
  - 人物为 AI 生成，展示时注意不要与真实人物关联
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么填变量**：[铁锈橙长裙] 换成你要展示的衣服，例如"米白色亚麻衬衫裙""墨绿丝绒吊带裙"；[金色夕阳下的江边] 可换"海边礁石""城市天台""秋天的银杏大道"；分镜动作写 3～4 个跟服装气质相符的小动作。示例图是方图：中间一位穿铁锈橙长裙的女生，裙摆在风里大幅扬起，身后斜排着几个圆角画框——有人撩头发、走在江边栏杆旁、远望城市天际线，整体被夕阳染成橙金色。

**常见问题与调整**：
- 主角和背景混在一起：加"背景画框褪色发灰，主角高饱和，两者明显分层"。
- 分镜里的人不像同一个人：写"所有画框里都是同一位女性，同一条裙子"。
- 想做上新海报：画幅改 3:4，追问"在左上留白，放品牌名和'[新品上市]'"。
- 想用模特实拍：上传模特照，写"主角使用上传照片的人物和服装"。

**适合**：服装上新海报、写真样片、情绪短片封面；用于售卖服装时，衣服颜色和面料要与实物一致。

### 英文原版

```
Cinematic vertical collage featuring a Japanese woman in elegant fashion captured during golden sunset. Background composed of warm-toned rounded storyboard frames arranged diagonally, each showing soft monochrome motion scenes—running fingers through hair, walking on bridge, looking at skyline, soft smile in wind. The main subject is in rich color with glowing sunset highlights, wearing flowing rust-orange designer dress with natural fabric movement. Emotional storytelling mood, romantic cinematic tone, high-end fashion editorial poster style.
```

> 改编自 [@Mind_Boticni](https://x.com/Mind_Boticni/status/2054203134411739609) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0。
