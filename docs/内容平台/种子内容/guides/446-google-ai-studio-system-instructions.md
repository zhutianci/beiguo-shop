---
title: Google AI Studio 系统指令怎么写：System instructions 与运行设置（思考等级、温度、联网搜索）
slug: google-ai-studio-system-instructions
products: [gemini]
models: [gemini-llm]
accountTier: OTHER
excerpt: 系统指令决定模型的身份和输出规则。本文按官方文档讲清 AI Studio 里系统指令在哪填、怎么写、怎么保存复用，以及思考等级、温度（新模型已弃用）、联网搜索等工具的作用与限制。
checkedOn: 2026-10-10
sources:
  - https://ai.google.dev/gemini-api/docs/ai-studio-quickstart
  - https://blog.google/innovation-and-ai/technology/developers-tools/ai-studio-updates-more-control/
  - https://ai.google.dev/gemini-api/docs/text-generation
  - https://ai.google.dev/gemini-api/docs/prompting-strategies
  - https://ai.google.dev/gemini-api/docs/thinking
  - https://ai.google.dev/gemini-api/docs/whats-new-gemini-3.6
  - https://ai.google.dev/gemini-api/docs/latest-model
  - https://ai.google.dev/gemini-api/docs/safety-settings
  - https://ai.google.dev/gemini-api/docs/google-search
  - https://ai.google.dev/gemini-api/docs/code-execution
  - https://ai.google.dev/gemini-api/docs/url-context
  - https://ai.google.dev/gemini-api/docs/interactions-overview
  - https://ai.google.dev/gemini-api/docs/pricing
verify:
  - 温度参数官方说法不一致：What's new in Gemini 3.6 页写 temperature / top_p / top_k 自 Gemini 3.6 Flash、3.5 Flash-Lite 起已弃用并被忽略；Text generation 页仍给出用 gemini-3.8-flash 设置 temperature 的示例；Prompt design 页写「强烈建议保持默认值」。正文按「新模型不要再调」处理
  - AI Studio 运行设置面板里是否还显示温度滑块、思考等级选项的具体名称，官方文档没有截图说明，以实际界面为准
  - 「保存系统指令」截图和说明来自 2025-10-18 官方博客，属于早期界面
  - Interactions API 不支持自定义安全设置（官方 Safety settings 文档）
---

> 本文根据 Google AI for Developers 官方文档（AI Studio quickstart、Text generation、Prompt design strategies、Thinking、Safety settings、Google Search、Code execution、URL context）和 Google 官方博客整理，资料核对于 2026-10-10。截图来自官方博客和官方文档，图下注明出处，部分为早期界面。

## 适用于谁

- 在 Google AI Studio 里想让模型固定身份、语气或输出格式的人；
- 搜「google ai studio 系统指令」「system instructions」「temperature」「thinking level」想知道每个设置是干什么的人；
- 准备把 AI Studio 里调好的设置搬到 Gemini API 代码里的开发者。

AI Studio 的整体入门见本站《Google AI Studio 怎么用：界面入口、选模型、发第一条提示与获取代码（入门）》。

## 结论先说

1. **系统指令在右上角「运行设置（Run settings）」面板里**，找到「系统指令（System Instructions）」输入框填写；对话开始后也能改。
2. **写法上，把身份、硬性约束和输出格式放进系统指令**，用 XML 风格标签或 Markdown 标题分块，这是官方对 Gemini 3 系列的建议。
3. **新模型不要再调温度**：官方说明从 Gemini 3.6 Flash、3.5 Flash-Lite 起，`temperature`、`top_p`、`top_k` 已弃用并被忽略；想要更稳定的输出，官方建议改用系统指令写明规则。
4. **真正该调的是思考等级（thinking level）**：等级越高推理越充分，但更慢、消耗的 token 更多。
5. **联网搜索、代码执行、URL 上下文是三个内置工具**，在运行设置里按需打开，各有限制。

## 一、系统指令在哪里填

1. 打开 Google AI Studio，默认进入 Playground。
2. 点右上角「运行设置（Run settings）」展开面板，找到「系统指令（System Instructions）」输入框。
3. 写入要求，然后在下方输入框提问、点「运行（Run）」。

官方快速入门用了一个例子：先只写一句「你是住在木卫二上的外星人」，模型的回答又长又发散；再补上「你叫 Tim，回答控制在三段以内，语气要活泼」，输出就稳定多了。官方同时说明，**对话开始之后系统指令仍然可以修改**。

