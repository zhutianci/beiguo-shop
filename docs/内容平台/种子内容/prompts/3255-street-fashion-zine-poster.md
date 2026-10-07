---
title: AI海报提示词：黑白拼贴风街头时尚杂志海报，大头像+撕纸拍立得+竖排大字（gpt-image-2）
slug: street-fashion-zine-poster
model: gpt-image-2
topics: [fashion, poster]
needsRefImage: false
aspectRatio: "2:3"
useCase: 做潮牌宣传、摄影作品集封面、乐队 / 活动海报时，生成一张地下杂志风的拼贴海报：上半部是冲击力强的人像特写，下方是两张撕边快照，配实验性大字和条码、胶带等细节。
prompt: |
  一张前卫的[街头时尚杂志]海报，精致的新千禧编辑风格，灵感来自地下街头杂志和高端都市广告。层叠拼贴构图：做旧纸张纹理、碎片化的杂志剪报、褪色的复印痕迹、晕开的油墨、划痕胶片叠层。
  - 主视觉：占据海报上半部的电影感人像特写，直视镜头、眼神锐利，皮肤纹理自然，嘴唇微微光泽，几缕凌乱的碎发，不戴眼镜，柔和的轮廓光，表情平静而有力量，像高端街头时尚广告的单反实拍；
  - 次视觉：下方恰好两张较小的撕边人像，分别是不同情绪和机位，像用胶带贴上去的拍立得，不对称地压在撕碎的纸片上；
  - 图形元素：超大的实验性竖排标题"[城市名]"融入构图，少量窄体英文小字说明"[副标题]"，地铁站牌碎片、条形码标签、编辑印章、折叠报纸纹理、遮蔽胶带、粗犷笔刷痕、颗粒感的胶片瑕疵、剪纸投影；
  - 整体：干净又叛逆，电影级对比，柔和的中性色——炭黑、象牙白、褪色银、水洗大地色，微微的闪光灯质感，真实的印刷瑕疵，细节丰富。
  不要可爱元素、不要粉彩色、不要卡通风。画幅[2:3]竖版。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/john_my07/status/2057319214739046552
  author: "@john_my07"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 译成中文并拆成要点；把"东京"杂志主题泛化为可替换的杂志类型和城市名大字，副标题设为变量；删掉 8K 等堆词；补充了常见问题与改法
images:
  - 3255-street-fashion-zine-poster-1.jpg
imageCredit:
  by: "@john_my07"
  url: https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts/blob/main/images/portrait_case212/output.jpg
  license: CC0 1.0
verify:
  - 示例图是"東京 / TOKYO UNDERGROUND"日文版，页面需注明，中文城市名版建议出一次
  - 人物为 AI 生成，展示时注意不要与真实人物关联
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么填变量**：[城市名] 写成两个字的竖排大字最有冲击力，例如"上海""重庆""香港"；[副标题] 用短英文或中文，如"UNDERGROUND ISSUE 07""夜行者"；[街头时尚杂志] 也可以写"独立乐队演出""摄影展"，就变成活动海报。示例图是黑白调：上半部一张女生特写，湿发贴在脸上，直视镜头；左边竖排巨大的"東京"二字，下方两张撕边快照（一张侧脸、一张在霓虹街头），四周有条形码、站牌、印章和日文小字，底部写着"TOKYO UNDERGROUND"。

**常见问题与调整**：
- 拼贴太乱看不清主体：加"主视觉人像占画面 55% 以上，其他元素只在边缘"。
- 小字变成乱码：减少文字模块，只保留大标题和一行副标题。
- 想用品牌模特照片：上传人像，写"主视觉使用上传照片中的人物，保持五官不变"。
- 想要彩色版：把配色改成"黑白为主，只保留一抹[信号红]"。

**适合**：潮牌宣传、摄影作品集封面、演出 / 展览海报；不适合需要清晰阅读大量文字信息的场景。

### 英文原版

```
Avant-garde Tokyo fashion zine poster with a refined neo-Y2K editorial aesthetic, inspired by underground Japanese street magazines and luxury urban campaigns. Layered collage composition featuring weathered paper textures, fragmented magazine clippings, faded xerox marks, distressed ink smears, scratched film overlays, and contemporary Harajuku-inspired graphic design.
Primary visual: a dominant cinematic beauty portrait occupying the upper half of the poster, intense direct gaze with razor-sharp eye detail, naturally textured skin, softly glossy lips, loosely pinned messy hair strands, no eyewear, subtle moody rim lighting, calm yet powerful expression, photographed like a luxury street-fashion campaign with ultra-realistic DSLR depth and authentic facial detail.
Secondary visuals: exactly two smaller ripped-frame portraits near the lower section, each showing different moods and camera perspectives, arranged asymmetrically like taped instant-film snapshots layered over torn paper pieces.
Graphic styling: oversized experimental Japanese typography integrated into the composition, minimal condensed English captions, faded metro signage fragments, barcode labels, editorial stamps, folded newspaper textures, masking tape strips, rough brush marks, grainy analog imperfections, layered cut-paper shadows, and sophisticated magazine-inspired spacing.
Overall mood: clean but rebellious, premium Japanese street-editorial energy, cinematic contrast, muted neutral palette with charcoal, ivory, faded silver, and washed earth tones, subtle flash photography feel, raw fashion photography realism, modern visual culture poster design, highly detailed luxury collage artwork, sharp focus, authentic print imperfections, ultra high resolution, 8K aesthetic, absolutely no kawaii elements, no pastel tones, no cartoon styling.
```

> 改编自 [@john_my07](https://x.com/john_my07/status/2057319214739046552) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0。
