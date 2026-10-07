---
title: "AI美食图提示词：酱汁炸猪排微距特写（日式定食菜单图）（gpt-image-2）"
slug: tonkatsu-sauce-closeup-food-photo
model: gpt-image-2
topics: [food]
aspectRatio: "4:3"
needsRefImage: false
useCase: "生成一张油亮诱人的日式炸猪排微距照：切成 5 块的炸猪排淋满浓稠深色酱汁，旁边一堆卷心菜丝，适合定食店菜单、外卖主图和美食海报。"
prompt: |
  生成一张写实的特写美食照片：日式[炸猪排配深色多蜜酱]，盛在一只椭圆形粗陶盘里。
  主体是一块炸猪排，切成恰好 5 块厚实的长方块，从左下到右上斜向摆放，面包糠金黄酥脆，切口间露出浅色猪肉。
  一大勺浓稠、油亮、深红棕色的酱汁浇在 5 块猪排中间，并大量积在盘子下半部分，带明亮的高光和细小的颗粒质感。
  猪排后方左上角是一大堆切得很细的[白色卷心菜丝]，上面放恰好 3 根细细的橙色胡萝卜丝。
  浅景深，微距餐厅摄影风格，温暖的自然光，细节丰富、质感诱人，略倾斜的俯视角度。盘子是米灰色粗陶，深色盘沿，带细小斑点，放在深色木桌上，背景有一点温暖的橙色虚化。
  不要文字、餐具、手、多余配菜、米饭，也不要单独的咖喱酱。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/koi_zoom1/status/2090789500230537702
  author: "小泉勝志郎"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；菜名与配菜改为变量"
images:
  - 3045-tonkatsu-sauce-closeup-food-photo-1.jpg
imageCredit:
  by: "小泉勝志郎"
  url: https://youmind.com/gpt-image-2-prompts?id=32291
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[炸猪排配深色多蜜酱] 可以换成"咖喱炸猪排""芝士炸鸡排""照烧鸡腿排"，酱汁颜色要同步改；[白色卷心菜丝] 可以换成"紫甘蓝丝""土豆沙拉"。需要整份定食时，把最后一行的"不要米饭、多余配菜"删掉，改成"右侧一碗白米饭和一碗味噌汤"。

示例图是近景：5 块金黄炸猪排斜放在米灰陶盘上，深红棕色的酱汁浓稠油亮、在盘中积成一大片，左上角一堆白色卷心菜丝和几根胡萝卜丝，背景暖橙虚化。

**常见问题**：
- 酱汁太稀或太少：强调"浓稠、大量、在盘中积成一片"。
- 块数不对：写成"切成 5 块，块与块之间有细缝"。
- 颜色发暗：加"暖色补光，酱汁表面有明亮高光"。

**适合**：定食 / 炸物店菜单、外卖主图、美食海报、餐饮小程序。

### 英文原版

```text
Create a realistic close-up food photograph of Japanese {argument name="dish name" default="tonkatsu with dark demi-glace sauce"} served on an oval rustic ceramic plate. The main subject is one breaded pork cutlet sliced into exactly 5 thick rectangular pieces, arranged diagonally from lower left to upper right, with crisp golden-brown panko breading and pale pork visible in the cut gaps. Pour a thick, glossy, very dark reddish-brown sauce generously across the center of all 5 cutlet pieces and let it pool heavily around the bottom half of the plate, with bright specular highlights and small chunky texture in the sauce. Behind the cutlet at the upper left, add a large mound of finely shredded {argument name="side garnish" default="white cabbage"} with exactly 3 thin orange carrot strips on top. Use a shallow depth of field, macro restaurant photography style, warm natural lighting, high detail, appetizing texture, and a slightly angled overhead view. The plate should be beige-gray stoneware with a dark rim and subtle speckles, sitting on a dark wooden table with a hint of warm orange background blur. No text, no utensils, no hands, no extra side dishes, no rice, no curry roux separate from the sauce.
```

> 改编自 [小泉勝志郎](https://x.com/koi_zoom1/status/2090789500230537702) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
