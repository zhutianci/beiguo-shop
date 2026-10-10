---
title: "modern-python skill 是什么、怎么安装使用：Trail of Bits 的现代 Python 工具链 Skill（uv、ruff、ty）"
slug: trailofbits-modern-python-skill
name: modern-python（trailofbits/skills）
url: https://github.com/trailofbits/skills/tree/main/plugins/modern-python/skills/modern-python
pricing: "免费（CC BY-SA 4.0，署名并以相同方式共享）"
platforms: "Claude Code / Codex"
trialNote: "`/plugin marketplace add trailofbits/skills` 然后 `/plugin menu`"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding]
excerpt: "modern-python 是 Trail of Bits 的 Python 工程技能：用 uv、ruff、ty 配置新项目和独立脚本，并指导从 pip、Poetry、mypy、black 等旧工具迁移，内容基于他们自己的项目模板。"
checkedOn: 2026-10-11
sources:
  - https://github.com/trailofbits/skills/tree/main/plugins/modern-python/skills/modern-python
  - https://github.com/trailofbits/skills
  - https://creativecommons.org/licenses/by-sa/4.0/
---

> 本文根据 trailofbits/skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。所在仓库 trailofbits/skills 在 GitHub 约 7462 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

让智能体新建一个 Python 项目，它多半还在用 `requirements.txt` 加 `pip`，格式化用 black，类型检查用 mypy——能用，但已经不是现在的主流做法。modern-python 把工具链换成新一代。`description`：用现代工具（uv、ruff、ty）配置 Python 项目；在创建项目、编写独立脚本，或从 pip、Poetry、mypy、black 迁移时使用。技能说明它基于 Trail of Bits 自己的项目模板 cookiecutter-python。

适用场景列得很具体：新建项目或包、配置 `pyproject.toml`、配置开发工具（检查、格式化、测试）、写带外部依赖的脚本、从旧工具迁移。同时有一节「什么时候不用」，以及一棵帮你选路径的决策树。

主体内容：

- **工具总览**与**安全工具**；
- **最小项目**的快速开始，和**完整项目**的四步搭建（目录结构、`pyproject.toml`、安装依赖、Makefile）；
- **迁移指南**：从 requirements.txt + pip、从 setup.py、从 flake8 + black + isort、从 mypy / pyright 各怎么迁；
- uv 命令速查、临时依赖的 `--with` 用法、依赖分组；
- 最佳实践清单。

## 怎么安装

`modern-python` 在 trailofbits/skills 里属于 `modern-python` 插件。Claude Code 先登记市场，再在菜单里选择要装的插件（命令来自仓库 README）：

```text
/plugin marketplace add trailofbits/skills
/plugin menu
```

Codex 用 `codex plugin marketplace add trailofbits/skills`，再执行 `codex plugin add modern-python@trailofbits`。

仓库整体介绍和其他安装方式，详见本站《trailofbits/skills 是什么、怎么安装：Trail of Bits 的代码安全审计 Skills（静态分析、差异评审、供应链检查）》。

## 怎么用

- 「新建一个命令行工具项目，用 uv 管理，配好 ruff 和测试」。
- 「把这个用 Poetry 的老项目迁到 uv，保留依赖版本」。
- 「写一个带依赖声明的单文件脚本，能直接用 uv 运行」。

目录里有九份参考（pyproject 配置、ruff 配置、测试、PEP 723 脚本、迁移清单、安全设置等）和两个模板文件。

## 适合谁 / 局限

适合新开 Python 项目的开发者，以及想把团队工具链统一到新一代工具的人。这是一套有明确取舍的方案，团队已有成熟且运转良好的工具链时不必为换而换；其中的类型检查器 ty 比较新，成熟度要自己评估。

## 注意事项

- **许可**：CC BY-SA 4.0，改编后须以相同方式共享。
- **会执行命令**：安装 uv、创建虚拟环境、改写配置文件；迁移前先提交当前状态。
- 虽然出自安全公司，这个技能本身是工程规范类，不涉及漏洞分析。
