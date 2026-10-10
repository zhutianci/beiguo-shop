---
title: "remotion-captions 是什么、怎么安装使用：给 Remotion 视频自动转写、显示和导入字幕的官方 Skill"
slug: remotion-captions-skill
name: remotion-captions（remotion-dev/skills）
url: https://github.com/remotion-dev/skills/tree/main/skills/remotion-captions
pricing: "免费（技能仓库未声明许可证）"
platforms: "Claude Code / Codex / Kimi Code / Cursor"
trialNote: "npx skills add remotion-dev/skills"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, motion-graphics, coding]
excerpt: "remotion-captions 是 Remotion 官方的字幕 Skill：规定字幕统一用 JSON 的 Caption 类型处理，并分别给出本地 Whisper 转写、在视频里显示与做动画、导入 SRT 字幕三套做法。"
checkedOn: 2026-10-11
sources:
  - https://github.com/remotion-dev/skills/tree/main/skills/remotion-captions
  - https://github.com/remotion-dev/skills
  - https://www.remotion.dev/docs/ai/skills
---

> 本文根据 remotion-dev/skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 14.2 万次；所在仓库 remotion-dev/skills 在 GitHub 约 5003 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

短视频几乎都要字幕，而且常常是逐词高亮、带弹跳动画的那种。在 Remotion 里做这件事涉及三步：把语音转成带时间戳的文字、在画面上按时间显示、处理已有的字幕文件。remotion-captions 把三步各写成了一份指引。`description`：转写、显示字幕并为其做动画。

总规则只有一条：**所有字幕都以 JSON 处理**，并且必须使用 Remotion 定义的 `Caption` 类型——每条字幕包含文字和起止时间等字段。统一成这个格式之后，转写的输出、显示组件的输入、从 SRT 导入的结果都能互通。

然后是三个分支，各对应一份按需加载的文件：

- **生成字幕**：用 Remotion 的 Whisper WebGPU 包在本机 GPU 上跑 Whisper 转写，既能在 Node.js 里也能在浏览器里运行；需要先安装几个依赖包，并且要有兼容的 GPU，文件里注明某些平台（如 Linux arm64）不支持；
- **显示字幕**：怎样按时间把字幕渲染到画面上并做动画；
- **导入字幕**：把现成的 SRT 文件转成 `Caption` 格式。

## 怎么安装

仓库 README 给的安装命令是：

```bash
npx skills add remotion-dev/skills
```

在选择界面里勾选需要的技能。`remotion-best-practices` 是总入口，目录里已经带着其余各主题的参考文件，多数情况下只装它就够；想单独装 `remotion-captions`，可加 skills CLI 的 `--skill remotion-captions` 参数。

仓库整体介绍和其他安装方式，详见本站《remotion-dev/skills 是什么、怎么安装：Remotion 官方 Agent Skills，用 Claude Code / Codex 写 React 视频》。

## 怎么用

- 「把 `public/interview.mp4` 的语音转写成字幕，存成 JSON」。
- 「在画面底部显示字幕，当前说到的词高亮成黄色」。
- 「我有一个现成的 `subs.srt`，导入进来替换自动转写的结果」。

## 适合谁 / 局限

适合用 Remotion 做口播、访谈、教程类视频的人。本地转写的准确度和速度取决于所选的 Whisper 模型与显卡，中文口音重或专业术语多时需要人工校对；没有合适 GPU 的机器走不通本地转写这条路，可以改为导入外部工具生成的 SRT。

## 注意事项

- **许可**：技能仓库未声明许可证；Remotion 框架的商用许可以其官网为准。
- **会下载模型并执行脚本**：首次转写要下载 Whisper 模型文件，体积不小。
- **隐私**：转写在本机完成，音频不必上传到第三方服务，适合处理不便外传的素材。
- 通常不需要单独安装：总入口技能 `remotion-best-practices` 的目录里已包含这部分内容。
