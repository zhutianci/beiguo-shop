---
title: "ai海报设计提示词：只用两种颜色的霓虹线描塔罗牌，前进色与后退色做出裸眼 3D 层次（Nano Banana）"
slug: two-color-neon-line-tarot-card-3d-depth
model: nano-banana
topics: [poster, illustration]
modelLabel: Nano Banana Pro
aspectRatio: "2:3"
needsRefImage: false
useCase: "利用\"暖色前进、冷色后退\"的色彩原理做一张有纵深感的线描卡牌：纯黑背景上，中央的卡牌和人物用前进色，四周略被遮挡的纹样用后退色，适合做卡牌封面、活动主视觉和暗色系壁纸。"
prompt: |
  请只用两种颜色加纯黑背景，画一张复杂的线描塔罗牌风格图像，做出裸眼 3D 的层次感，画幅 2:3 竖版。
  - 配色规则：前景用前进色[霓虹红]，背景用后退色[深蓝紫]；全画只有这两种颜色的线条，底色是纯黑，不要其他颜色，不要填充色块和渐变。
  - 前景（画面中央，前进色）：一张带圆角边框的塔罗牌——牌面里是[一位身穿长裙、从拱门中走出的女子]，身后是同心圆的光环和两根立柱，脚下是带透视的方格地面；牌的顶部是罗马数字"[II]"，四个角各有一个小圆形符号；牌的底部是衬线大写的牌名"[THE MAZE]"。
  - 背景（环绕四周，后退色）：从卡牌背后向外铺开的[迷宫回纹和连拱]，四个角分别是[狮子、龙、狮鹫和山羊]的线描；背景图形与卡牌边缘略有重叠，并且被卡牌挡在后面。
  - 线条：粗细均匀的单线，像霓虹灯管或烫金线稿，细节繁复但排列整齐、左右对称。
  - 除牌名和罗马数字外不出现其他文字，不要水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-nano-banana-pro-prompts
  url: https://x.com/Tz_2022/status/1999250756961206382
  author: "@Tz_2022"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "仓库收录的英文版译为中文；前景色、背景色两个变量保留并按示例图填入默认值，新增牌名、中心图案、四角纹样三个变量；按示例图补充了卡牌边框、拱门和迷宫纹样的描述"
images:
  - 3541-two-color-neon-line-tarot-card-3d-depth-1.jpg
imageCredit:
  by: "@Tz_2022"
  url: https://cms-assets.youmind.com/media/1765967788323_xgggmc_G77D9w0WQAAwXb8.jpg
  license: CC BY 4.0
verify:
  - "上线前在 Nano Banana 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：两种颜色按"一暖一冷"来选效果最明显——暖色（红、橙、金）放前景，冷色（蓝、紫、青）放背景；反过来用层次感会变弱。牌名、罗马数字和中心图案一起换，例如"THE TIDE / VII / 站在浪尖的水手"；四角纹样写四种动物或四种符号；背景纹样可换"星图和月相""藤蔓和玫瑰窗"。

示例图是黑底上的双色线稿：中央一张红色线条的卡牌，里面是一位穿长裙的女子站在两根立柱之间，身后是一圈圈同心圆，脚下是方格地面，牌顶是罗马数字 II，底部写着"THE MAZE"；卡牌后面是蓝紫色的迷宫纹和拱门，四个角分别画着狮子、龙、狮鹫和山羊；右下角有生成工具自带的四角星标记。

**常见问题**：
- 出现第三种颜色或渐变：把"只有两种颜色的线条、纯黑底"放到提示词第一句。
- 没有前后层次：强调"背景线条在卡牌边缘处被遮挡，卡牌有完整闭合的外框"。
- 线条太密糊成一片：减少背景纹样的种类，只保留一种回纹。

**适合**：卡牌和桌游的封面概念、活动主视觉、暗色壁纸、T 恤和烫金印刷的图案起稿。

### 原版提示词

```text
Please use only two colors ({argument name="Foreground Color" default="Advancing Color"}/{argument name="Background Color" default="Receding Color"} + pure black background) to construct the following complex line art tarot card image, creating a naked-eye 3D effect: the foreground in the center is the advancing color, the background surrounds the edges with slight overlap (behind the foreground), which is the receding color, 2:3 aspect ratio.
```

> 改编自 [@Tz_2022](https://x.com/Tz_2022/status/1999250756961206382) 发布、[YouMind-OpenLab/awesome-nano-banana-pro-prompts](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
