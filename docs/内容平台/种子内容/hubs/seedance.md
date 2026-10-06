---
slug: seedance
name: Seedance
kind: MODEL
updated: 2026-10-06
sources:
  - https://seed.bytedance.com/zh/seedance2_0
  - https://www.stdaily.com/web/gdxw/2026-02/12/content_473735.html
  - https://seed.bytedance.com/en/seedance2_5
  - https://seed.bytedance.com/en/blog/one-take-creation-flexible-referencing-introducing-seedance-2-5
  - https://jimeng.jianying.com/tools/seedance-2-5
  - https://www.volcengine.com/activity/seedance25
  - https://docs.volcengine.com/docs/ark/seedance-2-5?lang=zh
verify:
  - Seedance 2.5 的发布日期：官方博客标注 2026-07-31，另有报道称 2026-06-23 在火山引擎 FORCE 大会发布，以哪个为准需确认
  - 即梦、豆包里 Seedance 2.5 的免费试用积分和会员档位：即梦页面只说「提供免费试用积分」，具体数字未公开
  - 「网页 / 桌面端不支持上传真人人脸素材、手机端需真人校验」出自 2026-02 Seedance 2.0 发布报道，2.5 是否沿用需实测
  - 2.5 的分辨率：即梦工具页写 4K，Seed 官方博客未写明，以实际可选项为准
  - 火山方舟（国内）API 的 2.5 开放情况；Seed 博客写的是海外 BytePlus ModelArk「即将开放」
---
## Seedance 是什么

Seedance 是字节跳动 Seed 团队的视频生成模型。2026 年 2 月发布的 Seedance 2.0 采用音视频联合生成架构，可以同时输入文字、图片、视频和音频；Seed 官方博客 2026-07-31 介绍了新一代 Seedance 2.5。搜「seedance 提示词」的人，大多是想在即梦或豆包里用它做视频。

## 能做什么

| | Seedance 2.0 | Seedance 2.5 |
|---|---|---|
| 单次时长 | 最长 15 秒 | 最长 30 秒，可多轮延长 |
| 参考素材 | 图片、视频、音频、文字 | 最多 30 张图 + 10 段视频 + 10 段音频 |
| 声音 | 画面和声音一起生成 | 同左 |
| 编辑 | — | 可按时间点做局部修改 |

多模态参考的典型用法：用图片定角色和画风，用视频定动作和运镜，用音频定节奏和氛围。官方也坦言，复杂动作的物理合理性和多人互动场景的稳定性还有提升空间，所以多人打斗、复杂交互类镜头要多试几次。

## 怎么用

- **即梦**（jimeng.jianying.com 或 App）：进入视频生成，模型选 Seedance 2.5
- **豆包**：按官方博客，Seedance 2.5 已在豆包上线（需在视频生成里选择）
- **开发者 / 企业**：火山引擎火山方舟提供 API；海外通过 BytePlus ModelArk 接入

## 免费与付费的区别

即梦的 Seedance 2.5 页面写明提供免费试用积分，用完后再按需选择付费方案；每天送多少积分、各档会员差别，官方页面没有给出固定数字，以即梦里的实际显示为准。

## 本页的提示词怎么用

视频提示词建议按「主体 → 动作 → 镜头（景别、运镜）→ 光线氛围 → 声音」的顺序写，时长较长的就按时间分段描述。用到参考素材的条目，会注明每份素材起什么作用。涉及真人形象时，只用自己或已获授权的人像。
