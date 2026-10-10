---
title: "Impeccable 是什么、怎么安装使用：Paul Bakaus 的前端设计 Skill（/impeccable 24 个命令 + 设计检测器）"
slug: impeccable-design-skill-pbakaus
name: Impeccable（pbakaus/impeccable）
url: https://github.com/pbakaus/impeccable
pricing: 开源免费（Apache-2.0）
platforms: Claude Code / Cursor / Codex CLI / GitHub Copilot / Gemini CLI / OpenCode / Kiro / Trae 等
trialNote: "npx impeccable install"
products: [claude, cursor]
models: [any-llm]
topics: [agent-skills, product-design, coding]
excerpt: "Impeccable 是 Paul Bakaus 做的前端设计 Skill：一个 /impeccable 技能下挂 24 个命令（audit、critique、polish、animate 等），外加不依赖大模型的设计问题检测器和编辑后自动检查的 hook。支持 Claude Code、Cursor、Codex 等。"
checkedOn: 2026-10-10
sources:
  - https://github.com/pbakaus/impeccable
  - https://impeccable.style
  - https://impeccable.style/docs/hooks
  - https://code.claude.com/docs/en/discover-plugins
  - https://agentskills.io/home
---

> 本文根据 pbakaus/impeccable 仓库 README、官网 impeccable.style 与 Claude Code 官方文档整理，资料核对于 2026-10-10。命令数量和支持的工具以仓库 README 为准。

## 是什么

Impeccable 是 Paul Bakaus 维护的一套给 AI 编程智能体用的设计指导。README 说它的起点是 Anthropic 官方的 frontend-design 技能，在此之上补了三样东西：一个记录产品背景的初始化流程、一组和 AI 沟通设计意图的命令、以及一个不调用大模型就能跑的设计问题检测器。

它要解决的问题很具体：各家模型学的都是同一批 SaaS 模板，不加约束就会反复出现同样的痕迹——全站 Inter 字体、紫蓝渐变、卡片套卡片、彩色底上放灰字。Impeccable 把这些写成明确的「不要这样做」，并给出可执行的检查规则。

截至 2026-10-10，GitHub 显示该仓库约 7.9 万 Star、4704 Fork，最近一次推送在 2026-10-09。

## 包含哪些 Skill

仓库只有一个技能 `impeccable`，所有功能通过 `/impeccable <command> <target>`（命令加目标） 调用。README 列出 24 个命令，按用途大致分为：

- **起步与规划**：`init`（一次性设置，写出 `PRODUCT.md`）、`shape`（写代码前先规划 UX/UI）、`craft`（规划加实现的完整流程）、`document`（从现有代码生成 `DESIGN.md`）、`extract`（把可复用的组件和设计变量抽出来）；
- **评审**：`critique`（层级、清晰度等设计评审）、`audit`（无障碍、性能、响应式等技术检查）；
- **调整方向**：`bolder`、`quieter`、`distill`、`delight`、`overdrive`；
- **专项修整**：`typeset`（字体）、`layout`（布局与间距）、`colorize`（配色）、`animate`（动效）、`clarify`（界面文案）、`adapt`（多设备适配）、`harden`（错误处理、国际化、文字溢出）、`onboard`（首次使用与空状态）、`optimize`（性能）、`polish`（上线前收尾）；
- **浏览器内迭代**：`live`、`generate`，在本地开发页面上直接生成和挑选界面变体。

另外有一个独立命令行检测器，README 称它包含 59 条确定性规则，不需要大模型和 API Key。

## 怎么安装

**命令行安装器（README 推荐）**，在项目根目录运行：

```bash
npx impeccable install
```

它会检测本机已有的工具目录（如 `~/.claude`、`~/.codex`、项目里的 `.cursor`），让你选择装给哪些工具、装到当前项目还是全局。之后更新用 `npx impeccable update`。

**Claude Code 插件市场**：

```text
/plugin marketplace add pbakaus/impeccable
```

登记市场后，打开 `/plugin` 从列表里安装 Impeccable。

**GitHub Copilot（VS Code）**：`code --install-extension renaissance-geek.impeccable`。README 还提供 Git 子模块方式、官网 ZIP 下载和从仓库 `dist/` 目录手动复制几种做法，适合想把版本固定在仓库里的团队。

## 怎么用

- 新项目先运行 `/impeccable init`，它会查看项目并只追问缺失的产品信息，结果写进 `PRODUCT.md`，后续命令都以此为背景。
- 日常用法是「命令 + 范围」，例如 `/impeccable audit the header`、`/impeccable polish the checkout form`；也可以直接描述，如 `/impeccable redo this hero section`。只输入 `/impeccable` 会列出全部命令。
- 常用命令可以固定成快捷方式：`/impeccable pin audit` 之后就能直接用 `/audit`。
- Codex 里通过 `/skills` 或输入 `$impeccable` 调用，README 写明项目级技能在 `.agents/skills/`、用户级在 `~/.agents/skills/`，与 Codex 官方文档一致。
- 不用智能体也能单独跑检测：`npx impeccable detect src/` 扫描目录，`npx impeccable detect --json .` 输出适合 CI 的 JSON。

## 适合谁 / 不适合谁

**适合：**
- 用 AI 写前端、希望有一套固定「设计口令」反复打磨界面的开发者；
- 想在 CI 或提交前自动拦住常见设计问题的团队；
- 同时使用多种编程智能体、需要统一设计规范的项目。

**不适合：**
- 对自动执行的 hook 比较谨慎、又没时间审查它的环境；
- 只做后端或命令行工具的项目；
- 只用 claude.ai 网页版的用户——README 的安装方式都面向本地编程工具。

## 注意事项

- **许可证**：仓库 LICENSE 为 Apache-2.0。
- **维护状态**：更新活跃，最近一次推送 2026-10-09。
- **安全提醒（这个仓库要特别留意）**：
  - 安装器在 Claude Code、Cursor、Codex、GitHub Copilot 等工具上会一并安装 **hook**，在你编辑界面文件后自动运行检测；安装时可以选择不装，或加 `--no-hooks` 跳过。
  - 技能自带启动脚本，首次运行可能**联网下载一个引擎二进制文件**到 `~/.impeccable/bin/`。README 说明在 Claude Code 里，hook 的运行不受模型工具审批的限制，所以第一次编辑就可能触发下载；无人值守运行前先检查已安装的 hook。
  - `live` 模式只应在你信任的本地项目里用：应用文案修改时会以你的用户权限执行 `package.json` 里的一个可选校验脚本。README 明确不支持把它注入线上生产站点。
  - 和所有第三方技能一样，安装前通读 `SKILL.md` 与脚本。
- **兼容性**：Codex 安装或更新后需要在 `/hooks` 里手动批准项目 hook；Cursor 的技能功能按 README 说明需要先在设置里开启；VS Code 扩展要求较新的版本并处于受信任的工作区。
