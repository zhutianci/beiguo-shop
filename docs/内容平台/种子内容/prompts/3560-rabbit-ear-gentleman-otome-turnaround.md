---
title: "ai角色三视图提示词：兔耳绅士乙女游戏风设定图，三视图+6格细节（gpt-image-2）"
slug: rabbit-ear-gentleman-otome-turnaround
model: gpt-image-2
topics: [character, illustration]
aspectRatio: "3:2"
needsRefImage: false
useCase: "想给兽耳美型角色出一张\"无文字\"的精致设定图时用：左边侧正背三个全身像，中间一列六格服饰细节，右边两幅表情半身像，再配一条色卡。"
prompt: |
  画一张精致的日系动画角色设定图，角色是[兔耳绅士]：身形修长的年轻男性，肤色很白，[银白色]的凌乱层次长发，细长的灰紫色眼睛，头顶一对内侧淡粉的白色长兔耳，神情清冷、略带忧郁。贯穿全图的主题纹样是[月亮与钟表]。
  服装：深藏青色长燕尾外套，银色滚边；一侧肩上斜披象牙白短披肩；白色高领褶边衬衫，淡紫色领巾用椭圆宝石胸针固定；炭灰色马甲，修身黑色长裤，白手套，黑色及膝带跟长靴；装饰链条、怀表、表盘形饰件、月牙与星星点缀，袖口和下摆有叶片刺绣。
  版面（横版，一整张设定图，不是漫画）：
  - 左侧恰好 3 个全身转面：面朝左的侧面、正面、背面。背面要看得到披肩、开衩的燕尾、腰间的束带和一个圆圆的白色绒球兔尾。
  - 最左边一条竖排色卡，恰好 6 个圆形色块：深蓝、米白、淡紫、炭黑、浅粉、白，下面排几个小月牙图标。
  - 中间一列恰好 6 个竖排细节特写：领巾与胸针、耳朵与耳饰、怀表与链条、袖口刺绣、下摆刺绣、绒球尾巴与靴子。
  - 右侧恰好 2 幅大的半身像：上面一幅神情冷淡，手里提着怀表链靠近脸侧；下面一幅害羞脸红，一只手扶着脖子，一只兔耳向前垂下。
  背景：柔和的灰紫色，配纤细的白色几何线、悬挂的星月、表盘圆环和植物剪影，整体是藏青、象牙白、淡紫、银色的低饱和配色。
  风格：乙女游戏式的精致日系插画，线条纤细，赛璐璐上色叠加柔和渐变，瓷器般的皮肤，月光下的梦幻氛围，特写里的细节要清楚。
  不出现可读的标题和标注文字，只用装饰条和界面感的图形占位；不要多余角色，不要现代街头服装，不要高饱和色，不要水印和标志。画幅[3:2]。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/hmst_yyyy/status/2097545150608417251
  author: "@hmst_yyyy"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并分段；角色定位、发色、主题纹样、画幅设为变量；保留原文的数量约束（3 个转面、6 个细节格、2 幅半身像、6 个色块）和禁止项；合并了重复的风格描述。"
images:
  - 3560-rabbit-ear-gentleman-otome-turnaround-1.jpg
imageCredit:
  by: "@hmst_yyyy"
  url: https://youmind.com/gpt-image-2-prompts?id=34066
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[兔耳绅士] 是角色的一句话定位，可换成"狐耳书记官""猫耳管家""鹿角乐手"这类兽耳角色；[银白色] 是发色；[月亮与钟表] 是贯穿服装和背景的主题纹样，可换"玫瑰与钥匙""雪花与提灯"。换了角色之后，记得把服装段和 6 个细节特写里的"兔耳、绒球尾巴、怀表"同步改掉，不然会混搭。

示例图是一张灰紫色底的横版设定图：左边是银发兔耳青年的侧面、正面、背面三个全身像，藏青长外套配白披肩和黑长靴；最左一竖排圆形色卡；中间一列是领巾、耳朵、怀表、袖口、下摆、绒球尾巴与靴子的特写；右边上下两幅半身像，一幅提着怀表神情冷淡，一幅脸红垂耳。全图没有文字。

**常见问题**：
- 三个转面的衣服细节不一致：加"三个视图的外套长度、披肩位置、链条数量完全相同"。
- 特写格数量不对：把"恰好 6 个"连同六项内容在结尾再写一遍。
- 冒出乱码标题：保留"不出现可读文字"一句，需要名字时后期自己加。

**适合**：乙女向游戏和小说的角色设定、约稿前的参考图、同人企划的人设页。

### 英文原版

```text
Goal: Create an elegant anime character design sheet for {argument name="character name" default="a handsome rabbit gentleman"}, a pale silver-haired male with tall white rabbit ears, shown as a refined fantasy noble with moon-and-clock motifs.

Canvas: Wide horizontal character reference sheet, soft lavender-gray background, delicate celestial UI-frame decorations, thin white geometric lines, dangling stars, moons, clock circles, leafy botanical silhouettes, and a pastel palette of navy, ivory, lavender, silver, and muted violet.

Layout: Use exactly 3 full-body turnaround views on the left: 1 side profile facing left, 1 front view, and 1 back view. On the right, include exactly 2 large portrait panels: the upper portrait shows a calm, cool expression while holding a pocket-watch chain near his face; the lower portrait shows a shy blushing expression with one hand near his neck and one rabbit ear drooping forward. Between the full-body views and portraits, include exactly 6 vertical detail close-up panels: 1 cravat and brooch at the collar, 1 ear and earring detail, 1 pocket watch and chain detail, 1 cuff embroidery detail, 1 coat hem embroidery detail, and 1 fluffy tail plus boot detail. Add exactly 1 vertical color palette strip on the far left with 6 round swatches: deep blue, off-white, lavender, charcoal black, pale pink, and white, plus small crescent icons below it.

Subject details: The character is a slim, tall, elegant young man with very pale skin, long messy layered {argument name="hair color" default="silver-white"} hair, narrow lavender-gray eyes, soft eyelashes, and long white rabbit ears with pale pink inner fur. His expression is aloof, melancholic, and beautiful. He wears a formal fantasy outfit: a dark navy long tailcoat with silver piping, asymmetrical ivory shoulder cape draped over one side, high white ruffled shirt, pale lavender cravat tied with an oval gemstone brooch, charcoal vest, fitted black trousers, white gloves, black knee-high heeled boots, decorative chains, a pocket watch, clock-face ornaments, crescent and star accents, and leaf embroidery along the cuffs and lower coat panels. The back view must show the cape, split coat tails, harness-like waist straps, and a small round white fluffy rabbit tail.

Visual style: Highly polished Japanese anime illustration, character sheet / concept art presentation, delicate linework, clean cel shading blended with soft painterly gradients, porcelain skin, intricate clothing ornamentation, elegant otome-game aesthetic, dreamy moonlit atmosphere, muted pastel lighting, crisp details in the close-up panels.

Text content: No readable title text or labels; use decorative bars and interface-like shapes only.

Constraints: Keep the image as a single cohesive character reference sheet, not a comic. Preserve the exact counts of views, portrait panels, detail panels, and color swatches. Avoid extra characters, avoid modern streetwear, avoid heavy saturated colors, and do not add watermark or logo.
```

> 改编自 [@hmst_yyyy](https://x.com/hmst_yyyy/status/2097545150608417251) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
