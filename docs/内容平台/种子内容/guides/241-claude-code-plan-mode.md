---
title: Claude Code Plan 模式怎么用：先出方案再改代码
slug: claude-code-plan-mode
products: [claude]
models: []
accountTier: PLUS
excerpt: Claude Code 的 plan 模式（计划模式）只研究、不改代码，批准方案后才动手。本文讲怎么进入和退出、批准方案的三个选项、Ctrl+G 编辑方案、设为默认、和 auto 模式的关系，以及什么时候不必用。
checkedOn: 2026-10-07
sources:
  - https://code.claude.com/docs/en/permission-modes
  - https://code.claude.com/docs/en/best-practices
  - https://code.claude.com/docs/en/common-workflows
  - https://code.claude.com/docs/en/vs-code
  - https://code.claude.com/docs/en/model-config
---

> 本文根据 Claude Code 官方文档《Choose a permission mode》中的 plan mode 一节和《Best practices for Claude Code》整理，核对日期 2026-10-07。

## 适用于谁

- 怕 Claude Code 一上来就改一大堆文件、想先看方案的人；
- 搜「claude code plan mode 怎么用」「plan mode 是什么」「计划模式」的人；
- 想知道 plan 模式和 auto 模式该怎么配合的人。

## 结论先说

1. **plan 模式 = 只研究、不改源码**：Claude 会读文件、运行探索性的命令、写出实施方案，但在你批准方案之前不会动你的代码。
2. 进入方式三种：按 `Shift+Tab` 直到状态栏显示 `⏸ plan mode on`；在单条消息前加 `/plan`；启动时 `claude --permission-mode plan`。
3. 方案写好后有三个选择：**批准并用 auto 模式执行**、**批准但逐个确认改动**、**继续修改方案**。按 `Ctrl+G` 可以在编辑器里直接改方案。
4. 官方的推荐流程是「**探索 → 计划 → 实现 → 提交**」，但也提醒：一句话能说清的小改动（改错别字、加一行日志、改变量名）直接做，不必走 plan。
5. 想规划时用更强的模型、执行时用更省的模型，可以用 `opusplan`。

## 步骤

### 1. 进入 plan 模式

**会话中：**按 `Shift+Tab` 循环切换，直到输入框下方显示 `⏸ plan mode on`。（从 auto 出发的顺序是 manual → accept edits → plan。）

**只对这一条消息：**

```text
/plan 修复 session 过期后登录失败的问题
```

**启动时：**

```bash
claude --permission-mode plan
```

**VS Code：**点输入框底部的模式标识选 Plan，或者输入 `/plan`。VS Code 会把方案作为完整的 Markdown 文档打开，你可以在里面写行内批注再反馈给 Claude。

### 2. 让它探索并写方案

官方示例的两步提问（翻译改写）：

```text
阅读 /src/auth，搞清楚我们是怎么处理 session 和登录的；
再看看密钥类的环境变量是怎么管理的。
```

```text
我想加上 Google OAuth 登录。需要改哪些文件？session 的流程是怎样的？
请写一份实施方案。
```

plan 模式下，Claude 运行命令的规则：

- auto 模式可用、且 `useAutoModeDuringPlan` 开着（默认开）时，探索性的命令由分类器审核，通过就执行，不用你逐个点；
- auto 模式不可用时，除内置只读命令外的命令都会询问你。

它在 plan 模式下调研时，通常会把大量读代码的工作交给内置的 Plan 子代理，这些输出留在子代理自己的上下文里，不会塞满主对话。

### 3. 审阅和修改方案

方案写好后 Claude 会问你怎么继续：

| 选项 | 效果 |
| --- | --- |
| Yes, and use auto mode | 批准，切到 auto 模式开始执行（auto 不可用时显示为「Yes, auto-accept edits」） |
| Yes, manually approve edits | 批准，但每一处改动都要你确认 |
| No, keep planning | 留在 plan 模式，告诉 Claude 要改方案的哪里 |

- 按 **`Ctrl+G`** 在默认文本编辑器里直接编辑方案，改完再让 Claude 执行；
- 不想批准、只想退出 plan 模式：再按 `Shift+Tab`；
- 批准后会话会自动根据方案起一个标题（如果你还没命名）；
- 开启设置 `showClearContextOnPlanAccept` 后，会多一个「批准并清空规划阶段上下文」的选项，适合规划聊得很长的情况。

