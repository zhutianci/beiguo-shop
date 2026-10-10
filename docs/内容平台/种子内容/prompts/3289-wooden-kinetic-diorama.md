---
title: nano banana 提示词：把任何东西做成"木头朋克"发条机关模型，配木头小人操作员
slug: wooden-kinetic-diorama
model: nano-banana
topics: [figurine, illustration]
needsRefImage: false
aspectRatio: "1:1"
useCase: 做科普账号封面、发明史 / 科技史系列图、木工文创概念图时，输入一个物体或主题，生成像手工木雕机关玩具一样的产品照：硬木外壳局部剖开露出黄铜齿轮，旁边有木头关节小人在操作它。
prompt: |
  主题：[双翼飞机]（可以是任何物体、动物、植物或概念）。
  1. 材质推断：根据主题本身的颜色和分量选一种硬木做主体（如胡桃木、樱桃木、枫木）；根据主题的花纹细节选一种对比色的镶嵌木料做点缀；关节和动力部位用黄铜等金属五金。
  2. 主体：把主题做成一件复杂的独立式木制机关玩具，立在一块手工雕刻的木底座上，底座表现它所处的环境（[草地、月面或街道]），整体约 30 厘米高，桌面物件的微距产品照。
  3. 发条内部：外层木壳有一部分被拆开或用铰链打开，里面原本的生物结构或机械结构被换成发条机关——可见齿轮、链条、发条和黄铜飞轮，让人感觉它能靠上发条动起来；木头接缝处有细小的黄铜螺丝、铆钉和铰链。
  4. 操作员：加入一个标准的木头关节人偶（美术用人偶那种），扮演维护者、驾驶者或操作者，比如[正在转动螺旋桨]、爬梯子擦拭、拧巨大的发条钥匙；人偶戴着与场景相符的木雕小装备。
  5. 光线与背景：柔光箱影棚光，清漆曲面上有修长优雅的高光；中性灰无缝背景；木头高光清漆、光滑、色泽饱满。
  输出一张 [1:1] 的产品摄影图，"木头朋克"美学。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-nano-banana-pro-prompts
  url: https://x.com/Gdgtify/status/2095854642882019392
  author: "@Gdgtify"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 译成中文并保留原文五段结构（材质推断、主体、发条内部、操作员、光线）；主题、底座环境、人偶动作、画幅设为变量；把英寸换成厘米，删去 8K 参数
images:
  - 3289-wooden-kinetic-diorama-1.jpg
imageCredit:
  by: "@Gdgtify"
  url: https://cms-assets.youmind.com/media/1788591095766_6nq71i_HRP8n6XWcAEna6M.jpg
  license: CC BY 4.0
verify:
  - 原文要求单张 1:1，示例图却是 16:9 的四宫格（四个不同主题），作者可能另加了四宫格指令；实测"2x2 四宫格，分别做 A、B、C、D"是否稳定
  - 示例图左下格的墙面涂鸦有英文字样，展示时无需处理但注意不要误读为品牌
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么填变量**：[双翼飞机] 换成任何主题，物体、动物、发明都行，例如"活字印刷机""登月舱""蒸汽火车""一头大象"。[草地、月面或街道] 写成和主题匹配的一种环境，比如登月舱配"月面陨石坑"。[正在转动螺旋桨] 是人偶动作，印刷机就写"正在拉动压印手柄"。想要示例图那样的四联图，把最后一行改成"2x2 四宫格、16:9，四格分别是：A、B、C、D"。示例图是四宫格：左上一架停在木雕云朵上的双翼飞机，小人在转螺旋桨；右上登月舱露出齿轮，旁边小人插着旗子；左下一段涂鸦墙被木制吊臂拆开；右下是一台深色木头印刷机，小人在操作。

**常见问题与调整**：
- 看不到齿轮：强调"外壳至少剖开四分之一，内部黄铜齿轮清晰可见"。
- 人偶太大或不见了：加"人偶高度约为主体的四分之一，站在主体旁边与它互动"。
- 木头像塑料：加"可见木纹和年轮，边缘有手工打磨痕迹"。
- 想换暖色调：背景改"深胡桃色木工作台，暖色台灯侧光"。

**适合**：科技史 / 发明史系列图、科普封面、木工与文创概念设计；不适合需要真实机械结构的工程图。

### 英文原版

```
1. The Semantic Inference Engine (Dynamic Material Mapping):  
Input A is ANY Topic (Object, Animal, Plant, or Concept).
Analyze the subject's inherent properties and map them to Artisanal Materials:
The Primary Body (The Chassis): Infer the subject's main color/weight and assign a corresponding Hardwood. 
The Accents (The Inlay): Infer the subject's patterns or details and assign a contrasting Marquetry Material. 
The Mechanics (The Skeleton): Infer the subject's joints or power source and assign Metal Hardware.
2. The "Immutable" Container (The Automaton):
Goal: A "Da Vinci Workshop" Product Shot.
The Object: The subject is rendered as a complex, freestanding Wooden Mechanical Toy.
The Base: The model stands on a hand-carved wooden block representing its semantic environment.
The Scale: Macro photography of a tabletop object (approx. 12 inches tall).
3. The Clockwork Interior (The Transformation):
The Cutaway: A section of the outer "wood shell" is visually removed or hinged open.
The Guts: Inside, the biological or mechanical inner workings are replaced by Clockwork Mechanics.
Rule: Visible gears, bicycle chains, watch springs, and brass flywheels must imply the object moves via wind-up power.
The Fasteners: Tiny brass screws, rivets, and hinges are visible along the seams of the wood.
4. The Narrative Figure (The Operator):
The Character: A standard Jointed Wooden Mannequin (Artist's Doll style) is integrated into the scene.
The Role: The figure acts as the maintainer, rider, or operator of the subject.
Interaction: They are climbing a ladder to polish the object, turning a giant wind-up key, or steering the beast/machine.
The Accessories: The doll wears carved wooden gear appropriate to the context.
5. Lighting & Atmosphere:
Lighting: Softbox Studio Lighting. Diffused, high-end commercial lighting that creates long, elegant highlights on the varnished curves.
Background: Neutral Studio Grey. Seamless infinity backdrop to focus entirely on the material textures.
Texture: High Gloss Varnish. The wood must look expensive, smooth, and deeply saturated.
Output: ONE image, 1:1 Aspect Ratio, Product Photography, "Woodpunk" aesthetic, 8k Resolution.
```

> 改编自 [@Gdgtify](https://x.com/Gdgtify/status/2095854642882019392) 发布、[YouMind-OpenLab/awesome-nano-banana-pro-prompts](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) 收录的提示词，仓库许可证 CC BY 4.0。
