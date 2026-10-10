---
title: AGENTS.md 怎么写：规范、模板，以及 Cursor、Copilot、Trae、Kiro、Cline 各自怎么读
slug: agents-md-cross-tool-guide
products: [ai-tools, cursor]
models: []
accountTier: FREE
excerpt: AGENTS.md 是什么、怎么写？给一份可改写的中文模板，并按各家官方文档列出 Cursor、GitHub Copilot、Devin Desktop、Trae、Kiro、Cline、Gemini CLI 读取 AGENTS.md 的规则与差异，讲清一个仓库多种工具时怎么只维护一份。
checkedOn: 2026-10-11
sources:
  - https://agents.md/
  - https://cursor.com/docs/rules
  - https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/add-custom-instructions/add-repository-instructions
  - https://docs.github.com/en/copilot/concepts/agents/code-review
  - https://docs.devin.ai/desktop/cascade/memories
  - https://docs.trae.ai/ide/rules
  - https://kiro.dev/docs/steering
  - https://docs.cline.bot/customization/cline-rules
verify:
  - 各工具对 AGENTS.md 的支持细节更新较快，表格内容取自各家官方文档 2026-10-11 的版本
  - Claude Code 与 Codex 的读取规则见本站另一篇教程，本文不重复
  - 「6 万多个开源项目在用」是 AGENTS.md 官网首页的说法
---

> 本文根据 AGENTS.md 官网和 Cursor、GitHub Copilot、Devin Desktop、TRAE、Kiro、Cline 各自的官方文档整理，资料核对于 2026-10-11。Claude Code 的 CLAUDE.md 与 Codex 的读取细节，见本站[《CLAUDE.md 怎么写》](/guides/claude-md-agents-md)，本文侧重「一份文件给多种工具用」。

## 适用于谁

- 团队里有人用 Cursor、有人用 Copilot、有人用 Trae，不想每种工具维护一份规则的人；
- 搜「agents.md 怎么写」「agents.md 模板」「agents.md 规范」「agents.md 最佳实践」的人；
- 已经有 `.cursorrules`、`copilot-instructions.md`，想知道要不要迁到 AGENTS.md 的人。

## 结论先说

1. **AGENTS.md 是给编程智能体看的 README**：一个放在仓库里的普通 Markdown 文件，写构建步骤、测试命令和代码约定。没有必填字段，标题随意。
2. 它是开放格式，官网称已有 6 万多个开源项目使用，现由 Linux 基金会下的 Agentic AI Foundation 管理。
3. **通用规则**：放在仓库根目录；大仓库可以在子目录里再放，**离被编辑文件最近的那份优先**；你在对话里的明确指示高于一切。
4. 主流工具大多**自动读取**，但有例外：**Trae 要手动打开开关**，Gemini CLI 和 Aider 要改配置。
5. 推荐做法：**通用约定只写在 AGENTS.md 里**，各工具专属的规则文件只放该工具独有的内容。

## 各工具怎么读 AGENTS.md

| 工具 | 是否自动读取 | 读哪些位置 | 官方说明的要点 |
| --- | --- | --- | --- |
| Cursor | 是 | 项目根目录和子目录 | 作为 `.cursor/rules` 的简单替代；子目录的指令与上级合并，越具体越优先 |
| GitHub Copilot | 是 | 仓库内任意位置，可多份 | 目录树里最近的一份优先；根目录下单独一份 `CLAUDE.md` 或 `GEMINI.md` 也可作为智能体指令 |
| Devin Desktop（原 Windsurf） | 是 | 工作区任意目录 | 与规则共用同一套引擎：根目录的始终生效，子目录的只对该目录生效 |
| Kiro | 是 | 工作区根目录、子目录、`~/.kiro/steering/` | 不支持加载方式设置，**始终加载** |
| Cline | 是 | `AGENTS.md`、`~/.agents/AGENTS.md` | 与 `.cursorrules`、`.windsurfrules` 一样自动识别，可在 Rules 面板里单独开关 |
| Trae | **否，需打开开关** | 项目根目录；子目录模块下的也可 | 设置 > 规则与记忆 > 导入设置里打开「将 AGENTS.md 包含在上下文中」 |
| Gemini CLI | 需配置 | — | 在 `.gemini/settings.json` 里设置 `{"context": {"fileName": "AGENTS.md"}}` |
| Aider | 需配置 | — | 在 `.aider.conf.yml` 里写 `read: AGENTS.md` |
| Claude Code / Codex | 见另一篇 | — | [《CLAUDE.md 怎么写》](/guides/claude-md-agents-md) |

## 写什么

官网列出的常见小节：项目概览、构建和测试命令、代码风格、测试说明、安全注意事项；再加上提交信息和 PR 规范、安全上的坑、部署步骤——**任何你会告诉新同事的东西**。

一份可以直接改写的中文模板：

