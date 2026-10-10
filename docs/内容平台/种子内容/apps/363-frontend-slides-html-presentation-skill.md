---
title: "frontend-slides 是什么、怎么安装使用：让 Claude Code 做网页幻灯片的 Skill（先看三种风格预览再生成，可转换 PPT）"
slug: frontend-slides-html-presentation-skill
name: Frontend Slides（zarazhangrui/frontend-slides）
url: https://github.com/zarazhangrui/frontend-slides
pricing: "开源免费（MIT）"
platforms: "Claude Code（插件）；Codex / Kimi Code / OpenCode / Gemini CLI 可读取 SKILL.md 使用"
trialNote: "`/plugin marketplace add https://github.com/zarazhangrui/frontend-slides` 然后 `/plugin install frontend-slides@frontend-slides`"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, ppt, product-design]
excerpt: "Frontend Slides 是 Zara Zhang 开源的网页演示 Skill：不用描述审美，先生成三种视觉风格预览让你挑，再产出零依赖的单文件 HTML 幻灯片；也能把现有 PowerPoint 转成网页版。"
checkedOn: 2026-10-11
sources:
  - https://github.com/zarazhangrui/frontend-slides
  - https://code.claude.com/docs/en/discover-plugins
---

> 本文根据 zarazhangrui/frontend-slides 仓库 README 与 Claude Code 官方文档整理，资料核对于 2026-10-11。

## 是什么

Frontend Slides 是 Zara Zhang（GitHub 用户名 zarazhangrui）开源的一个做网页幻灯片的技能，面向不懂 CSS 和 JavaScript 的非设计师。它的核心想法是「给你看，而不是让你说」：多数人讲不清自己想要什么风格，所以它不让你用文字描述审美，而是先生成几个视觉预览，你挑喜欢的。

成品是零依赖的单个 HTML 文件，CSS 和 JS 都内联，不需要 npm、构建工具或框架，固定 16:9，代码带注释方便自己改。README 把「反 AI 味」当成卖点之一：内置的风格刻意避开白底紫色渐变那类一眼能认出的 AI 审美。

截至 2026-10-11，GitHub 显示该仓库约 3.0 万 Star、2361 Fork，最近一次推送在 2026-06-23。

## 包含哪些 Skill

一个技能，两种主要用法，外加一组风格：

- **新建演示**：询问内容 → 生成 3 个风格预览 → 你选方向 → 生成完整幻灯片并在浏览器里打开；
- **转换 PowerPoint**：提取 PPT 里的文字、图片和备注 → 给你确认 → 选风格 → 生成带原有素材的 HTML 版；
- **内置风格**：分深色、浅色和特别款几组；另有可选的「Bold Template Pack」，收了一批更大胆的模板，按需加载，默认仍回落到稳妥的预设。

README 的 Requirements 还提到两项可选能力：部署成可分享的网址（需要 Node.js 和 Vercel 账号）和导出 PDF（需要 Node.js，Playwright 会自动安装）。

## 怎么安装

**Claude Code**。README 特别叮嘱两条命令要分两次发送，不要一起粘贴：

```text
/plugin marketplace add https://github.com/zarazhangrui/frontend-slides
```

完成后再输入：

```text
/plugin install frontend-slides@frontend-slides
```

README 建议用完整的 HTTPS 地址——简写的 `zarazhangrui/frontend-slides` 可能让 Claude Code 走 SSH，没配置过会失败。

**手动安装**：

```bash
git clone https://github.com/zarazhangrui/frontend-slides.git ~/.claude/skills/frontend-slides
```

**其他智能体**（Codex、Kimi Code、OpenCode、Gemini CLI 等）：把仓库链接发给它，让它从 `SKILL.md` 读起，按需加载风格预设、模板等支持文件。

## 怎么用

- 插件安装后输入 `/frontend-slides:frontend-slides`，再说需求，例如「我要给我的 AI 创业项目做一份融资路演」；手动安装时命令是 `/frontend-slides`。
- 转换已有文件：「把我的 presentation.pptx 转成网页幻灯片」。
- 生成后可以继续让它改某一页的文案、换配色或增删页面。

## 适合谁 / 不适合谁

**适合：**
- 想要有设计感的演示、又说不清自己要什么风格的人；
- 需要把幻灯片发成一个链接或单个文件、在任何浏览器里都能放的场景；
- 想把旧 PPT 翻新成网页版的人。

**不适合：**
- 必须交付可编辑 `.pptx` 的场合——它的成品是 HTML；
- 没有本地文件系统和命令执行能力的纯聊天环境。

## 注意事项

- **许可证**：MIT。
- **维护状态**：最近一次推送是 2026-06-23，距今三个多月，更新不算频繁，但 Star 数仍在同类里靠前。
- **依赖**：转换 PPT 需要 Python 和 `python-pptx`；部署功能会把你的幻灯片发布到 Vercel，等于公开到互联网，含内部信息的材料不要用。
- **安全**：技能会运行脚本、写文件、打开浏览器；导出 PDF 时会自动安装 Playwright。安装前浏览 `SKILL.md` 和 `scripts/`。
- 与本站介绍过的 guizang-ppt-skill 定位相近，区别在于它强调先看预览再定风格。
