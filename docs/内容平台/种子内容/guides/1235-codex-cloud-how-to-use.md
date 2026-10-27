---
title: Codex Cloud（云端任务）怎么用：创建环境、发布、开始第一个云端任务，以及什么时候该用云端
slug: codex-cloud-how-to-use
products: [codex, chatgpt]
models: []
accountTier: PLUS
excerpt: Codex Cloud 让编码任务在 OpenAI 托管的电脑上运行，电脑睡眠时也能继续，可在网页、手机、桌面 App 上开始和继续。本文按官方文档整理创建并发布环境、开始第一个任务的步骤，以及云端和本地怎么选。
checkedOn: 2026-10-28
sources:
  - https://learn.chatgpt.com/docs/cloud
  - https://learn.chatgpt.com/docs/environments/cloud-environments
  - https://learn.chatgpt.com/docs/developer-commands
  - https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex
verify:
  - 官方文档同时提到「Codex Cloud」和「Codex Cloud (Legacy)」，Code Review、Security Review 和 Linear、GitHub 集成仍使用后者，本文只讲新的云端任务流程
  - 云端任务的可用套餐、用量和管理员权限以官方《Using Codex with your ChatGPT plan》为准，本文不写额度数字
  - 界面按钮名称（Work in、Select environment、Create environment、Publish）来自官方文档当天的写法
---

> 本文根据 Codex 官方文档《Codex Cloud》《Cloud environments》《Command line options》和 OpenAI 帮助中心《ChatGPT Work and Codex》整理，资料核对于 2026-10-28。官方文档中还有「Codex Cloud (Legacy)」，本文讲新的流程。配图为本站整理的示意图，不是软件截图。

## 适用于谁

- 想让编码任务在云端跑、电脑合上也不中断的人；
- 想在手机上开 Codex 任务的人；
- 不知道云端和本地该怎么选的人。

## 结论先说

1. **Codex Cloud 在 OpenAI 托管的电脑上运行编码任务**，每个任务有自己的工作区，**电脑睡眠时任务仍可继续**。可在网页、手机或桌面 App 里开始和继续，并审查改动。
2. **要先有一个「环境」**：包含任务所需的仓库、工具和访问权限。创建并发布环境要在**网页或桌面 App** 上做，手机上只能选已发布的环境。
3. **云端要用 ChatGPT 账号登录。** 官方认证文档写明 Codex 云端需要 ChatGPT 登录，API 密钥登录不能用。
4. **完成后** 检查改动和测试结果，请求后续修改，准备好后提交或开 PR。
5. **云端权限单独管理**：官方说 Codex Cloud 的访问独立于 Work Cloud 和 Codex Local，管理员可单独控制。

![Codex Cloud 开始第一个云端任务](seed:g1235-cloud-steps.png)
*图：本站根据 [Codex 官方文档：Codex Cloud](https://learn.chatgpt.com/docs/cloud) 整理的示意图*

## 一、第一次使用的步骤

官方步骤（本站转述）：

1. **打开 ChatGPT**，用 ChatGPT 账号登录（网页、手机或桌面 App 均可）；
2. **创建或选择环境**：在网页或桌面 App 里选 **Work in > Cloud**，打开 **Select environment**；手机上点 **Codex** 选已发布的环境。要新建就用网页或桌面 App，选 **Create environment**；
3. **让 Codex 准备项目**：选 GitHub 仓库，点 **Get started**，按提示连接 GitHub。Codex 会检查仓库、安装依赖和工具并测试流程，缺访问权限或信息时会向你要；
4. **审查并发布**：新环境要检查设置和测试结果，保存，点 **Publish**，等到显示 **Environment published**；
5. **开始任务**：发布后点 **Start a new task**，描述任务并发送；选已有环境的话可以直接开始。

之后可以配置环境、联网访问、环境变量和网络密钥，也可以在 Slack 里发起请求，见官方对应页面。

## 二、云端还是本地

![该用云端，还是本地](seed:g1235-where-decide.png)
*图：本站根据 [Codex 官方文档：Codex Cloud](https://learn.chatgpt.com/docs/cloud) 整理的示意图*

官方列的「什么时候用 Codex Cloud」：工作需要远程运行；几个任务需要同一套设置（从发布的环境开始，各任务的工作状态互相独立）；工作流需要服务凭据（用网络密钥访问允许的 HTTPS 服务，并限制环境的网络目的地）；想从命令行开始云端工作。本地的 Codex 则用你电脑上的文件、终端和开发工具。

## 三、从命令行用云端

官方命令参考里的 `codex cloud`：默认打开交互式选择器；`codex cloud exec` 直接提交任务；`codex cloud list` 列最近的云端对话，可加 `--json` 方便脚本，输出里包含任务的 URL 和状态。认证和主 CLI 一样；提交失败时 Codex 以非零状态退出。更多命令见 [/guides/codex-cli-commands-cheatsheet](/guides/codex-cli-commands-cheatsheet)。

## 四、和手机、远程访问的区别

官方帮助中心特别说明：**在云端环境里跑任务**和**远程访问桌面端的 Codex 对话**是两回事。后者通过手机 App 的 Remote 标签访问你电脑上的对话，不会把桌面对话加到网页或手机的聊天历史里，见 [/guides/codex-remote-control-ssh-host](/guides/codex-remote-control-ssh-host)。

## 五、套餐和额度

官方 Pricing 页写明 Work 和 Codex 包含在 ChatGPT 各套餐里，云端任务可能比本地消息消耗更多额度，用量见 [/guides/codex-usage-limits](/guides/codex-usage-limits)。想开通 Plus 可以看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。ChatGPT 和 Codex 的关系见 [/guides/chatgpt-and-codex-merged-relationship](/guides/chatgpt-and-codex-merged-relationship)。

## 常见问题

**Q：为什么手机上不能建环境？**
官方写明新建环境用网页或桌面 App，手机上选已发布的环境。

**Q：云端任务里能联网吗？**
官方有单独的联网访问配置：环境设置里配网络，允许访问的服务要自己限定，详见官方《Cloud environments》。

**Q：在 GitHub 上让 Codex 审查代码？**
见 [/guides/codex-code-review](/guides/codex-code-review)。

## 参考资料

- Codex 官方文档：Codex Cloud — https://learn.chatgpt.com/docs/cloud
- Codex 官方文档：Cloud environments — https://learn.chatgpt.com/docs/environments/cloud-environments
- Codex 官方文档：Command line options — https://learn.chatgpt.com/docs/developer-commands
- OpenAI 帮助中心：ChatGPT Work and Codex — https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex
