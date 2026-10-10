---
title: Gemini API Key 怎么获取：在 AI Studio 创建密钥、设置环境变量与安全限制
slug: gemini-api-key
products: [gemini]
models: [gemini-llm]
accountTier: OTHER
excerpt: 调用 Gemini API 先要在 Google AI Studio 创建 API Key。本文讲清创建入口、密钥与项目的关系、2026 年新的授权密钥规则、环境变量怎么设、怎么测试，以及密钥被封或泄露后的处理。
checkedOn: 2026-10-10
sources:
  - https://ai.google.dev/gemini-api/docs/api-key
  - https://ai.google.dev/gemini-api/docs/quickstart
  - https://ai.google.dev/gemini-api/docs/troubleshooting
  - https://ai.google.dev/gemini-api/docs/troubleshoot-ai-studio
  - https://ai.google.dev/gemini-api/docs/api-errors
  - https://ai.google.dev/gemini-api/docs/generate-content/api-errors
  - https://ai.google.dev/gemini-api/docs/billing
  - https://ai.google.dev/gemini-api/docs/available-regions
  - https://ai.google.dev/gemini-api/terms
verify:
  - 「休眠较久的无限制密钥会被封禁」官方只写 extended period，没有给出具体天数
  - 密钥创建后能否再次查看完整内容，官方 API key 页面没有写，以 AI Studio 实际界面为准
  - 官方页面同时出现 aistudio.google.com/apikey 和 aistudio.google.com/api-keys 两个地址，都指向 API Keys 页面
  - 用无效密钥调用时，旧版 generateContent 返回 400 INVALID_ARGUMENT（API key not valid），新版 Interactions API 错误表写的是 401 authentication，两套接口的状态码不同
---

> 本文根据 Google AI for Developers 官方文档（Using Gemini API keys、Quickstart、Troubleshooting、Troubleshoot Google AI Studio）整理，资料核对于 2026-10-10。密钥规则在 2026 年有较大调整，以官方 API key 页面为准。

## 适用于谁

- 第一次想调用 Gemini API，不知道 API Key 去哪里申请的人；
- 手里有旧密钥，突然报错或在 AI Studio 里看到 Unrestricted、Blocked 标签的人；
- 想知道密钥该放在哪、怎样才算安全的开发者。

## 结论先说

1. **在 Google AI Studio 的 API Keys 页面创建**，地址是 aistudio.google.com/apikey，创建本身免费。
2. **每个密钥都属于一个 Google Cloud 项目**。新用户接受服务条款后，AI Studio 会自动建好一个默认项目和一个密钥。
3. **限额和计费跟着项目走，不跟着密钥走**：同一个项目下多建几个密钥，额度不会变多。
4. **2026 年起密钥规则变了**：新建的密钥都是「授权密钥（auth key）」；没有加限制的旧式标准密钥会被 Gemini API 拒绝。
5. **密钥当密码对待**：用环境变量 `GEMINI_API_KEY` 保存，不写进代码仓库，不放进网页或手机应用的前端代码。

## 一、创建密钥

1. 用 Google 账号登录 Google AI Studio，打开 API Keys 页面（左侧 Dashboard 里也能进）。
2. 新用户：接受服务条款后，官方说明 AI Studio 会**自动创建一个默认的 Google Cloud 项目和 API 密钥**，可以直接用。默认项目的名字可以在 Dashboard 的 Projects 页面里改。
3. 需要新密钥时，点「创建 API 密钥（Create API key）」，按弹窗选择或新建项目。
4. 复制密钥，马上存到安全的地方。

**已经有 Google Cloud 账号的人**：官方说明这种情况下 AI Studio 不会自动建默认项目，也不会默认显示你所有的项目，需要先导入：Dashboard → Projects → 「导入项目（Import projects）」→ 搜索并选中项目 → Import，然后回到 API Keys 页面在这个项目里建密钥。

前提条件（官方条款和可用地区页）：年满 18 岁；所在地区在官方可用地区列表内。该列表目前没有列出中国大陆，请遵守所在地法律和服务条款。

## 二、密钥、项目和计费的关系

- **项目（Google Cloud project）**管理计费、协作者和权限，AI Studio 只是提供了一个轻量的管理界面。
- **速率限制按项目计算，不按密钥**。账单页也写明：密钥没有独立的计费设置，它继承所在项目的档位和计费状态；同一项目下所有密钥的用量加在一起算。
- 项目没有绑定结算账号时处于免费层，绑定并充值后进入付费层。区别见本站《Gemini API 免费额度是多少：免费层级、RPM / TPM / RPD 速率限制与限额查询》和《Gemini API 怎么收费：按 token 计费、预付费充值（Prepay）与支出上限设置》。

AI Studio 的管理上限（官方列出）：Projects 页面一次最多可创建 10 个项目；API keys 和 Projects 页面最多显示 100 个密钥、50 个项目；只显示无限制的密钥或仅限 Gemini API 的密钥，其他限制方式的密钥要去 Google Cloud 控制台管理。

## 三、2026 年的新规则：标准密钥与授权密钥

官方 API key 页面说明，Gemini API 正在从标准密钥过渡到授权密钥：

| | 标准密钥（Standard） | 授权密钥（Authorization / auth key） |
| --- | --- | --- |
| 作用 | 把请求关联到项目，用于计费和配额 | 直接绑定到一个 Google Cloud 服务账号，请求以该服务账号身份处理 |
| 权限控制 | 不能识别调用者，权限粒度有限 | 支持更细的访问控制 |
| 默认限制 | 无 | 默认只能用于 Gemini API（Generative Language API） |
| 泄露处理 | — | 检测到泄露后能更快停用 |

三个时间点：

