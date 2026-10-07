---
title: Midjourney 局部重绘和扩图怎么用：编辑器、Vary Region、Zoom Out 与 Pan
slug: midjourney-vary-region-zoom
products: [ai-tools]
models: [midjourney]
accountTier: OTHER
excerpt: Midjourney 怎么只改图的一部分、怎么把画面往外扩？本文按官方文档讲清网页版编辑器（擦除、智能选择、图层、改画幅）、Discord 的 Vary Region，以及 Zoom Out 和 Pan 的用法与 V8 下的限制。
checkedOn: 2026-10-07
sources:
  - https://docs.midjourney.com/hc/en-us/articles/32764383466893-Editor
  - https://docs.midjourney.com/hc/en-us/articles/32794723105549-Vary-Region
  - https://docs.midjourney.com/hc/en-us/articles/32595476770957-Zoom-Out
  - https://docs.midjourney.com/hc/en-us/articles/32570788043405-Pan
  - https://docs.midjourney.com/hc/en-us/articles/48495453462797-Edit-Model
  - https://docs.midjourney.com/hc/en-us/articles/32199405667853-Version
---

## 适用于谁

- 搜「Midjourney 局部重绘怎么用」「vary region 怎么用」「Midjourney 扩图」，图整体满意、只想改一小块或者想把画面放宽的人；
- 想用 Midjourney 修改自己上传的照片（换背景、加物件）的人；
- 在 Discord 找不到 Vary Region 按钮、或者网页版不知道编辑器在哪的人。

本文根据 Midjourney 官方文档整理，资料核对于 2026-10-07；英文界面，按钮名以实际为准。

## 结论先说

1. **网页版用编辑器（Editor）**：擦除（Erase）一块区域 + 写提示词 = 局部重绘；拖大画布或改画幅 = 扩图。还有智能选择、图层、整体换风格。
2. **Discord 用 Vary Region**：先 U 出单张，再点 🖌️ Vary (Region) 框选；想改提示词要先开 Remix 模式。
3. **快速扩图用 Zoom Out / Pan**：Zoom Out 向四周扩（1.0–2.0 倍），Pan 向一个方向扩。
4. **V8 下的注意点**：官方说明 V8.x 的编辑器局部重绘和扩图改用新的 Edit 模型；在 HD 图上用这些工具，结果会降为 SD 分辨率，需要时再放大回去。

## 步骤一：网页版编辑器

### 打开编辑器

- **改自己生成的图**：在 Create 或 Organize 页点开图片，在 Creation Actions 里点 **Edit**，会打开「轻量版」编辑器；点 **Open in Edit tab** 切到完整版。
- **改外部图片**：点左侧导航的 **Edit** 页，上传本地图片或粘贴图片网址。

### 主要工具

| 工具 | 作用 |
| --- | --- |
| Undo / Redo / Reset | 撤销、重做、全部重来 |
| Move / Resize | 移动、缩放、旋转图片，改画幅（预设比例或拖动画布外的灰条） |
| Paint | Erase 擦掉要重画的部分，Restore 恢复误擦的部分，可调笔刷大小 |
| Smart Select | 点选生成选区，再一键擦除选区或背景 |
| Suggest Prompt | 用 Describe 根据图片生成提示词（仅完整版 Edit 页） |
| Layers | 叠加其他图片做合成（仅完整版） |
| Export | 放大到图库，或直接下载 |

### 例子：给猫加一顶王冠（官方示例的思路）

1. 王冠需要画面上方留空间：在 Move / Resize 里改画幅，或拖动图片上方的灰条把画布拉高；
2. 用 **Erase** 擦掉头顶要放王冠的区域；
3. 在顶部输入框写「a black cat wearing a gold crown」，点 **Submit Edit**；
4. 右侧结果面板会出 4 张，继续编辑或导出。

