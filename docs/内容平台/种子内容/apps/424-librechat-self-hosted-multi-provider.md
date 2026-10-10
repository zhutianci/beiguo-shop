---
title: "LibreChat 是什么、部署教程：聚合多家模型、支持多用户登录的开源自托管 AI 聊天平台"
slug: librechat-self-hosted-multi-provider
name: LibreChat
url: https://www.librechat.ai/
pricing: 开源免费（MIT）
platforms: Docker 自部署 / 浏览器访问
products: [ai-tools]
models: []
topics: [ai-agent, coding, office]
excerpt: "LibreChat 是 MIT 许可的开源自托管 AI 聊天平台，在一个界面里接入 Anthropic、OpenAI、Google、AWS Bedrock、Azure 和 Ollama 本地模型，带智能体、MCP、代码解释器、Artifacts 和多用户登录。"
checkedOn: 2026-10-11
sources:
  - https://github.com/danny-avila/LibreChat
  - https://www.librechat.ai/
---

> 本文根据 LibreChat 官方 GitHub 仓库 README 与官网整理，资料核对于 2026-10-11。开源项目变化快，以官方仓库为准。

## 是什么

LibreChat 是一个开源、自托管的 AI 聊天平台，仓库 danny-avila/LibreChat 约有 4.55 万星标，采用 MIT 许可。它的目标可以概括为：**把各家官方聊天应用里好用的功能，做成一个你自己部署、接自己密钥的统一版本**。

和 Open WebUI 相比，两者定位接近。LibreChat 的特点是对各大云厂商接口的支持很全，功能上紧跟官方应用（智能体、代码执行、可渲染的成品预览），并且有比较完整的多用户认证方案，适合给一个团队或公司内部使用。

## 能做什么

README 列出的主要功能：

- **多家模型**：Anthropic、AWS Bedrock、OpenAI、Azure OpenAI、Google、Vertex AI，以及 Ollama 等本地方案；
- **AI 智能体**：创建带指令和工具的智能体；
- **MCP 工具**：通过 Model Context Protocol 接入外部工具；
- **Code Interpreter**：在沙箱里运行多种编程语言的代码；
- **Artifacts**：在对话旁直接渲染 React 组件、HTML 页面和 Mermaid 图表；
- **多用户**：支持 OAuth2、LDAP 和邮箱登录。

## 怎么上手

1. 准备一台装好 Docker 的服务器或电脑，克隆仓库。
2. 复制环境变量示例文件并填写（各家模型的 API Key、登录方式等）。
3. 用仓库提供的 Docker Compose 文件启动：

```bash
docker compose up -d
```

4. 浏览器访问对应端口，注册账号后在界面顶部选择模型开始使用。
5. 不想自己管服务器的，README 也提供了 Railway、Zeabur、Sealos 的一键部署入口。

给团队使用时，建议先配置好登录方式（如公司的单点登录或限制邮箱域名），再把地址发给同事。

## 免费与付费

LibreChat 完全免费开源（MIT），可以商用和二次开发。实际花费是服务器，以及你填入的各家模型 API 的用量费。

## 适合谁 / 不适合谁

**适合：**
- 想给团队提供统一 AI 入口、集中管理密钥和账号的技术负责人；
- 公司的模型资源在 AWS Bedrock、Azure、Vertex AI 等云平台上的团队；
- 想在自托管环境里使用代码解释器、Artifacts 等进阶功能的人。

**不适合：**
- 不熟悉 Docker 和环境变量配置的个人用户，桌面客户端（Cherry Studio、Chatbox）更简单；
- 只使用本地模型、追求最简安装的人，Open WebUI 与 Ollama 的搭配更直接；
- 没有人维护服务器的团队。

## 注意事项

- **关闭公开注册**：对外可访问的实例如果允许任何人注册，你的 API 额度就可能被别人用掉。
- **API Key 写在环境变量里**，注意文件权限和备份的保管。
- **代码解释器的运行环境**：确认沙箱服务的部署方式与费用，以官方文档为准。
- **升级前读发布说明**：配置项时有调整，升级后对照新版示例文件检查。
