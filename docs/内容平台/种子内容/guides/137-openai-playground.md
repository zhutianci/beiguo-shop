---
title: OpenAI Playground 怎么用：调试提示词、测试函数调用与搬进代码
slug: openai-playground
products: [chatgpt]
models: []
accountTier: OTHER
excerpt: OpenAI Playground 是开发者平台里不用写代码就能调提示词的网页工具。本文讲清入口在哪、Generate 和 Optimize 怎么用、怎么测试函数调用、Playground 是否收费，以及 2026 年「可复用提示词」和 Evals 下线后，调好的提示词该怎么迁到代码里。
checkedOn: 2026-10-07
sources:
  - https://help.openai.com/en/articles/9824968-prompt-management-in-playground
  - https://help.openai.com/en/articles/9492280-function-calling-in-the-chat-playground
  - https://help.openai.com/en/articles/10478918-reviewing-api-usage-and-costs
  - https://developers.openai.com/api/docs/guides/prompt-generation
  - https://developers.openai.com/api/docs/guides/prompt-optimizer
  - https://developers.openai.com/api/docs/guides/prompting
  - https://developers.openai.com/api/docs/guides/prompting/migrate-from-prompt-object
  - https://developers.openai.com/api/docs/deprecations
verify:
  - 帮助中心《Prompt management in Playground》更新于约 2 个月前，仍在介绍 Publish、版本历史、Link Eval 等功能；而开发者文档写明可复用提示词对象 2026-06-03 起「弱化创建」、2026-11-30 关停，Evals 2026-10-31 只读、11-30 关停。Playground 里这些按钮现在还剩哪些，需要登录后台确认
  - 帮助中心描述的「并排对比」是两个已发布提示词版本之间的对比，提示词对象下线后是否保留未知
  - 官方文档没有单独描述「查看 / 导出代码」按钮，本文因此只写了按迁移指南手动搬到代码的方法；如后台有 Code 按钮可补充
  - Tools、Functions、Tool choice 等英文按钮名来自帮助中心，当前界面可能调整
---

> 本文根据 OpenAI 帮助中心（Playground 提示词管理、函数调用、用量与费用）和开发者文档（Prompt generation、Prompt optimizer、Prompting、Deprecations）整理，资料核对于 2026-10-07。Playground 界面变化较快，按钮名称以实际页面为准。

## 适用于谁

- 想在写代码之前，先在网页上把提示词、模型、输出格式调到满意的人；
- 搜「openai playground prompt optimizer」，想让官方工具帮忙改写提示词的人；
- 关心 Playground 收不收费、和 ChatGPT 有什么区别的人；
- 之前在 Playground 里保存过提示词（Prompt ID），担心年底下线的人。

## 结论先说

1. **入口**：登录 OpenAI 开发者平台，打开 Playground（官方文档链接为 platform.openai.com/chat/edit）。它是给 API 开发者用的调试台，不是 ChatGPT。
2. **要花钱**：帮助中心写明，Playground 发出的就是和你的应用相同的 API 请求，token 计入 API 用量，按 API 价格计费；ChatGPT 会员不包含这部分。
3. **最有用的三个功能**：**Generate（生成）**——用一句任务描述生成提示词、函数定义或 JSON Schema；**Optimize（优化）**——自动找出提示词里的矛盾、含糊和缺失的输出格式；**Tools → Functions**——不写代码测试函数调用。
4. **2026 年的变化**：可复用提示词对象（Prompt ID、`v1/prompts`）计划 **2026-11-30 关停**；Evals 平台 **2026-10-31 起只读、11-30 关停**。官方建议：Playground 只用来调试，最终版本的提示词放进你自己的代码里管理。

## 步骤

### 1. 打开 Playground，写好两类消息

进入 Playground 后，基本操作是：

1. 在模型下拉框里选模型（模型列表以页面为准，自己微调过的模型也可以把 `ft:` 开头的模型 ID 粘贴进去）；
2. 在 **System（系统）** 消息里写整体角色和语气；
3. 在 **User（用户）** 消息里写具体任务和示例；
4. 运行，查看输出。

官方给的写法建议很实用：语气、角色这类总体要求放 System；任务细节和示例放 User；多个示例整理成简洁的列表或 YAML 风格的块，方便以后修改。

### 2. 用 Generate 起草提示词、函数和 Schema

Playground 的 **Generate** 按钮可以根据一句任务描述生成三类东西：

- **提示词**：官方用一套「元提示词」（meta-prompt）把你的描述扩写成结构化的系统提示词，通常包含任务说明、步骤、输出格式、示例等部分；也可以把已有提示词交给它改进；
- **函数定义**：描述函数要做什么，生成对应的 JSON 结构；
- **JSON Schema**：用于结构化输出。

生成结果只是起点，记得按自己的业务补充约束，再跑几组不同输入看看稳不稳定。

### 3. 用 Optimize 修提示词（prompt optimizer）

**Optimize** 会自动检查并修正提示词里**互相矛盾的指令、表述不清的地方和缺失的输出格式**，返回改进后的版本或修改建议，并附上改动摘要；你可以先预览，再一键应用。官方文档里的直达链接是 platform.openai.com/chat/edit?optimize=true。

