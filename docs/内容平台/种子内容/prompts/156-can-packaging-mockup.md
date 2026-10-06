---
title: nano banana 包装样机提示词：把设计稿贴到易拉罐上，生成产品摄影图
slug: can-packaging-mockup
model: nano-banana
topics: [ecommerce, logo]
needsRefImage: true
useCase: 做好了平面包装设计 / 标签，但没有实物和 3D 样机时，上传设计稿 + 一张空白罐子图，直接得到带包装的产品摄影效果图。
prompt: |
  图 1 是包装设计稿，图 2 是一个空白的[铝制易拉罐]。
  把图 1 的设计完整贴合到图 2 的罐身上：图案、文字、配色保持不变，随罐身曲面自然弯曲，有金属反光和轻微高光。
  然后把这个产品放进极简风格的布景里：[浅灰色]无缝背景，柔和的棚拍光，罐子底部有自然的接触阴影。
  整体是专业的商业产品摄影，画面干净，画幅 [4:3]。
negativePrompt: null
source:
  repo: PicoTrex/Awesome-Nano-Banana-images
  url: https://x.com/ZHO_ZHO_ZHO/status/1962763864875167971
  author: "@ZHO_ZHO_ZHO"
  license: Apache-2.0
  licenseUrl: https://www.apache.org/licenses/LICENSE-2.0
  changes: 译成中文并扩写：新增包装载体、背景色、画幅变量；补充曲面贴合、金属反光、接触阴影等细节
images:
  - 156-can-packaging-mockup-1.jpg
imageCredit:
  by: "@ZHO_ZHO_ZHO"
  url: https://github.com/PicoTrex/Awesome-Nano-Banana-images/tree/main/images/case41
  license: Apache-2.0
verify:
  - 用含中文品牌名的设计稿实测，检查文字是否变形
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么用**：先传设计稿（图 1），再传空白容器图（图 2）。示例图左侧是两张输入（空罐 + 包装设计），右侧是结果。[铝制易拉罐] 可以换成"玻璃瓶""纸盒""咖啡杯""化妆品软管"，图 2 换成对应的空白容器即可。

**常见问题**：
- 小字糊掉或拼错：这是图像模型的通病，成分表、条码等小字不要指望完全准确，正式物料以设计稿为准；可以加一句"所有文字保持与图 1 完全一致"。
- 设计被"二次创作"：加"不要修改设计，只做贴图"。
- 想要场景图：把布景改成"放在[夏日野餐桌]上，旁边有冰块和水珠"。

**适合**：提案样机、电商预售主图、社媒预热；正式印刷前仍以实物打样为准。

### 英文原版

```
Apply the design from Image 1 to the can in Image 2, and place it in a minimalist design setting, professional photography
```

> 改编自 [@ZHO_ZHO_ZHO](https://x.com/ZHO_ZHO_ZHO/status/1962763864875167971) 发布、[PicoTrex/Awesome-Nano-Banana-images](https://github.com/PicoTrex/Awesome-Nano-Banana-images) 收录的提示词，仓库许可证 Apache-2.0。
