---
title: Milvus Lite 使用教程：安装、本地文件数据库、插入与搜索，以及它的限制
slug: milvus-lite-local-vector-database-quickstart
products: [ai-tools]
models: []
topics: [ai-agent]
accountTier: FREE
excerpt: Milvus Lite 是什么、怎么安装使用、Windows 能不能装？按 Milvus 官方文档讲清它的定位、支持的系统、pymilvus 安装命令、用一个本地 .db 文件建库、建集合、插入、带过滤的搜索、查询与删除，以及只支持 FLAT 索引等限制和迁移到正式版的命令。
checkedOn: 2026-10-11
sources:
  - https://milvus.io/docs/milvus_lite.md
verify:
  - 官方页面列出的支持平台只有 Ubuntu 20.04 及以上和 macOS 11.0 及以上，没有列 Windows
  - 官方页面没有写最低 Python 版本，以 pymilvus 的说明为准
  - 示例用的是随机向量，只为演示接口，实际使用要换成嵌入模型算出的向量
---

> 本文根据 Milvus 官方文档《Run Milvus Lite Locally》整理，资料核对于 2026-10-11。文中代码取自官方页面，没有在本机运行验证。

## 适用于谁

- 搜「milvus lite 安装」「milvus lite 使用」「milvus lite 是什么」「milvus lite windows」的人；
- 想在笔记本或 Notebook 里试试 Milvus，又不想先装 Docker 的人；
- 做 RAG 原型，希望以后能平滑迁到正式的 Milvus 集群的人。

## 结论先说

1. **Milvus Lite 是开源向量数据库 Milvus 的轻量版**，可以直接导入到 Python 程序里，提供核心的向量搜索功能，数据存在一个本地文件里。
2. **它包含在 `pymilvus` 里**：`pip install -U pymilvus[milvus-lite]`。
3. **官方列出的支持平台是 Ubuntu 20.04 及以上、macOS 11.0 及以上**，没有列 Windows。Windows 用户要另想办法（见常见问题）。
4. **只适合小规模**。只支持 FLAT 索引，不支持分区、用户与角色等功能。
5. **接口和正式版一致**。官方说明各种部署形态共用同一套 API，所以在 Lite 上写的代码可以搬到 Standalone、Distributed 或托管服务上。

## 一、Milvus 的几种形态

| 形态 | 官方的定位 |
| --- | --- |
| Milvus Lite | Notebook、笔记本电脑、边缘设备；小规模 |
| Milvus Standalone | 单节点部署，比如跑在一个 Docker 容器里 |
| Milvus Distributed | 大规模，部署在 Kubernetes 集群上 |
| Zilliz Cloud | 全托管的 Milvus |

Lite 的用途就是让你不搭任何服务就能开始写代码。

## 二、安装

```bash
pip install -U pymilvus[milvus-lite]
```

也可以单独安装：`pip install -U milvus-lite`。

在 zsh 这类会解释方括号的终端里，给包名加上引号：`pip install -U "pymilvus[milvus-lite]"`。

支持的平台（官方页面所列）：

- Ubuntu 20.04 及以上，x86_64 和 arm64；
- macOS 11.0 及以上，Apple Silicon 和 x86_64。

## 三、连接：一个本地文件就是一个数据库

```python
from pymilvus import MilvusClient

client = MilvusClient("./milvus_demo.db")
```

给 `MilvusClient` 传一个本地文件路径，就会在当前目录创建 `milvus_demo.db` 这个数据库文件，所有数据都在里面。

## 四、建集合、插入、搜索

官方的完整示例：

