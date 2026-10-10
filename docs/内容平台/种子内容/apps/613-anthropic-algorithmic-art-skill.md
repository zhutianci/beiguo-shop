---
title: "algorithmic-art skill 是什么、怎么使用：Anthropic 官方的 p5.js 生成艺术 Skill（可调参数、可复现的随机种子）"
slug: anthropic-algorithmic-art-skill
name: algorithmic-art（anthropics/skills）
url: https://github.com/anthropics/skills/tree/main/skills/algorithmic-art
pricing: "免费（Apache-2.0，见技能目录内 LICENSE.txt）"
platforms: "Claude Code / claude.ai / Claude API"
trialNote: "`/plugin marketplace add anthropics/skills` 然后 `/plugin install example-skills@anthropic-agent-skills`"
products: [claude]
models: [claude-llm]
topics: [agent-skills, illustration, coding]
excerpt: "algorithmic-art 是 anthropics/skills 里的生成艺术 Skill：先写一份「算法哲学」，再用 p5.js 实现成带随机种子和参数面板的交互作品，适合流场、粒子系统这类代码艺术。"
checkedOn: 2026-10-11
sources:
  - https://github.com/anthropics/skills/tree/main/skills/algorithmic-art
  - https://github.com/anthropics/skills
  - https://github.com/anthropics/skills/blob/main/.claude-plugin/marketplace.json
  - https://code.claude.com/docs/en/skills
---

> 本文根据 anthropics/skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 8.5 万次；所在仓库 anthropics/skills 在 GitHub 约 18.0 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

algorithmic-art 让 Claude 用代码创作生成艺术。按 `description`，用户想用代码做艺术、生成艺术、算法艺术、流场（flow field）或粒子系统时使用，技术上基于 p5.js，特点是「带种子的随机」和「可交互的参数探索」；同时要求创作原创作品，不照搬已有艺术家的作品。

和 canvas-design 一样，它分两步走。第一步写一份「算法哲学」：用一段文字描述这件作品背后的计算美学——用什么过程、怎样的涌现行为、噪声场和粒子如何相互作用，存成 `.md`。第二步把这份哲学实现成 p5.js 程序。技能在这里有一条硬性规定：动手前必须先读目录里的 `templates/viewer.html` 模板，交互查看器的整体框架和界面是固定的，只允许替换算法本身和参数定义。

成品是一个可以直接打开的 HTML：有随机种子的输入与前后翻页（同一个种子永远得到同一幅画），有一组滑块实时调参数。产出的文件类型是 `.md`（哲学）、`.html`（查看器）和 `.js`（算法）。

## 怎么安装

`algorithmic-art` 收在 anthropics/skills 仓库的 example-skills 插件包里。在 Claude Code 会话中依次输入（命令来自仓库 README）：

```text
/plugin marketplace add anthropics/skills
/plugin install example-skills@anthropic-agent-skills
```

同一个包里的其他示例技能会一起装上。只想要这一个，可以把仓库里的 `skills/algorithmic-art` 文件夹复制到 `~/.claude/skills/`（个人）或项目的 `.claude/skills/`；claude.ai 网页版则在 Customize → Skills 里上传这个文件夹的 ZIP。

仓库整体介绍和其他安装方式，详见本站《anthropics/skills 是什么、怎么安装：Anthropic 官方 Skills 仓库（docx / pptx / xlsx / pdf、skill-creator）》。

## 怎么用

- 「做一件以『潮汐』为主题的流场作品，颜色偏冷」。
- 「粒子太密了，把数量参数的范围调小，再加一个控制拖尾长度的滑块」。
- 「保持算法不变，换十个种子，挑出最好看的三个告诉我编号」。

目录里只有两个模板文件：`viewer.html`（查看器）和 `generator_template.js`（算法骨架）。

## 适合谁 / 局限

适合对创意编程感兴趣的人、想给网站或演示做动态背景的设计师，以及教学场景里演示「参数如何改变图形」。它产出的是抽象的程序化图形，不是插画或照片；需要具象内容时应该用图像生成模型。作品在浏览器里实时计算，粒子数量很大时旧电脑会卡。

## 注意事项

- **许可**：技能目录内的 LICENSE.txt 为 Apache-2.0。
- **运行环境**：成品是纯前端文件，本地浏览器打开即可；在 claude.ai 里可以作为 Artifact 直接预览。模板里的 p5.js 是从公共 CDN 加载的，完全离线时需要自备库文件。
- **原创要求**：不要让它复刻具体某位艺术家的代表作。
- 想把作品导出成高清图片或视频，需要自己再提要求或另行处理。
