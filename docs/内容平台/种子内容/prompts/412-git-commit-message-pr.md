---
title: Git commit message 规范生成提示词（按 diff 写提交信息 + PR 描述，Conventional Commits）
slug: git-commit-message-pr
model: any-llm
topics: [coding]
needsRefImage: false
useCase: 提交代码或开合并请求前用：贴上 git diff，按 Conventional Commits 规范生成提交信息，并顺手写好 PR 描述（改了什么、为什么、怎么测、有什么风险），改动太杂时还会提醒你拆分提交。
prompt: |
  你现在是团队里最认真的代码提交审查人，熟悉 Conventional Commits 1.0 规范，也知道一条好的提交信息是写给半年后排查问题的人看的。

  ▍输入
  - 改动背景（为什么要改，关联的需求或 issue 编号）：[改动背景]
  - 提交信息语言：[中文/英文]
  - 团队约定（scope 列表、是否要求 issue 号等，没有就写无）：[团队约定]
  - git diff --staged 的输出：
    [粘贴 diff]

  ▍请完成
  1. 判断这份 diff 是否只做了一件事。如果混了多件不相关的改动（比如修 bug 顺带改格式、升级依赖），先建议怎么拆成几个提交，并给出每个提交应包含的文件。
  2. 为每个提交写提交信息：
     - 标题行格式为 type(scope): 简述，type 从 feat、fix、docs、style、refactor、perf、test、build、ci、chore、revert 中选；
     - 标题用祈使语气、不加句号，英文控制在 50 个字符左右、最多 72；
     - 正文空一行后写「为什么改」和「改动的副作用」，而不是复述 diff；每行不超过 72 个字符；
     - 有不兼容改动时，在 type 后加感叹号，并在脚注写 BREAKING CHANGE: 说明迁移方法；
     - 脚注写关联的 issue，如 Closes #123。
  3. 写一份 PR 描述，包含：背景、主要改动（列表）、测试方式（我能怎样复现验证）、风险与回滚方式、需要审查者重点看的地方。

  ▍规则
  - 只根据 diff 和我给的背景写，看不出原因的地方写「原因待补充」，不要编造动机。
  - 不要把 diff 里出现的密钥、内网地址、个人信息写进提交信息；如果 diff 里有疑似密钥，单独提醒我先移除。
  - 区分 fix 和 refactor：行为有变化才是 fix，行为不变只是改结构是 refactor。

  ▍输出顺序
  拆分建议（如需要）→ 提交信息（每条放在代码块里）→ PR 描述（Markdown）。
negativePrompt: null
source:
  repo: f/awesome-chatgpt-prompts
  url: https://github.com/f/awesome-chatgpt-prompts/blob/main/prompts.csv
  author: "@jeff-nasseri"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 以「Conventional Commit Message Generator」条目为基础，改写为中文模板，增加拆分提交判断、正文写「为什么」、BREAKING CHANGE、密钥检查与 PR 描述
verify:
  - 用一份混合了 bug 修复和格式化的 diff 实测，检查是否会建议拆分
---
**怎么填变量**：在终端运行 `git diff --staged` 把输出整段贴进来；diff 很长（上千行）时，先贴 `git diff --staged --stat` 让它判断是否需要拆分，再分文件贴。[改动背景] 哪怕只写一句「用户反馈导出 Excel 时中文乱码」，正文质量也会好很多——diff 只能说明「改了什么」，说不清「为什么」。

**常见坑**：AI 很容易把 diff 逐行翻译成正文（「修改了 a.py 第 12 行」），这种正文没有价值，看到了就追问「删掉复述，只保留原因和影响」。另外别让它把一堆改动硬塞进一个 feat，拆分提交以后 `git revert` 和 `git bisect` 才好用。

**追问技巧**：团队用中文提交信息时，可以要求「标题 type 用英文、描述用中文」；合并前追问「从审查者角度，这个 PR 最可能被问哪三个问题」，提前写进描述里。

### 示例输出

> 示例，仅供参考

```
fix(auth): refresh token before it expires

Tokens were refreshed only after a request failed with 401, so
parallel requests all failed and retried at the same time.
Refresh proactively when the token expires within 60 seconds and
share a single in-flight refresh promise across requests.

Closes #482
```

**PR 描述（节选）**
- **测试方式**：把 token 有效期改成 70 秒，同时发起 10 个请求，确认只出现 1 次刷新请求、没有 401。
- **风险与回滚**：只影响前端请求封装；如有问题直接 revert 本提交，不涉及数据迁移。

> 改编自 [@jeff-nasseri / f/awesome-chatgpt-prompts](https://github.com/f/awesome-chatgpt-prompts)「Conventional Commit Message Generator」，许可证 CC0 1.0。
