---
title: 分镜提示词：电影感故事关键帧（暴风雨夜的灯塔守护人，用"标题 + 反转 + 秘密"结构写剧情画面）
slug: story-key-frame-lighthouse
model: nano-banana
topics: [cinematic, comic]
needsRefImage: false
aspectRatio: "16:9"
useCase: 写短篇故事、短剧或短视频脚本时，想先出一张能讲故事的电影剧照式关键帧，用"场景 + 反转 + 秘密 + 镜头参数"的结构，让画面里藏着情节线索。
prompt: |
  一张电影剧照式的故事关键帧，故事名《[灯塔守护人]》。
  - 画面：一座孤零零的灯塔立在嶙峋的悬崖上，四周是狂暴的海上风暴，巨浪拍打下方礁石，闪电撕开乌云，瞬间照亮古老的石砌塔身；
  - 塔内：一位[年迈的守塔人]提着一盏旧油灯，慢慢爬上螺旋楼梯；墙上贴满褪色的照片、信件和跨越几十年的旧报纸剪报；
  - 背景设定：世界上所有航线早在五十多年前就废弃了，再也没有船经过这里，可他每晚都会准时爬上塔顶点亮灯光；
  - 反转：[没人知道他为什么还在坚持]；
  - 秘密：[今晚地平线上第一次出现了微光]——这是五十年来的第一次；
  - 环境：暴风雨，午夜，孤独、神秘、动人的氛围；象征"没有证据的信念与希望"；
  - 镜头：低机位仰拍，85mm 变形宽银幕镜头，闪电的冷光与油灯的暖光交织；
  - 情绪：希望、神秘、孤独、坚定；
  - 质感：顶级剧情片的电影感，超写实；画幅[16:9]。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-nano-banana-pro-prompts
  url: https://x.com/SheBuildsAI_/status/2095935682174926856
  author: "@SheBuildsAI_"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 原文为 JSON 结构，改写成中文分点描述；保留原文的故事名、反转、秘密三个变量并改为中文，主角设为变量；删去奖项说法和 8K 参数，补充画幅
images:
  - 3354-story-key-frame-lighthouse-1.jpg
imageCredit:
  by: "@SheBuildsAI_"
  url: https://cms-assets.youmind.com/media/1788591091473_7f611z_HRZCZUlaMAAu2-k.png
  license: CC BY 4.0
verify:
  - 示例图墙上剪报有英文标题字样，检查新出图是否出现乱码文字
  - 换一个故事（如"末班地铁的检票员"）出一次，看反转与秘密是否能体现在画面里
  - 确认原帖仍可访问、作者未另行声明保留权利（CC BY 4.0 需保留署名）
---
**怎么填变量**：这套"故事名 + 画面 + 反转 + 秘密"的结构可以套任何故事。[灯塔守护人] 换故事名，[年迈的守塔人] 换主角；反转和秘密写成一句话，例如"末班地铁的检票员 / 没人知道这班车为什么还在运行 / 今晚车厢里第一次出现了一位乘客"。画面描述要同步改成新场景。示例图是灯塔内部的一幕：白发老人穿着毛衣、提着亮着的油灯站在石阶上抬头张望，左墙贴满老轮船照片和泛黄剪报，右侧敞开的门外是闪电劈下的海面和翻涌的浪花。

**常见问题与调整**：
- 想要灯塔外景而不是室内：把"塔内"那条改成"远景：灯塔顶的光束穿过暴雨，悬崖下巨浪翻腾"。
- "秘密"没体现：加"透过窗户能看到远处海平线上一点微弱的光"。
- 要做多格分镜：追问"把这个故事拆成 6 格分镜，从远景到特写，保持人物外观一致"。
- 画面太暗：加"油灯暖光照亮人物脸部和墙上的照片"。

**适合**：短篇故事 / 短剧的关键帧、视频脚本的氛围参考、写作课的"看图写故事"素材；不适合需要多格连贯叙事的场景（可用追问拆分镜）。

### 英文原版

```
{
  "title": "{argument name="story title" default="The Lighthouse Keeper"}",

  "image_description": "A solitary lighthouse stands on a jagged cliff surrounded by a violent ocean storm. Towering waves crash against the rocks below. Lightning tears through dark clouds, briefly illuminating the ancient stone structure. Inside the lighthouse, an elderly keeper slowly climbs a spiral staircase carrying an old lantern. The walls are covered with faded photographs, letters and newspaper clippings spanning decades. Every ship route in the world was abandoned more than fifty years ago. No vessels pass here anymore. Yet every night, without fail, the keeper climbs to the top and turns on the light.",

  "story_element": {
    "twist": "{argument name="plot twist" default="Nobody knows why he still does it."}",
    "secret": "{argument name="the secret" default="Tonight, for the first time in fifty years, a faint light appears on the horizon."}"
  },

  "environment": {
    "weather": "Violent storm",
    "time": "Midnight",
    "atmosphere": "Lonely, mysterious, emotional"
  },

  "symbolism": "Faith and hope without proof.",

  "cinematography": {
    "camera_angle": "Low angle",
    "lens": "85mm anamorphic",
    "lighting": "Lightning flashes and warm lantern glow"
  },

  "mood": [
    "Hope",
    "Mystery",
    "Loneliness",
    "Determination"
  ],

  "quality": {
    "style": "Oscar-winning cinematic drama",
    "resolution": "8K",
    "realism": "Ultra photorealistic"
  }
}
```

> 改编自 [@SheBuildsAI_](https://x.com/SheBuildsAI_/status/2095935682174926856) 发布、[YouMind-OpenLab/awesome-nano-banana-pro-prompts](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) 收录的提示词，仓库许可证 CC BY 4.0。
