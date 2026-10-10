---
title: "Jina AI 是什么、怎么用：Reader 网页转文本、Embeddings 与 Reranker 搜索基础模型"
slug: jina-ai-reader-embeddings-reranker
name: Jina AI
url: https://jina.ai/
pricing: 按 token 计费（价格以官网为准）
platforms: 云服务 API / MCP
products: [ai-tools]
models: []
topics: [coding, ai-agent, research-data]
excerpt: "Jina AI 提供一组做搜索与 RAG 的基础模型和接口：Reader 在网址前加 r.jina.ai 即可把网页转成适合大模型的文本，另有网络搜索 s.jina.ai、多模态多语言 Embeddings、Reranker 和 MCP 服务。"
checkedOn: 2026-10-11
sources:
  - https://jina.ai/
verify:
  - "官网页脚显示「Elastic © 2026」并带 Elastic 标识，页面未用文字说明所有权；首页未列出价格与免费额度，正文未写数字"
---

> 本文根据 Jina AI 官网首页整理，资料核对于 2026-10-11。接口与价格以官网和官方文档为准。

## 是什么

Jina AI 是一家做搜索基础模型的公司，官网的标语是「你的搜索基础，全面增强」，并称其前沿模型为高质量的企业搜索和 RAG 系统打底。对开发者来说，它最出名的是几个拿来即用的接口——尤其是 Reader，用法简单到只需要改一下网址。核对时官网页脚的版权方显示为 Elastic。

## 能做什么

官网列出的产品与接口：

- **Reader**：把任意网址转换成适合大模型阅读的输入。用法是在原网址前面加上 `r.jina.ai`（例如 `https://r.jina.ai/https://example.com`），返回去掉广告和导航后的正文。页面提示开启 OCR 选项会多消耗约 40 倍的 token。
- **Search（s.jina.ai）**：搜索网络并返回搜索结果页的内容。
- **Embeddings**：多模态、多语言的嵌入模型，把文本和图片变成向量。
- **Reranker**：对检索结果重新排序，提高相关性。
- **MCP**：把 `mcp.jina.ai` 添加为 MCP 服务器，让大模型应用直接调用上述能力。
- 另有命令行工具、llms.txt 等面向开发者的资源。

## 怎么上手

1. 最快的体验：在浏览器地址栏里，把想读的网页地址接在 `https://r.jina.ai/` 后面打开，看返回的文本。
2. 在 jina.ai 注册获取 API Key，用于更高的调用频率和其他接口。
3. 做 RAG 时的常见组合：Reader 抓取网页 → Embeddings 生成向量并入库 → 检索后用 Reranker 重排 → 交给大模型回答。
4. 使用支持 MCP 的客户端时，直接添加官方的 MCP 服务器。

各接口的参数与模型名称以官方文档为准。

## 免费与付费

Jina AI 的接口按 token 计量。官网首页没有列出具体单价和免费额度，页面只显示当前账号的可用 token 数；请以官网的定价与速率限制说明为准。

## 适合谁 / 不适合谁

**适合：** 需要把网页内容喂给大模型的开发者（Reader 几乎零门槛）；做多语言检索、需要嵌入与重排模型的团队；想给智能体快速加上「读网页、搜网络」能力的人。

**不适合：** 不写代码、只想找一个 AI 搜索产品的普通用户；需要抓取登录后内容的场景；对数据处理地点有严格限制的企业（需确认部署方式）。

## 注意事项

- 通过 Reader 获取的网页内容仍受原网站的版权和使用条款约束。
- 网页文本属于不可信输入，交给智能体前要防范其中夹带的恶意指令。
- OCR 等选项的 token 消耗高出很多，批量调用前先算成本。
