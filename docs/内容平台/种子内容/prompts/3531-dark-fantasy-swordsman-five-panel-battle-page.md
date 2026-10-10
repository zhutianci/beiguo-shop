---
title: "漫画提示词：暗黑奇幻热血战斗漫画页，五格红蓝对撞的斩击与胜利（gpt-image-2）"
slug: dark-fantasy-swordsman-five-panel-battle-page
model: gpt-image-2
topics: [comic, illustration]
aspectRatio: "4:3"
needsRefImage: false
useCase: "需要一页\"主角对决大反派\"的彩色战斗漫画时用：上排两格铺垫和出招，下排三格反派特写、主角蓄力、胜利定格，四句对白加两处大号效果字，红蓝两色能量对撞，适合做原创漫画样页和角色对决宣传图。"
prompt: |
  画一页暗黑奇幻题材的战斗漫画，恰好 5 格，讲一个孤身的剑士斩倒魔王，画风是粗粝、高反差的热血少年漫画。
  画布：横版 4:3，分格之间是粗白色间隔。戏剧化的光线，漫画墨线加厚涂质感的细节，红与蓝两种能量特效对撞，碎石、烟尘、余烬和风暴云。
  分格：上排 2 个宽格（左边铺垫、右边出招），下排 3 格（左边反派特写、中间主角蓄力、右边胜利定格）。构图要有动感和电影感，用倾斜视角和速度线。
  主角：[黑发的年轻剑士]，穿破损的黑色连帽斗篷、深色护甲外套、皮带和露指手套，红色围巾和飘带在风里翻卷，手持一把发着[蓝白色]光的长刀。
  反派：[全身黑甲、头生双角的暗影魔王]，身形高大，周身是黑烟、尖刺和发红光的裂纹。
  战场：龟裂的石地、倒塌的建筑、灰烬和风暴天空组成的废土。
  各格内容与文字：
  1. 左上：越过主角肩膀的视角，他握着泛红光的剑，面对远处高耸的反派和一片废墟。对白框："[今天就做个了断。]"
  2. 右上：斩击命中的近景，主角身边缠绕蓝色闪电，刀锋处炸开红色的爆光；一个锯齿状的大号拟声字："斩！"
  3. 左下：反派的特写，被猩红火焰和黑烟包围，举起一只利爪。对白框："你什么都不是。"
  4. 下中：主角正面半身，双手把剑竖握在身前，蓝色能量向上升腾。对白框："[我的极限，由我自己定。]"
  5. 右下：主角的全身胜利定格，独自站在夕阳下的瓦砾上，垂下发蓝光的剑，破斗篷随风飘动。对白框："我要守护重要的东西。"底部一行粗体大字："胜利！"
  画风：现代暗黑系热血漫画插画，质感细腻，墨线锐利，强烈的明暗对比，红蓝撞色，速度线、火花、碎片、发光的眼睛，纵深感强。
  限制：严格 5 格、4 个对白框，外加"斩！""胜利！"两处大字；文字全部用简体中文；不要多余的分格、旁白、Logo、水印、签名和无关角色，不要血腥画面。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/Lc_9998/status/2065369835043959176
  author: "@Lc_9998"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并按\"画布 / 分格 / 角色 / 各格内容 / 画风 / 限制\"分段；主角、反派、武器发光色、两句台词设为变量；英文对白和 SLASH!、VICTORY! 两处效果字换成中文；删去原文\"主角面部用模糊块遮挡\"的设定；原文写\"5 个对白框\"但实际只列了 4 句，按 4 句统一；补充\"不要签名、不要血腥画面\"。"
images:
  - 3531-dark-fantasy-swordsman-five-panel-battle-page-1.jpg
imageCredit:
  by: "@Lc_9998"
  url: https://youmind.com/gpt-image-2-prompts?id=25429
  license: CC BY 4.0
