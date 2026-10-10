---
title: DeepSeek接入Claude Code教程：环境变量配置、模型映射与常见问题
slug: deepseek-claude-code-setup
products: [ai-tools, claude]
models: [deepseek]
accountTier: OTHER
excerpt: 想在 Claude Code 里用 DeepSeek 模型？本文按 DeepSeek 官方接入文档讲清安装、各系统的环境变量写法、模型名映射规则、Web Search 的额外费用，以及连不上、401 等常见问题。
checkedOn: 2026-10-11
sources:
  - https://api-docs.deepseek.com/zh-cn/quick_start/agent_integrations/claude_code
  - https://api-docs.deepseek.com/zh-cn/guides/anthropic_api
  - https://api-docs.deepseek.com/zh-cn/quick_start/pricing
  - https://api-docs.deepseek.com/zh-cn/quick_start/error_codes
---

## 适用于谁

- 搜「deepseek 接入 claude code」「deepseek接入claude」，想用 DeepSeek 的 API 驱动 Claude Code 这个终端编程工具的开发者；
- 已经照着旧教程配过，但模型名对不上或报错的人。

本文根据 DeepSeek 官方「接入 Claude Code」文档整理，资料核对于 2026-10-11。这是 DeepSeek 一侧提供的兼容接口用法，Claude Code 本身的功能说明见《Claude Code 入门》。

## 结论先说

1. **原理是把 Claude Code 的请求地址换成 DeepSeek 的 Anthropic 兼容接口** `https://api.deepseek.com/anthropic`，用 DeepSeek 的 API Key 认证。
2. **只需要设置几个环境变量**，不用改 Claude Code 的任何文件。
3. **费用走 DeepSeek 开放平台的余额**，按 token 计费，和 Claude 订阅无关。
4. **效果取决于模型**：换成 DeepSeek 后，写代码的水平是 DeepSeek 模型的水平，工具本身的权限、命令、插件机制不变。

## 步骤

### 1. 准备：Key 和 Claude Code

- 在 DeepSeek 开放平台创建 API Key 并保证有余额，见《DeepSeek API Key 怎么获取》；
- 还没装 Claude Code 的话，官方文档的装法是：先装 Node.js 18 及以上（Windows 还需要 Git for Windows），然后执行

```bash
npm install -g @anthropic-ai/claude-code
claude --version      # 能显示版本号就是装好了
```

### 2. 配置环境变量

**macOS / Linux**（在终端里执行，或写进 `~/.zshrc`、`~/.bashrc`）：

```bash
export ANTHROPIC_BASE_URL=https://api.deepseek.com/anthropic
export ANTHROPIC_AUTH_TOKEN=<你的 DeepSeek API Key>
export ANTHROPIC_MODEL=deepseek-flash[1m]
export ANTHROPIC_DEFAULT_OPUS_MODEL=deepseek-flash[1m]
export ANTHROPIC_DEFAULT_SONNET_MODEL=deepseek-flash[1m]
export ANTHROPIC_DEFAULT_HAIKU_MODEL=deepseek-flash
export CLAUDE_CODE_SUBAGENT_MODEL=deepseek-flash
export CLAUDE_CODE_EFFORT_LEVEL=max
export CLAUDE_CODE_AUTO_COMPACT_WINDOW=786432
```

**Windows PowerShell**：

```powershell
$env:ANTHROPIC_BASE_URL="https://api.deepseek.com/anthropic"
$env:ANTHROPIC_AUTH_TOKEN="<你的 DeepSeek API Key>"
$env:ANTHROPIC_MODEL="deepseek-flash[1m]"
$env:ANTHROPIC_DEFAULT_OPUS_MODEL="deepseek-flash[1m]"
$env:ANTHROPIC_DEFAULT_SONNET_MODEL="deepseek-flash[1m]"
$env:ANTHROPIC_DEFAULT_HAIKU_MODEL="deepseek-flash"
$env:CLAUDE_CODE_SUBAGENT_MODEL="deepseek-flash"
$env:CLAUDE_CODE_EFFORT_LEVEL="max"
$env:CLAUDE_CODE_AUTO_COMPACT_WINDOW="786432"
```

这些变量各自的作用：

