---
title: "Luma AI 是什么、怎么用：Dream Machine 与 Ray3 视频生成上手指南"
slug: luma-ai-ray-video-agents
name: Luma AI（Dream Machine / Ray）
url: https://lumalabs.ai/
pricing: 免费试用+付费（Plus / Pro / Ultra）
platforms: 网页 / iOS / API
trialNote: 官网提供免费试用；官方授权说明称免费生成仅限个人非商用且带水印
products: [ai-tools]
models: []
topics: [cinematic, image-to-video]
excerpt: "Luma AI 是 Luma AI 公司的创意平台，原 Dream Machine 已升级为以 Luma Agents 为核心的新应用，自研 Ray3.2 视频模型支持 HDR 和关键帧控制，也能调用 Kling、Seedance、Veo 等模型。"
checkedOn: 2026-10-07
sources:
  - https://lumalabs.ai/
  - https://lumalabs.ai/pricing
  - https://lumalabs.ai/learning-hub/licensing
  - https://lumalabs.ai/learning-hub/frequently-asked-questions-about-the-new-luma-agents-app
  - https://apps.apple.com/us/app/luma-dream-machine/id6478852867
---

> 本文根据 Luma 官网、定价页、官方学习中心（Learning Hub）和 App Store 介绍整理，资料核对于 2026-10-07。功能和价格变化快，以官网为准。

## 是什么

Luma AI 是 **Luma AI, Inc.**（App Store 开发者名）推出的 AI 创作平台，早期的 AI 视频生成工具叫 **Dream Machine**，很多人仍习惯把它的视频产品叫作「Luma Dream Machine」。

现在 Luma 把产品重心放到 **Luma Agents**（官方学习中心 2026 年 3 月发布了新版 Luma Agents 应用的 FAQ）：多模态创意 Agent 能根据一份需求简报规划任务、调用自研和第三方模型生成视频、图片、音频和文字，再反复修改。App Store 里「Luma Dream Machine」的更新说明也写着 Dream Machine 的功能现在都在 Luma 里。自研模型方面，当前主力视频模型是 **Ray3.2**（官网新闻 2026 年 6 月 9 日发布模型与 API，主打像导演拍摄一样控制每一帧、保持镜头间连贯），上一代 Ray3.14 仍可用；另有 **Uni-1** 模型（官网介绍它能深入理解品牌风格，并结合风格与角色参考来生成）。

## 能做什么

- **文生视频 / 图生视频**：用 Ray3.2 或 Ray3.14 生成电影感镜头，可选草稿、540p、720p、1080p 等档位。
- **HDR 输出**：Ray 系列支持 SDR、HDR，以及带 EXR 的 HDR 输出，方便进专业调色流程。
- **延长视频**：把已有片段继续往后生成（定价页列有 Extend Video）。
- **视频到视频 / Reframe**：对已有视频重新风格化、修改，或改画幅适配横竖屏。
- **Luma Agents**：一句需求让 Agent 完成从构思、生成到修改的整套流程，Brainstorm 模式找方向，Create 模式出成品。
- **多模型调用**：同一账户可用 Kling 3.0、Seedance 2.5、Veo 3.1、MiniMax H3 等第三方视频模型，以及对口型模型。
- **协作**：共享画布，可邀请访客协作编辑。

## 怎么上手

1. 打开 lumalabs.ai 点 Try for free 进入 app.lumalabs.ai，或在 App Store 下载 Luma 官方 App，注册登录。
2. 先用对话方式告诉 Agent 你要做什么，例如一条 15 秒的产品短片，让它给出分镜方案。
3. 选定某个镜头后，手动指定 Ray3.2 模型，先用 Draft（草稿）档快速出样，省积分。
4. 效果满意再切到 720p 或 1080p 正式生成，需要进后期调色时选择 HDR 输出。
5. 导出前在定价页确认你的套餐是否包含商用权。

可以这样开始：

```
帮我做一条 15 秒的香水广告：开头特写玻璃瓶在水面上旋转，中段花瓣慢慢落下，结尾品牌名留白；整体冷色调、慢镜头。先给我 3 个分镜方案。
```

## 免费与付费

官网定价页（2026-10 查询，按月付费价）：

| 套餐 | 月价 | 每月积分 | 说明 |
| --- | --- | --- | --- |
| Plus | 30 美元 | 10,000 | Luma 与第三方模型、访客协作、可商用 |
| Pro | 90 美元 | 40,000 | 在 Plus 基础上，Luma Agents 用量 4 倍 |
| Ultra | 300 美元 | 150,000 | Luma Agents 用量 15 倍 |
| Team / Enterprise | 联系销售 | 共享积分 | 成员管理、SSO、定制微调等 |

（官网定价页，2026-10 查询；年付最多省约 20%。）每次生成按模型、分辨率和时长扣积分，定价页列有每个模型的扣分表。官网有「免费试用」入口，具体免费额度以页面显示为准。

## 适合谁 / 不适合谁

**适合：**
- 影视、广告从业者，需要 HDR / EXR 输出和关键帧控制进入后期流程。
- 想让 Agent 帮忙拆解创意、批量出方案的创意团队。
- 想在一个平台里对比多家顶级视频模型的用户。

**不适合：**
- 只想免费做几条短视频的普通用户，付费档起步价偏高。
- 不习惯英文界面和英文沟通的人。
- 只需要简单剪辑、加字幕的用户：Luma 偏生成和创意方案，普通剪辑用剪映这类工具更直接。

## 注意事项

- **免费内容不可商用**：官方授权说明称免费（及旧的 Lite）套餐生成的内容仅限个人非商业用途、带永久水印，之后升级也不能去掉；需要商用应在付费套餐期间重新生成。
- **退订后的权利**：官方说明在付费期间生成内容获得的商用权会永久保留，之后套餐变化不影响这些作品。
- **数据使用**：官方授权说明称，免费（及 Lite）套餐的生成内容 Luma 可公开展示，并可用于改进服务和训练模型；付费套餐的内容只用于提供服务，Luma 不会公开展示。介意的话不要在免费档上传敏感素材。
- **真人肖像**：不要上传他人照片制作冒充本人或公众人物的视频，只使用自己拥有权利的素材。
- **积分换算**：HDR、1080p 和第三方高端模型扣分倍数高，正式生成前看清扣分表。
- **服务地区与支付**：以官网公布的支持地区和支付方式为准；发布到国内平台时按规定标注 AI 生成。
