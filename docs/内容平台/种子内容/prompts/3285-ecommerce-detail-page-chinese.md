---
title: 电商详情页提示词：人体工学椅手机端长图详情页，多角度 + 尺寸 + 结构标注 + 参数表一次出齐
slug: ecommerce-detail-page-chinese
model: nano-banana
topics: [ecommerce, infographic]
needsRefImage: false
aspectRatio: "9:16"
useCase: 做家具、家电类商品的手机端详情页初稿时，生成一张从首屏、多角度、尺寸、结构标注、使用场景到参数和包装清单的完整竖版长图，缺失的数据会标"信息待确认"而不是乱编。
prompt: |
  一张完整连续的手机端电商详情页长图，竖版，比例[3:7]，商品是"[产品名]"概念款人体工学椅。
  产品外观：[深石墨灰网布椅背]、黑色框架、银灰色五星脚，带头枕、扶手、坐垫和腰托，所有角度的结构保持一致。
  整体版式：竖向网格系统，融合建筑蓝图和现代办公空间的视觉，配色为[纸白、石墨灰、钢蓝、少量橙色]标注，用清晰的窄体无衬线字和等宽参数字体。
  从上到下依次是：
  1. 首屏：3/4 侧角度展示产品和名称；
  2. 多角度：正面、侧面、背面、俯视辅助视角；
  3. 尺寸关系：用人坐姿和书桌的关系表现尺度，不推断适合的身高范围；
  4. 结构标注：用轮廓标出头枕、靠背、扶手、坐垫、腰托和椅脚，不画内部爆炸结构；
  5. 使用场景：办公、阅读、短暂休息；
  6. 结构说明：只写用户提供的信息，缺失项标"信息待确认"；
  7. 参数表：整椅尺寸、座高范围、承重、材质、调节项，未知数值不猜测；
  8. 包装与安装：椅身、已确认配件、安装说明、保养信息，缺失配件标"信息待确认"；
  9. 结尾：已确认结构的汇总和"查看尺寸与安装说明"提示。
  每个参数单位、尺寸线和信息卡都要完整填写；禁止虚构人体工学认证、承重数值、调节档位、健康功效、专利或检测结果。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-nano-banana-pro-prompts
  url: https://x.com/Mrpinecone888/status/2083738681949802588
  author: "@Mrpinecone888"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 译成中文并按详情页从上到下的模块拆成 9 条；产品名、比例、主体材质、配色设为变量；保留原文"未知数据标信息待确认、禁止虚构认证和功效"的约束
images:
  - 3285-ecommerce-detail-page-chinese-1.jpg
imageCredit:
  by: "@Mrpinecone888"
  url: https://cms-assets.youmind.com/media/1785654882513_3vc9ml_HOrtQQ_bAAAeu64.jpg
  license: CC BY 4.0
verify:
  - 原文比例是 3:7 超长图，部分工具不支持，需要时改用 9:16 并减少模块数量
  - 参数表和说明里的小字是否清晰、有无错字，上线前逐项核对
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么填变量**：[产品名] 换成你的商品名；[深石墨灰网布椅背] 写清最有辨识度的外观，换品类时连同第 4 条的部件一起改，比如换成"升降桌"就标"桌面、升降柱、控制面板、桌脚"，换成"空气炸锅"就标"炸篮、旋钮、出风口"。[纸白、石墨灰、钢蓝、少量橙色] 可按品牌色调整。[3:7] 是原文的超长比例，工具不支持时改为 9:16。示例图是中文版长图：顶部"Axis M3 人体工学椅"标题和三个卖点小图标，往下是四个角度、坐姿与书桌的尺寸示意、带橙色引线的结构标注、办公阅读休息三个场景、参数表和包装安装图标，不少格子里写着"信息待确认"。

**常见问题与调整**：
- 模型自己编了承重和认证：把真实参数直接写进第 7 条，其余保留"信息待确认"。
- 长图后半段变糊：拆成两张，第一张做 1～5 模块，第二张做 6～9 模块，追问"保持同样配色和字体"。
- 产品在不同角度长得不一样：先上传一张产品实拍图，开头加"产品外观以上传图为准"。
- 想要更有温度：把"建筑蓝图"改成"暖色居家办公场景，木质书桌和绿植"。

**适合**：电商详情页初稿、新品提案、设计师排版参考；正式上线前参数必须换成真实数据，实物要与图片一致。

### 英文原版

```
A single, continuous, and complete mobile e-commerce detail page for an ergonomic office chair, with an aspect ratio of {argument name="aspect ratio" default="3:7"}. The product is the "{argument name="product name" default="Axis M3 Ergonomic Chair"}" concept model, featuring a dark graphite grey mesh back, black frame, silver-grey five-star base, visible headrest, armrests, seat cushion, and lumbar support, maintaining structural consistency across all perspectives. The overall design uses a vertical grid system combining architectural blueprints with modern office spaces, featuring {argument name="color scheme" default="paper white, graphite grey, steel blue, and subtle orange"} annotations, clear narrow sans-serif, and monospace parameter fonts. The first screen shows the identity of the product with a 3/4 angle view; followed by front, side, back, and top-down auxiliary angles; using human sitting postures and desk relationships to show scale without inferring specific height suitability ranges; labeling headrest, backrest, armrests, seat cushion, lumbar support, and chair feet by outline without providing internal exploded structures; showcasing office, reading, and brief rest scenarios; the evidence section only shows structural descriptions and sources provided by the user, with missing items marked "information to be confirmed"; the parameter section includes full chair dimensions, seat height range, load capacity, materials, and adjustment items, with unknown values not guessed; the packaging section shows the chair body, confirmed accessories, installation instructions, and care information, with missing accessories marked "information to be confirmed"; and ends with a summary of confirmed structures and a "view dimensions and installation instructions" note. Every parameter unit, dimension line, and information card must be fully filled out. Fictional ergonomic certifications, load-bearing values, adjustment levels, health improvements, patents, or test results are prohibited.
```

> 改编自 [@Mrpinecone888](https://x.com/Mrpinecone888/status/2083738681949802588) 发布、[YouMind-OpenLab/awesome-nano-banana-pro-prompts](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) 收录的提示词，仓库许可证 CC BY 4.0。
