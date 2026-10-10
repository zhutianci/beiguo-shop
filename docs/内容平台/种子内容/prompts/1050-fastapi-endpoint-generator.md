---
title: FastAPI 接口开发提示词（Pydantic 模型校验、依赖注入、统一错误返回、自动化测试一次生成）
slug: fastapi-endpoint-generator
model: any-llm
topics: [coding]
needsRefImage: false
useCase: 用 FastAPI 写后端接口时用：描述资源和业务规则，得到分层清晰的接口代码，包括请求与响应模型、参数校验、鉴权依赖、数据库会话管理、统一错误格式，以及覆盖正常与异常场景的测试。
prompt: |
  你是一名熟悉 FastAPI 和 Pydantic v2 的 Python 后端工程师。请根据下面的需求生成接口代码。

  - 资源与需求：[资源与需求]（例：商品评价：用户可创建、查看列表、删除自己的评价）
  - 业务规则：[业务规则]（例：每个订单只能评价一次，评分 1 到 5，内容 500 字以内）
  - 数据库与 ORM：[数据库与 ORM]（例：PostgreSQL + SQLAlchemy 2.0 异步）
  - 鉴权方式：[鉴权方式]（例：Bearer Token，已有获取当前用户的函数）
  - 项目现有结构（如果有）：
    [目录结构或现有代码]

  生成要求：
  1. 分层：路由只负责接收请求和返回响应，业务逻辑放在服务层，数据访问放在仓储层或直接用 ORM 会话（按项目现有风格）。
  2. 模型：请求模型和响应模型分开定义，不要直接返回 ORM 对象；用 Pydantic 的字段约束表达业务规则（长度、范围、格式）；响应中不包含敏感字段。
  3. 依赖注入：数据库会话、当前用户通过依赖获取；会话的生命周期（打开、提交、回滚、关闭）要正确。
  4. 错误处理：业务错误使用统一的错误结构和合适的状态码（404 不存在、403 无权限、409 重复评价、422 参数错误）；不要把数据库异常的原文返回给客户端。
  5. 列表接口：分页参数有上限，避免一次查询过多数据；说明排序方式。
  6. 权限：删除时校验是否为本人的评价，防止越权。
  7. 测试：用 pytest 和测试客户端写测试，覆盖正常创建、参数校验失败、重复评价、删除他人评价、未登录访问；测试使用独立的测试数据库或依赖覆盖。
  8. 用异步还是同步：根据我的数据库驱动选择，并说明在异步路由中调用同步阻塞代码的问题。

  输出：文件结构、各文件代码（中文注释）、运行与测试命令。依赖库的版本差异（如 Pydantic v1 与 v2 写法不同）要按 v2 写，并在用到 v2 特有写法时注明。
negativePrompt: null
source: null
verify:
  - 按生成的代码在新虚拟环境中运行测试，检查 409 重复评价和 403 越权两个用例是否通过
  - 核对依赖覆盖测试写法与 FastAPI 官方文档一致（https://fastapi.tiangolo.com/advanced/testing-dependencies/）
---
**怎么填变量**：[业务规则] 写得越具体，Pydantic 模型的字段约束就越完整，这些约束会自动变成接口文档和 422 校验。[项目现有结构] 有的话一定要贴，AI 会沿用你的分层方式和命名风格，而不是另起一套。

**常见坑**：
- 在 async 定义的路由里调用同步的数据库驱动或耗时的同步函数，会阻塞整个事件循环，并发一上来接口就变慢。要么全用异步驱动，要么用普通函数定义路由。
- 直接返回 ORM 对象，可能把密码哈希这类字段带出去。响应模型要单独定义。
- 网上很多示例还是 Pydantic v1 的写法（如旧的配置类、校验器装饰器），和 v2 不兼容，复制时要注意。

**追问技巧**：追问「为这些接口补充 OpenAPI 文档中的示例和错误响应说明」，或「把删除改成软删除，需要改哪些地方」。

### 示例输出

> 示例，仅供参考（节选）

```python
from pydantic import BaseModel, Field

class ReviewCreate(BaseModel):
    order_id: int
    rating: int = Field(ge=1, le=5)
    content: str = Field(min_length=1, max_length=500)

class ReviewOut(BaseModel):
    id: int
    rating: int
    content: str
    model_config = {"from_attributes": True}   # v2 写法：允许从 ORM 对象读取

@router.post("/reviews", response_model=ReviewOut, status_code=201)
async def create_review(body: ReviewCreate, user=Depends(get_current_user),
                        db: AsyncSession = Depends(get_db)):
    if await review_service.exists(db, body.order_id):
        raise HTTPException(status_code=409, detail={"code": "REVIEW_EXISTS", "message": "该订单已评价"})
    return await review_service.create(db, user.id, body)
```
