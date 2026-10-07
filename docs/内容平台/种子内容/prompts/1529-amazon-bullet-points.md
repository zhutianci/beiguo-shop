---
title: 亚马逊五点描述怎么写提示词（每点一个卖点：利益在前、参数支撑、场景收尾，附字符检查与合规提醒）
slug: amazon-bullet-points
model: any-llm
topics: [ecommerce-ops, copywriting]
needsRefImage: false
useCase: 写亚马逊 Listing 的五点描述（Bullet Points / About this item）时用：把产品卖点按买家最关心的顺序排成五条，每条先说买家得到什么、再用参数和事实支撑，自然融入关键词，并检查长度和违规表述。
prompt: |
  Act as an Amazon copywriter who writes for real shoppers first and search second. 请用中文和我沟通，五点描述用英文写。

  产品与品牌：[产品与品牌]
  目标站点与买家：[站点与买家]
  卖点清单（每条附依据：参数、测试、认证）：[卖点清单]
  买家常见顾虑（来自竞品差评、问答区）：[买家顾虑]
  需要覆盖的关键词：[关键词]
  包装内容与售后保障（如有）：[包装与售后]
  每条字符上限（按当前类目规则）：[每条上限]

  请完成：
  1. 排序：按「买家最关心 → 次关心」排列 5 个卖点，说明排序理由（参考买家顾虑）。
  2. 写五点描述，每条结构：
     - 开头 2–5 个单词的大写短语概括利益（如「STAYS HOT FOR HOURS」，按站点习惯决定是否使用大写）；
     - 用一两句话说明买家得到什么；
     - 用具体参数或事实支撑；
     - 可选：一个使用场景。
     每条标注字符数。
  3. 关键词覆盖表：每个关键词出现在哪一条，确保自然、不重复堆砌。
  4. 第 5 条建议内容：包装清单、尺寸规格或售后说明（只写真实的保障）。
  5. 合规检查：不出现促销信息（价格、折扣、免邮）、不提及竞品、不宣称未经证实的功效与认证、不使用「best」「#1」、不出现外部链接或联系方式。
  6. 中文对照。
  约束：所有参数与认证必须真实；健康、安全类宣称必须有依据；字符限制与格式以 Seller Central 当前规则为准。
negativePrompt: null
source: null
verify:
  - 亚马逊五点描述的字符限制、格式与禁止内容以 Seller Central 当前规则为准（近年有过调整）
  - 示例中的产品为虚构
---
**怎么填变量**：[买家顾虑] 是决定排序的关键，可以去同类产品的差评和「问答」区里找高频问题，例如「洗几次就掉色」「尺寸偏小」。[每条上限] 请按你所在站点与类目的当前规则填写。

**常见坑**：
- 五条都在讲功能参数，没有一条回答「这对我有什么好处」；
- 关键词硬塞进句子里，读起来不自然；
- 写「FDA approved」「100% safe」这类需要严格证明的宣称，没有依据会被投诉或下架。

**迭代追问**：「根据这五点描述，规划 A+ 页面的模块」「站在一个犹豫的买家角度，读完五点你还有什么顾虑」「把五点描述改写成日本站的版本」。

### 示例输出

> 示例，仅供参考（虚构：保温杯，美国站）

- **HOT COFFEE AT YOUR 3 PM MEETING** – Double-wall vacuum insulation keeps drinks hot for up to 12 hours and cold for up to 24 hours (tested at 22°C room temperature).
- **NO LEAKS IN YOUR BAG** – The twist-lock lid with a silicone seal stays closed even when the bottle is tipped over.
- **FITS YOUR CAR CUP HOLDER** – 2.8-inch base fits most standard car cup holders.

**中文对照（第 1 条）**：下午 3 点开会时咖啡还是热的——双层真空隔热，热饮最长保温 12 小时、冷饮 24 小时（室温 22°C 测试）。
