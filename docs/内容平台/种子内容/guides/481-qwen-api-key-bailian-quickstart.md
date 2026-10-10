---
title: 千问 API Key 怎么获取：阿里云百炼开通、免费额度与 OpenAI 兼容调用
slug: qwen-api-key-bailian-quickstart
products: [qwen]
models: []
accountTier: OTHER
excerpt: 千问 API Key 怎么获取、百炼的免费额度怎么用？本文按阿里云百炼官方文档讲清开通、创建 Key、环境变量、两类 Base URL 的区别，给出 OpenAI 兼容的 Python 示例，并说明免费额度规则和「用完即停」开关。
checkedOn: 2026-10-11
sources:
  - https://help.aliyun.com/zh/model-studio/first-api-call-to-qwen
  - https://help.aliyun.com/zh/model-studio/get-api-key
  - https://help.aliyun.com/zh/model-studio/base-url
  - https://help.aliyun.com/zh/model-studio/new-free-quota
  - https://help.aliyun.com/zh/model-studio/models
---

## 适用于谁

- 搜「千问 api key」「千问 api key怎么获取」「百炼 api key获取」「千问怎么用api」「千问免费额度怎么用」的开发者；
- 想把千问模型接进自己的程序，或接进 Chatbox、Cline、Dify 这类工具的人；
- 担心免费额度用完后被自动扣费的人。

本文根据阿里云百炼（Model Studio）帮助中心的五篇官方文档整理，资料核对于 2026-10-11。模型价格没有在这几篇文档里列出，本文不写价格数字，以百炼控制台模型广场为准。

## 结论先说

1. **千问 API 在阿里云百炼上开通**，不是在千问 App 里。用阿里云主账号进入百炼控制台，同意协议即开通。
2. **API Key 在控制台的 API Key 页面创建**，先在右上角选地域。各地域的 Key、接入域名、模型列表相互独立，不能混用。
3. **调用方式兼容 OpenAI SDK**：改 `api_key`、`base_url`、`model` 三处即可。
4. **新人免费额度**：仅华北 2（北京）地域有；每个模型单独计算，通常为 100 万 Token，有效期 90 天。
5. **怕被扣费就打开「免费额度用完即停」**：额度耗尽后请求会被拒绝而不是转为按量付费。

## 步骤

### 1. 开通百炼

1. 没有阿里云账号先注册；
2. 用**主账号**进入阿里云百炼控制台，阅读并同意协议后自动开通。没有弹出协议说明已经开通过；
3. 如果提示尚未实名认证，按提示完成认证。

关于实名：免费额度文档写的是首次开通即自动发放新人额度，未实名认证的用户也能使用，但系统会强制开启「用完即停」，额度用完后必须完成认证并充值才能继续。

### 2. 创建 API Key

1. 打开控制台的 API Key 页面，在右上角选择地域（国内一般选华北 2（北京））；
2. 点「创建 API Key」；
3. 归属账号默认是主账号，归属业务空间默认是「默认业务空间」；
4. 权限建议选「全部」。需要精细控制时选「自定义」，可以限制可访问的 IP 和可调用的模型范围；
5. 确定后在列表里点复制图标拿到 Key。

官方文档写明的几条规则：

- 创建时不需要选模型，调用时用 `model` 参数指定；
- API Key 没有失效时间；主动删除后立即失效且不可恢复；
- 每个账号在每个地域最多 50 个 Key；
- 默认业务空间的 Key 可以调用所有标准模型；子业务空间的 Key 只能调用已授权的模型。

### 3. 把 Key 放进环境变量

官方建议不要把 Key 写在代码里，环境变量名是 `DASHSCOPE_API_KEY`。

```bash
# macOS / Linux（写入 ~/.zshrc 或 ~/.bashrc 后重新打开终端）
export DASHSCOPE_API_KEY="sk-你的Key"

# Windows PowerShell（用户级，设置后重新打开窗口）
[Environment]::SetEnvironmentVariable("DASHSCOPE_API_KEY", "sk-你的Key", "User")
```

设置后要重新打开终端或重启 IDE 才会生效；用 `sudo` 运行脚本时默认不继承用户环境变量，官方给的办法是加 `-E`。

### 4. 选对 Base URL

官方的 Base URL 总览把按量付费的地址分成两类：

