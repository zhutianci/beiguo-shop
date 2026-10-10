---
title: "ai创意图提示词：种子包装袋\"长\"出一片真菜园，从包装插画到实物的魔法场景（gpt-image-2）"
slug: seed-packet-grows-into-real-garden-diorama
model: gpt-image-2
topics: [figurine, poster, ecommerce]
aspectRatio: "3:2"
needsRefImage: false
useCase: "把\"包装上画的东西变成真的\"这个创意做成一张图：一只旧旧的种子袋躺在园艺工作台上，袋面上的植物从纸里长出来，根穿过袋底扎进土里，背面的种植说明变成了小日历。适合做种子、园艺、农产品的创意海报和包装概念图。"
prompt: |
  生成一个有史诗感的 3D 场景，画幅 3:2 横版：一只做旧的纸质种子袋摊开躺在园艺工作台上，它所承诺的那片菜园正从袋子里"爆发"出来——袋面上的插画变成了真的。
  - 主体：[番茄]从纸袋里以真实大小长出来，枝叶茂盛；透过袋子底部能看到根系，穿出纸面扎进下面的土壤。
  - 两处对比：一侧是[挂满枝头、已经成熟的红番茄]；另一侧是[刚破土的几株小苗]，还没有长成它将来的样子。
  - 昆虫：属于这种植物的小昆虫——[蜜蜂]，以真实的比例在植株上方飞。
  - 种子袋：袋子正面是复古印刷风的作物插画和品名"[TOMATO SLICER]"；背面的文字说明变成了一张园艺日历，写着"春季播种""全日照""保持湿润"之类的短句和小图标（英文或中文均可）。
  - 环境：木头工作台上散着泥土、几粒种子和水渍，旁边有花盆和小铲子；背景是温室的玻璃和虚化的绿植。
  - 光线：清晨温暖的阳光从侧后方照进来，像春天的光，叶片透亮，土壤湿润。
  - 质感：电影级的微距写实，纸张的折痕和磨损、根须和泥土都清楚；不要水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/AllaAisling/status/2048156345518768190
  author: "@AllaAisling"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并分条；植物、两处细节、昆虫改为变量，并按第一张示例图（番茄）填入默认值；新增袋面品名变量；合并了重复的氛围描述"
images:
  - 3544-seed-packet-grows-into-real-garden-diorama-1.jpg
imageCredit:
  by: "@AllaAisling"
  url: https://youmind.com/gpt-image-2-prompts?id=15864
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[番茄] 换成任何能种的东西——"向日葵""薰衣草""草莓""辣椒"；两处对比分别写"成熟的样子"和"刚发芽的样子"；昆虫换成对应的传粉者或常见访客（蝴蝶、瓢虫、蜻蜓）；袋面品名用英文大写或 2～4 个汉字。日历上的小字模型常写错，重要的话只留一两句。

示例图是温室里的一张木桌：一只泛黄卷边的纸袋横躺着，正面印着红番茄的复古插画和"TOMATO SLICER"字样，左侧是一小块日历和"SOW IN SPRING""FULL SUN""WATER"几行字；番茄藤从袋子里长出来，右边挂着一串熟透的红番茄，袋子下面露出根须，前面的泥土里是一排大小不一的小苗，空中有两只蜜蜂。

**常见问题**：
- 植物只是摆在袋子旁边，没有"从袋子里长出来"：强调"植株的茎直接穿出纸袋表面，根从袋底伸出"。
- 袋子太新太干净：写"纸张泛黄、边缘撕裂、有折痕和水渍"。
- 文字出错：品名之外的字全部改成"模糊的印刷小字"。

**适合**：种子与园艺品牌的创意海报、农产品包装概念、自然教育活动的宣传图。

### 英文原版

```text
Epic 3D scene: a weathered seed packet lying open on a potting bench, its promise erupting into the garden it describes. The illustration on the front becomes real. {argument name="plant type" default="[PLANT / FLOWER]"} growing at full scale from the paper, roots visible through the packet's base pushing into soil below.
{argument name="detail left" default="[DETAIL 1]"} in full bloom at one corner. {argument name="detail right" default="[DETAIL 2]"} mid-growth at the other, not yet what it will be.
Tiny insects that belong to this plant, {argument name="insect type" default="[BEE / BUTTERFLY / BEETLE]"}, hovering at correct scale.
The written instructions on the back become garden calendar, "sow in spring" manifests as actual spring light. "full sun" manifests as a single shaft of it, hitting the tallest bloom perfectly.
Scattered seeds between packet and soil each showing their germination stage, split coat, first root, first shoot, first leaf.
The packet's torn top edge becomes a treeline.
Potting bench surface with soil scatter and water droplets.
Tilt-shift depth of field, greenhouse morning light, the packet as the garden it always intended.
```

> 改编自 [@AllaAisling](https://x.com/AllaAisling/status/2048156345518768190) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
