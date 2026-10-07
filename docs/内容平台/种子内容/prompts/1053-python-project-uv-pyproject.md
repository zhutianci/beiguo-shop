---
title: Python 项目依赖管理提示词（pyproject.toml 配置、uv 或 pip 锁定版本、开发依赖分组、迁移旧 requirements.txt）
slug: python-project-uv-pyproject
model: any-llm
topics: [coding]
needsRefImage: false
useCase: 新建 Python 项目不知道依赖该怎么管理，或者老项目只有一个混乱的 requirements.txt、换台机器就装不起来时用：让 AI 帮你整理成规范的 pyproject.toml，区分运行依赖和开发依赖，用 uv 或 pip-tools 锁定版本，并给出团队与 CI 的统一安装方式。
prompt: |
  你是一名 Python 工程化方面的专家。请帮我规范项目的依赖管理。

  - 项目类型：[项目类型]（例：Web 服务、数据分析脚本集合、要发布到 PyPI 的库）
  - Python 版本要求：[如 3.11 及以上]
  - 现有依赖文件（requirements.txt、setup.py、Pipfile 等，原样粘贴）：
    [粘贴依赖文件]
  - 想用的工具：[想用的工具]（可选：uv/pip + pip-tools/Poetry/你推荐）
  - 运行环境：[运行环境]（例：本地 Windows 开发、Linux 容器部署、GitHub Actions）

  请完成：
  1. 工具选择：如果我写了「你推荐」，根据项目类型和团队情况给出建议并说明理由；如果是库项目和应用项目，说明两者在版本约束上的不同做法（库写宽松的范围，应用锁定精确版本）。
  2. 整理依赖：
     - 区分直接依赖和间接依赖：现有文件中哪些包是被其他包带进来的，可以不直接声明；
     - 区分运行依赖、开发依赖（测试、格式化、类型检查）、可选依赖；
     - 指出可能已经不再使用、版本明显过旧、或者存在已知兼容问题的包，标注「需确认」。
  3. 生成 pyproject.toml：项目元数据、Python 版本要求、依赖声明、开发依赖分组，以及常用工具（如测试、格式化、类型检查）的配置段。
  4. 锁定版本：说明锁文件的作用、生成和更新的命令，以及锁文件要不要提交到仓库。
  5. 日常命令清单：创建虚拟环境、安装全部依赖、新增依赖、新增开发依赖、升级某个包、运行脚本或测试、导出 requirements.txt（给只支持该格式的平台用）。
  6. CI 与容器：在 CI 中按锁文件安装并缓存依赖；在 Dockerfile 中利用分层缓存只在依赖变化时重新安装。
  7. 迁移步骤：从现有文件迁移过来的步骤和验证方法（迁移后跑一遍测试，对比关键包的版本）。

  命令和配置字段以所选工具的当前官方文档为准；拿不准的写「请以官方文档为准」。
negativePrompt: null
source: null
verify:
  - 核对 uv 的 init、add、add --dev、sync、lock、run、export 命令与官方文档一致（https://docs.astral.sh/uv/）
  - 用一个旧 requirements.txt 跑一遍迁移步骤，检查锁定后在新机器上能否一次安装成功
---
**怎么填变量**：[现有依赖文件] 原样贴进来，AI 会帮你区分哪些是真正直接用到的包。用 `pip freeze` 导出的文件通常混着几十个间接依赖，这正是需要整理的地方。[项目类型] 很重要：要发布给别人用的库不能锁死精确版本，否则会和使用者的其他依赖冲突。

**常见坑**：
- 只有一个 `pip freeze` 导出的文件，分不清哪些是自己真正需要的，升级时不敢动任何一个。在 pyproject.toml 里只声明直接依赖，精确版本交给锁文件。
- 测试、格式化工具和运行依赖混在一起，生产镜像里装了一堆用不到的包。开发依赖单独分组。
- 应用项目的锁文件不提交到仓库，每个人、每次部署装到的版本都可能不同。

**追问技巧**：追问「写一个每月自动检查依赖更新并发起合并请求的方案」，或「检查这些依赖中有没有已知安全漏洞，用什么工具扫描」（可配合 1078 号提示词）。

### 示例输出

> 示例，仅供参考（Web 服务，使用 uv，节选）

```toml
[project]
name = "order-service"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [
    "fastapi>=0.110",
    "sqlalchemy>=2.0",
    "httpx>=0.27",
]

[dependency-groups]
dev = ["pytest>=8", "ruff", "mypy"]
```

```bash
uv sync                      # 按锁文件创建虚拟环境并安装（含开发依赖）
uv add redis                 # 新增运行依赖，同时更新 pyproject.toml 与 uv.lock
uv add --dev pytest-cov      # 新增开发依赖
uv run pytest                # 在项目环境中运行测试
uv export --format requirements-txt > requirements.txt   # 给只认 requirements.txt 的平台
```

整理结果：原文件中的 `starlette`、`anyio`、`idna` 是 fastapi、httpx 的间接依赖，不需要直接声明；`flask` 在代码中未找到导入，**需确认** 是否还在使用。
