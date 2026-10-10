---
title: "Open WebUI 是什么、安装教程：给 Ollama 和各家 API 配一个自托管的中文聊天界面"
slug: open-webui-self-hosted-ai-chat
name: Open WebUI
url: https://openwebui.com/
pricing: 自部署免费 / 企业版联系销售
platforms: Docker / Python（pip）/ 浏览器访问
products: [ai-tools]
models: []
topics: [coding, ai-agent]
excerpt: "Open WebUI 是可自托管、能完全离线运行的 AI 聊天平台，支持 Ollama 和兼容 OpenAI 的接口，自带知识库检索、联网搜索、多用户权限和插件体系，一条 Docker 命令即可安装。"
checkedOn: 2026-10-11
sources:
  - https://github.com/open-webui/open-webui
  - https://docs.openwebui.com/
---

> 本文根据 Open WebUI 官方 GitHub 仓库 README 与官方文档整理，资料核对于 2026-10-11。开源项目变化快，以官方仓库为准。

## 是什么

Open WebUI 是一个自托管的 AI 平台，仓库 open-webui/open-webui 约有 15.4 万星标。README 称它可扩展、功能丰富，并且可以完全离线运行。通俗地说，它给你一个**长得像 ChatGPT 的网页界面**，后面接什么模型由你决定：本机用 Ollama 跑的开源模型，或者任何兼容 OpenAI 接口的云端服务，都可以混着用。

很多人装完 Ollama 之后只有一个命令行窗口，第二步通常就是装 Open WebUI——有了它，家里人或同事打开浏览器就能用同一套本地模型。

## 能做什么

- **多模型对话**：同时接入本地与云端模型，在对话里切换。
- **知识库检索（RAG）**：上传文档后在提问时引用，README 提到支持 9 种向量数据库。
- **联网搜索**：可配置多家搜索服务。
- **多用户与权限**：基于角色的访问控制和用户组，适合家庭、团队共用一台机器。
- **插件体系**：Filters、Actions、Pipes、Tools、Skills，以及 MCP 和 OpenAPI 工具服务器。
- **其他**：图像生成、语音和视频通话、笔记、频道、持久记忆。

## 怎么上手

**Docker 方式**（推荐）：

```bash
docker run -d -p 3000:8080 -v open-webui:/app/backend/data --name open-webui --restart always ghcr.io/open-webui/open-webui:main
```

浏览器打开 `http://localhost:3000`，第一个注册的账号会成为管理员。

**pip 方式**：

```bash
pip install open-webui
open-webui serve
```

访问 `http://localhost:8080`。进入后在管理设置里填 Ollama 地址，或添加兼容 OpenAI 的接口地址和密钥，模型列表就会出现。界面语言可以在设置里切换为简体中文。

## 免费与付费

自行部署免费。官方另有 Enterprise 企业方案，需联系销售，价格以官网为准。模型的费用取决于你接的是本地模型（只花电费和硬件）还是云端 API（按各家计费）。

## 适合谁 / 不适合谁

**适合：**
- 已经在用 Ollama、想要图形界面的个人用户；
- 想给家庭或小团队搭一个共用 AI 入口、统一管理密钥和权限的人；
- 需要数据不出内网的小型组织。

**不适合：**
- 不想接触 Docker 或命令行的用户，可以看 Cherry Studio、Chatbox、LM Studio 这类桌面软件；
- 只有一个人、只用云端 API 的轻度用户，桌面客户端更省事；
- 需要原厂应用里特有功能（如官方的深度研究、语音模式）的人。

## 注意事项

- **许可证带品牌条款**：当前代码采用 Open WebUI License，要求保留「Open WebUI」品牌标识；早期贡献保留各自原有许可，详见仓库的 LICENSE_HISTORY。想改名换标再分发，需要先确认许可范围。
- **不要裸奔在公网**：对外开放时务必启用登录、HTTPS，并关闭自由注册。
- **数据卷要备份**：对话、用户和知识库都在 `open-webui` 数据卷里，升级镜像前先备份。
- **插件会执行代码**：只安装可信来源的 Tools 和 Functions。
