---
title: "ai头像生成提示词：商务职业照 + 姓名职位名牌的个人简介海报（gpt-image-2）"
slug: business-headshot-nameplate-poster
model: gpt-image-2
topics: [portrait, poster]
aspectRatio: "4:5"
needsRefImage: false
useCase: "做团队介绍页、讲师嘉宾海报或个人简介卡时用：上方是白底棚拍半身职业照，下方是深藏青信息栏，写姓名、职位、机构三行字，藏青、白、金三色。"
prompt: |
  做一张正式的商务职业照个人简介海报：上半部分是干净的棚拍肖像，下半部分是典雅的姓名牌。人物是一位虚构的成年职场人士。竖版 4:5，高分辨率，企业人物介绍的设计感。
  - 肖像区占画面上方约 70%：居中的半身职业照，人物是[一位成年女性，深棕色及肩微卷发]，穿[深藏青修身西装外套配白色敞领衬衫]，身姿挺拔，双臂自然交叠或收在身前，表情亲和自信；纯白背景，柔和均匀的棚灯；
  - 信息栏占画面下方约 30%：一块横贯全宽的深色矩形面板，颜色是接近黑色的藏青；面板顶边有一条细细的金属金色线，靠右上角有一个小小的金色斜角装饰；
  - 信息栏里只有 3 行左对齐的文字，四周留足边距：第 1 行是白色衬线大字的姓名"[林若溪]"，第 2 行是小一号的金色无衬线职位"[高级平面设计师]"，第 3 行是更小的浅灰色无衬线机构名"[国际设计研究院]"；姓名下方有 1 条短短的金色横线，和文字左端对齐；
  - 整体气质：领英式高管肖像加上高级杂志的排版，写实摄影，藏青、白、金三色高对比，间距讲究，高级、极简；
  - 只出现 1 个人物和 1 块信息栏；不要 Logo、图标、水印、多余的说明文字、背景花纹或其他人。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/Eric_Kangg/status/2069702376475238469
  author: "@Eric_Kangg"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文，原文的分段说明合并成要点列表；人物外形、服装、姓名、职位、机构改为变量，英文示例文字换成中文默认值；删去原文\"用色块遮住面部\"的要求（示例图人物面部完整）；正文补充了上传本人照片的用法和证件照边界提醒。"
images:
  - 3470-business-headshot-nameplate-poster-1.jpg
imageCredit:
  by: "@Eric_Kangg"
  url: https://youmind.com/gpt-image-2-prompts?id=26692
  license: CC BY 4.0
verify:
  - "示例图是高度写实的 AI 生成虚构人物加虚构姓名\"Yuna Koizumi\"，无水印；请确认这类写实人像可以收录"
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[林若溪]、[高级平面设计师]、[国际设计研究院] 换成自己的姓名、职位和机构，中英文都可以；人物外形和服装两处按需要改。想用本人形象，上传一张清晰的正面半身照，把人物描述改成"按上传照片中的人物，保持五官和发型不变"。

示例图是原作者的英文版：纯白背景前一位深色及肩卷发、穿藏青西装和白衬衫的女性半身照，面带浅笑；下方深藏青信息栏顶边有一条金线，栏内白色衬线大字"Yuna Koizumi"，金色小字"Senior Graphic Designer"，浅灰小字"International Design Institute"，姓名下一条金色短线。图中人物是 AI 生成的虚构形象。

**常见问题**：
- 中文姓名变成黑体：注明"姓名用宋体类衬线字"。
- 信息栏太高、挡住手臂：写明"信息栏只占下方 30%，人物肩膀在其上方完整露出"。

**适合**：团队介绍页、讲师 / 嘉宾海报、个人简介卡、作品集封面。它不是证件照：正式证件照以受理机构的规格要求为准，AI 生成的照片可能不被接受。

### 英文原版

```text
Goal: Create a formal business headshot profile poster for a fictional adult design professional, combining a clean studio portrait with an elegant nameplate area.

Canvas: Vertical 4:5 poster, approximately 768 x 960 px, crisp high-resolution corporate profile design.

Portrait area: Upper 70% of the image shows a centered waist-up studio headshot of an adult woman with {argument name="hair color" default="dark brown"} shoulder-length softly waved hair, wearing a dark navy tailored blazer over a white open-collar dress shirt. She has a professional upright pose with arms subtly crossed or held close, photographed against a pure white background with soft even studio lighting. Add a large centered rectangular anonymization block over the face, using a smooth skin-tone/brown gradient, covering the facial features from forehead to chin while leaving hair, ears, neck, and clothing visible.

Lower profile panel: Bottom 30% is a dark near-black navy rectangular information panel spanning the full width. Add a thin metallic gold line along the top edge of the panel, with a small angular gold accent notch near the upper-right edge. The design should feel premium, minimalist, and editorial.

Text content: Place exactly 3 text elements on the lower panel, aligned left with generous margins: 1) large white serif name text: {argument name="character name" default="Yuna Koizumi"}; 2) smaller gold sans-serif job title: {argument name="job title" default="Senior Graphic Designer"}; 3) smaller light gray sans-serif organization text: {argument name="organization" default="International Design Institute"}. Add exactly 1 short horizontal gold divider line beneath the name, aligned with the left text column.

Visual style: Professional LinkedIn-style executive portrait mixed with luxury editorial typography, realistic photography, clean composition, high contrast navy-white-gold palette, refined spacing, no clutter.

Constraints: Use exactly one portrait subject, exactly one face-obscuring rectangle, exactly one lower information panel, exactly one gold divider line under the name, and exactly three text lines. Do not add logos, icons, watermarks, extra captions, background patterns, or additional people.
```

> 改编自 [@Eric_Kangg](https://x.com/Eric_Kangg/status/2069702376475238469) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
