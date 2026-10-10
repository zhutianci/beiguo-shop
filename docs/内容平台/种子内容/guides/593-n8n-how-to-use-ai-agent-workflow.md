---
title: n8n 怎么用：是什么、本地部署一行命令安装、第一个工作流与 AI Agent 节点入门
slug: n8n-how-to-use-ai-agent-workflow
products: [ai-tools]
models: []
accountTier: FREE
excerpt: n8n 是什么、怎么用？本文按 n8n 官方文档讲清云端版与自托管怎么选、现在推荐的一行命令 Docker 安装（npm 方式将在 3.0 停用）、照官方教程搭出第一个定时工作流，以及 AI Agent 节点由哪几部分组成。
checkedOn: 2026-10-11
sources:
  - https://docs.n8n.io/choose-how-to-use-n8n
  - https://docs.n8n.io/deploy/host-n8n/install-options/one-line-setup
  - https://docs.n8n.io/deploy/host-n8n/install-options/install-with-npm
  - https://docs.n8n.io/deploy/use-n8n-cloud/start-your-free-trial
  - https://docs.n8n.io/build-your-first-workflow
  - https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.agent
  - https://docs.n8n.io/build/integrate-ai/understand-ai-components/what-agents-do
---

## 适用于谁

- 搜「n8n怎么用」「n8n是什么」「n8n 本地部署」「n8n docker 安装」「n8n ai agent 是什么」的人；
- 想把「定时抓数据、判断、发通知」这类重复工作自动化，并在流程里用上大模型的人。

本文根据 n8n 官方文档整理，资料核对于 2026-10-11。n8n 的界面和文档以英文为主，文中的节点名和按钮名保留英文原文，方便你在界面里对照。

## 结论先说

1. **n8n 是一个工作流自动化工具**：把一个个「节点」（触发器、应用、逻辑判断、AI）连成流程，让它自动运行。
2. **两种用法**：n8n Cloud（官方托管，注册即用）和自托管（装在自己的机器上）。官方文档写明，自托管的 Community 版可以免费使用，包含几乎完整的功能。
3. **安装方式变了**：官方现在推荐用一行命令通过 Docker 安装；文档明确写着 npm 方式（`npm install n8n` / `npx n8n`）自 n8n 3.0 起不再可用，3.0 起 n8n 只通过 Docker 分发。旧教程里的 npm 装法不要再用于新安装。
4. **装好后访问 `http://localhost:5678`**。
5. **做 AI 智能体用的是 AI Agent 节点**：给它接一个聊天模型和至少一个工具，由模型自己决定调用哪个工具。

## 云端版还是自托管

官方给的选择建议：

| 你的情况 | 官方建议 | 理由 |
| --- | --- | --- |
| 想马上开始、没有技术背景 | n8n Cloud | 不用安装，官方负责托管、更新和扩容 |
| 不想管服务器 | n8n Cloud | 同上 |
| 需要完全控制部署环境、有定制需求 | 自托管 | 环境和配置都由你掌握 |
| 想免费使用 | 自托管（Community 版） | 免费，包含几乎完整的功能 |

n8n Cloud 的试用规则（官方文档）：新建试用后有 14 天，可以体验 Pro 计划的全部功能，限制是 1000 次执行，计算资源与 Starter 计划相同。之后的计划和价格官方提示会变动，以定价页为准。

官方同时提醒：自托管需要一定的技术基础（服务器和容器的配置、安全、资源管理），操作失误可能导致数据丢失、安全问题和停机；没有服务器管理经验的人，官方更推荐 n8n Cloud。

## 步骤

### 1. 自托管：一行命令安装

前提是已安装 Docker 并且正在运行。官方说明这条命令需要 `docker compose` v2 插件（不是旧的独立 `docker-compose`）。

```bash
curl -fsSL https://get.n8n.io | sh
```

官方文档描述它会做四件事：检查 Docker 是否安装并运行；在当前目录创建一个 `n8n` 文件夹；写入运行所需的配置文件（`compose.yml`、`.env` 等，密钥自动生成）；下载并启动 n8n。重复执行是安全的，已经装过会直接提示。

成功后终端会显示 `n8n is running at: http://localhost:5678`，浏览器打开这个地址，按提示创建账号即可。

日常命令（来自官方文档）：

| 要做的事 | 命令 |
| --- | --- |
| 停止 | `docker compose -f ./n8n/compose.yml down` |
| 再次启动 | `docker compose -f ./n8n/compose.yml up -d` |
| 升级到最新版 | `curl -fsSL https://get.n8n.io \| sh -s -- --upgrade` |
| 卸载并删除数据 | `docker compose -f ./n8n/compose.yml down -v`，再删除 `./n8n` 文件夹 |

注意 `down -v` 里的 `-v` 会**删除全部 n8n 数据**，平时停止服务不要带它。

Windows 用户：官方建议在 WSL 里操作，并把项目文件夹放在 WSL 的文件系统内。不放心直接执行网络脚本的话，官方文档另有一节说明如何先下载脚本查看，以及手写 Docker Compose 的完整步骤（要求至少 4 GB 内存和 2 个 vCPU）。

### 2. 搭第一个工作流

官方入门教程做的是一个「每周一早上查询上周的太阳耀斑数据，按类型分流后发送出去」的流程。它覆盖了工作流的四个基本要素，照着做一遍就理解了：

