---
title: Logo 徽章提示词：Y2K 原宿风品牌贴纸徽章（gpt-image-2）
slug: y2k-brand-badge
model: gpt-image-2
topics: [logo, sticker]
aspectRatio: "1:1"
needsRefImage: false
useCase: 把自己的品牌名做成千禧年原宿风的扁平矢量徽章，适合贴纸周边、文创包装、社交平台头像。
prompt: |
  品牌：[MOCHI LAB]（[一家日式甜品工作室]，品牌主色[樱花粉]，辅色[抹茶绿]，起源地[中国]）。
  你是一名擅长 Y2K 原宿徽章艺术的资深矢量设计师：东京街头二创文化、千禧年日式品牌混搭、复古未来贴纸美学。每次输出都要像一份干净的 Illustrator 矢量文件，扁平、可直接做贴纸；徽章结构要为这个品牌全新设计，不要套模板。
  设计前先确定：
  (1) 主色：把品牌主色柔化成千禧年粉彩版本，仍可辨认但更轻、更可爱；
  (2) 强调色：把品牌辅色推到温暖饱和，制造活力；
  (3) 深色：品牌的深色（藏青、深棕或近黑）用于描边和立体厚度；
  (4) 字母内容：品牌名用粗体小写，或最有代表性的缩写；
  (5) 片假名：品牌名的正确日文片假名音译，作为次要文字；
  (6) 起源地旗帜：小小的扁平旗帜元素；
  (7) 形状语言：从品牌视觉中提取标志性几何形，用作环绕和背景元素，不要通用椭圆；
  (8) 文化符号：1–2 个来自品牌世界的小物件，画成小扁平插画（如[麻薯、茶筅]）；
  (9) 构图逻辑：用以上所有元素设计出"只属于这个品牌"的徽章布局。
  画布：1:1 正方形，纯平米白或暖浅灰背景，完全空白，无纹理、无渐变。
  徽章结构：中心是字母主体，周围是品牌专属形状的前后叠层，至少有一个元素同时从字母后面和前面穿过以制造纵深，整体是统一的徽章 / 布贴轮廓。
  字母：宽体圆润的粗体小写品牌名，主色平涂，向右下方 8–12% 字高的深色厚重立体投影，粗深色描边；不要渐变、不要渲染。
  千禧年标志元素：背景形状里有强调色的速度线；字母旁有深色的锐利四角星；片假名自然地嵌入构图；起源地旗帜；品牌文化符号小插画。
  技术规格：只用扁平矢量，零渐变、零特效、零模糊；边缘干净锐利；最多 4 种颜色（粉彩主色、暖饱和强调色、深色描边、米白）；像一枚收藏贴纸或刺绣布章。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/iamaiistudio/status/2071683274725028140
  author: "@iamaiistudio"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 英文原文译为中文；原文让模型自行分析某个现有品牌，改为由用户填写自己的品牌名、行业、颜色、起源地和文化符号，避免生成他人商标
imageBrief: 用虚构品牌"MOCHI LAB"按默认变量生成 1 张；再用本站自有品牌名生成 1 张。示例图不收录原帖出图（原帖使用了真实服装品牌商标）。
images:
  - 145-y2k-brand-badge-1.jpg
  - 145-y2k-brand-badge-2.jpg
imageCredit:
  by: "@iamaiistudio"
  url: https://x.com/iamaiistudio/status/2071683274725028140
  license: CC0 1.0
verify:
  - 在 gpt-image-2 上实测 3 次，记录成功率与最常见的失败形式
  - 片假名音译是否正确（可用翻译工具核对）
  - 颜色是否控制在 4 种以内
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：第一行把品牌名、行业、主色、辅色、起源地全部换成你自己的；[麻薯、茶筅] 换成能代表你业务的 1–2 个小物件（咖啡店写"咖啡豆、拉花杯"）。品牌名建议 4–10 个字母的英文或拼音，中文品牌名可以写拼音并在 (5) 里改成"中文品牌名作为次要文字"。

**常见问题**：
- 出现了真实大牌的 Logo：原帖是拿知名品牌做的二创，商用有侵权风险。本站版本只用于**自己的品牌**，不要填别人的商标。
- 颜色太多、不像贴纸：重复"最多 4 种颜色、零渐变"。
- 片假名写错：不需要日文就删掉第 (5) 项和对应的"片假名"要求。

**迭代**：定稿后追问"同一徽章做成圆形版本"，一套贴纸周边就有了两个形状。

### 英文原版

```text
[BRAND NAME]

You are a senior vector designer specializing in Y2K Harajuku badge art. Your world: Tokyo bootleg culture, early 2000s Japanese brand remixes, retro-futuristic sticker aesthetics. Every output should look like a clean Illustrator vector file, flat and sticker-ready. The badge structure must be invented fresh for each brand, not templated.

BRAND ANALYSIS

Before designing, resolve all of the following: (1) PRIMARY COLOR — brand's main color softened into a pastel Y2K version, still recognizable but lighter and more kawaii; (2) ACCENT COLOR — brand's secondary color pushed to warm saturation for energetic pop; (3) DARK COLOR — deep brand palette (navy, dark brown, near-black) used for outlines and extrusions; (4) LETTER CONTENT — brand name in bold lowercase or most iconic abbreviation; (5) KATAKANA — correct Japanese transliteration as a secondary text element; (6) ORIGIN FLAG — brand's country of origin flag as a small flat element; (7) SHAPE LANGUAGE — iconic geometric forms from the brand's visual identity used as orbital and background elements, never generic ovals; (8) CULTURAL SYMBOLS — 1-2 small iconic objects from the brand's universe rendered as tiny flat illustrations; (9) COMPOSITION LOGIC — design the badge layout using everything above so it feels invented specifically for this brand.

CANVAS

1:1 square. Flat off-white or warm light grey background. Completely empty, no texture, no gradient.

BADGE STRUCTURE

Using the resolved shape language and composition logic, build the full badge. Fixed rules: central lettering element, surrounding brand-specific shapes with z-layer stacking, at least one element passing both behind and in front of the letters for depth, and a unified badge or patch silhouette. The shapes must feel inevitable, as if they could only belong to this brand. Everything else is determined by the brand's own visual DNA.

LETTERING

Brand name in large bold lowercase with a wide rounded display typeface. Flat PRIMARY COLOR fill. Thick DARK COLOR extrusion offset down-right at 8-12% of letter height. Bold DARK COLOR outline. No gradients, no rendering.

Y2K SIGNATURE ELEMENTS

Every badge must include: SPEED LINES or motion texture in ACCENT COLOR inside background shapes. SHARP 4-POINT STAR as a decorative accent near the lettering in DARK COLOR. KATAKANA transliteration tucked naturally into the composition. ORIGIN FLAG as a small accurate flat element. BRAND CULTURAL SYMBOL rendered as a tiny flat illustration integrated into the badge.

TECH SPECS

Flat vector only. Zero gradients, effects, blur, or rendering. Clean crisp edges throughout. Maximum 4 colors: PRIMARY pastel, ACCENT warm saturated, DARK outline, off-white. Must feel like a collectible sticker or embroidered patch. Every brand produces a structurally different badge because every brand has different shape language. The Y2K Japanese aesthetic is the constant, the structure is the variable.
```

> 改编自 [@iamaiistudio](https://x.com/iamaiistudio/status/2071683274725028140) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0。
