---
title: "NextChat（ChatGPT-Next-Web）是什么、怎么部署：一键搭建自己的 AI 聊天网页，全平台客户端"
slug: nextchat-chatgpt-next-web
name: NextChat
url: https://github.com/ChatGPTNextWeb/NextChat
pricing: 开源免费（MIT）
platforms: 网页（PWA）/ Windows / macOS / Linux / iOS / 安卓
products: [ai-tools]
models: []
topics: [coding, office]
excerpt: "NextChat 即原来的 ChatGPT-Next-Web，是 MIT 许可的开源 AI 聊天客户端，主打零配置：填入自己的 API Key 就能用 GPT、Claude、Gemini、DeepSeek 等模型，可一键部署到 Vercel 或用 Docker 自托管。"
checkedOn: 2026-10-11
sources:
  - https://github.com/ChatGPTNextWeb/NextChat
---

> 本文根据 NextChat 官方 GitHub 仓库 README 整理，资料核对于 2026-10-11。开源项目变化快，以官方仓库为准。

## 是什么

NextChat 就是很多人熟悉的 ChatGPT-Next-Web——仓库现在位于 ChatGPTNextWeb/NextChat，约有 8.88 万星标、5.89 万次复刻（fork），采用 MIT 许可。README 把它称为「零配置的 AI 聊天助手」。

它流行起来的原因是**部署门槛极低**：不需要服务器，点一下按钮就能把一个属于自己的聊天网页部署到 Vercel 上，填入 API Key 即可使用。极高的复刻数也说明了这一点——大量用户都是这样拥有了自己的第一个 AI 聊天页面。

## 能做什么

- **多模型**：README 列出支持 GPT、Claude、Gemini、DeepSeek 等；
- **全平台**：网页（可作为 PWA 安装到桌面或手机主屏）、Windows / macOS / Linux 桌面版，以及 iOS 和安卓；
- **排版渲染**：Markdown、LaTeX 公式、Mermaid 图表；
- **体验细节**：流式输出、深色模式、多语言界面；
- **预设与面具**：把常用的角色设定和提示词保存起来复用。

对话数据默认保存在浏览器本地，不经过第三方服务器（除了你所调用的模型接口）。

## 怎么上手

**方式一：一键部署到 Vercel**

1. 准备一个模型服务的 API Key。
2. 在仓库 README 里点击 Vercel 部署按钮，按提示登录并创建项目。
3. 填写环境变量：`OPENAI_API_KEY`（README 标注为必填）；`CODE`（选填，访问密码，可用英文逗号分隔设置多个）。
4. 部署完成后访问分配的网址，输入访问密码开始使用。

**方式二：Docker 自托管**，按 README 的 `docker run` 示例传入同样的环境变量。

**方式三：只用客户端**，直接下载桌面版，在设置里填自己的 API Key 和接口地址。

## 免费与付费

项目本身免费开源。部署到 Vercel 可以使用其免费额度（以 Vercel 的规则为准），模型调用费由你使用的模型服务商收取。

## 适合谁 / 不适合谁

**适合：**
- 想要一个轻量、好看、可以随手分享给家人朋友的 AI 聊天页面的人；
- 已经有 API Key、只需要一个简洁界面的用户；
- 想学习如何部署一个前端项目的新手。

**不适合：**
- 需要知识库、多用户权限、智能体等更重功能的团队，可以看 Open WebUI、LibreChat、LobeHub；
- 不知道 API Key 是什么、也不想了解的用户；
- 需要长期稳定的官方支持的企业场景。

## 注意事项

- **一定要设置访问密码**：不设 `CODE` 就公开部署，等于把你的 API 额度送给所有知道网址的人。
- **不要使用来历不明的「免费密钥」或第三方接口地址**，有泄露对话内容和被盗刷的风险。
- **及时同步上游更新**：一键部署的项目不会自动更新，旧版本可能存在已修复的安全问题，README 有开启自动同步的说明。
- **维护节奏**：核对时仓库页面未显示最近一次提交的时间，使用前自行查看近期更新是否活跃。
