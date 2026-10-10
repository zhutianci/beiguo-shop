---
title: Claude Code 网页版（claude.ai/code）怎么用：在云端跑任务
slug: claude-code-web
products: [claude]
models: []
accountTier: PLUS
excerpt: Claude Code 网页版（云端会话）不用在电脑上装任何东西：连接 GitHub、选仓库、交代任务，Claude 在云端虚拟机里改代码并推送分支。本文讲哪些套餐能用、怎么开始、审阅 diff、建 PR、和本地会话互相转移。
checkedOn: 2026-10-07
sources:
  - https://code.claude.com/docs/en/web-quickstart
  - https://code.claude.com/docs/en/claude-code-on-the-web
  - https://code.claude.com/docs/en/cloud-environments
  - https://code.claude.com/docs/en/remote-control
  - https://code.claude.com/docs/en/permission-modes
---

> 本文根据 Claude Code 官方文档《Get started with Claude Code in the cloud》《Use Claude Code in the cloud》整理，核对日期 2026-10-07。

## 适用于谁

- 想在浏览器或手机上直接让 Claude 改 GitHub 仓库的代码，不想在本地装环境的人；
- 想同时跑好几个互不相干的任务、交代完就去忙别的的人；
- 搜「claude code web」「claude code 网页版」「web ui」的人。

## 结论先说

1. **Claude Code 网页版 = 云端会话**：在 claude.ai/code 打开，Claude 会把你的 GitHub 仓库克隆到一台 Anthropic 管理的隔离虚拟机里干活，改完推送一个分支给你审。
2. **可用套餐**：Pro、Max、Team，以及 Enterprise 中带高级席位或「Chat + Claude Code」席位的用户。
3. **需要 GitHub**：第一次要连接 GitHub 账号；私有仓库需要在对应账号或组织上安装 Claude GitHub App。
4. 云端会话**关掉网页、合上电脑也会继续跑**；手机 App 上也能查看和继续。
5. 云端会话和本机的其他 Claude 使用**共享同一份额度**，并行跑多个任务消耗相应增加；官方说明云端虚拟机本身不额外收费。

## 网页版和本地版怎么选

| | 云端会话（网页版） | 本地会话 | 本地会话 + Remote Control |
| --- | --- | --- | --- |
| 代码在哪运行 | 云端虚拟机 | 你的电脑 | 你的电脑 |
| 从哪里开始 | claude.ai/code、手机 App、桌面版选 Cloud、`claude --cloud` | 终端、IDE、桌面版选 Local | 终端、VS Code、桌面版 |
| 用你本地的配置 | 否，只有仓库内容 | 是 | 是 |
| 需要 GitHub | 是 | 否 | 否 |
| 断开后继续运行 | 是 | 否 | 本机会话开着就继续 |
| 权限模式 | Accept edits、Plan、Auto | 全部 | 从网页 / 手机可选 Manual、Accept edits、Plan |

官方建议：并行任务、本地没有的仓库、交代清楚就不用盯的任务、读代码答疑，适合云端；需要本地配置、工具或环境的工作，用本地会话或 Remote Control 更合适。

## 步骤

### 1. 打开 claude.ai/code 并连接 GitHub

1. 访问 claude.ai/code，用 claude.ai 账号登录；
2. 按提示连接 GitHub，在 GitHub 授权页确认；
3. 想用私有仓库，到 github.com/apps/claude 给对应账号或组织安装 Claude GitHub App（组织可能需要所有者批准）。安装后还能用「自动修 PR」功能；
4. **云端环境**：Pro / Max 会自动创建一个名为 Default 的环境；Team / Enterprise 会出现「创建第一个云端环境」表单，保持默认点 Create & finish 即可。

Default 环境的网络是「Trusted」级别：可以访问常见的包管理源和其他白名单域名，其他网络访问会被限制。需要改网络权限、加环境变量或在会话开始前运行安装脚本，可以编辑环境。

Team / Enterprise 用户注意：要先由组织 Owner 在「组织设置 → 连接器」里打开 GitHub 连接器，否则看不到连接按钮。

**用命令行连接（可选）**：已经装了 Claude Code 和 GitHub CLI 的话，先 `gh auth login`，在 Claude Code 里用 claude.ai 账号 `/login`，再运行 `/web-setup`。它会把你 `gh` 的令牌加密保存到 Claude 账号，云端会话就能访问这个令牌能访问的所有仓库（不必装 GitHub App）。

### 2. 交代一个任务

1. 在输入框下方选择**仓库和分支**（可以添加多个仓库）；
2. 在输入框旁的下拉框选**权限模式**：
   - **Auto**：分类器代你审核操作（组织允许且模型支持时出现）；
   - **Accept edits**：直接改并推送分支，不停下来问；
   - **Plan**：先出方案，你批准后才改文件；
