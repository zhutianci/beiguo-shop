---
title: 局部改图提示词：只改指甲 / 只改一个细节，其他完全不变（gpt-image-2）
slug: nail-art-edit
model: gpt-image-2
topics: [photo-edit, ecommerce]
needsRefImage: true
useCase: 只想改照片里的一个小地方（指甲、口红色、耳环、杯子图案），其余像素尽量不动，适合美甲 / 美妆试色和商品图微调。
prompt: |
  以我上传的图片为底图，做一次极其细微的产品级修改：只把[拿着草莓那只手]上可见的指甲改成[淡粉色玫瑰主题美甲，带小花图案和亮面效果]。
  画面构图、脸、姿势、衣服、头饰、花束、背景、光线、配色以及标题文字"[PINK EDEN]"都要尽可能和原图保持一致。
  不要改变人物、背景、字体、裁切或整体氛围。
  这次修改只影响[2]处可见的指甲区域：[大拇指指甲和旁边露出一半的指甲]；其余所有细节保持不变。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/elle_elle_e/status/2097521726594978239
  author: のえる
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 英文原文译为中文；修改部位、修改内容、需保留的文字和修改区域数量改为变量
images:
  - 140-nail-art-edit-1.jpg
  - 140-nail-art-edit-2.jpg
imageCredit:
  by: のえる
  url: https://youmind.com/gpt-image-2-prompts?id=34041
  license: CC BY 4.0
verify:
  - 在 gpt-image-2 上实测 3 次，记录成功率与最常见的失败形式
  - 对比原图，除指甲外是否有其他区域被改动（脸部最容易变）
  - 图中原有文字是否保持不变
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：核心是"指名道姓"：写清楚改哪里（[拿着草莓那只手]）、改成什么（[淡粉色玫瑰主题美甲]）、一共几处（[2]）。图里有文字就把原文字写进来，提醒模型别动它。可以举一反三：把"指甲"换成"口红颜色""耳环款式""杯子上的图案"。

**常见问题**：
- 整张图都被重画了一遍：gpt-image-2 改图时整张图会重新生成，脸和细节可能有微小变化。把"不要改变人物"放在最前面，或者先把要改的区域裁出来单独改，再拼回去。
- 改的位置不对：用方位词说明，如"左下角""画面右侧那只手"。
- 用于商品图：微调后要和实物一致，不能把 A 款改成 B 款当实拍图售卖。

**示例图说明**：两张示例几乎一样，区别只在拇指指甲。

### 英文原版

```text
Using REFERENCE_0 as the base image, perform an extremely subtle product-style edit: change only the visible fingernails on the hand holding the strawberries into a delicate {argument name="nail design" default="pale pink rose-themed manicure with tiny floral nail art and a glossy finish"}. Keep the entire composition, face, pose, dress, bonnet, bouquet, strawberries, roses, wallpaper, lighting, color palette, and the headline text {argument name="headline text" default="PINK EDEN"} as close to the reference as possible. Do not alter the character, background, typography, cropping, or overall mood. The edit should affect exactly 2 visible nail areas: the main thumb nail and the small partially visible fingernail beside it; all other details should remain unchanged.
```

> 改编自 [のえる](https://x.com/elle_elle_e/status/2097521726594978239) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
