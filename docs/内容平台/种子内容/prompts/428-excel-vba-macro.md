---
title: Excel VBA 宏代码生成提示词（中文描述需求 → 带注释的宏，含备份提醒、报错处理与运行步骤）
slug: excel-vba-macro
model: any-llm
topics: [office, coding]
needsRefImage: false
useCase: 公式解决不了、又不方便装 Python 的重复操作（按列拆分工作表、批量生成表单、跨表汇总、批量设置格式）时用：描述需求，得到带中文注释、关闭屏幕刷新提速、出错能恢复的 VBA 宏，以及从打开编辑器到运行的完整步骤。
prompt: |
  # 角色
  你是一名写了十几年 Excel VBA 的办公效率顾问，熟悉 Excel 对象模型，知道宏运行后无法用 Ctrl+Z 撤销，所以写的每个宏都把安全放在第一位。

  # 运行环境
  - 软件与版本：[如 Microsoft 365/Excel 2016/WPS]
  - 操作系统：[Windows/macOS]
  - 我的 VBA 水平：[没用过/会录制宏/能看懂代码]

  # 工作簿情况
  - 涉及的工作表名称与用途：[工作表名称与用途]
  - 数据区域（表头在哪一行、从哪列到哪列、大约多少行）：[数据区域说明]
  - 样例数据（几行文字即可，已替换敏感信息）：
    [样例数据]

  # 要实现的功能
  [需求描述]

  # VBA 编码规范（逐条遵守）
  1. 模块开头写 Option Explicit，所有变量显式声明并使用有意义的英文名，关键步骤配中文注释。
  2. 通过工作表名称引用工作表，不依赖当前选中的单元格或激活的工作表；尽量不用 Select 和 Activate。
  3. 用 Cells(Rows.Count, 列).End(xlUp).Row 这类方法动态确定最后一行，不写死行数。
  4. 数据量大时先把区域读进数组处理，再一次性写回；运行期间关闭 ScreenUpdating，必要时把计算模式改为手动。
  5. 要有错误处理：出错时恢复屏幕刷新和计算模式，并用 MsgBox 显示易懂的错误原因。
  6. 宏开始前弹窗确认，提醒先备份；会删除或覆盖数据的步骤，先把原数据复制到一个备份工作表。
  7. 单元格取值统一用 .Value，比较文本前先 Trim 并用 CStr 转换，避免数字与文本混用导致匹配失败。
  8. 新建工作表或文件时，处理名称中的非法字符（冒号、斜杠、问号、星号、方括号等）和 31 个字符的长度上限，以及重名情况。

  # 交付内容
  1. 完整的 VBA 代码（一个代码块）；
  2. 操作步骤：如何打开 VBA 编辑器（Alt+F11）、插入模块、粘贴代码、运行，以及如何把文件另存为 .xlsm 启用宏的格式；
  3. 代码逐段说明；
  4. 常见报错（如「下标越界」「类型不匹配」）的原因和处理方法；
  5. 如果这个需求用公式、数据透视表或 Power Query 就能更好地解决，直接告诉我，不必强行写宏。
negativePrompt: null
source: null
verify:
  - 在 Microsoft 365 Excel 上运行示例宏，检查拆分结果和报错处理
  - 核对 WPS 各版本对 VBA 宏的支持情况（个人版是否需要额外安装组件）
---
**怎么填变量**：[样例数据] 至少给表头和 3 行数据，并说清哪一列是关键列。[需求描述] 写成「把『数据』表按 C 列『部门』拆分成多个工作表，每个工作表保留表头」这样可操作的描述。用 WPS 的话一定要写在 [软件与版本] 里——WPS 对 VBA 的支持因版本而异，需要先确认你的版本能运行宏。

**常见坑**：
- 宏执行后无法撤销，第一次运行一定要在副本上测试。
- 保存成 .xlsx 会丢失宏代码，要另存为 .xlsm。
- 从网上下载的含宏文件默认被禁用宏，这是安全机制；只对自己写的、来源可信的宏启用。

**追问技巧**：运行报错时，把报错对话框的文字和 VBA 编辑器里高亮的那一行一起贴回去；需求有变化时说「在现有代码基础上增加：拆分后每个工作表自动调整列宽」，避免整段重写。

### 示例输出

> 示例，仅供参考（按 C 列「部门」拆分到多个工作表，假设 A 列每行都有值）

```vba
Option Explicit

Sub SplitByDepartment()
    Dim src As Worksheet, ws As Worksheet
    Dim lastRow As Long, r As Long
    Dim key As String

    If MsgBox("将按部门拆分「数据」表，建议先备份。继续吗？", vbYesNo) <> vbYes Then Exit Sub
    Set src = ThisWorkbook.Worksheets("数据")
    lastRow = src.Cells(src.Rows.Count, "C").End(xlUp).Row

    Application.ScreenUpdating = False
    On Error GoTo CleanUp
    For r = 2 To lastRow
        key = Trim(CStr(src.Cells(r, "C").Value))
        If key <> "" And key <> src.Name Then   ' 防止把行追加回源表
            Set ws = Nothing
            On Error Resume Next            ' 工作表不存在时不报错，ws 保持 Nothing
            Set ws = ThisWorkbook.Worksheets(key)
            On Error GoTo CleanUp
            If ws Is Nothing Then
                Set ws = ThisWorkbook.Worksheets.Add(After:=ThisWorkbook.Worksheets(ThisWorkbook.Worksheets.Count))
                ws.Name = key                ' 部门名含非法字符或超过 31 个字符时会报错
                src.Rows(1).Copy ws.Rows(1)  ' 复制表头
            End If
            src.Rows(r).Copy ws.Rows(ws.Cells(ws.Rows.Count, "A").End(xlUp).Row + 1)
        End If
    Next r

CleanUp:
    Application.ScreenUpdating = True
    If Err.Number <> 0 Then MsgBox "第 " & r & " 行处理出错：" & Err.Description, vbExclamation
End Sub
```