```markdown
# AGENTS.md

## 项目概览
Next.js 14 + TypeScript 的电商后台；数据库 Prisma + MySQL；包管理用 pnpm。

## 常用命令
- 安装依赖：`pnpm install`
- 本地启动：`pnpm dev`
- 类型检查：`pnpm typecheck`
- 单元测试：`pnpm test`；只跑一个用例：`pnpm vitest run -t "用例名"`

## 代码约定
- TypeScript 严格模式；组件用具名导出
- 金额一律用「分」为单位的整数
- 新接口先写入参校验，再写业务逻辑

## 测试要求
- 改了代码就要补或改对应的测试，即使没人要求
- 提交前类型检查和测试必须全部通过

## 不要碰
- `src/generated/`、`prisma/migrations/` 下的已有文件
- 任何 `.env*` 文件；需要新的环境变量时告诉我，不要自己写

## 提交与 PR
- 提交信息用中文，格式「类型: 简述」
- 一个 PR 只做一件事
```

官网 FAQ 里有一条值得知道：**写在 AGENTS.md 里的测试命令，智能体会自动去跑**——它会尝试执行相关检查，并在结束任务前修复失败项。所以命令要写准确、可直接执行。

## 写多长、怎么分

- **只写会被反复用到的**。几家官方的建议是一致的：Cursor 说规则应聚焦、可执行，不要照抄整份代码规范（交给 linter）；GitHub 给 cloud agent 生成指令的提示词把篇幅限制在两页以内。
- **大仓库用嵌套**。在每个子包里放一份 AGENTS.md，智能体读最近的那份。官网举例说 OpenAI 的主仓库里有 88 个 AGENTS.md。
- **当作活文档**。智能体反复犯同一个错，就把纠正写进去。

```text
project/
  AGENTS.md              # 全局约定
  frontend/
    AGENTS.md            # 前端专属
  backend/
    AGENTS.md            # 后端专属
```

## 一个仓库多种工具：只维护一份

**第一层：AGENTS.md 放通用内容**。命令、目录、约定、禁区——换任何工具都成立的东西。

**第二层：各工具的专属文件只放专属内容**。

| 工具 | 专属文件 | 适合放什么 |
| --- | --- | --- |
| Cursor | `.cursor/rules/*.mdc` | 需要按 glob 生效或手动 @ 的规则（AGENTS.md 做不到） |
| GitHub Copilot | `.github/copilot-instructions.md`、`.github/instructions/*.instructions.md` | 代码审查的关注点、按路径生效的规则 |
| Kiro | `.kiro/steering/*.md` | 需要 fileMatch / manual / auto 加载方式的规则 |
| Trae | `.trae/rules/*.md` | 按文件或场景生效的规则、提交信息规则 |
| Claude Code | `CLAUDE.md` | 第一行写 `@AGENTS.md` 导入，下面只补 Claude 专属内容 |

GitHub 官方文档对这种分工有一句很好的概括：`copilot-instructions.md` 是「Copilot，在这个仓库里始终记住这些」，`AGENTS.md` 是「任何智能体都记住这些」。

**从旧文件迁移**：官网给的做法是改名并留一个符号链接保持兼容，例如：

```bash
mv AGENT.md AGENTS.md && ln -s AGENTS.md AGENT.md
```

Cline 会自动识别 `.cursorrules` 和 `.windsurfrules`，Devin Desktop 仍读取旧的 `.windsurfrules`，所以迁移可以慢慢来，不必一次改完。

## 常见问题

**Q：指令冲突时听谁的？**
离被编辑文件最近的 AGENTS.md 优先；你在对话里明确说的话高于文件。工具自己的规则文件和 AGENTS.md 之间的优先级各家不同（例如 Cursor 是团队规则 → 项目规则 → 用户规则依次合并），所以最好的办法是**不要让它们写同一件事**。

**Q：AGENTS.md 里能放密钥、内部地址吗？**
不要。它会随仓库提交，也会被原样送进模型上下文。需要的凭据放环境变量，文件里只写变量名。

**Q：别人仓库里的 AGENTS.md 可以直接信吗？**
要先看一眼。它就是会被智能体执行的指令，来历不明的仓库里可能写着让智能体执行危险命令的内容。Kiro 的文档在讲多仓库任务时专门提醒：只选你信任的仓库，因为智能体会遵循仓库里的指示。更多见[《AI 编程安全注意事项》](/guides/ai-coding-security-secrets-permissions)。

**Q：有没有现成的规则和技能可以参考？**
本站的 [Skill 库](/skills) 收录了一批公开的技能与规则仓库，可以按语言和用途挑着看，再改成适合自己项目的版本。

## 参考资料

- AGENTS.md 官网：https://agents.md/
- Rules（Cursor 官方）：https://cursor.com/docs/rules
- Adding repository custom instructions for GitHub Copilot（GitHub 官方）：https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/add-custom-instructions/add-repository-instructions
- Memories & Rules（Devin Desktop 官方）：https://docs.devin.ai/desktop/cascade/memories
- 规则（Rule）（TRAE 官方）：https://docs.trae.ai/ide/rules
- Steering（Kiro 官方）：https://kiro.dev/docs/steering
- Rules（Cline 官方）：https://docs.cline.bot/customization/cline-rules
