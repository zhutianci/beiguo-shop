---
title: OpenAI API Key 怎么获取：创建密钥、项目权限与安全保管
slug: openai-api-key
products: [chatgpt]
models: []
accountTier: OTHER
excerpt: 想调用 OpenAI API，第一步是在 OpenAI 开发者平台创建 API Key。本文按官方文档讲清在哪里创建、项目和权限怎么选、为什么 ChatGPT 会员不含 API 额度，以及密钥泄露前后该怎么防、怎么补救。
checkedOn: 2026-10-07
sources:
  - https://developers.openai.com/api/docs/quickstart
  - https://developers.openai.com/api/reference/overview
  - https://developers.openai.com/api/docs/guides/production-best-practices
  - https://help.openai.com/en/articles/9186755-managing-projects-in-the-api-platform
  - https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety
  - https://help.openai.com/en/articles/8304786
  - https://help.openai.com/en/articles/9039756-managing-billing-for-chatgpt-and-the-api-platform
  - https://help.openai.com/en/articles/8983031
  - https://help.openai.com/en/articles/10910291-api-organization-verification
  - https://developers.openai.com/api/docs/guides/spend-limits
  - https://developers.openai.com/api/docs/guides/error-codes
verify:
  - 官方在「服务账号」说明里写明密钥创建后只显示一次；普通用户密钥是否同样只显示一次，帮助中心没有单独写，以创建弹窗提示为准
  - 截图来自帮助中心旧版界面（权限列表里还有已下线的 Assistants 端点），当前界面布局可能不同
  - 「创建密钥时可设置过期时间」来自生产最佳实践文档，弹窗里该选项的具体名称未确认
  - 手机号验证只在部分国家对新用户推出，是否会遇到以实际页面为准
---

> 本文根据 OpenAI 开发者文档（Quickstart、API Reference、Production best practices）和帮助中心（项目管理、API Key 安全、账单）整理，资料核对于 2026-10-07；截图引用自 OpenAI 帮助中心，为英文界面。

## 适用于谁

- 第一次接触 OpenAI API，想拿到一个 API Key 跑通示例代码的人；
- 已经有 ChatGPT Plus / Pro，以为会员里自带 API 额度的人；
- 要把 Key 交给同事、部署到服务器，想知道怎么分权限、防泄露的人。

## 结论先说

1. **在哪创建**：登录 OpenAI 开发者平台（platform.openai.com），进入 **Settings（设置）→ API keys**，点 **Create new secret key（创建新密钥）**。
2. **ChatGPT 会员 ≠ API 额度**：官方明确说 ChatGPT 和 API 平台是两套独立的计费系统。Plus、Pro 的订阅费不能抵扣 API 调用，要用 API 需要在 API 平台单独添加付款方式或购买额度。
3. **按项目建 Key**：每个应用建一个项目（Project），在项目里建 Key，权限尽量选 **Restricted（受限）**，并设置过期时间。
4. **创建后马上保存**，之后把它放进环境变量 `OPENAI_API_KEY`，不要写进代码、不要放到网页前端或手机 App 里。
5. **怀疑泄露就立即删除重建**，同时去用量页面看有没有异常调用，并给组织或项目设置支出上限。

## 步骤

### 1. 登录开发者平台，确认组织和项目

用你的 OpenAI 账号登录 platform.openai.com。页面左上角显示的是当前**组织（Organization）**和**项目（Project）**，点名字可以切换。

- 每个组织都有一个删不掉的 **Default project（默认项目）**；
- 只有组织 Owner（所有者）能新建项目：点左上角项目名 → **Create project**，填名称后创建；
- 项目里的文件、存储等资源只属于这个项目，不能跨项目移动，所以「一个应用一个项目」最好管理。

### 2. 创建密钥

进入 **Settings → API keys**，点右上角 **Create new secret key**。