- **2026 年 5 月 28 日起**，在 AI Studio 新建的密钥自动是授权密钥；
- **没有任何限制的标准密钥**，Gemini API 会拒绝它的请求；加了明确限制的标准密钥还能继续用；
- **2026 年 5 月 7 日起**，长期休眠的无限制密钥会被封禁，在 AI Studio 里显示 **Blocked** 标签，只能新建密钥或改用已有的受限密钥。

旧密钥怎么处理，官方给了两条路：

- **只用于 Gemini API 的密钥**：在 API Keys 页面找到带 **Unrestricted** 标签的密钥，鼠标悬停后点「添加限制（Add restrictions）」→ 选「仅限 Gemini API（Restrict to Gemini API only）」→ 「限制密钥（Restrict key）」。需要有项目的 `apikeys.keys.update` 权限。
- **迁移到授权密钥**：看「密钥类型（Key Type）」一列找出 Standard 的密钥 → 新建一个密钥（自动是授权密钥）→ 把程序、环境变量和部署配置都换成新密钥 → 测试通过后删除旧密钥。

## 四、设置环境变量

官方推荐把密钥放在环境变量 `GEMINI_API_KEY` 或 `GOOGLE_API_KEY` 里，官方 SDK 会自动读取；**两个都设了的话，`GOOGLE_API_KEY` 优先**。

macOS（Zsh）或 Linux（Bash）：在 `~/.zshrc` 或 `~/.bashrc` 末尾加一行，然后执行 `source` 让它生效。

```bash
export GEMINI_API_KEY="你的API密钥"
```

Windows：在搜索栏搜「环境变量」→ 在系统属性里点「环境变量」→ 在用户变量或系统变量下点「新建」→ 变量名填 `GEMINI_API_KEY`，值填密钥 → 确定，然后**重新打开一个终端窗口**。

不方便用环境变量时，也可以在代码里显式传入（官方说只在没法用环境变量时这样做）：

```python
from google import genai

client = genai.Client(api_key="你的API密钥")
```

## 五、测试密钥能不能用

用官方文档里的 REST 请求最直接：

```bash
curl "https://generativelanguage.googleapis.com/v1beta/interactions" \
  -H "Content-Type: application/json" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -X POST \
  -d '{
    "model": "gemini-3.8-flash",
    "input": "用一句话介绍你自己"
  }'
```

返回的 JSON 里 `status` 为 `completed` 就说明密钥有效。用 Python 调用见本站《Gemini API Python 调用教程：安装 google-genai SDK、流式输出、多轮对话与传图片》。

## 六、密钥安全

官方把它概括为「像对待密码一样对待 API 密钥」。泄露的后果是别人消耗你的配额、产生意外费用，甚至访问到私有资源。

- **不要提交到 Git 等版本控制系统**；
- **生产环境不要把密钥放在客户端**：写进网页或手机应用里的密钥可以被用户提取出来，正确做法是自己搭一个后端服务代为调用；
- 生产环境建议用 Google Cloud Secret Manager 这类密钥管理服务；
- 在 Google Cloud 控制台设置结算提醒，用量或费用异常时能收到通知；
- 可以在 Google Cloud 控制台的凭据页面给密钥加「应用限制」，例如只允许指定 IP 地址使用。

**怀疑泄露时**，官方的处理顺序是：先生成新密钥 → 把应用更新为新密钥并部署 → 确认新密钥工作正常后，再停用或删除旧密钥（避免服务中断）→ 到 Google Cloud 控制台检查账单和用量里有没有异常调用。

## 常见问题

**Q：「创建 API 密钥」按钮是灰的，提示没有权限？**
官方说明这是缺少 IAM 权限。请项目或组织管理员授予包含这些权限的角色（如项目编辑者）：`resourcemanager.projects.get`、`apikeys.keys.create`、`serviceusage.services.enable`、`iam.serviceAccounts.create`、`iam.serviceAccountApiKeyBindings.create`。拿不到权限时，可以新建一个不隶属于任何组织的项目来创建密钥。

**Q：报「API key not valid. Please pass a valid API key.」？**
这是密钥无效的提示：检查是否复制完整、环境变量在当前终端是否生效、有没有同时设置了另一个 `GOOGLE_API_KEY`（它优先生效）、密钥是否已被删除。

**Q：报「Your API key was reported as leaked. Please use another API key.」？**
官方排错页说明，已知泄露的密钥会被主动封禁，不能再调用 Gemini API。到 AI Studio 新建密钥，并检查自己的密钥保管方式。因此产生的异常费用，官方的指引是提交结算支持工单。

**Q：项目里的其他成员能看到密钥吗？**
按官方权限表，项目的编辑者（Editor）和所有者（Owner）可以查看面板并管理密钥；查看者（Viewer）能看面板和密钥，但不能创建、修改或删除。

**Q：多建几个密钥能多拿免费额度吗？**
不能。官方写明速率限制按项目计算，而不是按密钥。

## 参考资料

- Using Gemini API keys（官方）：https://ai.google.dev/gemini-api/docs/api-key
- Gemini API quickstart（官方）：https://ai.google.dev/gemini-api/docs/quickstart
- Troubleshooting guide（官方）：https://ai.google.dev/gemini-api/docs/troubleshooting
- Troubleshoot Google AI Studio（官方）：https://ai.google.dev/gemini-api/docs/troubleshoot-ai-studio
- API errors（官方）：https://ai.google.dev/gemini-api/docs/api-errors
- API errors（generateContent 版，官方）：https://ai.google.dev/gemini-api/docs/generate-content/api-errors
- Billing（官方）：https://ai.google.dev/gemini-api/docs/billing
- Available regions for Google AI Studio and Gemini API（官方）：https://ai.google.dev/gemini-api/docs/available-regions
- Gemini API Additional Terms of Service（官方）：https://ai.google.dev/gemini-api/terms
