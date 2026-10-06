---
title: nano banana 修图指令：只删掉汉堡里的馅料，上下面包悬浮原位（局部消除示例）
slug: burger-remove-fillings
model: nano-banana
topics: [photo-edit, ecommerce, photography]
needsRefImage: true
useCase: 做餐饮广告、菜单"自选配料"示意图、爆款创意图时，上传一张汉堡 / 三明治照片，让 AI 只删掉中间夹的东西、保留上下两片面包和原来的间距，背景和光线不变。
prompt: |
  把这张照片里[汉堡]中间的所有馅料都去掉，只保留上下两片[面包]。
  - 上面那片面包悬浮在原来的高度，上下两片之间留出和原来馅料一样厚的空隙；
  - 面包的形状、芝麻、焦色和纹理保持原样，下片面包露出干净的切面；
  - 背景、桌面、光线方向和景深与原图完全一致，空隙处透出原来的背景；
  - 不要新增任何食材、酱汁滴落或文字，整体仍是真实的美食摄影质感。
negativePrompt: null
source:
  repo: PicoTrex/Awesome-Nano-Banana-images
  url: https://x.com/bind_lux/status/1965869157125402654
  author: "@bind_lux"
  license: Apache-2.0
  licenseUrl: https://www.apache.org/licenses/LICENSE-2.0
  changes: 译成中文；保留"只留上下面包、保持原间距"的核心要求，补充面包细节不变、背景透出、不新增元素等约束，把食物名称设为变量
images:
  - 521-burger-remove-fillings-1.jpg
  - 521-burger-remove-fillings-2.jpg
imageCredit:
  by: "@bind_lux"
  url: https://github.com/PicoTrex/Awesome-Nano-Banana-images/tree/main/images/case73
  license: Apache-2.0
verify:
  - 示例输入图是一张写实汉堡摄影照片，来源不明，确认展示无版权顾虑（必要时只保留结果图）
  - 换成三明治 / 肉夹馍实测一次，看是否同样能保持间距
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么用**：上传一张侧面拍的汉堡照片，直接发送提示词。示例图第 1 张是结果，第 2 张是原图：芝士、两片牛肉饼、酸黄瓜和洋葱全部消失，上片面包停在原位"飘"着，背景的暖棕色墙面和木桌一点没变。

**这条的真正用法**：它演示的是 nano banana 的"局部消除 + 保持空间关系"能力，换个对象就能用在别处：
- [汉堡] 换成"三明治""肉夹馍""千层蛋糕"，做"配料拆解"图；
- 改成"只去掉生菜和番茄，保留其他"，做"免葱免菜"示意；
- 再追问"在空隙里按从下到上的顺序重新放入：牛肉饼、芝士、生菜"，就能做"自选配料"菜单图。

**常见问题**：
- 上片面包掉下来贴在一起：强调"上片面包高度不变，中间必须留空"。
- 背景被重画：加"除了删掉的馅料，其他像素尽量不动"。

**适合**：餐饮外卖主图、菜单设计、美食创意短视频封面；用于商品宣传时，请确保最终实物与图片描述一致。

### 英文原版

```
Remove all the ingredients from the burger and keep only the top and bottom buns. Leave a gap between them, keeping the same spacing as if the fillings were still inside.
```

> 改编自 [@bind_lux](https://x.com/bind_lux/status/1965869157125402654) 发布、[PicoTrex/Awesome-Nano-Banana-images](https://github.com/PicoTrex/Awesome-Nano-Banana-images) 收录的提示词（案例由 @jeanlucaslima 提供），仓库许可证 Apache-2.0。
