---
title: "海报提示词：大留白 + 手写大字压图的仪式感邀请函视觉（早安图 / 纪念日 / 活动邀请）（gpt-image-2）"
slug: handwritten-title-over-photo-invitation-visual
model: gpt-image-2
topics: [poster, photography]
aspectRatio: "7:6"
needsRefImage: false
useCase: "做一张清新克制、像私人请柬一样的主视觉：大面积留白，中间一张只拍细节动作的特写照片，超大的手写标题压在照片上沿，两侧和底部是极少量的细小信息。适合早安图、纪念日卡片、活动邀请。"
prompt: |
  围绕[早安 · 上海 · 9月1日 · 多云]生成一张清新克制、有仪式感的邀请函式主视觉，横版，接近 7:6。
  - 版面：以大面积明亮干净的留白为主场；正中放一张清晰的特写照片，只呈现最有情绪的细节和动作关系（例如[一家人早餐桌上盛粥、夹小笼包的手]），不拍正脸，让人先读到亲密、期待或值得纪念的瞬间，再去看信息；
  - 主标题："[早安]"，用[松弛、带速度感的手写毛笔字]，字号明显放大，横跨照片上沿并与照片轻微重叠，形成"文字压在画面上"的第一视觉；标题不必排得整齐，要有真实书写的起伏、连笔、粗细变化和半透明叠压；标题下方配一行很小的英文"GOOD MORNING"；
  - 辅助信息：照片左右两侧各放一列极小的竖排文字，贴近留白边界用于平衡；底部用稳定的细字排成一行"城市 | 日期 | 天气"，再下面是一句短短的话"[一家人的早晨，是一天最温柔的开场。]"，中间用一条极细的短线作停顿；
  - 配色：从主题自身的素材和情绪里取色，保持[日韩系清新配色]，点缀色只服务于标题和关键信息；
  - 整体像一张设计过的私人请柬：照片细节与手写大标题叠压的张力、稀疏的信息节奏、干净通透的空气感。不加 Logo 和水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/xiaoxiaodong01/status/2094581093597168121
  author: "@xiaoxiaodong01"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文为中文思路的英文转写，改写为通顺中文并拆成要点；主题信息、手写字风格、配色设为变量；删去\"@CreateImage\"指令；按示例图补充了照片只拍手部与餐桌细节、底部\"城市 | 日期 | 天气\"三段信息的版式"
images:
  - 3410-handwritten-title-over-photo-invitation-visual-1.jpg
  - 3410-handwritten-title-over-photo-invitation-visual-2.jpg
imageCredit:
  by: "@xiaoxiaodong01"
  url: https://youmind.com/gpt-image-2-prompts?id=33126
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：第一处写主题信息，按"问候语 · 城市 · 日期 · 天气"的格式填；照片内容写一个"只拍手和物"的生活细节，如"两只手一起切生日蛋糕""给新人递戒指盒的手"；主标题换成"生日快乐""周年快乐""诚邀"等 2～4 个字；[日韩系清新配色] 可换成"莫兰迪灰粉""薄荷绿与奶白"。底部短句换成你想说的一句话，20 字以内。

示例图第一张是中文版：白底上淡青色的毛笔大字"早安"压在照片上沿，照片里是青花瓷碗、小笼包和两双正在盛粥、夹菜的手，窗边立着一幅城市天际线的小画；底部一行"上海 | 2026-09-01 | 多云 29℃"和一句短文案。第二张是日文版：粉色手写"おはよう"压着一张装便当的手部特写，两侧是竖排小字，可以看出同一套版式换语言、换配色的效果。

**常见问题**：
- 手写标题没有压到照片上：强调"标题下半部分与照片上沿重叠约三分之一"。
- 两侧竖排小字是乱码：直接写明要放的 4～6 个字，或删掉这一项。
- 照片拍成了人物正脸：加"画面里只出现手和桌面，不出现完整的脸"。

**适合**：早安 / 晚安图、纪念日卡片、小型活动与家宴邀请、公众号节日头图。

### 原版提示词

```text
@CreateImage
Generate a fresh and restrained ceremonial invitation visual around {argument name="theme" default="Good morning + Greeting + GOOD MORNING + City + Quote + Weather + 2026-09-01"}: The screen uses large areas of bright and clean white space as the main field. A crisp close-up image area is placed in the center, where the subject presents only the most emotional details and action relationships, allowing the viewer to read intimate, promising, or commemorative moments before the information. The main title uses {argument name="typography" default="relaxed and speedy handwritten strokes"}, with the font significantly enlarged, spanning across the upper edge of the image area and slightly overlapping, creating the first visual memory of text pressing onto the image. The title doesn't need to be neatly arranged; it should have the fluctuations, ligatures, thickness changes, and transparent overlays of real writing. A very small amount of fine information text can be placed on both sides, vertically close to the white boundaries for balance. Bottom information is arranged in stable fine print or small handwriting, with an extremely thin short line in the center for a pause. Colors are extracted from the theme's own materials and mood, keeping a {argument name="color scheme" default="Japanese and Korean style fresh color palette"} with large areas of white space to make the whole bright, light, clear, and quiet. Accent colors serve the emotional role of the title and key information. The overall finish should look like a designed private invitation, emphasizing the tension of the overlap between the image detail and the large handwritten title, sparse information rhythm, clean airiness, and a sense of ritual in the white space.
```

> 改编自 [@xiaoxiaodong01](https://x.com/xiaoxiaodong01/status/2094581093597168121) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
