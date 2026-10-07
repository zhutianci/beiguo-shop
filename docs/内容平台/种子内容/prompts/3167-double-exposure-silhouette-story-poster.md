---
title: "名著海报提示词：人物侧影里长出整个故事世界的双重曝光电影海报（红楼梦 / 三国）（gpt-image-2）"
slug: double-exposure-silhouette-story-poster
model: gpt-image-2
topics: [poster]
aspectRatio: "2:3"
needsRefImage: false
useCase: "输入一部作品和一个角色，用角色的巨大侧脸剪影做外框，剪影里自然生长出这部作品的世界观、经典场景、建筑和人物关系，电影海报 + 东方写实美学，适合名著 / 小说宣传、读书会海报和课件封面。"
prompt: |
  根据[红楼梦]自动生成一张收藏版史诗叙事海报。
  用[林黛玉]巨大而优雅的侧脸剪影作为外轮廓；剪影内部自然生长出与主题最相关的完整世界观、标志性场景、人物关系、象征图标、关键建筑、生灵、道具和氛围。
  这不是简单拼贴，而是高级的剪影填充叙事合成，带双重曝光的联想，强化电影化的叙事表达和空间调度。
  融合电影海报风格与东方写实美学，强调真实的物理光影、镜头语言、空间纵深和叙事层次。
  光线使用电影感的轮廓光加局部暖色点缀，冷暖对比克制真实，加入体积光和薄雾增强空间感。
  质感要真实（建筑、丝绸、皮肤、石头），避免纯绘画笔触；保留柔和的大气透视，但针对电影景深和焦点控制做优化。
  细腻的胶片颗粒，剪影边缘做成柔和的电影式过渡，大面积留白。
  左下方放竖排书法片名和小号的出品信息，像电影海报的署名区。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/liyue_ai/status/2047305151342596557
  author: "李岳"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文中文说明的英文写法改写为中文；作品与角色改为变量，补充标题排版说明"
images:
  - 3167-double-exposure-silhouette-story-poster-1.jpg
  - 3167-double-exposure-silhouette-story-poster-2.jpg
imageCredit:
  by: "李岳"
  url: https://youmind.com/gpt-image-2-prompts?id=15204
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：作品和角色一起换，例如"[西游记]／[唐僧]""[三国演义]／[关羽]""[水浒传]／[林冲]"，也可以换成你自己写的小说和主角。模型会自动挑选这部作品最有代表性的场景放进剪影里；想指定场景就补一句"剪影内包含：XX、XX、XX"。

示例图两张：《红楼梦》——米白底上一个古装女子的侧脸剪影，发髻和面部轮廓里叠着亭台楼阁、灯笼和人物群像，左下竖排书法"红楼梦"；《三国演义》——蓄须武将的侧影里是城楼、战船和骑兵混战，左下竖排"三國演義"。

**常见问题**：
- 变成乱糟糟的拼贴：保留"不是拼贴，而是自然生长、有空间纵深"。
- 人物脸像某位演员：写"原创角色形象，不要参考任何影视演员"。
- 片名书法有错字：片名 2～4 字最稳。

**适合**：名著 / 小说宣传、读书会海报、语文课件封面、影视风创意海报。

### 原版提示词

```text
Automatically generate a collector's edition epic narrative poster based on {argument name="theme" default="Dream of the Red Chamber"}. Use a giant, elegant silhouette of {argument name="character" default="Lin Daiyu"}'s profile as the outer outline. Inside the silhouette, let the complete world-building, iconic scenes, character relationships, symbolic icons, key architecture, creatures, props, and atmosphere most relevant to the theme grow naturally. This is not a simple collage but a high-end silhouette-filling narrative synthesis with double-exposure associations, enhanced for cinematic narrative expression and spatial choreography. A fusion of movie poster style and Eastern realist aesthetics, emphasizing realistic physical light and shadow, camera language, spatial depth, and narrative hierarchy. Lighting uses cinematic rim lighting with local warm accents, with restrained and realistic cool-warm contrast, adding volumetric light and light mist to enhance the sense of space. Textures should be realistic (architecture, silk, skin, stone), avoiding pure painterly strokes, retaining soft atmospheric perspective but optimized for cinematic depth of field and focus control. Fine film grain, with edge brushstrokes modified into soft cinematic transitions, large areas of negative space, and a refined, high-end layout. Quiet, grand, restrained, and infused with a strong sense of fatalism typical of Eastern cinematic storytelling. All elements must be strongly bound to the theme for instant recognition, avoiding clutter, hard collages, templated backgrounds, or cheap fantasy assets.
```

> 改编自 [李岳](https://x.com/liyue_ai/status/2047305151342596557) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
