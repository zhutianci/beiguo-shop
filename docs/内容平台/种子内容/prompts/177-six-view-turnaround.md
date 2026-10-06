---
title: nano banana 六视图提示词：一张图生成产品 / 角色的前后左右上下六个视图
slug: six-view-turnaround
model: nano-banana
topics: [ecommerce, character, illustration]
needsRefImage: true
useCase: 只有一张产品图或角色图，需要三视图 / 六视图给工厂打样、做 3D 建模参考或角色设定时，上传图片即可生成白底多视图。
prompt: |
  根据这张图里的[产品]，在纯白背景上生成它的六个视图：正视图、后视图、左视图、右视图、俯视图、仰视图。
  - 六个视图排成[2 行 3 列]，间距均匀，每个视图下方标注视图名称；
  - 所有视图是同一个物体，造型、比例、颜色、材质和细节完全一致；
  - 使用等效的正交视角（无透视变形），大小比例统一；
  - 柔和均匀的棚拍光，无强烈阴影。
negativePrompt: null
source:
  repo: PicoTrex/Awesome-Nano-Banana-images
  url: https://x.com/Error_HTTP_404/status/1960405116701303294
  author: "@Error_HTTP_404"
  license: Apache-2.0
  licenseUrl: https://www.apache.org/licenses/LICENSE-2.0
  changes: 译成中文；新增主体、排版变量；补充视图名称标注、正交视角、光线要求
images:
  - 177-six-view-turnaround-1.jpg
  - 177-six-view-turnaround-2.jpg
imageCredit:
  by: "@Error_HTTP_404"
  url: https://github.com/PicoTrex/Awesome-Nano-Banana-images/tree/main/images/case23
  license: Apache-2.0
verify:
  - 用一张角色立绘实测，看背面是否合理
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么用**：上传一张主体完整的图。示例第 1 张是生成的多视图，第 2 张是输入（一个放在沙地上的胶囊状概念产品）。[产品] 换成"角色"时，可以把视图改为"正面、侧面、背面三视图，T 字站姿"，就是标准的角色设定三视图。

**常见问题**：
- 背面 / 底面是"猜"的：原图看不到的面，模型只能合理推测，用于打样或建模前要人工确认；能提供多角度照片时，一起上传会准很多。
- 视图之间不一致：加"严格保持同一物体，不要出现不同版本"，或减少到三视图。
- 带透视：强调"像工程制图一样的正交投影"。

**适合**：产品打样沟通、3D 建模参考、角色设定、电商多角度图。

### 英文原版

```
Generate the Front, Rear, Left, Right, Top, Bottom views on white. Evenly spaced. Consistent subject. Isometric Perspective Equivalence. 
```

> 改编自 [@Error_HTTP_404](https://x.com/Error_HTTP_404/status/1960405116701303294) 发布、[PicoTrex/Awesome-Nano-Banana-images](https://github.com/PicoTrex/Awesome-Nano-Banana-images) 收录的提示词，仓库许可证 Apache-2.0。
