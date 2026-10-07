---
title: Python 类型注解提示词：给老代码补类型注解 + 修复 mypy / pyright 报错（不靠 Any 糊过去）
slug: python-type-hints-mypy
model: any-llm
topics: [coding]
needsRefImage: false
useCase: 想给没有类型注解的 Python 项目逐步加上类型、或者 mypy、pyright 报了一堆错不知道怎么改时用：AI 按代码实际行为补注解，逐条解释报错原因，给出正确的修法，并说明哪些地方应该用 Protocol、TypedDict、泛型，而不是到处写 Any 或忽略注释。
prompt: |
  你是一名精通 Python 类型系统的工程师。请帮我处理类型注解。

  - Python 版本：[如 3.12]
  - 类型检查工具与严格程度：[类型检查工具与严格程度]（例：mypy --strict、pyright basic）
  - 任务：[给代码补注解/修复报错/两者都要]
  - 代码：
    [粘贴代码]
  - 类型检查器的报错（如果有，原样粘贴）：
    [粘贴报错]

  补注解时：
  1. 根据代码的实际用法推断类型，而不是根据变量名猜。推断不出来的标注「需确认」，说明可能的几种类型。
  2. 使用当前 Python 版本支持的写法：内置泛型（如 list 加类型参数）、用竖线表示联合类型、可选值写成「某类型或 None」。
  3. 结构化的字典优先用 TypedDict 或数据类；只关心「有某个方法」的参数用 Protocol；容器和函数之间存在类型关联时用泛型（TypeVar 或新的泛型语法，说明版本要求）。
  4. 第三方库没有类型信息时，说明有没有对应的类型存根包可以安装。

  修复报错时，对每一条：
  1. 用通俗的话解释报错在说什么。
  2. 判断这是真实的潜在 Bug（例如可能是 None 却直接调用方法），还是类型标注写得不够准确。
  3. 给出修法，优先顺序：修正代码逻辑（如增加 None 判断）→ 修正类型标注 → 用类型收窄 → 最后才考虑 cast；不要用 Any 或忽略注释掩盖问题，确实需要时说明理由。

  输出：修改后的完整代码，以及一张「报错 → 原因 → 修法」的对照表；指出修复过程中发现的真实 Bug。
negativePrompt: null
source: null
verify:
  - 用一段包含 Optional 返回值未判空、字典结构混乱的代码在 mypy --strict 下跑一次，检查修复后是否零报错且没有新增 Any
---
**怎么填变量**：[Python 版本] 决定了能用的写法，比如 3.10 以上才能用竖线写联合类型，3.12 才支持新的泛型语法。[类型检查工具与严格程度] 不同工具、不同模式的报错差别很大，写清楚才能对应上。

**常见坑**：
- 为了让报错消失到处加 Any 或忽略注释，类型检查就形同虚设了。很多「可能为 None」的报错其实是真实存在的 Bug。
- 用 dict 加 Any 描述所有字典。结构固定的数据（例如接口返回）用 TypedDict 或数据类，键名写错时检查器能直接发现。
- 一次性给整个项目加严格模式，几千条报错没法处理。先在新代码和核心模块上开启，逐步扩大范围。

**追问技巧**：追问「这个项目想逐步开启严格检查，给出分阶段的 mypy 配置方案（哪些模块先严格、哪些先放宽）」。

### 示例输出

> 示例，仅供参考（节选）

| 报错 | 原因 | 修法 |
|---|---|---|
| Item "None" of "User \| None" has no attribute "email" | `find_user()` 找不到时返回 None，调用处直接取属性 | **真实 Bug**：增加 None 判断，找不到时抛出明确的异常 |
| Incompatible return value type (got "dict[str, object]") | 返回值是结构固定的字典 | 改为 TypedDict |

```python
from typing import TypedDict

class OrderSummary(TypedDict):
    order_id: str
    total_cents: int
    paid: bool

def summarize(order_id: str) -> OrderSummary:
    user = find_user(order_id)
    if user is None:
        raise LookupError(f"订单 {order_id} 没有关联用户")
    return {"order_id": order_id, "total_cents": user.balance_cents, "paid": True}
```