| 类型 | 华北 2（北京）OpenAI 兼容地址 | 特点 |
| --- | --- | --- |
| DashScope 域名 | `https://dashscope.aliyuncs.com/compatible-mode/v1` | 原有的共享域名，支持跨业务空间的 Key，文档说明仍可继续使用 |
| 业务空间专属域名 | `https://{WorkspaceId}.cn-beijing.maas.aliyuncs.com/compatible-mode/v1` | 官方推荐用于生产环境；只能配合该业务空间的 Key 使用 |

`{WorkspaceId}` 要换成你的业务空间 ID，在控制台的业务空间管理页面查看。其他地域各有自己的地址，例如新加坡的 DashScope 域名是 `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`，完整列表见官方 Base URL 总览。

第一次试用、在第三方工具里填地址，用 DashScope 域名最省事；上生产再换成专属域名。

### 5. 发出第一个请求

Python 需要 3.9 或以上版本，安装 OpenAI SDK：

```bash
pip install -U openai
```

新建 `hello_qwen.py`：

```python
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.getenv("DASHSCOPE_API_KEY"),
    # 华北2（北京）的 DashScope 域名；用专属域名时换成带 WorkspaceId 的地址
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)

completion = client.chat.completions.create(
    model="qwen3.8-max",  # 以官方模型列表为准
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "用三句话介绍你自己"},
    ],
)
print(completion.choices[0].message.content)
```

运行 `python hello_qwen.py`，能打印出回复就说明通了。

模型名怎么填：核对时官方模型列表「文本生成」一栏排在前面的是 `qwen3.8-max`、`qwen3.7-plus`、`qwen3.8-flash`，同一平台上还有 DeepSeek、Kimi、GLM 等第三方模型。模型更新很快，以模型列表页面为准。

### 6. 接进第三方工具

在 Chatbox、Cline、Dify 这类工具里通常只要填三样：API Key、Base URL、模型名称。官方文档为 Dify、Chatbox、Cline、Claude Code、Postman 分别提供了配置说明。

要注意的是百炼还有 Coding Plan、Token Plan 这类订阅方案，它们用的是**另一套专属 Key 和专属 Base URL**。官方写明 Base URL 必须和同一计费方案的 Key 配套，否则会报 401。

## 常见问题

**Q：免费额度有多少、能用多久？**
按官方的新人免费额度文档：仅华北 2（北京）地域的模型有；每个模型的额度相互独立，通常为 100 万 Token，输入和输出共用；有效期 90 天，从开通百炼、模型发布或模型申请通过之日起算，以较晚者为准；过期不补发。个别模型的额度不同，在控制台的免费额度页面或模型详情页查看。

**Q：免费额度用完会自动扣钱吗？**
已实名认证的账号默认会自动转为按量付费。不想被扣费，就提前开启「免费额度用完即停」：额度耗尽后请求返回 403，不再计费。官方同时提醒生产环境不建议开启，以免服务中断；这个开关关闭后大约需要半小时生效。

**Q：报 Model.AccessDenied？**
官方的解释是用了子业务空间的 Key，而该空间没有这个模型的调用授权。让主账号管理员给子空间授权，或改用默认业务空间的 Key。

**Q：报 401？**
先检查三样是否配套：Key 所属的地域、Base URL 的地域、计费方案。北京地域的 Key 不能配新加坡的地址，订阅方案的 Key 不能配按量付费的地址。

**Q：环境变量设了还是读不到？**
常见原因：只在当前窗口临时设置；设置后没有重新打开终端或 IDE；程序由 systemd 等服务管理器启动，需要在服务配置里单独加。

**Q：可以把 Key 写在网页前端或 App 里吗？**
官方明确不建议在浏览器、移动应用等客户端使用长期有效的 Key，应改用临时 API Key，有效期最长 1800 秒。

**Q：和 DeepSeek、Kimi 的 API 比呢？**
调用方式都兼容 OpenAI SDK，区别主要在模型、价格和限流。可以对照《DeepSeek API Key怎么获取》《Kimi API怎么用》。

## 参考资料

- 阿里云百炼：首次调用千问 API — https://help.aliyun.com/zh/model-studio/first-api-call-to-qwen
- 阿里云百炼：获取 API Key — https://help.aliyun.com/zh/model-studio/get-api-key
- 阿里云百炼：Base URL 总览 — https://help.aliyun.com/zh/model-studio/base-url
- 阿里云百炼：新人免费额度与用完即停规则 — https://help.aliyun.com/zh/model-studio/new-free-quota
- 阿里云百炼：模型列表 — https://help.aliyun.com/zh/model-studio/models
