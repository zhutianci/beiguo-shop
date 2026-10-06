---
title: Python 自动化办公脚本提示词（批量合并 Excel、批量重命名文件，先预览再执行）
slug: python-office-automation
model: any-llm
topics: [coding, office]
needsRefImage: false
useCase: 每周都要手动合并几十个表格、按规则重命名一堆文件、把数据拆分到多个文件时用：描述文件情况和处理规则，得到零基础也能运行的 Python 脚本，默认只预览不改动、结果输出到新文件夹，并附安装和运行步骤。
prompt: |
  【角色】你是一名给非程序员写办公自动化脚本的工程师。你写的脚本要让第一次装 Python 的人也能跑通，而且绝不能弄坏原始文件。

  【我的情况】
  - 电脑系统：[Windows/macOS]
  - Python 基础：[零基础/会一点]
  - 要处理的文件：[如 30 个 .xlsx 销售表]
  - 文件所在文件夹：[文件夹路径]
  - 文件结构说明（表头在第几行、有几个工作表、有没有合并单元格；能贴几行样例更好）：
    [文件结构与样例]
  - 处理规则：[处理规则描述]
  - 期望结果：[期望得到的文件]

  【脚本要求】
  1. 安全：
     - 原始文件只读，所有结果写到新的输出文件夹；
     - 提供「预览模式」并默认开启：只打印将要做什么（例如每个文件读到多少行、每个旧文件名对应的新文件名），确认后把开头的 DRY_RUN 改为 False 再真正执行；
     - 批量重命名要检查新文件名冲突，冲突时停下并报告，不能覆盖。
  2. 健壮：
     - 跳过 Excel 打开时产生的 ~$ 开头的临时文件和隐藏文件；
     - 工号、手机号、订单号这类列按文本读取，避免前导 0 丢失或变成科学计数法；
     - 读取 .xls 旧格式需要额外的 xlrd 库，.csv 要处理 GBK 和 UTF-8 两种编码；
     - 某个文件出错时记录原因并继续处理其他文件，最后汇总成功和失败的清单。
  3. 易用：
     - 需要改的参数（文件夹路径、列名、规则）集中放在脚本开头，并用中文注释说明；
     - 运行结束打印汇总：处理了几个文件、共多少行、输出到哪里。
  4. 附上：安装 Python 与依赖库的步骤（pip 命令）、运行方法、常见报错及解决办法。

  【输出格式】
  先复述处理规则和你的假设 → 完整脚本（一个代码块）→ 安装与运行步骤 → 常见报错 FAQ → 需要我确认的问题。
negativePrompt: null
source: null
verify:
  - 准备 3 个含前导 0 工号的 Excel 文件实测合并，检查工号是否保留
---
**怎么填变量**：[文件结构与样例] 最重要：把表头和前 3 行数据复制成文字贴进来（敏感数据先替换成假数据），AI 才知道列名是什么、要不要跳过标题行。[处理规则] 写成可判断的规则，例如「按文件名里的日期排序，合并后加一列『来源文件』，金额列求和」。

**常见坑**：
- 各个文件的列名不完全一致（「销售额」和「销售额（元）」），合并后会多出空列；遇到这种情况让它先输出「各文件列名对比表」。
- 合并单元格、多行表头需要特殊处理，要在样例里说明。
- 公式单元格：用 openpyxl 读取时默认得到公式本身，加 data_only=True 才能拿到 Excel 上次保存时计算出的值。

**追问技巧**：第一次运行报错时，把完整报错贴回去；跑通后可以追问「改成双击就能运行的版本」，或者「每周一早上自动运行」。

### 示例输出

> 示例，仅供参考（合并文件夹内所有 .xlsx，节选）

```python
from pathlib import Path
import pandas as pd   # 需要先安装：pip install pandas openpyxl

SRC = Path(r"D:\报表\待合并")        # 要合并的文件夹
OUT = Path(r"D:\报表\输出\合并结果.xlsx")
DRY_RUN = True                       # 预览模式：确认无误后改成 False

frames = []
for f in sorted(SRC.glob("*.xlsx")):
    if f.name.startswith("~$"):      # 跳过 Excel 打开时生成的临时文件
        continue
    df = pd.read_excel(f, dtype={"工号": str})   # 工号按文本读，保留前导 0
    df["来源文件"] = f.name
    frames.append(df)
    print(f"{f.name}: {len(df)} 行")

if frames and not DRY_RUN:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    pd.concat(frames, ignore_index=True).to_excel(OUT, index=False)
    print(f"已输出到 {OUT}")
```
