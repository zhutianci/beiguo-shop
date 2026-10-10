---
title: "Whisper 语音识别模型是什么、怎么用：OpenAI 开源模型的本地安装、模型大小与显存要求"
slug: openai-whisper-speech-recognition
name: Whisper（OpenAI 开源语音识别）
url: https://github.com/openai/whisper
pricing: 开源免费（MIT）
platforms: Python / 命令行（Windows / macOS / Linux）
products: [ai-tools]
models: []
topics: [coding, video-script, language-learning]
excerpt: "Whisper 是 OpenAI 以 MIT 许可开源的通用语音识别模型，支持多语言转写、语音翻译和语种识别，提供 tiny 到 large 以及 turbo 多种大小，可用一条 pip 命令安装后在本机离线转写音频。"
checkedOn: 2026-10-11
sources:
  - https://github.com/openai/whisper
---

> 本文根据 OpenAI 官方 GitHub 仓库 openai/whisper 的 README 整理，资料核对于 2026-10-11。开源项目变化快，以官方仓库为准。

## 是什么

Whisper 是 OpenAI 开源的通用语音识别模型，仓库 openai/whisper 约有 11 万星标，代码和模型权重以 MIT 许可发布。它能做三件事：**多语言语音转文字、把其他语言的语音翻译成英文、识别音频是哪种语言**。

它的意义在于，把接近商用水准的语音识别变成了任何人都能在自己电脑上免费运行的东西。现在市面上很多字幕工具、会议记录软件、桌面转写应用，底层用的就是 Whisper 或它的加速版本。

## 模型怎么选

README 给出的模型规格：

| 模型 | 参数量 | 大约需要的显存 |
| --- | --- | --- |
| tiny | 3,900 万 | 1 GB |
| base | 7,400 万 | 1 GB |
| small | 2.44 亿 | 2 GB |
| medium | 7.69 亿 | 5 GB |
| large | 15.5 亿 | 10 GB |
| turbo | 8.09 亿 | 6 GB |

简单原则：模型越大越准、越慢。转写中文建议从 medium 或 turbo 起步；turbo 是 large 的加速优化版本，速度快很多，但 README 说明它不适合用于翻译任务。没有显卡也能用 CPU 跑，只是比较慢。

## 怎么上手

先安装 Python 和 ffmpeg，然后：

```bash
pip install -U openai-whisper
whisper 录音.mp3 --model turbo
```

运行后会在当前目录生成文本和带时间轴的字幕文件。常用参数：

- `--language Chinese`：指定语言，省掉自动检测，也能减少误判；
- `--task translate`：把非英语语音直接翻译成英文文本；
- `--model medium`：更换模型大小。

不想碰命令行的话，可以用基于 Whisper 的图形界面软件，例如开源的 Buzz。

## 免费与付费

开源版完全免费，在本机运行不产生调用费。OpenAI 另有按时长计费的语音转写 API，那是独立的云服务，价格以 OpenAI 官方定价为准；本文介绍的是本地运行的开源模型。

## 适合谁 / 不适合谁

**适合：**
- 需要给视频加字幕、整理访谈和课程录音的创作者与学生；
- 录音内容敏感、不想上传到云端的用户；
- 要在自己的产品里集成离线语音识别的开发者。

**不适合：**
- 需要实时同声字幕的场景——原版 Whisper 面向的是录音文件的离线转写；
- 需要自动区分说话人的会议记录，原版不带这个功能；
- 完全不想安装环境的用户，在线转写服务或成品软件更省事。

## 注意事项

- **会出现「幻听」**：在静音、音乐或噪音段落，模型可能生成原音频里没有的句子，重要内容要对照录音校对。
- **不同语言的准确率差别很大**，README 说明性能因语言而异；方言、口音重、多人同时说话时错误率明显上升。
- **专有名词容易错**：人名、术语可以用初始提示参数给模型一些上下文。
- **录音要合法合规**：转写前确认已获得被录音者的同意。
