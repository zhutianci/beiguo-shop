---
title: "新中式壁纸提示词：圆窗晨光里的古风女子竖版封面（清透明亮、留白写字）（gpt-image-2）"
slug: new-chinese-style-morning-wallpaper
model: gpt-image-2
topics: [wallpaper]
aspectRatio: "9:16"
needsRefImage: false
useCase: "生成一张清透明亮的新中式竖版封面 / 手机壁纸：奶白墙面、大圆格窗、窗外薄荷绿植物和杏色朝阳，古风女子侧身倚窗，左侧大面积留白配竖排小字和红印章，适合小红书封面、节气 / 早安推文和壁纸。"
prompt: |
  东方禅意极简封面海报，明亮的女性美学，新中式清晨感的高颜值封面。9:16 竖版，整体轻盈、清透、干净、明亮，有现代东方女性美学和小红书封面感。
  主体是一位成年的东方古风女子，[站在一扇巨大的圆形格窗旁]。人物位于画面右下区域，微微侧身，姿态放松、安静、柔和，带着刚醒来的清晨那种松弛和含蓄。五官精致，东方美感，简洁优雅的发髻点缀几朵小白花，发带轻轻垂下。
  服装是轻盈的古风长裙，配色是[浅白、淡杏粉、极浅薄荷绿渐变]；面料轻薄通透，不要过于华丽，没有复杂刺绣和沉重头饰。左手自然搭在窗台上，右手垂下拿着一小枝白花，手部结构自然、比例准确。
  场景是极简的白墙室内，奶白墙面作为高亮底色，画面左侧大面积留白，适合放标题。圆窗是最主要的视觉记忆点：窗外层层叠叠的薄荷绿和浅绿植物，柔和的晨雾空气层，隐约的远处庭院或山影，一轮杏橙色的圆形朝阳；晨光在窗外远处，不贴在墙上。树影投在墙面和地面上，增强清晨光感。
  光线明亮柔和的自然晨光，边缘和质感干净，可以有一点纸感，但不要浓重墨感、灰雾、旧纸颗粒和压暗。整体气质温柔、松弛、轻盈、清透、明亮、干净。
  如需版式感，可在左侧留白处加少量竖排中文，如"[晨光正好]"和一两行小字，配一枚小红印章，文字克制、不要多。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/liyue_ai/status/2096109254952497583
  author: "李岳"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文中文说明的英文写法改写为中文；人物姿态、服装配色、竖排文字改为变量"
images:
  - 3122-new-chinese-style-morning-wallpaper-1.jpg
imageCredit:
  by: "李岳"
  url: https://youmind.com/gpt-image-2-prompts?id=33506
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[站在一扇巨大的圆形格窗旁] 可以换成"坐在竹帘下的茶席边""倚在月洞门旁"；服装配色换成"月白与淡青""浅粉与象牙白"；竖排文字换成你的标题，如"[立夏]""[早安]""[慢下来]"。想要男性角色，改写人物段落即可，保持"清透明亮、大面积留白"的整体描述。

示例图是一张竖版封面：右侧穿浅白杏粉长裙、挽发髻插小白花的女子侧身倚在木质圆窗边，窗外是绿叶、远处的庭院和一轮杏色朝阳，墙上投着树影，左上方竖排"晨光正好"和几行小字、一枚红色小印章。

**常见问题**：
- 画面发灰、像旧画：保留"不要灰雾、旧纸颗粒、压暗"。
- 人物太大挤满画面：写"人物只占画面右下三分之一"。
- 竖排字错字：标题 2～4 字，小字最多 2 行。

**适合**：小红书封面、节气 / 早安推文、手机壁纸、新中式品牌海报。

### 原版提示词

```text
Oriental Zen minimalist cover poster, bright feminine aesthetic, new Chinese style morning feel high-value cover. 9:16 vertical composition, the overall image is light, clear, clean, and bright, with a modern Oriental feminine aesthetic and a Little Red Book (Xiaohongshu) cover feel.

The main subject is a young adult Oriental ancient style woman, {argument name="pose" default="standing by a giant circular lattice window"}. The person is located in the bottom right area of the frame, slightly turned, with a relaxed, quiet, and soft posture, carrying the ease and reserved temperament of having just woken up in the morning. The woman's features are delicate and refined, Oriental aesthetic, with a simple and elegant hair bun decorated with a few small white flowers and lightly drooping hair ribbons. The clothing is a light ancient style long dress with a {argument name="outfit colors" default="gradient of light white, pale apricot pink, and very pale mint green"}. The fabric is light and transparent, not overly gorgeous, without complex embroidery or heavy headpieces. The left hand naturally rests on the window sill, and the right hand hangs down holding a small sprig of white flowers. The hand structure is natural and accurate in proportion.

The scene is a minimalist white-walled indoor space with cream-white walls as the high-brightness base. Large areas of blank space are reserved on the left side of the frame, suitable for title layout. The circular window is the primary visual memory point. Outside the window, layers of mint green and light green plants are visible, along with a soft morning mist air layer, faint distant courtyards or mountain silhouettes, and an apricot-orange circular morning sun. The morning light is far outside the window, not stuck to the wall. Tree shadows are cast on the walls and floor, enhancing the morning light atmosphere.

The light is bright and soft natural morning light, with clean edges and textures, a slight paper feel is okay, no heavy ink feel, no grey fog, no old paper grain, no darkening. The overall temperament should be gentle, relaxed, light, clear, bright, and clean.

If a layout feel is needed, a small amount of vertical Chinese text can be added to the blank area on the left, such as: "{argument name="text" default="Morning light is just right / Window shadows of flowers / Grant yourself a slow period of time"}", accompanied by a small red seal, but the overall text must be restrained and not excessive.
```

> 改编自 [李岳](https://x.com/liyue_ai/status/2096109254952497583) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
