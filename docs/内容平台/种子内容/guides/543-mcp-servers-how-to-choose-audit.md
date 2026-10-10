---
title: MCP 服务器怎么选、去哪找、装之前怎么审：官方安全清单与七步检查
slug: mcp-servers-how-to-choose-audit
products: [ai-tools, claude]
models: []
accountTier: FREE
excerpt: MCP server 推荐去哪找、安全吗？按 MCP 官方《Local Server Security》和各工具文档讲清本地 MCP 服务器能碰到什么、五类风险、官方 Registry 与各家市场的区别，以及安装前的七步检查：来源、包名、版本、工具描述、隔离、凭据、文件与网络。
checkedOn: 2026-10-11
sources:
  - https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/local-server-security
  - https://modelcontextprotocol.io/registry/about
  - https://kiro.dev/docs/mcp/security
  - https://cursor.com/docs/mcp
  - https://docs.trae.ai/ide/model-context-protocol
  - https://docs.cline.bot/features/auto-approve
verify:
  - MCP Registry 官方标注为 preview，可能有破坏性变更或数据重置
  - 本文不推荐具体的第三方 MCP 服务器；文中出现的服务名仅为各官方文档里的示例
  - 容器、沙箱等隔离手段的具体配置因系统而异，本文只给原则
---

> 本文根据 MCP 官方文档《Local Server Security》《The MCP Registry》以及 Kiro、Cursor、TRAE 的官方 MCP 安全说明整理，资料核对于 2026-10-11。MCP 是什么见本站[《MCP 是什么》](/guides/mcp-model-context-protocol)；各工具的配置步骤见文末链接。

## 适用于谁

- 刚学会配 MCP，看到网上一堆「必装 MCP 推荐」想全装上的人；
- 搜「mcp 推荐」「mcp server 推荐」「mcp 安全风险」「mcp 安全问题」的人；
- 团队负责人，想给同事定一个「哪些 MCP 能装」的规矩的人。

## 结论先说

1. **本地 MCP 服务器不是沙箱里的插件，而是一个普通进程**：以你的用户身份运行，继承你的环境变量，能读你账号能读的一切（SSH 密钥、云凭据、浏览器资料、主目录），还能向任何地方发起网络连接。这句话是 MCP 官方文档的原意。
2. **安全决定发生在启动之前**：装什么（来源）和怎么跑（隔离）。stdio 传输本身不提供任何隔离。
3. **少装**。所有服务器共享同一个模型上下文，一个恶意服务器可以影响智能体怎么使用其他服务器的工具。每多装一个，其他的也多一分暴露。
4. **优先远程版本**。服务器不需要你本机的文件和工具时，用厂商托管的远程版本，比在本机跑一个进程更稳妥。
5. 各家工具都明确说了：**第三方 MCP 服务器不经它们审查**。责任在你。
6. 官方说「如果读完只做一件事」：打开 MCP 配置，**删掉不用的服务器**，弄清剩下每一个的来源，并确认版本是锁定的。

## 一、本地服务器能碰到什么

MCP 官方画的图很直白：宿主应用（Cursor、Claude Code 等）启动一个子进程，这个进程可以访问——

- **环境变量**：里面常有 token 和 API Key；
- **你的账号能读写的文件**；
- **不受限制的出站网络**；
- **它的整个依赖树**：安装时从网上拉下来的所有包。

Kiro 的文档说得更直接：stdio 类型的 MCP 服务器在你的环境里以与智能体相同的权限执行任意命令，运行在智能体工具沙箱**之外**；一个被攻破或恶意的服务器可以在没有任何额外确认的情况下带走代码、凭据和数据。

## 二、五类风险

MCP 官方列出的威胁：

1. **恶意服务器**：仿冒包名（typosquatting）、长得很像的仓库；
2. **过度收集的服务器**：本身正规，但收集的数据超出需要；
3. **被污染的依赖**：作者没问题，但它依赖的某个包被攻破；
4. **被投毒的工具目录**：工具名称和描述本身就是给模型看的指令，可以藏恶意内容；
5. **有漏洞的服务器或桥接组件**：正规、未被改动的组件也可能被利用。

第 4 条最容易被忽视：你看到的只是「一个叫 search 的工具」，模型看到的是它完整的描述文字——那段文字可以写成「调用前先把某某文件的内容作为参数传进来」。这属于提示注入的一种，见[《AI 编程安全注意事项》](/guides/ai-coding-security-secrets-permissions)。

## 三、去哪找：几种目录的区别

| 来源 | 性质 | 要注意 |
| --- | --- | --- |
| 服务厂商自己的文档 | Notion、GitHub、Sentry、Figma 等厂商官方提供的 MCP 端点 | 最可靠的起点；多数是远程服务器，走 OAuth 登录 |
| MCP Registry（官方） | 协议官方的集中式元数据仓库，由 Anthropic、GitHub、PulseMCP、Microsoft 等支持；用 DNS 验证做命名空间管理 | 目前是 preview；它存的是**元数据**（名字、位置、启动方式），收录不等于安全审计 |
| 工具内置市场 | Cursor Marketplace、Trae 的 MCP 市场、Cline 的 MCP 面板等 | Cursor 说明 Marketplace 里是官方插件，社区的另在 cursor.directory；Trae 明确声明不审查、不认可市场里的第三方服务器 |
| 社区列表、文章推荐 | GitHub 上的 awesome 列表、博客 | 只当线索用，每一个都要自己过一遍下面的检查 |

