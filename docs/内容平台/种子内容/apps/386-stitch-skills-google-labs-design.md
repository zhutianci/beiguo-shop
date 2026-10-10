---
title: "Stitch Skills 是什么、怎么安装使用：配合 Google Stitch 的设计 Skills（文字生成界面、DESIGN.md、设计转 React）"
slug: stitch-skills-google-labs-design
name: Stitch Skills（google-labs-code/stitch-skills）
url: https://github.com/google-labs-code/stitch-skills
pricing: "开源免费（Apache-2.0）；非 Google 官方支持产品，需配合 Stitch 使用"
platforms: "Codex / Antigravity / Gemini CLI / Claude Code / Cursor / OpenCode（手动安装）"
trialNote: "npx plugins add google-labs-code/stitch-skills --scope project --target claude-code"
products: [gemini, claude]
models: [any-llm]
topics: [agent-skills, product-design, coding]
excerpt: "Stitch Skills 是 Google Labs 开源的一组 Agent Skills，分设计、构建、工具三个插件，配合 Stitch MCP 服务使用：让智能体在 Stitch 里生成和修改界面、提取与管理 DESIGN.md 设计规范，并把设计稿转成 React 等代码。"
checkedOn: 2026-10-11
sources:
  - https://github.com/google-labs-code/stitch-skills
  - https://stitch.withgoogle.com/docs/mcp/setup/
  - https://skills.sh/
---

> 本文根据 google-labs-code/stitch-skills 仓库 README 整理，资料核对于 2026-10-11。截至当日，GitHub 显示该仓库约 8463 Star、1108 Fork，最近一次推送在 2026-08-17；skills.sh 榜单上其中的 design-md 技能累计安装约 6.3 万次。技能清单以仓库为准。

## 是什么

Stitch 是 Google Labs 的 AI 界面设计工具：用文字或图片生成界面设计稿。Stitch Skills 是围绕它的一组 Agent Skills 和插件，README 说它遵循 Agent Skills 开放标准，兼容 Codex、Antigravity、Gemini CLI、Claude Code、Cursor 等编程智能体，OpenCode 需要手动安装。

它解决的是「设计工具」和「写代码的智能体」之间的衔接：让智能体直接在 Stitch 里出图、改图、管理设计规范，再把结果变成项目里的组件代码。这些技能都依赖 **Stitch MCP 服务**——README 把它列为前置条件，要先按 Stitch 文档完成 MCP 的注册和认证。

## 包含哪些 Skill

README 分三个插件列出：

**设计（`stitch-design`）**
- `code-to-design`：把前端代码（React、Vue 等）转成 Stitch 里的设计；
- `generate-design`：用文字或图片生成新界面、编辑已有界面、生成设计变体；
- `manage-design-system`：管理设计系统，上传 DESIGN.md 并把主题应用到各个界面；
- `extract-design-md`：直接从前端源码里提取出一份完整的 DESIGN.md；
- `extract-static-html`：从运行中的网页应用提取自包含的静态 HTML；
- `upload-to-stitch`：把本地图片、设计稿、HTML 上传到 Stitch 项目。

**构建（`stitch-build`）**
- `react-components`：把 Stitch 的界面转成 React 组件体系，带自动校验；
- `react-native`：转成 React Native 组件；
- `remotion`：用 Remotion 为 Stitch 项目生成走查视频；
- `shadcn-ui`：集成和使用 shadcn/ui 组件的指导；
- `react-vite-dashboard`：把界面转成 React 加 Vite 的仪表盘。

**工具（`stitch-utilities`）**
- `design-md`：分析 Stitch 项目，生成语义化描述的 DESIGN.md；
- `enhance-prompt`：把含糊的界面想法改写成更适合 Stitch 的提示词；
- `stitch-loop`：从一句话出发生成完整的多页网站，并自动校验；
- `taste-design`：生成强调高质感、避免千篇一律的 DESIGN.md。

## 怎么安装

README 推荐以插件方式安装。Claude Code（装到当前项目）：

```bash
npx plugins add google-labs-code/stitch-skills --scope project --target claude-code
```

Cursor 把后半段换成 `--scope workspace --target cursor`。Codex 用 `codex plugin marketplace add google-labs-code/stitch-skills --ref main` 添加市场后，按需安装 `stitch-design`、`stitch-build`、`stitch-utilities`。只想挑几个技能，README 也给了 `npx skills add google-labs-code/stitch-skills`。OpenCode 需要手动把技能文件夹复制到 `.opencode/skills/` 并自行配置 MCP。

## 怎么用

README 的示例提示：

- 「给一个约会灵感类的手机应用做一个浏览页」——`generate-design`；
- 「扫描 `/src`，把设计系统提取到 `.stitch/DESIGN.md`」——`extract-design-md`；
- 「把 Stitch 项目里的所有界面转成 React 组件」——`react-components`；
- 「优化这句提示词：做一个设置页」——`enhance-prompt`。

## 适合谁 / 不适合谁

**适合：**
- 已经在用 Stitch 出设计稿、想打通到代码的前端开发者和独立开发者；
- 想用 DESIGN.md 这种文本化设计规范约束 AI 输出的团队。

**不适合：**
- 不用 Stitch 的人——绝大多数技能离开 Stitch MCP 无法工作；
- 设计流程以 Figma 为核心的团队。

## 注意事项

- **许可**：Apache-2.0。README 声明这不是 Google 官方支持的产品。
- **需要 Google 账号和 Stitch 的访问条件**：Stitch 属于 Google Labs 的实验性产品，可用地区、额度与条款以其官网为准，国内网络访问受限。
- **会上传内容**：`code-to-design`、`upload-to-stitch` 等技能会把你的前端代码或页面快照传到 Stitch，涉及未公开的产品时先确认是否合适。
- **技能命名**：部分技能的名字带 `stitch::` 前缀，README 提到某些工具（如 OpenCode）要求改成短横线命名后才能加载。
