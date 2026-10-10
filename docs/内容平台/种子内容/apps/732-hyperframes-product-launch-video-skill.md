---
title: "product-launch-video skill 是什么、怎么安装使用：给一个网址，让智能体做出产品发布视频（HyperFrames）"
slug: hyperframes-product-launch-video-skill
name: product-launch-video（heygen-com/hyperframes）
url: https://github.com/heygen-com/hyperframes/tree/main/skills/product-launch-video
pricing: "开源免费（Apache-2.0）；无按次渲染费用"
platforms: "Claude Code（插件）/ Codex / Cursor / Copilot / Gemini CLI 等"
trialNote: "`claude plugin marketplace add heygen-com/hyperframes` 然后 `claude plugin install hyperframes@hyperframes`"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, product-video, marketing]
excerpt: "product-launch-video 是 HyperFrames 的创作流程技能：从产品网址、粘贴的脚本或简报出发，抓取页面素材和品牌信息，定设计系统、写分镜与旁白、逐帧生成 HTML 画面并渲染成 MP4，关键节点等你确认。"
checkedOn: 2026-10-11
sources:
  - https://github.com/heygen-com/hyperframes/tree/main/skills/product-launch-video
  - https://github.com/heygen-com/hyperframes
  - https://skills.sh/
---

> 本文根据 heygen-com/hyperframes 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 42.3 万次；所在仓库 heygen-com/hyperframes 在 GitHub 约 6.0 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

HyperFrames 用 HTML 写视频，这个技能负责「产品宣传片」这一种片型的完整生产线。`description`：把产品或营销网址、粘贴的脚本或简报变成产品发布 / 宣传视频——SaaS 宣传、功能亮相、产品演示、应用和公司发布；用户想推广、发布或展示一个产品时使用，是任何商业网址的默认去向，网站导览也归它。

SKILL.md 把智能体设定为「总导演」，在 `videos/` 下的项目目录里按步骤推进，每步过了检查才能进下一步：

0. **准备**：读入口技能 `/hyperframes` 写好的 `BRIEF.md`，建项目；
1. **采集素材**：给了网址就运行 `npx hyperframes capture` 抓取页面截图、文字和品牌信号；给的是脚本就原样存下；
2. **设计系统**：从采集结果定颜色、字体和版式；
3. **分镜与脚本**：写 `STORYBOARD.md` 和旁白稿，这一步等你确认；
4. **音频**：后台生成旁白、逐词时间轴和背景音乐；
5. **画面设计与逐帧构建**：每一帧派一个子智能体去写 HTML；
6. **收尾**：加转场、跑检查、给你预览，批准后渲染成 MP4。

目录里有三十多个文件：剪辑手法目录、动效语言、叙事设计、视觉设计四份参考，以及组装、音频、字幕、逐帧打包等脚本。

## 怎么安装

`product-launch-video` 是 HyperFrames 技能包里的一个创作流程，不建议单独装：它要调用同包里的 CLI、动画、媒体等领域技能。Claude Code 用插件（命令来自仓库 README）：

```bash
claude plugin marketplace add heygen-com/hyperframes
claude plugin install hyperframes@hyperframes
```

其他智能体用 `npx skills add heygen-com/hyperframes`，README 说在选择器里只勾「Core Skills」一组即可，路由技能 `/hyperframes` 会在需要时把 `product-launch-video` 这类流程按需装上。渲染需要本机有 Node、Chrome 和 FFmpeg。

仓库整体介绍和其他安装方式，详见本站《HyperFrames 是什么、怎么安装使用：HeyGen 开源的「写 HTML、出视频」框架与 Agent Skills》。

## 怎么用

- 「给 https://example.com 做一支 30 秒的产品发布视频，竖版」。
- 「这是我们新功能的介绍文案，按原文做旁白，做成 45 秒的功能亮相片」。
- 「把官网做成一段网站导览，按页面原样展示，不要旁白」。

不确定该走哪条流程时直接说需求，由 `/hyperframes` 分流。

## 适合谁 / 局限

适合没有视频团队、想快速出一版发布视频的独立开发者和小公司。局限：画面来自网页截图加动态排版，不是实拍也不是文生视频；流程长、要派多个子智能体，耗时和用量都不低；成片仍然需要人把关节奏与文案。

## 注意事项

- **许可**：Apache-2.0。
- **会联网抓取你给的网址**，只对你有权使用的网站和素材这样做。
- **旁白与配乐**：默认走 HeyGen 的音频接口，需要 HeyGen 账号凭据（存在 `~/.heygen`），费用与条款以 HeyGen 官网为准；SKILL.md 提到也可以换成本地语音引擎 Kokoro，或在分镜里写 `music: none` 做无配乐版本。
- 技能开头会建议运行 `npx hyperframes skills update product-launch-video` 保持最新，执行前会先问你。