批准方案后 plan 模式就结束了。想再规划一次，按 `Shift+Tab` 切回，或在下一条消息前加 `/plan`。

### 4. 按方案实现并验证

官方示例：

```text
按你的方案实现 OAuth 流程。给回调处理函数写测试，运行测试套件并修复失败的用例。
```

```text
用清楚的提交说明提交，并开一个 PR。
```

一个好习惯：让 Claude 在实现时**对照方案**，并给它一个能自己运行的检查（测试、构建、截图对比），它就能自己发现问题、自己修。

### 5. 把 plan 设为默认（可选）

想让某个项目每次都从 plan 模式开始，在项目的 `.claude/settings.json` 里写：

```json
{
  "permissions": {
    "defaultMode": "plan"
  }
}
```

注意 VS Code 扩展不读项目设置里的起始模式，需要在 VS Code 用户设置里把 `claudeCode.initialPermissionMode` 设成 `plan`。

## 用 opusplan：规划用 Opus、执行用 Sonnet

```text
/model opusplan
```

plan 模式下用 Opus 做复杂推理和架构决策，批准后自动切到 Sonnet 写代码。切换模型的更多用法详见本站《Claude Code 切换模型：/model 命令、模型别名、effort 与 fast 模式》。

## 什么时候用、什么时候不用

**适合用 plan 模式（官方说法）：**

- 你不确定该怎么做；
- 改动会涉及多个文件；
- 你对要改的代码不熟悉。

**不必用：**范围明确的小改动。官方的判断标准很直接——**如果你能用一句话描述出这个 diff，就跳过计划**，直接让 Claude 做。plan 模式有用，但也有额外开销。

对于更大的功能，官方还推荐一个进阶做法：先让 Claude「采访」你——用 AskUserQuestion 工具问清技术实现、交互、边界情况和取舍，然后把完整需求写进 `SPEC.md`，再**开一个新会话**照着 SPEC 去实现，新会话的上下文干净、专注于执行。

## plan 模式和其他模式的关系

| 模式 | 会不会改代码 |
| --- | --- |
| plan | 批准方案前不改源码 |
| Manual | 会改，但每次都问你 |
| acceptEdits | 自动改文件，你事后用 `git diff` 复查 |
| auto | 自动执行，分类器在后台把关 |

plan 是「先想后做」的那一步，批准后通常接 auto 或 Manual 去执行。各模式的详细区别和权限规则写法，详见本站《Claude Code 权限模式详解：auto、手动、plan、bypass 与权限规则配置》。

## 常见问题

**Q：plan 模式下 Claude 真的一个文件都不会改吗？**
批准方案前，源码编辑会被拦下。唯一的例外是：在交互式终端里以「bypass 权限可用」的方式启动的会话，plan 模式的拦截不强制执行（Claude 仍被要求只规划不编辑）。所以在普通使用中不用担心；如果你用 `--dangerously-skip-permissions` 启动，就不要指望 plan 模式替你拦截。

**Q：plan 模式会消耗额度吗？**
会。读文件、运行探索命令、写方案都在消耗 token。但官方认为对复杂任务这是值得的：方向错了再返工更费。

**Q：方案写得不满意怎么办？**
选「No, keep planning」并说明要改哪里，或者 `Ctrl+G` 直接改。官方也提醒：同一个问题纠正了两次以上还不对，说明上下文里堆满了失败的尝试，`/clear` 后用更清楚的提示重新开始效果往往更好。

**Q：压缩上下文后方案还在吗？**
在。官方说明 plan 模式写好的方案会在压缩后从磁盘重新注入。

## 参考资料

- Choose a permission mode · Analyze before you edit with plan mode（官方）：https://code.claude.com/docs/en/permission-modes
- Best practices for Claude Code（官方）：https://code.claude.com/docs/en/best-practices
- Common workflows（官方）：https://code.claude.com/docs/en/common-workflows
- Use Claude Code in VS Code（官方）：https://code.claude.com/docs/en/vs-code
- Model configuration · opusplan（官方）：https://code.claude.com/docs/en/model-config