![API keys 页面：左侧 Organization 菜单下选中 API keys，右上角是 Create new secret key 按钮，页面提示不要把密钥分享给别人或暴露在浏览器等客户端代码里（英文界面）](seed:g135-api-keys-page.png)
*图片来源：[OpenAI 帮助中心《Managing projects in the API platform》](https://help.openai.com/en/articles/9186755-managing-projects-in-the-api-platform)*

弹窗里需要选的几项：

- **Owned by（归属）**：**You（你本人）** 表示密钥绑定你的用户，你被移出组织或项目后它会失效；**Service account（服务账号）** 适合服务器等程序长期使用，只有组织或项目 Owner 能建；
- **Name（名称）**：写清用途，如「blog-prod」，以后排查用量时一眼能认出来；
- **Project（项目）**：选这个 Key 能访问的项目；
- **Permissions（权限）**：**All（全部，默认）**、**Restricted（受限，可按端点分别设为无 / 读 / 写）**、**Read Only（只读）**。

![Create new secret key 弹窗：Owned by 可选 You 或 Service account，下方是 Name、Project，Permissions 选中 Restricted 后可按资源分别设置 None / Read / Write（英文界面）](seed:g135-key-permissions.png)
*图片来源：[OpenAI 帮助中心《Managing projects in the API platform》](https://help.openai.com/en/articles/9186755-managing-projects-in-the-api-platform)*

另外两点：

- 官方生产最佳实践**强烈建议给项目密钥设置过期时间**，并定期轮换：到期前先建新 Key、换到应用里、确认正常后再吊销旧 Key；
- 部分国家和地区的新用户，首次生成 API Key 时可能要求手机号验证，同一个号码最多只能用于 3 次验证。

### 3. 立刻保存密钥

密钥创建后会显示完整内容。帮助中心在服务账号部分写明：出于安全原因，之后无法在账号里再次查看，丢了只能重新生成。建议当场存进密码管理器，或直接写进下一步的环境变量。

### 4. 放进环境变量

官方 Quickstart 推荐把密钥导出为环境变量 `OPENAI_API_KEY`，官方 SDK 会自动读取：

```bash
# macOS / Linux
export OPENAI_API_KEY="把这里换成你的密钥"
```

```powershell
# Windows（对之后新打开的终端生效）
setx OPENAI_API_KEY "把这里换成你的密钥"
```

Windows 用 `setx` 设置后，要**新开一个终端窗口**才读得到。想验证 Key 能不能用，可以列一下可用模型：

```bash
curl https://api.openai.com/v1/models -H "Authorization: Bearer $OPENAI_API_KEY"
```

返回模型列表说明 Key 有效；返回 401 就检查是否复制完整、有没有多余空格。接下来写第一段 Python 代码，见 [/guides/openai-api-python-quickstart](/guides/openai-api-python-quickstart)。

### 5. 开通 API 计费

要持续使用 API，需要在 API 平台的 **Billing（账单）** 页面添加付款方式；新账号默认是预付费，先买额度再用。价格、预付额度和用量怎么看，见 [/guides/openai-api-pricing-billing](/guides/openai-api-pricing-billing)。

## 安全保管：官方建议汇总

- **不要放进客户端**：浏览器、手机 App 里的密钥可以被别人提取并用你的额度调用。请求应该经过你自己的后端服务器。
- **不要提交到代码仓库**：用环境变量或 `.env` 文件（并加进 `.gitignore`）；用 GitHub Actions 的话放进 GitHub Secrets；团队上线建议用密钥管理服务。
- **不要共享密钥**：官方说明共享 API Key 违反使用条款。给同事用，就把他邀请进组织或项目，让他生成自己的 Key。
- **最小权限 + 过期时间**：按需选 Restricted；管理员还可以在平台设置里强制规定密钥最长有效期。
- **设支出上限**：在 **Limits（限额）** 里给组织或项目设月度支出上限，并打开 **Enforce a hard limit（强制硬上限）**，泄露时能止损。注意只设提醒（alert）不会拦截请求，硬上限生效也有延迟。
- **限制来源 IP**：可以开启 IP 白名单，只允许你的服务器 IP 调用，即使 Key 正确也会拒绝其他来源。
- **谨慎交给第三方工具**：任何要你填 API Key 的第三方产品，先查清公司背景和隐私政策。

**如果怀疑泄露**：立即在 API keys 页面删除或轮换该 Key、更新应用里的配置；到 **Usage（用量）** 页面核对调用是否和自己的业务对得上；然后通过 help.openai.com 联系官方支持。页面上也提示，OpenAI 可能会自动停用公开泄露的密钥。

## 常见问题

**Q：我有 ChatGPT Plus，为什么调用 API 还提示没额度？**
因为两者计费完全分开。ChatGPT 订阅在 chatgpt.com 的设置里管理，API 在 platform.openai.com 的 Billing 里单独付费。

**Q：密钥忘了保存怎么办？**
无法找回完整内容，删除旧 Key 再新建一个，然后把应用里的配置换成新的。

**Q：报错 401 Incorrect API key provided？**
常见原因：复制时少了字符或多了空格、用了别的组织 / 项目的 Key、Key 已被删除，或者本地还缓存着旧 Key。确认无误仍报错就重新生成。

**Q：报错 403 Country, region, or territory not supported？**
说明你所在地区不在 API 支持范围内，请查看官方的[支持国家和地区列表](https://developers.openai.com/api/docs/supported-countries)。

**Q：什么时候需要组织验证（Organization Verification）？**
部分模型、功能或项目需要先完成企业验证或身份验证，平台会在需要时提示。只用常规模型做入门练习一般不会遇到；验证要用政府签发的原件证件，每人只能验证一个账号或组织。

## 参考资料

- OpenAI 开发者文档：Developer quickstart — https://developers.openai.com/api/docs/quickstart
- OpenAI 开发者文档：API Overview（Authentication）— https://developers.openai.com/api/reference/overview
- OpenAI 开发者文档：Production best practices（API keys）— https://developers.openai.com/api/docs/guides/production-best-practices
- OpenAI 开发者文档：Spend limits — https://developers.openai.com/api/docs/guides/spend-limits
- OpenAI 帮助中心：Managing projects in the API platform — https://help.openai.com/en/articles/9186755-managing-projects-in-the-api-platform
- OpenAI 帮助中心：Best Practices for API Key Safety — https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety
- OpenAI 帮助中心：Keeping your account secure（Protect your API keys）— https://help.openai.com/en/articles/8304786
- OpenAI 帮助中心：Managing billing for ChatGPT and the API platform — https://help.openai.com/en/articles/9039756-managing-billing-for-chatgpt-and-the-api-platform
- OpenAI 帮助中心：Phone verification（API Key 首次生成）— https://help.openai.com/en/articles/8983031
- OpenAI 帮助中心：API Organization Verification — https://help.openai.com/en/articles/10910291-api-organization-verification
