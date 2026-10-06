---
title: 家谱图提示词：神话 / 历史人物族谱信息图海报（新艺术装饰风，gpt-image-2）
slug: mythology-family-tree-infographic
model: gpt-image-2
topics: [infographic, poster]
aspectRatio: "16:9"
needsRefImage: false
useCase: 把神话、历史朝代、名著里的人物关系画成一张横版"家谱 / 人物关系图谱"海报：中间是按辈分排列的人物群像，两侧是起源、象征、能力、传承等知识栏，适合课件、读书笔记封面和科普长图。
prompt: |
  一张 16:9 横版的新艺术运动（Art Nouveau）风格历史信息图海报，主题是[希腊神话]。
  构图优雅流动，参考经典装饰海报：华丽的花卉边框、卷曲藤蔓、[金色月桂]纹样，线条优美而不对称。
  中央主画面：以[奥林匹斯众神]的家谱为主题的神话群像，人物按辈分从上到下排列在[奥林匹斯山]周围——第一层[宙斯、赫拉]，第二层[雅典娜、阿波罗、阿尔忒弥斯]和[波塞冬、阿佛洛狄忒]——并用细金线连成族谱；每个人物配一个新艺术风光环和名牌，并带上各自的象征物（如[雷电、孔雀、猫头鹰]、[竖琴、新月、三叉戟、贝壳]），轮廓修长优雅、装饰细节丰富。
  配色：[深青绿、古金、奶油白、灰玫瑰]，只在人物和天空中使用柔和渐变。
  顶部用大号装饰衬线字写标题"[GREEK MYTHOLOGY]"，下方小字副标题"[THE OLYMPIAN FAMILY]"。
  两侧用带弧形边框和细金线的装饰面板放知识点，分栏为：起源、主要人物、象征物、能力、相关人物、影响；角落放一个"你知道吗？"小框，写 5 条原创趣味知识。
  整体奢华、古典、富有诗意和装饰感；不要现代界面元素，不要临摹任何现成的艺术作品。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/92digitalartArt/status/2064420821922152795
  author: "@92digitalartArt"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 英文原文译为中文；主题、人物名单、中心场景、象征物、配色、标题与副标题改为变量；补充"按辈分连成族谱、每人配名牌和象征物"的结构说明，栏目名改为通用名称
images:
  - 507-mythology-family-tree-infographic-1.jpg
imageCredit:
  by: "@92digitalartArt"
  url: https://x.com/92digitalartArt/status/2064420821922152795
  license: CC0 1.0
verify:
  - 换成中文标题和中文栏目时是否清晰，人物名牌是否会写错名字
  - 换成"三国人物关系""红楼梦贾府"等中文题材时，族谱连线是否正确（模型可能画错辈分）
  - 侧栏知识点为模型生成，需核对史实或神话出处
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：[希腊神话] 换成你的题材，例如"北欧神话""三国蜀汉""哈布斯堡家族"；人物名单控制在 5–8 人，并按"辈分从上到下"的顺序写，模型才画得出层级；象征物和人物一一对应地写，名牌就不容易张冠李戴。配色可以换成"朱红、墨黑、宣纸白"做国风版本，同时把"新艺术运动"改成"中国传统工笔装饰风"。

**常见问题**：
- 关系连错：模型对复杂家谱不可靠。人物多时，先用文字写出"甲是乙的父亲、丙是乙的妻子"，或干脆只画两代。
- 文字太多看不清：侧栏只保留 4 个，"你知道吗"改成 3 条。
- 历史题材请把人物画成艺术化形象，不要用真实照片人物。

**适合**：历史 / 语文课件、读书笔记、科普长图封面。示例图为原作者生成，仅供参考。

### 英文原版

```text
An Art Nouveau style historical infographic poster in 16:9 horizontal format about Greek mythology, featuring an elegant flowing composition inspired by classical decorative poster design, with ornate floral borders, curling vines, golden laurel motifs, and graceful asymmetrical linework; the central artwork should depict the Olympian family tree as a beautiful mythic tableau with Zeus, Hera, Athena, Apollo, Artemis, Poseidon, and Aphrodite arranged in a ceremonial vertical hierarchy around Mount Olympus, each god or goddess framed by stylized Art Nouveau halos, flowing hair, marble columns, peacocks, olive branches, stars, waves, and moon crescents, all drawn with elongated elegant contours and rich decorative detail; use a palette of deep teal, antique gold, cream, and muted rose, with subtle gradients only in the illustrated figures and background sky; place the title at the top in large ornamental serif lettering reading GREEK MYTHOLOGY, with the subtitle THE OLYMPIAN FAMILY TREE beneath it in smaller elegant text; organize the facts into decorative side panels with graceful curved frames and thin gold rules, including sections labeled ORIGINS, GODS OF OLYMPUS, SYMBOLS, POWERS, HEROES, and LEGACY, plus a small DID YOU KNOW? box near the lower corner with five original myth facts; the entire poster should feel luxurious, classical, poetic, and richly decorative, with no modern UI, no copyrighted artwork, and a true Art Nouveau atmosphere, 16:9 horizontal ratio
```

> 改编自 [@92digitalartArt](https://x.com/92digitalartArt/status/2064420821922152795) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0；示例图同样来自该仓库收录的原帖出图。
