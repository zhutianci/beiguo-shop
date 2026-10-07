---
title: 壁纸提示词：小动物进食特写（平视角、干草地背景，示例为厚涂油画风仓鼠捧叶子）
slug: painterly-animal-portrait
model: nano-banana
topics: [illustration, wallpaper]
needsRefImage: false
aspectRatio: "4:5"
useCase: 想要一张可爱又有质感的小动物特写做手机壁纸、头像、儿童绘本插图或宠物主题配图时用，换个动物和食物就是一张新图。
prompt: |
  一张近距离、平视角度的特写：一只[欧洲仓鼠]待在一片干草地里。
  - 它有标志性的[棕色与黑色]相间的毛色，位于画面略偏左的位置，面朝右侧；
  - 小爪子捧着一片[小绿叶]，正在吃；
  - 黑亮的小眼睛清晰有神，长长的胡须很显眼；
  - 背景是虚化的金黄干草和暖色调；
  - 风格：[厚涂油画风]，笔触明显、色彩浓郁；
  - 画幅[4:5]。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-nano-banana-pro-prompts
  url: https://x.com/heathergreen/status/2086241045193339116
  author: "@heathergreen"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 译成中文并拆成要点；动物、毛色、食物设为变量；原文没有写画风，本站按示例图补充"厚涂油画风"作为可替换的风格变量，并补充背景与画幅
images:
  - 3352-painterly-animal-portrait-1.jpg
imageCredit:
  by: "@heathergreen"
  url: https://cms-assets.youmind.com/media/1786344499918_eo7cpi_HO4FP3kXkAAl5eH.jpg
  license: CC BY 4.0
verify:
  - 原文是野生动物摄影描述而示例图是油画风，确认不加风格词时的默认出图效果，必要时在页面说明
  - 换成"松鼠捧松果""兔子啃胡萝卜"出一次，看构图是否稳定
  - 确认原帖仍可访问、作者未另行声明保留权利（CC BY 4.0 需保留署名）
---
**怎么填变量**：[欧洲仓鼠] 换成任何小动物，比如"红松鼠""垂耳兔""小刺猬"；[棕色与黑色] 跟着动物的真实毛色改；[小绿叶] 换成"一颗松果""一小块胡萝卜""一颗草莓"；[厚涂油画风] 可以换成"写实野生动物摄影""水彩绘本风""3D 毛绒质感"。示例图是一张竖版厚涂油画：一只棕白黑三色的仓鼠坐在金黄的干草里，两只粉色小爪捧着一片绿叶正在啃，黑眼睛亮晶晶，背景是大笔触的暖棕和墨绿色块。

**常见问题与调整**：
- 想要真实照片质感：风格改成"野生动物摄影，长焦镜头，浅景深，自然光"。
- 动物比例奇怪：加"身体比例符合真实动物解剖结构"。
- 做手机壁纸：画幅改 9:16，动物放在画面下半部分，上方留出时钟区域。
- 做系列头像：固定"同样的画风和背景色"，只换动物和食物。

**适合**：手机壁纸、头像、儿童绘本或科普插图、宠物店社媒配图；不适合当作物种识别的科普依据。

### 英文原版

```
A close-up, eye-level shot captures a {argument name="animal type" default="European hamster"} in a field of dry grass. The {argument name="animal type" default="hamster"}, with its distinctive brown and black fur, is positioned slightly to the left of the frame, facing right. Its tiny paws are holding a {argument name="food item" default="small green leaf"}, which it appears to be eating. The {argument name="animal type" default="hamster"}'s dark, beady eyes are sharp and focused, and its long whiskers are prominent.
```

> 改编自 [@heathergreen](https://x.com/heathergreen/status/2086241045193339116) 发布、[YouMind-OpenLab/awesome-nano-banana-pro-prompts](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) 收录的提示词，仓库许可证 CC BY 4.0。
