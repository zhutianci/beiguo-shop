---
title: 毛绒玩偶写真提示词：和自己的专属大号毛绒"分身"合影（gpt-image-2）
slug: plush-mascot-companion
model: gpt-image-2
topics: [figurine, portrait]
aspectRatio: "3:4"
needsRefImage: true
useCase: 上传一张人像，AI 根据你的气质设计一个专属大号毛绒玩偶并生成全身合影，适合头像、个人 IP 形象和社交平台封面。
prompt: |
  以我上传的人像为身份参考，保留可辨认的五官、发型、肤色、表情、穿衣风格和整体气质。
  生成一张高质量的全身写真：同一个人和一只大号定制毛绒玩偶在一起，这只玩偶像是 TA 的"吉祥物分身"。
  玩偶的灵感来自人物的情绪、面部印象、造型、姿态和整体能量，而不是普通的动物或吉祥物；请自动选择最能体现这个人独特气质的生物形象，避免俗套或刻板印象。
  玩偶必须一眼看出是超大毛绒玩具：柔软的绒毛面料、圆润的造型、细致的缝线、高级的材质，像设计师潮玩。它的设计、表情、轮廓和比例要隐约呼应人物的性格与视觉特征。
  从人物的发色、肤色、服装和氛围中提取配色，让人、玩偶和场景自然统一。
  人物和玩偶都要从头到脚完整入镜（包括鞋子和玩偶的全部），构图平衡、间距舒适。
  互动方式自然：[靠着玩偶坐在地上]（也可以是站在旁边、轻轻抱着、倚靠等）。人物表情放松、温暖、真实，带浅浅的微笑或平静的目光，不要僵硬、不要像假人。
  如果原图只露出部分服装，请合理补全成可信又好看的全身造型。
  场景：[干净的极简影棚]，或温馨的生活空间、精致的杂志背景，衬托人物和玩偶、不分散注意力。
  不要：身体被裁切、鞋子被挡、玩偶不完整、普通动物形象、真实动物、恐怖元素、廉价玩具感、别扭的姿势、杂乱背景、肢体变形、多余肢体、文字、Logo、水印。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/doctorwasif/status/2063304967218475072
  author: "@doctorwasif"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 英文原文译为中文；互动方式与场景改为变量；其余要求完整保留
images:
  - 126-plush-mascot-companion-1.jpg
  - 126-plush-mascot-companion-2.jpg
imageCredit:
  by: "@doctorwasif"
  url: https://x.com/doctorwasif/status/2063304967218475072
  license: CC0 1.0
verify:
  - 在 gpt-image-2 上实测 3 次，记录成功率与最常见的失败形式
  - 人物是否完整入镜、鞋子是否可见
  - 玩偶形象是否与人物气质有关联而非随机动物
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：[靠着玩偶坐在地上] 可以换成"站着抱住玩偶的胳膊""坐在玩偶腿上"；[干净的极简影棚] 可换成"洒满阳光的卧室""木地板客厅"。想指定玩偶形象，就把"自动选择"那句改成"玩偶是一只[戴耳机的小恐龙]"。

**常见问题**：
- 人物被裁掉脚：保留"从头到脚完整入镜"，画幅用 3:4 或 2:3，不要用 1:1。
- 玩偶像真动物：强调"明显是毛绒玩具，有缝线和绒毛"。
- 不像本人：参考照选清晰的半身或全身照；全身照能让服装补全更自然。

**示例图说明**：两张示例是同一提示词针对不同人物自动设计出的不同玩偶。

### 英文原版

```text
Use the uploaded portrait as the identity reference and preserve the person's recognizable facial features, hairstyle, skin tone, expression, fashion sense, and overall presence. Create a premium full-body portrait of the same person alongside a large custom-designed plush companion that feels like their mascot alter ego. The plush should be inspired by the subject's mood, facial impression, styling, posture, and overall energy rather than being a generic animal or mascot. Automatically choose a creature concept that best matches the person's unique vibe, avoiding predictable or stereotype-based selections. The mascot must clearly be an oversized plush toy with soft fuzzy fabrics, rounded shapes, detailed stitching, premium textures, and a collectible designer-toy aesthetic. Its design, expression, silhouette, and proportions should subtly reflect the person's character and visual identity. Build a harmonious color palette using cues from the subject's hair, skin tone, clothing, and atmosphere so the person, mascot, and scene feel naturally connected. Show both the person and plush fully visible from head to toe, including shoes and all parts of the mascot, with balanced framing and comfortable spacing. Choose a natural interaction that suits the subject, such as standing beside, sitting with, leaning on, lightly hugging, or casually engaging with the plush companion. Keep the person's expression relaxed, warm, and authentic with a subtle smile or calm gaze, avoiding stiff poses or mannequin-like appearances. If the original image only shows part of the outfit, intelligently complete the full look in a believable and stylish way. Place the scene in a clean, aesthetically pleasing environment such as a minimalist studio, cozy lifestyle setting, or refined editorial backdrop that complements both the person and mascot without distractions. The final image should feel charming, cozy, stylish, emotionally engaging, visually cohesive, and suitable for a high-end character campaign or social-media editorial. Avoid cropped bodies, hidden shoes, incomplete mascot visibility, generic animal choices, real animals, horror elements, cheap toy aesthetics, awkward poses, cluttered backgrounds, distorted anatomy, extra limbs, text, logos, or watermarks.
```

> 改编自 [@doctorwasif](https://x.com/doctorwasif/status/2063304967218475072) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0；示例图同样来自该仓库收录的原帖出图。
