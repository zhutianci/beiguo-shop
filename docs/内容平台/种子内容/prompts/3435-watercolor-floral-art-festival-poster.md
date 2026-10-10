---
title: "海报提示词：水彩花雾 + 竖排大标题的艺术展海报，蓝橙晕染里仰头的侧影（gpt-image-2）"
slug: watercolor-floral-art-festival-poster
model: gpt-image-2
topics: [poster, illustration]
aspectRatio: "3:4"
needsRefImage: false
useCase: "给艺术展、花艺市集、音乐会、毕业展做一张有诗意的主视觉：靛蓝与珊瑚色的水彩花雾从左上斜扫到右侧，右下是花丛里仰头的人物侧影，左侧竖排大标题配展期、场馆等小字。"
prompt: |
  设计一张优雅的虚构艺术展海报，水彩与摄影混合的梦幻风格，主标题"[苍花幻灯]"，整体是蓝、青、珊瑚和象牙白的花意氛围。竖版 3:4。
  - 画布：米白色纸张背景，带淡淡的水彩渍和细颗粒，像高级画廊的活动海报，通透、浪漫；
  - 水彩与花：一大片水彩花雾和墨色晕染从左上斜着扫过中央到右侧，以深靛蓝、钴蓝、青绿为主，中间散落暖色的珊瑚、蜜桃和橙色花朵；叠加许多纤细的植物枝茎和小花，像压花或钢笔线稿；底部前景是一片柔焦的野花；
  - 人物：右下方一位[短发女性]的胸部以上侧影，面朝左、微微仰头，神情安静，披着印有蓝色和珊瑚色花朵的半透明外衣，与周围的植物自然融为一体；
  - 文字：左侧是竖排的大标题，典雅的宋体 / 明朝体，深蓝色；标题上方一行小字活动名"[苍花市艺术节 2026]"；标题下方一行诗意的副标题"[让色彩触碰记忆的一夜限定展]"；再往下一条细分隔线，然后是展期"[10月17日—11月3日]"、场馆"[星雫厅]"和地点各一行；底部边缘一行很小的页脚；
  - 限制：除以上文字外不出现其他文字，不要 Logo 和二维码，留白充足，版面不拥挤。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/AIArtAlchemist/status/2066499810744762863
  author: "@AIArtAlchemist"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并精简；主标题、活动名、副标题、展期、场馆信息设为变量并换成中文示例；删去原文\"人物脸部用方块遮挡\"的要求（示例图实际为正常侧脸）；保留 7 个文字块的位置关系与\"不加 Logo、二维码\"的约束"
images:
  - 3435-watercolor-floral-art-festival-poster-1.jpg
imageCredit:
  by: "@AIArtAlchemist"
  url: https://youmind.com/gpt-image-2-prompts?id=25816
  license: CC BY 4.0
verify:
  - "示例图为日文文案；改成中文后核对竖排标题的字体与小字是否清晰"
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：主标题建议 2～4 个字，竖排最好看；活动名、副标题、展期、场馆各一行，写得越短越清晰；人物可以换成"戴草帽的女孩""拉小提琴的少年"，或者删掉人物只留花雾。想换色系，把"靛蓝 + 珊瑚"整体改成"墨绿 + 鹅黄"或"紫 + 金"。

示例图是日文版：米白底上，蓝色、青色和橙红色的水彩像云一样从左上铺到右边，里面点缀着细碎的花和枝叶；右下是一位发梢带玫红色的短发女性仰头的侧脸，披着花纹薄纱；左侧是深蓝色大字"蒼花幻灯"，上下分别是活动名、副标题、日期和场馆，底部一片虚化的花田。

**常见问题**：
- 中文小字出现错字：小字控制在 4 行以内、每行不超过 12 个字，出图后逐字核对。
- 水彩铺满全幅、没有留白：强调"水彩只占对角线一带，左下和右上保留纸白"。
- 人物太写实、与水彩割裂：加"人物边缘被水彩和花朵半遮，过渡柔和"。

**适合**：艺术展 / 花艺市集 / 音乐会海报、毕业展主视觉、文艺类公众号头图。

### 英文原版

```text
Goal: Create an elegant fictional Japanese art festival exhibition poster in a dreamy watercolor-and-photography mixed style, titled {argument name="main title" default="蒼花幻灯"}, with a poetic blue, cyan, coral, and ivory floral atmosphere.

Canvas: Vertical poster, 3:4 aspect ratio, high resolution, off-white paper background with subtle watercolor staining and fine grain. The composition should feel like a premium gallery/event poster, airy and romantic, with refined Japanese typography.

Layout: Place the large vertical Japanese main title on the left side, occupying the upper-left to mid-left area. Above it, add a small event line reading {argument name="event name" default="蒼花市芸術祭 2026"}. Beneath the title, add a short poetic subtitle in small Japanese text. Below that, place a thin decorative divider line, then the date range, venue, and location information. Put a tiny footer line along the bottom edge. On the right lower half, show one young woman in profile facing left, standing among flowers; her face is intentionally covered by a soft square beige blur/mask with no facial features visible.

Subject details: One female figure only. She has shoulder-length dark navy-black hair with vivid magenta-pink tips, slightly messy and backlit. She wears a translucent flowing kimono-like shawl or dress printed with blue and coral flowers. Her pose is calm and contemplative, head angled slightly upward, seen from the chest up. The figure blends naturally into the painted botanical environment.

Floral and watercolor design: Create a large diagonal cloud of watercolor blooms and ink washes sweeping from the upper left across the center to the right side, dominated by deep indigo, cobalt blue, turquoise, and cyan, with warm coral, peach, and orange blossoms scattered through it. Use many delicate thin botanical stems, tiny leaves, and small flowers overlaid like pressed flowers or ink illustrations. The bottom foreground is a soft field of wildflowers with blurred bokeh-like depth: coral cosmos-like flowers, blue blossoms, pale stems, and glowing highlights.

Text content: Include exactly 7 visible text blocks: 1) top small event name: {argument name="event name" default="蒼花市芸術祭 2026"}; 2) large main title: {argument name="main title" default="蒼花幻灯"}; 3) poetic subtitle: {argument name="subtitle" default="色彩が記憶に触れる、ひと夜限りの幻想展示"}; 4) date line: {argument name="date line" default="2026.10.17 Sat — 11.03 Tue"}; 5) venue line: "星雫ホール / HOSHIZUKU Hall"; 6) location line: "蒼花市・水庭区"; 7) bottom footer: "光、花、そして揺らぐ感情の輪郭を描く。    入場自由 / Exhibition Poster". Keep the Japanese typography crisp and legible, with the main title in a large elegant Mincho-style serif font and all smaller text in refined navy lettering.

Visual style: Luminous watercolor wash, alcohol ink textures, fine botanical line art, soft paper texture, cinematic shallow depth of field at the flower field, delicate museum-poster design, refined negative space. Use deep blue typography matching the indigo paint. The mood is quiet, magical, poetic, and exhibition-like.

Constraints: No logo, no QR code, no extra text beyond the 7 text blocks, no realistic sharp facial features because the face must remain covered by the square blur, no cluttered layout, maintain generous margins and a sophisticated Japanese poster aesthetic.
```

> 改编自 [@AIArtAlchemist](https://x.com/AIArtAlchemist/status/2066499810744762863) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
