---
title: "漫画提示词：脑内小剧场，四个 Q 版分身站在头顶为一个烦恼吵架（Nano Banana）"
slug: inner-debate-four-chibi-on-head
model: nano-banana
topics: [comic, character]
modelLabel: Nano Banana Pro
aspectRatio: "2:3"
needsRefImage: false
useCase: "把\"内心纠结\"画成一张图：只填角色外形和一句烦恼，模型自动给理性、我行我素、悲观、乐观四个 Q 版分身各编一句台词，让它们排在主角头顶七嘴八舌，下面是主角托腮发愁的大特写。"
prompt: |
  按下面的设定直接生成一张图，不要输出中间思考和文字脚本。
  角色设定：[棕色双马尾，红眼睛，黑斗篷配白衬衫]
  主角的烦恼：[好想吃一大堆甜甜圈]
  第一步，在心里定好五句台词，不要写出来：
  - 主角：把上面的烦恼当作内心独白说出来；
  - 乐观小人：对这个烦恼开朗地说"太棒了！"，并给出支持和鼓励；
  - 悲观小人：把这件事往最坏处想，说"完了……"，一脸绝望；
  - 我行我素小人：说一句和烦恼完全无关的话，比如今晚吃什么、好困、自己的爱好；
  - 理性小人：在心里抛一次硬币，随机决定站"赞成"（给出理性的解决办法）还是"反对"（指出风险）。
  第二步，按以下要求画图：
  - 画幅 2:3 竖版；日系漫画 / 动画画风，高品质。
  - 画面下方三分之一：主角脸部的大特写，表情严肃，手抵着下巴或嘴边在思考，视线朝下；旁边一个大的横向内心独白气泡。
  - 画面上方三分之二：主角头顶上方站着 4 个和主角长得一样的 Q 版迷你小人，沿着头顶的轮廓横向排成一排；小人离头很近，脚被主角的头或头发挡住。
  - 4 个小人从左到右：理性小人一脸认真，扶眼镜或伸手指点；我行我素小人一脸放空，打哈欠或喝茶；悲观小人脸色发青，抱头绝望，头顶有竖线效果；乐观小人满面笑容，高举双手，旁边有音符。
  - 每个角色各配一个漫画对白气泡，台词用简体中文，竖排。
  禁止：不要在小人的下方或周围写名字和角色类型，如"理性""乐观"；除对白气泡外，画面任何地方都不出现文字。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-nano-banana-pro-prompts
  url: https://x.com/schnapoon/status/2004065318465831259
  author: "@schnapoon"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "日文原文（库内为英文转述）改写为中文；保留\"先在内部定台词、再出图\"的两步结构；角色设定和烦恼设为变量；重复强调的\"横向一排\"\"脚被头发挡住\"各合并为一处；补充\"台词用简体中文、竖排\"。"
images:
  - 3536-inner-debate-four-chibi-on-head-1.jpg
imageCredit:
  by: "@schnapoon"
  url: https://youmind.com/nano-banana-pro-prompts?id=3511
  license: CC BY 4.0
verify:
  - "上线前在 Nano Banana 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[棕色双马尾，红眼睛，黑斗篷配白衬衫] 写角色外形，发型、眼睛、服装各一小句；也可以上传角色图并改成"参考图里的角色"。[好想吃一大堆甜甜圈] 写一句日常的小纠结，如"要不要辞职去旅行""今晚要不要熬夜追剧"。五句台词由模型自己编，想指定就把第一步里对应那行换成写好的句子。

示例图是日文版：下方是棕色双马尾、红眼睛、露着小虎牙的少女的大特写，披黑斗篷、系红色领结，手抵着下巴，左边一个大气泡写着想吃甜甜圈的独白；头顶站着四个穿同款斗篷的 Q 版小人——扶眼镜的、打哈欠的、全身发青抱头的、举着双拳飘着音符的，各有一个竖排对白气泡。背景是黄绿到蓝紫的渐变。小人的脚是完整画出来的，没有被头发挡住。

**常见问题**：
- 小人旁边多了"理性""乐观"之类的标签：把"禁止"那一段挪到提示词最前面。
- 四个小人长得不像主角：补一句"四个小人与主角同发型、同服装，只是表情不同"。

**适合**：个人 IP 和虚拟形象的日常梗图、社媒互动帖（让读者选站哪个小人）、文章里表现"内心纠结"的配图。

### 日文原版

```text
# User Input (Rewrite and submit this)
【Character Settings】
{argument name="character settings" default="Brown hair, twin tails, red eyes, fangs, black cloak, white shirt"}

【Main Character's Worry】
*   Content: {argument name="worry" default="I want to eat lots of donuts"}

# Command
You are an image generation engine. Follow the steps below to generate one image based on the user's input.
**Do not output intermediate thoughts or script text. Generate the image immediately.**
# Process (Internal Processing)
1. **Automatic Dialogue Determination**:
*   **Main Character**: Monologues the 【Worry】 input by the user.
*   **Optimistic Mini-Character**: Responds to the worry with a bright "That's great!" and offers support/encouragement.
*   **Pessimistic Mini-Character**: Anticipates the worst-case scenario for the worry, saying "No good..." and despairs.
*   **My-Pace Mini-Character**: **【IMPORTANT】Talks about something completely unrelated to the worry (e.g., tonight's dinner, sleepiness, hobbies).**
*   **Logical Mini-Character**: **【IMPORTANT】Performs a coin toss and randomly decides to speak either "For" (presenting a rational solution) or "Against" (pointing out risks).**

2. **Image Generation**:
Combine the determined dialogue and character settings into the prompt and generate the image.
### Image Generation Prompt Requirements
*   **Aspect Ratio**: 2:3
*   **Style**: Japanese comic/anime style, high quality.
*   **Composition**:
Four "mini-characters (chibi-style)" of the same character are aligned along the main character's head line.
【IMPORTANT】The four mini-characters are lined up "in a horizontal row."
【IMPORTANT】The feet of the mini-characters are hidden (overlapping) by the main character's head or hair.
*   **【IMPORTANT: Prohibitions】**:
*   **Absolutely do not write names or roles (e.g., "Logical," "Optimistic") below or around the characters.**
*   **The only place text is allowed is inside the "speech bubbles."**
*   Bottom 1/3 of the screen: Extreme close-up of the main character's face. Serious expression. Thinking, hand on chin or mouth, gaze downward. A large horizontal thought bubble.
*   Top 2/3 of the screen: Four mini-characters are lined up "in a horizontal row" right behind the main character's head.
*   **Important**: The mini-characters are close enough that their feet are hidden by the main character's head or hair.
*   **Mini-Character Arrangement and Pose**:
From left to right:
1. Logical: Serious face, adjusting glasses, or pointing with a finger.
2. My-Pace: Blank face, yawning, or drinking tea.
3. Pessimistic: Pale face, holding head in despair, vertical line effect.
4. Optimistic: Full smile, hands raised in joy, music note mark.
*   **Speech Bubbles**: Add comic-style speech bubbles to each character.
```

> 改编自 [@schnapoon](https://x.com/schnapoon/status/2004065318465831259) 发布、[YouMind-OpenLab/awesome-nano-banana-pro-prompts](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
