---
title: veo 3 JSON 提示词：快递纸箱一放下就爆开，空房间瞬间变成工作室（家居产品魔法组装）
slug: veo-box-burst-studio-makeover-json
model: veo
topics: [product-video, motion-graphics]
modelLabel: Veo 3
aspectRatio: "16:9"
needsRefImage: false
useCase: 家居、家具、电商平台"一箱搞定"的魔法组装广告：一个人把密封纸箱放在空荡荡的 loft 中央，纸箱震动后爆开，书桌、书架、沙发、绿植飞出来各就各位，空房间瞬间变成住办一体的工作室。
prompt: |
  {
    "description": "电影感镜头：一间明亮开阔、有大窗户的工作室。一个男人把一个密封的[快递纸箱]轻轻放在房间中央的地板上。他的手一离开，纸箱开始震动，然后伴随一股能量脉冲爆开。各种家居产品快速飞出、在空间里组装就位，把空荡荡的工作室变成一个时尚、实用的住办一体空间。",
    "style": "电影感",
    "camera": "固定广角，变身过程中镜头轻微上摇",
    "lighting": "明亮的日光，柔和阴影，冷调高光",
    "room": "极简的艺术家 loft，白墙，水泥地",
    "elements": [
      "一个密封的快递纸箱",
      "轻轻放下纸箱的男人",
      "可升降书桌和办公椅",
      "模块化书架",
      "沙发床",
      "小型厨房用品",
      "室内绿植",
      "抽象装饰画",
      "柔软的地毯",
      "落地灯",
      "蓝牙音箱",
      "收纳盒",
      "咖啡机",
      "画架和素描本"
    ],
    "motion": "男人放下纸箱；他一松手，纸箱一阵颤抖后爆开，产品向四周飞出，精准而快速地组装到位",
    "ending": "工作室完全变成多功能的住办空间；男人后退一步，环顾四周，露出安静而满足的微笑",
    "text": "无"
  }
negativePrompt: null
source:
  repo: liu-kaining/Awesome-Veo3-Prompts
  url: https://github.com/liu-kaining/Awesome-Veo3-Prompts/blob/main/prompts/amazon_box_studio_transformation.md
  author: "liu-kaining"
  license: MIT
  licenseUrl: https://github.com/liu-kaining/Awesome-Veo3-Prompts/blob/main/LICENSE
  changes: "JSON 的值译为中文、键名保留英文；去掉了原文中的电商平台品牌名和\"logo 可见\"要求，纸箱改为通用变量；删去关键词字段，新增 text 字段"
imageBrief: 仓库没有示例图。站长生成 1 条，截取"放下纸箱""产品飞出组装""改造完成"三帧。
verify:
  - Veo 实测 3 次：14 样物品里实际出现几样、组装过程是否混乱
  - 画面里是否出现乱码品牌字样
---
**时长与镜头**：8 秒、固定广角 + 轻微上摇：放箱 → 震动爆开 → 物品飞出组装 → 人物环顾微笑。elements 列了 14 样东西，8 秒里不可能都看清，模型会挑一部分；你最想展示的几样，要写进 description 里。

**怎么用**：这是"一箱变一屋"的经典电商创意，适合家具品牌、整装公司、家电套餐、搬家服务。把 elements 换成你真正卖的产品清单（最好控制在 6–8 样），把 room 换成目标客群的房间（"小户型出租屋""儿童房""阳台"）。品牌 logo 不要让模型画在纸箱上，后期贴片更清晰。

**怎么填变量**：[快递纸箱] 可以换成"一个木质礼盒""一个行李箱"，创意就变成"行李箱打开变出度假房间"。

**常见失败与调整**：
- 物品飞得满屏乱成一团：把 elements 缩减到 6 样，motion 写"物品一件接一件依次落位"。
- 家具组装后比例奇怪：写"家具尺寸符合真实比例，靠墙整齐摆放"。
- 男人在变身过程中消失：写"男人始终站在纸箱旁，变身结束后环顾四周"。

> 改编自 [liu-kaining/Awesome-Veo3-Prompts](https://github.com/liu-kaining/Awesome-Veo3-Prompts)（Copyright (c) 2025 liu-kaining，MIT License）。英文原版以真实品牌为主体，本站已改为通用写法，原文请见来源链接。
