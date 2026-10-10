---
title: "VoltAgent/awesome-agent-skills 是什么、怎么用：按官方团队分类的 Agent Skills 清单（Claude Code / Codex / Cursor 通用）"
slug: voltagent-awesome-agent-skills
name: VoltAgent/awesome-agent-skills（技能清单）
url: https://github.com/VoltAgent/awesome-agent-skills
pricing: 开源免费（MIT，仅指清单本身）
platforms: Claude Code / Codex / Antigravity / Gemini CLI / Cursor / GitHub Copilot / OpenCode / Windsurf
trialNote: "清单本身不用安装：按团队或分类找到技能，到它的来源仓库按说明安装，或把技能文件夹放进对应目录"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, ai-agent, coding]
excerpt: "awesome-agent-skills 是 VoltAgent 维护的 Agent Skills 清单，按出品团队分组：Anthropic、Vercel、Cloudflare、Supabase、Stripe、Microsoft、OpenAI 等官方技能在前，社区技能在后，并附各家智能体的技能目录对照表。"
checkedOn: 2026-10-10
sources:
  - https://github.com/VoltAgent/awesome-agent-skills
  - https://code.claude.com/docs/en/skills
  - https://learn.chatgpt.com/docs/build-skills
  - https://github.com/vercel-labs/skills
  - https://agentskills.io/home
---

> 本文根据 VoltAgent/awesome-agent-skills 仓库 README 以及 Claude Code、Codex 官方文档整理，资料核对于 2026-10-10。这是一份清单，收录的技能由各自的作者和团队维护。

## 是什么

awesome-agent-skills 是 VoltAgent（一个做 AI 智能体开发框架的团队）维护的技能清单。和多数「awesome」清单按用途分类不同，它主要按**谁出品的**来分：先列各家公司和开发团队官方发布的技能，再列社区技能。README 的自我定位是只收真实工程团队在用的技能，不收批量生成的内容；贡献说明里也写了，不接受刚做出来几个小时的技能，优先收已被社区采用的。

README 徽章标注的技能数是 1497 以上，仓库简介写的是 1000 多个；核对当日 README 里逐条列出的条目约 1100 条。它声明兼容 Claude Code、Codex、Antigravity、Gemini CLI、Cursor、GitHub Copilot、OpenCode、Windsurf 等。

截至 2026-10-10，GitHub 显示该仓库约 3.5 万 Star、3820 Fork，最近一次推送 2026-10-08。

## 包含哪些 Skill

清单分两大块：

- **官方技能（Official Skills by …）**：60 多个小节，每个小节对应一个团队。能看到的包括 Anthropic（Official Claude Skills，如 `docx`、`pdf`、`pptx`、`xlsx`、`skill-creator`、`mcp-builder`）、Vercel、Cloudflare、Supabase、Stripe、Hugging Face、Trail of Bits、Sentry、Microsoft（再按 .NET、Java、Python、Rust、TypeScript 细分）、OpenAI、Figma、Notion、Expo、Remotion、Google Cloud、Firebase、Flutter、MongoDB、Redis、NVIDIA、HashiCorp（Terraform）、WordPress 等；也有以个人署名的小节，如 Corey Haines 的营销技能、Garry Tan 的 gstack；
- **社区技能（Community Skills）**：按 7 个主题归类——Vector Databases、Marketing、Productivity and Collaboration、Development and Testing、Context Engineering、Specialized Domains、n8n Automation。

README 末尾还有三块实用内容：一段安全声明、一张「各家智能体的技能目录」对照表，以及一份技能质量标准（描述怎么写、正文别超过约 500 行、不写死绝对路径、只申请必要的工具权限）。

阅读时留意两点：一是 README 顶部有赞助商栏目和广告横幅，几家赞助商的技能小节也排在靠前位置；二是官方技能的条目链接大多指向 officialskills.sh 这个目录站，而不是直接指向 GitHub 仓库，要再点一层才到源码。

## 怎么安装

清单本身不用安装，README 也没有给统一的安装命令。从清单里找到想要的技能后：

- **首选**：到该技能的来源仓库，按那个仓库 README 写的方式安装（很多官方仓库支持 `npx skills add owner/repo` 或 Claude Code 的 `/plugin marketplace add owner/repo`，以各仓库说明为准）；
- **手动放置**：把技能文件夹复制到所用智能体的技能目录。README 的对照表里，Claude Code 是项目级 `.claude/skills/`、用户级 `~/.claude/skills/`；Codex 是项目级 `.agents/skills/`、用户级 `~/.agents/skills/`，这两项与各自官方文档一致。表里还列了 Cursor、Gemini CLI、GitHub Copilot、OpenCode、Windsurf、Antigravity 的路径，使用前对照各工具的官方文档再确认一次。

装完后，Claude Code 里用 `/skills` 查看是否识别；Codex 里用 `/skills` 或输入 `$` 提及技能，没出现就重启。

## 怎么用

- **按技术栈找官方技能**：项目用了 Supabase、Stripe、Cloudflare 这类服务，先看有没有对应团队的小节，官方技能通常比社区版本更贴近当前接口；
- **按主题找社区技能**：做营销、上下文工程、n8n 自动化的，直接翻社区部分的相应主题；
- **当作选型参考**：想了解某家公司有没有出官方技能，这里比逐个去搜要快；
- **写技能时对照**：末尾的质量标准可以当自查清单用。

## 适合谁 / 不适合谁

**适合：**
- 同时用好几种编程智能体、想找通用技能的开发者；
- 优先信任厂商官方出品、想按技术栈一站式查找的团队；
- 需要各家智能体技能目录对照表的人。

**不适合：**
- 想找办公、写作、学习类技能的非开发用户——清单以开发类为主；
- 期望条目经过安全审计的人——README 自己写明只做收集、不做审计。

## 注意事项

- **许可证**：MIT（仓库根目录有 LICENSE 文件，版权方 VoltAgent），只覆盖这份清单本身。每个被收录的技能有自己的许可证，用之前到原仓库确认。
- **维护状态**：最近一次推送 2026-10-08，更新活跃。
- **安全**：README 的安全声明写得很直接——清单是「收集」不是「审计」，条目被收录之后原作者随时可能改动或替换内容；技能里可能藏有提示词注入、工具投毒、恶意代码或不安全的数据处理方式。它建议安装前自行评估，并列了两款技能安全扫描工具作参考。落到实处：技能可以带脚本、读写文件、执行命令，装之前通读 `SKILL.md` 和脚本，优先选官方团队的小节。
- **商业成分**：含赞助商内容和广告位，排序靠前不等于质量更高。
- **兼容性**：标注「兼容多种智能体」是就 Agent Skills 格式而言；具体某个技能是否依赖特定工具的功能（如 Claude Code 的插件、hooks），要看它自己的说明。
