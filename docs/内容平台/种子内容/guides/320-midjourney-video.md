---
title: Midjourney 视频怎么生成：图生视频、动态强度、首尾帧与延长
slug: midjourney-video
products: [ai-tools]
models: [midjourney]
accountTier: OTHER
excerpt: Midjourney 可以生成视频吗？可以，它是「图生视频」：拿一张图当首帧生成 5 秒视频，最长可延长到 21 秒。本文按官方文档讲清网页版操作、Low/High Motion、循环与结束帧、分辨率、批量和下载方式。
checkedOn: 2026-10-07
sources:
  - https://docs.midjourney.com/hc/en-us/articles/37460773864589-Video
  - https://docs.midjourney.com/hc/en-us/articles/27870484040333-Comparing-Midjourney-Plans
  - https://docs.midjourney.com/hc/en-us/articles/32016412137741-GPU-Speed-Fast-Relax-Turbo
  - https://docs.midjourney.com/hc/en-us/articles/32859204029709-Parameter-List
---

## 适用于谁

- 搜「Midjourney 可以生成视频吗」「Midjourney 怎么生成视频」「Midjourney 图生视频」的人；
- 已经用 Midjourney 出了满意的图，想让它动起来做短视频、动态海报、循环背景的人。

本文根据 Midjourney 官方文档整理，资料核对于 2026-10-07；英文界面，按钮名以实际为准。

## 结论先说

1. **Midjourney 的视频是图生视频**：一张图做首帧，加可选的文字提示，生成 **5 秒**视频；之后每次延长 4 秒，最多延长 4 次，**最长 21 秒**。
2. **入口**：点开任意一张作品，用 **Animate Image** 下的 Auto / Loop 按钮；或者把自己的图拖进 Imagine 栏的 **Animate** 格子。
3. **两个关键开关**：动态强度（Low Motion 默认 / High Motion）和结束帧（Loop 循环 / 指定另一张图）。
4. **分辨率**：默认 480p（SD）；Standard、Pro、Mega 套餐可在 Fast 模式下出 720p（HD）。只有 Pro、Mega 能用 Relax 模式生成视频（仅 SD）。

## 步骤

### 1. 用 Midjourney 作品生成视频

在 Create 页点开一张图（任何版本生成的都可以），Creation Actions 下方有 **Animate Image**：

- **Auto**：直接用这张图开始生成；
- **Loop**：生成首尾相同的循环视频；
- 每行都分 **Low Motion** 和 **High Motion**；
- **Animate Manually**：先把图放进 Imagine 栏，让你改提示词再生成。

在 Create 页悬停图片时也有 Animate 快捷按钮。注意：原图使用的图片参数在生成视频时会被自动去掉。

