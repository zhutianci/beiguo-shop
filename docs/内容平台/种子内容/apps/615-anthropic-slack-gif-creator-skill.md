---
title: "slack-gif-creator 是什么、怎么使用：Anthropic 官方的 Slack 动图 Skill（做表情 GIF，自动控制尺寸和体积）"
slug: anthropic-slack-gif-creator-skill
name: slack-gif-creator（anthropics/skills）
url: https://github.com/anthropics/skills/tree/main/skills/slack-gif-creator
pricing: "免费（Apache-2.0，见技能目录内 LICENSE.txt）"
platforms: "Claude Code / claude.ai / Claude API"
trialNote: "`/plugin marketplace add anthropics/skills` 然后 `/plugin install example-skills@anthropic-agent-skills`"
products: [claude]
models: [claude-llm]
topics: [agent-skills, sticker]
excerpt: "slack-gif-creator 是 anthropics/skills 里做 Slack 动图的 Skill：提供 GIF 构建器、校验器、缓动函数等 Python 工具，按 Slack 的尺寸与体积要求生成表情和消息动图。"
checkedOn: 2026-10-11
sources:
  - https://github.com/anthropics/skills/tree/main/skills/slack-gif-creator
  - https://github.com/anthropics/skills
  - https://github.com/anthropics/skills/blob/main/.claude-plugin/marketplace.json
  - https://code.claude.com/docs/en/skills
---

> 本文根据 anthropics/skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 7.2 万次；所在仓库 anthropics/skills 在 GitHub 约 18.0 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

想给团队的 Slack 做个自定义表情动图，手工做要开动画软件，还得反复压缩到平台接受的大小。slack-gif-creator 让 Claude 用 Python 直接画出来。按 `description`，它提供制作 Slack 动图所需的知识和工具——约束条件、校验工具和动画概念，用户说「帮我做一个 X 在做 Y 的 Slack GIF」这类话时使用。

技能先交代了 Slack 的要求：表情 GIF 推荐 128×128，消息 GIF 用 480×480；帧率 10 到 30，颜色数 48 到 128，越少文件越小；表情动图时长控制在 3 秒以内。然后是工作方式：用 PIL（Pillow）的绘图基元一帧一帧画，交给目录里的 `GIFBuilder` 合成并优化；用户上传了图片时，先判断是要直接拿来做动画，还是只当参考。说明里列了常用的动画概念——抖动、脉冲、弹跳、旋转、淡入淡出、滑动、缩放、粒子爆散——以及让图形更好看的建议（线条加粗、增加层次、注意配色对比），并提醒不要依赖表情符号字体，因为各平台渲染不一致。

## 怎么安装

`slack-gif-creator` 收在 anthropics/skills 仓库的 example-skills 插件包里。在 Claude Code 会话中依次输入（命令来自仓库 README）：

```text
/plugin marketplace add anthropics/skills
/plugin install example-skills@anthropic-agent-skills
```

同一个包里的其他示例技能会一起装上。只想要这一个，可以把仓库里的 `skills/slack-gif-creator` 文件夹复制到 `~/.claude/skills/`（个人）或项目的 `.claude/skills/`；claude.ai 网页版则在 Customize → Skills 里上传这个文件夹的 ZIP。

仓库整体介绍和其他安装方式，详见本站《anthropics/skills 是什么、怎么安装：Anthropic 官方 Skills 仓库（docx / pptx / xlsx / pdf、skill-creator）》。

## 怎么用

- 「做一个火箭升空的 Slack 表情 GIF，128×128，循环播放」。
- 「把我上传的这个 Logo 做成轻轻弹跳的动图」。
- 「文件太大了，压到 Slack 能当表情用的大小」——它会用校验器检查尺寸与体积，再降低颜色数或帧率。

`core/` 目录有四个模块：`gif_builder`（合成与优化）、`validators`（是否符合 Slack 要求）、`easing`（缓动函数）、`frame_composer`（画帧的辅助函数），另有 `requirements.txt`。

## 适合谁 / 局限

适合想给团队做专属表情、庆祝动图的人，不需要会动画软件。它画的是程序生成的几何图形和简单图案，风格偏扁平、卡通；做不出手绘质感或真实影像，也不是把视频转成 GIF 的工具。128 像素的画布很小，细节太多的创意要先简化。

## 注意事项

- **许可**：技能目录内的 LICENSE.txt 为 Apache-2.0。
- **依赖**：需要 Python 以及 `requirements.txt` 里的库，在能执行代码的环境里使用。
- **素材版权**：用别人的图片、公司 Logo 或卡通形象做动图前，确认有使用权。
- 不只限于 Slack：其他聊天工具的表情动图有各自的尺寸限制，告诉它目标规格即可。
