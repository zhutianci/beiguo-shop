---
title: 英文简历与 LinkedIn 个人简介提示词（中文简历转英文 CV + Headline / About 一起写）
slug: english-resume-linkedin
model: any-llm
topics: [career, translation]
needsRefImage: false
useCase: 投外企、申请海外岗位或要更新 LinkedIn 时用：把中文简历改写成符合英文招聘习惯的简历（不是逐字翻译），同时生成 LinkedIn 的 Headline、About 和经历描述，保证两边信息一致。
prompt: |
  ROLE: You are a bilingual recruiter who has screened thousands of English resumes for multinational companies. Reply in English for all resume and LinkedIn content, and add brief notes in Chinese for me.
  （角色：你是一名看过大量英文简历的双语招聘顾问。简历和 LinkedIn 内容用英文写，给我的说明用中文。）

  我的材料：
  - 中文简历：
  [粘贴中文简历]
  - 目标岗位与地区：[岗位，地区如美国/英国/新加坡/国内外企]
  - 目标岗位 JD 关键词（如有）：[JD 关键词]
  - 英文水平与是否需要保留中文名：[英文水平/姓名写法]

  任务一：英文简历
  1. 结构：Contact → Summary（3 行以内）→ Experience → Education → Skills（必要时加 Projects / Certifications）。
  2. 经历每条用动作动词开头（Led, Built, Reduced, Launched），过去的经历用过去时、当前工作用现在时，不用 I / my；能量化的都量化，没有数字的不硬编。
  3. 职位和公司名：职位按工作内容意译（如「专员」可能是 Specialist、Coordinator 或 Associate，说明理由）；公司和学校优先用其官方英文名，不确定的标注「(verify official name)」。
  4. 格式：日期统一为「Mar 2023 – Present」；单栏、标准小标题，方便 ATS 解析；应届生控制在 1 页，资深者不超过 2 页。
  5. 地区习惯：投美国 / 英国岗位时去掉照片、年龄、婚育、籍贯等信息，并提醒我；国内外企按目标公司惯例。

  任务二：LinkedIn
  1. Headline：3 个版本，包含目标岗位关键词和一个差异化亮点，避免只写「Seeking opportunities」。
  2. About：第一人称、口吻比简历自然，150–250 词，结构为「我做什么 → 代表性成果 → 擅长与关注领域 → 欢迎联系的话题」。
  3. 把简历中最重要的 2 段经历改写成 LinkedIn 版（可以比简历多一点背景）。

  任务三：一致性与用词检查
  - 列出简历和 LinkedIn 之间的日期、职位不一致处；
  - 列出中式英语或直译痕迹（如「responsible for」堆砌），给出改法。

  只使用我提供的经历和数据，不编造。
negativePrompt: null
source: null
verify:
  - LinkedIn Headline 与 About 的字符上限以 LinkedIn 官方帮助页面为准，正文未写具体数字
  - 实测一次：用一份含「专员」「主管」职位的中文简历，检查职位意译是否给出理由
---
**怎么填变量**：[目标岗位与地区] 很关键，投美国公司和投国内外企的简历习惯不一样（照片、个人信息、页数）。[JD 关键词] 从目标岗位描述里摘 5–10 个技能词，AI 会自然地放进 Summary 和 Skills，提高被 ATS 检索到的概率。

**常见坑**：直接机翻中文简历——「负责」全变成「Responsible for」，读起来像职责说明而不是成果。另一个坑是简历和 LinkedIn 的日期、职位对不上，招聘方会核对。

**迭代追问**：针对不同岗位说「按这份新 JD 只调整 Summary 和前两段经历的措辞」；不确定表达是否地道时追问「挑出 5 句最不像母语者写的句子并改写」。中文简历本身还没打磨好的，可以先用本站「简历优化提示词」按 JD 改好再转英文。

### 示例输出

> 示例，仅供参考（市场专员，投新加坡外企）

**Headline**：Marketing Specialist | B2B Content & Lead Generation | Grew organic leads 2x in 12 months

**Experience**
- Launched a bi-weekly industry newsletter that reached 8,000 subscribers within 10 months.
- Coordinated 12 offline trade events with sales teams, generating 300+ qualified leads.

**说明**：「市场专员」译为 Marketing Specialist 而非 Commissioner——后者在英文中多指政府官员。