![编辑器：左侧 Move / Resize 面板改画幅、Paint 面板擦除，右侧画布上方被拉出空白区域，顶部输入框写好提示词后点 Submit Edit（英文界面）](seed:g319-editor-resize.jpg)
*图片来源：[Midjourney 官方文档 · Editor](https://docs.midjourney.com/hc/en-us/articles/32764383466893-Editor)*

### 智能选择换背景

1. 点 **Smart Select**，在主体上点「Include」正向点，在不想选的地方点「Exclude」负向点，直到绿色选区覆盖目标；
2. 点 **Erase Selection**（擦选区内）或 **Erase Background**（擦选区外）**应用选区**——官方特别提醒：还能看到绿色高亮就说明选区没应用，直接提交不会生效；
3. 写新背景的描述，提交。

![Smart Select：Include / Exclude 点选后，绿色斜纹是选中的背景区域，下方有 Erase Selection 和 Erase Background 两个按钮（英文界面）](seed:g319-editor-smart-select.jpg)
*图片来源：[Midjourney 官方文档 · Editor](https://docs.midjourney.com/hc/en-us/articles/32764383466893-Editor)*

### 整体换风格（Retexture）

什么都不擦、不选，直接写一个新风格的完整描述（如「watercolor painting of a black cat with green eyes wearing a gold crown」）再提交，修改会作用于整张图。官方说明 V8.x 里这项功能已并入 Edit 模型；旧的 Retexture 需要把默认版本切回 V7 或更早。

### 图层合成

在 Layers 面板点 **Add** 加一张图（比如一顶特定的王冠），勾选当前操作的图层，擦掉需要 Midjourney 重新生成的部分，提交后图层会合并成一张。只有透明（灰白棋盘格）区域会被重新生成。

## 步骤二：Discord 的 Vary Region

1. 用 `/imagine` 出图，点 **U1–U4** 把想改的那张单独拿出来；
2. 点 **🖌️ Vary (Region)** 打开编辑窗口；
3. 用左下角的自由套索或矩形工具框选要重画的区域（选区不能修改，但可以撤销）；
4. 如果开了 **Remix 模式**，可以改提示词，只写要在选区里出现的东西；
5. 点提交，回到 Discord 等新的 4 张图。

官方给的技巧：

- **选区越大，改动越大**；选太大可能把想保留的部分也改掉。
- **提示词短而直接**：写「meadow stream」比「请把草地小路变成一条漂亮的小溪」好。
- **一次改一处**，分几轮完成。

官方说明 Vary Region 在 Discord 中适用于 V8.2 的 SD 图；HD 图可以在网页版用编辑器改，结果为 SD 分辨率。

## 步骤三：Zoom Out 与 Pan 快速扩图

- **Zoom Out**：点开图片，在 Creation Actions 里选 **1.5x** 或 **2x**；悬停 2x 按钮出现铅笔图标，可输入 1.0–2.0 之间的自定义值。它不会改变图片像素尺寸，只是让画面「往后退」、四周补上新内容。
- **Pan**：点方向箭头，朝一个方向扩展画布。
- **想同时改提示词**：点 **Editor** 按钮，在编辑器里拖动画布边缘或缩放图片。
- 找不到按钮：点 **More options**，勾选 Zoom Out / Pan。
- Discord 小技巧：**Custom Zoom** 把缩放设为 1、同时改 `--ar`，可以只改画幅不缩放；非方形图还会出现 **Make Square** 按钮。

![Zoom Out 示意：红框是原图位置，2x 与 1.5x 扩出的周边画面由模型补全（官方示例）](seed:g319-zoom-out.jpg)
*图片来源：[Midjourney 官方文档 · Zoom Out](https://docs.midjourney.com/hc/en-us/articles/32595476770957-Zoom-Out)*

## 常见问题

**Q：在 HD 图上局部重绘，为什么分辨率变低了？**
官方说明：在 HD 图上用 Pan、Zoom Out、Edit / Vary Region 等工具，结果会降为 SD；需要高分辨率时再用 Upscale 放大回去。

**Q：Vary Region 按钮在网页版哪里？**
网页版没有叫这个名字的按钮，同样的功能是编辑器里的 **Erase**（擦除）工具。

**Q：编辑过的图为什么在 Create 页找不到？**
V8.x 下用 Edit 模型在编辑器里生成的图会自动出现在 Create 和 Organize 页（未开隐身模式时其他人也能看到）；V7 及更早版本在编辑器里生成的图需要 Upscale 后才会出现，否则保存在编辑器里。

**Q：可以修改别人的照片吗？**
官方要求你对上传的图片拥有必要的权利，并禁止以侮辱、冒犯、色情化等方式篡改真实人物的图片。违规者可能被封号且不退款。

**Q：Omni Reference 生成的图能直接编辑吗？**
官方说明需要在 Edit 页打开，并去掉 Omni Reference 图和 `--ow` 参数后才能提交编辑。

## 参考资料

- Midjourney 官方文档：Editor — https://docs.midjourney.com/hc/en-us/articles/32764383466893-Editor
- Midjourney 官方文档：Vary Region — https://docs.midjourney.com/hc/en-us/articles/32794723105549-Vary-Region
- Midjourney 官方文档：Zoom Out — https://docs.midjourney.com/hc/en-us/articles/32595476770957-Zoom-Out
- Midjourney 官方文档：Pan — https://docs.midjourney.com/hc/en-us/articles/32570788043405-Pan
- Midjourney 官方文档：Edit Model — https://docs.midjourney.com/hc/en-us/articles/48495453462797-Edit-Model
- Midjourney 官方文档：Version — https://docs.midjourney.com/hc/en-us/articles/32199405667853-Version
