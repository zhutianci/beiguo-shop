---
title: "ai美食图提示词：世界名菜立体书四宫格，左页手绘做法、右页热菜从书里\"立\"出来（Nano Banana）"
slug: cookbook-popup-world-dishes-2x2-atlas
model: nano-banana
topics: [food, figurine, infographic]
modelLabel: Nano Banana Pro
aspectRatio: "1:1"
needsRefImage: false
useCase: "把几道菜做成一套\"会立起来的菜谱图鉴\"：2×2 四宫格，每格是一本摊开的旧书，左页是复古棕色线稿画的食材和步骤，右页是冒着热气的成品菜从纸面上立体地冒出来，旁边站着一个迷你小厨师。适合做美食专题封面、餐厅菜单插页和料理课海报。"
prompt: |
  生成一张 1:1 的 2×2 四宫格图，每一格都是一本摊开的旧书跨页，四本书像同一套"世界料理图鉴"里的四页，放在深色木桌上。四格的菜依次是：[麻婆豆腐（中国）]、[文达卢咖喱（印度）]、[莫雷酱鸡（墨西哥）]、[冬阴功汤（泰国）]。
  每一格都按同样的规则：
  - 左页：平面的复古棕褐色线稿，画这道菜的主要食材和做法流程（用箭头连接几个步骤），几乎没有文字。
  - 右页：这道菜的成品做成立体的微缩实物，冒着热气，像立体书一样从纸页上"长"出来，盛在符合当地习惯的器皿里（砂锅、铜锅、盘子、汤碗）。
  - 小厨师：一个迷你的厨师小人站在菜旁边，穿着带当地特色的厨师服，正在搅拌或撒料。
  - 铭牌：右页下方一块金属质感的小铭牌，刻着"菜名（国家）"；这是整格里唯一清晰可读的文字。
  风格：电影感的顶光，突出"左页是平面、右页是立体"的对比；微距级的细节，纸张泛黄、书脊和装帧统一；背景干净，不要多余的道具和水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-nano-banana-pro-prompts
  url: https://x.com/Gdgtify/status/2037204682230395265
  author: "@Gdgtify"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文是带占位说明的模板（按食材自动挑四个国家的菜），这里译为中文并改写成直接指定四道菜的版本；四道菜及其国家改为变量，按示例图填入默认值；保留\"只有铭牌上的字可读\"的约束"
images:
  - 3546-cookbook-popup-world-dishes-2x2-atlas-1.jpg
imageCredit:
  by: "@Gdgtify"
  url: https://youmind.com/nano-banana-pro-prompts?id=12840
  license: CC BY 4.0
verify:
  - "示例图四道菜与所属国家的对应（麻婆豆腐—中国、文达卢咖喱—印度、莫雷酱鸡—墨西哥、冬阴功—泰国）属常识，换菜时请自行核对"
  - "上线前在 Nano Banana 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：四个变量各写"菜名（国家或地区）"，可以按主题来选——四道面食、四种甜品、同一个国家的四个地方菜都行；菜名用中文或英文都可以，铭牌上的字会照着写。只想做一道菜时，把"2×2 四宫格"改成"单张跨页"，保留左右页的规则即可。

示例图是木桌上的四本旧书：左上右页是一锅红亮的麻婆豆腐放在小炉子上，左页画着辣椒、花椒、豆腐和炒锅；右上是铜锅里的咖喱配烤饼；左下是淋着深色酱汁的鸡腿配米饭；右下是一碗有虾和蘑菇的橙红色酸辣汤配一双筷子；每道菜旁都站着一个戴厨师帽的小人，铭牌上写着英文菜名和国家。

**常见问题**：
- 四本书风格不一致：强调"同一套图鉴、相同的纸色、字体和铭牌样式"。
- 左页出现大段乱码文字：写"左页只有线稿和箭头，不要文字"。
- 菜没有立体感：加"成品菜明显高出纸面，在书页上投下阴影"。

**适合**：美食专题和菜谱合集的封面、餐厅菜单的装饰页、烹饪课程海报。

### 英文原版

```text
<instructions>
[Use the UNIVERSAL WRAPPER above exactly as-is.]

If input includes ingredients, pick 4 distinct countries with famous dishes that fit those ingredients (hidden gems welcome). Output one 2x2 grid: each panel shows an open book spread for that country.

Per panel:
- Left page: 2D vintage sepia sketches (timeline/illustrated recipe flow, minimal text).
- Right page: 3D pop-up diorama of the finished steaming dish emerging from the page.
- A tiny chef mini stands beside the dish.
- All 4 books look like one cohesive atlas series.
- Only readable text: engraved plate “Dish ({argument name="country name" default="Country"})”.

Style: Cinematic top-down lighting emphasizing 2D vs 3D depth, macro detail, cohesive atlas design, clean background, shallow DOF, no logos, no long text.
</instructions>
```

> 改编自 [@Gdgtify](https://x.com/Gdgtify/status/2037204682230395265) 发布、[YouMind-OpenLab/awesome-nano-banana-pro-prompts](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
