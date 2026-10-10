---
title: ChromaDB 是什么、怎么用：安装、建集合、写入与查询（Python 快速上手）
slug: chromadb-vector-database-quickstart
products: [ai-tools]
models: []
topics: [ai-agent]
accountTier: FREE
excerpt: ChromaDB 是什么、怎么安装和使用？按 Chroma 官方文档讲清它的定位、pip 安装、内存客户端与持久化的区别、创建集合、add 与 upsert 写入文档、query 查询与返回结果的结构、按元数据过滤，以及拿它做 RAG 检索时的几个注意点。
checkedOn: 2026-10-11
sources:
  - https://docs.trychroma.com/docs/overview/getting-started
  - https://github.com/chroma-core/chroma
verify:
  - 官方入门页和 README 都没有写默认使用哪个嵌入模型，本文未写具体名称，以官方 Embedding Functions 文档为准
  - 持久化客户端的具体写法官方入门页只给了指引没有给代码，本文未写代码
  - Chroma Cloud 的赠送额度（5 美元）为官方页面 2026-10-11 所列，以官网为准
---

> 本文根据 Chroma 官方文档《Getting Started》和官方仓库 README 整理，资料核对于 2026-10-11。文中代码取自官方页面，没有在本机运行验证。

## 适用于谁

- 搜「chromadb 是什么」「chromadb 安装」「chromadb 教程」「chromadb python」的人；
- 想给大模型加一个「先检索资料再回答」的环节，需要一个最简单的向量库来起步的人；
- 在 Dify 之类的平台上用过知识库，想弄明白底下那一层在做什么的人。

## 结论先说

1. **Chroma 是一个开源的向量数据库**（官方现在的说法是面向 AI 的开源数据基础设施），Apache 2.0 许可。
2. **`pip install chromadb` 之后几行代码就能用**，不需要单独启动服务。
3. **你给文本，它负责向量化和索引**。官方说明：分词、嵌入、索引都自动处理；也可以跳过这一步，传入你自己算好的向量。
4. **`chromadb.Client()` 是内存客户端，程序结束数据就没了**。要保存数据，用持久化客户端或者客户端-服务器模式。
5. **查询返回的是「列表的列表」**，因为可以一次查多个问题。

## 一、向量数据库是干什么的

把一段文字交给嵌入模型，会得到一串数字（向量）。意思相近的文字，向量也相近。向量数据库做两件事：把文档和它们的向量存起来；给一个问题，找出向量最接近的几段文档。

这就是 RAG（检索增强生成）里「检索」那一步：先从你的资料里找出相关片段，再把片段连同问题一起交给大模型。分段和检索参数怎么影响效果，可以对照[《Dify 知识库搭建教程》](/guides/dify-knowledge-base-chunking-retrieval)里的说明，原理是相通的。

## 二、安装

```bash
pip install chromadb
```

官方还列了 Poetry（`poetry add chromadb`）和 uv（`uv pip install chromadb`）的写法。JavaScript 客户端是 `npm install chromadb`。

## 三、创建客户端和集合

```python
import chromadb
chroma_client = chromadb.Client()
```

这是**内存客户端**，适合试验，程序结束后数据不保留。

集合（collection）相当于一张表，用来放一组文档：

```python
collection = chroma_client.create_collection(name="my_collection")
```

脚本会反复运行时，用下面这个，避免每次都新建：

```python
collection = chroma_client.get_or_create_collection(name="my_collection")
```

## 四、写入文档

```python
collection.add(
    ids=["id1", "id2"],
    documents=[
        "This is a document about pineapple",
        "This is a document about oranges"
    ]
)
```

- `documents`：原文。Chroma 会保存文本，并自动完成嵌入和索引；
- `ids`：每条文档一个**唯一的字符串 ID**，必须自己提供。

还可以带上元数据，README 的例子：

```python
collection.add(
    documents=["This is document1", "This is document2"],
    metadatas=[{"source": "notion"}, {"source": "google-docs"}],
    ids=["doc1", "doc2"],
)
```

