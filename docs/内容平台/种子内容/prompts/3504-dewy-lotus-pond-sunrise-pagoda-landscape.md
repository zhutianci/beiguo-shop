---
title: "壁纸提示词：晨雾荷塘日出，挂满露珠的荷叶和远处虚化的古塔（Nano Banana）"
slug: dewy-lotus-pond-sunrise-pagoda-landscape
model: nano-banana
topics: [wallpaper, photography]
modelLabel: Nano Banana Pro
aspectRatio: "1:1"
needsRefImage: false
useCase: "生成一张清晨荷塘的写实风光：前景是大片带露珠的荷叶和几朵粉荷，中景湖面起雾，远处一座古塔立在朝霞里。适合做壁纸、节气海报底图和公众号头图。"
prompt: |
  生成一张照片级写实的风光摄影作品：清晨的荷塘。
  - 前景：[挂满露珠的荷叶]占据画面下半部分，叶面上密密的水珠在晨光里闪闪发亮，叶脉清晰；叶丛间有两三朵盛开的粉色荷花和几个花苞，其中一朵最大，位于画面中间偏右。
  - 中景：平静的水面漂着睡莲叶，贴着水面有一层薄薄的晨雾。
  - 远景：[一座多层古塔]立在湖对岸的树林上方，被雾气和逆光柔化，略微虚化；后面是层层远山。
  - 天空与光线：太阳刚从山后升起，柔和的逆光；天空是[粉色调]的朝霞，夹着淡蓝和暖橙，水面映出天空的颜色。
  - 质感：广角镜头，前景锐利、远景柔和；色彩通透不过饱和，安静、清新；不要文字和水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-nano-banana-pro-prompts
  url: https://x.com/dfl_inc_jp/status/2068450663278030961
  author: "@dfl_inc_jp"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；原文只有几个关键词，按示例图补充了前中远三层构图、露珠与薄雾、光线方向和色调；主体、远景、色调三个变量保留"
images:
  - 3504-dewy-lotus-pond-sunrise-pagoda-landscape-1.jpg
imageCredit:
  by: "@dfl_inc_jp"
  url: https://youmind.com/nano-banana-pro-prompts?id=26315
  license: CC BY 4.0
verify:
  - "上线前在 Nano Banana 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[挂满露珠的荷叶] 是前景主体，可换成"结霜的芦苇""沾着雨水的枫叶""带露的郁金香花田"；[一座多层古塔] 是远景的点睛物，可换成"一座石拱桥""山顶的亭子""远处的风车"；[粉色调] 决定朝霞颜色，换成"金橙色调""青蓝色调"会分别得到日出后和日出前的感觉。

示例图是方形构图：下半部分是几片巨大的荷叶，上面布满细碎的水珠，三朵粉色荷花和一个花苞立在叶丛里；水面漂着小片的睡莲叶并泛着雾；对岸树林上方是一座深色的五层塔，背后是淡粉、淡橙相间的朝霞和柔和的日光。

**常见问题**：
- 露珠不明显：加"微距级别的水珠细节，每片叶子上都有成串水珠"。
- 远景的塔太清楚抢了主体：强调"远景在薄雾中、低对比度"。
- 颜色太艳像滤镜：写"自然色彩、低饱和、保留清晨的灰度"。

**适合**：手机和平板壁纸、夏至或小暑等节气图的底图、茶和香氛类品牌的氛围图。

### 英文原版

```text
masterpiece, realistic photo, landscape, {argument name="subject" default="Dewy lotus leaves"}, sparkling droplets, {argument name="backdrop" default="blurred pagoda"}, {argument name="color theme" default="pink hues"}, soft sunrise
```

> 改编自 [@dfl_inc_jp](https://x.com/dfl_inc_jp/status/2068450663278030961) 发布、[YouMind-OpenLab/awesome-nano-banana-pro-prompts](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
