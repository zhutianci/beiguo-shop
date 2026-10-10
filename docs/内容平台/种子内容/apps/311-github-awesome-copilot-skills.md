---
title: "github/awesome-copilot 是什么、怎么用：GitHub 官方的 Copilot 资源合集（Skills、Agents、Instructions、插件安装）"
slug: github-awesome-copilot-skills
name: github/awesome-copilot（GitHub Copilot 社区合集）
url: https://github.com/github/awesome-copilot
pricing: 开源免费（MIT）
platforms: GitHub Copilot（Copilot CLI / VS Code）
trialNote: "`copilot plugin install <plugin-name>@awesome-copilot`"
products: [github-copilot]
models: [any-llm]
topics: [agent-skills, coding, ai-agent]
excerpt: "github/awesome-copilot 是 GitHub 官方账号下的 Copilot 社区资源合集，收录自定义 Agents、Instructions、Skills、Plugins 和 Cookbook；其中 Skills 有 400 多个，可用 gh skills install 单装，或按插件整包安装。"
checkedOn: 2026-10-10
sources:
  - https://github.com/github/awesome-copilot
  - https://github.com/github/awesome-copilot/blob/HEAD/docs/README.skills.md
  - https://awesome-copilot.github.com
  - https://github.blog/changelog/2026-04-16-manage-agent-skills-with-github-cli/
  - https://agentskills.io/home
---

> 本文根据 github/awesome-copilot 仓库 README、仓库内的 Skills 文档和 GitHub 官方更新日志整理，资料核对于 2026-10-10。合集由社区贡献、条目每天在变，以仓库和配套网站为准。

## 是什么

github/awesome-copilot 是挂在 GitHub 官方账号下的一个社区合集，专门收集能增强 GitHub Copilot 的各种「定制件」。README 把内容分成五类：Agents（可接 MCP 服务器的专用智能体）、Instructions（按文件类型自动生效的编码规范）、Skills（带说明和附带资源的技能文件夹）、Plugins（把若干 agent 和 skill 打包成面向某类工作的插件），以及 Cookbook（调用 Copilot API 的现成示例）。简介里还提到 hooks 和 workflows。

需要分清的一点：仓库归 GitHub 管理，但里面的内容来自第三方开发者投稿，并不等于 GitHub 官方编写或担保。它另有一个配套网站，支持全文搜索和筛选，还提供给智能体读取的 `llms.txt` 索引和入门用的 Learning Hub。

截至 2026-10-10，GitHub 显示该仓库约 4.0 万 Star、5090 Fork，最近一次推送 2026-10-09。

## 包含哪些 Skill

Skills 的清单在仓库的 `docs/README.skills.md`，核对当日表格里有 427 个，遵循 agentskills.io 的规范，每个技能一个文件夹加 `SKILL.md`，可以附带脚本、代码模板和参考数据。数量太多，按用途举几类（名称照清单原样）：

- **文档与规划**：`create-readme`、`create-specification`、`create-implementation-plan`、`create-architectural-decision-record`、`meeting-minutes`；
- **Git 与 GitHub**：`git-commit`、`conventional-commit`、`github-issues`、`github-release`、`dependabot`、`github-actions-hardening`；
- **格式转换与画图**：`convert-pdf-to-md`、`convert-word-to-md`、`markdown-to-html`、`excalidraw-diagram-generator`、`drawio`；
- **语言与框架**：`csharp-xunit`、`java-springboot`、`kotlin-springboot`、`javascript-typescript-jest`、`multi-stage-dockerfile`；
- **云与运维**：以 `azure-`、`aws-` 开头的一批，如 `azure-pricing`、`aws-cost-optimize`，以及各 Linux 发行版的排障技能；
- **代码安全**：`codeql`、`mcp-security-audit`、`agent-owasp-compliance`。

从清单看，微软系技术（.NET、Azure、Power Automate、Dataverse）的条目占比明显偏高。

## 怎么安装

**装单个技能**（命令来自仓库的 Skills 文档，要求 GitHub CLI v2.90.0 及以上）：

```text
gh skills install github/awesome-copilot <skill-name>
```

把 `<skill-name>` 换成清单里的技能名。文档也写了可以手动把技能文件夹复制到本地的技能目录。

**装插件**（命令来自 README）：

```bash
copilot plugin install <plugin-name>@awesome-copilot
```

README 说明多数用户的 Copilot CLI 和 VS Code 里已经预先登记了 Awesome Copilot 市场，可以直接装；旧版本或自定义环境提示找不到市场时，先登记一次：

```bash
copilot plugin marketplace add github/awesome-copilot
copilot plugin install <plugin-name>@awesome-copilot
```

README 没有提供 Claude Code 或 Codex 的安装命令。技能本身是通用格式，想在别的智能体里用，只能自己复制文件夹并自行验证效果。

## 怎么用

- **先找再装**：到配套网站按关键词搜索，或者直接翻 `docs/README.skills.md` 的表格，每一行都带描述和可复制的安装命令；
- **使用**：装好后在提示里提到技能名，或者让 Copilot 自己根据任务发现并加载；
- **整套工作流**：如果想要某个场景的一组 agent 加 skill，直接装对应的 Plugin 比一个个挑省事；
- **学习**：还不清楚 agents、skills、instructions 的区别，可以先看网站上的 Learning Hub。

## 适合谁 / 不适合谁

**适合：**
- 日常用 GitHub Copilot（尤其是 Copilot CLI 和 VS Code）的开发者；
- .NET、Azure、Java 技术栈的团队——这部分条目最多；
- 想参考别人怎么写技能和自定义指令的人。

**不适合：**
- 主要用 Claude Code、Codex、Cursor 的人——安装方式是围绕 Copilot 做的，更适合去看各自生态的技能库；
- 想要少而精、经过统一审核的技能集的人——几百个社区条目水平不一，需要自己筛。

## 注意事项

- **许可证**：MIT，仓库根目录有 LICENSE 文件（版权方 GitHub, Inc.）。个别技能文件夹里另带许可文件，以文件夹内的为准。
- **维护状态**：最近一次推送 2026-10-09，更新非常频繁，技能名称可能调整。
- **安全**：README 自己就提醒，这些定制件来自第三方开发者，安装前要检查 agent 及其文档。技能可以带脚本并执行命令，Agents 会连接 MCP 服务器，合集里还有 hooks；装之前把 `SKILL.md`、脚本和要连接的服务读一遍，涉及云账号、仓库写权限的尤其要看清。
- **兼容性**：`gh skills` 需要较新的 GitHub CLI；插件命令依赖 Copilot CLI。条目质量和维护情况差别大，重要工作流先在测试仓库里试。
