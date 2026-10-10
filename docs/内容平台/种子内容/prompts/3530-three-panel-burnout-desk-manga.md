---
title: "漫画提示词：三格竖版黑白漫画，同一机位从兴奋到累瘫的状态递进（gpt-image-2）"
slug: three-panel-burnout-desk-manga
model: gpt-image-2
topics: [comic]
aspectRatio: "2:3"
needsRefImage: false
useCase: "做\"一开始兴冲冲、后来累瘫\"这类吐槽梗图时用：三个上下排列的黑白漫画格，同一张书桌、同一个角度，人物姿势一格比一格垮，配两处旁白和几句竖排对白。"
prompt: |
  画一条三格竖排的黑白漫画，用同一个机位表现一个人从兴奋到累瘫的过程。
  整体：竖版 2:3，白底，三个等宽的横向长方格上下排开，粗黑边框，格与格之间留白；黑白日系漫画画风，干净的线稿加灰色网点。
  角色：[猫耳短发少女，穿简单的 T 恤]，三格里是同一个人。
  场景：三格都是同一张书桌，她坐在办公椅上，面前是一台背对观众的电脑显示器和一把键盘，桌角有几本书；机位基本不变，只有人物的姿势在变。
  三格内容：
  1. 上格：她一手托腮，眼睛发亮、兴奋地盯着屏幕，周围是星星闪光。右上角一个长方形旁白框，竖排写"[新 AI 发布的时候]"；左侧对白框："[哇啊啊！得赶紧试试！]"
  2. 中格：她趴在键盘上，一脸疲惫，但眼睛还盯着屏幕。右侧对白框："[这到底要持续到什么时候……]"；左侧小对白框："哇，好厉害——"
  3. 下格：彻底累瘫，脸平贴在键盘上，眼睛半闭，头顶冒出一小团叹气。右侧对白框："[好累……]"；左下角一个长方形旁白框："[大概还要五年吧]"
  文字：全部用简体中文，竖排，粗体手写漫画字，写在白色对白框或长方形旁白框里，清晰可读；每个框只写给定的这一句，除以上六处外不要其他文字。
  限制：严格三格；纯黑白加网点，不上色；不要水印和签名。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/kei31/status/2045407115603562824
  author: "@kei31"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文是 JSON，改写为分条的中文描述；角色设为变量；六处日文旁白 / 对白译成中文，其中五处设为变量（原文有两处文字本身被截断，已补成完整句子）；按示例图补充\"白底、三格等宽、桌角有书、机位不变\"等描述。"
images:
  - 3530-three-panel-burnout-desk-manga-1.jpg
imageCredit:
  by: "@kei31"
  url: https://youmind.com/gpt-image-2-prompts?id=14022
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[猫耳短发少女，穿简单的 T 恤] 换成你的角色或吉祥物；其余五处都是画面上的字——右上旁白写"什么时候"，三句对白写"一开始、中途、最后"的心声，左下旁白是收尾吐槽。例如"双十一开始的时候 / 冲！都加购物车！/ 怎么还没算完满减…… / 不买了…… / 大概明年还来"。每句别超过 12 个字。第二格左侧的"哇，好厉害——"是固定文案，可直接改。

示例图是日文版：白底上三个上下排列的黑框长格，黑白线稿加灰网点。第一格猫耳短发女孩托着腮、眼睛放光地看显示器，周围有星星；第二格她趴在键盘上，眼神发直；第三格整张脸贴在键盘上，头顶飘着一团叹气。每格左右各有一个竖排文字框，其中两处文字被截断、重复了半句。

**常见问题**：
- 文字被截断或重复：缩短句子，并保留"每个框只写给定的这一句"。
- 三格机位变了：强调"同一张桌子、同一角度，只有人物姿势变化"。
- 想要彩色：把"纯黑白加网点"改成"淡彩，只给头发和衣服上色"。

**适合**：社媒吐槽梗图、产品更新和节日热点的自嘲小漫画、公众号文章插图。

### 英文原版

```text
{
  "type": "3-panel vertical manga strip",
  "style": "monochrome anime style with screentones and clean line art",
  "character": "{argument name=\"character description\" default=\"anime girl with cat ears, short hair, wearing a simple t-shirt\"}",
  "setting": "sitting at a desk in front of a computer monitor and keyboard",
  "layout": {
    "panels": [
      {
        "position": "top",
        "action": "resting chin on hand, looking excitedly at the monitor with sparkle effects",
        "text_elements": [
          {
            "type": "rectangular text box",
            "position": "top right",
            "text": "{argument name=\"panel 1 context text\" default=\"新しいAIが発表される時\"}"
          },
          {
            "type": "speech bubble",
            "position": "left",
            "text": "うおおおお！使ってみなき"
          }
        ]
      },
      {
        "position": "middle",
        "action": "slumped over the keyboard, looking tired but still staring at the screen",
        "text_elements": [
          {
            "type": "speech bubble",
            "position": "right",
            "text": "{argument name=\"panel 2 speech text\" default=\"いつまで続くんだ続くんだこれ…\"}"
          },
          {
            "type": "speech bubble",
            "position": "left",
            "text": "うおおおすげー"
          }
        ]
      },
      {
        "position": "bottom",
        "action": "completely exhausted, resting head flat on the keyboard, eyes half-closed, sighing",
        "text_elements": [
          {
            "type": "speech bubble",
            "position": "right",
            "text": "{argument name=\"panel 3 speech text\" default=\"つかれた…\"}"
          },
          {
            "type": "rectangular text box",
            "position": "bottom left",
            "text": "たぶん5年くらい5年く"
          }
        ]
      }
    ]
  }
}
```

> 改编自 [@kei31](https://x.com/kei31/status/2045407115603562824) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
