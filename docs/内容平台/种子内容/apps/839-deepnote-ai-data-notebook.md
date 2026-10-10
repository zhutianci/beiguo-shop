---
title: "Deepnote 是什么、怎么用、免费吗：带 AI 智能体的协作式 Python / SQL 数据笔记本"
slug: deepnote-ai-data-notebook
name: Deepnote
url: https://deepnote.com/
pricing: 免费+付费
platforms: 网页
trialNote: Free 档永久免费，最多 3 位编辑者、5 个项目，AI 用量每月有限
products: [ai-tools]
models: []
topics: [data-analysis, coding, research-data]
excerpt: "Deepnote 是云端协作的数据笔记本平台，在一个页面里混用 Python、SQL、文字和图表，内置 Deepnote AI 与 Deepnote Agent，可连接 Snowflake、BigQuery 等数据源并发布成数据应用。"
checkedOn: 2026-10-11
sources:
  - https://deepnote.com/pricing
  - https://deepnote.com/
---

> 本文根据 Deepnote 官网定价页整理，资料核对于 2026-10-11。功能与价格以官网为准。

## 是什么

Deepnote 是一个基于笔记本（notebook）的云端数据平台，覆盖数据分析、数据工程和机器学习。可以把它理解成「多人实时协作版的 Jupyter」，再加上直连数据仓库、定时运行、发布成仪表盘和 AI 辅助。企业版的介绍里把它称为「供人和智能体使用的、安全且可审计的工作空间」。

## 能做什么

定价页列出的功能：

- **Python 与 SQL 笔记本**：代码块、SQL 块、文字块和图表块混排；支持导入导出 .ipynb。
- **Deepnote AI**：生成、修改和解释代码，以及写代码时的 AI 自动补全。
- **Deepnote Agent**：AI 智能体功能，Team 与 Enterprise 可用，免费档有少量次数。
- **Bring your own LLM**：使用自己的大模型，仅企业版。
- **数据应用与仪表盘**：把笔记本发布成可交互的应用分享给他人。
- **实时协作与评论**：所有方案都有；另有代码评审、历史版本恢复。
- **调度与提醒**：定时运行、指标监控提醒。
- **数据工程与建模**：ETL/ELT 管道、语义层（支持 LookML、dbt）、数据目录、Spark 与 Snowpark。
- **机器学习**：模型训练、部署与监控，可选 GPU 机器。
- **数据源集成**：PostgreSQL、MySQL、ClickHouse、BigQuery、Snowflake、Redshift、Amazon Athena、SQL Server、MongoDB、Databricks、Trino 等；文件方面有 Google Drive、Amazon S3、Google Cloud Storage，代码托管支持 GitHub 和 GitLab。

## 怎么上手

1. 在 deepnote.com 注册免费账号，新建一个项目。
2. 上传一个 CSV 文件，或者添加数据库连接。
3. 用 SQL 块取数，结果会成为可在 Python 块里继续处理的数据表；加一个图表块做可视化。
4. 让 Deepnote AI 根据自然语言描述写一段分析代码，逐行检查后运行。
5. 邀请同事一起编辑，或发布成数据应用。

## 免费与付费

定价页（美元，2026-10 查询）：

| 方案 | 价格 | 要点 |
| --- | --- | --- |
| Free | 0，永久 | 最多 3 位编辑者、5 个项目，查看者不限；基础机器（5GB 内存、2 vCPU）不限时长，闲置 15 分钟后休眠；7 天版本历史；每月 10 次代码补全，Agent 及生成 / 修改 / 解释代码各 5 次；无定时运行和 Git 同步 |
| Team | 39 美元/编辑者/月（按年计费） | 完整 AI 与 Agent、定时运行等 |
| Enterprise | 定制 | 自带大模型、HIPAA 等合规 |

月付价格以官网为准。

## 适合谁 / 不适合谁

**适合：** 需要多人一起做分析并向业务方分享结果的数据团队；数据课程的教学与作业（免费档的协作功能够用）；想省掉本地环境配置的分析师。

**不适合：** 数据不允许离开内网的组织；重度依赖本地 GPU 和自定义系统环境的深度学习训练；只做一次性小分析、习惯本地 Jupyter 的个人。

## 注意事项

- 连接数据仓库时用只读账号，并控制谁能看到连接凭据。
- AI 生成的查询可能在大表上跑出高额费用，执行前先看一眼 SQL。
- 免费档的 AI 次数很少，主要用于体验。
