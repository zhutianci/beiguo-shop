---
title: Gemini API Python 调用教程：安装 google-genai SDK、流式输出、多轮对话与传图片
slug: gemini-api-python-quickstart
products: [gemini]
models: [gemini-llm]
accountTier: OTHER
excerpt: 用官方 google-genai SDK 调 Gemini API：安装配置、第一个请求、系统指令与思考等级、流式输出、多轮对话、传图片和查看 token 用量，按 2026 年 10 月官方默认的 Interactions API 写法。
checkedOn: 2026-10-10
sources:
  - https://ai.google.dev/gemini-api/docs/quickstart
  - https://ai.google.dev/gemini-api/docs/generate-content/quickstart
  - https://ai.google.dev/gemini-api/docs/interactions-overview
  - https://ai.google.dev/gemini-api/docs/text-generation
  - https://ai.google.dev/gemini-api/docs/libraries
  - https://ai.google.dev/gemini-api/docs/migrate
  - https://ai.google.dev/gemini-api/docs/files
  - https://ai.google.dev/gemini-api/docs/thinking
  - https://ai.google.dev/gemini-api/docs/tokens
  - https://ai.google.dev/gemini-api/docs/models
  - https://ai.google.dev/gemini-api/docs/deprecations
  - https://ai.google.dev/gemini-api/docs/troubleshooting
  - https://github.com/googleapis/python-genai
verify:
  - 示例模型 ID 用的是 gemini-3.8-flash（Models 页、Text generation 页、API key 页的写法）；官方 Quickstart 页的示例仍写 gemini-3.5-flash，而弃用页写明对 gemini-3.5-flash 的请求会自动转到 gemini-3.6-flash
  - Python 版本要求两处不一致：SDK 仓库 pyproject.toml 写 requires-python >=3.10，官方 generateContent 版快速开始页写 Python 3.9+；正文按 3.10 及以上写
  - Interactions 调用失败时 SDK 抛出的具体异常类名，官方文档和 README 没有列出（README 的 errors.APIError 示例用的是 generate_content），正文未写类名
  - 2026-10-10 当天 GitHub 仓库里的 SDK 版本号是 2.29.0，README 提示下一个大版本会有不兼容改动、可锁定 <3.0.0
---

> 本文根据 Gemini API 官方文档（Quickstart、Interactions API、Text generation、Files API、Libraries）和官方 SDK 仓库 googleapis/python-genai 整理，资料核对于 2026-10-10。示例代码基于官方示例改写并加了中文注释；模型 ID 更新很快，以官方 Models 页为准。

## 适用于谁

- 会一点 Python，想在脚本或后端里调用 Gemini 的开发者；
- 搜「gemini api python」「python sdk」「python 调用」的人；
- 看过旧教程里的 `google.generativeai` 或 `generate_content`，不确定现在该用哪种写法的人。

还没有密钥的，先看本站《Gemini API Key 怎么获取：在 AI Studio 创建密钥、设置环境变量与安全限制》。

## 结论先说

1. **官方 SDK 是 `google-genai`**：`pip install -U google-genai`，导入写 `from google import genai`。旧的 `google-generativeai` 包已弃用，不再提供新功能。
2. **官方现在默认推荐 Interactions API**：`client.interactions.create(model=..., input=...)`，回复文本在 `interaction.output_text`。官方说明它自 2026 年 6 月起正式可用（GA），建议所有新项目使用。
3. **旧的 generateContent 写法仍然完全受支持**，官方称它为 legacy（旧版）接口，老项目不用急着改。
4. **多轮对话可以让服务器记历史**：把上一轮的 `interaction.id` 传给 `previous_interaction_id` 即可；但系统指令和生成参数每一轮都要重新传。
5. **密钥放环境变量 `GEMINI_API_KEY`**，SDK 自动读取。

## 一、安装与配置

```bash
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -U google-genai

export GEMINI_API_KEY="你的API密钥"   # Windows PowerShell: $env:GEMINI_API_KEY="你的API密钥"
```

- Python 版本：SDK 仓库要求 3.10 及以上。
- 官方说明 Interactions API 需要 `google-genai` 2.3.0 及以上版本，装最新版即可。
- 环境变量 `GEMINI_API_KEY` 和 `GOOGLE_API_KEY` 都能被自动识别，两个都设时后者优先。

## 二、第一个请求

新建 `quickstart.py`：

```python
from google import genai

client = genai.Client()  # 自动读取环境变量里的密钥

interaction = client.interactions.create(
    model="gemini-3.8-flash",
    input="用三句话解释什么是向量数据库",
)
print(interaction.output_text)
```

