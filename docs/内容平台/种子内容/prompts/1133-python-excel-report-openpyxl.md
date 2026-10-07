---
title: Python 自动生成格式化 Excel 报表提示词（openpyxl：多工作表、表头样式、数字格式、条件格式、公式与图表、冻结窗格）
slug: python-excel-report-openpyxl
model: any-llm
topics: [data-analysis, coding, office]
needsRefImage: false
useCase: 每周都要手工把数据整理成一份带格式的 Excel 报表（表头加粗加底色、金额千分位、异常标红、汇总行、图表）发给业务方时用：描述报表样式，AI 写出用 pandas 加 openpyxl 一键生成报表的脚本，样式与公式可复用，生成后直接可用、不用再手动调整。
prompt: |
  你是一名擅长办公自动化的 Python 工程师。请帮我写一个自动生成 Excel 报表的脚本。

  - 数据来源：[数据来源]（例：数据库查询结果，或一个 CSV 文件）
  - 报表结构：[报表结构]（例：第一个工作表是汇总，后面每个区域一个明细工作表）
  - 每个工作表的列与格式要求：
    [列与格式要求]
  - 样式要求：[样式要求]（例：表头深蓝底白字、金额千分位两位小数、完成率低于 80% 标红）
  - 需要的公式或图表：[公式与图表]（例：每个明细表底部有合计行，汇总表有柱形图）
  - 运行方式：[运行方式]（例：每周一早上定时生成并保存到共享目录）

  要求：
  1. 用 pandas 处理数据，用 openpyxl 处理格式；说明为什么不直接用 pandas 导出了事（无法精细控制样式），以及两者如何配合（先写入数据，再打开工作簿设置格式）。
  2. 样式集中定义成可复用的函数或常量：表头样式、数字格式、边框、列宽（根据内容自动估算列宽，中文按两个字符宽度计算）。
  3. 常用功能：冻结表头行、开启筛选、条件格式（用 Excel 的条件格式规则，而不是 Python 中直接涂色，这样用户修改数据后仍然生效）、合计行使用 Excel 公式（便于用户核对）。
  4. 图表：在指定位置插入柱形图或折线图，设置标题和坐标轴。
  5. 多工作表：工作表名称的长度与非法字符处理；工作表顺序。
  6. 输出：文件名带日期；如果文件已经打开导致无法写入，给出清晰的错误提示。
  7. 注意事项：openpyxl 写入的公式不会被计算，打开文件时由 Excel 计算，因此如果脚本中需要读取计算结果，应在 Python 中计算；大数据量时写入速度的优化方法。

  输出完整可运行的脚本（中文注释）和依赖安装命令。
  命名约定：工作簿文件名形如 周报_年月日.xlsx；工作表名不超过 31 个字符，不能含冒号、斜杠、问号、星号和方括号。
  需要密码保护或只读分发时，说明 openpyxl 的工作表保护只防误改、不是真正的加密。
negativePrompt: null
source: null
verify:
  - 运行生成的脚本，用 Excel 与 WPS 分别打开结果文件，检查条件格式、公式合计行、冻结窗格和图表是否正常
---
**怎么填变量**：[列与格式要求] 逐列写清楚：列名、数据类型、显示格式（例如「完成率：百分比，保留一位小数」）。[样式要求] 可以直接描述你现在手工调整的样子，AI 会把这些操作变成代码。

**常见坑**：
- 在 Python 里根据数值判断后直接给单元格涂红，用户在 Excel 里改了数字，颜色不会跟着变。用条件格式规则更合适。
- 合计行在 Python 中算好写成数字，用户无法核对计算过程；写成 Excel 公式更透明。但要注意 openpyxl 不会计算公式，脚本中读取不到结果。
- 列宽没有设置，打开后一堆「####」或者文字被截断。

**追问技巧**：追问「生成报表后自动发送邮件给指定的人，附上报表并在正文中写三句关键结论」，或「把这个脚本改成读取一个配置文件，不同报表只需修改配置」。

### 示例输出

> 示例，仅供参考（节选）

```python
import pandas as pd
from openpyxl import load_workbook
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.formatting.rule import CellIsRule

HEADER = dict(font=Font(bold=True, color="FFFFFF"), fill=PatternFill("solid", fgColor="1F4E78"),
              alignment=Alignment(horizontal="center", vertical="center"))

def style_sheet(ws, money_cols, pct_col):
    for cell in ws[1]:                                         # 表头样式
        cell.font, cell.fill, cell.alignment = HEADER["font"], HEADER["fill"], HEADER["alignment"]
    ws.freeze_panes = "A2"                                     # 冻结表头
    ws.auto_filter.ref = ws.dimensions                         # 开启筛选
    last = ws.max_row
    for col in money_cols:
        for c in ws[f"{col}2:{col}{last}"]:
            c[0].number_format = "#,##0.00"
    ws.conditional_formatting.add(                             # 完成率低于 80% 标红（条件格式）
        f"{pct_col}2:{pct_col}{last}",
        CellIsRule(operator="lessThan", formula=["0.8"], font=Font(color="C00000")))
    ws[f"A{last + 1}"] = "合计"                                # 合计行使用 Excel 公式
    for col in money_cols:
        ws[f"{col}{last + 1}"] = f"=SUM({col}2:{col}{last})"

with pd.ExcelWriter("周报_2026-10-07.xlsx", engine="openpyxl") as writer:
    summary.to_excel(writer, sheet_name="汇总", index=False)
wb = load_workbook("周报_2026-10-07.xlsx")
style_sheet(wb["汇总"], money_cols=["C", "D"], pct_col="E")
wb.save("周报_2026-10-07.xlsx")
```
