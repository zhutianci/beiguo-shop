---
title: 电商卖点图提示词：产品特写 + 模特 + 大号数字卖点（耳机示例）
slug: product-feature-infographic
model: gpt-image-2
topics: [ecommerce, infographic]
aspectRatio: "3:2"
needsRefImage: false
useCase: 生成"手持产品特写 + 模特 + 30 小时续航"这类大号数字卖点的电商海报，适合详情页首屏和投放素材。
prompt: |
  为"[产品名]"[无线耳机]生成一张高冲击力的电商卖点信息图。
  前景：一只手把打开的[亮白色耳机充电盒]伸向镜头的极近特写，盒里是两只[白色耳机]，盒子正面有一颗小小的绿色指示灯；手和盒子带轻微微距景深。
  中景：一位[自信的年轻女性]，[深色头发扎成随意的丸子头]，自然妆容带水光感，穿[纯色黄色运动 T 恤]（无任何 Logo），一只耳朵戴着耳机，直视镜头，表情笃定。
  背景：干净的浅灰渐变影棚背景，浅景深；斜向的彩虹棱镜光斑和柔和漏光；背景里有几只虚化的悬浮耳机，增加层次和动感。
  光线：专业棚拍柔光，产品有光泽高光，人物有细微轮廓光。
  文字排版（现代无衬线体，白色）：
  - 顶部居中（人物身后）：大号粗体"[品牌名]"
  - 中左："[降噪 · 好音质]"
  - 中右：大号粗体"[30]"，下方小字"[小时续航]"
  - 右下：大号粗体"[1]"，下方小字"[年质保]"
  风格：超写实商业产品摄影，产品对焦锐利，配色鲜明干净，高级广告感。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/SPEEDAI07/status/2047981795552153860
  author: "@SPEEDAI07"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 英文原文译为中文；去掉原文中的真实品牌名，产品名、品类、模特、卖点数字与文字全部改为变量；卖点文字改为中文
imageBrief: 用一个虚构品牌名（如"LUMA"）和无 Logo 的白色耳机生成 1 张 3:2 卖点图；模特不得像任何真实名人。
verify:
  - 在 gpt-image-2 上实测 3 次，记录成功率与最常见的失败形式
  - 中文卖点文字与数字是否准确
  - 人物是否意外接近某位真实名人，若接近需重生成
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：[产品名] 和 [品牌名] 用你自己的；卖点挑 2–3 个最硬的数字（续航、重量、质保），数字越大越醒目。换品类时把"充电盒"那段改成对应的产品特写，例如"打开的口红盖""握在手里的保温杯"。

**常见问题**：
- 文字错位或乱码：中文卖点控制在 6 字以内；数字和单位分两行写更稳。
- 模特太像某个明星：在人物描述里加"普通人长相，不像任何名人"。
- 宣传用语合规：详情页上的数字必须和真实参数一致，"最强""第一"等用语受广告法限制。

**迭代**：先出无字版确认构图，再追问"加上以下文字……"。

### 英文原版

```text
High-impact e-commerce infographic for "{argument name="product" default="Apple Pods Pro 3"}" wireless earbuds.
Foreground: An extreme close-up of a hand holding an open glossy white wireless earbud charging case toward the camera. Inside the case are two sleek white earbuds with black speaker accents. A small glowing green LED indicator is visible on the front of the case. The hand and case have slight macro-lens depth blur for realism.

Mid-ground: A {argument name="model" default="confident young woman"} with tan skin, brown eyes, and dark hair tied in a messy bun. She has natural makeup with a dewy glow. She is wearing a plain {argument name="clothing" default="yellow athletic t-shirt"} (no logos). One white earbud is in her ear. She is looking directly at the camera with a subtle, confident expression.

Background: Clean soft gray gradient studio backdrop with shallow depth of field. Diagonal rainbow prism lens flares and soft light leaks across the scene. Several blurred floating white earbuds in the background for depth and motion.

Lighting: Soft professional studio lighting with glossy highlights on the product, subtle rim light on the model, high dynamic range.

Typography (modern sans-serif, white):

Top center (behind model): Large bold text “AIRPODS”

Top right: “Apple Pods Pro 3”

Mid-left: “Premium sound and noise cancellation”

Mid-right: Large bold “30” with “hours of battery life”

Bottom-right: Large bold “1” with “year warranty”

Style: Ultra-realistic, commercial product photography, 8k resolution, sharp focus on product case, shallow depth of field, vibrant yet clean color palette, premium advertising aesthetic.
```

> 改编自 [@SPEEDAI07](https://x.com/SPEEDAI07/status/2047981795552153860) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0。
