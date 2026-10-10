---
title: "music-to-video skill 是什么、怎么安装使用：让画面卡着节拍走的音乐视频流程（HyperFrames）"
slug: hyperframes-music-to-video-skill
name: music-to-video（heygen-com/hyperframes）
url: https://github.com/heygen-com/hyperframes/tree/main/skills/music-to-video
pricing: "开源免费（Apache-2.0）；无按次渲染费用"
platforms: "Claude Code（插件）/ Codex / Cursor / Copilot / Gemini CLI 等"
trialNote: "`claude plugin marketplace add heygen-com/hyperframes` 然后 `claude plugin install hyperframes@hyperframes`"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, motion-graphics, video-script]
excerpt: "music-to-video 是 HyperFrames 的创作流程技能：以一段音乐为主线，先用脚本分析节拍和能量变化，再按节拍网格排帧，做成歌词视频、照片幻灯或动感宣传片；没有任何素材也能只靠文字动效成片。"
checkedOn: 2026-10-11
sources:
  - https://github.com/heygen-com/hyperframes/tree/main/skills/music-to-video
  - https://github.com/heygen-com/hyperframes
  - https://skills.sh/
---

> 本文根据 heygen-com/hyperframes 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 33.9 万次；所在仓库 heygen-com/hyperframes 在 GitHub 约 6.0 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

卡点视频的难处在于画面切换要落在节拍上，手工对齐很费时间。music-to-video 让音乐来决定一切节奏。`description`：把一段音乐（音频文件、要提取音轨的视频，或按情绪描述生成的曲子）变成与节拍同步的视频——歌词视频、幻灯片或动感宣传片；音乐驱动所有节奏，用户提供的图片和视频都剪到同一套节拍网格上，完整的视频可以零素材。带旁白的片子不归它。

SKILL.md 开头讲了贯穿全程的两个想法，第一个是「只有一个分析器，并且信任它」：`analyze-beatgrid.py` 是唯一的节拍分析工具，不许再用别的工具或凭感觉重新量节拍。它读一遍曲子，写出 `audiomap.json`：能量段落、起音点、鼓点滚奏、静音段、硬停顿、关键时刻、乐句、速度与网格、总时长。

步骤：

0. 确定音乐来源、建项目、登记你提供的图片和视频；
1. 分析音乐；
2. 搭帧骨架——只定结构；
3. 填写逐帧计划，等你确认；
4. 按计划构建，每帧派一个子智能体；
5. 组装；
6. 检查并渲染，渲染前再问你一次。

技能说明它为快节奏、强节拍的配乐做过调校，舒缓的曲子也能用，只是按乐句而不是按拍切。目录里有一百六十多个文件，大部分是「动效基元」的示例场景（3D 卡片翻转、流场背景等），供各帧取用。

## 怎么安装

`music-to-video` 是 HyperFrames 技能包里的一个创作流程，不建议单独装：它要调用同包里的 CLI、动画、媒体等领域技能。Claude Code 用插件（命令来自仓库 README）：

```bash
claude plugin marketplace add heygen-com/hyperframes
claude plugin install hyperframes@hyperframes
```

其他智能体用 `npx skills add heygen-com/hyperframes`，README 说在选择器里只勾「Core Skills」一组即可，路由技能 `/hyperframes` 会在需要时把 `music-to-video` 这类流程按需装上。渲染需要本机有 Node、Chrome 和 FFmpeg。

仓库整体介绍和其他安装方式，详见本站《HyperFrames 是什么、怎么安装使用：HeyGen 开源的「写 HTML、出视频」框架与 Agent Skills》。

## 怎么用

- 「用这首 `track.mp3` 做一支 20 秒的卡点宣传片，文字用我们的三句口号」。
- 「把这 12 张活动照片配上这段音乐做成幻灯片，切换踩在重拍上」。
- 「给这首歌做歌词视频」——需要提供歌词文本，或让它调用同包的 `media-use` 转写。

## 适合谁 / 局限

适合做活动回顾、产品预热短片、歌词视频的人。局限：没有旁白，信息量靠画面上的字；节拍分析依赖 Python 环境，需要 `librosa`、`numpy`、`soundfile` 三个库；曲子节奏不明显时卡点效果会打折扣。

## 注意事项

- **许可**：Apache-2.0。
- **音乐版权**：用自己的曲子或有授权的音乐；让它按情绪找配乐时走的是 HeyGen 的音乐库，需要登录凭据，授权范围以 HeyGen 的条款为准。SKILL.md 要求不把密钥写进仓库里的 `.env`。
- **会运行脚本**：Python 分析脚本和若干 Node 脚本在本机执行；渲染需要 Node、Chrome 和 FFmpeg。