```python
from pymilvus import MilvusClient
import numpy as np

client = MilvusClient("./milvus_demo.db")
client.create_collection(
    collection_name="demo_collection",
    dimension=384  # The vectors we will use in this demo has 384 dimensions
)

# Text strings to search from.
docs = [
    "Artificial intelligence was founded as an academic discipline in 1956.",
    "Alan Turing was the first person to conduct substantial research in AI.",
    "Born in Maida Vale, London, Turing was raised in southern England.",
]
# For illustration, here we use fake vectors with random numbers (384 dimension).

vectors = [[ np.random.uniform(-1, 1) for _ in range(384) ] for _ in range(len(docs)) ]
data = [ {"id": i, "vector": vectors[i], "text": docs[i], "subject": "history"} for i in range(len(vectors)) ]
res = client.insert(
    collection_name="demo_collection",
    data=data
)

# This will exclude any text in "history" subject despite close to the query vector.
res = client.search(
    collection_name="demo_collection",
    data=[vectors[0]],
    filter="subject == 'history'",
    limit=2,
    output_fields=["text", "subject"],
)
print(res)
```

逐步看：

- **`create_collection(..., dimension=384)`**：建一个集合，`dimension` 是向量的维度，**必须和你用的嵌入模型输出的维度一致**；
- **`data`**：每条记录是一个字典。`id` 和 `vector` 之外的字段（这里的 `text`、`subject`）可以随意加，之后可以用来过滤或作为结果返回；
- **`insert`**：写入数据；
- **`search`**：`data` 是查询向量的列表，`limit` 是返回条数，`filter` 是过滤条件，`output_fields` 指定结果里带回哪些字段。

注意官方示例里的向量是**随机数**，只为演示接口。实际使用时，文档和问题都要先经过同一个嵌入模型得到向量。

## 五、按条件查询和删除

不做向量搜索，只按条件取数据：

```python
res = client.query(
    collection_name="demo_collection",
    filter="subject == 'history'",
    output_fields=["text", "subject"],
)
print(res)
```

按条件删除：

```python
res = client.delete(
    collection_name="demo_collection",
    filter="subject == 'history'",
)
print(res)
```

`search` 和 `query` 的区别：前者按向量相似度排序返回最接近的几条，后者返回所有满足过滤条件的记录。

## 六、限制

官方页面列出的限制：

| 方面 | 限制 |
| --- | --- |
| 规模 | 只适合小规模向量搜索；大规模用 Standalone 或 Distributed |
| 索引 | 只支持 FLAT；指定其他索引类型也会被当作 FLAT |
| 一致性 | 只支持 Strong；其他设置也会被当作 Strong |
| 不支持的功能 | 分区、用户与角色、别名、重命名集合等 |

FLAT 是逐条比较的精确搜索，数据量小时没问题，数据量大了会慢。这也是它「只适合小规模」的原因。

## 七、迁移到正式版

数据量上来之后，把 Lite 里的数据导出，再导入正式的 Milvus。官方给的命令：

```bash
pip install -U "pymilvus[bulk_writer]"
milvus-lite dump -d ./milvus_demo.db -c demo_collection -p ./data_dir
```

导出的文件可以通过 Bulk Insert 导入 Milvus，或者通过 Data Import 导入 Zilliz Cloud。

应用代码这一侧，因为 API 相同，主要改动是创建客户端时把本地文件路径换成服务地址。

## 常见问题

**Q：Windows 上能装吗？**
官方页面的支持平台列表里没有 Windows。在 Windows 上想用，可以在 WSL 的 Ubuntu 里按上面的步骤操作，或者用 Docker 运行 Milvus Standalone；具体以官方文档为准。只是想要一个在 Windows 上能直接 pip 安装的本地向量库，可以看[《ChromaDB 是什么》](/guides/chromadb-vector-database-quickstart)。

**Q：报错提示本地数据库连接需要 Milvus Lite？**
说明装的 `pymilvus` 不含 Lite 组件。按上面的命令带上 `milvus-lite` 附加项重新安装，并确认系统在支持列表里。

**Q：维度填多少？**
由嵌入模型决定，查你所用模型的文档。建集合时填错，插入时就会因维度不符而失败。

**Q：和 pgvector 怎么选？**
数据本来就在 PostgreSQL 里、想少维护一个系统，看[《pgvector 是什么》](/guides/pgvector-postgres-vector-install-usage)。预计向量规模很大、需要专门的向量数据库，从 Milvus Lite 起步，之后可以原样迁到集群。

## 参考资料

- Run Milvus Lite Locally（Milvus 官方文档）：https://milvus.io/docs/milvus_lite.md
