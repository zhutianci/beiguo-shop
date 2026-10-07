---
title: "表情包提示词：Q 版猫耳少女 + 企鹅搭档 9 格聊天表情包（带手写问候语）（gpt-image-2）"
slug: chibi-girl-mascot-sticker-pack-9
model: gpt-image-2
topics: [sticker, character]
aspectRatio: "1:1"
needsRefImage: false
useCase: "生成一套 3×3 的 9 个聊天表情贴纸：Q 版猫耳少女和小企鹅搭档，配早安、谢谢、OK、抱歉、马上到、晚安、再见等手写问候语，适合做微信 / LINE 表情包和角色周边。"
prompt: |
  生成一张可爱的聊天表情贴纸套图：[一个 Q 版猫耳少女]和一只小企鹅吉祥物，排成 9 个独立的贴纸，干净的白色背景。
  画布：正方形 1:1，高分辨率，白色背景，3×3 网格的贴纸包预览布局。每个贴纸都是柔和的粉彩色、粗而干净的描边、细细的白色贴纸边，点缀小闪光或小爱心，圆润可爱的比例。
  角色：小小的 Q 版动漫少女，蓬松的长发是[白色带淡粉发尾]，猫耳朵，大大的蓝眼睛，穿一件宽松舒适的[蓝色卫衣]，短裙或短裤和小鞋子。她身边是一只圆滚滚的深蓝色小企鹅，白脸、黄嘴黄脚。表情有开心、害羞、抱歉、兴奋、困倦和亲昵。
  恰好 9 个贴纸，每个上方或旁边有彩色手写中文：
  1. 左上：少女在企鹅旁开心挥手，"早安～"（橙黄色）；
  2. 中上：少女鞠躬点头，企鹅在旁边，"谢谢！"（橙色）；
  3. 右上：少女抱着企鹅，"做好朋友吧"（蓝色）；
  4. 左中：少女和企鹅比 OK 手势，"OK 哒～"（绿色）；
  5. 正中：少女双手合十、略带困意，"抱歉～"（蓝色）；
  6. 右中：少女和企鹅一起奔跑，"马上到！"（红橙色）；
  7. 左下：少女礼貌鞠躬，"请多关照"（粉色）；
  8. 中下：少女盖着蓝色小毯子和企鹅窝在一起，"晚安～"（紫色）；
  9. 右下：少女和企鹅一起跳起来，"再见！"（橙色）。
  画风：精致的日系卡哇伊聊天贴纸风，柔和的水彩般明暗，粉彩蓝和粉色为主，表情生动，俏皮的手写字，构图紧凑，没有背景场景。
  限制：9 个贴纸在 3×3 网格中清楚分开、间距均匀；文字按上面写的显示；不要多余贴纸、说明、Logo、水印、边框或界面元素。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/tetumemo/status/2086950428332511360
  author: "テツメモ｜AI図解×検証｜Newsletter"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；角色、发色、服装改为变量；原文的日文问候语改为中文"
images:
  - 3103-chibi-girl-mascot-sticker-pack-9-1.jpg
imageCredit:
  by: "テツメモ｜AI図解×検証｜Newsletter"
  url: https://youmind.com/gpt-image-2-prompts?id=31149
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[一个 Q 版猫耳少女] 可以换成你自己的 OC、宠物拟人或品牌吉祥物；发色和服装两个变量用来固定角色特征。9 句问候语可以全部换成你常用的话（"收到""在忙""冲鸭"等），每句 2～5 个字最清楚。上传一张角色设定图作参考，角色一致性会更好。

示例图是白底 3×3 的贴纸：白发粉尾、猫耳、蓝色卫衣的 Q 版少女和一只深蓝小企鹅，分别在挥手、鞠躬、拥抱、比 OK、道歉、奔跑、鞠躬、盖毯子睡觉、跳起来，每格上方是彩色手写的日文问候语（原提示词默认日文，本站已改为中文）。

**常见问题**：
- 中文手写字有错：每句控制在 5 字以内，生成后逐个检查。
- 角色每格长得不一样：强调"9 个贴纸是同一个角色，发型服装一致"。
- 上架表情平台：平台对尺寸、数量、透明底有具体要求，需要把每格切出来单独处理，并确认角色为原创。

**适合**：微信 / LINE 表情包、角色周边贴纸、社群互动图、品牌吉祥物表情。

### 英文原版

```text
Goal: Create a cute LINE sticker sheet featuring {argument name="character name" default="a chibi cat-eared girl"} and a small penguin mascot, arranged as nine separate transparent-style stickers on a clean white background.

Canvas: Square 1:1 image, high resolution, white background, sticker-pack preview layout with a 3 by 3 grid. Each sticker has soft pastel colors, thick clean outlines, subtle white sticker edging, tiny sparkles or hearts, and rounded kawaii proportions.

Character details: The main character is a small chibi anime girl with fluffy long {argument name="hair color" default="white hair with pale pink tips"}, cat ears, large blue eyes, a cozy oversized {argument name="outfit" default="blue hoodie"}, short skirt or shorts, and small shoes. She appears with a round dark-blue penguin mascot with a white face and yellow beak/feet. Expressions are cheerful, shy, apologetic, excited, sleepy, and affectionate.

Sticker count and labels: Include exactly 9 discrete stickers, each with handwritten Japanese text in bright pastel colors above or near the characters:
1. Top left: Girl waving happily beside penguin, text 「おはよ〜」 in yellow-orange.
2. Top center: Girl bowing or nodding with penguin at her side, text 「ありがとう！」 in orange.
3. Top right: Girl hugging or holding penguin close, text 「なかよくしよ」 in blue.
4. Middle left: Girl making an OK gesture with penguin, text 「OKだよ〜」 in green.
5. Middle center: Girl looking sleepy or relaxed with penguin, text 「ごめん〜」 in blue.
6. Middle right: Girl and penguin running or moving energetically, text 「いま行く〜！」 in red-orange.
7. Bottom left: Girl bowing politely with penguin nearby, text 「よろしくね」 in pink.
8. Bottom center: Girl lying or sitting cozily under a blue blanket with penguin, text 「おやすみ〜」 in purple.
9. Bottom right: Girl jumping excitedly with penguin, text 「またね！」 in orange.

Visual style: Polished Japanese kawaii LINE sticker style, soft watercolor-like shading, pastel blue and pink palette, expressive faces, playful hand-lettering, compact sticker compositions, no background scenery.

Constraints: Keep all nine stickers clearly separated and evenly spaced in a 3x3 grid. Preserve the Japanese text exactly as written. Do not add extra stickers, captions, logos, watermark, borders, or UI elements.
```

> 改编自 [テツメモ｜AI図解×検証｜Newsletter](https://x.com/tetumemo/status/2086950428332511360) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
