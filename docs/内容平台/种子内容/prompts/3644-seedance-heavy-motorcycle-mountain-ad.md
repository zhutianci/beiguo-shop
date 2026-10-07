---
title: seedance 提示词：重型摩托车品牌广告（雾中山路—暴雨岔路—山顶揭晓 · 悬念式汽车广告结构）
slug: seedance-heavy-motorcycle-mountain-ad
model: seedance
topics: [product-video, cinematic]
modelLabel: Seedance 2.0
aspectRatio: "16:9"
needsRefImage: true
useCase: 学习"先像电影、最后才揭晓产品"的高端汽车 / 摩托车广告结构：雾中山路出现、加速追逐、暴雨改走林间小路、雨停后山顶揭晓、产品环绕特写。适合摩托车、汽车、电动车、户外装备品牌片。
prompt: |
  一支高端电影感的[重型摩托车]广告，@图片1 为摩托车外观参考，16:9，约 15 秒（完整版 30 秒请分两条生成）。
  前 2/3 要像一部严肃的高成本动作惊悚片，而不是摩托车广告：营造神秘和张力，让观众好奇她要去哪里、在找什么。
  故事线：神秘 → 追逐 → 危险 → 目的地 → 揭晓 → 产品主视觉。
  人物：一位二十八九岁的专业女骑手，黑色头盔、贴身黑色皮夹克、深色骑行裤、黑手套、护具骑行靴，像真正的职业骑手而不是摆拍模特。人物服装、头盔和摩托车全程一致。
  0–3 秒｜未知之路：超广角，一条空旷的山路消失在浓雾中，清冷的清晨。远处的引擎声越来越近，重型摩托车突然从雾里冲出来。切到头盔里她眼睛的极近特写，专注、不动声色。
  3–6 秒｜追逐：低机位几乎贴着沥青，后轮甩起细小的水珠；戴手套的手拧动油门，引擎轰鸣；航拍感的大远景，小小的摩托车划过巨大的山景；她看了一眼后视镜，远处似乎有什么在跟着，但始终看不清。
  6–9 秒｜危险：天气骤变，暴雨倾盆，闪电照亮群山；一棵倒下的大树挡住悬崖边的窄路，她停下，发动机在雨中怠速。她看见一条消失在黑暗森林里的土路，嘴角一丝笃定的笑，车头一转驶离柏油路，宽大的轮胎碾过湿砾石。
  9–12 秒｜目的地与揭晓：黑暗的森林豁然开朗，摩托车驶上壮观的山顶观景台，风暴散去，金色阳光破云而出，画面从冷峻低饱和转为温暖浓郁。她摘下头盔，望向辽阔的地平线——原来她不是在逃，而是在找这个地方。
  12–15 秒｜产品主视觉：音乐收住，镜头缓慢优雅地环绕摩托车，金色阳光滑过金属车身，依次扫过发动机、车架、油箱倒影、车灯、皮座椅和宽大的后轮；她重新坐上车，拧一下油门，一声深沉的引擎轰鸣。车灯亮起，定格。
  色调从冷灰逐渐过渡到暖金；35mm 变形宽银幕质感，细微胶片颗粒，真实的发动机振动和悬挂运动。故事过程中画面不出现任何文字。
negativePrompt: 摩托车外观变化，车轮数量错误，人物换脸，肢体畸形，画面文字，品牌标志乱码，水印
source:
  repo: YouMind-OpenLab/awesome-seedance-2-prompts
  url: https://x.com/codewithhajra/status/2103455108738539821
  author: "@codewithhajra"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文为 30 秒六场的英文长脚本，本站译为中文并压缩为 15 秒五段，保留\"神秘—追逐—危险—目的地—揭晓\"结构；原文结尾的英文旁白与标版文字删去（建议后期加）；增加 @图片1 产品参考"
imageBrief: 来源缩略图为写实人像特写，未采用。站长生成后截取"雾中冲出""暴雨岔路""山顶环绕车身"三帧。
verify:
  - Seedance 2.0 实测：15 秒五段是否过满，必要时拆为两条（前 9 秒故事 + 后 6 秒产品）
  - 确认原帖仍可访问
