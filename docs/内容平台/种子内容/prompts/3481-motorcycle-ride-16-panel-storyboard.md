---
title: "ai分镜提示词：上传摩托车生成 16 格海边骑行字幕分镜表（gpt-image-2）"
slug: motorcycle-ride-16-panel-storyboard
model: gpt-image-2
topics: [comic, photography]
aspectRatio: "1:1"
needsRefImage: true
useCase: "给摩托车短视频做分镜策划：上传一张车的照片，生成 4×4 共 16 格的电影感分镜表，从看夕阳、上车、点火、挂挡到驶向远方，每格带编号和一行字幕，可逐格交给图生视频模型。"
prompt: |
  以我上传的摩托车照片作为车辆设计参考，为一支摩托车短片生成一张电影感的 4×4 分镜联系表。
  车辆：保留参考图中摩托车的车身颜色、镀铬部件、边包、坐垫和整体比例，凡是出现车的格子都要与参考图一致；把它放进海边日落的骑行场景，并加上一位骑手。
  目标：用 16 格画面讲完"走近、上车、启动、操作、骑走"的全过程，中间穿插快切特写，像动作片里干净利落的组装蒙太奇。
  画布与版式：正方形画面，恰好分成 4 列 × 4 行共 16 个等大的格子。每格左上角有白色小号的镜头编号 1～16；每格底部有一行简短的[简体中文]白色字幕，带轻微的深色阴影保证可读。
  人物与场景：骑手是[深色长发女性，牛仔夹克配黑皮裤黑靴]，戴黑色手套；地点是[日落时分的海边公路]，温暖的橙色夕照、海平线、护栏，电影感浅景深。
  16 个镜头依次为：
  1. 背影：她望着沉入海面的夕阳。
  2. 她回头看向身后，此时已戴上黑色头盔。
  3. 远景：她走向停在护栏边的摩托车。
  4. 她跨上车，坐稳。
  5. 特写：戴手套的右手拧动点火开关。
  6. 特写：左脚把侧支架踢起。
  7. 特写：左手握紧离合器拉杆。
  8. 特写：左脚踩下变速踏板，挂入一挡。
  9. 特写：右手转动油门把手。
  10. 特写：发动机启动，仪表指针摆起。
  11. 特写：镀铬的 V 型双缸发动机在震动轰鸣。
  12. 后侧方：她缓缓松开离合，车开始移动。
  13. 摩托车沿海边公路平稳前行。
  14. 低机位前侧方：摩托车迎着夕阳驶来，充满张力。
  15. 远景背影：骑手沿着海边公路远去。
  16. 空镜：只剩夕阳下空荡荡的海边公路，暗示旅程还在继续。
  字幕内容与每格的动作对应；整体气质[怀旧、帅气、电影感、略带戏剧性]。不要出现汽车踏板等无关的操控装置；不要 Logo，不要水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/ojisan__isekai/status/2078037890404368813
  author: "@ojisan__isekai"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；原文写死的车身颜色和配件改为\"以参考图为准\"；骑手、场景、字幕语言、整体气质改为变量，日文字幕改为默认简体中文；16 个镜头逐条保留。"
images:
  - 3481-motorcycle-ride-16-panel-storyboard-1.jpg
imageCredit:
  by: "@ojisan__isekai"
  url: https://youmind.com/gpt-image-2-prompts?id=29027
  license: CC BY 4.0
verify:
  - "示例图发动机盖上有无法辨认的圆形徽标样纹饰，未见清晰的真实车标，请确认可接受"
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：上传一张摩托车的侧面或前侧方照片。骑手描述和 [日落时分的海边公路] 可以换成"穿皮衣的短发男性""雨后的山路""深夜的城市高架"；字幕语言默认 [简体中文]。16 个镜头是按巡航车的启动流程写的，踏板车没有离合和挡位，要把第 7、8、12 镜换成别的动作。

示例图是原作者的日文字幕版：4×4 共 16 格，每格左上角有白色编号，底部一行白色字幕；前四格是长发女骑手看夕阳、戴着头盔回头、走向停在护栏边的青绿色巡航摩托、跨上车；中间八格是拧钥匙、踢侧支架、握离合、踩挡、拧油门、仪表、镀铬发动机等特写和起步；最后四格是驶向夕阳、远去的背影和空荡荡的海边公路。

**常见问题**：
- 各格里车的颜色或款式变了：重申"所有格子里的摩托车与参考图完全一致"。
- 字幕出错：把每格字幕限制在 8 个字以内，或先不要字幕，后期自己加。
- 格子大小不一：强调"16 格等大，格间留细白线"。

**适合**：摩托车短视频的分镜策划、给图生视频模型准备逐镜头参考、车友 Vlog 脚本。参考图上的车标是否需要遮挡，请自行确认。

### 英文原版

```text
Using REFERENCE_0 as the motorcycle design reference, create a cinematic 4x4 storyboard contact sheet for a short motorcycle video. Preserve the bike’s distinctive turquoise body color, chrome cruiser parts, brown leather saddlebags, black seat, and overall proportions, but place it in a seaside sunset riding scene with a female rider.

Goal: Make a 16-panel visual storyboard showing the rider approaching, starting, operating, and riding the motorcycle, with quick-cut close-ups inspired by a stylish action-film assembly sequence.

Canvas and layout: Square image divided into exactly 16 equal panels in a 4 columns x 4 rows grid. Add small white panel numbers 1–16 in the top-left corner of each panel. Add short Japanese subtitle text along the bottom of each panel in white, with a subtle dark shadow for readability.

Scene and character: Add {argument name="rider description" default="a woman with long dark hair wearing a denim jacket, black leather pants, black boots, and black gloves"}. Set the location to {argument name="setting" default="a coastal road beside the ocean at sunset"}, with warm orange evening light, sea horizon, guardrails, and cinematic shallow depth of field.

Panel sequence: Use exactly these 16 shots:
1. Rear view of the woman looking at the sinking sun over the ocean.
2. She turns back over her shoulder, now wearing a black helmet.
3. Wide shot of her walking toward the parked motorcycle near the guardrail.
4. She mounts the motorcycle and settles onto the seat.
5. Close-up of her gloved right hand turning the starter key on the bike.
6. Close-up of her left boot kicking up the side stand.
7. Close-up of her left gloved hand squeezing the clutch lever.
8. Close-up of her left boot pressing the gear pedal down into first gear.
9. Close-up of her right hand twisting the throttle grip.
10. Close-up of the speedometer or gauge coming alive as the engine starts.
11. Close-up of the chrome V-twin engine vibrating and rumbling.
12. Rear three-quarter shot of the motorcycle beginning to move as she eases out the clutch.
13. The bike rolls forward smoothly along the coastal road.
14. Low dramatic front three-quarter shot of the turquoise motorcycle riding toward the sunset.
15. Distant rear shot of the rider heading down the road by the sea.
16. Final scenic shot of the empty sunset coastal road, implying the ride continues.

Subtitle style: Use Japanese captions matching the storyboard action. The overall mood should be {argument name="mood" default="nostalgic, cool, cinematic, and slightly dramatic"}. Keep the motorcycle consistent with the reference in every panel where it appears. Avoid adding car pedals or unrelated vehicle controls. No logos, no watermark.
```

> 改编自 [@ojisan__isekai](https://x.com/ojisan__isekai/status/2078037890404368813) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
