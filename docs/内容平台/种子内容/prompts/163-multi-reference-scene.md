---
title: nano banana 多图合成提示词：把模特、衣服、包、车、宠物等多张参考图合成一张大片
slug: multi-reference-scene
model: nano-banana
topics: [photography, ecommerce, photo-edit]
needsRefImage: true
useCase: 拍时尚大片、做商品组合图时，把模特、单品、道具、宠物分别上传（最多十几张参考图），用一段话描述它们怎么组合，一次生成完整场景。
prompt: |
  参考我上传的所有图片，生成一张时尚大片：
  一位模特摆着姿势，倚靠在[粉色复古轿车]旁边。她穿戴着参考图中的[牛仔外套、牛仔裤、白色运动鞋和墨镜]。
  [绿色外星人]是一个钥匙扣，挂在[粉色手提包]上；模特肩上站着一只[粉色鹦鹉]；她身边坐着一只戴[粉色项圈和金色耳机]的[巴哥犬]。
  场景是[浅灰色]纯色棚拍背景，柔和均匀的棚拍光，每件物品的外观、颜色、图案都与对应参考图一致，构图完整，画幅 [4:3]。
negativePrompt: null
source:
  repo: PicoTrex/Awesome-Nano-Banana-images
  url: https://x.com/MrDavids1/status/1960783672665128970
  author: "@MrDavids1"
  license: Apache-2.0
  licenseUrl: https://www.apache.org/licenses/LICENSE-2.0
  changes: 译成中文；把原文中的车辆品牌改为通用描述；把每件物品都变成变量；补充背景、光线、画幅和"与参考图一致"的约束
images:
  - 163-multi-reference-scene-1.jpg
  - 163-multi-reference-scene-2.jpg
imageCredit:
  by: "@MrDavids1"
  url: https://github.com/PicoTrex/Awesome-Nano-Banana-images/tree/main/images/case6
  license: Apache-2.0
verify:
  - 记录 nano banana 当前一次最多能上传几张参考图（以 Gemini 应用实测为准）
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么用**：把所有参考图一次性上传（示例第 2 张就是全部输入：模特、外套、鞋、墨镜、包、钥匙扣、鹦鹉、巴哥犬、汽车等），再发提示词。示例第 1 张是合成结果。

**写好多图提示词的关键**：
1. **每张参考图都要在文字里"点名"**，并说清楚它在画面里扮演什么角色（穿在身上 / 挂在包上 / 站在肩上）；没被点名的图很可能被忽略。
2. 关系越具体越好："挂在包上""坐在她左边"比"放在画面里"稳定得多。
3. 参考图尽量是干净背景的单品图，避免一张图里有多个物体。

**常见问题**：物品数量多时会漏掉一两件，可以追问"补上缺少的[白色运动鞋]"；颜色不对就在文字里重复强调颜色。

**适合**：时尚 / 电商组合大片、品牌联名物料预览、情绪板。

### 英文原版

```
A model is posing and leaning against a pink bmw. She is wearing the following items, the scene is against a light grey background. The green alien is a keychain and it's attached to the pink handbag. The model also has a pink parrot on her shoulder. There is a pug sitting next to her wearing a pink collar and gold headphones.
```

> 改编自 [@MrDavids1](https://x.com/MrDavids1/status/1960783672665128970) 发布、[PicoTrex/Awesome-Nano-Banana-images](https://github.com/PicoTrex/Awesome-Nano-Banana-images) 收录的提示词，仓库许可证 Apache-2.0。
