---
title: 城市美食地图提示词：手绘水彩吃货地图（成都示例，可换城市）
slug: illustrated-city-food-map
model: gpt-image-2
topics: [infographic, illustration]
aspectRatio: "1:1"
needsRefImage: false
useCase: 生成带地标、美食小图、编号和图例的手绘城市美食地图，适合探店博主、旅行攻略、城市文旅宣传。
prompt: |
  生成一张手绘插画地图信息图。
  风格：[复古羊皮纸上的水彩 + 墨线手绘]。
  标题：左上角大字"[成都] [吃货暴走地图]"，旁边一个戴墨镜、竖大拇指的卡通[红辣椒]吉祥物。
  边框：[一圈绿叶与红辣椒的藤蔓]。
  底图：有纹理的米色羊皮纸，黄色道路、蓝色河流、绿色公园。
  地标（6 处，配小插画和标签）：[人民公园、文殊院、IFS 熊猫]、[339 电视塔、宽窄巷子、东郊记忆]。
  美食点（12 处，配食物小插画和编号标签）：
  [1 麻婆豆腐]、[2 钟水饺]、[3 春熙路小吃]、[4 宽窄巷子·三大炮]、[5 建设路·蛋烘糕]、[6 玉林路·九宫格火锅]、[7 肥肠粉]、[8 钵钵鸡]、[9 冒菜]、[10 人民公园·盖碗茶]、[11 锦里·冰粉]、[12 双流兔头]
  画面中央：一只坐着吃竹子的大熊猫。
  右下角图例：红点 = 美食地点，绿房子 = 地标景点，绿树 = 公园绿地，蓝线 = 河流湖泊，黄色双线 = 主要道路。
  右下角另有一个复古指南针（N、S、E、W），以及一行提示小字"[温馨提示：吃辣需谨慎，肠胃要保护~]"，旁边配一个小辣椒图标。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/mm_zzm44854/status/2045861258520568230
  author: "@mm_zzm44854"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 原文 JSON 改写为中文分段描述；城市、标题、吉祥物、边框、地标、美食点和提示语改为变量；把原文中的具体店铺名改为通用菜品名
images:
  - 137-illustrated-city-food-map-1.jpg
imageCredit:
  by: "@mm_zzm44854"
  url: https://x.com/mm_zzm44854/status/2045861258520568230
  license: CC0 1.0
verify:
  - 在 gpt-image-2 上实测 3 次，记录成功率与最常见的失败形式
  - 12 个美食标签是否全部出现、编号是否连续
  - 中文小字错字数量
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：换城市时，标题、吉祥物、边框、地标、美食五处一起换，并选一个城市符号放在中央（西安放兵马俑，广州放早茶蒸笼）。地标 4–6 个、美食 8–12 个最合适，再多字就会挤。

**常见问题**：
- 地名、菜名写错：生成后逐个核对；错得多就把美食点减到 8 个。
- 位置不符合真实地理：这是"示意地图"，不是导航地图；需要准确位置时在图上注明"示意图，非实际比例"。
- 写具体店名：店铺名属于他人商号，做商业推广时注意是否需要授权；用菜品名更稳妥。

**适合**：探店合集封面、城市攻略长图开头、文创明信片。

### 原版提示词

原文为 JSON 结构，中文标签即原作者所写。

```text
{
  "type": "illustrated map infographic",
  "style": "{argument name=\"art style\" default=\"watercolor and ink hand-drawn illustration on vintage parchment\"}",
  "title_section": {
    "text": "{argument name=\"city name\" default=\"成都\"} {argument name=\"map title\" default=\"吃货暴走地图\"}",
    "mascot": "cartoon red chili pepper wearing sunglasses and giving a thumbs up"
  },
  "border": "{argument name=\"border decoration\" default=\"vine of green leaves and red chili peppers\"}",
  "layout": {
    "background": "textured beige parchment paper with yellow roads, blue rivers, and green park areas",
    "sections": [
      {
        "title": "landmarks",
        "count": 6,
        "illustrations": ["traditional pavilion", "traditional monastery", "modern skyscraper with climbing panda", "tall TV tower", "traditional gate", "industrial buildings"],
        "labels": ["人民公园", "文殊院", "IFS", "339电视塔", "宽窄巷子", "东郊记忆"]
      },
      {
        "title": "food_spots",
        "count": 12,
        "illustrations": ["mapo tofu", "dumplings in chili oil", "skewers in pot", "sticky rice balls", "egg baking cake", "nine-grid hotpot", "sweet potato noodles", "cold skewers", "spicy mixed dish", "covered tea bowl", "ice jelly dessert", "spicy rabbit heads"],
        "labels": ["1 陈麻婆豆腐", "2 钟水饺", "3 春熙路", "4 宽窄巷子·三大炮", "5 建设路·叶婆婆蛋烘糕", "6 玉林路·小龙坎火锅", "7 香香巷·肥肠粉", "8 武侯祠大街·钵钵鸡", "9 东郊记忆·冒椒火辣", "10 人民公园·鹤鸣茶社", "11 锦里古街·冰粉", "12 双流老妈兔头"]
      },
      {
        "title": "图例",
        "position": "bottom-right",
        "count": 5,
        "items": ["red dot", "green house", "green tree", "blue line", "yellow double line"],
        "labels": ["美食地点", "地标景点", "公园绿地", "河流湖泊", "主要道路"]
      }
    ],
    "centerpiece": "giant panda sitting and eating bamboo",
    "bottom_right_extras": ["vintage compass rose with N, S, E, W", "disclaimer text '温馨提示:吃辣需谨慎,肠胃要保护~' with a red chili pepper icon"]
  }
}
```

> 改编自 [@mm_zzm44854](https://x.com/mm_zzm44854/status/2045861258520568230) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0；示例图同样来自该仓库收录的原帖出图。
