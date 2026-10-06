---
title: veo 3 提示词：精华液吸收延时广告（滴管微距 + 进度条 UI · 实验室风格）
slug: veo-serum-absorption-timelapse
model: veo
topics: [motion-graphics, product-video]
modelLabel: Veo 3
aspectRatio: "1:1"
needsRefImage: false
useCase: 生成 6 秒方形的"实验室微距"卖点视频：精华从滴管滴下 → 延时摄影里铺开、渗入、气泡消失，底部一条极简进度条计时 → 镜头抬起看到水润的成膜效果。适合精华、面霜、防晒的"吸收快 / 不黏腻"卖点展示。
prompt: |
  一条约[6]秒的护肤品卖点短片，1:1 方形画幅，像实验室里的微距观察记录。产品是一瓶[保湿精华液]。
  0–2 秒：极近的微距，一滴[琥珀色]精华挂在玻璃滴管尖上，柔和的顶部柔光箱照明，安静、空旷的环境声；液滴轻轻颤动，然后落下。
  2–4 秒：液滴落在一块光滑的肤色表面上，压缩的延时摄影开始：精华摊开成薄而均匀的一层，明显地向下渗入，表面的小气泡一个个消失；画面底边有一条极简的细进度条随秒数填满。
  4–6 秒：镜头平滑地抬到 45 度角，露出完全吸收后水润均匀的表面，一道镜面高光随着表面倾斜缓缓滑过。
  滴管和瓶子的形状、液体颜色、滴头胶帽和标签全程保持一致：不变形，液体不拉丝，不出现多余的液滴。
  调色：奶油感的柔和粉彩，玻璃反光通透，全程失重般的慢动作。
  声音：一声轻轻的滴落声，延时段是细微的电子计时音，最后一声清脆的提示音。
negativePrompt: null
source:
  repo: LichAmnesia/awesome-ad-video-prompts
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts#absorption-time-lapse-hydrating-serum
  author: awesome-ad-video-prompts contributors
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 英文原文译为中文；时长、产品、液体颜色改为变量；新增声音描述；去掉原文的品牌占位符
images:
  - 542-veo-serum-absorption-timelapse-1.jpg
imageCredit:
  by: LichAmnesia/awesome-ad-video-prompts
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts/blob/main/images/absorption-time-lapse-hydrating-serum.png
  license: CC BY 4.0
verify:
  - 在 Veo 3 实测 3 次：所用入口是否支持 1:1（Veo 常见为 16:9 / 9:16，以官方说明为准），不支持就改用 9:16 并调整构图
  - 进度条 UI 是否被画成乱码或文字；"向下渗入"能否表现出来
  - 示例图是仓库提供的关键帧拼图（上：滴管与玻璃皿；下：皮肤上的液滴，已转 JPG 压缩），不是 Veo 成片截图
  - 广告用途需注意：画面只能示意，不得据此宣称具体吸收时间或功效（化妆品广告法规）
---
**时长与镜头**：三段是"滴落 → 延时吸收 → 结果"。延时段是重点，进度条让观众直观感到"几秒就吸收"，但视频本身只是示意，正式投放时不要配上具体秒数或功效承诺。

**怎么填变量**：[保湿精华液] 换成"[清爽防晒乳]""[美白面霜]"，液体颜色跟着改成乳白、浅粉；"肤色表面"想更直观，可以写"手背的皮肤"，但手背特写更容易出现纹理怪异，建议先用光滑表面。

**常见失败与调整**：
- 进度条变成文字或数字乱码：写"一条没有任何文字和数字的细线进度条"，或干脆删掉、后期加。
- 液体拉丝、滴不下来：加"液滴干脆地断开，一次落下"。
- 画面不是方形：在入口里手动选比例，不要只靠提示词。

> 改编自 [LichAmnesia/awesome-ad-video-prompts](https://github.com/LichAmnesia/awesome-ad-video-prompts)（awesome-ad-video-prompts contributors），许可证 CC BY 4.0。

### 英文原版

```
Beauty-lab feature explainer for a [brand] hydrating face serum, shot like a clinical macro study. 0-2s: extreme macro on one amber droplet hanging off a glass pipette tip, soft diffused softbox light from above, a quiet airy room tone, the droplet trembling then releasing. 2-4s: the drop lands on a smooth skin-toned surface and a compressed time-lapse begins — the liquid fans out in a thin even sheet and visibly sinks downward as tiny surface micro-bubbles dissolve one by one, a slim minimalist progress bar filling along the bottom edge to mark the seconds. 4-6s: the camera lifts smoothly to a 45-degree angle revealing a dewy, fully-absorbed even finish with a single specular highlight gliding across as the surface tilts. The pipette and bottle hold identical shape, amber tint, dropper bulb, and label across every frame — no deformation, liquid stringing, smearing, ghost droplets, or warping glass. Creamy pastel grade, glassy reflections, weightless slow motion throughout.
```
