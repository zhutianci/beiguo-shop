---
title: "ai头像生成提示词：挠头傻笑的兽人狐狸少年动漫贴纸（街头风穿搭）（gpt-image-2）"
slug: sheepish-fox-boy-anime-sticker
model: gpt-image-2
topics: [sticker, character, illustration]
aspectRatio: "1:1"
needsRefImage: false
useCase: "给原创兽人 / 动物拟人角色做头像或表情贴图时用：白底半身像，狐狸少年闭眼傻笑、挠着后脑勺冒汗，穿黑外套配亮蓝兜帽的街头风穿搭，线条干净、赛璐璐上色。"
prompt: |
  画一张 1:1 的动漫风贴纸插画，干净的纯白背景，画面里只有一个开朗的[兽人狐狸少年]。
  - 外形：[橙色毛发，嘴周和脸颊是奶油色]，大大的竖耳，金橙色的刺猬头，毛茸茸的少年脸；
  - 表情：[不好意思地哈哈笑]——眼睛闭成月牙，张嘴笑时露出一颗小虎牙，上半张脸有一条蓝紫色的阴影红晕，脸上恰好 5 滴汗珠；
  - 姿势：腰部以上、居中；左手绕到脑后不好意思地挠头，右手握拳放在胸前；头部周围恰好 4 个弯弯的情绪小符号，左右各 2 个；
  - 服装：黑色短袖外套，[亮青蓝色]的兜帽和拉链边；双肩有带银色扣件的黑色背包带；白色 T 恤上印着[简笔黑色涂鸦兔子脸]；黑色露指手套带银色金属护指板，两只手腕到前臂缠着白色绷带；
  - 画风：日系动漫的赛璐璐上色，勾线利落，头发和耳尖带亮亮的高光；暖橙、奶油色的毛配一抹鲜亮的青蓝，整体是表情生动、讨人喜欢的兽人吉祥物感觉；
  - 除了这个角色，白底上什么都不要：没有字、没有水印、没有第二个角色，也没有场景。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/xugino_cn/status/2071501552662257973
  author: "@xugino_cn"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并拆成要点；角色种族、毛色、表情、兜帽颜色、T 恤图案改为变量；删去原文末尾重复列举的可定制项"
images:
  - 3451-sheepish-fox-boy-anime-sticker-1.jpg
imageCredit:
  by: "@xugino_cn"
  url: https://youmind.com/gpt-image-2-prompts?id=27225
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[兽人狐狸少年] 和毛色一起换，如"兽人灰狼少年 + 银灰毛、白色嘴周""兽人柴犬少女 + 黄白毛""兽人雪豹 + 白底黑斑"；[不好意思地哈哈笑] 是表情，可换成"得意地坏笑""委屈巴巴""惊讶张嘴"，同时把后面的汗珠、挠头动作改成相配的；[亮青蓝色] 是全图唯一的亮色点缀，换成"荧光绿""玫红"气质会完全不同；[简笔黑色涂鸦兔子脸] 换成你自己的图案描述即可。

示例图是白底上的橙色狐狸少年半身像：闭着眼咧嘴笑、露出一颗小尖牙，额头到鼻梁一片蓝紫色的窘迫阴影，脸上挂着几滴汗；一只戴露指手套、缠着绷带的手挠着后脑勺，另一只握拳在胸前；黑外套配亮蓝色兜帽，白 T 恤上是一个黑色涂鸦兔子头，头两侧各有两个小弧线符号。

**常见问题**：
- 手套、绷带、背包扣画乱：细节太多时删掉背包带或金属护指板，保留两三个标志性配件。
- 角色变成四足动物：强调"拟人、直立、人类体型的兽人角色"。

**适合**：原创兽人角色头像、社群表情贴图、角色卡立绘；T 恤图案请用自己的原创涂鸦，不要写成已有的卡通形象。

### 英文原版

```text
Create a square 1:1 anime-style sticker illustration on a clean white background, featuring a single cheerful anthropomorphic fox boy with orange fur and cream muzzle/cheeks, large upright fox ears, spiky golden-orange hair, and a fluffy youthful face. He is laughing with closed crescent eyes, an open smiling mouth with one small fang visible, and a slightly embarrassed expression shown by a bluish-purple shaded blush band across the upper face and exactly 5 visible sweat drops on the face. Pose him from the waist up, centered, with his left hand behind his head in a sheepish scratch and his right fist held near his chest. Add exactly 4 small curved motion/emotion marks around the head, 2 on the left and 2 on the right. Outfit: black short-sleeve jacket with a bright cyan-blue hood and zipper trim, black backpack straps with silver buckles over both shoulders, white T-shirt with a simple black doodle bunny face graphic, black fingerless gloves with metallic silver knuckle plates, and white bandage wraps on both wrists/forearms. Use crisp clean line art, cel-shaded anime rendering, glossy highlights on hair and ears, warm orange and cream fur tones, vivid cyan accents, and a cute expressive mascot/furry character style. Keep the background plain white with no text, no watermark, no extra characters, and no scenery. The character can be customized as {argument name="character species" default="anthropomorphic fox boy"}, {argument name="fur color" default="orange with cream muzzle and cheeks"}, {argument name="hood color" default="bright cyan blue"}, {argument name="shirt graphic" default="simple black doodle bunny face"}, and {argument name="expression" default="embarrassed laughing smile"}.
```

> 改编自 [@xugino_cn](https://x.com/xugino_cn/status/2071501552662257973) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
