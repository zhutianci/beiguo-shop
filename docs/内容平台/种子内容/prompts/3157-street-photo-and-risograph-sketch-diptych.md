---
title: "城市观察海报提示词：左边街角实拍、右边孔版印刷风线描 + 打字机档案（gpt-image-2）"
slug: street-photo-and-risograph-sketch-diptych
model: gpt-image-2
topics: [illustration, poster]
aspectRatio: "4:3"
needsRefImage: false
useCase: "生成一张左右对开的\"城市记忆研究\"海报：左边是街角红绿灯和交通标志的随手实拍，右边是米白纸上同一组路牌的绿色线描小画，配四行打字机字体档案信息，适合城市观察账号、摄影作品集和极简装饰画。"
prompt: |
  生成一张干净的左右对开"城市路口记忆研究"图：左边是写实照片参考，右边是一页极简的插画档案页。
  画布：4:3 横版，竖直平分。左半是清晰的白天照片；右半是米白有纹理的纸张海报，上面一幅小画和打字机风格的说明。
  左边：蓝天，中上偏右有一弯淡淡的半月；恰好 3 条斜穿天空的架空电线。底部是一组红绿灯：黑色长方形灯箱里竖排恰好 3 个圆形灯，最下面一个亮着绿色向上箭头。灯的左边恰好 1 块白色交通标志（红圈加斜杠的禁止转弯）。右下边缘裁出半块绿色路名牌，写着"[22nd Street]"。构图略带裁切、随手观察的感觉，像周末街拍。
  右边：暖米白纸张，细纤维、小斑点和手工印刷质感。中上部用简化的绿色线描画出同一组路口设施：恰好 2 根绿色竖杆、2 条弯曲的信号灯臂、1 个三色小信号灯、1 块禁止转弯小标志和 1 块写着"[22nd Street]"的绿色路名牌，后面几条细细的灰蓝色电线。画得略带不完美，像橡皮章或孔版印刷（Risograph）的速写。
  纸上文字：小画下方左对齐，四行黑色等宽打字机小字："[22ND ST & MISSION]" / "No. 002" / "URBAN. SIGNAGE. INTERSECTION." / "[2024]"。
  视觉风格：左边是自然光、饱和蓝天、真实阴影和略带裁切的街拍照片；右边极简、像档案、有触感，旧纸上用低调的绿、红、黑和灰蓝色墨。两半干净对齐，中间没有边框。
  限制：不要人物、车辆、额外的标志、水印和装饰边框，不要编造看不清的文字。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/AndreyRisuka/status/2091779819373740327
  author: "Andrey Risukhin"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；路牌文字、档案标题、年份改为变量"
images:
  - 3157-street-photo-and-risograph-sketch-diptych-1.jpg
imageCredit:
  by: "Andrey Risukhin"
  url: https://youmind.com/gpt-image-2-prompts?id=32472
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：路牌文字、档案标题和年份按你拍的地方改，例如"[人民路]""[人民路 & 解放路]""[2026]"（中文路牌也可以，但打字机字体的感觉会弱一些）。拍摄对象可以换成任何城市细节：消防栓、邮筒、老式路灯、地铁站入口，左右两段的物件清单跟着改。

示例图左边是一角湛蓝的天空：一弯半月、几条电线、一组亮着绿色箭头的红绿灯、一块禁止掉头标志和半块"22nd Street"路牌；右边米白纸上是同一组路灯杆和信号灯的绿色线描，下方四行打字机小字"22ND STREET & MISS'ION / No. 002 / URBAN. SIGNAGE. INTERSECTION. / 2024"。

**常见问题**：
- 右边线描太复杂：保留数量约束，并写"线条简单、留白多"。
- 打字机字拼错：示例图就把 MISSION 写成了"MISS'ION"，出图后要检查，必要时后期改字。
- 用自己的照片：上传照片并写"左半使用我上传的照片"。

**适合**：城市观察 / 扫街摄影账号、摄影作品集、极简装饰画、设计练习。

### 英文原版

```text
Goal: Create a clean side-by-side memory-study diptych of an urban intersection, combining a realistic photo reference on the left and a minimalist illustrated documentation page on the right.

Canvas: Landscape 4:3 image, split vertically into two equal halves. Left half is a crisp daytime photograph; right half is an off-white textured paper poster with a small drawing and typewriter-style caption.

Left side: Show a blue sky with a visible pale half moon near the upper center-right of the photo area. Include exactly 3 diagonal overhead utility wires crossing the sky. At the bottom, show a traffic-light assembly with exactly 3 stacked circular signal lenses in a black rectangular housing; the bottom lens glows green with an upward arrow. To the left of the signal, include exactly 1 white traffic sign showing a prohibited turning movement with a red circle and slash. At the lower right edge, partly crop a green street sign reading {argument name="street sign text" default="22nd Street"}. Keep the composition slightly cropped and observational, like a casual weekend street snapshot.

Right side: Use warm cream paper with subtle fibers, tiny speckles, and a handmade print texture. In the upper-middle area, draw a simplified green line illustration of the same intersection hardware: exactly 2 vertical green poles, exactly 2 curved signal arms, exactly 1 small traffic-light box with three red/orange/green circles, exactly 1 small no-turn sign, and exactly 1 green street-name placard reading {argument name="street sign text" default="22nd Street"}. Add a few thin gray-blue overhead wire lines behind the poles. The drawing should look slightly imperfect, like a rubber-stamp or risograph sketch.

Text content on the paper: Beneath the drawing, aligned left, add a small monospaced typewriter caption in black with four lines: "{argument name="caption title" default="22ND STREET & MISS'ION"}" / "No. 002" / "URBAN. SIGNAGE. INTERSECTION." / "{argument name="year" default="2024"}".

Visual style: The left side should be photographic with natural light, saturated blue sky, realistic shadows, and slight street-photo cropping. The right side should be minimalist, archival, and tactile, with muted green, red, black, and gray-blue ink on aged paper. Keep the two halves aligned cleanly with no border between them.

Constraints: No people, no cars, no extra signs beyond the counted elements, no watermark, no decorative frame, and avoid adding unreadable invented text.
```

> 改编自 [Andrey Risukhin](https://x.com/AndreyRisuka/status/2091779819373740327) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