3. 写清楚任务，按回车。官方建议：点名文件或函数（「修复 `tests/test_auth.py` 里失败的认证测试」比「修测试」好）、有报错就贴上、描述期望的行为而不只是症状。

每个任务一个独立会话、一个独立分支，不用等上一个跑完就能开下一个。

### 3. 审阅、批注、建 PR

1. 会话里会显示改动统计（如 `+42 -18`），点开进入 diff 视图，左边是文件列表、右边是改动；默认和基准分支比较，可以选 **Compare against** 换分支；
2. **行内批注**：点任意一行写意见，批注会和你下一条消息一起发给 Claude，比如「`src/auth.ts:47` 这里不要吞掉异常」，不用再描述位置；
3. 满意后点 diff 视图顶部的 **Create PR**，可以建正式 PR、草稿 PR，或跳到 GitHub 的编辑页；
4. PR 建好后会话仍然在线：把 CI 报错或审查意见贴进来让 Claude 继续改。

**自动修 PR（Auto-fix）**：在会话的 CI 状态栏里打开 **Auto-fix**，Claude 会订阅这个 PR 的动态，CI 失败或有人留审查意见时自动排查，有明确修法就推送修复。需要仓库装了 Claude GitHub App。本地终端里也可以在 PR 分支上运行 `/autofix-pr` 一步开启。

## 和本地终端互相转移

**从终端发到云端：**

```bash
claude --cloud "修复 src/auth/login.ts 里的认证 bug"
```

云端虚拟机克隆的是你当前目录的 GitHub 远程仓库和当前分支（不是本地的工作区），所以有本地提交要**先推送**。官方的小技巧：复杂任务先在本地用 plan 模式和 Claude 商量好方案，再发到云端执行。

**从云端拉回终端：**

```bash
claude --teleport          # 打开云端会话选择器
claude --teleport <会话ID>  # 直接拉取指定会话
```

或者在已打开的 Claude Code 里输入 `/teleport`（`/tp`）。它会确认你在正确的仓库里、拉取并切换到云端会话的分支、载入完整对话历史。之后在终端里的新工作只保存在本地，不会同步回网页。

注意：命令行这边只能「拉回」云端会话，不能把已有的终端会话「推」到云端（桌面版的 Code 标签可以通过「Open in」菜单发送到云端）。

## 安全与隔离

- 每个云端会话运行在**独立的虚拟机**里，和你的电脑、和其他会话隔离；
- 网络访问默认受限，可以关闭；
- git 凭据和签名密钥不放进沙箱，由代理用受限的凭据替会话完成认证；
- 改代码、分析都在隔离环境里完成后再创建 PR。

## 常见问题

**Q：连接 GitHub 后看不到我的私有仓库？**
浏览器方式连接时，私有仓库只有在其所属账号或组织装了 Claude GitHub App、且安装范围包含该仓库时才会出现。用 `/web-setup` 方式时，用 `gh repo view 所有者/仓库` 检查你的 GitHub CLI 能否看到它。

**Q：提示「Claude Code isn't available on your account」？**
你在当前组织的席位不包含 Claude Code。属于多个组织的可以点 Switch organization 切换，否则请组织 Owner 分配包含 Claude Code 的席位。

**Q：关掉网页后会话还在跑？**
这是设计如此。会话会在后台把当前任务做完然后空闲。不需要的可以在侧边栏归档或删除。

**Q：不用 GitHub 能用网页版吗？**
仓库克隆和创建 PR 依赖 GitHub。GitLab 等其他托管的仓库可以通过 `claude --cloud` 以本地打包方式发送（需设置 `CCR_FORCE_BUNDLE=1`），但结果推不回原来的远程。完全不想连 GitHub，可以用 Remote Control：代码在自己电脑上跑，在网页或手机上查看和操作。

**Q：网页版能用我电脑上的 CLAUDE.md、技能、插件吗？**
云端会话只有仓库里的内容。提交到仓库的 `.claude/settings.json`、CLAUDE.md、项目技能会生效；你本机 `~/.claude` 下的个人配置和本地安装的插件不会加载。

## 参考资料

- Get started with Claude Code in the cloud（官方）：https://code.claude.com/docs/en/web-quickstart
- Use Claude Code in the cloud（官方）：https://code.claude.com/docs/en/claude-code-on-the-web
- Configure cloud environments（官方）：https://code.claude.com/docs/en/cloud-environments
- Remote Control（官方）：https://code.claude.com/docs/en/remote-control
- Choose a permission mode（官方）：https://code.claude.com/docs/en/permission-modes
