---
title: "漫画提示词：水彩手账风日记漫画页，动物拟人主角的职业随笔（gpt-image-2）"
slug: toucan-doctor-watercolor-diary-manga
model: gpt-image-2
topics: [comic, illustration]
aspectRatio: "2:3"
needsRefImage: false
useCase: "想用一页图文介绍\"我是谁、我在做什么\"时用：把自己画成一只拟人动物，六个分格加一条图标页脚，配十来句手写短文，得到一页像生活小志内页的水彩日记漫画。"
prompt: |
  画一页温暖的自传体日记漫画（图文随笔），主角是[一只拟人的巨嘴鸟皮肤科医生]，把[护肤心得、日常观察和善意]写成一页安静的手账。
  画布：竖版 2:3，米白色水彩纸纹理，手绘的细线分格边框；纤细的钢笔墨线加水彩淡彩，配色是低饱和的米色、青绿、灰粉、淡绿和暖赭，像一本日系生活小志，温馨、略带怀旧。
  主角形象：黄橙黑三色的大鸟喙、蓝绿色头羽、圆而有神的眼睛、深色的手。室内穿白大褂配灰青色衬衫；户外穿灰粉色连帽卫衣、背双肩包，卫衣背后有一个小圆徽，写着"[知识就是生命]"。神情平静、若有所思、谦和。
  版式：恰好 6 个分格，外加底部 1 条页脚。
  1. 顶部大格（约占上三分之一）：主角坐在洒满阳光的书房木桌前，在摊开的笔记本上写字；桌上有台灯、一摞书、画着小花的马克杯，墙上钉着便签，窗外是绿叶。左侧用胶带贴着一张拍立得，照片里是穿粉卫衣、举着牌子的主角。左上角手写开场白："[皮肤科的事，日常的事，一点小发现。]今天也想帮上谁一点忙。"主角旁的对白框："讲得明白，又有用，这最让人开心。"
  2. 左下小格：戴手套的手指着夹板上的一张皮肤示意图小笔记，旁边写："皮肤很诚实，生活的信号都会如实出现。"
  3. 中间小格：主角侧身站在绿叶窗边，端着小花马克杯，圆形思考气泡："专业的、难懂的事，也想温柔地讲给你听。"
  4. 右下小格：别着回形针的活页本和一支笔，标题"今日笔记"，三行打勾清单"传达、创作、连接"，下面一句"全都重要。"
  5. 横向宽格：穿粉卫衣的主角在浅绿色的树林里举着望远镜，落叶飘下；左侧留白处手写："好东西会安安静静地延续下去。比起流行，更想看本质。"
  6. 横向宽格：主角的背影坐在天台边缘，面对淡色的城市天际线，天上一只纸飞机，身边有盆栽和马克杯；左侧手写："[皮肤是生活的镜子。]照顾它，就是珍惜自己。今天也要对自己、对别人温柔一点。"主角旁的对白框："好了，下次讲点什么呢。"右侧一张胶带贴着的便签："用创作和分享，换一个好一点的明天。"
  页脚：恰好 5 个带短句的小图标——显微镜"也喜欢做研究"、笔记本电脑"AI 是搭档"、相机"旅行和自然是输入"、咖啡杯"咖啡用来重启"、一张带小爱心的便签"谢谢你一直在"。
  文字：全部是简体中文手写体，墨色柔和、略不工整，自然地融进画面，不要印刷体。
  风格限制：能看到纸张颗粒，柔和的米色阴影，零碎而温馨的桌面杂物，光线柔和；不要光滑的数码渲染、生硬的粗描边和写实照片感；整体语气诗意、安静、带一点鼓励。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/nekoneko_zo/status/2055595094175306102
  author: "@nekoneko_zo"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并按\"画布 / 主角 / 版式 / 页脚 / 文字 / 风格\"分段；原文把整页日文文案堆在一个参数里，按示例图拆到各分格并译成中文；主角、主题、徽章文字和两句短文设为变量；合并了原文末尾重复的风格参数。"
images:
  - 3527-toucan-doctor-watercolor-diary-manga-1.jpg
imageCredit:
  by: "@nekoneko_zo"
  url: https://youmind.com/gpt-image-2-prompts?id=20909
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[一只拟人的巨嘴鸟皮肤科医生] 换成"动物 + 你的职业"，如"戴围裙的水豚面包师""穿工装的柴犬程序员"，并把第三段的外形和两套衣服一起改；[护肤心得、日常观察和善意] 是整页的主题。引号里的短文都可以改成自己的话，每句不超过两行；徽章上的字 4～6 个最稳。

