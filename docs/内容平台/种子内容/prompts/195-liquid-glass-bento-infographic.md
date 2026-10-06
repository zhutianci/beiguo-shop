---
title: nano banana 产品信息图提示词：液态玻璃风 Bento 便当格（8 宫格卖点 / 用法 / 参数）
slug: liquid-glass-bento-infographic
model: nano-banana
topics: [infographic, ecommerce, ppt]
modelLabel: Nano Banana Pro
needsRefImage: false
aspectRatio: "16:9"
useCase: 给一款食品、保健品或数码产品做"一图看懂"信息图——主图 + 卖点 + 用法 + 关键数据 + 适用人群 + 注意事项 + 冷知识，苹果式液态玻璃卡片排版，适合详情页、PPT 和社媒长图。
prompt: |
  输入变量：产品名称 = [牛油果]；文字语言 = [简体中文]。
  生成一张高级的液态玻璃风 Bento 便当格产品信息图，共 8 个模块（第 2～8 张卡片只放文字标题和内容）。
  1）产品分析：识别产品最主要的天然颜色作为"主色"；判断品类：食品 / 药品 / 数码。
  2）配色：产品与强调色用满饱和主色；图标和描边用降低饱和度（30%～40%）的主色，不用黑色。
  3）视觉风格：主图为真实摄影质感的产品；卡片为 85%～90% 透明的液态玻璃，极细描边、轻微投影，反射背景色；背景在卡片后方做高度模糊，选一种：[微距纹理]（可选：光晕抽象 / 微距纹理 / 产品图案 / 使用环境）；加入轻微的动感；不对称 Bento 网格，16:9 横版；主图卡占 28%～30%，信息卡占 70%～72%。
  4）模块内容：
  M1 主图：产品以精美的形态展示，并配产品名称标签；
  M2 核心益处：4 条 + 主色图标；
  M3 使用方法：4 种 + 图标；
  M4 关键数据：5 个精确数据，格式为"图标 + 标签 + 粗体数值 + 单位"（食品：热量、碳水（含膳食纤维、糖）、蛋白质、关键维生素及每日占比、关键矿物质及每日占比；数码：芯片、续航、重量、关键参数、连接方式）；
  M5 适合谁：4 类推荐人群配绿色对勾图标，3 类慎用人群配琥珀色警示图标；
  M6 注意事项：4 条 + 警示图标；
  M7 速查：食品写升糖指数和饮食标签，数码写兼容性和认证；
  M8 你知道吗：3 个冷知识（起源、科学、全球数据）+ 图标。
  输出：1 张 16:9 横版的超高级液态玻璃信息图。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-nano-banana-pro-prompts
  url: https://x.com/MansiSanghani1/status/2013550795224961492
  author: "@MansiSanghani1"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 译成中文并精简；删去药品分支（避免生成剂量类医疗信息）；背景风格改为单一变量；去掉以某手机品牌命名的风格描述
imageBrief: 用"牛油果"和一款站长自有的数码配件各生成 1 张 16:9 信息图；附一张局部放大图展示液态玻璃卡片质感（仓库示例图单张超过 1.2MB，未下载）。
verify:
  - 核对生成图中的营养数据是否与权威营养数据库大致一致（模型会编数字）
  - 实测中文在 8 个卡片里的错字率
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么用**：只需改开头两个变量。食品类效果最好（颜色鲜明、数据好找）；数码产品可以把 M4 的参数直接写进提示词，比如"续航 30 小时、重量 45 克"。

**一定要核对数据**：M4、M8 里的数字是模型"按常识"生成的，看起来很专业但不一定准确。发布前请逐项核对，或者直接在提示词里给出数据（"热量 160 千卡/100 克……"）。本站删去了原版中的"药品"分支，不建议用它生成剂量、疗效类信息。

**常见问题**：
- 卡片文字太多变成错字：把每个模块的条数从 4 改成 3，或让文字语言为"英文"。
- 不够"玻璃"：在第 3 条加"卡片边缘有细微的高光和折射，像 iOS 的毛玻璃"。

**适合**：详情页卖点长图、PPT 一页总结、小红书知识卡。

### 英文原版

```
Input Variable: [insert product name]
Language: [insert language]

System Instruction:
Create an image of premium liquid glass Bento grid product infographic with 8 modules (card 2 to 8 show text titles only).
1) Product Analysis:
→ Identify product's dominant natural color → "hero color"
→ Identify category: FOOD / MEDICINE / TECH
2) Color Palette (derived from hero):
→ Product + accents: full saturation hero color
→ Icons, borders: muted hero (30-40% saturation, never black)
3) Visual Style:
→ Hero product: real photography (authentic, premium), 3D Glass version [choose one]
→ Cards: Apple liquid glass (85-90% transparent) with Whisper-thin borders and Subtle drop shadow for floating depth and reflecting the background color
→ Background stays behind cards and high blur where cards are [choose one]:
  - Ethereal: product essence, light caustics, abstract glow
  - Macro: product texture close-up, heavily blurred
  - Pattern: product repeated softly at 10-15% opacity
  - Context: relevant environment, blurred + desaturated
→ Add subtle motion effect
→ Asymmetric Bento grid, 16:9 landscape
→ Hero card: 28-30% | Info modules: 70-72%
4) Module Content (8 Cards):
M1 — Hero: Product displayed as real photo / 3D glass / stylized interpretation (choose one)in beautiful form + product name label
M2 — Core Benefits: 4 unique benefits + hero-color icons
M3 — How to Use: 4 usage methods + icons
M4 — Key Metrics: 5 EXACT data points
Format: [icon] [Label] [Bold Value] [Unit]
FOOD: Calories: [X] kcal/100g, Carbs: [X]g (fiber [X]g, sugar [X]g), Protein: [X]g, [Key Vitamin]: [X]mg ([X]% DV), [Key Mineral]: [X]mg ([X]% DV)
MEDICINE:Active: [name], Strength: [X] mg, Onset: [X] min, Duration: [X] hrs, Half-life: [X] hrs 
TECH:Chip: [model], Battery: [X] hrs, Weight: [X]g,[Key spec]: [value], Connectivity: [protocols]
M5 — Who It's For: 4 recommended groups with green checkmark icons | 3 caution groups with amber warning icons
M6 — Important Notes: 4 precautions + warning icons
M7 — Quick Reference:
→ FOOD: Glycemic Index + dietary tags with icons
→ MEDICINE: Side effects + severity with icons
→ TECH: Compatibility + certifications with icons
M8 — Did You Know: 3 facts (origin, science, global stat) + icons
Output: 1 image, 16:9 landscape, ultra-premium liquid glass infographic.
```

> 改编自 [@MansiSanghani1](https://x.com/MansiSanghani1/status/2013550795224961492) 发布、[YouMind-OpenLab/awesome-nano-banana-pro-prompts](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)。
