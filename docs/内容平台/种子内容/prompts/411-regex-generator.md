---
title: 正则表达式生成器提示词（自然语言描述 → 正则 + 逐段解释 + 测试用例）
slug: regex-generator
model: any-llm
topics: [coding]
needsRefImage: false
useCase: 要校验手机号、提取日志字段、批量替换文本却写不出正则时用：说清要匹配什么、不该匹配什么，得到指定语言可直接用的正则、逐段拆解、正反测试用例和可运行的测试代码。
prompt: |
  【角色】你是一名正则表达式专家，熟悉 PCRE、Python re、JavaScript、Java 和 Go（RE2）之间的语法差异，也清楚回溯失控（ReDoS）的风险。

  【需求】
  - 要匹配的内容：[要匹配的内容描述]
  - 用途：[整串校验/从文本中提取/查找替换]
  - 运行环境：[Python/JavaScript/Java/Go/编辑器]
  - 一定要匹配的样例（每行一个）：
    [应匹配的样例]
  - 一定不能匹配的样例（每行一个）：
    [不应匹配的样例]
  - 需要提取的字段（没有就写无）：[要捕获的部分]

  【任务】
  1. 先用一两句话复述匹配规则；我给的样例之间如果互相矛盾，或者规则有歧义（比如是否允许前后空格、是否区分大小写），先列出来问我。
  2. 给出正则本体，放在单独的代码块里，便于复制。
  3. 用表格逐段解释：片段 | 含义 | 为什么这样写。
  4. 列出正例和反例各至少 5 个，包含边界情况（空串、超长、全角字符、换行结尾、Unicode 数字）。
  5. 写一段在我的运行环境里可直接运行的测试代码，把正反例都断言一遍。
  6. 说明在其他常见环境里要改什么（比如 Go 不支持环视和反向引用，JavaScript 需要 u 标志才能正确处理 emoji）。

  【约束】
  - 整串校验必须锚定开头结尾；Python 里优先用 fullmatch 或 \Z，因为 $ 允许匹配末尾换行之前的位置。
  - 避免嵌套量词这类可能灾难性回溯的写法，如果确实需要，说明风险和替代方案。
  - 能用简单正则 + 代码判断解决的（例如日期是否真实存在、身份证校验位），说明「正则只做格式初筛」，不要硬写一个超长正则。
  - 不确定某个语法在我的环境是否支持时，明确标注「需在目标环境验证」。

  【输出格式】
  规则复述 → 正则（代码块）→ 逐段解释表 → 正反例表 → 测试代码 → 跨环境注意事项。
negativePrompt: null
source:
  repo: f/awesome-chatgpt-prompts
  url: https://github.com/f/awesome-chatgpt-prompts/blob/main/prompts.csv
  author: "@ersinyilmaz"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 以「RegEx Generator」条目为基础，原条目要求只给正则不解释，本站改为中文结构化模板，增加逐段解释、正反例、测试代码、ReDoS 与跨语言差异检查
verify:
  - 用手机号、邮箱、日志时间戳三个需求实测，检查测试代码能否直接运行通过
---
**怎么填变量**：正反样例是最重要的输入，尤其是「不能匹配」的样例——很多正则不是漏匹配，而是匹配了不该匹配的东西。[用途] 决定写法：整串校验要锚定，从长文本中提取则不能锚定、要考虑单词边界。

**常见坑**：
- Python 3 里 `\d` 默认会匹配全角数字和其他 Unicode 数字，只想要 0–9 就加 `re.ASCII` 或直接写 `[0-9]`；JavaScript 的 `\d` 只匹配 ASCII 数字。
- 编辑器（VS Code、Notepad++）的替换语法和代码不同，引用分组可能是 `$1` 也可能是 `\1`，要在 [运行环境] 里写清楚。
- 正则能判断「格式像不像」，不能判断「真不真」：2 月 30 日、已注销的手机号，都要靠代码或接口判断。

**追问技巧**：拿到结果后把真实数据里的几十行贴回去，说「标出哪些行没匹配上、哪些行误匹配了」；性能敏感的场景追问「这个正则在什么输入下会变慢」。

### 示例输出

> 示例，仅供参考（需求：校验中国大陆 11 位手机号，Python）

```
1[3-9]\d{9}
```

| 片段 | 含义 |
|---|---|
| `1` | 第一位固定为 1 |
| `[3-9]` | 第二位为 3–9 |
| `\d{9}` | 后面 9 位数字（配合 re.ASCII，只认 0–9） |

```python
import re

PHONE = re.compile(r"1[3-9]\d{9}", re.ASCII)
cases = {
    "13812345678": True,
    "12812345678": False,   # 第二位不合法
    "1381234567": False,    # 只有 10 位
    "13812345678\n": False, # fullmatch 不会放过末尾换行
    "１３８１２３４５６７８": False,  # 全角数字
}
for s, want in cases.items():
    assert bool(PHONE.fullmatch(s)) == want, repr(s)
print("全部通过")
```

> 改编自 [@ersinyilmaz / f/awesome-chatgpt-prompts](https://github.com/f/awesome-chatgpt-prompts)「RegEx Generator」，许可证 CC0 1.0。
