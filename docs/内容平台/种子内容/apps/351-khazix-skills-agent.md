---
title: "khazix-skills 是什么、怎么安装使用：数字生命卡兹克的 Skill 合集（leader、neat-freak 洁癖、横纵分析法）"
slug: khazix-skills-agent
name: Khazix Skills（数字生命卡兹克）
url: https://github.com/KKKKhazix/khazix-skills
pricing: 开源免费（MIT）
platforms: Claude Code / Codex / Cursor / Qoder / Kimi Code / CodeBuddy 等支持 Agent Skills 的工具
trialNote: "帮我安装这个 skill：https://github.com/KKKKhazix/khazix-skills/tree/main/<skill-name>"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, ai-agent, coding]
excerpt: "khazix-skills 是数字生命卡兹克开源的中文 Skill 合集，共 6 个：leader 把模糊想法写成长程目标任务书，neat-freak 收尾时对齐文档与记忆，hv-analysis 出横纵分析研究报告，另有磁盘清理、AI 资讯查询和公众号写作。"
checkedOn: 2026-10-10
sources:
  - https://github.com/KKKKhazix/khazix-skills
  - https://agentskills.io/home
  - https://code.claude.com/docs/en/skills
  - https://learn.chatgpt.com/docs/build-skills
---

> 本文根据 KKKKhazix/khazix-skills 仓库中文 README、agentskills.io 与 Claude Code、Codex 官方文档整理，资料核对于 2026-10-10。技能数量和版本以仓库 README 为准。

## 是什么

khazix-skills 是公众号「数字生命卡兹克」的作者开源的个人 Skill 合集。和动辄上百个技能的大型仓库不同，这里目前只有 6 个，README 的说法是：都是在自己项目里用过一段时间、确实省事才搬出来的。每个技能解决一件很具体的事，文档全中文，触发语也是日常说法，比如「C 盘满了」「跑一下洁癖」。

技能遵循 Agent Skills 开放标准，README 称 Claude Code、Codex、Qoder、Kimi Code、iFlow、CodeBuddy、Cursor 等支持该标准的工具都能装。截至 2026-10-10，GitHub 显示该仓库约 2.1 万 Star、2250 Fork，最近一次推送在 2026-10-01。

## 包含哪些 Skill

- **leader（领导）**：只做一件事——帮你定义目标。把一句没想清楚的需求变成一份目标任务书，交给智能体的目标模式长时间独立执行。它会先钻进代码库实际跑一遍命令做调研，再问你最多 5 个必须由你拍板的问题。任务书围绕「目标七问」展开：目的、完成态、证据、反作弊、地界、取舍、未知，其中特别强调写清「什么不能做」，防止 AI 为了达成指标走捷径（例如为了让测试通过而删掉测试）。
- **neat-freak（洁癖）**：一次会话干完活后运行 `/neat`，把这次改动与项目文档、`CLAUDE.md` / `AGENTS.md`、智能体记忆三层内容对齐，并检查规则里引用的路径是否还存在、必备文件有没有缺。所有删除只列候选清单，确认后才执行。
- **hv-analysis（横纵分析法）**：研究一个产品、公司、概念或人物。纵向讲清它从诞生到现在的演变，横向对比同期的主要竞品，最后产出一份排版好的 PDF 研究报告，README 称篇幅在一万到三万字。
- **storage-analyzer（清理垃圾）**：扫描 Mac / Windows 整机磁盘，在浏览器里打开交互式报告，按绿、黄、红三级给出清理建议，并说明每一项是什么、删了有什么影响。
- **aihot（AI HOT 资讯查询）**：用一句话查询 aihot.news 的每日 AI 日报、热点事件和分类动态，README 称无需 API Key。
- **khazix-writer（卡兹克写作）**：作者自己写公众号长文的风格规则与自检清单，立场鲜明，会拒绝一批常见套话。

## 怎么安装

README 给的安装方式是直接让智能体去装。在 Claude Code、Codex 等工具里说：

```text
帮我安装这个 skill：https://github.com/KKKKhazix/khazix-skills/tree/main/<skill-name>
```

把 `<skill-name>` 换成要装的技能目录名，例如 `neat-freak`、`hv-analysis`、`khazix-writer`，智能体会自己把它克隆到对应的技能目录。

README 没有提供 `npx skills`、插件市场或 claude.ai 网页版的安装命令。如果你用的工具不支持 Skill，README 的建议是把对应目录的 `SKILL.md` 全文下载下来，当作项目规则文件或直接贴进对话。

想手动放置的话，按官方文档的目录即可：Claude Code 的个人技能在 `~/.claude/skills/<技能名>/`，Codex 的用户级技能在 `~/.agents/skills/`。

## 怎么用

这些技能大多靠自然语言触发，README 列出的说法包括：

- leader：「帮我给 agent 写个目标」「写个 goal 提示词」「让 agent 自己跑这个项目」。产出是纯 Markdown 任务书，粘进 Claude Code 的 `/goal` 或 Codex 的目标模式即可；没有目标模式的工具直接粘贴发送也行。
- neat-freak：`/neat`，或者「把文档和记忆整理一下」「新人接手，帮我做个 clean handoff」。
- hv-analysis：「研究一下 Cursor 这家公司」「帮我做个竞品分析」。
- storage-analyzer：「帮我看看存储」「清理一下磁盘」。
- aihot：「今天 AI 圈有什么新东西」「最近一周的 AI 论文」。
- khazix-writer：「把这个素材写成长文」「帮我续写」。

## 适合谁 / 不适合谁

**适合：**
- 开始让智能体跑长时间任务、发现「目标没写清楚就白跑一夜」的开发者——leader 正对这个痛点；
- 项目文档和 `CLAUDE.md` 总是跟不上代码的人；
- 需要对一家公司或一个新概念做系统调研的内容作者、产品和投资从业者；
- 喜欢中文文档、想要少而精的技能的用户。

**不适合：**
- 想要覆盖完整开发流程的大型技能库的人；
- 想要通用文风的写作者——khazix-writer 是带个人风格和禁忌词的；
- 对让智能体扫描整机磁盘感到不放心的用户。

## 注意事项

- **许可证**：仓库 LICENSE 为 MIT。
- **维护状态**：最近一次推送 2026-10-01。
- **安全提醒**：技能可以带脚本、读写文件、执行命令。这个仓库需要点名的有三处：`storage-analyzer` 会扫描整机磁盘并在本机启动一个网页服务，删除操作要你在浏览器里点按钮并二次确认，README 说明 macOS 测试完整、Windows 首次使用要多留意，建议先只看报告不要急着删；`aihot` 会联网请求 aihot.news，查询内容由对方服务端处理；`neat-freak` 会修改项目文档和智能体记忆，运行前先提交代码，方便回看改了什么。
- **安装方式的风险**：让智能体「自己去装」等于授权它克隆并写入第三方内容，装之前自己先打开对应目录把 `SKILL.md` 和脚本读一遍。
- **兼容性**：README 没有给出各工具逐一验证的清单；leader 生成的任务书依赖所用工具是否有长程目标模式，效果因模型而异。
- 调研报告和资讯摘要由模型综合生成，引用前请核对原始出处。
