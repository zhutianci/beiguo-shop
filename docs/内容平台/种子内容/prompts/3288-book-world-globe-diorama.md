---
title: AI海报提示词：剖开的巨型球体里藏着一部史诗的微缩世界（输入书名自动推断场景，16:9）
slug: book-world-globe-diorama
model: nano-banana
topics: [illustration, figurine]
needsRefImage: false
aspectRatio: "16:9"
useCase: 做读书账号封面、经典名著推荐海报、文化类展览主视觉时，只填一部作品名，生成一个裂开的巨型球体：外壳是手抄本壁画和书法，内部分三层雕出该作品里的城堡、神兽和千军万马。
prompt: |
  一张 16:9 的微距摄影风格艺术品展示图，主题作品是《[作品名]》。
  - 主体结构：一个巨大的空心球体，从侧面裂开，露出内部世界；
  - 球体外壳：外弧面上是平面彩绘壁画和书法，风格取自该作品所属文化的古代手抄本美学，并写上作品名；
  - 内部分三层，内容全部根据作品自动推断：
    · 顶部：故事高潮中的要塞、宫殿或王座；
    · 中层洞穴：作品里的神话生物和地貌；
    · 底部盆地：史诗般的军队对阵和河流水道；
  - 材质：雕刻的石头、木头和做旧金饰，内部有点点火光；
  - 球体放在一个金属底座上，旁边立着[两张写有作品名句的小题签]，右侧留白处用优雅字体写作品名和一句简介；
  - [浅米色]纯色背景，微距摄影的浅景深。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-nano-banana-pro-prompts
  url: https://x.com/Gdgtify/status/2095942973934698532
  author: "@Gdgtify"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 原文是伪 SQL 查询结构，本站改写成自然的中文分点描述，保留"裂开的空心球体、外壳壁画书法、内部三层推断场景、石木金材质、微距景深"等核心要素；按示例图补充了底座、题签和右侧标题排版
images:
  - 3288-book-world-globe-diorama-1.jpg
imageCredit:
  by: "@Gdgtify"
  url: https://cms-assets.youmind.com/media/1788591089116_kxrbhm_HRNiaKKWgAMDb5j.jpg
  license: CC BY 4.0
verify:
  - 换成一部中国古典名著（如《西游记》《三国演义》）实测，看内部场景推断是否贴合
  - 题签上的小字多为模型编造的句子，展示时提醒不要当作原著引文
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么填变量**：[作品名] 是这条的核心，填任何有完整世界观的作品都可以，比如"西游记""山海经""奥德赛"，模型会自己推断要画哪些宫殿、神兽和战场；建议优先用已进入公版的古典作品。[两张写有作品名句的小题签] 可改成"一块刻着作品名的铜牌"，或整行删掉让画面更干净；[浅米色] 背景可换成"深墨绿""暗红丝绒"营造博物馆感。示例图是以一部波斯古代史诗为题：球体左侧外壳上画着骑马武士的细密画和花体书名，裂口里从上到下是山顶白色宫殿、飞翔的神鸟和火光洞穴、底部激战的军队，球体立在雕花金属底座上，两侧各有一张手写题签，右边空白处写着书名和一句介绍。

**常见问题与调整**：
- 内部场景太乱：限定"每层只放一个主要场景，层与层之间有明显的岩层分隔"。
- 外壳文字乱码：只保留作品名，删去题签和右侧简介。
- 想要中国风：外壳改成"工笔重彩壁画和行书题字"，材质改成"青铜、玉石和朱漆木"。
- 想做竖版海报：画幅改 3:4，球体居中偏上，下方留白写标题。

**适合**：读书分享封面、名著推荐海报、文化展览或书店活动主视觉；不适合需要严格还原原著细节的学术插图。

### 英文原版

```
16:9 select * from artifact_diorama_archives where subject_media = '{argument name="media title" default="[media_title]"}' and base_structure = 'giant_hollowed_out_sphere_cracked_open' and exterior_shell = ( select manuscript_aesthetic, typography from cultural_heritage_db where lore = '{argument name="media title" default="[media_title]"}' format as 'flat_2d_painted_fresco_and_calligraphy_on_outer_curve' ) and interior_payload_strata = array[ (level: 'upper_apex', asset: 'infer_climactic_fortress_or_throne({argument name="media title" default="[media_title]"})'), (level: 'middle_caverns', asset: 'infer_mythological_creatures_and_terrain({argument name="media title" default="[media_title]"})'), (level: 'lower_basin', asset: 'infer_epic_armies_and_waterways({argument name="media title" default="[media_title]"})') ] and materials = 'carved_stone_wood_and_antiqued_gold' and optical_engine = 'macro_photography_depth_of_field';
```

> 改编自 [@Gdgtify](https://x.com/Gdgtify/status/2095942973934698532) 发布、[YouMind-OpenLab/awesome-nano-banana-pro-prompts](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) 收录的提示词，仓库许可证 CC BY 4.0。