---
**时长与镜头**：原作 30 秒六场，本站压缩到 15 秒五段。更稳的做法是拆成两条：第一条 0–9 秒（雾中出现、追逐、暴雨岔路），第二条 9–15 秒（山顶揭晓 + 产品环绕），第二条用第一条最后一帧接上。

**结构值得学**：高端汽车 / 摩托车广告常用"先讲故事、最后才亮产品"——前 2/3 完全不像广告，制造悬念（她要去哪、谁在追她），到最后揭晓"她是在寻找这个地方"，产品作为旅程的一部分登场。这比开场就怼产品特写更有记忆点。色调从冷到暖的变化，也在暗示情绪从紧张到释然。

**怎么填变量**：[重型摩托车] 换成"越野车""电动皮卡""公路自行车"，并上传产品图作 @图片1。人物可以换成男性骑手，或者干脆不摘头盔，保持神秘感。

**常见失败与调整**：
- 摩托车每个镜头都不一样：多给几张不同角度的产品图（Seedance 2.0 官方说明最多 9 张图片参考），并写"车辆外观严格以参考图为准"。
- 产品环绕段车身变形：环绕角度改小，或最后用实拍产品素材替换。
- 雨夜太黑：写"闪电和车灯提供足够的光线"。

> 改编自 [@codewithhajra](https://x.com/codewithhajra/status/2103455108738539821) 发布、[YouMind-OpenLab/awesome-seedance-2-prompts](https://github.com/YouMind-OpenLab/awesome-seedance-2-prompts) 收录的提示词，许可证 CC BY 4.0。

### 英文原版（原文较长，此处节选）

```
Create a 30-second premium cinematic advertisement centered around a powerful heavy motorcycle and a striking adult female rider.

The film should initially feel like a serious, high-budget cinematic action thriller — NOT a motorcycle commercial.

For the first 20 seconds, create mystery and tension. The audience should wonder where she is going, what she is searching for, and why she is riding alone through such a dangerous environment.

The motorcycle should feel heavy, powerful, expensive and mechanically realistic.

The story should naturally build from:

MYSTERY → PURSUIT → DANGER → DESTINATION → REVEAL → HERO PRODUCT

Do NOT copy any existing advertisement, film, commercial, character, composition, scene or visual sequence. Create an entirely original story.

VISUAL STYLE

Photorealistic cinematic filmmaking.

Premium high-budget automotive commercial production.

Large-format cinema look with 35mm anamorphic photography.

Deep cinematic contrast, natural skin texture, realistic motorcycle materials, metal, leather, glass and rubber.

Realistic engine vibration, suspension movement and mechanical motion.

Subtle film grain, natural motion blur and realistic environmental lighting.

No cartoon appearance.
No generic AI aesthetic.
The motorcycle must remain physically believable and visually consistent throughout the entire film.

Use dramatic wide landscapes contrasted with intimate close-ups.

The color palette begins cold and desaturated and gradually transitions into rich, warm golden tones toward the final reveal.

MAIN CHARACTER

A strikingly beautiful adult woman in her late 20s.

Dark flowing hair naturally tucked beneath a premium black motorcycle helmet.

Confident, focused expression.

Natural makeup.

She wears a fitted black leather motorcycle jacket, dark riding pants, black gloves and realistic protective riding boots.

Her appearance, clothing, helmet and motorcycle remain perfectly consistent throughout the entire film.

She should look like a real professional rider, not a fashion model posing on a motorcycle.

MOTORCYCLE

A massive premium heavy motorcycle.

Muscular proportions.

Large engine.

Wide rear tire.

Heavy metallic frame.

Premium black and brushed-metal finishes.

Realistic suspension movement.

Visible engine vibration.

Powerful headlight.

Subtle reflections across the fuel tank.

The motorcycle should feel extremely powerful but elegant.

Keep the exact motorcycle design consistent throughout every shot.

SCENE 1 — THE UNKNOWN ROAD

0–5 SECONDS

EXTREME WIDE CINEMATIC SHOT.
……
```
