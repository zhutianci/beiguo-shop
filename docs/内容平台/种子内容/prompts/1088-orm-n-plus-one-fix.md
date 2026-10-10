---
title: ORM N+1 查询怎么解决提示词（Django ORM、SQLAlchemy、Prisma、JPA / Hibernate 的预加载写法与检测方法）
slug: orm-n-plus-one-fix
model: any-llm
topics: [coding]
needsRefImage: false
useCase: 列表接口数据一多就变慢、数据库日志里同样的查询出现几十上百次时用：把 ORM 代码和查询日志给 AI，它定位触发 N+1 的位置，用对应 ORM 的预加载方式改写，说明连接查询与分批查询的取舍，并给出在测试中自动检测查询次数的方法。
prompt: |
  你是一名熟悉各种 ORM 性能问题的后端工程师。请帮我排查并修复 N+1 查询问题。

  - ORM 与版本：[ORM 与版本]（例：Django 5、SQLAlchemy 2.0、Prisma、Spring Data JPA）
  - 数据模型（相关的模型定义和关联关系）：
    [粘贴模型定义]
  - 有问题的代码（接口或序列化代码）：
    [粘贴代码]
  - 查询日志（如果有，贴出重复出现的查询）：
    [粘贴查询日志]
  - 数据规模：[数据规模]（例：一页 50 条，每条关联 3 张表）

  请完成：
  1. 定位：指出在哪一行、访问哪个关联属性时触发了额外查询，估算一次请求的查询总数（例如 1 + 50 + 50 × 3）。注意隐藏在序列化器、模板、属性方法中的关联访问。
  2. 修复：用该 ORM 的预加载方式改写，并说明选择依据：
     - 一对一、多对一：通常用连接查询一次取回；
     - 一对多、多对多：通常用额外的「按编号批量查询」，避免连接查询导致行数膨胀和分页错误；
     - 只需要关联表的少数字段或统计数时，直接查询所需字段或用聚合，而不是加载整个关联对象。
  3. 修复后的查询次数，以及生成的 SQL 大致形式。
  4. 副作用：预加载过多不需要的数据导致内存增加；连接查询与分页一起使用时的问题；该 ORM 中惰性加载的默认行为。
  5. 防止回归：在测试中断言某个接口的查询次数上限（给出该 ORM 或测试框架中的具体写法）；开发环境中开启查询日志或检测工具。

  修改尽量局部，不改变接口的返回结构。
negativePrompt: null
source: null
verify:
  - 用一个 Django 订单列表序列化器（访问 order.user.name 和 order.items）跑一次，检查是否分别给出 select_related 与 prefetch_related，并给出 assertNumQueries 测试
---
**怎么填变量**：[数据模型] 要包含关联关系的定义（外键、一对多、多对多），AI 才能判断用哪种预加载方式。[有问题的代码] 记得包括序列化或渲染部分，N+1 经常不在查询代码里，而是在把对象转换成返回数据时访问了关联属性。

**常见坑**：
- 查询代码看起来只有一条，问题出在序列化器里逐条访问关联对象，每访问一次就发一条查询。
- 对一对多关系也用连接查询，结果行数成倍增加，分页时每页条数不对，内存也上去了。
- 修好之后没有测试保护，几个月后有人在序列化器里加了一个字段，问题又回来了。

**追问技巧**：追问「这个列表接口还能怎么优化：只查需要的字段、加索引、加缓存，分别能提升多少」。

### 示例输出

> 示例，仅供参考（Django）

**定位**：`OrderSerializer` 中的 `user_name`（访问 `order.user.name`）和 `items`（访问 `order.items.all()`），一页 50 条时共 1 + 50 + 50 = 101 次查询。

```python
orders = (
    Order.objects
    .filter(status="PAID")
    .select_related("user")          # 多对一：连接查询一次取回用户
    .prefetch_related("items")       # 一对多：额外一次按订单编号批量查询明细
    .order_by("-created_at")[:50]
)
```

修复后共 2 次查询。

```python
from django.test import TestCase

class OrderListQueryTest(TestCase):
    def test_query_count(self):
        make_orders(50)
        with self.assertNumQueries(3):    # 会话 / 鉴权等固定查询按实际情况调整
            self.client.get("/api/orders/")
```