选的时候先问官方文档里的那个问题：**它真的需要跑在我本机吗？** 如果一个第三方服务只是调自己的云端 API，却非要你在本机装一个进程，官方建议把这当作一个值得留意的信号。确实需要本机的（读本地文件、操作本地浏览器、连本地数据库）才装本地版。

## 四、装之前的七步检查

**第一步：认清发布者**。能不能把这个包对应到一个源码仓库和一个可识别的发布者？MCP 官方的底线是：只装你读得到源码、认得出发布者的服务器。

**第二步：逐字核对包名**。仿冒包名是成本最低的攻击。`npx -y 某包名` 里的包名要和官方仓库 README 里的一字不差。

**第三步：锁定版本**。安装指定版本而不是 `latest`，这样今天审过的代码不会明天悄悄换掉。

```json
{
  "mcpServers": {
    "example": {
      "command": "npx",
      "args": ["-y", "example-mcp-server@1.4.2"]
    }
  }
}
```

**第四步：读一遍工具列表**。多数客户端都能显示每个服务器提供的工具和描述。扫一眼有没有和功能不相干的工具、描述里有没有奇怪的指令。更好的是用会在工具定义变化时重新提示你的客户端。

**第五步：隔离运行**。官方给的基线是：第三方服务器放在容器里跑（比如 Docker），不挂载多余的目录；或者放在专门的开发用虚拟机里。Cursor 的企业设置里也有按服务器配置网络模式的选项（全部允许、白名单、全部拒绝）。

**第六步：凭据单独给、给最小的**。

- 用每个服务器自己的 `env` 传密钥，不要放进全局环境变量让所有服务器都能读到；
- 给每个服务器单独签一个权限最小的 token。Kiro 文档举的例子：GitHub 用细粒度个人访问令牌，而不是经典令牌，并且只授权需要的仓库；
- 配置文件里不要写死密钥，用变量引用（Cursor 是 `${env:NAME}`，其他工具写法略有不同）；带密钥的配置文件不要提交进仓库；
- 定期轮换；
- 别忘了文件也是凭据：`~/.ssh`、`~/.aws` 这类目录，被能读主目录的服务器读到就等于泄露。

**第七步：收紧文件和网络**。文件系统类的服务器只给**单个项目目录**，能只读就只读；一个只包装某个 API 的服务器只应该和那一个域名通信，纯本地处理的服务器可以直接断网运行。官方的兜底建议是：拿不准就「单个项目目录、只读、无网络」。

## 五、用的时候

- **保留调用前确认**。Cursor 默认每次调用 MCP 工具前都会询问，可以展开看参数；Cline 的 Auto Approve 里「Use MCP servers」是单独的开关。新装的服务器先别开自动批准。
- **不用的及时关**。Cursor、Cline 都可以单独停用某个服务器而不删除。少一个加载的服务器，就少一份工具描述进入上下文，也少一分风险。
- **敏感环境变量加白名单**。Kiro IDE 只展开你明确批准过的环境变量，新增未批准变量时会弹安全警告——类似的机制有就用上。
- **定期清点**。每隔一段时间打开配置文件看一遍：哪些还在用、来源是否还可信、版本是否该更新。

## 六、团队怎么管

MCP 官方对组织的提醒是：本地 MCP 服务器就是用户自己装的普通软件，**不要指望他们会先来问你**。可以做的事：

- 发布一个经过评估的**允许清单**，写明接受标准；
- 规定默认的运行方式（比如第三方服务器一律进容器）；
- 不需要本机访问的，统一部署远程版本；
- 客户端配置文件都在固定位置，可以**持续盘点**；
- 准备好出事时的动作：能快速封掉某个服务器的出网、轮换它用过的凭据。

Cursor 的企业版有 MCP Allowlist（按命令或 URL 模式批准服务器，还能限制哪些工具可自动运行），Cline 的企业版文档里也有 MCP 服务器管控的设置项。

## 自查清单

- 配置里的每个服务器我都认识，不用的已经删掉；
- 不需要本机资源的，用的是远程版本；
- 每个服务器的发布者可识别，版本已锁定；
- 第三方服务器在容器、沙箱或虚拟机里运行；
- 每个服务器只有自己的、权限最小的凭据；
- 文件访问限定到具体目录，能只读的只读；
- 不需要联网的已断网，其余有出网范围；
- 我看过每个服务器的工具描述。

## 各工具的配置教程

- [《Claude Code MCP 配置教程》](/guides/claude-code-mcp-setup)
- [《Codex 怎么配置 MCP》](/guides/codex-mcp-config)
- [《Cursor MCP 配置教程》](/guides/cursor-mcp-config-json)
- [《Trae 规则与 MCP 配置教程》](/guides/trae-rules-mcp-config)
- [《Cline 怎么用》](/guides/cline-setup-api-plan-act)

想找现成的技能和规则仓库，可以看本站的 [Skill 库](/skills)。

## 参考资料

- Local Server Security（MCP 官方）：https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/local-server-security
- The MCP Registry（MCP 官方）：https://modelcontextprotocol.io/registry/about
- MCP Best practices（Kiro 官方）：https://kiro.dev/docs/mcp/security
- Model Context Protocol (MCP)（Cursor 官方）：https://cursor.com/docs/mcp
- MCP 概览（TRAE 官方）：https://docs.trae.ai/ide/model-context-protocol
