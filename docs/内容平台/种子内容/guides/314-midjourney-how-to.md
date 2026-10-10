---
title: Midjourney 怎么用：网页版从登录到出图的完整流程
slug: midjourney-how-to
products: [ai-tools]
models: [midjourney]
accountTier: OTHER
excerpt: 第一次用 Midjourney 不知道从哪下手？本文按官方文档讲清网页版怎么登录、订阅、在 Imagine 栏写提示词出图，以及变体、放大、编辑、转视频和默认设置怎么调，附常见问题。
checkedOn: 2026-10-07
sources:
  - https://docs.midjourney.com/hc/en-us/articles/33329261836941-Getting-Started-Guide
  - https://docs.midjourney.com/hc/en-us/articles/33390732264589-Creating-on-Web
  - https://docs.midjourney.com/hc/en-us/articles/33390994570509-Logging-In-Connecting-Accounts
  - https://docs.midjourney.com/hc/en-us/articles/32023408776205-Prompt-Basics
  - https://docs.midjourney.com/hc/en-us/articles/32199405667853-Version
  - https://docs.midjourney.com/hc/en-us/articles/32502277092109-Text-Generation
  - https://docs.midjourney.com/hc/en-us/articles/27870399340173-Free-Trials
---

## 适用于谁

- 搜「Midjourney 怎么用」「Midjourney 网页版教学」，第一次打开 midjourney.com 不知道从哪开始的人；
- 以前在 Discord 里用过，想换到网页版的老用户；
- 想先弄清整体流程，再去研究参数、风格参考、编辑器等进阶功能的人。

本文根据 Midjourney 官方文档整理，资料核对于 2026-10-07；Midjourney 网页版只有英文界面，按钮名以你实际看到的为准。

## 结论先说

1. **现在首选网页版**：在 midjourney.com 用 Google 或 Discord 账号登录，Discord 不再是必需的。
2. **必须先订阅**：官方说明网页版和 Discord 目前都没有免费试用（只有 niji·journey 手机 App 有有限试用），详见本站《Midjourney 免费吗》。
3. **出图就三步**：打开 Create 页 → 在顶部 Imagine 栏写英文描述 → 回车，一次出 4 张。之后用变体、放大、编辑、转视频继续加工。
4. **当前默认模型是 V8.2**（2026 年 7 月 24 日起），新的 Edit 模型取代了以前的 Omni Reference / Character Reference / Retexture。

## 步骤

### 1. 登录与订阅

打开 midjourney.com，点 **Sign Up**，选择 **Continue with Google** 或 **Continue with Discord**。官方目前不支持单独的 Midjourney 用户名和密码，只能用这两种方式之一登录；之后可以在账号设置里再绑定另一种方式。

> 老用户注意：如果你 2024 年 8 月之前在 Discord 里用过（哪怕只是试用），官方建议**先用 Discord 登录**，才能找回以前的作品；先用 Google 登录并新开订阅的话，之后就无法再关联有历史作品的 Discord 账号。

登录后进入 **Manage Subscription** 页面选择套餐并完成付款。各套餐的区别以官方《Comparing Midjourney Plans》页面为准。

### 2. 在 Create 页写提示词出图

进入左侧的 **Create** 页，顶部输入框就是 **Imagine 栏**（占位文字是「What will you imagine?」）。输入描述、按回车，Midjourney 会一次生成 4 张图，进度到 100% 就完成了。

