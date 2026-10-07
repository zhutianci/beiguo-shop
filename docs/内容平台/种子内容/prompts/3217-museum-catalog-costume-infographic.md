---
title: 信息图提示词：博物馆图鉴式中文拆解图，输入一个主题自动出结构 / 材质 / 纹样 / 穿着顺序（唐代襦裙示例）
slug: museum-catalog-costume-infographic
model: gpt-image-2
topics: [infographic, illustration]
needsRefImage: false
aspectRatio: "2:3"
useCase: 做传统服饰、文物、非遗工艺的科普长图或展板时，只填一个主题，就能得到一张博物馆展板风格的中文信息图：写实主图、结构拆解、材质纹样色彩说明和组成流程一应俱全。
prompt: |
  请根据[唐代襦裙]，自动生成一张"博物馆图录式中文拆解信息图"。
  整张图要结合：写实主视觉、结构拆解、中文标注、材质说明、纹样寓意、色彩寓意和核心特征总结。主体、服饰体系、器物结构、时代风格、关键部件、材质工艺、配色和版式都由你根据主题自动判断，用户不需要再提供其他信息。
  整体风格：国家博物馆展板、历史服饰图录、文博专题信息图，而不是普通海报、古风写真、电商详情页或动漫插画。背景用[米白 / 绢白 / 浅茶色]纸张质感，整体高级、克制、专业、有收藏感。
  版式固定为：
  - 顶部：中文主标题 + 副标题 + 简介；
  - 左侧：结构拆解区，用中文引线标注关键部件，配细节特写；
  - 右上：材质 / 工艺 / 质感区，展示真实面料或材质小样并配说明；
  - 右中：纹样 / 色彩 / 寓意区，展示主色板、纹样小样和文化解释；
  - 底部：穿着顺序 / 组成流程图 + 核心特征总结。
  如果主题适合人物展示，就用真人全身站姿作为中央主体；如果更适合器物或单一结构，就改为中央主体拆解图，但整体仍是一张完整的中文信息图。
  所有文字必须是简体中文，清晰、工整、可读，不要乱码、错字、英文或拼音。
  避免：海报感、影楼写真感、电商感、动漫感、cosplay 感、随意标注、结构错误、文字模糊、材质失真、过度装饰。
  画幅[2:3]。
negativePrompt: null
source:
  repo: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/skills/gpt-image/references/gallery-infographics-and-field-guides.md
  author: "@MrLarus"
  license: MIT
  licenseUrl: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE
  changes: 仓库收录的是英文转写版，本站译回中文并保留原有版式结构；主题、背景色、画幅设为变量，主题默认填入示例图对应的"唐代襦裙"
images:
  - 3217-museum-catalog-costume-infographic-1.jpg
imageCredit:
  by: "@MrLarus"
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/docs/infographics-field-guides/museum-infographic.png
  license: MIT
verify:
  - 原始出处：原帖：https://x.com/MrLarus，核对原帖仍可访问、作者未另行声明保留权利
  - 示例图标题下有一行英文副标题，与"不要英文"的要求略有出入；图中历史服饰细节未经考证，展示时提醒以文博资料为准
  - 换成器物类主题（如"青花瓷梅瓶"）出一次，看是否自动切换为器物拆解版式
---
**怎么填变量**：[唐代襦裙] 是唯一必填项，可以换成"宋代褙子""明代马面裙""汉代曲裾"这类服饰，也可以换成器物和工艺，如"越窑青瓷""景泰蓝""榫卯木椅"，模型会自动改成器物拆解版式；背景色可以按主题换成"浅灰绿""暖米黄"。示例图是原作者的出图：顶部大标题"唐代襦裙"，中间是一位梳高髻、披浅青披帛、穿橙红长裙的女子全身像；左侧依次拆解襦、裙、披帛、腰带和履，右侧是丝绸、锦缎、纱罗的面料小样和主色板、纹样，底部是从穿内衣到系腰带的穿着顺序流程图和核心特征总结。

**常见问题与调整**：
- 中文小字出错：减少说明文字量，"每个说明不超过 20 个字"。
- 版式跑偏成古风写真：强调"这是展板信息图，人物只占中间三分之一宽度"。
- 想出英文版给外国朋友：把"所有文字必须是简体中文"改成"中英双语，中文在上"。
- 结构不准：在主题后补充关键部件，例如"[明代马面裙：马面、褶裥、裙腰]"。

**适合**：传统服饰 / 文物科普长图、课堂展板、文创介绍页；图中历史细节需要对照文博资料核实，不适合直接当学术依据。

### 英文原版

```
Please automatically generate a "museum catalog-style Chinese disassembly infographic" based on the [Subject].

The entire image is required to combine a realistic main visual, structural disassembly, Chinese annotations, material descriptions, pattern meanings, color meanings, and core feature summaries. You need to automatically determine the most appropriate main subject, clothing system, artifact structure, era style, key components, material craftsmanship, color scheme, and layout structure based on the [Subject], and the user does not need to provide any other information.

The overall style should be: national museum exhibition boards, historical clothing catalogs, and cultural/museum thematic infographics, rather than ordinary posters, ancient-style portraits, e-commerce detail pages, or anime illustrations. The background uses paper textures such as off-white, silk white, and light tea color, making the overall look premium, restrained, professional, and collectible.

The layout is fixed as:
- Top: Chinese main title + subtitle + introduction
- Left: Structural disassembly area, with Chinese lead lines annotating key components, accompanied by close-up details
- Upper right: Material / craftsmanship / texture area, displaying real texture samples with descriptions
- Middle right: Pattern / color / meaning area, displaying the main color palette, pattern samples, and cultural explanations
- Bottom: Dressing order / composition flowchart + core feature summary

If the subject is suitable for character display, use a full-body standing posture of a real person as the central subject; if it is more suitable for artifacts or single structures, change it to a central subject disassembly diagram, but the overall form remains a complete Chinese infographic. All text must be in Simplified Chinese, clear, neat, and readable, without garbled characters, typos, English, or pinyin.

Avoid: poster feel, studio portrait feel, e-commerce feel, anime feel, cosplay feel, random annotations, incorrect structures, blurry text, fake materials, excessive decoration.
```

> 改编自 [@MrLarus](https://x.com/MrLarus) 发布、[wuyoscar/GPT-Image2-Skill](https://github.com/wuyoscar/GPT-Image2-Skill) 收录的提示词，仓库许可证 MIT（Copyright (c) 2026 Wuyoscar）。
