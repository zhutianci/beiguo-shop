---
title: "X光透视提示词：透明三角钢琴的 X 射线扫描图（可换任意物体）（gpt-image-2）"
slug: xray-transparent-object-scan
model: gpt-image-2
topics: [illustration, photography]
aspectRatio: "3:4"
needsRefImage: false
useCase: "把一件乐器、机械或日用品画成黑底发光的 X 光透视图，内部结构层层可见，适合做科技感海报、展览视觉、手机壁纸或产品结构展示。"
prompt: |
  生成一张极其精细、照片级真实的 X 光图像：一台透明的[三角钢琴]，干净的侧面视角，纯黑背景。
  钢琴看起来像由发光的半透明玻璃和淡蓝白色放射影像材质构成，所有内部结构都清晰可见：竖琴形铸铁骨架、密集平行的琴弦、音板肋木、横撑、调音钉区域、键盘击弦机、琴槌、制音器、踏板连杆和支撑结构。
  恰好 3 条可见的腿：键盘下方左前腿、中间由细竖杆组成的踏板支架、琴身下方的右后腿。在琴身上方弯曲的边缘骨架上，恰好有 6 个大圆孔。
  外壳厚而透明，边缘发亮；细小的螺丝和五金件都可见；内部零件层层叠加，像医学扫描片。
  使用清晰的高对比光线、明亮的青白色高光、轻微辉光、锐利的技术细节；不要文字、不要人物、不要水印。
  物体在画面中水平、垂直居中，完整可见，只被画框边缘轻微裁切。
  整体效果：一张未来感、博物馆级的[三角钢琴] X 光扫描图，兼具工程剖视的精确和黑底放射影像的戏剧感。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/qoolstudio/status/2087556413543370961
  author: "Ilyas Salaoui"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；物体改为变量；保留数量约束（3 条腿、6 个圆孔）并注明换物体时如何改写"
images:
  - 3006-xray-transparent-object-scan-1.jpg
imageCredit:
  by: "Ilyas Salaoui"
  url: https://youmind.com/gpt-image-2-prompts?id=31311
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：两处 [三角钢琴] 要一起改，例如"复古胶片相机""机械腕表""自行车""咖啡机"。换物体后要删掉或改写"3 条腿、6 个圆孔"这类钢琴专属的结构描述，换成该物体的关键部件，比如相机写"镜头组、快门帘、胶片仓、过片齿轮"，这样内部结构才会准确。

示例图是一台侧面的三角钢琴，通体青白色半透明，琴弦、铸铁骨架上的 6 个圆孔、击弦机和琴槌层层叠加，三条腿和中间的踏板杆清晰可见，黑底无任何文字。

**常见问题**：
- 结构乱画、像玻璃雕塑：多列几个真实部件名称，并加"工程剖视般准确"。
- 画面发灰没有 X 光感：加"纯黑背景、高对比、只有青白一种颜色"。
- 物体被裁掉一半：强调"完整可见，四周留出边距"。

**适合**：科技 / 音乐主题海报、产品结构展示、手机与电脑壁纸、展览视觉。

### 英文原版

```text
Create a highly detailed photorealistic X-ray image of a transparent grand piano, shown in clean side profile on a pure black background. The piano should look like it is made of glowing translucent glass and pale blue-white radiographic material, revealing all internal mechanisms: the harp-shaped frame, dense parallel strings, soundboard ribs, cross braces, tuning pin area, keyboard action, hammers, dampers, pedal rods, and structural supports. Show exactly 3 visible legs: one front left leg under the keyboard, one central support/pedal assembly area with thin vertical rods, and one rear right leg under the body. Include exactly 6 large circular sound holes along the upper curved rim of the piano frame. Make the outer casing thick and transparent with bright illuminated edges, fine screws and hardware visible, and layered internal components overlapping like a medical scan. Use crisp high-contrast lighting, luminous cyan-white highlights, subtle bloom, sharp technical detail, and no text, no people, no watermark. Center the object vertically and horizontally, with the full piano visible and cropped only by the image frame margins. The overall effect should be a futuristic museum-quality X-ray scan of a {argument name="object" default="grand piano"}, combining engineering cutaway precision with dramatic black-background radiography.
```

> 改编自 [Ilyas Salaoui](https://x.com/qoolstudio/status/2087556413543370961) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
