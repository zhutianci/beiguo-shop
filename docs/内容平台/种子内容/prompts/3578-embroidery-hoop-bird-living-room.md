---
title: "刺绣风提示词：绣绷里的小鸟客厅，针脚立体的手工刺绣实拍感（gpt-image-2）"
slug: embroidery-hoop-bird-living-room
model: gpt-image-2
topics: [figurine, illustration]
aspectRatio: "4:5"
needsRefImage: false
useCase: "想把一个可爱的小场景做成\"真的绣出来\"的效果时用：生成一张木桌上绣绷的微距照片，线迹有厚度，周围摆着绣线、剪刀和顶针，适合做手作账号封面、贺卡或刺绣图样参考。"
prompt: |
  一张高度写实的微距照片：质朴的木质手工桌上放着一只圆形木绣绷，里面是一幅已经绣完的手工刺绣，在本色米色亚麻布上绣出温馨的[小鸟们的客厅]。画幅 4:5。
  - 刺绣质感：看得见缎面绣、长短针、法式结粒绣，线迹凸起有厚度，带一点手工的不完美；
  - 角色：恰好 8 只绣出来的宠物鸟——一只大号的[黄色玄凤鹦鹉]坐在红色绒面扶手椅上，[手里拿着一把小剪刀]，身边窝着一只蓝白虎皮鹦鹉在看迷你画报；背景的木长凳上并排两只小鸟，蓝色沙发上两只小鸟凑在一起看书；右下角一只绿橙色的牡丹鹦鹉[举着粉色吹风机]，旁边有几道蓝色动感线；底部正中一只黑灰色的小文鸟；
  - 房间：红扶手椅、蓝沙发、木长凳、摆着小瓶子的桌子、两幅挂画、盆栽、吊着的绿植、橙色小吊灯、粉色窗帘、只勾了线的窗户、几个音符，布面上还留着淡淡的铅笔起稿线；
  - 绣绷周围：左上一木盘绕线板（粉彩色绣线），右上一张纸质色号卡，右侧一把雕花小剪刀，右下是针和金属顶针，下方一束绿色绣线，左下一张手写便签，写着[窗帘用浅粉色]；
  - 光线：温暖的自然日光，浅景深，焦点落在绣绷上，手作房的温馨氛围，大地色调；
  - 不要水印和任何品牌标识。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/lunarium09/status/2052899479108641077
  author: "@lunarium09"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并拆成要点；场景主题、主角鸟、两处动作道具、便签文字设为变量；按示例图把主角手里的\"毛衣针\"改为小剪刀、右下角的\"手持吸尘器\"改为吹风机；原文便签为日文手写，改为中文便签"
images:
  - 3578-embroidery-hoop-bird-living-room-1.jpg
imageCredit:
  by: "@lunarium09"
  url: https://youmind.com/gpt-image-2-prompts?id=19148
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[小鸟们的客厅] 是绣面主题，可换"小猫的面包房""兔子一家的野餐"；[黄色玄凤鹦鹉] 是坐在扶手椅上的主角，换物种时把其余几只也改成同类动物；[手里拿着一把小剪刀] 和 [举着粉色吹风机] 是两处小动作，换成"织毛衣""端着茶壶"都行；[窗帘用浅粉色] 是便签上的字，建议 8 个字以内。数量"恰好 8 只"可以减到 4~5 只，绣面会更清爽。

示例图里，木绣绷占了画面大半：黄色玄凤鹦鹉拿着小剪刀坐在红色扶手椅上，怀里的蓝白虎皮鹦鹉在翻画报，右下的牡丹鹦鹉举着粉色吹风机，沙发和长凳上还有两对小鸟；绣线一针一针清晰可见。绣绷外是绕线板、色号卡、雕花剪刀、顶针和一张便签，便签与色号卡上是日文手写字。

**常见问题**：
- 看起来像插画不像刺绣：加"每一块颜色都由平行排列的绣线填满，边缘有线迹起伏，侧光下能看到线的阴影"。
- 鸟的数量不对：把每只鸟的位置逐条写清，或直接减少数量。
- 便签文字乱码：把文字缩短，或改成"便签上只有几道铅笔线，没有文字"。

**适合**：手作博主封面、刺绣图样灵感、节日贺卡、儿童房装饰画。不适合当作可直接照着绣的针法图纸。

### 英文原版

```text
Create a highly realistic macro photograph of a finished hand-embroidery piece in a round wooden embroidery hoop on a rustic wooden craft table, showing a cozy living-room scene stitched on natural beige linen. The embroidery should look tactile and dimensional, with visible satin stitches, long-and-short stitches, French knots, raised thread texture, slight imperfections, and warm handmade charm. The scene contains exactly 8 embroidered pet birds: a large {argument name="main bird species" default="yellow cockatiel"} sitting in a plush red armchair holding knitting needles, a blue-and-white budgie nestled beside it reading a tiny illustrated magazine, two small birds perched on a wooden bench in the background, two small birds sitting together on a blue sofa reading, one green-and-orange lovebird standing at lower right holding a pink handheld vacuum with little blue motion lines, and one small black-and-gray crested bird at the bottom center. The miniature embroidered room includes a red armchair, a blue sofa, a wooden bench, a desk with tiny bottles, two framed wall pictures, a potted plant, hanging plants, a small orange pendant lamp, pink curtains, a sketched window, a few musical notes, and fine pencil-like construction lines visible on the fabric. Surround the hoop with realistic embroidery supplies: a wooden tray of pastel thread bobbins at the upper left, a paper thread color chart at the upper right, ornate embroidery scissors on the right, a needle and metal thimble at the lower right, green floss at the bottom, and a small note card at lower left with Japanese handwriting. Use warm natural daylight, shallow depth of field, crisp focus on the hoop, cozy craft-room atmosphere, earthy colors, and a charming whimsical style that makes the entire illustration appear as if it has been embroidered from a text prompt.
```

> 改编自 [@lunarium09](https://x.com/lunarium09/status/2052899479108641077) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
