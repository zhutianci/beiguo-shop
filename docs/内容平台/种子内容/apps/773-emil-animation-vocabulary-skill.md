---
title: "animation-vocabulary skill 是什么、怎么安装使用：说不出动效叫什么？让 AI 帮你把「那个弹一下的效果」对上术语"
slug: emil-animation-vocabulary-skill
name: animation-vocabulary（emilkowalski/skills）
url: https://github.com/emilkowalski/skills/tree/main/skills/animation-vocabulary
pricing: "开源免费（GitHub 标注 MIT）"
platforms: "Claude Code / Codex / Cursor 等支持 Agent Skills 的智能体"
trialNote: "npx skills@latest add emilkowalski/skills --skill animation-vocabulary"
products: [claude, cursor]
models: [any-llm]
topics: [agent-skills, coding, product-design]
excerpt: "animation-vocabulary 是 emilkowalski/skills 里的反查词典技能：你用大白话描述一个网页动效，它从十二类、九十多条术语的词表里找出准确叫法，相近的词会并列对比，找不到就明说是近似，方便你再去向 AI 或设计师提需求。"
checkedOn: 2026-10-11
sources:
  - https://github.com/emilkowalski/skills/tree/main/skills/animation-vocabulary
  - https://github.com/emilkowalski/skills
  - https://github.com/vercel-labs/skills
  - https://skills.sh/
---

> 本文根据 emilkowalski/skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 20.1 万次；所在仓库 emilkowalski/skills 在 GitHub 约 4.5 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

让 AI 做动效，卡住的往往不是技术，而是不知道那个效果叫什么：「点按钮后浮层像是从按钮里长出来的」「滚到头还能再拉一点然后弹回去」。说不出名字，就只能反复描述、反复返工。animation-vocabulary 是一本反查词典。`description`：把对网页动画或运动效果的含糊描述变成准确的术语（例如「浮层打开时弹一下的那个」对应 Pop in，「iOS 那种橡皮筋滚动」对应 Rubber-banding）；用户问「这个叫什么」，或描述了一个效果却不知道名字、想要一个能拿去向 AI 或设计师提需求的词时使用。它只负责命名，不负责设计和实现。

SKILL.md 给智能体定了五条做法：

1. 读意图而不是抓关键词——用户描述的是看到的和感觉到的，不是技术名；
2. 词表里的释义原样引用，不改写；
3. 相近的词要对比着讲，比如裁剪路径与遮罩、弹入与回弹、共享元素过渡与布局动画；
4. 没有完全对应的词时，给出最接近的并明说是近似，或者用词表里的词组合描述，例如「这是一组缩放进场加上依次错开」；
5. 只在这份词表内回答，确实没有就说没有，不编新词。

输出格式也是固定的：术语加一句释义；有多个可能时，最匹配的放前面，再列一两个备选并说明区别。

词表分十二类：进场与退场、编排与时序、移动与变换、状态之间的过渡、滚动相关、反馈与交互、缓动、弹簧动画、循环与环境动效、打磨与特效、性能、应当了解的原则。

## 怎么安装

仓库 README 的安装命令是 `npx skills@latest add emilkowalski/skills`（整库，安装时可在选择器里勾选）。只装这一个，按 skills CLI 文档加 `--skill` 参数：

```bash
npx skills@latest add emilkowalski/skills --skill animation-vocabulary
```

装好后技能进入所选智能体的技能目录，按 `description` 自动触发，也可以用 `/animation-vocabulary` 手动调用。

仓库整体介绍和其他安装方式，详见本站《emilkowalski/skills 是什么、怎么安装：Emil Kowalski 的界面动效与设计 Skills（让 AI 做的动画不再生硬）》。

## 怎么用

SKILL.md 自带的两个例子：

- 「浮层看起来是从你点的按钮里长出来，而不是从自己中间放大，这叫什么？」——答案是 Origin-aware animation（感知起点的动画）。
- 「一张图变成另一张图的那种效果」——首选 Morph（形变），并提示如果只是原地交叠淡入淡出，那叫 Crossfade。

问到名字之后，把术语直接写进给智能体的需求里，例如「卡片列表用 stagger 依次进场」，比描述半天更准。不带问题直接调用时，它只回一句就绪说明。

## 适合谁 / 局限

适合产品经理、设计师和不常写动效的开发者，在向 AI 或同事提需求前先把词找对；也适合学前端动效的人当术语表翻。局限：术语以英文为准，中文圈的叫法并不统一，沟通时最好中英文一起写；它只管叫什么，不解释怎么实现——实现可以交给同库的 `animate` 或 `emil-design-eng`；词表之外的冷门效果它会如实说没有。

## 注意事项

- **许可**：GitHub 标注为 MIT。
- **不带脚本、不联网**：一份一万三千多字符的说明加词表。
- 词表反映的是作者的归类方式，个别术语在不同团队里含义略有出入，以实际效果为准。
