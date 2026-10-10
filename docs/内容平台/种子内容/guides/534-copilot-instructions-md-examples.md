---
title: copilot-instructions.md 怎么写：用途、范例、按路径生效的 instructions 文件与 AGENTS.md 的区别
slug: copilot-instructions-md-examples
products: [github-copilot]
models: []
accountTier: FREE
excerpt: copilot-instructions.md 是什么、放哪、怎么写？按 GitHub 官方文档讲清仓库级指令、.github/instructions 下按路径生效的 *.instructions.md（applyTo / excludeAgent）、AGENTS.md 三者的分工，附可改写的中文范例与不生效排查。
checkedOn: 2026-10-11
sources:
  - https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/add-custom-instructions/add-repository-instructions
  - https://docs.github.com/en/copilot/how-tos/copilot-in-your-ide/customize-copilot/configure-custom-instructions/add-repository-instructions-in-your-ide
  - https://docs.github.com/en/copilot/concepts/agents/code-review
  - https://code.visualstudio.com/docs/copilot/setup
  - https://github.com/agentsmd/agents.md
verify:
  - 各 IDE、各功能对三类指令文件的支持范围不完全相同，以官方《About customizing GitHub Copilot responses》里的支持表为准
  - 文中范例为按官方格式自拟的中文示例，不是官方原文
---

> 本文根据 GitHub 官方文档《Adding repository custom instructions for GitHub Copilot》和《About GitHub Copilot code review》整理，资料核对于 2026-10-11。

## 适用于谁

- 想让 Copilot 记住「这个项目怎么构建、怎么测试、有哪些约定」的人；
- 搜「copilot-instructions.md 范例」「copilot-instructions.md 用途」「copilot-instructions.md vs agents.md」的人；
- 同时用 Copilot、Cursor、Claude Code，不想维护三份规则的人。

## 结论先说

1. **`.github/copilot-instructions.md`** 是仓库级的 Copilot 指令：一份 Markdown，保存后**自动附加**到这个仓库里的 Copilot 请求上。
2. 想让规则只对某些文件生效，用 **`.github/instructions/` 下的 `名称.instructions.md`**，在 frontmatter 里用 `applyTo` 写 glob。
3. **`AGENTS.md`** 是跨工具通用的智能体指令，Copilot 也读；离被处理文件最近的那一份优先。仓库根目录下单独一份 `CLAUDE.md` 或 `GEMINI.md` 也可以被当作智能体指令。
4. 官方一句话分工：`copilot-instructions.md` 是「Copilot，在这个仓库里始终记住这些」；路径指令是「在这些路径下始终记住这些」；`AGENTS.md` 是「任何智能体都记住这些」；skills 是「需要时才做这件事」。
5. 多种指令会**同时提供**给 Copilot，优先级是：个人指令 > 仓库指令 > 组织指令。尽量别写互相矛盾的内容。

## 三类文件对照

| | copilot-instructions.md | *.instructions.md | AGENTS.md |
| --- | --- | --- | --- |
| 位置 | `.github/copilot-instructions.md` | `.github/instructions/**/名称.instructions.md` | 仓库任意位置，可多份 |
| 生效方式 | 自动，整个仓库 | 改动的文件匹配 `applyTo` 时自动 | 自动，最近的一份优先 |
| 适合写 | 编码规范、架构默认做法、测试要求 | 某目录 / 某语言 / 某类文件的专门规则 | 希望 Copilot 以外的工具也遵守的约定 |
| 谁会读 | 只有 Copilot | 只有 Copilot | 支持该约定的各家智能体 |

## 写法一：仓库级 copilot-instructions.md

1. 在仓库根目录建 `.github/copilot-instructions.md`（没有 `.github` 目录就新建）；
2. 用自然语言、Markdown 格式写指令。指令之间的空白会被忽略，所以写成一段、每条一行、或用空行隔开都可以。

一份可以直接改写的中文范例：

```markdown
# 项目说明
这是一个 Next.js 14 + TypeScript 的电商后台，数据库用 Prisma + MySQL。

## 构建与验证
- 安装依赖：pnpm install（不要用 npm）
- 类型检查：pnpm typecheck；单元测试：pnpm test
- 提交前必须保证以上两条都通过

## 目录
- src/app：页面与路由；src/lib：业务逻辑；prisma/：数据模型
- 不要修改 src/generated/ 下的生成文件

## 约定
- 金额一律用「分」为单位的整数，不用浮点数
- 新接口先写 zod 校验，再写处理逻辑
- 回答和代码注释使用简体中文
```

