---
title: "ai游戏素材生成提示词：日式 RPG Boss 战画面，巨蟹光束 + 战斗 UI（gpt-image-2）"
slug: jrpg-boss-battle-screen-giant-crab-hud
model: gpt-image-2
topics: [game-art, illustration]
aspectRatio: "16:9"
needsRefImage: false
useCase: "给游戏提案、宣传图或视频封面做一张\"以假乱真的战斗截图\"：巨型 Boss 放出光束，三名队员在前景迎战，画面上叠着 Boss 血条、队伍状态栏、指令菜单和招式名横幅。"
prompt: |
  生成一张日式幻想 RPG 的 Boss 战游戏截图，16:9 宽屏，高细节的动漫写实画风；深蓝色夜景，鲜亮的青色魔法光、橙色火花、爆炸和碎石，强烈的辉光。
  - 场景：[暴风夜空下的岩石废墟战场]，背景有断裂的石柱和燃烧的遗迹；空中飘着碎石、余烬、闪电般的魔力和烟雾。镜头较低，位于队伍身后，仰望巨大的 Boss。
  - Boss：一只[披甲的巨型螃蟹]占据画面右上和中部，高举两只巨螯，多节的步足，蓝褐色的硬壳泛着高光；它正从两螯之间的发光球体里射出一道耀眼的青白色光束，直冲队伍，在画面中央炸开巨大的冲击光。
  - 队伍：前景恰好 3 名可操作角色，都面向 Boss——中间偏左是穿铠甲的黑发男剑士，用发光的剑顶住光束；中间偏右是手持法杖、放出青绿色魔法的长发女法师；最左边是穿蓝色长袍的金发女法师，举杖为全队展开蓝色屏障。
  - 战斗界面（精致的奇幻 RPG 风格，叠在画面上）：
    - 左上角 Boss 栏：小头像、名字和等级、一条长长的红色血条和血量数字；
    - 左下角队伍栏：三行，每行是角色头像、名字"[KAITO]""[RINA]""[YUNA]"、等级，以及绿色 HP 条和蓝色 MP 条与数值；
    - 右下角指令菜单：上方小字是地点名，下面竖排五个菱形按钮"ATTACK、SKILL、ITEM、DEFEND、OVERDRIVE"，第一个高亮；
    - 底部正中：一个带金色花纹边框的横幅，写着招式名"[蟹光线]"。
  - 界面文字清晰，不出现真实游戏的标志和水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/neru_marosama/status/2080306424153010492
  author: "@neru_marosama"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并按\"场景 / Boss / 队伍 / 界面\"整理；Boss、招式名、场景、三名队员的名字改为变量；界面里的数值保留为示例并精简了重复的画质描述"
images:
  - 3540-jrpg-boss-battle-screen-giant-crab-hud-1.jpg
imageCredit:
  by: "@neru_marosama"
  url: https://youmind.com/gpt-image-2-prompts?id=29635
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：Boss 和招式名成对替换，例如"喷吐冰雾的白色巨龙"配"绝对零度"，"会放雷的机械蜈蚣"配"千足雷击"；场景决定主色调，换成"熔岩洞窟"时把"深蓝色夜景、青色魔法光"也改成"暗红色、橙色火光"；三名队员的名字可以换成中文，职业和站位也可以改，但建议保持"一个顶在前面、两个在侧后方"的三角站位。

示例图里，一只蓝褐色的巨蟹高举双螯，从中间射出一道青白色的光柱，砸在画面中央炸开；前景一位持剑的男角色正面迎着光束，两侧各有一位持杖的女角色；左上角是 Boss 的名字和红色血条，左下角是三名角色的头像与 HP、MP，右下角是五个指令按钮，底部正中的横幅里是三个汉字的招式名。

**常见问题**：
- 界面数值乱码：数值只保留"当前 / 上限"一种格式，或让血条不带数字。
- UI 挡住了主体：写"界面只占四角和底边，中央留给战斗画面"。
- 队员背对 Boss 或站位混乱：明确写出每个人在画面的位置和朝向。

**适合**：游戏立项提案、宣传概念图、游戏区视频封面；请使用原创角色和虚构的游戏界面。

### 英文原版

```text
Goal: Create a dramatic fantasy JRPG / social-mobile-game boss battle screenshot featuring a party fighting a gigantic crab monster casting a beam attack.

Canvas: Wide 16:9 cinematic game battle screen, high-detail anime-realistic fantasy art, dark blue night palette with vivid cyan magic, orange sparks, explosions, rubble, and strong bloom lighting.

Scene: A ruined rocky battlefield under a stormy night sky, with broken stone pillars and burning ruins in the background. Floating debris, embers, lightning-like magical energy, and smoke fill the air. The camera is low and slightly behind the heroes, looking toward the enormous boss.

Boss: A colossal armored crab enemy dominates the upper-right and center of the scene. It has exactly 2 huge raised claws, multiple segmented legs, a hard blue-brown shell, glowing highlights, and an intimidating face. The boss is firing a brilliant cyan-white magical beam from a glowing orb between its claws down toward the heroes, creating a massive impact flare at the center.

Heroes: Show exactly 3 playable characters in the foreground, all facing the crab boss. 1) KAITO, a dark-haired male swordsman in armor, center-left, bracing with a glowing sword against the beam. 2) RINA, a long dark-haired female mage or support fighter, center-right, holding a staff or wand with green-blue magic. 3) YUNA, a blonde female mage in a flowing blue robe, far left, holding a staff and casting a protective blue barrier around the party. Make the party look strong and heroic, like a premium gacha RPG battle scene.

User interface: Add a polished fantasy RPG battle UI overlay. Top-left boss panel contains a small crab portrait icon, the label “BOSS : ENEMY”, the boss name “{argument name="boss name" default="アビサル・クロウ"} Lvl 68”, a long red/orange HP bar, and the HP text “1,450,000/1,450,000 HP”. Bottom-left party status panel lists exactly 3 character rows with portraits, names, levels, HP, MP, and colored bars: “{argument name="hero one name" default="KAITO"} Lvl 65 HP 4820/5500 MP 120/120”, “{argument name="hero two name" default="RINA"} Lvl 63 HP 3550/3900 MP 280/300”, and “{argument name="hero three name" default="YUNA"} Lvl 62 HP 3800/4000 MP 310/320”. Right side command menu contains exactly 5 stacked beveled buttons labeled ATTACK, SKILL, ITEM, DEFEND, OVERDRIVE, with ATTACK highlighted in orange. Above the command menu, add the small location label “岩の廃墟”. Bottom-center attack name plaque with ornate gold trim displays “{argument name="attack name" default="蟹光線"}”.

Visual style: Highly polished AAA anime fantasy illustration, sharp character silhouettes, cinematic action composition, intense motion, volumetric light, magical particles, reflective armor, detailed crab texture, ornate gold UI frames, crisp readable text, no watermark, no extra characters, no extra menu options.
```

> 改编自 [@neru_marosama](https://x.com/neru_marosama/status/2080306424153010492) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