运行 `python quickstart.py`。几个要点：

- `output_text` 是 SDK 提供的便捷属性，直接给出最终文本；
- 完整结果在 `interaction.steps` 里，是一个按时间排列的「步骤」列表，包括模型的思考（`thought`）、工具调用和最终输出（`model_output`）；
- 模型 ID 用官方 Models 页列出的名字。截至 2026-10-10，最新的稳定版文本模型是 `gemini-3.8-flash`，更便宜的是 `gemini-3.5-flash-lite`，`gemini-3.1-pro-preview` 是预览版。

## 三、系统指令与思考等级

```python
interaction = client.interactions.create(
    model="gemini-3.8-flash",
    system_instruction="你是一名耐心的 Python 老师，用中文回答，并配一个最小可运行的例子。",
    input="列表推导式怎么用？",
    generation_config={
        "thinking_level": "low",   # gemini-3.8-flash 可选 low / medium / high，默认 medium
    },
)
print(interaction.output_text)
```

- Gemini 3 系列默认开启思考。想更快、更省，把 `thinking_level` 调低；复杂推理再调高。Gemini 3.8 Flash 不支持 `minimal`。
- 旧教程里常见的 `temperature`、`top_p`、`top_k`：官方说明从 Gemini 3.6 Flash、3.5 Flash-Lite 起已弃用并被忽略，新代码不要再传。
- 系统指令的写法见本站《Google AI Studio 系统指令怎么写：System instructions 与运行设置（思考等级、温度、联网搜索）》。

## 四、流式输出

加上 `stream=True`，返回的是一串事件，文本片段在 `step.delta` 事件里：

```python
stream = client.interactions.create(
    model="gemini-3.8-flash",
    input="写一段 200 字左右的秋天散文",
    stream=True,
)
for event in stream:
    if event.event_type == "step.delta" and event.delta.type == "text":
        print(event.delta.text, end="", flush=True)
print()
```

流里还会有 `interaction.created`、`step.start`、`step.stop`、`interaction.completed` 等事件，只想显示文字时按上面这样过滤就够了。

## 五、多轮对话

**方式一：服务器保存历史（官方推荐）**

```python
first = client.interactions.create(
    model="gemini-3.8-flash",
    input="我家里有 2 只狗。",
)
print(first.output_text)

second = client.interactions.create(
    model="gemini-3.8-flash",
    input="那我家一共有多少只爪子？",
    previous_interaction_id=first.id,   # 接上一轮
)
print(second.output_text)
```

要知道的三件事：

- `previous_interaction_id` **只带上对话历史**。`system_instruction`、`generation_config`、`tools` 只对当次请求生效，每一轮都要重新传。
- 默认 `store=true`，交互记录会保存在服务器上：官方写明**免费层保留 1 天，付费层保留 55 天**，到期自动删除，也可以调用删除接口提前删。过了保留期的对话就接不上了。
- 官方说这种方式更容易命中隐式缓存，有助于降低多轮对话的成本。

**方式二：自己管理历史（无状态）**

不想把对话存在服务器上，就设 `store=False`，每次把完整历史传过去。官方强调：模型返回的所有步骤（包括 `thought` 思考步骤）必须**原样**放回历史里，不能删改，因为里面带有延续推理所需的签名。

```python
history = [
    {"type": "user_input", "content": [{"type": "text", "text": "我家里有 2 只狗。"}]}
]
first = client.interactions.create(model="gemini-3.8-flash", store=False, input=history)

for step in first.steps:               # 把模型返回的步骤原样追加
    history.append(step.model_dump())

history.append(
    {"type": "user_input", "content": [{"type": "text", "text": "一共有多少只爪子？"}]}
)
second = client.interactions.create(model="gemini-3.8-flash", store=False, input=history)
print(second.steps[-1].content[0].text)   # 官方示例的取法：最后一个步骤里的文本
```

## 六、传图片和文件

先用 Files API 上传，再把文件地址放进 `input`：

```python
uploaded = client.files.upload(file="photo.jpg")

interaction = client.interactions.create(
    model="gemini-3.8-flash",
    input=[
        {"type": "text", "text": "这张图里有什么？用中文描述。"},
        {"type": "image", "uri": uploaded.uri, "mime_type": uploaded.mime_type},
    ],
)
print(interaction.output_text)
```

小图片也可以不上传，读成 base64 后用 `{"type": "image", "data": 图片的base64字符串, "mime_type": "image/jpeg"}` 直接放进请求。官方给出的边界：

