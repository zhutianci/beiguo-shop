---
title: "壁纸提示词：一群寄居蟹背着风暴云穿过草原，超现实自然摄影风（gpt-image-2）"
slug: hermit-crabs-carrying-storm-clouds-surreal
model: gpt-image-2
topics: [wallpaper, photography, illustration]
aspectRatio: "4:5"
needsRefImage: false
useCase: "用\"小动物背着一种天气赶路\"的设定，生成一张以假乱真的超现实自然摄影：贴地的低机位、压低的天空、被风吹弯的草。适合做手机壁纸、公众号头图，或作为创意摄影的灵感练习。"
prompt: |
  生成一张照片级写实的超现实自然摄影作品：一群[寄居蟹]背着[风暴云]，赶在风雨到来之前，缓缓穿过一片[草原]。
  - 核心设定：它们背上的不是普通的壳，而是一团团缩小的[风暴云]——云团卷成螺旋的壳形，灰蓝色的云层层叠叠，底部透出一点沙黄色的雨幕。
  - 构图：竖版 4:5，贴近地面的低机位；最近的一只在左下前景，占画面很大比例，眼柄、螯和带绒毛的步足都清晰锐利；其余几只沿对角线由近到远排成一列，越远越小、越虚。
  - 环境：及膝的长草被大风吹得向一侧倒伏；头顶是一整片压得很低的巨大旋转风暴云，远处地平线上有一道雨幕，天边裂开一条暖黄色的亮光。
  - 光线与色调：暴雨前的阴沉漫射光，整体是灰绿和青灰色，只有地平线处一抹暖色；浅景深，前景草叶虚化。
  - 质感：野生动物纪实摄影的真实感，云的体积和草叶的细节都要经得起放大；不要文字和水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/shu2891_/status/2077463708616265892
  author: "@shu2891_"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "仓库收录的英文版译为中文；原文只有一句话，按示例图补充了机位、景深、天空的超级单体云、光线、色调和\"壳被云团替代\"的画法；动物、天气、场景三个变量保留"
images:
  - 3500-hermit-crabs-carrying-storm-clouds-surreal-1.jpg
imageCredit:
  by: "@shu2891_"
  url: https://youmind.com/gpt-image-2-prompts?id=28801
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：三个变量可以自由组合，例如"蜗牛 / 彩虹 / 雨后的菜园""乌龟 / 积雪的山峰 / 戈壁""蚂蚁 / 棉花糖一样的晚霞 / 麦田"。[风暴云] 在提示词里出现了两次，替换时两处都要改；动物最好本身就"背着东西"或有壳，设定才自然。

示例图是低机位拍摄的草原：左前方一只很大的寄居蟹，背上是一团灰蓝色、层层翻卷的云，底部泛着沙黄色；身后还有四五只同样背着云的寄居蟹排向远方；草被风压弯，天空是一整块盘旋的巨型乌云，右侧地平线处透出一条橙黄色的光和斜斜的雨幕。

**常见问题**：
- 云只是飘在动物上方，没有变成"壳"：强调"云团取代了壳，直接长在背上，轮廓是螺旋壳形"。
- 画面像插画：加"长焦微距、纪实摄影、真实的毛发和草叶细节"。
- 数量太多太乱：写"共 5 只，由近到远排成一条斜线"。

**适合**：手机壁纸、创意摄影灵感、公众号和播客封面。

### 原版提示词

```text
A group of {argument name="animal" default="hermit crabs"} carrying {argument name="weather" default="storm clouds"}, slowly crossing the {argument name="scene" default="meadow"} before the wind and rain.
```

> 改编自 [@shu2891_](https://x.com/shu2891_/status/2077463708616265892) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