![Animate Image 按钮组：Auto 与 Loop 两行，各有 Low Motion 和 High Motion，右上角是 Animate Manually（英文界面）](seed:g320-animate-buttons.jpg)
*图片来源：[Midjourney 官方文档 · Video](https://docs.midjourney.com/hc/en-us/articles/37460773864589-Video)*

### 2. 用自己的图片生成视频

点 Imagine 栏的图片图标，把图拖进 **Animate** 格子，写上动作描述（可选）后提交。官方要求你对上传的图片拥有必要权利，并禁止以侮辱、色情化等方式处理真实人物的图片；审核可能拦下看似正常的请求，被拦的任务不扣 GPU 时间。

Discord 里：把图片网址放在提示词开头，末尾加 `--video`。

### 3. 设置动态强度

- **Low Motion（默认）**：更可能是静态场景、轻微运镜、慢动作或细微的角色动作；
- **High Motion**：更大的镜头运动和角色动作，但官方提醒也更容易出现不真实或「抽搐」的动作。

对应参数 `--motion low` / `--motion high`。想让提示词对动作的控制更强，可以加 `--raw`，减少 Midjourney 自带的「创意发挥」。

### 4. 循环与结束帧

把图放进 Starting Frame 后，Imagine 栏会多出 **Ending Frame** 区域：

- 勾选 **Loop**：结束帧 = 开始帧，生成循环视频；
- 放入另一张图：视频会从首帧过渡到这张图。

参数写法：`--loop`，或 `--end` 后接结束帧图片网址。

![视频模式的 Imagine 栏：Starting Frame（首帧）、Ending Frame（结束帧，可勾选 Loop）和 Motion（Low / High）（英文界面）](seed:g320-loop-end-frame.jpg)
*图片来源：[Midjourney 官方文档 · Video](https://docs.midjourney.com/hc/en-us/articles/37460773864589-Video)*

### 5. 延长视频

生成完成后，悬停视频或点开它，会看到：

- **Extend Auto**：用原提示词自动续 4 秒；
- **Extend Manual**：先改提示词再续，可以加入新的动作或元素。

最多续 4 次，总长 21 秒；每次延长消耗的 GPU 时间与初次生成相同。

### 6. 控制批量，节省 GPU 时间

默认每次生成 4 条视频。用 `--bs 1`、`--bs 2` 或 `--bs 4` 改数量，也可以在设置面板 More Options 里设默认的 Video Batch Size。按官方表格，SD 视频 4 条约 8 分钟 GPU 时间、2 条约 4 分钟、1 条约 2 分钟；HD 分别约 26、13、7 分钟。

### 7. 分辨率和尺寸

视频的形状跟随首帧图片的比例，个别比例会被微调。官方给的例子：

| 首帧比例 | SD 尺寸 | HD 尺寸 |
| --- | --- | --- |
| 1:1 | 624×624 | 960×960 |
| 2:3 | 512×768 | 784×1168 |
| 16:9 | 832×464 | 1280×720 |
| 1:2 | 448×880 | 672×1360 |

HD 需要在设置面板的 Video Resolution 里切换，且只能在 Fast 模式下生成。

### 8. 播放与下载

在 Create 页悬停即可播放；按住 Ctrl（Mac 上 Cmd）左右移动鼠标可以手动拖动进度。右键视频有三个下载选项：

- **Download for Social**：为社交平台优化编码的 mp4，上传后压缩损失更小；
- **Download Raw Video**：原始 mp4；
- **Download Gif**：动图。

## 写视频提示词的建议

Midjourney 视频的提示词是可选的，但写清楚「谁在做什么、镜头怎么动」更可控：

```
the girl slowly turns her head toward the window, curtains moving in the breeze, gentle camera push-in
```

- 一条视频只写一到两个主要动作；
- 动作幅度大时用 High Motion，想稳就用 Low Motion + `--raw`；
- 镜头语言的写法可以参考《AI视频运镜提示词》。

## 常见问题

**Q：Midjourney 能直接文字生成视频吗？**
按官方文档，视频需要一张首帧图片，文字提示是可选的补充。可以先用文字出图，再把图转视频。

**Q：视频能加声音吗？**
官方视频文档没有提到音频生成，下载的是视频文件，配乐需要自己在剪辑软件里加。

**Q：为什么我的视频只能是 480p？**
Basic 套餐只支持 SD；Standard 及以上套餐可在设置面板的 Video Resolution 里切到 HD，并且需要用 Fast 模式。

**Q：视频生成能用风格参考、Edit 模型吗？**
不能。官方说明视频只兼容 `--motion`、`--raw`、`--loop`、`--end`、`--bs` 这几个视频专用参数，Edit 模型参考、风格参考、图片提示都不适用于视频生成。

## 参考资料

- Midjourney 官方文档：Video — https://docs.midjourney.com/hc/en-us/articles/37460773864589-Video
- Midjourney 官方文档：Comparing Midjourney Plans — https://docs.midjourney.com/hc/en-us/articles/27870484040333-Comparing-Midjourney-Plans
- Midjourney 官方文档：GPU Speed — https://docs.midjourney.com/hc/en-us/articles/32016412137741-GPU-Speed-Fast-Relax-Turbo
- Midjourney 官方文档：Parameter List — https://docs.midjourney.com/hc/en-us/articles/32859204029709-Parameter-List
