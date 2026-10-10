---
title: "ai产品图提示词：私人藏宝柜式的高级珠宝主视觉，天鹅绒格位 + 档案卡 + 工具陈列（gpt-image-2）"
slug: private-vault-jewelry-campaign-visual
model: gpt-image-2
topics: [ecommerce, photography]
aspectRatio: "1:1"
needsRefImage: false
useCase: "给珠宝、腕表、钢笔等高客单价单品做\"博物馆级\"主视觉：主角放在中央的展台上，四周是一格一格的抽屉与托盘，摆着裸石、材质样片、档案卡和工具，像打开了一间不对外的私人收藏室。"
prompt: |
  一张超高端的广告主视觉，主角是[一条蓝宝石钻石项链]，陈列在一个像建筑金库一样的柜体里，仿佛属于一间不对外开放的私人收藏室。画幅 1:1。
  - 主角：放在中央抬高的雕塑感展台上（或悬在一个受控的展示壁龛里），毫无疑问是画面的绝对中心；
  - 四周：层层叠叠的格位、托盘和推拉面板，里面极其精确地摆放着[裸石、镶嵌样品、材质小样、档案卡和工具]；这些陪衬只为增加主角的吸引力，不能抢戏；
  - 细节：天鹅绒内衬的凹槽、烟色玻璃、拉丝黄铜嵌条、漆面木材、抛光石材、深色镜面、细小的雕刻编号和博物馆级的陈列五金，一切都像是为主角量身定做；
  - 构图：正面或略带角度，强对称或接近对称；画面足够疏朗以显得稀有，又有足够层次经得起细看；用重复的形状和线条形成节奏；
  - 光线与配色：贵重材质上有点状高光，阴影柔和衰减，戏剧化的轮廓光，天鹅绒般深邃的黑和温暖的金属反光；柜体配色为[午夜蓝与古铜色]；
  - 风格：高级珠宝广告 × 私人博物馆展陈 × 粗野主义奢华的产品布景，克制、锐利、昂贵；不出现任何品牌名和水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/Gdgtify/status/2053932153847869579
  author: "@Gdgtify"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并拆成要点；主角单品、周边陈列内容、柜体配色设为变量并给出示例值；把原文中未填的占位符（工艺元素、档案笔记等）整理成一条变量；合并重复的\"奢华\"描述"
images:
  - 3429-private-vault-jewelry-campaign-visual-1.jpg
imageCredit:
  by: "@Gdgtify"
  url: https://youmind.com/gpt-image-2-prompts?id=19640
  license: CC BY 4.0
verify:
  - "示例图里的档案卡上有手写体英文小字，属于装饰性文字；如需可读内容请另行排版"
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：主角可以换成"一块机械腕表""一支漆艺钢笔""一枚祖母绿戒指"；四周的陈列内容跟着主角改，例如腕表配"齿轮、表盘样片、图纸和镊子"；柜体配色换成"墨绿与黄铜""象牙白与香槟金"。想突出主角，可以把格位数量写少："左右各三格"。

示例图：深色柜体正中是一个黑色天鹅绒颈模，戴着一条由钻石环绕的蓝宝石吊坠项链，上方有一束顶光；左右两侧是一格格的抽屉，分别陈列着蓝宝石裸石、戒托样品、铂金色片、手写档案卡和一排小工具，底部托盘里放着水晶碎块和放大镜，每一格都有烫金的小标题。

**常见问题**：
- 陪衬太多，主角不突出：加"主角所在的中央格位最大、最亮，其余格位亮度降低一半"。
- 标签小字是乱码：写"格位标签只用很小的烫金横线表示，不写文字"。
- 出现真实品牌的表盘或 Logo：保留"不出现任何品牌名"，并把主角描述成"无品牌标识的原创设计"。

**适合**：珠宝 / 腕表 / 文具等单品的主视觉、品牌提案情绪板、新品预告海报、展陈设计参考。

### 英文原版

```text
ultra-luxury campaign visual for {argument name="luxury item" default="jewel / watch / accessory"}, displayed inside an architectural vault-like composition as if it belongs to a private collection unavailable to the public. the hero item should sit elevated on a sculptural pedestal or suspended in a controlled showcase niche, surrounded by layered compartments, trays, sliding panels, polished surfaces, and curated supporting artifacts. layout concept: the image should feel like a secret collector’s chamber opened at the perfect moment. use a front-facing or slightly angled composition with strong symmetry or near-symmetry. surround the hero piece with micro-arrangements of {argument name="gem details" default="gem details"}, [craft elements], [archival notes], [material samples], and [custom tooling or stands], all arranged with extreme precision. luxury details: include velvet-lined cavities, smoked glass panels, brushed brass inlays, lacquered wood, polished stone, dark mirror surfaces, subtle engraved numbering, and museum-grade display hardware. everything should feel custom-built around the hero object. visual style: high-jewelry campaign meets private museum exhibition meets brutalist-luxury product staging. refined, crisp, reserved, expensive, with immaculate spatial control. composition guidelines: hero object is unquestionably dominant. supporting compartments must enhance desirability, not distract. keep the scene sparse enough to feel exclusive, but layered enough to reward inspection. use intentional repetition of shapes and lines to create luxury rhythm. lighting & background: pinpoint specular highlights on precious materials, soft shadow falloff, dramatic edge light, velvet-deep blacks, and warm reflected metallic tones. background or housing in {argument name="vault palette" default="vault palette"}. ultra-crisp, editorial campaign finish, no watermark.
```

> 改编自 [@Gdgtify](https://x.com/Gdgtify/status/2053932153847869579) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
