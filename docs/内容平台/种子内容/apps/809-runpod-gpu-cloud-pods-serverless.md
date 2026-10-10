---
title: "RunPod 是什么、怎么用、价格怎么算：租 GPU 跑模型的 AI 开发者云"
slug: runpod-gpu-cloud-pods-serverless
name: Runpod
url: https://www.runpod.io/
pricing: 按量付费
platforms: 云服务（网页控制台 / API）
products: [ai-tools]
models: []
topics: [coding]
excerpt: "Runpod 自称「AI 开发者云」，提供按需租用的 GPU：独占实例 Pods、按用量计费的 Serverless 推理、多节点 Clusters，以及预部署模型的 Public Endpoints。"
checkedOn: 2026-10-11
sources:
  - https://www.runpod.io/pricing
  - https://www.runpod.io/
verify:
  - "定价页显示的示例单价（H100 SXM 3.99 美元/小时等）与页面结构化数据里的另一组价格不一致，正文未写具体 GPU 单价"
---

> 本文根据 Runpod 官网定价页整理，资料核对于 2026-10-11。GPU 单价变动频繁，正文不列具体型号价格，以官网为准。

## 是什么

Runpod（很多教程写作 RunPod）是一家 GPU 云服务商，官网的定位是「AI 开发者云」（The AI Developer Cloud），运营主体为 Runpod Inc.。它提供按需租用的显卡，覆盖从开发调试、模型训练到线上推理的各个阶段，在 Stable Diffusion、ComfyUI 和开源大模型玩家中用得很多。

## 能做什么

定价页列出的产品：

- **Pods**：独占的 GPU 实例，适合开发和长时间运行的任务。
- **Serverless**：推理用的工作进程，按实际用量计费。
- **Clusters**：多 GPU 集群，用于多节点任务，无需长期承诺，最多 64 块 GPU。
- **Reserved Clusters**：有可用性保证和 SLA 的专属集群，面向企业，需联系销售。
- **Public Endpoints**：官方预先部署好的模型，直接通过 API 调用。
- **Storage**：容器磁盘、卷磁盘和网络存储。
- **Runpod Hub**：页面价目里列出的条目，细节以官网为准。

## 怎么上手

1. 在 runpod.io 注册账号并充值（按量扣费）。
2. 想要一台完整的机器，就创建 Pod：选 GPU 型号和镜像模板，启动后通过网页终端或 SSH 使用。
3. 想把模型做成接口，就用 Serverless 或直接调用 Public Endpoints。
4. 用完及时停止或删除实例，并检查存储是否还在计费。

各步骤的界面名称与模板以官网当前控制台为准。

## 免费与付费

定价页的要点（美元，2026-10 查询）：

- 计算资源**按小时或按秒**计费（页面可切换显示），不同 GPU 型号、不同产品（Pods / Serverless / Clusters）单价不同。
- 存储价格：容器磁盘 0.10 美元/GB/月；卷磁盘运行时 0.10 美元/GB/月、闲置时 0.20 美元/GB/月；标准网络存储 1TB 以内 0.07 美元/GB/月、超过 1TB 部分 0.05 美元/GB/月；高性能网络存储 0.14 美元/GB/月。
- 页面没有写免费额度。

具体 GPU 单价请直接查看定价页，核对时页面上不同位置的数字并不一致。

## 适合谁 / 不适合谁

**适合：** 本机显卡不够、想临时租一块跑 ComfyUI、训练 LoRA 或测试开源大模型的个人；需要弹性推理接口的小团队；要做多 GPU 训练又不想签长期合同的研究者。

**不适合：** 不熟悉 Linux 和容器的纯新手（需要一些学习成本）；对合规、数据驻留有严格要求的企业（应评估 Reserved Clusters 或其他云厂商）；希望完全免费试玩的人。

## 注意事项

- **停机不等于停止计费**：闲置的卷磁盘和网络存储仍会收费，闲置卷的单价还更高。
- 镜像模板来自社区的，要自己判断来源是否可信，不要在里面放重要密钥。
- 账户余额用尽后实例和数据的处理规则，以官方文档为准，重要数据及时备份。