verify:
  - "示例图右下角有一处模型自行生成的小签名状涂鸦（无法辨认，不是真实账号），请确认是否需要遮盖或裁掉"
  - "题材是持剑的奇幻对决（画面无血腥），请确认尺度可接受"
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[黑发的年轻剑士] 和 [全身黑甲、头生双角的暗影魔王] 换成你的主角和对手，如"银发的女枪骑士"对"冰晶巨龙"；[蓝白色] 是主角武器的发光色，反派默认用红色，两边保持一冷一暖才有对撞感。两句变量台词是开场白和决心台词，其余对白和两处大字直接改引号里的字，每句不超过 10 个字。

示例图是英文对白版的横版漫画页：上排左格是黑发、披兜帽斗篷、系红围巾的少年握着红光长剑回头，远处立着带角的黑甲魔王；右格是蓝色闪电与红色爆光对撞，配一个白色大拟声词。下排依次是红焰中举爪的魔王特写、双手竖握蓝光长剑的主角正面、站在废墟夕阳里的全身定格和底部的白色大字。右下角有一处模型自己加的小签名状涂鸦。

**常见问题**：
- 角落出现签名状涂鸦：保留"不要签名"的限制，仍出现就后期裁掉。
- 中文大字不够有力：写明"粗体毛笔感的漫画拟声字，白字加黑红描边"。
- 五格变成六格：把"上排 2 格、下排 3 格"放到第一句。

**适合**：原创热血漫画的样页、游戏和小说的角色对决宣传图、漫画分镜练习；不适合低龄向内容。

### 英文原版

```text
Goal: Create a dark fantasy manga action page with exactly 5 comic panels showing a lone swordsman defeating a demonic overlord, in a gritty high-contrast anime style.

Canvas: Landscape 4:3 comic page, roughly 1024×768, with thick white gutters dividing the panels. Use dramatic lighting, inked manga linework, painterly detail, red-and-blue energy effects, rubble, smoke, embers, and storm clouds. The main character’s face should be obscured by a soft square blur/censor block in panels where it is close enough to see.

Layout: Use exactly 5 panels. Top row has 2 wide panels: a large left setup panel and a large right attack panel. Bottom row has 3 panels: left demon close-up, center hero power-up, right victory pose. Keep the composition dynamic and cinematic, with tilted perspectives and motion streaks.

Subject details: The hero is {argument name="character name" default="a young black-haired male swordsman"}, wearing a torn black hooded cloak, dark armored jacket, belts, fingerless gloves, and red scarf/ribbons whipping in the wind. He wields a glowing {argument name="sword energy color" default="blue-white"} katana-like sword. The enemy is {argument name="villain description" default="a towering horned shadow demon king made of black armor, smoke, spikes, and red glowing cracks"}. The battlefield is a ruined wasteland of cracked stone, broken structures, ash, and stormy skies.

Panel details and text content: Panel 1, top left: over-the-shoulder view of the hero gripping a red-glowing sword, facing the distant towering demon in a devastated landscape; speech bubble says {argument name="opening speech bubble" default="This ends today."}. Panel 2, top right: close action impact shot of the hero slashing into the demon, with blue lightning around the hero and a red explosion from the blade; large jagged sound effect text says “SLASH!”. Panel 3, bottom left: close-up of the horned demon surrounded by crimson fire and black smoke, one claw raised; speech bubble says “You are nothing.” Panel 4, bottom center: frontal hero portrait holding the sword vertically with both hands, blue energy rising; speech bubble says {argument name="hero resolve line" default="I’m my own limit."}. Panel 5, bottom right: full-body victory pose of the hero standing alone on rubble at sunset with a glowing blue sword lowered, torn cape flowing; speech bubble says “I protect what matters.” and large bold comic text at the bottom says “VICTORY!”.

Visual style: Modern dark shonen manga/anime illustration, extremely detailed textures, sharp ink outlines, dramatic chiaroscuro, red versus blue color contrast, speed lines, sparks, debris, glowing eyes, cinematic depth, intense battle atmosphere.

Constraints: Include exactly 5 panels, exactly 5 text elements in speech bubbles plus 2 large sound/result words: “SLASH!” and “VICTORY!”. Do not add extra panels, captions, logos, watermarks, or unrelated characters.
```

> 改编自 [@Lc_9998](https://x.com/Lc_9998/status/2065369835043959176) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
