---
title: 手绘头像提示词（nano banana）：速写线条 + 厚涂的女生插画头像（雀斑、丸子头）
slug: sketch-style-portrait-illustration
model: nano-banana
topics: [illustration, portrait, character]
needsRefImage: false
aspectRatio: "1:2"
useCase: 想要一张有手绘质感的社交头像、小说 / 游戏原创角色立绘、文章人物配图时，生成"厚涂上色 + 速写线条外露"的半身插画，皮肤、雀斑和发丝细节丰富，衣服保留笔触感。
prompt: |
  一张迷人的数字插画：一位年轻女性，[小麦色皮肤，鼻梁和脸颊上有明显的雀斑]，[温暖的棕色眼睛，嘴角带一点微笑]。
  [蓬松凌乱的深色头发]随意挽成一个丸子头，几缕碎发垂在脸旁，发丝透着光。
  她穿着[淡紫色宽松 T 恤]，衣服部分保留明显的速写笔触和线条。
  脖子上戴着细金链项链，耳朵上戴一只金色圈形耳环。
  背景是简单的浅灰色纯色，让人物突出。
  画风：绘画与动态速写结合，线条清晰，色调温暖丰富；脸部细腻厚涂，身体和衣服逐渐过渡成速写线稿。
  竖版半身构图，人物看向镜头侧前方。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-nano-banana-pro-prompts
  url: https://x.com/afrinxai/status/2095814139117539735
  author: "@afrinxai"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 译成中文；肤色、眼睛表情、发型、服装设为变量，并把发色和服装默认值改成与示例图一致（原文为棕发、浅蓝白色上衣）；补充"脸部厚涂、身体过渡成速写"和构图说明
images:
  - 529-sketch-style-portrait-illustration-1.jpg
imageCredit:
  by: "@afrinxai"
  url: https://x.com/afrinxai/status/2095814139117539735
  license: CC BY 4.0
verify:
  - 示例图是原作者用变体参数生成的（发色、上衣颜色与原文默认值不同），本站已按示例图改写默认值，核对是否需要说明
  - 实测换成男性 / 不同发型时画风是否稳定
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么填变量**：四个方括号分别控制肤色与雀斑、眼睛和表情、发型、服装，改这几处就能得到完全不同的角色，例如"[白皙皮肤，无雀斑]""[灰蓝色眼睛，表情冷淡]""[银白色短发]""[黑色高领毛衣]"。示例图是原作者生成的结果：深色丸子头、满脸雀斑、金色圈形耳环，脸部细腻，淡紫色 T 恤则保留了大块笔触。

**想用自己的照片做头像**：上传一张正脸照，在开头加"参考上传照片中人物的五官、脸型和发型"，其他描述保留画风部分即可；不要上传他人或明星的照片。

**常见问题**：
- 太像照片、没有手绘感：加"可见的铅笔线条和粗糙笔触，不要照片质感"。
- 整张都很精细，没有速写过渡：强调"肩膀以下逐渐变成未完成的线稿"。
- 想要头像比例：画幅改成 1:1，构图改成"肩部以上特写"。

**适合**：社交平台头像、原创角色（OC）立绘、小说封面人物、文章人物配图。

### 英文原版

```
a captivating digital illustration of a young woman with a {argument name="skin tone" default="sun-kissed complexion and prominent freckles scattered across her nose and cheeks"}. she has {argument name="eyes and expression" default="warm brown eyes and a charming smile"}. her voluminous, textured brown hair is casually styled in a messy, swept-up bun, with soft, face-framing strands catching the light. she is wearing a {argument name="outfit" default="light-blue and white layered top, potentially a v-neck shirt or tunic"}, with visible sketch-like brushstrokes. a thin gold chain necklace with a subtle pendant is visible around her neck, and she wears a single gold hoop earring. the background is a simple, neutral light grey, allowing the subject to stand out. the art style is a blend of painting and dynamic sketching, with clear lines and rich, warm tones.
```

> 改编自 [@afrinxai](https://x.com/afrinxai/status/2095814139117539735) 发布、[YouMind-OpenLab/awesome-nano-banana-pro-prompts](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)。
