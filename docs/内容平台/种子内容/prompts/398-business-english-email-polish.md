---
title: 商务英语邮件润色提示词（中文意思写给外国客户，地道又专业）
slug: business-english-email-polish
model: any-llm
topics: [translation, office]
needsRefImage: false
useCase: 给海外客户、供应商、外籍同事写英文邮件或消息时用，可以直接写中文意思或蹩脚英文，得到地道、礼貌、符合商务习惯的英文版本，并解释关键用词。
prompt: |
  【角色】你是一名在跨国公司工作多年的商务英语写作顾问，熟悉外贸、采购、项目合作等场景的邮件惯例。
  【背景】
  - 收件人：[如美国客户/德国供应商]
  - 关系与熟悉程度：[如首次联系/合作两年]
  - 邮件目的：[如催款/报价/延期说明]
  - 语气：[正式/友好专业/简洁直接]
  【我的草稿（中文、英文或中英混杂都可以）】
  [粘贴草稿]
  【任务】
  1. 理解我的真实意图，输出一封地道的英文邮件：主题行、称呼、正文、结尾敬语、签名占位。
  2. 修正语法和中式英语，调整为英语母语者的表达习惯（如把直接的要求改成礼貌的请求句式）。
  3. 列出 3–5 个关键表达及中文解释，说明为什么这样写更好。
  4. 如果我的草稿里有可能冒犯对方或引起误解的地方，单独指出。
  【约束】
  - 不添加我没提到的承诺、价格、日期或条款；数字和日期保持原样，日期使用不会产生歧义的写法（如 October 15, 2026）。
  - 正文简洁，一般不超过 150 个英文单词。
  【输出格式】英文邮件 → 关键表达解释 → 风险提醒（如有）。
negativePrompt: null
source:
  repo: f/awesome-chatgpt-prompts
  url: https://github.com/f/awesome-chatgpt-prompts/blob/main/prompts.csv
  author: "@f"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 以「English Translator and Improver」条目为基础，限定到商务邮件场景，改写为中文结构化模板，增加收件人关系、语气、关键表达解释与风险提醒
verify:
  - 实测一次：输入中英混杂草稿，检查是否保留了原有数字与日期
---
**怎么填**：[粘贴草稿] 直接写中文最省事，比如「告诉他货要晚一周，因为港口拥堵，问他能不能接受，不行的话可以先发一半」。[关系与熟悉程度] 决定称呼和寒暄的尺度。

**迭代技巧**：觉得太正式，说「再口语一点，我们很熟」；要发即时消息时说「改成两三句的聊天消息版本」。涉及合同条款、索赔等有法律后果的邮件，请让法务或专业人士把关。

### 示例输出

> 示例，仅供参考（目的：延期说明，收件人：合作两年的美国客户）

**Subject**: Update on Order #2026-118 – Revised Shipping Date

Hi Mike,

I wanted to give you a heads-up that your order will ship about one week later than planned due to port congestion. The new shipping date is October 22, 2026.

If the full delay does not work for you, we would be happy to send half of the order on the original date...

**关键表达**：give you a heads-up = 提前告知你一声，比 inform you 更友好自然。

> 改编自 [@f / f/awesome-chatgpt-prompts](https://github.com/f/awesome-chatgpt-prompts)，许可证 CC0 1.0。
