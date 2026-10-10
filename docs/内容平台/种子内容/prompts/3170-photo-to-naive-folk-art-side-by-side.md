---
title: "照片转稚拙插画提示词：左边实拍、右边蜡笔彩铅民间风小画的对开海报（gpt-image-2）"
slug: photo-to-naive-folk-art-side-by-side
model: gpt-image-2
topics: [illustration, poster]
aspectRatio: "7:6"
needsRefImage: true
useCase: "上传一张照片，生成左右对开的设计海报：左边保留调色后的原照片，右边把画面重新讲成稚拙民间艺术风的插画（简化剪影、原始造型、平面透视、蜡笔彩铅质感、手写小字），适合旅行照片、生活记录和创意社媒图。"
prompt: |
  请把我上传的每一张照片分别做成一张独立的高端设计海报，不要拼贴，逐张输出。整体是 7:6 的左右对开版式，两栏等宽。
  左栏：保留原照片，主体的身份、结构、姿态、真实质感、自然光线和原有色彩氛围不变，只做轻微的专业调色，有艺术杂志或展览的质感。环境可以自然延展以适配画幅，主体不能被拉伸。
  右栏：提取照片中最有辨识度的主体、轮廓、姿态和叙事，重构为一幅稚拙的民间风叙事插画（Naïve folk art）。不要精确描摹照片，而是主动简化细节：用剪影、原始造型和少量色块重新讲述原来的场景，让人一眼认出主体，同时保留质朴、幽默、生活化的感觉。
  主体用简化的剪影和大块原始造型，压缩比例、夸张特征，不追求严格的透视和解剖；空间使用平面化透视，靠大小和颜色关系来讲故事，可以加入一些照片里没有、但符合情境的小人物或小物件增加趣味。
  质感：蜡笔、彩铅和水粉的粗糙笔触，颜色涂得不完全均匀，有纸张纹理；背景是暖米色纸。
  在右栏的空白处加几行歪歪扭扭的手写短句（英文或中文），像画家在画上随手写的注释，右下角一个小小的印章或签名。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/xiaoxiaodong01/status/2093627864973295787
  author: "小小东"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文中文说明的英文写法改写为中文，补全了被截断的笔触与文字要求"
images:
  - 3170-photo-to-naive-folk-art-side-by-side-1.jpg
  - 3170-photo-to-naive-folk-art-side-by-side-2.jpg
  - 3170-photo-to-naive-folk-art-side-by-side-3.jpg
imageCredit:
  by: "小小东"
  url: https://youmind.com/gpt-image-2-prompts?id=32945
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：这条没有方括号变量，上传照片即可：地标、树屋、河流、街景都很适合。想指定手写短句，加一句"右栏手写：Red over Tokyo / See you tomorrow"。右栏也可以写中文短句，但手写中文更容易出错，建议 2～4 个字一行。

示例图三张：东京塔（左边是高处俯拍的红白东京塔和城市，右边蜡笔画的东京塔、彩色楼房和一排看塔的小人，写着"Red over Tokyo / See you tomorrow"）；树上的帐篷小屋（右边变成绿色蜡笔大树里的小屋和"room with a view"）；雪地河流上的独木舟（右边是蓝色大河和小船，写着"between ice and silence"）。

**常见问题**：
- 右栏画得太精细：强调"稚拙、原始造型、不追求透视"。
- 与左栏对不上：写"保留照片的主体和构图关系"。
- 想要竖版：改成"3:4 上下分割"。

**适合**：旅行照片整理、生活记录、创意社媒图、装饰画与明信片。

### 原版提示词

```text
Please transform each photo I upload into an individual high-end design poster, rather than a collage, outputting each photo separately. The overall composition should be a 7:6 side-by-side layout, with two vertical sections of equal width. The left section preserves the original photo, maintaining the subject's identity, structure, pose, realistic texture, natural lighting, and original color atmosphere, with only slight professional color grading for an art magazine or exhibition quality. The environment can be naturally extended to fit the frame without stretching the subject. The right section extracts the most recognizable subject, silhouette, pose, and narrative from the photo, reconstructing it as a Naïve folk-inspired narrative illustration. Do not trace the photo exactly; actively simplify details using silhouettes, primitive forms, and minimal color blocks to retell the original scene with visual cues that make the subject instantly recognizable while maintaining a rustic, humorous, and slice-of-life feel. Use simplified silhouettes and large primitive forms for the subject, compressing proportions and exaggerating features without strict perspective or anatomy. The space should use a flattened perspective, building narratives through size and color relationships, with secondary objects distributed like rhythmic visual symbols. The visuals should feature granular textures similar to crayons, oil pastels, thick pencils, and dry materials, with visible rubbing and paper textures in dark areas. Outlines should have a handcrafted, slightly awkward feel. Use a limited color palette derived from the most vibrant and representative colors in the original photo, set against a warm white paper base with dark silhouette anchors. Include spot-color accents for specific focal points, avoiding dull or neon colors. The composition should value the visual center, negative space, and rhythmic relationships, avoiding a centered look. Minimalist typography should be naturally integrated, using simple, slightly irregular folk-art fonts that act as signs or annotations within the scene rather than structured commercial titles. The overall aesthetic should be intimate, clever, and sophisticated, avoiding childish cartoons, 3D rendering, or smooth vector styles.
```

> 改编自 [小小东](https://x.com/xiaoxiaodong01/status/2093627864973295787) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