- `ANTHROPIC_BASE_URL`、`ANTHROPIC_AUTH_TOKEN`：请求发到哪里、用哪个 Key；
- `ANTHROPIC_MODEL` 和三个 `DEFAULT_*_MODEL`：Claude Code 内部会按任务轻重选不同档位的模型，这里把每个档位都指到 DeepSeek 的模型上。模型名后的 `[1m]` 是官方文档给的写法，对应 1M 上下文；
- `CLAUDE_CODE_SUBAGENT_MODEL`：子代理用的模型；
- `CLAUDE_CODE_EFFORT_LEVEL`：思考强度；
- `CLAUDE_CODE_AUTO_COMPACT_WINDOW`：对话多长时自动压缩上下文。

在 PowerShell 里用 `$env:` 设置的变量只对当前窗口有效，关掉窗口就没了；想长期生效，可以写进 PowerShell 的配置文件或系统的用户环境变量。

### 3. 进入项目目录启动

```bash
cd /path/to/my-project
claude
```

启动后先问一个简单问题（比如「这个项目是做什么的」）确认能正常返回，再开始真正的任务。

### 4. 了解模型名映射

官方文档说明，使用 Claude Code 或 Claude Desktop App 时，DeepSeek 会对传入的 Claude 模型名做映射：

- `claude-opus` 开头的模型名 → `deepseek-v4-pro`，按 V4 Pro 的价格计费；
- `claude-haiku`、`claude-sonnet` 开头的模型名 → `deepseek-flash`。

所以如果你没有像上面那样把各档位都显式指到 `deepseek-flash`，在工具里切到 Opus 档时，实际用的是价格更高的 `deepseek-v4-pro`。想控制成本，就按第 2 步把变量配全。

### 5. Web Search 会额外计费

官方文档说明，DeepSeek API 原生支持 Claude Code 里的 Web Search：模型判断需要搜索时会调用搜索工具，并通过 DeepSeek 提供的接口完成搜索。搜索结果需要再用模型总结，因此会产生额外的 token 费用。不想花这部分钱，就在提问时说明「不要联网搜索」，或者在权限设置里不允许该工具。

## 常见问题

**Q：启动后提示认证失败（401）？**
Key 写错或没生效。用 `echo $ANTHROPIC_AUTH_TOKEN`（PowerShell 用 `echo $env:ANTHROPIC_AUTH_TOKEN`）确认变量存在；检查有没有把尖括号一起写进去。

**Q：提示余额不足（402）？**
DeepSeek 开放平台余额用完了，充值后重试。Agent 类工具消耗 token 很快，建议定期在平台的用量页面查看。

**Q：怎么省钱？**
三个办法：各档位都指向 `deepseek-flash`；把批量任务放到空闲时段（官方定价里空闲时段是高峰价格的一半）；让上下文尽量复用——缓存命中的输入价格远低于未命中。

**Q：怎么切回原来的 Claude 账号？**
删掉这些环境变量（`unset ANTHROPIC_BASE_URL` 等，或开一个没有设置过的新终端）再启动即可。

**Q：Claude Code 的功能在 DeepSeek 下都能用吗？**
DeepSeek 的 Anthropic 兼容接口文档列出了支持和不支持的字段，并非全部一致（例如部分服务端工具类型不支持）。常规的读写文件、执行命令、工具调用可以用，个别依赖 Anthropic 专有能力的功能以实际表现和官方兼容性表为准。

**Q：除了 Claude Code 还能接哪些工具？**
DeepSeek 文档的「接入 Agent 工具」一栏还列了 Codex、OpenCode、OpenClaw、Hermes、Qoder 等，各有单独的接入页面。

## 参考资料

- DeepSeek API 文档：接入 Claude Code — https://api-docs.deepseek.com/zh-cn/quick_start/agent_integrations/claude_code
- DeepSeek API 文档：Anthropic API 兼容说明 — https://api-docs.deepseek.com/zh-cn/guides/anthropic_api
- DeepSeek API 文档：模型与价格 — https://api-docs.deepseek.com/zh-cn/quick_start/pricing
- DeepSeek API 文档：错误码 — https://api-docs.deepseek.com/zh-cn/quick_start/error_codes
