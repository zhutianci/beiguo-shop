---
title: "travisvn/awesome-claude-skills 是什么、怎么用：一份偏入门的 Claude Skills 清单（官方技能、社区技能、Skills 与 MCP 对比）"
slug: travisvn-awesome-claude-skills
name: travisvn/awesome-claude-skills（技能清单）
url: https://github.com/travisvn/awesome-claude-skills
pricing: 免费（仓库未声明许可证）
platforms: Claude.ai / Claude Code / Claude API
trialNote: "清单本身不用安装；想先试官方技能，README 给的命令是 `/plugin marketplace add anthropics/skills`"
products: [claude]
models: [claude-llm]
topics: [agent-skills, ai-agent, learning]
excerpt: "travisvn/awesome-claude-skills 是一份篇幅不长的 Claude Skills 清单：列出 Anthropic 官方技能和十来个社区技能，附 Skills 与 MCP、Projects、子智能体的对比和安全建议。适合入门梳理，但 2026-04-28 之后未再更新。"
checkedOn: 2026-10-10
sources:
  - https://github.com/travisvn/awesome-claude-skills
  - https://code.claude.com/docs/en/skills
  - https://code.claude.com/docs/en/discover-plugins
  - https://support.claude.com/en/articles/12512180-using-skills-in-claude
  - https://agentskills.io/home
---

> 本文根据 travisvn/awesome-claude-skills 仓库 README、Claude Code 官方文档和 Claude 帮助中心整理，资料核对于 2026-10-10。该清单自 2026-04-28 起没有新的推送，部分内容已经过时，下文会逐一指出。

## 是什么

travisvn/awesome-claude-skills 是 GitHub 用户 travisvn 维护的 Claude Skills 清单，侧重 Claude Code。它和动辄上千条的大清单走的是相反的路子：收录的技能不多，更像一页「Skills 入门导览」——先解释技能是什么、怎么渐进式加载，再列官方技能和少量社区技能，然后用几张对比表讲清 Skills 和提示词、Projects、子智能体、MCP 各自适合什么场景，最后是安全建议、排错和常见问题。

截至 2026-10-10，GitHub 显示该仓库约 1.5 万 Star、2019 Fork。需要特别注意维护状态：最近一次推送是 2026-04-28，README 自带的更新徽章停在 2026 年 2 月，「Recent Updates」栏目的最后一条是 2025 年 11 月。Skills 生态这半年变化很大，所以它更适合当概念读物，不适合当最新目录。

## 包含哪些 Skill

README 的技能部分分两块：

- **Official Skills（官方技能）**：全部指向 Anthropic 的 anthropics/skills 仓库，按用途分为文档类（`docx`、`pdf`、`pptx`、`xlsx`）、设计与创意（`algorithmic-art`、`canvas-design`、`slack-gif-creator`）、开发（`frontend-design`、`web-artifacts-builder`、`mcp-builder`、`webapp-testing`）、沟通（`brand-guidelines`、`internal-comms`）和技能创建（`skill-creator`）；
- **Community Skills（社区技能）**：
  - 合集类：`obra/superpowers` 和实验性质的 `obra/superpowers-lab`；
  - 单个技能表格，十来条，如 `ios-simulator-skill`、`playwright-skill`、`claude-d3js-skill`、`claude-scientific-skills`、`web-asset-generator`、Trail of Bits Security Skills、`frontend-slides`、Expo Skills、shadcn/ui、`get-shit-done`；
  - 工具类：`Skill_Seekers`（把文档网站转成技能）。

技能之外的内容反而是它的长处：一张「什么时候用 Skills、提示词、Projects、子智能体、MCP」的速查表，Skills 与 MCP、Skills 与系统提示词的逐项对比，以及一节手把手写第一个技能的说明。

## 怎么安装

清单不需要安装。README 的「Getting Started」给了三个入口，用来安装你挑中的技能：

**Claude.ai**：到 Settings → Capabilities 打开相关开关，然后浏览或上传技能；团队版和企业版要管理员先在组织层面启用。按 Claude 帮助中心的现行说明，上传入口在 Customize → Skills，传的是技能文件夹的 ZIP。

**Claude Code**：README 给的命令是

```text
/plugin marketplace add anthropics/skills
```

这条与官方文档一致，作用是把 Anthropic 官方仓库登记为插件市场，之后再用 `/plugin install 插件名@市场名` 安装。README 里还有一条从本地目录安装的 `/plugin add /path/to/skill-directory`，本文核对的 Claude Code 官方文档里没有查到这种写法；本地技能按官方文档直接放进 `~/.claude/skills/<技能名>/`（个人）或 `.claude/skills/<技能名>/`（项目）即可。

**Claude API**：通过 Skills 接口使用，README 只给了示意代码，细节看官方 API 文档。

社区技能则点进各自仓库，按它们自己的 README 安装。

## 怎么用

- **当入门读物**：第一次接触 Skills，把 README 从头读到「Skills vs Other Approaches」一节，基本能分清几个容易混的概念；
- **做选择题**：不确定一个需求该写成技能、放进 Projects，还是接 MCP，对照速查表判断——反复要输入同一段提示词的事，就该做成技能；
- **装之前过一遍安全清单**：README 的 Security 一节列了审查要点，可以照着检查任何来源的技能；
- **找技能**：需要更多、更新的条目时，换去看仍在更新的清单或官方仓库。

## 适合谁 / 不适合谁

**适合：**
- 刚听说 Skills、想花十几分钟弄清基本概念的人；
- 需要向同事解释「Skills 和 MCP 有什么区别」的人，对比表可以直接参考；
- 想看一份短小、结构清楚的清单的人。

**不适合：**
- 想找最新、最全技能目录的人——条目少，而且五个多月没有更新；
- 用 Codex、Cursor 等其他智能体的人——内容只围绕 Claude。

## 注意事项

- **许可证**：截至 2026-10-10，仓库根目录没有 LICENSE 文件，GitHub 未识别出许可证，README 也没有许可说明。引用或转载清单内容前应先征得作者同意；清单指向的各个技能另有各自的许可。
- **维护状态**：最近一次推送 2026-04-28，此后没有更新。README 里一些带时间的说法已不可靠，例如「截至 2025 年 10 月 claude.ai 还不支持集中管理自定义技能」、关于哪些套餐能用 Skills 的回答、已知问题列表等，都要以 Anthropic 当前的官方文档为准。
- **安全**：README 在社区技能前有醒目警告——技能可以在 Claude 的环境里执行任意代码，只安装可信来源的技能。它给的做法值得照办：启用前通读 `SKILL.md` 和全部脚本，警惕要求访问敏感数据的技能，团队分发前做代码评审，先在非生产环境试用。
- **兼容性**：全篇以 Claude 为对象，没有覆盖后来出现的跨智能体开放标准和 `npx skills` 这类安装工具；清单里个别链接指向的仓库可能已改名或搬迁，点不开时到 GitHub 搜索仓库名。