1. **新建工作流**；
2. **加触发器**：点 **Add first step**，搜索 **Schedule**，选 **Schedule Trigger**，把 Trigger Interval 设为 Weeks，选周一上午 9 点。触发器决定流程「什么时候跑」；
3. **加应用节点并配置凭据**：搜索 NASA 节点，选择获取太阳耀斑数据的操作。第一次用某个服务要配置凭据（Credentials），也就是这个服务的 API Key。配好后点 **Execute step** 单独运行这个节点，马上能看到返回的数据；
4. **加逻辑判断**：加一个 **If** 节点，按数据里的某个字段分成 true 和 false 两条路；
5. **输出数据**：在两条路后面各接一个发送数据的节点。字段可以直接从上一个节点的输出里**拖进**表达式编辑器，会自动变成 `{{$json["字段名"]}}` 这样的引用；
6. **测试并发布**：点 **Execute Workflow** 整体跑一遍。确认没问题后点 **Publish**，流程才会按触发器自动运行。

记住这个骨架：**触发器 → 取数据 → 判断 → 输出**。大多数自动化流程都是它的变体。

### 3. 加入 AI：AI Agent 节点

官方对 Agent 的解释：可以把它看作一条「会做决定」的链。普通的链按预先定好的顺序调用各个 AI 组件，而 Agent 让大模型自己判断该采取什么行动、调用哪些工具。

在 n8n 里搭一个 Agent，需要给 **AI Agent** 节点接上几类子节点：

| 部件 | 作用 | 是否必须 |
| --- | --- | --- |
| Chat Model（聊天模型） | Agent 的「大脑」，选一个模型供应商并填凭据 | 必须 |
| Tool（工具） | Agent 可以调用的能力，如搜索、发邮件、查表格、调用另一个工作流 | 官方要求至少连接一个 |
| Memory（记忆） | 让 Agent 记住同一会话里之前的对话。官方称 Simple Memory 是最容易上手的一种 | 可选 |

一个最小的聊天智能体：**Chat Trigger（聊天触发器）→ AI Agent**，再给 AI Agent 挂上 Chat Model、Simple Memory 和一两个工具。在画布上打开聊天窗口发消息就能测试。

几条来自官方文档的事实：

- AI Agent 节点原来的「agent type」设置已自 1.82.0 起弃用，现在所有 AI Agent 节点都按 Tools Agent 的方式工作；带有该设置的旧版节点（v1）将在 n8n 3.0 移除。看到旧教程让你选 Conversational Agent、ReAct Agent 之类的类型，可以忽略；
- 执行包含 Agent 的工作流时，Agent 会运行多次：先做初始设置，再调用工具，再评估工具返回的结果并回复用户；
- 可以一键把 MCP 注册表里的 MCP 服务器接给 Agent 当工具。

**提示词怎么写**：在 AI Agent 节点里写系统消息，告诉它角色、可用工具各自的用途、什么情况下该用哪个工具、输出格式。工具的名称和描述也要写清楚，模型就是靠这些描述来决定调不调用的。

## 常见问题

**Q：n8n 有中文界面吗？**
官方文档没有提供中文界面的说明，官方界面和文档以英文为主。网上的汉化包属于第三方修改，本文不涉及。

**Q：n8n 完全免费吗？**
自托管的 Community 版免费，官方称可以一直免费使用，注册后还能解锁一些额外的免费功能（在 Settings → Usage and plan 里点 Unlock）；企业级功能需要付费许可。调用大模型的费用由模型供应商另收。

**Q：n8n Assistant 是什么？必须开吗？**
是 n8n 内置的 AI 助手，属于可选功能。官方说明 n8n 不开它也能完整使用；要开的话在实例的 AI 设置里填入模型 API Key。npm 方式安装的实例不支持它。

**Q：已经用 npm 装了怎么办？**
官方的说法是现有的 npm 安装暂时还能用，但新安装和以后的升级应改用 Docker 方式。

**Q：n8n 和 Dify、扣子怎么选？**
侧重点不同：n8n 是通用的自动化工具，强项是连接大量第三方应用和服务，AI 只是其中一类节点；Dify 和扣子以搭建 AI 应用和智能体为中心。主要需求是「让各个系统自动联动」时看 n8n，主要需求是「做一个基于知识库的 AI 应用」时看《Dify怎么用》。

**Q：凭据安全吗？**
凭据保存在你的 n8n 实例里。自托管时注意不要把 5678 端口直接暴露到公网而不做任何保护；官方文档说明一行命令安装的默认配置下，只有 n8n 自己的 5678 端口可以从外部访问，其他配套服务都是私有的。

## 参考资料

- n8n 文档：Choose how to use n8n — https://docs.n8n.io/choose-how-to-use-n8n
- One-line setup — https://docs.n8n.io/deploy/host-n8n/install-options/one-line-setup
- Install with npm（弃用说明）— https://docs.n8n.io/deploy/host-n8n/install-options/install-with-npm
- Try free then choose a plan — https://docs.n8n.io/deploy/use-n8n-cloud/start-your-free-trial
- Build your first workflow — https://docs.n8n.io/build-your-first-workflow
- AI Agent 节点 — https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.agent
- What agents do — https://docs.n8n.io/build/integrate-ai/understand-ai-components/what-agents-do
