---
title: "Archify 是什么、怎么安装使用：把想法或代码库画成可交互架构图的 Skill（Claude Code / Codex / Cursor）"
slug: archify-diagram-skill
name: Archify（tt-a1i/archify）
url: https://github.com/tt-a1i/archify
pricing: 开源免费（MIT）
platforms: Claude Code / Codex CLI / Cursor / OpenCode / claude.ai（ZIP 上传，功能受限）
trialNote: "npx skills add tt-a1i/archify -g"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding, infographic]
excerpt: "Archify 是一个画图 Skill：用一句话描述系统，或让它分析代码库，生成一个可交互的 HTML 图——架构图、流程图、时序图、数据流图、生命周期图五种。可聚焦节点、追踪上下游、切换主题并导出图片，单文件即可分享。"
checkedOn: 2026-10-10
sources:
  - https://github.com/tt-a1i/archify
  - https://archify.si
  - https://github.com/vercel-labs/skills
  - https://learn.chatgpt.com/docs/build-skills
  - https://code.claude.com/docs/en/skills
---

> 本文根据 tt-a1i/archify 仓库 README、官网 archify.si 与 Claude Code、Codex 官方文档整理，资料核对于 2026-10-10。命令和支持范围以仓库 README 为准。

## 是什么

Archify 是一个把「想讲清楚的结构」变成可交互图的 Skill。你向智能体描述一个系统、一个流程，或者让它先读一遍代码库，Archify 会生成一个独立的 HTML 文件：里面是排好版的图，可以点节点聚焦、沿着上下游追踪、按路径讲解，还能切换视觉风格和深浅主题，再导出图片分享。

它不是通用绘图编辑器，也不是 Mermaid 的换肤。README 描述的做法是：智能体先按固定的数据格式（带 schema 的 JSON）写出图的「源」，仓库自带的校验器检查结构、布局、连线和标签是否互相遮挡，全部通过才渲染成最终文件；没通过会返回具体的修复提示让智能体改。这样做的好处是图可以反复修改而不乱——后续说一句「加上 Redis」「把鉴权挪到左边」，它只改源文件里相关的部分。

截至 2026-10-10，GitHub 显示该仓库约 8.1 万 Star、5498 Fork，最近一次推送在 2026-10-10，README 标注的稳定版本为 v3.0.1。仓库有简体中文 README（README_ZH.md）。

## 包含哪些 Skill

仓库只有一个技能 `archify`，支持五种图：

- **Architecture（架构图）**：组件、服务、存储和边界。提示里说明范围、核心组件和主路径；
- **Workflow（流程图）**：CI/CD、审批、工具调用、操作手册。说明参与者、顺序、分支和异常；
- **Sequence（时序图）**：一次 API 调用、缓存回退、鉴权、异步链路。说明调用方、被调用方和返回；
- **Data Flow（数据流图）**：数据管道、血缘、敏感数据边界；
- **Lifecycle（生命周期图）**：状态、重试、等待和终态。

另有两个进阶能力：架构对比（比较改动前后两份架构快照，用于设计或代码评审）和带源码证据的架构图（节点可以关联到某次提交里的具体文件和行号，需明确要求才启用）。

生成的页面自带一组快捷键：`/` 查找节点、`R` 探查路径、`F` 进入演示模式、`S` 切换风格、`T` 切换主题、`E` 打开导出。

## 怎么安装

README 的安装命令：

```bash
npx skills add tt-a1i/archify -g
```

给 Cursor 做明确的非交互安装：

```bash
npx -y skills add tt-a1i/archify --skill archify --agent cursor --global --copy --yes
```

不安装先试用：`npx skills use tt-a1i/archify@archify --agent codex`。

README 列出的安装位置：Claude Code 在 `~/.claude/skills/` 或项目的 `.claude/skills/`；Codex CLI 在 `~/.agents/skills/` 或 `.agents/skills/`（与 Codex 官方文档一致）；OpenCode 在 `~/.config/opencode/skills/` 等目录。这三者都能使用完整的渲染和校验流程。

**claude.ai**：在 Settings → Capabilities → Skills 上传 `archify.zip`，README 注明能否完整运行取决于沙箱里是否有 Node.js。

## 怎么用

不需要代码库，直接描述就能画：

```text
Use Archify to draw: Browser -> API -> Redis cache -> PostgreSQL fallback.
```

想让它基于真实代码，打开仓库后这样说（README 的示例）：

```text
Analyze this repository, then use archify to create a high-level runtime architecture diagram.
Show 8–12 core components, one primary path, external dependencies, and trust boundaries.
Put supporting detail in cards instead of adding more edges.
```

这段提示里有几个值得照搬的做法：限定组件数量、指定一条主路径、把次要信息放进卡片而不是多画连线。出图后在对话里继续提小修改即可。拿不准用哪种图，可以运行 `node archify/bin/archify.mjs guide "Show an API request with Redis cache miss"` 让它给建议。

页面文字默认支持英文和简体中文两种界面语言，在源文件的 `meta.locale` 里设置。

## 适合谁 / 不适合谁

**适合：**
- 接手陌生代码库、想先得到一张全局图的开发者；
- 写技术方案、做设计评审或分享，需要一张能点开讲的图的人；
- 想把学习路线、行程、流程这类非技术内容做成可交互页面的用户。

**不适合：**
- 需要所见即所得、手动拖拽编辑的场景——README 明确说这不在范围内；
- 想把已有 Mermaid 图自动转换过来的人——同样不支持；
- 把图当作事实依据的场合——图反映的是智能体对代码的理解，README 也强调交互功能不推断真实的运行影响或风险。

## 注意事项

- **许可证**：仓库 LICENSE 为 MIT（文件中列有 Archify 作者与上游项目 Cocoon AI 两条版权声明）。
- **维护状态**：更新活跃，最近一次推送 2026-10-10。
- **安全提醒**：技能自带 Node.js 脚本，会在本机执行校验和渲染、写出 HTML 文件；可选的预览模式会在本机回环地址上开一个临时端口。README 说明它可能会联网请求一个固定的版本清单，仅用于提示有新版本，不会自动下载或安装更新，也不上传项目数据、提示词或设备标识；设置环境变量 `ARCHIFY_UPDATE_CHECK_DISABLED=1` 可以关掉。和其他第三方技能一样，安装前通读 `SKILL.md` 与脚本。
- **认准官方渠道**：README 特别说明项目本身免费开源，官方渠道只有 GitHub 仓库和 archify.si；名称或域名相似的第三方在线服务及其收费方案不代表项目方。
- **兼容性**：完整流程需要 Node.js（社区集成部分要求 18 及以上）；claude.ai 上传方式和 Project Knowledge 方式功能有限。
- 分享带源码证据的图之前，确认其中的文件路径和代码片段可以公开。