示例图是日文版，画幅比 2:3 更瘦长：米白水彩纸上，穿白大褂的巨嘴鸟在窗边书桌前写笔记，左侧贴着一张它穿粉卫衣举牌子的拍立得；中间三小格是指着皮肤示意图的手、端着小花马克杯的侧影和打了三个勾的"今日笔记"；下面是林间举望远镜的一格和坐在天台看城市与纸飞机的背影；最底下一排是显微镜、电脑、相机、咖啡杯和感谢便签五个小图标。

**常见问题**：
- 中文手写字出错：把每格的文字减到一句，或先出无字版再自己写字。
- 分格数量不对：把"恰好 6 格 + 1 条页脚"提到第一句。
- 画得太鲜艳：强调"低饱和、水彩淡彩、能看到纸纹"。

**适合**：医生、老师、手艺人、自媒体作者的"关于我"图文、公众号文末名片。健康相关内容只写感悟，不写疗效和用药建议。

### 英文原版

```text
Goal: Create a warm, emotional autobiographical single-page manga/illustrated essay about a kind dermatologist who has literally become an anthropomorphic toucan, combining skincare advice, gentle self-reflection, and everyday notes.

Canvas: Vertical 2:3 page, off-white textured watercolor paper with thin hand-drawn panel borders, soft muted colors, delicate ink linework, Japanese slice-of-life zine aesthetic, cozy and slightly nostalgic.

Main character: An anthropomorphic toucan doctor with a large yellow-orange-and-black beak, blue-green head feathers, expressive round eye, and dark bird hands. He wears a white lab coat over a muted teal shirt in indoor scenes, and a dusty pink hoodie with a backpack in outdoor scenes. The hoodie back has a small circular emblem with Japanese writing. His mood is calm, thoughtful, humble, and kind.

Layout: Use exactly 6 main comic panels plus 1 decorative footer strip. Panel 1 is a large top panel occupying about the upper third: the toucan doctor sits at a wooden desk in a sunlit study, writing in an open notebook. Include a desk lamp, stacked books, papers pinned to the wall, leafy window, potted plant, coffee mug with a flower, and a taped Polaroid-style photo at left showing the same toucan in a pink hoodie holding a sign. Panel 2 is a small lower-left close-up of a gloved hand pointing at a small skin-chart note on a clipboard. Panel 3 is a small center panel showing the toucan in profile by a leafy window holding the flower mug, with a rounded speech/thought bubble. Panel 4 is a small lower-right notebook panel with a paperclip and pen, showing a checklist with three checked items. Panel 5 is a wide forest panel: the toucan in pink hoodie looks through binoculars among pale green trees and falling leaves, with reflective handwritten text at left. Panel 6 is a wide rooftop/city panel: the toucan sits from behind on a ledge facing a pale city skyline, with a paper airplane in the sky, plant pot, mug, small faucet or pipe, taped note at right, and speech bubble near the character. Footer strip at the very bottom contains exactly 5 small captioned icons: a microscope, a laptop computer, a camera, a coffee cup, and a handwritten thank-you note with a tiny heart.

Text content: Add Japanese handwritten captions in a soft ink style, using this text as the overall copy: {argument name="Japanese page text" default="皮膚科のこと、日常のこと。ちょっとした気づきのメモ。今日も、誰かの役に立つひとつを。知識は命。わかりやすくて、ためになる。それがいちばんうれしい。肌は、正直。暮らしのサインが、ちゃんと出る。専門のこと、むずかしいこともやさしく届けたいんだよね。今日のメモ つたえる つくる つながる ぜんぶ、だいじ。いいものはちゃんと、静かに、つづいていく。流行より、本質を見たい。皮膚は、暮らしの鏡。整えることは、自分をたいせつにすること。今日も、自分にも誰かにも、やさしくね。さぁ、次はどんな話を届けようかな。ものづくりと発信で、ちょっといい明日を。研究も好き。AIも相棒。旅と自然にインプット。珈琲でリセット。Thank you! いつもありがとう。"} Keep the text handwritten, slightly imperfect, and integrated naturally into the panels rather than typeset.

Style constraints: Fine pen-and-watercolor illustration, visible paper grain, soft beige shadows, muted teal/green/pink palette, cozy desk clutter, gentle sunlight, no glossy digital rendering, no harsh outlines, no photorealism. Keep the tone poetic and quietly encouraging. Use {argument name="main character" default="anthropomorphic toucan dermatologist"} as the central figure, {argument name="setting mood" default="warm reflective Japanese diary manga"}, {argument name="color palette" default="muted watercolor beige, teal, dusty pink, soft green, warm ochre"}, and {argument name="theme" default="skincare wisdom, daily observations, kindness, and thoughtful creation"}.
```

> 改编自 [@nekoneko_zo](https://x.com/nekoneko_zo/status/2055595094175306102) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