- 整个请求（文件、提示词、系统指令加在一起）超过 100 MB 时必须用 Files API，PDF 的界限是 50 MB；
- Files API 每个项目可存 20 GB，单个文件最大 2 GB，文件保存 48 小时后自动删除；
- Files API 本身不收费，在 Gemini API 可用的地区都能用。

同样的写法可以传音频（`"type": "audio"`）等其他类型，Gemini 3.8 Flash 支持文本、图片、视频、音频和 PDF 输入。

## 七、看 token 用量

```python
print(interaction.usage)   # 含输入、输出、思考 token 数

# 发送前先估算输入 token
count = client.models.count_tokens(model="gemini-3.8-flash", contents="你好，世界")
print(count.total_tokens)
```

官方说明开启思考时，输出费用按「输出 token + 思考 token」计算，思考 token 数在 `interaction.usage.total_thought_tokens`。统计 token 的请求本身不计费。

## 八、报错和重试

- 官方排错页说明，Python SDK 默认会对超时、网络问题、429 和 5xx 这类暂时性错误**自动重试，最多 4 次**，首次等待约 1 秒，最长 60 秒。
- 400、402、403 这类错误重试没有用，要先解决问题本身（参数写错、预付余额用完、密钥无权限）。
- 遇到 429 的完整排查方法见本站《Gemini API 429 错误怎么解决：RESOURCE_EXHAUSTED 的原因与 400 / 403 / 503 排查表》。

## 九、旧写法 generateContent 还能用吗

能用。官方的说法是 generateContent 现在属于 legacy 接口，但仍然完全受支持；同时也说明今后新模型、新工具和智能体功能会先在 Interactions API 上线。旧写法长这样：

```python
response = client.models.generate_content(
    model="gemini-3.8-flash",
    contents="用三句话解释什么是向量数据库",
)
print(response.text)

chat = client.chats.create(model="gemini-3.8-flash")   # SDK 在本地帮你记历史
print(chat.send_message("我家里有 2 只狗。").text)
```

反过来，有几项功能官方写明**目前只有 generateContent 支持**：Batch API、Python 的自动函数调用、显式上下文缓存、自定义安全设置。用到这些就继续用旧接口。

如果你的代码里还是 `import google.generativeai as genai`，那是更早的旧 SDK，官方已在 2025 年 11 月 30 日弃用，建议按迁移指南换到 `google-genai`。

## 常见问题

**Q：报找不到模型（404）？**
检查模型 ID 是否和官方 Models 页一致。预览版模型的名字带 `-preview` 后缀，下线后会直接不可用，下线时间表在官方 Deprecations 页。

**Q：能在 Jupyter / Colab 里用吗？**
能。官方提醒 Colab 的地区限制按 Colab 实例所在的地区判断，而不是按用户所在地。

**Q：免费能调用吗？**
项目没绑定结算账号时处于免费层，可以免费调用部分模型，但有速率限制，而且提交的内容会被 Google 用于改进产品。详见本站《Gemini API 免费额度是多少：免费层级、RPM / TPM / RPD 速率限制与限额查询》。

**Q：Gemini API 在哪些地区可用？**
以官方 Available regions 页面的列表为准，目前没有列出中国大陆。请遵守所在地法律和服务条款。

## 参考资料

- Gemini API quickstart（官方）：https://ai.google.dev/gemini-api/docs/quickstart
- Gemini API quickstart（generateContent 版，官方）：https://ai.google.dev/gemini-api/docs/generate-content/quickstart
- Interactions API（官方）：https://ai.google.dev/gemini-api/docs/interactions-overview
- Text generation（官方）：https://ai.google.dev/gemini-api/docs/text-generation
- Gemini API libraries（官方）：https://ai.google.dev/gemini-api/docs/libraries
- Migrate to the Google GenAI SDK（官方）：https://ai.google.dev/gemini-api/docs/migrate
- Files API（官方）：https://ai.google.dev/gemini-api/docs/files
- Gemini thinking（官方）：https://ai.google.dev/gemini-api/docs/thinking
- Understand and count tokens（官方）：https://ai.google.dev/gemini-api/docs/tokens
- Models（官方）：https://ai.google.dev/gemini-api/docs/models
- Gemini deprecations（官方）：https://ai.google.dev/gemini-api/docs/deprecations
- Troubleshooting guide（官方）：https://ai.google.dev/gemini-api/docs/troubleshooting
- googleapis/python-genai（官方 SDK 仓库）：https://github.com/googleapis/python-genai
