---
title: "brand-guidelines skill 是什么、怎么用：Anthropic 官方品牌规范 Skill，也是「把公司品牌写成 Skill」的范本"
slug: anthropic-brand-guidelines-skill
name: brand-guidelines（anthropics/skills）
url: https://github.com/anthropics/skills/tree/main/skills/brand-guidelines
pricing: "免费（Apache-2.0，见技能目录内 LICENSE.txt）"
platforms: "Claude Code / claude.ai / Claude API"
trialNote: "`/plugin marketplace add anthropics/skills` 然后 `/plugin install example-skills@anthropic-agent-skills`"
products: [claude]
models: [claude-llm]
topics: [agent-skills, product-design]
excerpt: "brand-guidelines 是 anthropics/skills 里的品牌样式 Skill：把 Anthropic 的品牌色和字体（Poppins / Lora）套用到各类产出物上。更大的价值是当模板，照着写自己公司的品牌规范技能。"
checkedOn: 2026-10-11
sources:
  - https://github.com/anthropics/skills/tree/main/skills/brand-guidelines
  - https://github.com/anthropics/skills
  - https://github.com/anthropics/skills/blob/main/.claude-plugin/marketplace.json
  - https://code.claude.com/docs/en/skills
---

> 本文根据 anthropics/skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 10.2 万次；所在仓库 anthropics/skills 在 GitHub 约 18.0 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

brand-guidelines 的内容很短：它记录了 Anthropic 自己的品牌色和字体，并告诉 Claude 怎样把它们应用到幻灯片、文档等产出物上。`description` 的说法是，当品牌色、风格规范、视觉格式或公司设计标准适用时使用它。

具体规定包括：主色是近黑（`#141413`）和米白（`#faf9f5`），配两档灰；强调色是橙、蓝、绿三种；标题用 Poppins、正文用 Lora，分别以 Arial 和 Georgia 作为回退字体。应用规则也写明了，比如多大字号以上算标题并换用标题字体，非文字形状轮流使用三种强调色。

要说清楚的是：**这是 Anthropic 的品牌，不是你的**。绝大多数用户并不需要把自己的材料做成 Anthropic 的样子。这个技能之所以值得了解，是因为它是「把品牌规范写成技能」最简洁的官方范例——整个技能只有一份 SKILL.md，结构是「颜色 → 字体 → 应用规则 → 技术细节」，照着替换成自己公司的色值和字体，就得到了一个随时可用的品牌技能。

## 怎么安装

`brand-guidelines` 收在 anthropics/skills 仓库的 example-skills 插件包里。在 Claude Code 会话中依次输入（命令来自仓库 README）：

```text
/plugin marketplace add anthropics/skills
/plugin install example-skills@anthropic-agent-skills
```

同一个包里的其他示例技能会一起装上。只想要这一个，可以把仓库里的 `skills/brand-guidelines` 文件夹复制到 `~/.claude/skills/`（个人）或项目的 `.claude/skills/`；claude.ai 网页版则在 Customize → Skills 里上传这个文件夹的 ZIP。

仓库整体介绍和其他安装方式，详见本站《anthropics/skills 是什么、怎么安装：Anthropic 官方 Skills 仓库（docx / pptx / xlsx / pdf、skill-creator）》。

## 怎么用

- 原样使用：「用 Anthropic 品牌风格重新排一下这份演示稿」。
- 当模板：「参考 brand-guidelines 这个 skill 的结构，帮我写一个我们公司的品牌规范 skill，主色是 #0B5FFF，标题字体用思源黑体」。把得到的文件夹放进 `.claude/skills/`，以后做材料时说一句「按公司品牌来」即可。
- 与文档技能搭配：先让 pptx 或 docx 技能生成文件，再要求按品牌技能调整配色和字体。

## 适合谁 / 局限

适合想让 AI 产出的文档、幻灯片保持统一视觉的团队，尤其是市场、品牌和经常对外发材料的岗位——前提是把它改成自己的版本。它只管颜色和字体，不包含 Logo 用法、版式网格、语气规范这些完整品牌手册的内容，需要的话要自己补。

## 注意事项

- **许可**：技能目录内的 LICENSE.txt 为 Apache-2.0，指的是技能文件；Anthropic 的品牌标识本身不因此授权给你使用，不要用它制作容易被误认为 Anthropic 官方出品的材料。
- **字体**：说明里提到字体应预先安装在运行环境中，否则会退回到备用字体。
- **不执行脚本**：纯说明文字，没有额外依赖。
