---
title: seedance 提示词：3D 动画治愈短片（两只小水獭追蓝莓 · 角色一致性写法）
slug: seedance-baby-otter-berry-3d-short
model: seedance
topics: [cinematic]
modelLabel: Seedance 2.0
aspectRatio: "16:9"
needsRefImage: false
useCase: 做皮克斯风格的萌系 3D 动画短片：小水獭的蓝莓滚下山坡、追到空树干、遇见另一只小水獭、最后抱在一起。适合儿童内容、治愈系账号、动画短片练习，也是"多场景角色一致性"写法的示例。
prompt: |
  一段高品质的电影感 3D 动画短片，主角是一对可爱的、风格化的小水獭，场景是阳光明媚的草地，约 15 秒，16:9。
  角色 A：一只棕色小水獭，毛茸茸、圆滚滚，大大的亮黑眼睛，粉红脸颊，脖子上围着一条深色小围巾。
  角色 B：一只更小的灰色小水獭，同样圆滚滚，大眼睛，粉红脸颊，表情天真。
  0–3 秒：棕色小水獭站在绿油油的草地上，两只爪子开心地捧着一颗又大又亮的[蓝莓]，好奇又天真。
  3–6 秒：蓝莓从爪子里滑落，沿着平缓的草坡快速滚下去，棕色小水獭在后面拼命追；镜头平滑地跟着滚动的蓝莓。
  6–9 秒：蓝莓滚到一根倒在草地上的空心树干旁停下；灰色小水獭从树干里探出头，发现了蓝莓，开心地用两只爪子捧起来，眼睛闪闪发亮。
  9–12 秒：两只小水獭对视，先是惊讶，然后好奇地凑近。
  12–15 秒：棕色小水獭轻轻扑过去给灰色小水獭一个拥抱，两只一起软软地滚倒在草地上，蓝莓就在旁边，周围飘起细小的光点。
  风格：高级电影感 3D 动画，适合全家观看的萌系角色，柔软细致的毛发，夸张的大眼睛，圆润的比例，鲜活的自然环境，温暖的金色阳光，体积光，柔和阴影。
  两只小水獭的造型全程保持一致。
negativePrompt: 写实动物，角色造型变化，多余的水獭，四肢畸形，恐怖表情，文字，水印
source:
  repo: YouMind-OpenLab/awesome-seedance-2-prompts
  url: https://x.com/Zarnab_with_Ai/status/2106198477533544868
  author: "@Zarnab_with_Ai"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文为 11 个场景的英文长提示词，本站译为中文并合并为 15 秒五段，把两个角色的外观描述前置成\"角色卡\"；道具改为变量"
images:
  - 3631-seedance-baby-otter-berry-3d-short-1.jpg
imageCredit:
  by: "@Zarnab_with_Ai"
  url: https://x.com/Zarnab_with_Ai/status/2106198477533544868
  license: CC BY 4.0
verify:
  - Seedance 2.0 实测 3 次，记录两只小水獭同框时是否混淆颜色
  - 确认原帖仍可访问
---
**时长与镜头**：原作 11 个场景，单条 15 秒放不下，本站合并为五段：捧果 → 滚落追逐 → 新角色登场 → 对视 → 拥抱。想保留更多场景，可以拆成三条，每条 5 秒，用上一条的最后一帧作下一条的首帧。

**角色一致性怎么写**：本站把两只水獭的外观写成开头的"角色卡"（颜色、体型、眼睛、配饰），后面只用"棕色小水獭 / 灰色小水獭"称呼。这是多角色视频的通用技巧：给每个角色一个**颜色不同**的固定称呼，并给其中一个加一件标志性配饰（围巾），模型就不容易把两人画混。

**怎么填变量**：[蓝莓] 换成"红苹果""松果""蒲公英"；角色可以换成"小刺猬和小兔子""两只企鹅宝宝"，保持"一个追、一个捡到、最后分享"的故事线。

**常见失败与调整**：
- 两只水獭变成一样的颜色：把灰色改成"雪白色"，反差更大。
- 风格变成写实动物：开头强调"皮克斯式 3D 动画"，负面提示词写"写实动物"。
- 拥抱时肢体缠在一起：改成"两只并排躺在草地上，抱着同一颗蓝莓"。

> 改编自 [@Zarnab_with_Ai](https://x.com/Zarnab_with_Ai/status/2106198477533544868) 发布、[YouMind-OpenLab/awesome-seedance-2-prompts](https://github.com/YouMind-OpenLab/awesome-seedance-2-prompts) 收录的提示词，许可证 CC BY 4.0。

### 英文原版（原文较长，此处节选）

```
Create a high-quality cinematic 3D animated short film featuring adorable, stylized baby otter-like woodland creatures in a beautiful sunny meadow.

Scene 1: A cute brown baby otter stands in a lush green meadow, happily holding a large shiny blue berry with both paws. It has soft brown fur, a round chubby body, huge glossy black eyes, rosy cheeks, and a tiny dark scarf around its neck. The character looks innocent and curious. Warm morning sunlight, soft grass, rolling green hills, tall trees, blue sky, cinematic depth of field.

Scene 2: The blue berry slips from the otter's paws and rolls quickly down a gentle grassy slope. The little brown otter runs after it, trying desperately to catch it. The camera follows the rolling berry with a smooth dynamic tracking shot while the otter runs behind it.

Scene 3: The berry rolls toward a large hollow fallen tree trunk lying in the meadow and stops near its entrance. The brown otter reaches the tree and looks around curiously, wondering where the berry went.

Scene 4: The camera moves upward through the surrounding trees toward the bright sunlight shining through the leaves. A magical, peaceful atmosphere fills the scene with glowing sun rays, floating dust particles, and gentle wind moving the leaves.

Scene 5: A second adorable baby otter appears — smaller and gray-colored, with soft gray fur, a round chubby body, huge expressive black eyes, rosy cheeks, and an innocent expression. It comes out near the fallen tree and notices the brown otter.

Scene 6: The gray otter and brown otter interact playfully near the hollow tree. They look at each other with curiosity and surprise, then move around the tree together. Keep their character designs consistent throughout the entire video.

Scene 7: The gray otter climbs onto a nearby tree branch and looks around. The camera follows from behind and slightly below, showing the bright green forest canopy and warm sunlight filtering through the leaves.

Scene 8: The gray otter rests against a large moss-covered rock, looking sleepy and exhausted. Its eyes become heavy as it relaxes in the warm sunlight.

Scene 9: The gray otter suddenly notices the shiny blue berry again. The camera cuts to a close-up as it happily picks up the berry with both paws. Its huge eyes sparkle with excitement.

Scene 10: The gray otter proudly holds the blue berry close to its face and smiles innocently. The brown otter approaches from behind.

Final scene: The brown otter gently jumps onto the gray otter in a playful, affectionate hug.
……
```
