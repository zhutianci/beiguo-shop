---
title: 可灵提示词：脏鞋变新鞋前后对比广告（泥巴球鞋 → 抹布擦镜转场 → 影棚新鞋）
slug: kling-dirty-sneaker-clean-transformation
model: kling
topics: [product-video, ecommerce]
aspectRatio: "1:1"
needsRefImage: true
useCase: 清洁剂、擦鞋套装、洗鞋服务、新款球鞋的"前后对比"短视频：灰暗的泥巴鞋，一块抹布擦过镜头做转场，变成干净发亮的影棚英雄镜头。
prompt: |
  以我上传的鞋子图为准，生成一条约 8 秒的 1:1 前后对比视频。
  开场：一只沾满干泥的[白色运动鞋]，在刺眼、平淡的阴天光下，磨损、发灰、毫无生气。
  0–2 秒：低机位固定英雄镜头，灰尘颗粒在空中飘，画面完全去饱和。
  2–3 秒：一块抹布从镜头前快速擦过，形成甩镜擦除转场，画面被运动模糊拖开。
  3–6 秒：擦除过后，同一款鞋子一尘不染、轮廓清晰——针织纹理锐利、中底亮白，一道柔和的轮廓光勾出鞋带，影棚主光干净。
  6–8 秒：镜头绕着鞋跟缓慢环绕，细小的反光在崭新的网面上滑过，地面阴影紧贴鞋底。
  前后两个状态下，鞋子的比例、鞋眼数量、鞋带系法完全一致：不变形、不变款、不凭空增加细节。
  声音：一声硬毛刷扫过，鞋带被拉紧的清脆"啪"声。
negativePrompt: 鞋型变化，换了一双鞋，鞋眼数量变化，标志乱码，转场淡入淡出，画面闪烁，水印
source:
  repo: LichAmnesia/awesome-ad-video-prompts
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts#sneaker-out-of-mud
  author: "awesome-ad-video-prompts contributors"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；补充\"以上传的鞋子图为准\"和负面提示词；鞋款改为变量"
imageBrief: 仓库示例图鞋款带明显品牌标志，未采用。站长用无品牌白鞋生成 1 条，截取"泥鞋""擦镜转场""干净新鞋"三帧。
verify:
  - 可灵实测 3 次：擦除转场后是否还是同一双鞋
  - 首帧用干净鞋图还是脏鞋图效果更好（建议各试一次）
---
**时长与镜头**：8 秒三段：灰暗静止 → 抹布擦镜转场 → 干净英雄镜头 + 环绕。"抹布擦过镜头"是很实用的转场：遮挡画面的那一瞬间，模型可以名正言顺地"换状态"，比直接变身稳定。可灵 5 秒档建议只保留前两段加一个定格；10 秒档可以把环绕延长。

**怎么用**：首帧推荐用"干净的产品图"，在提示词里描述它一开始是脏的——模型给新鞋加泥比把泥鞋变干净更容易保持鞋型。也可以用首尾帧：首帧用图像模型给产品图"加泥巴"，尾帧用原图。

**怎么填变量**：[白色运动鞋] 换成"帆布鞋""皮靴"；清洁剂广告可以把抹布换成"喷一下泡沫，泡沫抹过镜头"。

**常见失败与调整**：
- 转场后换了一双鞋：改用首尾帧模式，两张图同一机位。
- 擦镜变成淡入淡出：写"抹布从左到右擦过镜头，硬切"。
- 环绕时鞋眼变多：把环绕改成"缓慢推近鞋跟"。

> 改编自 [LichAmnesia/awesome-ad-video-prompts](https://github.com/LichAmnesia/awesome-ad-video-prompts)（awesome-ad-video-prompts contributors），许可证 CC BY 4.0。

### 英文原版

```
Studio-to-hero transformation, 1:1. Open on a battered white sneaker caked in dried mud under harsh flat overcast — scuffed, gray, joyless. [0-2s] locked low-angle hero shot, dust motes drifting, fully desaturated. [2-3s] a passing cloth swipes the lens for a fast whip-pan wipe transition, motion-blur smearing the frame. [3-6s] the wipe clears to reveal the same [product] silhouette spotless and crisp — knit texture sharp, midsole bright white, a soft rim light tracing the laces against clean studio key. [6-8s] slow orbit around the heel, micro-reflections gliding across fresh mesh, ground shadow tight and grounded. The shoe keeps identical proportions, logo placement, eyelet count, and lace pattern across both states — no deformation, morphing, or invented detailing. Implied sound: a stiff brush sweep, the clean snap of laces pulled tight.
```