![系统指令面板：下拉框里可以新建指令（Create new instruction），也可以切换已保存的指令（2025 年 10 月的早期界面）](seed:g446-saved-system-instructions.jpg)
*图片来源：[Google 官方博客《Leveling up your developer experience in Google AI Studio》](https://blog.google/innovation-and-ai/technology/developers-tools/ai-studio-updates-more-control/)*

官方博客介绍过「保存系统指令」功能：可以把系统指令存成模板，在不同对话里复用，不必为了保留指令而清空对话。

## 二、系统指令怎么写

官方《Prompt design strategies》对 Gemini 3 系列的建议，归纳起来是：

- **直接、精确**：把目标说清楚，不需要客套和反复强调；
- **结构一致**：用 XML 风格标签（如 `<role>`、`<constraints>`）或 Markdown 标题分隔各部分，选一种用到底；
- **关键要求放进系统指令**：身份（persona）、行为约束、输出格式放在系统指令里，或放在用户提示的最开头；
- **想要详细回答要明说**：Gemini 3 默认回答直接、简洁，需要更口语或更详细时必须在指令里写出来；
- **长资料放前面，问题放最后**：先给全部上下文，再用「根据以上信息……」这类过渡句提出问题。

一个可以直接改的模板（按官方示例的结构改写成中文）：

```text
<role>
你是一名面向初学者的 Python 老师，回答准确、耐心。
</role>

<constraints>
1. 只用中文回答。
2. 每个知识点配一个可以直接运行的最小示例。
3. 不确定的内容直接说不确定，不要编造。
</constraints>

<output_format>
先用一句话给结论，再分点解释，最后给示例代码。
</output_format>
```

## 三、思考等级（thinking level）

Gemini 3 系列默认开启「思考」，模型会先在内部推理再作答。官方 Thinking 页列出的默认值和可选等级（节选）：

| 模型 | 默认 | 可选等级 |
| --- | --- | --- |
| gemini-3.8-flash | medium | low、medium、high |
| gemini-3.6-flash | medium | minimal、low、medium、high |
| gemini-3.5-flash-lite | minimal | minimal、low、medium、high |
| gemini-3.1-pro-preview | high | low、medium、high |

怎么选，官方的说法是：

- **low**：对延迟敏感的任务，比如实时聊天、写草稿、快速数据分析；
- **medium**：大多数任务质量最好，适合复杂代码和智能体场景；
- **high**：深度推理、数学、多步骤难题。

注意两点：Gemini 3.8 Flash 不支持 `minimal`，传了会报错；输出费用是「输出 token + 思考 token」之和，等级越高越贵。官方还提醒，不要靠把最大输出 token 设得很小来省钱——这个上限包含思考 token，设小了会让回答被截断甚至为空，应当改为降低思考等级。

## 四、温度、Top P、Top K：新模型已弃用

这是最容易被旧教程带偏的地方。官方《What's new in Gemini 3.6 Flash and 3.5 Flash-Lite》写明：从这两个模型开始（以及之后发布的所有 Gemini 模型），`temperature`、`top_p`、`top_k` **已弃用，API 会忽略它们**，未来的模型代际里再传会直接返回 400 错误，官方要求从请求里删掉。Gemini 3.8 Flash 的迁移清单里也有同样的一条。

想让输出更稳定、更可复现，官方给的替代做法是：**在系统指令里把规则写明确**。需要固定格式时用结构化输出，见本站《Gemini 结构化输出（Structured Output）怎么用：JSON Schema、Pydantic 与 Zod 示例》。

官方《Prompt design strategies》和排错页里还保留着一条稍早的提醒，方向是一致的：对 Gemini 3.x 模型「强烈建议保持默认值」，把温度调到 1.0 以下可能导致循环输出或推理质量下降。总之，不要再把调温度当成控制输出的手段。

## 五、安全设置（Safety settings）

运行设置面板的「高级设置（Advanced settings）」里有一项「安全设置（Safety settings）」，用来按类别设定内容过滤的严格程度，面向的是需要自行把关内容的应用开发者（例如给面向未成年人的产品加严）。官方文档的几个要点：

- 危害儿童安全等核心伤害类内容始终被拦截，任何设置都改变不了；
- 模型自身已带有安全机制，这些可调过滤器是在此之外的一层；
- 使用时必须遵守服务条款和生成式 AI 禁止使用政策，责任在使用者；
- 用代码调用时，官方说明新的 Interactions API **不支持自定义安全设置**，这项功能只在旧的 generateContent API 里有。

## 六、三个常用工具

**1. 联网搜索（Grounding with Google Search）**

![联网搜索的工作流程：模型自己决定是否搜索、生成搜索词、读取结果后再作答](seed:g446-google-search-flow.jpg)
*图片来源：[Google 官方文档《Grounding with Google Search》](https://ai.google.dev/gemini-api/docs/google-search)*

打开后，模型自行判断要不要搜索、搜什么，回答里带引用来源。官方建议在需要较新或较冷门的事实时打开。计费方面，官方说明 Gemini 3 及更新的模型按模型实际执行的**每次搜索查询**计费，一个问题可能触发多次搜索；定价页上 Gemini 3.8 Flash 等模型的表格里，搜索接地在 API 免费层一栏标的是「不可用（Not available）」。具体价格以官方定价页为准。

**2. 代码执行（Code execution）**

让模型编写并运行 Python 代码，适合计算、计数、处理数据。官方列出的限制：运行环境最长 30 秒；只能用环境里预装的库，不能自己安装；只能返回代码和结果，不能返回媒体文件等其他产物；文本和 CSV 文件效果最好。启用它本身不额外收费，按所用模型的输入输出 token 计费。

**3. URL 上下文（URL context）**

把网页地址交给模型，让它读取页面内容来回答。官方限制：每次请求最多 20 个 URL，单个 URL 取回内容最大 34MB；地址必须能公开访问，需要登录或付费才能看的页面、本机地址和内网地址都不支持。

## 七、搬到代码里要注意什么

AI Studio 里的系统指令对应 API 的 `system_instruction`，思考等级对应 `generation_config` 里的 `thinking_level`：

```python
from google import genai

client = genai.Client()  # 自动读取环境变量 GEMINI_API_KEY

interaction = client.interactions.create(
    model="gemini-3.8-flash",
    system_instruction="你是一名面向初学者的 Python 老师，只用中文回答。",
    input="列表推导式怎么用？",
    generation_config={"thinking_level": "low"},
    tools=[{"type": "google_search"}],  # 需要联网搜索时才加
)
print(interaction.output_text)
```

官方特别说明：用 `previous_interaction_id` 接续多轮对话时，服务器只保留对话历史；`system_instruction`、`generation_config` 和 `tools` **只对当次请求生效，每一轮都要重新传**。完整的调用流程见本站《Gemini API Python 调用教程：安装 google-genai SDK、流式输出、多轮对话与传图片》。

## 常见问题

**Q：系统指令和直接写在提问里有什么区别？**
系统指令对整个对话生效，适合放不变的规则；提问里放每次不同的任务和资料。官方建议关键约束放系统指令或提示最开头。

**Q：为什么调了温度没变化？**
如果用的是 Gemini 3.6 Flash、3.5 Flash-Lite 或更新的模型，官方说明温度等采样参数已被忽略。

**Q：模型思考太久怎么办？**
把思考等级调低。官方排错页说明，延迟变高、token 用量变大，通常就是因为 Gemini 3 系列默认开启了思考。

**Q：回复显示 Content blocked？**
把鼠标悬停在提示上可以看到被拦截的类别。先检查提示和上传的内容是否确实触及了对应类别；属于误判的正常内容，换一种更明确、中性的表述通常就能通过。违反使用政策的请求不会、也不应该靠调设置来放行。

## 参考资料

- Google AI Studio quickstart（官方）：https://ai.google.dev/gemini-api/docs/ai-studio-quickstart
- Leveling up your developer experience in Google AI Studio（Google 官方博客）：https://blog.google/innovation-and-ai/technology/developers-tools/ai-studio-updates-more-control/
- Text generation（官方）：https://ai.google.dev/gemini-api/docs/text-generation
- Prompt design strategies（官方）：https://ai.google.dev/gemini-api/docs/prompting-strategies
- Gemini thinking（官方）：https://ai.google.dev/gemini-api/docs/thinking
- What's new in Gemini 3.6 Flash and 3.5 Flash-Lite（官方）：https://ai.google.dev/gemini-api/docs/whats-new-gemini-3.6
- What's new in Gemini 3.8 Flash（官方）：https://ai.google.dev/gemini-api/docs/latest-model
- Safety settings（官方）：https://ai.google.dev/gemini-api/docs/safety-settings
- Grounding with Google Search（官方）：https://ai.google.dev/gemini-api/docs/google-search
- Code execution（官方）：https://ai.google.dev/gemini-api/docs/code-execution
- URL context（官方）：https://ai.google.dev/gemini-api/docs/url-context
- Interactions API（官方）：https://ai.google.dev/gemini-api/docs/interactions-overview
- Gemini Developer API pricing（官方）：https://ai.google.dev/gemini-api/docs/pricing
