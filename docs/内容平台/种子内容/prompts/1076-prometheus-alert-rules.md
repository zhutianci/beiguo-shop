---
title: 监控告警规则怎么设计提示词（Prometheus 告警规则、阈值与持续时间、告警分级、减少告警疲劳）
slug: prometheus-alert-rules
model: any-llm
topics: [coding]
needsRefImage: false
useCase: 要给服务配置监控告警，或者现有告警太多太吵、真正的故障反而被淹没时用：AI 从用户感受到的症状出发设计告警（错误率、延迟、可用性），给出 Prometheus 告警规则、合理的阈值与持续时间、分级与通知策略，并审查现有规则中的噪音来源。
prompt: |
  你是一名站点可靠性工程师，信奉「告警应该少而准：每一条告警都意味着需要有人立刻处理」。请帮我设计告警规则。

  - 服务类型：[服务类型]（例：对外 HTTP 接口服务）
  - 已有的指标：[已有指标]（例：请求总数、耗时直方图、实例存活）
  - 业务目标：[业务目标]（例：可用性 99.9%，P95 延迟 300 毫秒）
  - 通知渠道与值班方式：[通知方式]（例：严重告警打电话，其他发群消息）
  - 现有告警规则（如果要审查）：
    [粘贴现有规则，没有就写无]

  请输出：
  1. 告警设计原则：优先基于症状（用户能感知的错误率、延迟、可用性）告警，原因类指标（CPU、内存）通常只作为辅助或低级别提醒；每条告警都要有对应的处理手册。
  2. 规则清单：告警名 | 表达式 | 持续时间 | 级别 | 含义 | 处理手册要点。至少覆盖：
     - 错误率；
     - 延迟（基于直方图计算分位数）；
     - 实例或目标不可用；
     - 资源即将耗尽的趋势（如磁盘按当前速度几小时后写满），而不是简单的「使用率超过 80%」；
     - 监控本身失效（指标消失）。
  3. 阈值与持续时间：说明如何根据业务目标和历史数据确定；持续时间太短会导致抖动误报，太长会延误发现。
  4. 分级与路由：严重、警告、提示各自的标准和通知方式；告警的分组、抑制（例如整个集群不可用时，不再逐个发出实例告警）、静默的用法。
  5. 审查现有规则（如果提供）：找出重复告警、没有持续时间的规则、阈值不合理的规则、对用户没有影响的规则，给出修改或删除建议。

  输出符合 Prometheus 告警规则文件格式的 YAML，带中文注释；表达式中用到的指标名按我提供的名称，没有提供的用常见命名并注明需要替换。
negativePrompt: null
source: null
verify:
  - 用 promtool check rules 检查生成的规则文件语法
  - 核对 histogram_quantile、predict_linear、absent 等函数用法与 https://prometheus.io/docs/ 一致
---
**怎么填变量**：[已有的指标] 尽量写出真实的指标名，表达式才能直接使用。[业务目标] 用来确定阈值，例如可用性目标为 99.9% 时，错误率持续超过千分之几需要告警。

**常见坑**：
- 给每台机器的 CPU、内存都设置「超过 80% 告警」，结果每天几十条告警，大部分对用户没有影响，值班的人逐渐开始忽略告警。
- 告警规则没有设置持续时间，指标瞬间抖动一下就发出告警，几秒后又恢复。
- 只配置了「服务挂了」的告警，却没有配置「监控本身挂了」的告警，采集中断时会误以为一切正常。

**追问技巧**：追问「把错误率告警改成基于错误预算消耗速度的多窗口告警」，或「为每条严重告警写一份处理手册」（可配合 1023 号提示词）。

### 示例输出

> 示例，仅供参考（节选）

```yaml
groups:
  - name: order-api
    rules:
      - alert: OrderApiHighErrorRate
        # 5 分钟内 5xx 比例超过 2%，持续 5 分钟
        expr: |
          sum(rate(http_requests_total{job="order-api",status=~"5.."}[5m]))
            / sum(rate(http_requests_total{job="order-api"}[5m])) > 0.02
        for: 5m
        labels: { severity: critical }
        annotations:
          summary: "订单接口错误率 {{ $value | humanizePercentage }}"
          runbook: "https://wiki.example.com/runbook/order-api-5xx"

      - alert: DiskWillFillIn6Hours
        # 按过去 6 小时的增长趋势，6 小时内写满
        expr: predict_linear(node_filesystem_avail_bytes{mountpoint="/"}[6h], 6 * 3600) < 0
        for: 30m
        labels: { severity: warning }
```