需要注意两点：

- 开发者文档另有一种「基于数据集」的优化方式（要先准备带评分或人工标注的数据集），它属于 Evals 平台，**正随 Evals 一起下线**；
- 官方提醒：优化后的提示词整体通常更好，但在个别输入上可能反而变差，上线前一定要人工复核。

### 4. 不写代码测试函数调用

1. 在左侧配置区点 **+Tools → Functions**（用 Chat Completions 模式时是 **+Function**）；
2. 填入函数参数的 JSON Schema，或者用 **Generate** 根据文字描述生成；
3. 输入一句会触发该函数的话，比如函数是 `get_weather`，就问「北京今天天气怎么样？」；
4. 模型发起调用后，手动填入函数的返回结果（例如 `{"temp": 22}`），点 **Run**，模型会基于这个结果回答。

小技巧：在 Schema 里设置 `strict: true` 开启结构化输出，模型生成的参数会严格符合 Schema；想强制模型调用函数，点模型名旁边的设置图标 → **Tool choice**，从 **Auto** 改成 **Required** 或指定函数。Playground 也支持并行函数调用。

### 5. 对比效果

帮助中心介绍的对比方式是把提示词的两个版本**并排比较输出**，再决定用哪个。比较不同模型时，最稳妥的办法是固定同一份提示词和同一组测试输入，只换模型，逐条看输出质量、长度和 token 用量。官方在模型迁移建议里也是这个思路：先只换模型、不改提示词，一次只改一个变量。

### 6. 把调好的提示词搬进代码

因为可复用提示词对象即将关停，官方《Migrate from prompt objects》建议：

- 新项目**不要再创建** Prompt 对象；
- 把每个生产用提示词放进代码里的独立模块（例如 `prompts/support_reply.py`），用 Git 管理版本、评审和回滚；
- 原来的 `{变量}` 改成函数参数；
- 直接通过 Responses API 的 `instructions` 和 `input` 传入。

```python
from openai import OpenAI

client = OpenAI()  # 从环境变量 OPENAI_API_KEY 读取密钥

def support_reply(customer_name: str, issue: str) -> str:
    response = client.responses.create(
        model="gpt-6-astra",  # 换成你在 Playground 里选定的模型
        instructions="你是耐心的客服助手，回答控制在 100 字以内。",
        input=f"客户 {customer_name} 的问题：{issue}",
    )
    return response.output_text
```

如果你的代码里已经在用 `prompt={"id": "pmpt_..."}` 调用，请在 2026-11-30 之前按迁移指南改完。Python 入门写法见 [/guides/openai-api-python-quickstart](/guides/openai-api-python-quickstart)。

## 常见问题

**Q：Playground 免费吗？**
不免费。它的调用和你的程序调用一样计入 API 用量、按同样的价格计费，可以在 Usage 页面看到。账单怎么看见 [/guides/openai-api-pricing-billing](/guides/openai-api-pricing-billing)。

**Q：我有 ChatGPT Plus，能直接用 Playground 吗？**
Playground 属于 API 平台，ChatGPT 订阅和 API 是两套独立计费，需要在 API 平台单独开通计费。密钥和开通方法见 [/guides/openai-api-key](/guides/openai-api-key)。

**Q：以前保存的 Preset（预设）还在吗？**
帮助中心曾提供把 Preset 导入为 Prompt 的功能，但 Prompt 对象本身也将在 2026-11-30 关停。建议把重要的预设内容复制出来，保存到自己的代码或文档里。

**Q：Link Eval（关联评测）还能用吗？**
Evals 平台 2026-10-31 起只读、11-30 关停。官方给的迁移路径是转到开源工具 Promptfoo，见 Deprecations 页面。

**Q：提示词本身怎么写更好？**
可以参考 [/guides/how-to-write-prompts](/guides/how-to-write-prompts)，里面的结构化写法同样适用于 API。

## 参考资料

- OpenAI 帮助中心：Prompt management in Playground — https://help.openai.com/en/articles/9824968-prompt-management-in-playground
- OpenAI 帮助中心：Function calling in the Chat Playground — https://help.openai.com/en/articles/9492280-function-calling-in-the-chat-playground
- OpenAI 帮助中心：Reviewing API usage and costs — https://help.openai.com/en/articles/10478918-reviewing-api-usage-and-costs
- OpenAI 开发者文档：Prompt generation — https://developers.openai.com/api/docs/guides/prompt-generation
- OpenAI 开发者文档：Prompt optimizer — https://developers.openai.com/api/docs/guides/prompt-optimizer
- OpenAI 开发者文档：Prompting — https://developers.openai.com/api/docs/guides/prompting
- OpenAI 开发者文档：Migrate from prompt objects — https://developers.openai.com/api/docs/guides/prompting/migrate-from-prompt-object
- OpenAI 开发者文档：Deprecations（Reusable prompts、Evals platform）— https://developers.openai.com/api/docs/deprecations
