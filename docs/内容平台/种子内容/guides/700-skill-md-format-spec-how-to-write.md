---
title: SKILL.md 怎么写：格式规范、frontmatter 字段与范例（按 Agent Skills 官方规范）
slug: skill-md-format-spec-how-to-write
products: [ai-tools, claude]
models: []
topics: [ai-agent]
accountTier: FREE
excerpt: SKILL.md 是什么格式、怎么写？按 agentskills.io 官方规范讲清 frontmatter 的六个字段、name 与 description 的硬性限制、正文该写什么不该写什么，附一份可以照着改的范例和校验命令。
checkedOn: 2026-10-11
sources:
  - https://agentskills.io/specification
  - https://agentskills.io/skill-creation/best-practices
  - https://agentskills.io/skill-creation/optimizing-descriptions
  - https://code.claude.com/docs/en/skills
verify:
  - allowed-tools 字段在规范里标注为实验性，各工具支持情况不同
  - skills-ref 校验工具的安装方式以其仓库 README 为准，本文只写了规范页给出的校验命令
---

> 本文根据 Agent Skills 开放规范（agentskills.io）的《Specification》《Best practices for skill creators》和 Claude Code 官方文档整理，资料核对于 2026-10-11。Skill 是什么、在各产品里怎么装，见本站[《Claude Skills 是什么、怎么装》](/guides/claude-skills)和[《ChatGPT Skills 怎么用》](/guides/chatgpt-skills)。

## 适用于谁

- 搜「skill.md 怎么写」「skill.md 格式」「skill.md 规范」「skill.md 范例」的人；
- 想把一套固定做法写成 Skill，但不清楚 frontmatter 里哪些字段必填、有什么限制的人；
- 写好的 Skill 在一个工具里能用、换一个工具就报错的人。

## 结论先说

1. **SKILL.md = YAML frontmatter + Markdown 正文**。frontmatter 里只有 `name` 和 `description` 两个字段是必填的。
2. **`name` 有硬性规则**：最多 64 个字符，只能用小写字母、数字和连字符，不能以连字符开头或结尾，不能有连续连字符，并且要和所在文件夹同名。
3. **`description` 最多 1024 个字符**，要同时写清「做什么」和「什么时候用」。智能体平时只看得到它，Skill 会不会被用上基本取决于这一段。
4. **正文没有格式限制**，但官方建议控制在 500 行以内、约 5000 token 以内，细节挪到单独的参考文件里。
5. **想跨工具通用，frontmatter 只用规范里的六个字段**。各工具自己加的字段换个地方可能直接报错。

## 一、最小的 SKILL.md

一个 Skill 是一个文件夹，里面至少有一个 `SKILL.md`。规范给的最小写法：

```markdown
---
name: skill-name
description: A description of what this skill does and when to use it.
---
```

frontmatter 后面接 Markdown 正文，也就是给智能体看的操作说明。Claude Code 的文档还补了一条容易踩的细节：开头的 `---` 必须是文件的第一行。

## 二、frontmatter 的六个字段

| 字段 | 必填 | 限制与用途 |
| --- | --- | --- |
| `name` | 是 | 最多 64 字符；小写字母、数字、连字符 |
| `description` | 是 | 1–1024 字符；说明做什么、什么时候用 |
| `license` | 否 | 许可证名称，或指向随 Skill 附带的许可证文件 |
| `compatibility` | 否 | 最多 500 字符；说明环境要求（面向哪个产品、需要哪些系统包、是否要联网） |
| `metadata` | 否 | 字符串到字符串的键值表，放规范之外的附加信息，如作者、版本 |
| `allowed-tools` | 否 | 用空格分隔的、预先批准可用的工具列表（实验性，各工具支持不一） |

带可选字段的官方示例：

```markdown
---
name: pdf-processing
description: Extract PDF text, fill forms, merge files. Use when handling PDFs.
license: Apache-2.0
metadata:
  author: example-org
  version: "1.0"
---
```

规范特别说明：大多数 Skill 不需要 `compatibility`，只有确实对环境有要求时才写，例如「Requires git, docker, jq, and access to the internet」。

## 三、name 的规则

规范列出的全部要求：

- 1–64 个字符；
- 只能包含小写字母 `a-z`、数字 `0-9` 和连字符 `-`；
- 不能以连字符开头或结尾；
- 不能出现连续的连字符 `--`；
- **必须和上级目录名一致**。

所以 `PDF-Processing`（有大写）、`-pdf`（连字符开头）、`pdf--processing`（连续连字符）都不合规。中文名、带空格或下划线的名字同样不符合字符要求，起名时直接用英文短语加连字符，如 `weekly-report`、`code-review`。

## 四、description 怎么写

规范的要求是三条：1–1024 字符、同时描述做什么和什么时候用、包含能帮智能体识别相关任务的具体关键词。

官方给的一好一坏：

```yaml
# 好
description: Extracts text and tables from PDF files, fills PDF forms, and merges multiple PDFs. Use when working with PDF documents or when the user mentions PDFs, forms, or document extraction.

# 差
description: Helps with PDFs.
```

《Optimizing skill descriptions》里还有四条写法建议：

- **用祈使句**，写成「Use this skill when...」而不是「This skill does...」；
- **写用户想达成什么**，而不是 Skill 内部怎么实现；
- **宁可写得主动一点**，把用户没有直接说出领域名称的场景也列进去；
- **保持简短**，几句话到一小段，装了很多 Skill 时描述太长会挤占上下文。

