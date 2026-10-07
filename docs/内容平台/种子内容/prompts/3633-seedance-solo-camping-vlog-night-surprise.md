---
title: seedance 提示词：一个人露营 vlog（自拍开场—搭帐篷—烤棉花糖—夜里听到怪声 · 20 秒）
slug: seedance-solo-camping-vlog-night-surprise
model: seedance
topics: [cinematic]
modelLabel: Seedance 2.0
aspectRatio: "9:16"
needsRefImage: false
useCase: 做真实感强的露营 / 户外 vlog：松林黄昏自拍开场、搭好帐篷欢呼、篝火烤棉花糖、夜里帐篷里听到动静被吓一跳，适合户外装备种草、旅行号、vlog 风格短剧开头。
prompt: |
  一段约 15 秒的超写实电影感露营 vlog，竖屏 9:16。主角是一位[二十多岁的女生]，黑色直发、齐刘海，穿一件[灰粉色冲锋衣]。
  0–3 秒：黄金时刻的松林里，自拍视角 vlog，她举着手机对镜头笑，拎着一个米色帐篷包，兴奋地介绍自己这次一个人露营。手持镜头自然晃动，表情真实。
  3–6 秒：电影感广角，她在高高的松树间搭好一顶米色帐篷，开心地举起双手庆祝，温暖的阳光透过树林洒下来。
  6–10 秒：夜晚的篝火旁，她坐在折叠露营椅上烤棉花糖；特写她轻轻吹着烤好的棉花糖，真实的火光照亮她的脸。
  10–15 秒：夜里，亮着灯的帐篷里，她拿着露营灯对镜头微笑；突然听到外面一声奇怪的响动，她睁大眼睛，把睡袋拉到鼻子下面，表情又惊又萌。
  风格：写实真人，4K，电影浅景深，自然的皮肤质感，真实的光线，流畅的镜头过渡，真实的户外氛围。
  声音：自然的森林环境声，鸟叫，轻风，篝火噼啪声，衣料摩擦声，夜晚森林的安静声。不要背景音乐，不要字幕，不要文字，不要水印。
  同一个女生的发型、服装、五官和帐篷全程保持一致。
negativePrompt: 人物换脸，服装变化，帐篷变色，手指畸形，背景音乐，字幕，文字，水印
source:
  repo: YouMind-OpenLab/awesome-seedance-2-prompts
  url: https://x.com/ZorviaLux/status/2105892094032404502
  author: "@ZorviaLux"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；原文 20 秒五段，本站合并为 15 秒四段以适配单条时长；人物与服装改为变量"
imageBrief: 来源缩略图为写实人像，未采用。站长生成后截取"搭好帐篷欢呼""篝火烤棉花糖""帐篷里拉睡袋"三帧。
verify:
  - Seedance 2.0 实测 3 次，记录四个场景之间人物一致性
  - 确认原帖仍可访问
---
**时长与镜头**：原作 20 秒五场，本站合并为 15 秒四场：自拍开场 → 搭帐篷 → 篝火 → 帐篷夜惊。vlog 风格的关键是"不同景别交替"：自拍近景、广角远景、篝火特写、帐篷内中景，每次换景别模型都会自然切镜头。结尾的"听到怪声"是一个小悬念，可以作为系列视频的钩子。

**怎么填变量**：人物和冲锋衣颜色按需要改；做户外装备种草时，把帐篷、露营灯、折叠椅写成具体产品外观，必要时上传产品图作参考。想要全程"一个人对着手机讲"的感觉，可以在每段加一句短台词，例如"今天一个人来露营！""搭好啦！"。

**常见失败与调整**：
- 四个场景换了四个人：减少到三个场景，并在每段开头重复"同一个女生"。
- 夜景太暗看不清脸：写"露营灯和篝火提供足够的暖光"。
- 模型自动加了背景音乐：保留"不要背景音乐"，Seedance 会生成同期声。

> 改编自 [@ZorviaLux](https://x.com/ZorviaLux/status/2105892094032404502) 发布、[YouMind-OpenLab/awesome-seedance-2-prompts](https://github.com/YouMind-OpenLab/awesome-seedance-2-prompts) 收录的提示词，许可证 CC BY 4.0。

### 英文原版

```
Create a 20-second ultra-realistic cinematic camping vlog featuring a young Japanese woman with straight black hair and bangs, wearing a dusty pink outdoor jacket.

Scene 1 (0–4 sec): Selfie-style vlog in a beautiful pine forest during golden hour. She smiles at the camera while holding a beige tent bag and excitedly introduces her solo camping adventure. Natural handheld camera movement, realistic facial expressions.

Scene 2 (4–7 sec): Wide cinematic shot of her setting up a beige camping tent among tall pine trees. She happily raises both hands to celebrate after pitching the tent. Warm sunlight filters through the forest.

Scene 3 (7–12 sec): Nighttime campfire scene. She sits on a folding camping chair, roasting a marshmallow on a stick. Close-up of her gently blowing on the toasted marshmallow, with realistic firelight illuminating her face.

Scene 4 (12–16 sec): She sits beside the campfire holding a glowing marshmallow, enjoying the peaceful night in the forest. Natural expressions, cozy atmosphere, realistic shadows and warm orange lighting.

Scene 5 (16–20 sec): Inside her illuminated tent at night, she smiles at the camera while holding a camping lantern. Suddenly, she hears a mysterious noise outside, opens her eyes wide, and pulls her sleeping bag up to her nose with a cute, surprised expression.

Visual style: Photorealistic live-action, 4K, cinematic depth of field, natural skin texture, realistic lighting, smooth camera transitions, authentic outdoor atmosphere, detailed facial expressions, cozy solo camping aesthetic.

Audio: Natural forest ambience, birds chirping, gentle wind, crackling campfire, subtle fabric sounds, and soft nighttime forest ambience. No background music, no subtitles, no text, no watermark.

Consistency: Maintain exactly the same woman, hairstyle, outfit, facial features, and tent throughout all scenes.
```
