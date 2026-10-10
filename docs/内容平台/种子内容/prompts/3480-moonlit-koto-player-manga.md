---
title: "漫画提示词：月夜抚筝的和服乐师，黑白细密排线漫画（gpt-image-2）"
slug: moonlit-koto-player-manga
model: gpt-image-2
topics: [comic, illustration]
aspectRatio: "9:16"
needsRefImage: false
useCase: "想要一张安静、有故事感的黑白漫画扉页时用：月光从左侧照进老屋，长发乐师垂眼弹筝，前景是拨弦的双手和筝面木纹，屋外有满月、绣球花和石灯笼。"
prompt: |
  画一幅竖版黑白漫画插画：夜里，一位气质沉静、雌雄莫辨的年轻乐师正在弹奏[日本筝]。
  人物：[银灰色]长发，层次分明，散落的刘海半遮着眼睛，一条粗麻花辫搭在右肩；五官精致，垂着眼帘近乎闭目，神情安静而略带哀伤。穿传统的[浅色和服、深色腰带，外披半透明碎花羽织]，衣褶柔软，袖子上有淡淡的花朵纹样。
  双手与乐器：前景里两只手正在拨弦，手指修长优雅，几根手指上戴着黑色的义甲；筝占据画面下方三分之一，能看清木纹、琴码和一根根绷紧的平行琴弦，沿透视向远处延伸。
  场景：古旧的日式房间或缘侧，有木梁和障子式的门框，阴影里隐约可见书架和挂轴；屋外是月光下的庭院，恰好 1 轮满月，成簇的[绣球花]、茂密的灌木和 1 座小石灯笼。
  光线与画法：戏剧性的月光从左侧照入，深重的阴影，高密度的交叉排线，纤细的墨线，灰阶层次，电影感的明暗对比；略低的近距离视角，焦点落在乐师的双手和哀伤的面容上。
  限制：不要现代物品，不要颜色，不要文字，不要水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/hmst_yyyy/status/2079951164611907719
  author: "@hmst_yyyy"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并按人物、双手与乐器、场景、光线分段；乐器、发色、服装、庭院花卉改为变量；合并了重复的\"高细节\"描述。"
images:
  - 3480-moonlit-koto-player-manga-1.jpg
imageCredit:
  by: "@hmst_yyyy"
  url: https://youmind.com/gpt-image-2-prompts?id=29533
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[日本筝] 可以换成"古筝""古琴""琵琶"，换乐器后把"义甲、琴码"等细节按乐器改写；[银灰色] 是发色，在黑白画面里表现为浅灰；服装一项可换成"素色汉服配披帛"等；庭院里的 [绣球花] 可换"竹子""梅花"。想明确人物性别，就把"雌雄莫辨"改掉。

示例图是一张竖版黑白漫画：浅色长发、垂着眼帘的乐师微微低头，一条麻花辫搭在肩前，身穿浅色和服、深色腰带和带碎花的羽织；前景是一双修长的手按在筝弦上，左手三根手指戴着黑色义甲，琴码和木纹清晰；左后方敞开的门外能看到满月、云、绣球花丛和一座石灯笼，屋内右侧隐约有挂轴和书架。

**常见问题**：
- 手指数量或姿势出错：加"每只手五根手指，指节自然"，或把视角改成略远的半身。
- 琴弦歪斜：写"琴弦互相平行、间距相等"。
- 出现灰色水彩晕染：强调"只用墨线和排线表现明暗"。

**适合**：古风 / 和风漫画扉页、小说插图、音乐类账号的头图。

### 英文原版

```text
Create a vertical black-and-white manga illustration of a serene, androgynous young Japanese musician playing a koto at night. The character has {argument name="hair color" default="silver-gray"} long layered hair with loose bangs partly covering the eyes and one thick braid draped over the right shoulder, delicate facial features, downcast closed eyes, and a quiet melancholy expression. They wear a traditional {argument name="outfit" default="light kimono with a dark obi and a translucent floral haori"}, with soft folds and subtle flower patterns on the sleeves. Show both hands in the foreground actively plucking the koto strings, with long elegant fingers and black finger picks or rings on multiple fingers; the koto fills the lower third of the image with visible wood grain, bridges, and taut parallel strings receding in perspective. Set the scene in an old Japanese room or veranda with wooden beams, shoji-style framing, shelves and hanging scrolls in shadow, opening to a moonlit garden. Outside, include exactly one full moon, clusters of hydrangea flowers, leafy shrubs, and one small stone lantern. Use dramatic moonlight from the left, deep shadows, high-detail crosshatching, fine ink linework, grayscale tones, cinematic contrast, and a slightly low close-up perspective focused on the musician’s hands and sorrowful face. No modern objects, no color, no text, no watermark.
```

> 改编自 [@hmst_yyyy](https://x.com/hmst_yyyy/status/2079951164611907719) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
