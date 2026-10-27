---
title: Codex 命令被自动审核拒绝怎么办：Auto-review 是什么、/approve 怎么放行、连续被拒为什么会中断
slug: codex-auto-review-denied-command
products: [codex, chatgpt]
models: []
accountTier: PLUS
excerpt: Codex 的命令被 Auto-review 自动审核拒绝，不是普通的沙箱报错。官方说明：审核智能体拒绝后，主智能体要改用更安全的做法或停下问你；命令行里可用 /approve 对被拒动作批准重试一次；连续被拒会触发断路器中断回合。
checkedOn: 2026-10-28
sources:
  - https://learn.chatgpt.com/docs/sandboxing/auto-review
  - https://learn.chatgpt.com/docs/reference/troubleshooting
  - https://learn.chatgpt.com/docs/permission-modes
verify:
  - 官方没有给出「命令被自动审核拒绝」这句提示的统一原文，本文按官方 Auto-review 文档里的「Denials and failure behavior」整理
  - 断路器的次数（连续 3 次、最近 50 次里累计 10 次）和 /approve 的细节来自官方文档对「当前开源实现」的说明，之后可能调整
  - 官方的审核策略写在开源仓库里，本文没有逐条核对，只引用官方概括的拦截类型
---

> 本文根据 Codex 官方文档《Auto-review》《Troubleshooting》整理，资料核对于 2026-10-28。**官方没有这句提示的统一原文**，本文按 Auto-review 文档里的拒绝处理说明整理。配图为本站整理的示意图，不是软件截图。

## 适用于谁

- Codex 的某条命令或操作被自动审核拒绝，任务停下来的人；
- 在桌面 App 里选了「Approve for me」的人；
- 想知道自动审核拒绝什么、能不能放行的人。

## 结论先说

1. **Auto-review 是「换了个审批人」，不是新增权限。** 官方说明：它用另一个审核智能体代替人来审批越过沙箱边界的请求；主智能体仍在同一个沙箱里、同样的审批策略和同样的网络、文件限制下工作。
2. **被拒绝不是普通沙箱错误。** 官方说，Codex 会把审核的理由返回给主智能体，并加一条更强的指令：不要通过变通、间接执行或绕过策略去达到同样的结果；只能用实质上更安全的替代方案，否则就停下来问你。
3. **连续被拒会中断回合。** 官方对当前开源实现的描述：同一回合内连续被拒 3 次，或最近 50 次审核里累计被拒 10 次，会中断该回合；任何一次未被拒绝会重置连续计数。
4. **命令行里可以放行一次。** 输入 `/approve`，打开 **Auto-review Denials** 选择器，选一个最近被拒的动作批准重试一次；每个任务最多记录 10 条最近的拒绝。
5. **`approval_policy = "never"` 时没有东西可审**，Auto-review 不起作用。

![命令被自动审核拒绝：对照官方说明](seed:g1232-denied-decide.png)
*图：本站根据 [Codex 官方文档：Auto-review](https://learn.chatgpt.com/docs/sandboxing/auto-review) 整理的示意图*

## 一、Auto-review 在什么时候触发

官方说明，Auto-review 只在审批是交互式的情况下起作用，比如 `approval_policy = "on-request"` 或仍会弹出相关提示的细粒度策略。它评估的是本来会停下来等人的审批请求：

![Auto-review 是怎么工作的](seed:g1232-flow-steps.png)
*图：本站根据 [Codex 官方文档：Auto-review](https://learn.chatgpt.com/docs/sandboxing/auto-review) 整理的示意图*

- 请求提权的 shell 或执行工具调用；
- 被当前沙箱或策略挡住的网络请求；
- 在可写目录之外的文件编辑；
- 按工具标注或配置需要批准的 MCP 或应用工具调用。

**沙箱里本来就允许的常规操作不会触发审核。** Computer Use 是例外：它的应用批准仍直接问你，不由 Auto-review 代替，见 [/guides/codex-computer-use-not-found](/guides/codex-computer-use-not-found)。

## 二、它会拒绝什么

官方概括 Auto-review 设计上要拦的动作：

- 把私密数据、密钥或凭据发给不可信的目的地；
- 探测凭据、令牌、Cookie 或会话材料；
- 大范围或持久的安全削弱；
- 有重大不可逆损害风险的破坏性操作。

具体策略在开源的 Codex 仓库里，企业可以定制，个人用户也可以在本地配置自己的审核策略。审核智能体能看到精简的对话记录和这次的审批请求，看不到隐藏的推理过程；超时与明确拒绝是分开处理的，超时本身不代表动作不安全。

## 三、被拒绝之后怎么办

1. **先读审核给出的理由。** 它说明了为什么不安全，常常你换一种更窄的做法就能通过，比如只访问需要的目录、不发送敏感内容；
2. **让 Codex 用更安全的方式重做**，或者你自己手动执行那一步；
3. **确认确实要放行**，在命令行输入 `/approve`，选中那一条被拒的动作批准重试一次。官方说明这是窄口径的放行：只针对那个具体动作，不覆盖类似的以后动作；只记录给同一上下文的一次重试；重试仍要经过 Auto-review，**如果策略规定用户不能覆盖这一类拒绝，它还会再拒绝**；
4. **不想要自动审核**：桌面 App 在输入框下方的权限控制里选别的模式，命令行里把 `approvals_reviewer` 改回默认；改变审批策略本身不会改变审核者。组织的托管要求优先于本地设置。

## 四、几个相关的概念

- 桌面 App 里选择 **Approve for me** 才使用自动审核；如果这个模式缺失或灰了，官方的排查是更新 App、检查是否在配置里显式设了 `features.guardian_approval = false`、检查权限配置和审批策略，受管工作区请管理员查允许的模式，见官方《Troubleshooting》；
- 权限模式怎么选，见 [/guides/codex-permissions-sandbox](/guides/codex-permissions-sandbox)；
- 在沙箱里命令连不上网等问题，见 [/guides/codex-windows-sandbox-setup-failed](/guides/codex-windows-sandbox-setup-failed)；
- 其他报错对照见 [/guides/codex-common-errors-summary](/guides/codex-common-errors-summary)。

## 常见问题

**Q：我能让它别再拒绝吗？**
官方说明 Auto-review 是审核者的替换，不是权限授予，不会扩大可写目录、开启网络或削弱受保护路径；想要更宽的权限要改的是权限配置，并且受组织策略约束。

**Q：风险高的操作可以全权限运行吗？**
官方警告完全访问模式下 Codex 不限于项目目录，可能做出破坏性操作，建议用 **Approve for me** 而不是全权限。

**Q：想开通 Codex 的更多额度？**
见 [/guides/codex-usage-limits](/guides/codex-usage-limits)，想开通 Plus 可看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

## 参考资料

- Codex 官方文档：Auto-review — https://learn.chatgpt.com/docs/sandboxing/auto-review
- Codex 官方文档：Troubleshooting — https://learn.chatgpt.com/docs/reference/troubleshooting
- Codex 官方文档：Permissions — https://learn.chatgpt.com/docs/permission-modes