元数据用来记录来源、日期、类别等信息，之后可以按它过滤。

**add 还是 upsert**：官方建议把 `add` 换成 `upsert`，这样同一个脚本重复运行时，不会把同样的文档反复添加：

```python
collection.upsert(
    documents=[
        "This is a document about pineapple",
        "This is a document about oranges"
    ],
    ids=["id1", "id2"]
)
```

## 五、查询

```python
results = collection.query(
    query_texts=["This is a query document about hawaii"], # Chroma will embed this for you
    n_results=2 # how many results to return
)
print(results)
```

- `query_texts`：一个列表，可以同时放多个问题，Chroma 会替你把它们向量化；
- `n_results`：每个问题返回几条。官方说明不写时默认返回 10 条。

**返回结果的结构**是一个字典，主要的键：

| 键 | 内容 |
| --- | --- |
| `ids` | 命中文档的 ID，形如 `[['id1', 'id2']]` |
| `documents` | 命中的原文 |
| `distances` | 距离，数值越小越相似 |
| `metadatas` | 元数据，没有添加元数据时为 `None` |

每个值都是「列表的列表」：外层对应每个问题，内层是该问题的结果。只查了一个问题时，取 `results["documents"][0]`。

**过滤**（README 的注释里给出的两个可选参数）：

- `where={"metadata_field": "is_equal_to_this"}`：按元数据过滤；
- `where_document={"$contains":"search_string"}`：按文档内容是否包含某段文字过滤。

另外可以用 `.get` 按 ID 直接取文档。

## 六、保存数据

内存客户端不保留数据。两条路：

- **持久化客户端**：把数据存到本地磁盘，官方入门页指向了专门的文档；
- **客户端-服务器模式**：单独运行一个 Chroma 服务，应用通过网络连接。README 给的启动命令：

```bash
chroma run --path /chroma_db_path
```

官方还有托管的 Chroma Cloud，提供无服务器的向量、混合和全文检索，页面上写新用户有 5 美元的免费额度（2026-10-11 核对，以官网为准）。

## 七、拿来做 RAG 时的注意点

- **写入和查询必须用同一个嵌入模型**。换了模型，原来存的向量就对不上了，需要重建；
- **默认的嵌入模型未必适合中文**。官方入门页没有写默认用的是哪个模型；处理中文资料时，查一下官方的 Embedding Functions 文档，选一个支持中文的模型，或者自己算好向量再传入；
- **先分段再写入**。一整篇长文档作为一条写入，检索出来的也是一整篇，既不准也浪费上下文。按段落或小节切开，每段一条；
- **ID 要稳定**。用「文档路径 + 段落序号」这类可以重复生成的 ID，配合 `upsert`，更新文档时才不会产生重复；
- **元数据提前设计**。来源、更新时间、权限范围，之后过滤时都用得上。

## 常见问题

**Q：需要 GPU 吗？**
官方入门页没有提硬件要求。数据量不大时在普通电脑上就能试；嵌入模型的计算量取决于你选的模型。

**Q：和 Milvus、pgvector 怎么选？**
Chroma 上手最简单，适合原型和中小规模；已经在用 PostgreSQL 的看[《pgvector 是什么》](/guides/pgvector-postgres-vector-install-usage)；预计数据量很大、之后要上集群的看[《Milvus Lite 使用教程》](/guides/milvus-lite-local-vector-database-quickstart)。

**Q：可以完全离线用吗？**
数据库本身在本地运行。自动嵌入需要用到嵌入模型，模型从哪里获取、是否需要联网，以官方 Embedding Functions 文档为准。

**Q：结果不准怎么办？**
先看检索出来的片段对不对。片段不对，调分段方式或换嵌入模型；片段对但回答不对，问题在提示词或模型。

## 参考资料

- Getting Started（Chroma 官方文档）：https://docs.trychroma.com/docs/overview/getting-started
- chroma-core/chroma（官方仓库）：https://github.com/chroma-core/chroma
