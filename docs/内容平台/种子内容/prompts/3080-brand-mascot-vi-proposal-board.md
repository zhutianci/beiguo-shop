---
title: "AI品牌设计提示词：IP 吉祥物 + 门店空间 + 周边物料的品牌视觉提案板（gpt-image-2）"
slug: brand-mascot-vi-proposal-board
model: gpt-image-2
topics: [logo, character]
aspectRatio: "16:9"
needsRefImage: false
useCase: "一句话生成一张模块化的品牌视觉提案板：中间是卡通 IP 主形象，右边是表情动作延展，左边是门店空间效果，底部是包装盒、杯子、贴纸、手提袋等周边，适合甜品店、茶饮、文创品牌的 VI 提案。"
prompt: |
  一张[年轻化 IP 风格]的甜品品牌视觉设计提案板，横版布局，模块化结构清晰。
  主视觉是画面中央的[蛋糕精灵卡通 IP 形象]。
  右侧展示这个角色的多种表情和动作；左侧展示门店室内设计（ins 风、柔和灯光）；底部是品牌周边物料：盒子、杯子、贴纸、手提袋和文创周边。
  顶部放品牌名和一行中文副标题，各模块配编号和小标题。
  配色：[奶油白、粉色、浅棕和柔和色调]。
  风格：扁平插画结合轻 3D，柔软可爱的质感。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/_AIBOZ_/status/2048809162600255653
  author: "AIBOZ·艾熵"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文中文说明的英文写法改写为中文；品牌风格、主形象、配色改为变量"
images:
  - 3080-brand-mascot-vi-proposal-board-1.jpg
  - 3080-brand-mascot-vi-proposal-board-2.jpg
imageCredit:
  by: "AIBOZ·艾熵"
  url: https://youmind.com/gpt-image-2-prompts?id=16535
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：把"甜品品牌"、IP 形象和配色换成你的品牌，例如"国潮新年市集品牌 + 舞狮小狮子 IP + 中国红与金色""海洋公益品牌 + 小鲸鱼 IP + 海蓝与白"。想要指定品牌名，在开头写"品牌名：XXX"。

示例图两张：Sweet Fairy 甜品店（中央粉色头发、头顶蛋糕的 3D 小精灵，右侧十几个表情动作，左侧粉色甜品店内景，底部蛋糕盒、杯子、手提袋、钥匙扣等）和东方市集（红色舞狮小狮子 IP、中式门楼店面、红包和灯笼周边），都是浅色底的模块化提案板。

**常见问题**：
- 各模块里的角色长得不一样：加"所有模块中的 IP 形象必须是同一个角色"。
- 小字乱码：提案板的说明文字是装饰；正式提案需要设计师重排文字。
- IP 形象原创性：生成后请检查是否与已有知名角色相似，商用前做近似检索。

**适合**：品牌 VI 提案、IP 形象设计初稿、开店视觉规划、文创产品规划。

### 原版提示词

```text
A visual design proposal board for a dessert brand in a {argument name="brand style" default="youthful IP style"}, with a horizontal layout and clear modular structure. The main visual features a {argument name="main character" default="cartoon IP (cake elf/dessert character)"} in the center. The right side shows the character with various expressions and actions, the left side shows store interior design (ins-style with soft lighting), and the bottom features brand collateral: boxes, cups, stickers, bags, and merchandise. Color palette: {argument name="color scheme" default="cream white, pink, light brown, and soft tones"}. Style: flat illustration combined with light 3D and a soft, cute texture.
```

> 改编自 [AIBOZ·艾熵](https://x.com/_AIBOZ_/status/2048809162600255653) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
