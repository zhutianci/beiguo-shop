---
title: seedance 提示词：监控视角灵异短片（固定机位 · 电梯门缝渗出的影子）
slug: seedance-cctv-hallway-shadow
model: seedance
topics: [short-drama, cinematic]
modelLabel: Seedance 2.0
aspectRatio: "16:9"
needsRefImage: false
useCase: 生成一段以假乱真的"公寓走廊监控录像"：男人进电梯后，一道没有主人的影子从电梯门缝里爬出来。适合做悬疑 / 灵异账号的短片、伪纪录片开头，也是练习"固定机位 + 时间轴"写法的好样例。
prompt: |
  生成一段约[30]秒的写实公寓楼监控录像，夜晚，16:9。
  重要：全程只有一个固定机位的连续镜头，摄像机不移动、不变焦、不换角度。
  画面风格：吸顶式监控摄像头拍摄，轻微鱼眼畸变，低照度噪点，轻微压缩痕迹，平淡的日光灯照明，角落有一个小小的时间戳。不要电影感运镜，不要夸张调色，不要恐怖片特效。
  走廊正中是一部电梯，两扇金属滑门清晰可见。
  0–7 秒：走廊空无一人，一切正常。一个[穿深色外套的男人]从走廊远端走进画面，随意地走向正中的电梯，地面上清楚地看到他自己的影子跟在脚下。
  7–12 秒：他走到电梯前，电梯门明显地打开；他走进门里，站在轿厢中，全身可见；随后电梯门完全关上。
  12–16 秒：走廊空了，电梯门紧闭，什么也没有发生。
  16–20 秒：异常开始。一个人形的黑影从紧闭的电梯门缝底下慢慢渗出来，走廊里没有任何人能投下这个影子。
  20–25 秒：黑影像一个正在走路的人的影子，沿着地面一点点离开电梯，越走越远；电梯门始终关着，环境没有任何变化。
  25–30 秒：黑影走到走廊中间，突然停住。画面停留在空荡的走廊和地上那道不可能存在的影子上，然后猛地切黑。
  硬性要求：男人必须从打开的电梯门走进去，不能走进墙里；电梯始终在画面正中、位置不变；黑影出现时电梯门保持关闭；画面里不出现第二个人。
  声音：日光灯的电流嗡嗡声、皮鞋脚步声、电梯到达的提示音；黑影出现后只剩低沉的环境底噪。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-seedance-2-prompts
  url: https://x.com/mehvishs25/status/2103492588095304088
  author: "@mehvishs25"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 英文原文译为中文并合并重复的"绝对优先级"条款为一段硬性要求；时长、人物改为变量；新增声音描述
images:
  - 533-seedance-cctv-hallway-shadow-1.jpg
imageCredit:
  by: "@mehvishs25"
  url: https://x.com/mehvishs25/status/2103492588095304088
  license: CC BY 4.0
verify:
  - 原作写的是 30 秒；在即梦 / 火山方舟实测单条能否生成这么长（以官方说明为准），不能就按下文拆成两条
  - 男人是否会"穿墙"进电梯、黑影是否被渲染成第二个人
  - 仓库收录的英文原文在第 6 条优先级处被截断，原帖全文待核对
  - 示例图是原帖视频封面（X 视频缩略图），站长实测后可替换
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**时长与镜头**：监控视角的可信度全靠"什么都不动"：固定机位、平光、噪点、时间戳。单条时长不够 30 秒时，拆成两条：第一条 0–15 秒（人进电梯、门关上），第二条用第一条的最后一帧作首帧，接着生成影子渗出到切黑；两条都保留"固定机位"那一句。

**怎么填变量**：[穿深色外套的男人] 可以换成"[拎外卖袋的女人]""[牵狗的老人]"；把电梯换成"[楼梯间的防火门]""[地下车库的车]"，影子从门底下 / 车底下出来，就是同一套路的新故事。

**常见失败与调整**：
- 模型自作主张加运镜或调色：把"不要电影感运镜"挪到第一句后面，并加"像真实物业监控截取的片段"。
- 黑影变成实体人：写"只有地面上的影子，没有任何立体的人形"。
- 人走进墙里：保留硬性要求那句，并把电梯写成"画面正中、占画面三分之一宽"。

> 改编自 [@mehvishs25](https://x.com/mehvishs25/status/2103492588095304088) 发布、[YouMind-OpenLab/awesome-seedance-2-prompts](https://github.com/YouMind-OpenLab/awesome-seedance-2-prompts) 收录的提示词，许可证 CC BY 4.0。

### 英文原版

仓库收录版本在结尾处被截断，以下为收录内容（中间时间轴有删节）：

```
Create a 30-second realistic fixed security-camera recording inside an ordinary apartment building hallway at night.

IMPORTANT: This is a SINGLE CONTINUOUS STATIC CAMERA SHOT. The camera never moves, never zooms, and never changes angle.

The hallway has an elevator clearly visible at the CENTER of the frame. The elevator has two clearly visible sliding doors. The man must walk directly toward the elevator doors, stop in front of them, enter the elevator through the open doors, and then the elevator doors must close.

Do NOT let the man walk into a wall. Do NOT change the hallway layout. Do NOT move the elevator. Do NOT introduce any other person.

VISUAL STYLE:
Authentic low-quality apartment CCTV footage. Fixed ceiling-mounted security camera. Wide 16:9 frame. Slight fisheye distortion. Low-light digital noise. Mild compression artifacts. Flat fluorescent hallway lighting. Small timestamp in the corner. No cinematic camera movement. No dramatic color grading. No horror-film effects.

TIMELINE:
0–7 seconds: The hallway is completely ordinary and empty. A man enters the frame from the far end and casually walks toward the elevator in the CENTER of the hallway. His normal human shadow is clearly visible on the floor beneath and behind him.
7–12 seconds: The man reaches the elevator. The elevator doors OPEN clearly. The man walks through the OPEN elevator doorway and stands INSIDE the elevator. He is completely visible inside the elevator. The elevator doors then CLOSE completely.
12–16 seconds: The hallway is empty. ... Nothing happens for a few seconds.
16–20 seconds: A subtle anomaly begins. A dark human-shaped shadow slowly appears from underneath the CLOSED elevator doors. There is NO PERSON outside creating this shadow. ...
20–25 seconds: The detached shadow continues moving away from the elevator across the floor. It moves like the shadow of a person walking, even though there is NO PERSON anywhere in the hallway. ...
25–30 seconds: The detached shadow reaches the middle of the hallway. It suddenly stops. Hold on the empty hallway with the impossible shadow visible on the floor. Then abruptly CUT TO BLACK.

ABSOLUTE PRIORITIES:
1. The man MUST enter the elevator, not the wall.
2. The elevator must be clearly visible and centered.
3. The elevator doors must visibly OPEN before he enters.
4. The man must be completely INSIDE the elevator before the doors close.
5. The elevator doors must remain CLOSED while the detached shadow emerges.
6. The detached
```