官方的建议是让 Copilot 自己生成初稿：在 github.com/copilot/agents 选中仓库，贴上官方提供的「onboard 仓库」提示词，cloud agent 会通读仓库后提交一份 `copilot-instructions.md`。那段提示词里的两条限制很值得照搬——**不超过两页、不写与具体任务相关的内容**；目标是让智能体少走弯路：少因为构建或 CI 失败被打回、少花时间到处搜索。在 VS Code 里，登录后在聊天中输入 `/init` 也能生成起步版本。

## 写法二：按路径生效的 instructions 文件

1. 建目录 `.github/instructions`（可以再分子目录）；
2. 新建文件，文件名**必须以 `.instructions.md` 结尾**；
3. 文件开头写 frontmatter，用 `applyTo` 指定 glob；多个模式用逗号分隔：

```markdown
---
applyTo: "**/*.ts,**/*.tsx"
---
- 组件用具名导出
- 不使用 any；确实需要时写明原因
```

常用 glob：`**/*.py` 递归匹配所有目录下的 py 文件；`src/*.py` 只匹配 src 目录这一层；`src/**/*.py` 递归匹配 src 下所有层级。

4. 可选：用 `excludeAgent` 让某个功能不读这份文件，取值 `"code-review"` 或 `"cloud-agent"`：

```markdown
---
applyTo: "**"
excludeAgent: "code-review"
---
```

上面这份只给 cloud agent 用。不写 `excludeAgent` 时，代码审查和 cloud agent 都会用。官方注明：在 GitHub.com 上，路径指令目前只有 cloud agent 和代码审查支持。

当某个文件同时命中路径指令和仓库级指令时，**两份都会用上**。

## 写法三：AGENTS.md

可以在仓库里放一份或多份 `AGENTS.md`。Copilot 工作时，目录树里离得最近的那份优先。适合放「换任何工具都成立」的内容：怎么装依赖、怎么跑测试、目录结构、提交规范。跨工具共用的详细做法见[《AGENTS.md 怎么写》](/guides/agents-md-cross-tool-guide)；Claude Code 这边的写法见[《CLAUDE.md 怎么写》](/guides/claude-md-agents-md)。

一个实用的分法：**通用约定写进 AGENTS.md，只有 Copilot 才需要的（比如代码审查的关注点）写进 copilot-instructions.md**，避免同一句话维护两遍。

## 怎么确认生效了

- 指令文件一保存就可用，会自动加进你提交给 Copilot 的请求；
- 在 github.com/copilot 的聊天里，把包含指令文件的仓库作为附件加入对话；
- 展开回答顶部的 **References（引用）**列表，看里面有没有 `.github/copilot-instructions.md`——列出来了就说明这次用上了。

## 常见问题

**Q：代码审查没按我的指令来？**
代码审查默认启用自定义指令，但可以在仓库 **Settings → Copilot → Code review** 里被关掉，检查「Use custom instructions when reviewing pull requests」开关。另外官方说明：审查 PR 时读的是**源分支（head）**上的指令文件，所以可以在同一个 PR 里改指令并立刻看到效果。

**Q：写多长合适？**
官方给 cloud agent 的生成提示词限制在两页以内。越长占用上下文越多，也越容易自相矛盾。

**Q：个人偏好（比如总是用中文回答）写哪？**
写个人指令（personal instructions），它优先级最高，而且不会影响同事。

**Q：回答质量变差，怀疑是指令冲突？**
官方建议尽量避免冲突的指令；排查时可以临时关闭仓库指令对比效果。

## 参考资料

- Adding repository custom instructions for GitHub Copilot（GitHub 官方）：https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/add-custom-instructions/add-repository-instructions
- Adding repository custom instructions in your IDE（GitHub 官方）：https://docs.github.com/en/copilot/how-tos/copilot-in-your-ide/customize-copilot/configure-custom-instructions/add-repository-instructions-in-your-ide
- About GitHub Copilot code review（GitHub 官方，含四类定制方式对照表）：https://docs.github.com/en/copilot/concepts/agents/code-review
- agentsmd/agents.md 仓库：https://github.com/agentsmd/agents.md