description 写不好导致 Skill 不被调用，是最常见的问题，排查办法见[《Skill 不触发怎么办》](/guides/skill-not-triggering-description-optimize)。

## 五、正文写什么

规范对正文没有格式要求，推荐包含三类内容：分步骤的说明、输入输出的例子、常见的边界情况。要注意的是，智能体一旦决定启用某个 Skill，就会把整份 `SKILL.md` 读进上下文，所以写多了是有代价的。

官方最佳实践里几条最实用的原则：

**只写智能体不知道的。** 不需要解释 PDF 是什么、HTTP 怎么工作。对每一段内容问一句：没有这条说明，智能体会做错吗？不会就删掉。该写的是项目特有的约定、领域流程、不明显的坑、指定要用的工具或接口。

**给默认做法，不要给菜单。** 「可以用 pypdf、pdfplumber、PyMuPDF 或 pdf2image」不如「用 pdfplumber 提取文本；扫描件需要 OCR 时改用 pdf2image 加 pytesseract」。

**教方法，不要给某一次的答案。** 「把 orders 表和 customers 表按 customer_id 关联，筛选 EMEA 区域」只对这一次有用；「先读 schema 文件找到相关的表，再按外键约定关联，再把用户的条件写成筛选」才可以复用。

**按任务的脆弱程度决定写多死。** 多种做法都行的地方，说明目的、让智能体自己判断；顺序不能错、命令不能改的地方（比如数据库迁移），就写「严格按以下命令执行，不要增删参数」。

**专门留一节「注意事项」（Gotchas）。** 官方认为这往往是一个 Skill 里价值最高的部分：那些违反直觉的环境事实，例如「users 表是软删除，查询必须带 `WHERE deleted_at IS NULL`」。智能体每犯一次需要你纠正的错，就往这里加一条。

**要固定输出格式就给模板。** 比起用文字描述格式，直接给一份带占位符的模板更可靠。

**多步骤流程用清单，关键步骤后做校验。** 让智能体做完之后跑一遍校验脚本或对照检查表，不通过就修到通过为止。

## 六、一份可以照着改的范例

下面是按规范写的一个示例（内容为演示）：

```markdown
---
name: weekly-report
description: Write the team's weekly report in the fixed four-section format. Use when the user asks for a weekly report, a week summary, or wants to turn notes or commit logs into a status update, even if they do not say "weekly report".
metadata:
  author: your-team
  version: "1.0"
---

# 周报

## 步骤
1. 向用户确认本周的起止日期；用户已提供材料时不要重复询问。
2. 把材料归入下面四个部分，每部分不超过 5 条。
3. 每一条以结果开头，写清数字或交付物，不写过程。

## 输出模板
### 本周完成
### 进行中
### 风险与需要的支持
### 下周计划

## 注意事项
- 没有材料支撑的内容不要编写，标注「待补充」。
- 涉及客户名称时使用内部代号，见 references/customers.md。
```

description 用英文还是中文，规范没有限制；写哪种语言，以你平时提需求的语言为准。

## 七、各工具额外支持的字段

规范只定义了上面六个字段，各工具会在此基础上扩展。例如 Claude Code 额外支持 `disable-model-invocation`、`user-invocable`、`context`、`paths` 等十几个字段，用来控制谁能调用、是否放到子代理里运行。

这些扩展字段换个地方不一定认。Claude Code 文档写明：在 Claude Code 之外（上传到 claude.ai、Skills API 等），frontmatter 只接受 `name`、`description`、`license`、`compatibility`、`metadata`、`allowed-tools`，出现其他键会直接报错，形如 `Unexpected key(s) in SKILL.md frontmatter: argument-hint.`。

所以要分发给别人或者跨工具使用的 Skill，frontmatter 只留规范字段；工具专属的字段只写在自己用的那一份里。

## 八、写完之后校验

规范页给出了参考校验工具 skills-ref 的用法：

```bash
skills-ref validate ./my-skill
```

它检查 frontmatter 是否合法、命名是否符合约定。安装方式见其仓库说明。

## 常见问题

**Q：提示 frontmatter 缺少 name 或 description 怎么办？**
先看三处：`---` 是不是文件第一行、YAML 缩进和冒号后的空格是否正确、description 里有没有未加引号的冒号。Claude Code 文档说明，YAML 写错时 Skill 仍会加载，但所有字段都是空的，表现为可以手动调用、却不会被自动选中。

**Q：description 太长写不下怎么办？**
1024 字符是硬上限。把「什么时候用」放在最前面，细节放正文。

**Q：正文超过 500 行了？**
把详细的参考资料挪到 `references/` 下的单独文件，并在 `SKILL.md` 里写明什么情况下去读哪个文件。目录怎么组织见[《Skill 目录结构怎么组织》](/guides/skill-directory-structure-scripts-references)。

**Q：可以让 AI 帮我写 Skill 吗？**
可以，但官方提醒不要让模型凭通用知识凭空生成，那样只会得到「妥善处理错误」「遵循最佳实践」这类空话。更好的做法是先和智能体把一个真实任务做完，再把过程中有效的步骤、你做过的纠正、输入输出格式提炼成 Skill。

## 参考资料

- Specification（Agent Skills 官方规范）：https://agentskills.io/specification
- Best practices for skill creators：https://agentskills.io/skill-creation/best-practices
- Optimizing skill descriptions：https://agentskills.io/skill-creation/optimizing-descriptions
- Extend Claude with skills（Claude Code 官方文档）：https://code.claude.com/docs/en/skills
