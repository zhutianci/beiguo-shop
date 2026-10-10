---
title: Google 表格公式与 Apps Script 自动化提示词（QUERY 函数、ARRAYFORMULA、定时触发、自动发邮件提醒）
slug: google-sheets-apps-script
model: any-llm
topics: [data-analysis, office]
needsRefImage: false
useCase: 团队用 Google 表格协作，想用 QUERY 一个公式做汇总、让整列公式自动扩展，或者用 Apps Script 做定时汇总、表单提交后自动处理、到期发邮件提醒时用：描述需求，AI 给出公式或脚本，以及授权、触发器配置和配额方面的注意事项。
prompt: |
  你是一名精通 Google 表格和 Apps Script 的自动化顾问。请帮我实现下面的需求。

  - 表格结构：[表格结构]（例：工作表「订单」A 到 F 列为日期、客户、负责人、金额、状态、到期日）
  - 需求：[需求]（例：每天早上 9 点给负责人发邮件，列出 3 天内到期的订单）
  - 使用方式：[使用方式]（例：团队 5 人共同编辑）
  - 偏好：[偏好]（可选：优先用公式/可以写脚本）

  公式部分（如果需求能用公式实现）：
  1. 优先考虑 QUERY 函数：说明其类似 SQL 的语法，列用字母表示，条件、分组、排序、透视的写法；日期条件的特殊格式。
  2. 需要整列自动计算时用 ARRAYFORMULA，新增行无需复制公式；处理空行，避免出现大量无意义的结果。
  3. 跨表格引用数据时的函数与授权提示。
  4. 逐段解释公式。

  脚本部分（如果需要自动化）：
  1. 完整的 Apps Script 代码，中文注释；批量读取和写入数据（一次读取整个区域，而不是在循环中逐个单元格读取），避免运行缓慢和超时。
  2. 触发器：定时触发、编辑时触发、表单提交时触发的区别和设置方法；简单触发器与可安装触发器的权限差异。
  3. 首次运行时的授权提示是什么意思、需要授予哪些权限。
  4. 发邮件或调用外部服务时，提醒每日配额限制（具体数值以官方文档为准）；邮件内容中不要包含不必要的敏感信息。
  5. 错误处理与日志：出错时记录到一张日志表或给我发通知。
  6. 测试方法：如何先用少量数据或只发给自己测试。

  公式能解决的就不要写脚本。
negativePrompt: null
source: null
verify:
  - 在测试表格中运行生成的脚本并设置定时触发器，确认授权流程与邮件发送正常；配额以 https://developers.google.com/apps-script/guides/services/quotas 为准
---
**怎么填变量**：[表格结构] 写清工作表名称和每一列的含义，QUERY 公式和脚本都要按列来引用。[需求] 写成「什么时候、对哪些数据、做什么」，例如「每天 9 点，找出状态不是已完成且 3 天内到期的订单，按负责人分别发邮件」。

**常见坑**：
- 脚本在循环里逐个单元格读取和写入，几百行数据就运行很久甚至超时。应该一次读取整个区域到数组，处理完一次写回。
- 用「编辑时」的简单触发器发邮件，因为权限受限而失败。需要发邮件等操作时，使用可安装的触发器。
- QUERY 中按日期筛选时直接写日期字符串，结果为空。QUERY 的日期条件需要特定的写法。

**追问技巧**：追问「表单提交后，自动把新记录分配给负责人并发通知」，或「把这个脚本改成只在工作日运行」。

### 示例输出

> 示例，仅供参考（节选）

**公式**：按负责人汇总未完成订单金额，按金额降序：

```
=QUERY(订单!A1:F, "select C, sum(D) where E <> '已完成' and C is not null group by C order by sum(D) desc label sum(D) '未完成金额'", 1)
```

**脚本**：每天给负责人发即将到期提醒（节选）：

```javascript
function remindDueOrders() {
  const sheet = SpreadsheetApp.getActive().getSheetByName('订单');
  const rows = sheet.getDataRange().getValues().slice(1);   // 一次读取全部数据，去掉表头
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const byOwner = {};
  rows.forEach(([date, customer, owner, amount, status, due]) => {
    if (!owner || status === '已完成' || !(due instanceof Date)) return;
    const days = Math.round((due - today) / 86400000);
    if (days >= 0 && days <= 3) (byOwner[owner] = byOwner[owner] || []).push(`${customer}：${days} 天后到期`);
  });
  Object.entries(byOwner).forEach(([owner, lines]) => {
    MailApp.sendEmail(lookupEmail(owner), '订单到期提醒', lines.join('\n'));
  });
}
```

触发器：在 Apps Script 编辑器左侧「触发器」中添加，选择「时间驱动 → 日定时器 → 上午 9 点至 10 点」。
