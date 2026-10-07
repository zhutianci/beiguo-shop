---
title: "Hugging Face 是什么：模型、数据集与 Spaces 使用入门"
slug: hugging-face-model-hub
name: Hugging Face
url: https://huggingface.co/
pricing: 免费+付费（PRO / Team / Enterprise，算力按量）
platforms: 网页 / 命令行 / API / Python 库
trialNote: 免费账号可浏览下载公开模型和数据集、创建公开仓库和免费 CPU Spaces
products: [ai-tools]
models: []
topics: [coding]
excerpt: "Hugging Face 是全球最大的开源 AI 社区平台，托管数百万个模型、数据集和 Spaces 演示应用，开发者在这里下载开源模型、分享成果、部署推理。"
checkedOn: 2026-10-07
sources:
  - https://huggingface.co/
  - https://huggingface.co/docs/hub/index
  - https://huggingface.co/pricing
  - https://huggingface.co/docs/hub/spaces-zerogpu
---

> 本文根据 Hugging Face 官网、Hub 官方文档与官方定价页整理，资料核对于 2026-10-07。功能和价格变化快，以官网为准。

## 是什么

Hugging Face 是一家开源 AI 公司，也是目前最大的开源机器学习社区平台，常被称为「AI 界的 GitHub」。它的核心是 **Hugging Face Hub**（huggingface.co）：按官方文档的数据，Hub 上托管了 200 多万个模型、上百万个数据集和上百万个 Spaces 演示应用，大部分公开可用。

各大公司和研究机构发布开源模型（比如 Qwen、DeepSeek、Llama、Gemma 等系列），通常都会把权重放到 Hugging Face 上。它同时维护着 Transformers、Datasets、Diffusers 等被广泛使用的开源库，以及 Gradio 演示框架。对开发者来说，它既是「下载开源模型的地方」，也是「展示和部署自己作品的地方」。

## 能做什么

- **找和下载模型**：按任务（文本生成、图像生成、语音识别等）、语言、许可证筛选模型，每个模型有 Model Card 说明用途、局限和许可。
- **用数据集**：浏览和下载各领域数据集，网页上的 Data Studio 可直接预览数据；用 `datasets` 库一行代码加载，超大数据集支持流式读取。
- **Spaces 在线演示**：直接在浏览器里试别人做好的 AI 应用；自己也能用 Gradio、Docker 或静态页面快速部署 Demo，需要 GPU 时可申请 ZeroGPU 动态分配。
- **Inference Providers 推理调用**：通过统一的无服务器 API 调用 Hub 上的模型，不用自己部署。
- **专属部署与算力**：Inference Endpoints 部署专属推理服务，Jobs 运行训练任务，按量计费。
- **版本管理与协作**：所有仓库基于 Git，有提交历史、分支、PR 和讨论区；组织账号方便团队和高校协作。
- **论文与社区**：Daily Papers 汇总每日热门 AI 论文，可以直接跳转到相关模型和 Demo。

## 怎么上手

1. 打开 huggingface.co，用邮箱注册账号（不注册也能浏览和下载大部分公开内容）。
2. 在顶部「Models」里按任务筛选，打开一个模型页，先读 Model Card 里的用途、许可证和示例代码。
3. 想直接体验，进「Spaces」搜索感兴趣的应用，在浏览器里试用。
4. 在本地用代码调用：安装 `transformers` 或 `huggingface_hub`，复制模型页上的示例代码运行；下载受限模型（gated）时需先在模型页申请并在设置里创建 Access Token。
5. 想分享成果，点「New」创建模型、数据集或 Space 仓库并上传文件。

可以这样开始：在 Models 页面筛选「Text Generation」+「Chinese」，按下载量排序，挑一个小参数量模型在 Space 或本地试跑。

## 免费与付费

官网定价页列出的账号方案（官网定价页，2026-10 查询）：

- **免费账号**：使用 Hub 的核心功能，浏览、下载、创建公开仓库，免费 CPU Spaces。
- **PRO**：9 美元/月，私有存储空间为免费的 10 倍，更多推理额度和 ZeroGPU 配额，可托管 ZeroGPU Spaces。
- **Team**：每人 20 美元/月，含 SSO、审计日志、存储区域控制、精细权限管理。
- **Enterprise**：每人 50 美元/月起，更高的存储和速率限制、SCIM 用户管理和专属支持。

算力另外按量计费：Spaces GPU 硬件起价约每小时 0.40 美元（NVIDIA T4），Inference Endpoints 和存储也有单独价目。

## 适合谁 / 不适合谁

适合：
- 想下载开源模型本地部署、微调或做研究的开发者和学生。
- 需要公开数据集训练模型的算法工程师。
- 想快速做一个可分享的 AI Demo 的人（用 Spaces）。
- 发布开源模型、需要社区曝光的团队。

不适合：
- 只想用 AI 聊天、不写代码的普通用户，它不是对话产品。
- 对模型许可证不了解就想商用的团队：每个模型许可证不同，需逐个核对。

## 注意事项

- **许可证各不相同**：Hub 上的模型和数据集由上传者设定许可证，有的禁止商用或有附加条款，使用前务必看清 Model Card 和 License。
- **安全风险**：官方提供恶意软件扫描，但下载第三方上传的模型文件仍要谨慎，优先选择 safetensors 格式和可信发布者。
- **Token 保管**：Access Token 等同账号密码，不要写进公开代码仓库。
- **内容规范**：上传内容需遵守官方的内容指南和行为准则。
