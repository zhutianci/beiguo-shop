---
title: Spring Boot 接口开发提示词（Controller / Service / Repository 分层、参数校验、全局异常处理、统一返回）
slug: spring-boot-layered-api
model: any-llm
topics: [coding]
needsRefImage: false
useCase: 用 Spring Boot 写增删改查接口和业务接口时用：描述实体和业务规则，得到分层清晰的代码，包括请求与响应对象、Bean Validation 参数校验、事务边界、全局异常处理、统一错误返回和分层测试，避免把实体直接暴露给前端。
prompt: |
  你是一名有多年 Spring Boot 项目经验的 Java 后端工程师。请根据需求生成接口代码。

  - Spring Boot 与 Java 版本：[版本]（例：Spring Boot 3.3 + Java 21）
  - 持久层：[持久层]（例：Spring Data JPA、MyBatis-Plus）
  - 业务需求：[业务需求]（例：优惠券的创建、领取、查询）
  - 业务规则：[业务规则]（例：每人限领 1 张，库存为 0 不可领）
  - 项目已有约定：[项目约定]（例：统一返回结构、包结构）

  生成要求：
  1. 分层职责：Controller 只做参数接收、校验和结果转换；Service 负责业务规则与事务；Repository 或 Mapper 只做数据访问。不要在 Controller 中写业务逻辑。
  2. 对象划分：请求对象、响应对象与数据库实体分开；转换方式（手写或使用映射工具）与项目保持一致；响应中不包含敏感字段。
  3. 参数校验：使用 Bean Validation 注解；分组校验或嵌套对象校验的写法；校验失败返回字段级错误信息。
  4. 事务：事务注解加在 Service 的公开方法上；说明同类方法内部调用时事务不生效的问题；只读查询标记为只读事务。
  5. 并发：「每人限领 1 张、库存扣减」这类规则要在数据库层面保证（唯一约束、条件更新），不能只靠先查询再判断。
  6. 异常处理：自定义业务异常，用全局异常处理器统一转换为错误返回；区分业务错误（4xx）和系统错误（5xx）；系统错误不向客户端返回堆栈。
  7. 测试：Service 层单元测试（模拟仓储）；Controller 层使用切片测试验证参数校验和错误返回；关键的并发规则写一个集成测试。

  输出：包结构、各层代码（中文注释）、统一返回与全局异常处理代码、测试代码。注明 Spring Boot 3 与 2 的差异（例如 Jakarta 包名）。
negativePrompt: null
source: null
verify:
  - 按生成的代码运行切片测试，检查参数校验失败时是否返回字段级错误，重复领取是否返回业务错误码
---
**怎么填变量**：[版本] 必须写，Spring Boot 3 起校验与持久化相关的包名从 javax 改为 jakarta，照搬 2.x 的代码会编译失败。[项目约定] 有统一返回结构或包结构约定的，一定贴进来，生成的代码才能直接放进项目。

**常见坑**：
- 在同一个 Service 类中，一个方法调用另一个带事务注解的方法，事务不会生效，因为调用没有经过代理。
- 「每人限领 1 张」用先查询、再插入实现，并发时同一个人可以领到两张。在数据库加唯一约束兜底。
- 直接把 JPA 实体作为接口返回值，懒加载字段可能触发额外查询甚至序列化报错，还容易泄露内部字段。

**追问技巧**：追问「为这些接口补充 OpenAPI 文档注解」，或「把领取接口改成高并发版本，说明在库存扣减上用数据库条件更新与 Redis 预扣两种方案的取舍」。

### 示例输出

> 示例，仅供参考（Service 层节选）

```java
@Service
@RequiredArgsConstructor
public class CouponService {
    private final CouponRepository couponRepo;
    private final CouponClaimRepository claimRepo;

    @Transactional
    public ClaimResult claim(long couponId, long userId) {
        // 条件更新扣减库存：库存为 0 时影响行数为 0，避免超领
        int updated = couponRepo.decreaseStock(couponId);
        if (updated == 0) {
            throw new BizException(ErrorCode.COUPON_OUT_OF_STOCK, "优惠券已领完");
        }
        try {
            // coupon_claim 表上有 (coupon_id, user_id) 唯一约束，保证每人限领 1 张
            claimRepo.saveAndFlush(new CouponClaim(couponId, userId));
        } catch (DataIntegrityViolationException e) {
            throw new BizException(ErrorCode.COUPON_ALREADY_CLAIMED, "每人限领 1 张");
        }
        return new ClaimResult(couponId);
    }
}
```

```java
@Modifying
@Query("UPDATE Coupon c SET c.stock = c.stock - 1 WHERE c.id = :id AND c.stock > 0")
int decreaseStock(@Param("id") long id);
```

抛出业务异常会让事务回滚，已扣减的库存随之恢复。
