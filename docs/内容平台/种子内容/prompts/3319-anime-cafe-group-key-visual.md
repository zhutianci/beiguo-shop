---
title: gpt-image-2 动漫群像提示词：六位女生樱花咖啡馆宣传 KV，每人发型服装道具各不相同
slug: anime-cafe-group-key-visual
model: gpt-image-2
topics: [illustration, character]
needsRefImage: false
aspectRatio: "3:2"
useCase: 做原创动漫企划主视觉、社团招新海报、轻小说 / 广播剧宣传图时，生成一张日常系动画宣传海报式的横版群像：六位性格各异的角色聚在春日咖啡馆，每人有清晰不同的发型、服装、道具和表情。
prompt: |
  创作一张横版动漫群像主视觉，画面中有[六位]性格各异的成年年轻女性（22～27 岁），性格可爱温柔，聚在一个温馨的[春日校园咖啡馆庭院]里。
  构图要像精致的日常系动画宣传海报，而不是单人肖像：
  - 中间一位坐着、手捧[速写本]；
  - 两位朋友带着温暖的笑容凑过来；
  - 一位害羞的角色抱着一小束花；
  - 一位开朗的角色在挥手；
  - 一位安静的文艺型角色在倒茶。
  每个角色的发型、服装配色、配饰和表情都明显不同，但整体和谐、健康。
  服装：柔软的开衫、百褶裙、贝雷帽、丝带、乐福鞋、浅色长袜、粉彩外套，得体又时尚。
  氛围：甜美、乖巧、俏皮、友好；不要任何擦边、裸露或暴露姿势，角色均为成年人。
  画风：现代高品质动漫渲染，线条干净，眼睛有光，柔和赛璐珞上色，[温暖的午后阳光]，樱花飘落，咖啡馆招牌"[咖啡馆名]"，桌上有小甜点，景深层次平衡，背景细节干净，群像剪影清晰易读。
  横版画幅。
negativePrompt: null
source:
  repo: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/skills/gpt-image/references/gallery-anime-and-manga.md
  author: null
  license: MIT
  licenseUrl: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE
  changes: 仓库整理的提示词，译成中文并按角色分工拆成要点；人数、场景、中心道具、光线、招牌文字设为变量；保留原文"成年角色、不擦边"的约束
images:
  - 3319-anime-cafe-group-key-visual-1.jpg
imageCredit:
  by: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/docs/anime-manga/anime-girls-sweet-group.png
  license: MIT
verify:
  - 页面署名需保留"Copyright (c) 2026 Wuyoscar, MIT License"及许可证链接
  - 示例图招牌和小黑板是英文，换成中文招牌测一次，看文字是否清晰
  - 生成的角色是否与现有知名动漫角色撞脸，上线示例前人工看一眼
---
**怎么填变量**：[六位] 可改成"四位""五位"，人数越少每个人越精致，同时把下面的角色分工删到对应数量；[春日校园咖啡馆庭院] 可换成"夏日海边甜品屋""秋天的图书馆中庭""冬日温室花房"；[速写本] 是中心人物的道具，可换"吉他""相机"。[温暖的午后阳光] 可换"傍晚的橙色夕照"，[咖啡馆名] 填你的企划名或店名。示例图是仓库作者的出图：樱花树下的咖啡馆门口，中间戴米色贝雷帽的女孩抱着速写本坐着，左边一个女孩举手挥动、一个托腮微笑，右边有抱花束的、戴帽子凑近的、提着玻璃茶壶倒茶的戴眼镜女孩，桌上摆着蛋糕和茶杯，上方挂着咖啡馆招牌，左下角有一块小黑板。

**常见问题与调整**：
- 几个角色长得一样：给每人写一个具体特征，如"红色短发 + 黄色雨衣""黑长直 + 圆框眼镜"。
- 人物挤成一团：加"角色分前后两排，前排坐、后排站，彼此留出空隙"。
- 想做竖版海报：画幅改 2:3，角色改为"上下错落分布，标题留在顶部"。
- 想要男女混合：直接改人物描述，保留"每人造型明显不同"这一句。

**适合**：原创动漫企划主视觉、社团招新、轻小说 / 广播剧宣传图；不适合模仿特定动画作品的角色或画风。

### 英文原版

```
Create a landscape anime ensemble key visual featuring six distinct adult young women, ages 22 to 27, with cute gentle personalities, gathered together in a cozy spring campus-cafe courtyard. The composition should feel like a polished slice-of-life anime promotional poster rather than a single portrait: one central seated character holding a sketchbook, two friends leaning in with warm smiles, one shy character holding a small bouquet, one cheerful character waving, and one calm bookish character pouring tea. Give each character a clearly different hairstyle, outfit palette, accessory, and expression while keeping the whole group harmonious and wholesome. Fashion: soft cardigans, pleated skirts, berets, ribbons, loafers, light stockings, pastel jackets, modest stylish outfits. Mood: sweet, well-behaved, playful, friendly, no fanservice, no nudity, no explicit pose, adult characters only. Use modern high-end anime rendering with crisp line art, luminous eyes, soft cel shading, warm afternoon light, cherry blossoms, cafe signage, small pastries, balanced depth, clean background details, and a strong readable group silhouette.
```

> 改编自 [wuyoscar/GPT-Image2-Skill](https://github.com/wuyoscar/GPT-Image2-Skill) 收录的提示词（仓库整理），许可证 MIT（Copyright (c) 2026 Wuyoscar）。
