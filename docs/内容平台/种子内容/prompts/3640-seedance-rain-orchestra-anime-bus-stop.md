---
title: seedance 提示词：雨夜公交站指挥雨水交响乐（日系 3D 动画 · 五段式奇想短片）
slug: seedance-rain-orchestra-anime-bus-stop
model: seedance
topics: [cinematic, image-to-video]
modelLabel: Seedance 2.0
aspectRatio: "16:9"
needsRefImage: true
useCase: 上传一张原创角色设定图，生成"雨滴打在纽扣上响起音符—角色用雨伞当指挥棒—整座城市的雨变成发光的交响乐"的奇想动画短片，适合原创 IP 角色宣传、动画 MV、治愈系短片。
prompt: |
  规则：
  - 剧场版级别的动画质感，日式高端手办风哑光 3DCG
  - 多镜头、快节奏剪辑，每个镜头更换运镜方式，不重复
  - 没有背景音乐，只有环境声和音效；不要字幕；画面中不要文字、标志和数字
  - 节奏：安静的表演慢慢演、给停顿，高光时刻快速推进
  - 雨要细、快、真实：地面溅起的水花、湿路面上的光反射、湿头发和湿衣服的重量都要符合物理
  - 夜雨，路灯和霓虹的暖色倒映在湿路面上，画面不要沉成一片灰
  - 主角在画面中保持较大比例，脸和服装清楚可见
  @图片1 为主角[小茜]。全程保持她的脸、发型、发饰和服装与 @图片1 一致，画面里只有一个她，[红色雨伞]是她的。
  第一段：雨夜公交站。一滴雨打在 @图片1 主角外套的圆纽扣上，"咚"地响起一个钢琴音，一圈光从纽扣向外扩散。镜头：纽扣极近特写，捕捉雨滴落下的瞬间。
  第二段：独自坐在长椅上百无聊赖的主角猛地抬头，又弹了一下纽扣，又响一声，她狡黠地笑了。镜头：公交站正面中景。
  第三段：她站起来，挥动合起的雨伞当指挥棒——铁皮屋顶上的雨变成鼓点，排水槽变成木琴，水洼变成镲片，每一滴雨落下都溅起彩色的光点。镜头：快切，依次推近屋顶、排水槽、水洼。
  第四段：指挥越来越大，整条街的雨都发出光，灰暗的夜城变成闪耀的彩色雨幕。镜头：环绕主角并缓缓升高。
  第五段：最后一挥，所有雨滴停在半空，像发光的音符一样悬浮；她放下雨伞鞠躬，静止的雨一齐落下，响起掌声般的雨声。镜头：透过发光的雨滴，主角鞠躬的正面半身。
  她害羞地说："[我好像有点喜欢下雨天了。]"
negativePrompt: 多个主角，角色外形变化，画面发灰，雨伞颜色变化，字幕，文字，数字，水印
source:
  repo: YouMind-OpenLab/awesome-seedance-2-prompts
  url: https://x.com/aiehon_aya/status/2104214870300529025
  author: "@aiehon_aya"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原帖为日文、仓库收录的是英文译本；本站据英文版译为中文；角色名、道具和台词改为变量，原文台词为日语，本站改为中文"
images:
  - 3640-seedance-rain-orchestra-anime-bus-stop-1.jpg
imageCredit:
  by: "@aiehon_aya"
  url: https://x.com/aiehon_aya/status/2104214870300529025
  license: CC BY 4.0
verify:
  - Seedance 2.0 实测 3 次，记录"每段换一种运镜"的要求是否被执行
  - 使用自己的原创角色设定图，不要上传他人作品
  - 确认原帖仍可访问
---
**时长与镜头**：五段奇想故事，建议用满 15 秒（每段约 3 秒）。原作把"全局规则"和"分段剧情"分开写：规则段统一画风、节奏、声音和物理细节，剧情段只管发生什么、镜头怎么拍——这是写多段视频提示词最清晰的结构，值得照搬。

**怎么用**：@图片1 放一张原创角色的设定图（正面全身、服装细节清楚最好），并在提示词里点名她的标志性元素（发色、发饰、外套纽扣、雨伞），后面剧情里就能直接引用这些元素当道具，比如"雨滴打在纽扣上"——让角色设定和剧情绑在一起，一致性会更好。

**怎么填变量**：[小茜] 换成你的角色名；[红色雨伞] 换成角色的标志性道具。"雨水交响乐"的创意也能换成"雪花钢琴""落叶鼓点"。

**常见失败与调整**：
- 画面出现两个主角：保留"画面里只有一个她"。
- 雨夜太暗：保留"暖色倒映在湿路面上，不要沉成一片灰"。
- 镜头一直是同一种推进：把每段的"镜头"写得更具体（特写 / 正面中景 / 快切 / 环绕升高 / 半身）。

> 改编自 [@aiehon_aya](https://x.com/aiehon_aya/status/2104214870300529025) 发布、[YouMind-OpenLab/awesome-seedance-2-prompts](https://github.com/YouMind-OpenLab/awesome-seedance-2-prompts) 收录的提示词，许可证 CC BY 4.0。

### 英文原版（原帖为日文，以下为仓库收录的英文译本）

```
Rules:
- Budget-scale theatrical anime quality, Japanese high-end figure-like matte 3DCG
- Multi-shot
- Fast cuts, many frames per second. Prioritize speed and impact
- Professional-grade VFX
- Change camera work every shot (no repetition of same movement)
- No BGM; ambient sound/SFX only
- No subtitles
- All dialogue in Japanese
- Pacing: Take time to show quiet acting, move quickly during showcase moments
- Rain is fine, fast, real rain. Physically accurate depiction of splashes on the ground, light reflections on wet pavement, weight of wet hair and cloth
- Night rain. Reflect warm colors from streetlights and neon on wet pavement; do not let the screen sink into gray
- Keep the protagonist large in the frame; face and outfit clearly visible. Do not make them tiny in long shots
- No text, logos, or numbers on screen

@ Image1: Subject - Akane

[Consistency] Maintain Akane's face, long hair transitioning from salmon orange to silver tips, red and white round hair ornaments, and red long coat with round buttons and white circular patterns throughout. Only one Akane. The red umbrella belongs to Akane.
[Generation Goal] Rain Sound Orchestra
(5 stages, 1 continuous video. From a rainy night bus stop to conducting rain across the city)
[S1] Rainy night bus stop. The moment a raindrop hits the round button on @ Image1 Akane's coat, a piano note 'Poon' sounds, and a ring of light expands from the button.
Camera: Extreme close-up of the button. Capture the instant the raindrop hits.
[S2] Akane, sitting alone looking bored on a bench, suddenly looks up. Flicking the button again produces another sound. Akane smiles mischievously.
Camera: Front view of bus stop, medium shot.
[S3] Akane stands up and waves her closed red umbrella like a conductor's baton. Rain falling on tin roof becomes drums, gutters become xylophones, puddles become cymbals; each raindrop impact creates colorful droplets of light.
Camera: Fast cuts zooming in sequentially on roof, gutter, puddle.
[S4] Conducting grows larger, rain across the street glows with light, turning the gray night city into a shining colorful rain. Akane's long hair flows from orange to silver.
Camera: Orbiting around Akane while rising.
[S5] With the final wave, all raindrops stop in mid-air, floating like glowing musical notes. Akane lowers her umbrella and bows; the stopped rain falls all at once, creating applause-like rain sounds.
Camera: Front view of bowing Akane, bust shot through glowing raindrops.
Akane (shyly) says: {I kind of like rainy days}
```
