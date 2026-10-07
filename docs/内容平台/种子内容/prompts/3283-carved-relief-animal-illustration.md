---
title: 壁纸提示词：木雕浮雕质感的渡渡鸟与热带丛林（可换任意动物，装饰画风）
slug: carved-relief-animal-illustration
model: nano-banana
topics: [illustration, wallpaper]
needsRefImage: false
aspectRatio: "4:5"
useCase: 做手机壁纸、装饰画、科普账号封面时，指定一种动物，生成层层叠叠的彩绘木雕浮雕效果插画：羽毛和叶片都像刻出来的，背景是热带植物和远山。
prompt: |
  一只[渡渡鸟]，身体圆润饱满，覆盖着[深灰与棕色]的羽毛，羽毛上有更浅色的精细花纹。
  - 双腿和脚爪清晰可见，腿部是带鳞片的皮肤，爪子尖锐；
  - 头部颜色偏浅灰，有一个显眼的弯曲大喙，喙上带[龟裂纹理]；
  - 整体做成彩绘木雕浮雕效果：每片羽毛、每片叶子都像用刻刀雕出的立体层次，边缘有木纹和刻痕，颜色是哑光的自然矿物色；
  - 动物站在一根雕刻的树枝上，四周环绕[热带植物和浆果]，远处是[火山和湖水]；
  - 构图饱满、装饰性强，侧光让浮雕的凹凸明暗清晰。
  竖版 4:5。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-nano-banana-pro-prompts
  url: https://x.com/heathergreen/status/2085878662017032685
  author: "@heathergreen"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 原文只描述鸟的外形，本站译成中文后按示例图补充了"彩绘木雕浮雕"画风、树枝站姿、热带植物与火山背景、侧光等约束；动物、羽色、喙纹理、背景设为变量
images:
  - 3283-carved-relief-animal-illustration-1.jpg
imageCredit:
  by: "@heathergreen"
  url: https://cms-assets.youmind.com/media/1786257242691_8zff74_HO4FJ_2XYAA8VPb.jpg
  license: CC BY 4.0
verify:
  - 原文没有写木雕浮雕画风，示例图的风格可能来自作者其他设定；按本站补充版实测一次，看能否稳定出浮雕质感
  - 换成"大熊猫""丹顶鹤"实测，确认动物结构正确
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么填变量**：[渡渡鸟] 换成任何动物都行，比如"猫头鹰""丹顶鹤""金丝猴"，[深灰与棕色] 要跟着改成该动物真实的毛色（丹顶鹤就写"白色和黑色，头顶一点红"）。[龟裂纹理] 原文是给渡渡鸟喙设计的细节，换别的动物时可以改成"光滑的角质"或直接删掉这一行。[热带植物和浆果]、[火山和湖水] 决定氛围，换成"竹林和远山""松枝和雪山"就有东方装饰画的感觉。示例图里渡渡鸟站在雕刻的树枝上，羽毛像一片片木片叠起来，周围是棕榈叶、红色浆果，左后方有一座小火山和湖面，整幅画像一块上了色的木雕板。

**常见问题与调整**：
- 出成了普通写实照片：把"彩绘木雕浮雕"放到第一句，并加"像手工雕刻后上色的木板装饰画"。
- 浮雕感太弱：加"强烈侧光，羽毛边缘投下清晰阴影"。
- 背景太乱抢主体：改成"背景植物只占四周边缘，中心留给动物"。
- 想做横版电脑壁纸：画幅改 16:9，并说明"动物在画面右侧三分之一处，左侧是丛林和远山"。

**适合**：手机壁纸、装饰画、儿童科普封面、文创图案；不适合需要准确物种特征的科学插图。

### 英文原版

```
a {argument name="bird species" default="dodo bird"}. Its body is plump and rounded, covered in {argument name="feather colors" default="dark gray and brown feathers"} with lighter, intricate patterns. The bird's legs and feet are visible, with scaly skin and sharp claws. The head is a lighter gray, with a prominent, curved beak that has a {argument name="beak texture" default="cracked texture"}.
```

> 改编自 [@heathergreen](https://x.com/heathergreen/status/2085878662017032685) 发布、[YouMind-OpenLab/awesome-nano-banana-pro-prompts](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) 收录的提示词，仓库许可证 CC BY 4.0。