![Midjourney 网页版 Create 页：顶部是 Imagine 栏，下面是创作流，鼠标悬停在图上会出现 Vary Subtle / Vary Strong / Animate 快捷按钮（英文界面）](seed:g314-create-page-feed.jpg)
*图片来源：[Midjourney 官方文档 · Creating on Web](https://docs.midjourney.com/hc/en-us/articles/33390732264589-Creating-on-Web)*

官方给的写法建议，概括下来是：

- **短而具体**：用一句清楚的描述代替一长串指令。比如「Colored pencil illustration of bright orange California poppies」比「请给我画很多花，要亮橙色，用彩铅风格……」效果更好。
- **想清楚关键细节**：主体（Subject）、媒介（Medium，照片 / 油画 / 插画）、环境（Environment）、光线（Lighting）、色彩（Color）、情绪（Mood）、构图（Composition）。没写的部分会由默认风格补全。
- **写数量**：用「three cats」代替「cats」。
- **说要什么，不说不要什么**：写「no cake」反而可能出现蛋糕；要排除元素用 `--no` 参数。
- **想让图里出现文字**：把文字放进英文双引号，比如 `a poster with the words "Open Daily"`。官方说明拉丁字母效果最好、短词更稳，中文文字不在官方的推荐范围内。

小技巧：按 **Ctrl + Enter**（Mac 上 Cmd + Enter）提交，提示词会留在输入框里，方便改一个词再跑一次。

### 3. 用自己的图片：图片面板的四种用法

点 Imagine 栏左侧的图片图标会打开图片面板，可以上传新图（单张上限 10MB）或从已上传的图库里选。把图拖进不同的格子，作用完全不同：

![点开图片面板后的 Imagine 栏：Attach to prompt（Edit 模型参考）、Style reference（风格参考）、Image Prompts（图片提示）、Animate（转视频）四个格子（英文界面）](seed:g314-image-panel.jpg)
*图片来源：[Midjourney 官方文档 · Creating on Web](https://docs.midjourney.com/hc/en-us/articles/33390732264589-Creating-on-Web)*

| 格子 | 作用 | 详细教程 |
| --- | --- | --- |
| Attach to prompt | 交给 Edit 模型：按文字指令改图、保持角色 / 物体一致，最多 4 张参考图 | 《Midjourney 角色一致性》 |
| Style reference | 只借用画风、色彩、质感，不复制内容 | 《Midjourney 风格参考 sref 怎么用》 |
| Image Prompts | 参考图片的内容、构图和颜色 | — |
| Animate | 把图片当首帧生成 5 秒视频 | 《Midjourney 视频怎么生成》 |

面板里的锁形图标可以把选中的图固定在 Imagine 栏，连续换提示词时不用重复拖。

### 4. 继续加工：变体、放大、编辑、转视频

点开任意一张图，右侧的 **Creation Actions** 区域就是后续操作：

- **Vary Subtle / Vary Strong**：在这张图基础上做小幅 / 大幅变化；
- **Upscale Subtle / Creative**：放大到 2 倍尺寸，Subtle 尽量保持原样，Creative 会补新细节（见《AI图片放大与高清修复》）；
- **Edit / Quick Edit**：进编辑器局部重绘、扩图，或直接用文字指令改图（见《Midjourney 局部重绘和扩图怎么用》）；
- **Animate**：转成视频。

找不到某个按钮时，点 **More options**，把对应功能勾选出来即可。

### 5. 调默认设置

点 Imagine 栏右侧的设置图标（三条横线滑块），可以改所有后续提示词的默认值：

![Imagine 栏的设置面板：Aspect Ratio、Model（SD/HD、版本号、Raw）、Aesthetics（Stylization / Weirdness / Variety）、More Options（速度、Stealth、视频分辨率与批量）（英文界面）](seed:g314-settings-panel.jpg)
*图片来源：[Midjourney 官方文档 · Getting Started Guide](https://docs.midjourney.com/hc/en-us/articles/33329261836941-Getting-Started-Guide)*

- **Aspect Ratio**：默认画幅（竖版 / 方形 / 横版）；
- **Model**：SD 或 HD（V8.1 起可直接出 2048px 的 HD 图）、默认版本、Raw 开关；
- **Aesthetics**：风格化、怪异度、多样性三个滑块，对应 `--s`、`--w`、`--c` 参数；
- **More Options**：Fast / Relax 速度、Stealth 隐身模式（仅 Pro、Mega 套餐）、视频分辨率和每次生成几条视频。

这些设置也都能用参数写在提示词末尾，参数优先。完整列表见《Midjourney 参数大全》。

### 6. 整理和下载

左侧 **Organize** 页能看到全部作品，可以筛选、建文件夹、批量下载。单张图点开后右上角也有下载按钮。

## 常见问题

**Q：Midjourney 能设置成中文界面吗？能用中文写提示词吗？**
官方网页版只有英文界面，文档里也没有提供中文界面选项。提示词方面，官方文档的示例和建议都是英文；建议用英文描述主体和风格，需要中文时可以先用 ChatGPT 等工具把中文想法翻译成简洁的英文短句。

**Q：还需要装 Discord 吗？**
不需要。官方说明每个套餐都可以同时使用网页版和 Discord，网页版功能更完整（编辑器、图层、风格探索等）。

**Q：上传图片失败怎么办？**
先检查格式（png、gif、webp、jpg、jpeg）和大小（单张不超过 10MB）。另外官方说明：用外部图片时你必须拥有相应权利，涉及真人的图片不得被用于侮辱、色情化等用途，审核可能会拦下看起来正常的请求——被拦的任务不扣 GPU 时间。

**Q：我的图别人能看到吗？**
默认会公开显示在 midjourney.com 上并可被他人参考。想保持私密需要 Pro 或 Mega 套餐的 Stealth 模式，详见《Midjourney 可以商用吗》。

**Q：一次只能出 4 张吗？**
默认一次 4 张；可以用 `--repeat`（`--r`）一次提交多组，各套餐允许的最大数量不同。

## 参考资料

- Midjourney 官方文档：Getting Started Guide — https://docs.midjourney.com/hc/en-us/articles/33329261836941-Getting-Started-Guide
- Midjourney 官方文档：Creating on Web — https://docs.midjourney.com/hc/en-us/articles/33390732264589-Creating-on-Web
- Midjourney 官方文档：Logging In & Connecting Accounts — https://docs.midjourney.com/hc/en-us/articles/33390994570509-Logging-In-Connecting-Accounts
- Midjourney 官方文档：Prompt Basics — https://docs.midjourney.com/hc/en-us/articles/32023408776205-Prompt-Basics
- Midjourney 官方文档：Version — https://docs.midjourney.com/hc/en-us/articles/32199405667853-Version
- Midjourney 官方文档：Text Generation — https://docs.midjourney.com/hc/en-us/articles/32502277092109-Text-Generation
- Midjourney 官方文档：Free Trials — https://docs.midjourney.com/hc/en-us/articles/27870399340173-Free-Trials
