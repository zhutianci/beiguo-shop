---
title: PowerShell 脚本怎么写提示词（Windows 批量处理文件与日志：先预览再执行、带日志和错误处理）
slug: powershell-batch-script
model: any-llm
topics: [coding, office]
needsRefImage: false
useCase: 在 Windows 上要批量重命名、整理归档文件、统计日志、导出报表，想写一个能重复使用的 PowerShell 脚本时用：描述任务，得到带参数、预览模式、错误处理和日志的 .ps1 脚本，附运行方法和常见报错的处理。
prompt: |
  你是一名熟悉 Windows 运维和 PowerShell 的工程师。请帮我写一个 PowerShell 脚本。

  - 要完成的任务（按步骤写）：[任务描述]
  - 处理的对象与位置：[处理的对象与位置]（例：D 盘某目录下的所有 Excel 文件、IIS 日志）
  - PowerShell 版本：[PowerShell 版本]（可选：Windows 自带 5.1/PowerShell 7/不确定）
  - 运行方式：[运行方式]（可选：双击运行/手动在终端运行/任务计划程序定时运行）
  - 输出要求：[输出要求]（例：生成 CSV 汇总、在原地改名、移动到归档目录）

  脚本要求：
  1. 使用参数块定义输入参数，必填参数和默认值写清楚；脚本开头有注释形式的帮助说明（用途、参数、示例），可以用 Get-Help 查看。
  2. 支持预览：会修改、移动、删除文件的操作，支持 -WhatIf 预览将要执行的动作；默认先预览，确认后再正式执行。
  3. 错误处理：使用 try / catch，关键操作出错时记录是哪个文件、什么原因，并继续处理下一个还是立即停止要说明理由。
  4. 日志：把处理结果（成功、跳过、失败）写入带时间戳的日志文件，结束时输出汇总数量。
  5. 兼容性：
     - 说明脚本在 5.1 和 7 中是否都能运行，有差异的地方标出；
     - 处理中文路径和中文内容时的编码问题（读写 CSV、文本文件时显式指定编码）；
     - 路径中有空格、特殊字符时的处理。
  6. 安全：只操作指定目录内的文件；不修改系统设置、注册表和安全策略；删除操作改为移动到回收目录，由我确认后再手动清理。
  7. 运行说明：如何打开终端运行；如果遇到「禁止运行脚本」的提示，说明这是执行策略的限制，告诉我查看当前策略的命令，并建议我自行决定、只为当前会话临时放开，不要修改全局设置。

  输出：完整脚本（中文注释）、运行示例、常见报错与解决方法。
negativePrompt: null
source: null
verify:
  - 在 Windows PowerShell 5.1 和 PowerShell 7 中各运行一次（先用 -WhatIf），检查中文文件名与 CSV 编码是否正常
---
**怎么填变量**：[PowerShell 版本] 不确定时，在终端运行 `$PSVersionTable.PSVersion` 查看。Windows 自带的是 5.1，它和 PowerShell 7 在默认编码等细节上有差别，处理中文时尤其要注意。

**常见坑**：
- Windows PowerShell 5.1 导出 CSV 的默认编码，用 Excel 打开中文可能乱码。脚本中要显式指定编码（例如带 BOM 的 UTF-8），并说明 5.1 与 7 的差异。
- 一上来就执行删除或移动，路径写错就无法挽回。先用 -WhatIf 预览，确认无误再正式运行。
- 遇到执行策略提示时，网上常见的做法是永久放宽系统策略。更稳妥的是只对当前会话临时放开，由你自己决定。

**追问技巧**：脚本运行报错时，把完整的红色错误信息贴回去（包括行号），问「这个错误的原因和修改方法」；需要定时运行时，追问「用任务计划程序定时运行这个脚本的设置步骤」。

### 示例输出

> 示例，仅供参考（按修改日期把文件归档到「年-月」子目录，节选）

```powershell
<#
.SYNOPSIS
  按文件修改日期把文件移动到「年-月」子目录。
.EXAMPLE
  .\Archive-Files.ps1 -Source 'D:\报表' -WhatIf
#>
[CmdletBinding(SupportsShouldProcess)]
param(
  [Parameter(Mandatory)][string]$Source,
  [string]$LogFile = (Join-Path $PSScriptRoot "archive-$(Get-Date -Format yyyyMMdd).log")
)

$ok = 0; $fail = 0
Get-ChildItem -LiteralPath $Source -File | ForEach-Object {
  $target = Join-Path $Source $_.LastWriteTime.ToString('yyyy-MM')
  try {
    if ($PSCmdlet.ShouldProcess($_.FullName, "移动到 $target")) {
      New-Item -ItemType Directory -Path $target -Force | Out-Null
      Move-Item -LiteralPath $_.FullName -Destination $target -ErrorAction Stop
      Add-Content -Path $LogFile -Value "$(Get-Date -Format s) 成功 $($_.Name)" -Encoding utf8
      $ok++
    }
  } catch {
    Add-Content -Path $LogFile -Value "$(Get-Date -Format s) 失败 $($_.Name)：$($_.Exception.Message)" -Encoding utf8
    $fail++
  }
}
Write-Host "完成：成功 $ok，失败 $fail，日志 $LogFile"
```
