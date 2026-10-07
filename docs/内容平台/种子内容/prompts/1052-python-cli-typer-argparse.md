---
title: Python 命令行工具怎么写提示词（argparse / Typer：子命令、参数校验、帮助信息、退出码与测试）
slug: python-cli-typer-argparse
model: any-llm
topics: [coding]
needsRefImage: false
useCase: 想把常用的 Python 脚本做成好用的命令行工具（团队内部工具、数据处理工具）时用：描述命令和参数，得到带子命令、参数校验、清晰帮助信息、有意义退出码和进度输出的 CLI 代码，以及安装方式和测试。
prompt: |
  你是一名注重使用体验的 Python 工程师。请帮我把下面的功能做成命令行工具。

  - 工具名称：[如 datatool]
  - 功能与子命令：[功能与子命令]（例：import 导入 CSV、export 导出报表、check 校验数据）
  - 每个子命令的参数和选项：[参数说明]
  - 使用库：[使用库]（可选：标准库 argparse/Typer/Click/你推荐）
  - 使用者：[如团队内的非开发同事、CI 流水线]

  要求：
  1. 选择库：如果我写了「你推荐」，根据是否允许第三方依赖、功能复杂度给出建议。
  2. 命令设计：
     - 子命令和参数名清晰一致，长选项用连字符命名，常用选项提供短选项；
     - 必填与可选的区分、默认值、取值范围和文件路径的校验；
     - 危险操作（覆盖、删除）需要确认，或者提供跳过确认的选项供脚本使用；
     - 提供预演选项和详细输出选项。
  3. 帮助信息：每个命令和参数都有中文说明，并附上使用示例。
  4. 输出：正常结果输出到标准输出，日志和错误输出到标准错误，方便在管道中使用；支持机器可读的输出格式（如 JSON）供脚本调用。
  5. 退出码：成功为 0，参数错误、数据校验失败、运行出错分别使用不同的非零退出码，并写在帮助信息中。
  6. 错误提示：面向使用者的友好提示，不直接抛出完整堆栈（详细模式下再显示）。
  7. 长时间任务显示进度；被中断时（Ctrl+C）友好退出并清理临时文件。
  8. 打包：在项目配置中声明命令入口，安装后可以直接用工具名调用。
  9. 测试：针对参数解析和主要命令写测试，使用对应库提供的测试工具。

  输出：项目结构、完整代码（中文注释）、项目配置中的入口声明、安装与使用示例、测试代码。
negativePrompt: null
source: null
verify:
  - 安装生成的工具后运行 --help 和一次参数错误调用，检查帮助信息与退出码是否符合说明
---
**怎么填变量**：[使用者] 会影响设计重点：给非开发同事用的工具，提示信息和确认步骤要更友好；给 CI 流水线用的，要有机器可读输出、跳过确认的选项和稳定的退出码。[使用库] 不想引入依赖就选标准库 argparse，子命令多、希望少写代码可以选 Typer。

**常见坑**：
- 把进度和日志打印到标准输出，结果别人把输出通过管道传给其他命令时，数据和日志混在一起。数据走标准输出，其他信息走标准错误。
- 所有错误都以退出码 1 结束，调用的脚本无法区分「参数写错了」和「数据有问题」。
- 只能用「python 某路径下的脚本」这种方式运行。在项目配置里声明入口，安装后就能直接输入工具名使用。

**追问技巧**：追问「给这个工具加上命令行自动补全，并说明在 bash、zsh、PowerShell 中怎么启用」，或「增加一个配置文件，命令行参数优先于配置文件」。

### 示例输出

> 示例，仅供参考（Typer，节选）

```python
from pathlib import Path
import typer

app = typer.Typer(help="数据导入导出工具")

EXIT_INVALID_DATA = 3

@app.command("import")
def import_csv(
    file: Path = typer.Argument(..., exists=True, readable=True, help="要导入的 CSV 文件"),
    dry_run: bool = typer.Option(False, "--dry-run", "-n", help="只校验不写入"),
) -> None:
    """导入 CSV 数据。示例：datatool import orders.csv --dry-run"""
    errors = validate(file)
    if errors:
        for e in errors:
            typer.echo(f"第 {e.line} 行：{e.message}", err=True)
        raise typer.Exit(code=EXIT_INVALID_DATA)
    if not dry_run:
        write_rows(file)
    typer.echo(f"处理完成：{file.name}")
```

```toml
[project.scripts]
datatool = "datatool.cli:app"
```
